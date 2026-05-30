/**
 * GET /api/warehouse/smart-slots?batch_id=...
 *
 * Returns three sections of storage locations for a given batch:
 *   1. compatible   — empty or same-material locations that meet all requirements
 *   2. different_material — compatible by temp/hazard/zone but occupied by a different material
 *   3. incompatible — wrong temp, wrong hazard, wrong zone, or full
 *
 * Single-material rule: a location can only hold ONE material type at a time.
 * "Compatible but different material" is a hard constraint, not an override.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders, getDaaSUrl } from '@/lib/api/auth-headers';

interface Location {
  id: string;
  location_code: string;
  zone: string;
  temperature_class: string | null;
  temperature_min_c: number | null;
  temperature_max_c: number | null;
  allowed_hazard_classes: string[] | null;
  capacity_kg: number | null;
  current_occupancy_kg: number;
  current_material_id: string | null;
  current_material_name: string | null;
  is_active: boolean;
  status: string;
}

interface Batch {
  id: string;
  batch_number: string;
  material_id: string | null;
  required_temperature_class: string | null;
  hazard_class: string | null;
  weight_kg: number | null;
  status: string;
}

export interface SlotResult {
  /** Empty or same-material locations that pass all checks — show these, ranked */
  compatible: Array<Location & {
    occupancy_pct: number;
    available_kg: number;
    slot_state: 'empty' | 'same_material';
    reason: string;
    is_recommended: boolean;
  }>;
  /** Locations that pass temp/hazard/zone/capacity but hold a DIFFERENT material — hard block */
  different_material: Array<Location & {
    block_reason: string;
  }>;
  /** Everything else — wrong temp, wrong hazard, wrong zone, full */
  incompatible: Array<Location & {
    incompatibility_reason: string;
  }>;
  batch: Batch;
}

