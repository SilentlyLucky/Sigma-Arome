/**
 * GET /api/warehouse/smart-slots?batch_id=...[&limit=3]
 *
 * Rule-based auto-slotting engine (NO LLM).
 *
 * Mirrors the DaaS custom service `slotting_engine` so the UI can request live,
 * scored recommendations on demand (Auto Slotting tab + Putaway screen).
 *
 * Scoring weights:
 *   Temperature Match = 40%   Hazard Match = 30%   Capacity Fit = 15%   Occupancy = 15%
 *
 * Hard elimination (location dropped entirely):
 *   - wrong zone for material stage
 *   - temperature range incompatible
 *   - hazard class not permitted / hazard co-location conflict
 *   - capacity insufficient
 *   - holds a different material (single-material rule)
 *
 * Returns Top-N scored candidates with persisted-style reasoning + the
 * eliminated list (for transparency / audit).
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders, getDaaSUrl } from '@/lib/api/auth-headers';

const WEIGHTS = { temperature: 0.4, hazard: 0.3, capacity: 0.15, occupancy: 0.15 } as const;

interface Location {
  id: string;
  location_code: string;
  zone: string;
  temperature_class: string | null;
  temperature_min: number | null;
  temperature_max: number | null;
  allowed_hazard_classes: string[] | null;
  capacity_kg: number | null;
  current_occupancy_kg: number;
  capacity_pcs: number | null;
  current_occupancy_pcs: number;
  current_material_id: string | null;
  current_material_name: string | null;
  is_active: boolean;
  status: string;
}

interface Batch {
  id: string;
  batch_number: string;
  material_id: string | null;
  batch_type: string | null;
  required_temperature_class: string | null;
  weight_kg: number | null;
  qty: number | null;
  unit: string | null;
  status: string;
}

interface Material {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  hazard_class_id: string | null;
  storage_temp_min: number | null;
  storage_temp_max: number | null;
  required_temperature_class: string | null;
}

interface HazardClass {
  id: string;
  name: string;
  code: string | null;
  unsuitable_with: string[] | null;
}

export interface Candidate {
  location_id: string;
  location_code: string;
  zone: string;
  rank: number;
  score: number;
  temperature_score: number;
  hazard_score: number;
  capacity_score: number;
  occupancy_score: number;
  occupancy_after_pct: number;
  available_after: number | null;
  capacity_unit: string;
  slot_state: 'empty' | 'same_material';
  is_recommended: boolean;
  reasoning: string;
}

export interface Eliminated {
  location_id: string;
  location_code: string;
  zone: string;
  reason: string;
}

function rangesOverlap(aMin: number, aMax: number, bMin: number, bMax: number) {
  return aMin <= bMax && bMin <= aMax;
}
function clamp01(n: number) {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

export async function GET(request: NextRequest) {
  const batchId = request.nextUrl.searchParams.get('batch_id');
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? '3') || 3;
  if (!batchId) {
    return NextResponse.json({ error: 'batch_id is required' }, { status: 400 });
  }

  const daasUrl = getDaaSUrl();
  const headers = await getAuthHeaders();

  try {
    // ── Batch ──
    const batchRes = await fetch(
      `${daasUrl}/api/items/batches/${batchId}` +
        `?fields[]=id&fields[]=batch_number&fields[]=material_id&fields[]=batch_type` +
        `&fields[]=required_temperature_class&fields[]=weight_kg&fields[]=qty&fields[]=unit&fields[]=status`,
      { headers, cache: 'no-store' }
    );
    if (!batchRes.ok) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    const batch: Batch = (await batchRes.json()).data;

    // ── Material ──
    let material: Material | null = null;
    if (batch.material_id) {
      const matRes = await fetch(
        `${daasUrl}/api/items/raw_materials/${batch.material_id}` +
          `?fields[]=id&fields[]=name&fields[]=category&fields[]=unit&fields[]=hazard_class_id` +
          `&fields[]=storage_temp_min&fields[]=storage_temp_max&fields[]=required_temperature_class`,
        { headers, cache: 'no-store' }
      );
      if (matRes.ok) material = (await matRes.json()).data;
    }

    const category = material?.category ?? null;
    const isPackaging = category === 'packaging';
    const isFinishedGoods = batch.batch_type === 'finished_product';

    const validZones: string[] = isPackaging
      ? ['packaging_components']
      : isFinishedGoods
        ? ['finished_goods']
        : ['raw_material', 'cold_storage'];

    // Material temperature band
    let matTempMin = material?.storage_temp_min ?? null;
    let matTempMax = material?.storage_temp_max ?? null;
    const reqClass =
      batch.required_temperature_class ?? material?.required_temperature_class ?? 'ambient';
    if (matTempMin == null || matTempMax == null) {
      if (reqClass === 'cold') {
        matTempMin = 2;
        matTempMax = 8;
      } else {
        matTempMin = 15;
        matTempMax = 30;
      }
    }

    const batchHazardId = material?.hazard_class_id ?? null;

    // ── Hazard classes ──
    const hazRes = await fetch(
      `${daasUrl}/api/items/hazard_classes?fields[]=id&fields[]=name&fields[]=code&fields[]=unsuitable_with&limit=200`,
      { headers, cache: 'no-store' }
    );
    const hazards: HazardClass[] = hazRes.ok ? ((await hazRes.json()).data ?? []) : [];
    const hazardById = new Map(hazards.map((h) => [h.id, h]));
    const batchHazard = batchHazardId ? hazardById.get(batchHazardId) ?? null : null;

    // ── Active locations ──
    const locRes = await fetch(
      `${daasUrl}/api/items/warehouse_locations` +
        `?filter[is_active][_eq]=true` +
        `&fields[]=id&fields[]=location_code&fields[]=zone&fields[]=temperature_class` +
        `&fields[]=temperature_min&fields[]=temperature_max` +
        `&fields[]=allowed_hazard_classes&fields[]=capacity_kg&fields[]=current_occupancy_kg` +
        `&fields[]=capacity_pcs&fields[]=current_occupancy_pcs` +
        `&fields[]=current_material_id&fields[]=current_material_name` +
        `&fields[]=is_active&fields[]=status&limit=500`,
      { headers, cache: 'no-store' }
    );
    if (!locRes.ok) return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
    const locations: Location[] = (await locRes.json()).data ?? [];

    // ── Resolve hazards of materials occupying locations (co-location check) ──
    const occMatIds = Array.from(
      new Set(
        locations
          .map((l) => l.current_material_id)
          .filter((id): id is string => !!id && id !== batch.material_id)
      )
    );
    const occMatHazard = new Map<string, string | null>();
    if (occMatIds.length > 0) {
      const ids = occMatIds.map(encodeURIComponent).join(',');
      const omRes = await fetch(
        `${daasUrl}/api/items/raw_materials?filter[id][_in]=${ids}&fields[]=id&fields[]=hazard_class_id&limit=200`,
        { headers, cache: 'no-store' }
      );
      if (omRes.ok) {
        const list: Array<{ id: string; hazard_class_id: string | null }> =
          (await omRes.json()).data ?? [];
        for (const m of list) occMatHazard.set(m.id, m.hazard_class_id);
      }
    }

    const batchWeight = batch.weight_kg ?? 0;
    const batchQty = batch.qty ?? 0;
    const need = isPackaging ? batchQty : batchWeight;
    const unitLabel = isPackaging ? 'pcs' : 'kg';

    const candidates: Candidate[] = [];
    const eliminated: Eliminated[] = [];

    for (const loc of locations) {
      if (loc.zone === 'receiving_quarantine' || loc.zone === 'staging') continue;

      const reasons: string[] = [];

      // Zone gate
      if (!validZones.includes(loc.zone)) {
        eliminated.push({
          location_id: loc.id,
          location_code: loc.location_code,
          zone: loc.zone,
          reason: `Zone "${loc.zone.replace(/_/g, ' ')}" not valid for this material stage`,
        });
        continue;
      }

      // Temperature
      let tempScore = 1;
      if (!isPackaging) {
        const bMin = loc.temperature_min ?? (loc.temperature_class === 'cold' ? 2 : 15);
        const bMax = loc.temperature_max ?? (loc.temperature_class === 'cold' ? 8 : 30);
        if (!rangesOverlap(matTempMin, matTempMax, bMin, bMax)) {
          eliminated.push({
            location_id: loc.id,
            location_code: loc.location_code,
            zone: loc.zone,
            reason: `Temperature incompatible — material needs ${matTempMin}–${matTempMax}°C, bin is ${bMin}–${bMax}°C`,
          });
          continue;
        }
        const overlap = Math.min(matTempMax, bMax) - Math.max(matTempMin, bMin);
        const matWidth = Math.max(0.0001, matTempMax - matTempMin);
        tempScore = clamp01(overlap / matWidth);
        reasons.push(`Temperature compatible (${bMin}–${bMax}°C)`);
      } else {
        reasons.push('Packaging — ambient, temperature not constrained');
      }

      // Hazard
      let hazScore = 1;
      if (!isPackaging && batchHazardId) {
        const allowed = Array.isArray(loc.allowed_hazard_classes) ? loc.allowed_hazard_classes : [];
        if (allowed.length > 0 && !allowed.includes(batchHazardId)) {
          eliminated.push({
            location_id: loc.id,
            location_code: loc.location_code,
            zone: loc.zone,
            reason: `${batchHazard?.name ?? 'Hazard class'} not permitted in this bin`,
          });
          continue;
        }
        const occId = loc.current_material_id;
        if (occId && occId !== batch.material_id && batchHazard) {
          const otherHazId = occMatHazard.get(occId) ?? null;
          if (otherHazId) {
            const otherHaz = hazardById.get(otherHazId);
            const bUns = Array.isArray(batchHazard.unsuitable_with) ? batchHazard.unsuitable_with : [];
            const oUns =
              otherHaz && Array.isArray(otherHaz.unsuitable_with) ? otherHaz.unsuitable_with : [];
            if (bUns.includes(otherHazId) || oUns.includes(batchHazardId)) {
              eliminated.push({
                location_id: loc.id,
                location_code: loc.location_code,
                zone: loc.zone,
                reason: `Hazard co-location conflict with ${otherHaz?.name ?? 'existing material'}`,
              });
              continue;
            }
          }
        }
        hazScore = allowed.length > 0 ? 1 : 0.7;
        reasons.push(`Hazard class ${batchHazard?.name ?? ''} allowed`);
      }

      // Capacity
      const capacity = isPackaging ? loc.capacity_pcs ?? 0 : loc.capacity_kg ?? 0;
      const occupancy = isPackaging ? loc.current_occupancy_pcs ?? 0 : loc.current_occupancy_kg ?? 0;
      const available = capacity > 0 ? capacity - occupancy : Infinity;
      if (capacity > 0 && need > available) {
        eliminated.push({
          location_id: loc.id,
          location_code: loc.location_code,
          zone: loc.zone,
          reason: `Capacity insufficient — needs ${need} ${unitLabel}, only ${available} ${unitLabel} free`,
        });
        continue;
      }
      let capScore = 1;
      if (capacity > 0 && need > 0) capScore = clamp01(need / available);
      const availableDisplay = available === Infinity ? 'unlimited' : available.toLocaleString();
      reasons.push(`Available capacity sufficient (${availableDisplay} ${unitLabel} free)`);

      // Single-material rule
      const locMatId = loc.current_material_id;
      if (locMatId && batch.material_id && locMatId !== batch.material_id) {
        eliminated.push({
          location_id: loc.id,
          location_code: loc.location_code,
          zone: loc.zone,
          reason: `Holds ${loc.current_material_name ?? 'another material'} (single-material rule)`,
        });
        continue;
      }

      // Occupancy
      const occupancyAfter = capacity > 0 ? clamp01((occupancy + need) / capacity) : 0;
      const occScore = occupancyAfter;
      reasons.push(`Occupancy after putaway ${Math.round(occupancyAfter * 100)}%`);
      reasons.push(locMatId ? `Consolidate with existing ${loc.current_material_name ?? 'stock'}` : 'Empty compatible location');

      const score =
        Math.round(
          (WEIGHTS.temperature * tempScore +
            WEIGHTS.hazard * hazScore +
            WEIGHTS.capacity * capScore +
            WEIGHTS.occupancy * occScore) *
            1000
        ) / 10;

      candidates.push({
        location_id: loc.id,
        location_code: loc.location_code,
        zone: loc.zone,
        rank: 0,
        score,
        temperature_score: Math.round(tempScore * WEIGHTS.temperature * 1000) / 10,
        hazard_score: Math.round(hazScore * WEIGHTS.hazard * 1000) / 10,
        capacity_score: Math.round(capScore * WEIGHTS.capacity * 1000) / 10,
        occupancy_score: Math.round(occScore * WEIGHTS.occupancy * 1000) / 10,
        occupancy_after_pct: Math.round(occupancyAfter * 100),
        available_after: available === Infinity ? null : Math.round((available - need) * 1000) / 1000,
        capacity_unit: unitLabel,
        slot_state: locMatId ? 'same_material' : 'empty',
        is_recommended: false,
        reasoning: reasons.join(' · '),
      });
    }

    candidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.slot_state !== b.slot_state) return a.slot_state === 'same_material' ? -1 : 1;
      return a.location_code.localeCompare(b.location_code);
    });

    const top = candidates.slice(0, limit).map((c, i) => ({
      ...c,
      rank: i + 1,
      is_recommended: i === 0,
    }));

    return NextResponse.json({
      batch,
      material,
      is_packaging: isPackaging,
      weights: WEIGHTS,
      candidates: top,
      eliminated,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
