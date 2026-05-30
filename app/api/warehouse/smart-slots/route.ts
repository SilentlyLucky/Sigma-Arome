/**
 * GET /api/warehouse/smart-slots?batch_id=...
 *
 * Returns three sections of storage locations for a given batch:
 *   1. compatible        — empty or same-material locations that meet all requirements
 *   2. different_material — compatible by all rules but holds a DIFFERENT material (hard block)
 *   3. incompatible      — wrong zone, wrong temp, hazard not allowed, hazard conflict, or full
 *
 * Hazard system (single source of truth: `hazard_classes` collection):
 *   - Every raw_material has a `hazard_class_id` FK → hazard_classes
 *   - Every warehouse_location has `allowed_hazard_classes` (array of hazard_class IDs)
 *   - Every hazard_class has `unsuitable_with` (array of hazard_class IDs that cannot be co-located)
 *
 * Hazard checks performed:
 *   A) Allowed list — batch hazard must be in location.allowed_hazard_classes
 *   B) Co-location — if location holds another material, that material's hazard must NOT be
 *      in batch hazard's unsuitable_with list (and vice versa)
 *
 * Zone routing:
 *   - packaging category → packaging_components zones only (capacity in pcs)
 *   - liquid/solid/powder → raw_material or cold_storage zones (capacity in kg)
 *
 * Single-material rule: one material type per location at all times.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders, getDaaSUrl } from '@/lib/api/auth-headers';

interface Location {
  id: string;
  location_code: string;
  zone: string;
  temperature_class: string | null;
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
}

interface HazardClass {
  id: string;
  name: string;
  code: string | null;
  unsuitable_with: string[] | null;
}

/** Determine if a material category is packaging (uses pcs, packaging_components zone) */
function isPackagingCategory(category: string | null): boolean {
  return category === 'packaging';
}

/** Determine valid storage zones for a material category */
function validZonesForCategory(category: string | null): string[] {
  if (isPackagingCategory(category)) return ['packaging_components'];
  return ['raw_material', 'cold_storage'];
}

export interface SlotResult {
  compatible: Array<Location & {
    occupancy_pct: number;
    available_qty: number;
    capacity_unit: string;
    slot_state: 'empty' | 'same_material';
    reason: string;
    is_recommended: boolean;
  }>;
  different_material: Array<Location & { block_reason: string }>;
  incompatible: Array<Location & { incompatibility_reason: string }>;
  batch: Batch;
  is_packaging: boolean;
}