export async function GET(request: NextRequest) {
  const batchId = request.nextUrl.searchParams.get('batch_id');
  if (!batchId) {
    return NextResponse.json({ error: 'batch_id is required' }, { status: 400 });
  }

  const daasUrl = getDaaSUrl();
  const headers = await getAuthHeaders();

  try {
    // Fetch batch details including material_id for single-material rule
    const batchRes = await fetch(
      `${daasUrl}/api/items/batches/${batchId}?fields[]=id&fields[]=batch_number&fields[]=material_id&fields[]=required_temperature_class&fields[]=hazard_class&fields[]=weight_kg&fields[]=status`,
      { headers, cache: 'no-store' }
    );
    if (!batchRes.ok) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    const batch: Batch = (await batchRes.json()).data;

    // Fetch all active locations with the new fields
    const locRes = await fetch(
      `${daasUrl}/api/items/warehouse_locations` +
      `?filter[is_active][_eq]=true` +
      `&fields[]=id&fields[]=location_code&fields[]=zone` +
      `&fields[]=temperature_class&fields[]=temperature_min_c&fields[]=temperature_max_c` +
      `&fields[]=allowed_hazard_classes&fields[]=capacity_kg&fields[]=current_occupancy_kg` +
      `&fields[]=current_material_id&fields[]=current_material_name` +
      `&fields[]=is_active&fields[]=status&limit=200`,
      { headers, cache: 'no-store' }
    );
    if (!locRes.ok) return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
    const locations: Location[] = (await locRes.json()).data ?? [];

    const batchWeight = batch.weight_kg ?? 0;
    const batchHazard = batch.hazard_class ?? 'general';
    const batchTemp = batch.required_temperature_class ?? 'ambient';
    const batchMaterialId = batch.material_id ?? null;

    // Valid zones for QC-approved raw material batches
    const validZones = ['raw_material', 'cold_storage'];

    const compatible: SlotResult['compatible'] = [];
    const different_material: SlotResult['different_material'] = [];
    const incompatible: SlotResult['incompatible'] = [];

    for (const loc of locations) {
      // Always skip receiving/quarantine and staging for permanent storage
      if (loc.zone === 'receiving_quarantine' || loc.zone === 'staging') {
        incompatible.push({
          ...loc,
          incompatibility_reason: 'Receiving/staging zones are not for permanent storage',
        });
        continue;
      }

      const capacityKg = loc.capacity_kg ?? 0;
      const occupancyKg = loc.current_occupancy_kg ?? 0;
      const availableKg = capacityKg > 0 ? capacityKg - occupancyKg : Infinity;
      const locTemp = loc.temperature_class ?? 'ambient';
      const allowedHazards: string[] = Array.isArray(loc.allowed_hazard_classes)
        ? loc.allowed_hazard_classes
        : [];

      // ── Collect hard incompatibilities (temp, hazard, zone, capacity) ──
      const hardReasons: string[] = [];

      if (!validZones.includes(loc.zone)) {
        hardReasons.push(`Zone "${loc.zone.replace(/_/g, ' ')}" is not designated for this material stage`);
      }
      if (locTemp !== batchTemp) {
        hardReasons.push(`Requires ${batchTemp} storage, location is ${locTemp}`);
      }
      if (allowedHazards.length > 0 && !allowedHazards.includes(batchHazard)) {
        hardReasons.push(`Material not permitted in this zone (${batchHazard.replace(/_/g, ' ')} not in allowed list)`);
      }
      if (capacityKg > 0 && batchWeight > availableKg) {
        hardReasons.push(`At capacity — ${availableKg.toFixed(0)}kg available, batch needs ${batchWeight}kg`);
      }

      if (hardReasons.length > 0) {
        incompatible.push({ ...loc, incompatibility_reason: hardReasons.join(' · ') });
        continue;
      }

      // ── Single-material rule check ──────────────────────────────────────────
      const locMaterialId = loc.current_material_id ?? null;
      const locIsEmpty = !locMaterialId;
      const locHasSameMaterial = locMaterialId && batchMaterialId && locMaterialId === batchMaterialId;
      const locHasDifferentMaterial = locMaterialId && batchMaterialId && locMaterialId !== batchMaterialId;

      if (locHasDifferentMaterial) {
        // Hard block — single-material rule, cannot override
        different_material.push({
          ...loc,
          block_reason: `Contains ${loc.current_material_name ?? 'another material'} — single-material rule applies. Available after that material is cleared.`,
        });
        continue;
      }

      // ── Compatible: empty or same material ─────────────────────────────────
      const occupancy_pct = capacityKg > 0 ? Math.round((occupancyKg / capacityKg) * 100) : 0;
      const slot_state: 'empty' | 'same_material' = locIsEmpty ? 'empty' : 'same_material';

      const reasonParts: string[] = [];
      if (slot_state === 'same_material') {
        reasonParts.push(`Same material — consolidate with existing stock`);
      } else {
        reasonParts.push('Empty — ready for any compatible material');
      }
      if (locTemp !== 'ambient') reasonParts.push(`${locTemp} storage`);
      reasonParts.push(`${occupancy_pct}% occupied · ${availableKg.toFixed(0)}kg free`);

      compatible.push({
        ...loc,
        occupancy_pct,
        available_kg: availableKg === Infinity ? 0 : availableKg,
        slot_state,
        reason: reasonParts.join(' · '),
        is_recommended: false,
      });
    }

    // Sort compatible:
    // 1. Same-material locations first (consolidation preference)
    // 2. Within same-material: highest occupancy first (fill before opening new)
    // 3. Empty locations: highest occupancy first (fill existing zones before opening new)
    // 4. Alphabetical as tiebreaker
    compatible.sort((a, b) => {
      if (a.slot_state !== b.slot_state) {
        return a.slot_state === 'same_material' ? -1 : 1;
      }
      if (b.occupancy_pct !== a.occupancy_pct) return b.occupancy_pct - a.occupancy_pct;
      return a.location_code.localeCompare(b.location_code);
    });

    if (compatible.length > 0) compatible[0].is_recommended = true;

    return NextResponse.json({ compatible, different_material, incompatible, batch });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