export async function GET(request: NextRequest) {
  const batchId = request.nextUrl.searchParams.get('batch_id');
  if (!batchId) {
    return NextResponse.json({ error: 'batch_id is required' }, { status: 400 });
  }

  const daasUrl = getDaaSUrl();
  const headers = await getAuthHeaders();

  try {
    // Fetch batch details
    const batchRes = await fetch(
      `${daasUrl}/api/items/batches/${batchId}` +
      `?fields[]=id&fields[]=batch_number&fields[]=material_id` +
      `&fields[]=required_temperature_class` +
      `&fields[]=weight_kg&fields[]=qty&fields[]=unit&fields[]=status`,
      { headers, cache: 'no-store' }
    );
    if (!batchRes.ok) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    const batch: Batch = (await batchRes.json()).data;

    // Fetch material to determine category + hazard
    let material: Material | null = null;
    if (batch.material_id) {
      const matRes = await fetch(
        `${daasUrl}/api/items/raw_materials/${batch.material_id}` +
        `?fields[]=id&fields[]=name&fields[]=category&fields[]=unit&fields[]=hazard_class_id`,
        { headers, cache: 'no-store' }
      );
      if (matRes.ok) material = (await matRes.json()).data;
    }

    const matCategory = material?.category ?? null;
    const isPackaging = isPackagingCategory(matCategory);
    const validZones = validZonesForCategory(matCategory);
    const batchHazardId = material?.hazard_class_id ?? null;

    // Fetch hazard classes (single source of truth) to resolve names + unsuitable_with rules
    const hazRes = await fetch(
      `${daasUrl}/api/items/hazard_classes` +
      `?fields[]=id&fields[]=name&fields[]=code&fields[]=unsuitable_with&limit=200`,
      { headers, cache: 'no-store' }
    );
    const hazards: HazardClass[] = hazRes.ok ? ((await hazRes.json()).data ?? []) : [];
    const hazardById = new Map(hazards.map((h) => [h.id, h]));
    const batchHazard = batchHazardId ? hazardById.get(batchHazardId) ?? null : null;

    // Fetch all active locations
    const locRes = await fetch(
      `${daasUrl}/api/items/warehouse_locations` +
      `?filter[is_active][_eq]=true` +
      `&fields[]=id&fields[]=location_code&fields[]=zone` +
      `&fields[]=temperature_class` +
      `&fields[]=allowed_hazard_classes&fields[]=capacity_kg&fields[]=current_occupancy_kg` +
      `&fields[]=capacity_pcs&fields[]=current_occupancy_pcs` +
      `&fields[]=current_material_id&fields[]=current_material_name` +
      `&fields[]=is_active&fields[]=status&limit=200`,
      { headers, cache: 'no-store' }
    );
    if (!locRes.ok) return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
    const locations: Location[] = (await locRes.json()).data ?? [];

    // For co-location hazard checks we need the hazard of any material currently occupying a location.
    // Collect those material IDs and resolve their hazard_class_id in one batch fetch.
    const occupyingMaterialIds = Array.from(
      new Set(
        locations
          .map((l) => l.current_material_id)
          .filter((id): id is string => !!id && id !== batch.material_id)
      )
    );
    const occupyingMaterialHazard = new Map<string, string | null>();
    if (occupyingMaterialIds.length > 0) {
      const ids = occupyingMaterialIds.map(encodeURIComponent).join(',');
      const omRes = await fetch(
        `${daasUrl}/api/items/raw_materials?filter[id][_in]=${ids}` +
        `&fields[]=id&fields[]=hazard_class_id&limit=200`,
        { headers, cache: 'no-store' }
      );
      if (omRes.ok) {
        const list: Array<{ id: string; hazard_class_id: string | null }> = (await omRes.json()).data ?? [];
        for (const m of list) occupyingMaterialHazard.set(m.id, m.hazard_class_id);
      }
    }

    const batchWeight = batch.weight_kg ?? 0;
    const batchQty = batch.qty ?? 0;
    const batchTemp = batch.required_temperature_class ?? 'ambient';
    const batchMaterialId = batch.material_id ?? null;

    const compatible: SlotResult['compatible'] = [];
    const different_material: SlotResult['different_material'] = [];
    const incompatible: SlotResult['incompatible'] = [];

    for (const loc of locations) {
      // Skip receiving/quarantine and staging — never for permanent storage
      if (loc.zone === 'receiving_quarantine' || loc.zone === 'staging') {
        incompatible.push({
          ...loc,
          incompatibility_reason: 'Receiving/staging zones are not for permanent storage',
        });
        continue;
      }

      const hardReasons: string[] = [];

      // ── Zone check ──────────────────────────────────────────────────────────
      if (!validZones.includes(loc.zone)) {
        if (isPackaging) {
          hardReasons.push(`Packaging materials must go to Packaging Components zones, not "${loc.zone.replace(/_/g, ' ')}"`);
        } else if (loc.zone === 'packaging_components') {
          hardReasons.push('Packaging Components zones are reserved for packaging materials only');
        } else {
          hardReasons.push(`Zone "${loc.zone.replace(/_/g, ' ')}" is not designated for this material stage`);
        }
      }

      // ── Temperature check (not applicable to packaging zones) ───────────────
      if (!isPackaging) {
        const locTemp = loc.temperature_class ?? 'ambient';
        if (locTemp !== batchTemp) {
          hardReasons.push(`Requires ${batchTemp} storage, location is ${locTemp}`);
        }
      }

      // ── Hazard check A: allowed list (UUID-based) ───────────────────────────
      if (!isPackaging && batchHazardId) {
        const allowedHazards: string[] = Array.isArray(loc.allowed_hazard_classes)
          ? loc.allowed_hazard_classes
          : [];
        if (allowedHazards.length > 0 && !allowedHazards.includes(batchHazardId)) {
          const hazardName = batchHazard?.name ?? 'this hazard class';
          hardReasons.push(`${hazardName} is not in the allowed hazards for this location`);
        }
      }

      // ── Hazard check B: co-location with existing material (unsuitable_with) ─
      // Only fires when location currently holds a DIFFERENT material AND we have hazard data for both.
      const occupyingMatId = loc.current_material_id;
      if (
        !isPackaging &&
        occupyingMatId &&
        batchMaterialId &&
        occupyingMatId !== batchMaterialId &&
        batchHazard &&
        batchHazardId
      ) {
        const otherHazardId = occupyingMaterialHazard.get(occupyingMatId) ?? null;
        if (otherHazardId) {
          const otherHazard = hazardById.get(otherHazardId);
          const batchUnsuitable = Array.isArray(batchHazard.unsuitable_with) ? batchHazard.unsuitable_with : [];
          const otherUnsuitable = otherHazard && Array.isArray(otherHazard.unsuitable_with)
            ? otherHazard.unsuitable_with
            : [];
          if (batchUnsuitable.includes(otherHazardId) || otherUnsuitable.includes(batchHazardId)) {
            const otherName = otherHazard?.name ?? 'another hazardous material';
            hardReasons.push(`Cannot be co-located with ${otherName} (hazard incompatibility)`);
          }
        }
      }

      // ── Capacity check ──────────────────────────────────────────────────────
      let capacityUnit: string;
      let capacity: number;
      let occupancy: number;
      let batchNeed: number;

      if (isPackaging) {
        capacityUnit = 'pcs';
        capacity = loc.capacity_pcs ?? 0;
        occupancy = loc.current_occupancy_pcs ?? 0;
        batchNeed = batchQty;
      } else {
        capacityUnit = 'kg';
        capacity = loc.capacity_kg ?? 0;
        occupancy = loc.current_occupancy_kg ?? 0;
        batchNeed = batchWeight;
      }

      const available = capacity > 0 ? capacity - occupancy : Infinity;
      if (capacity > 0 && batchNeed > available) {
        hardReasons.push(
          `At capacity — ${available.toLocaleString()} ${capacityUnit} available, batch needs ${batchNeed.toLocaleString()} ${capacityUnit}`
        );
      }

      if (hardReasons.length > 0) {
        incompatible.push({ ...loc, incompatibility_reason: hardReasons.join(' · ') });
        continue;
      }

      // ── Single-material rule ────────────────────────────────────────────────
      const locMaterialId = loc.current_material_id ?? null;
      const locIsEmpty = !locMaterialId;
      const locHasDifferentMaterial = locMaterialId && batchMaterialId && locMaterialId !== batchMaterialId;

      if (locHasDifferentMaterial) {
        different_material.push({
          ...loc,
          block_reason: `Contains ${loc.current_material_name ?? 'another material'} — single-material rule applies. Available after that material is cleared.`,
        });
        continue;
      }

      // ── Compatible ──────────────────────────────────────────────────────────
      const occupancy_pct = capacity > 0 ? Math.round((occupancy / capacity) * 100) : 0;
      const slot_state: 'empty' | 'same_material' = locIsEmpty ? 'empty' : 'same_material';

      const reasonParts: string[] = [];
      if (slot_state === 'same_material') {
        reasonParts.push('Same material — consolidate with existing stock');
      } else {
        reasonParts.push('Empty — ready for any compatible material');
      }
      if (!isPackaging && (loc.temperature_class ?? 'ambient') !== 'ambient') {
        reasonParts.push(`${loc.temperature_class} storage`);
      }
      const availableDisplay = available === Infinity ? '∞' : available.toLocaleString();
      reasonParts.push(`${occupancy_pct}% occupied · ${availableDisplay} ${capacityUnit} free`);

      compatible.push({
        ...loc,
        occupancy_pct,
        available_qty: available === Infinity ? 0 : available,
        capacity_unit: capacityUnit,
        slot_state,
        reason: reasonParts.join(' · '),
        is_recommended: false,
      });
    }

    // Sort: same-material first, then highest occupancy, then alphabetical
    compatible.sort((a, b) => {
      if (a.slot_state !== b.slot_state) return a.slot_state === 'same_material' ? -1 : 1;
      if (b.occupancy_pct !== a.occupancy_pct) return b.occupancy_pct - a.occupancy_pct;
      return a.location_code.localeCompare(b.location_code);
    });

    if (compatible.length > 0) compatible[0].is_recommended = true;

    return NextResponse.json({ compatible, different_material, incompatible, batch, is_packaging: isPackaging });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
