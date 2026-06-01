/**
 * useStagingLocations
 *
 * Lightweight hook returning all active staging-zone bins.
 * Used by the warehouse Stage Materials UI so the operator can pick
 * which staging bin a batch goes into.
 */
import { useEffect, useState } from 'react';

export interface StagingLocation {
  id: string;
  location_code: string;
  capacity_kg: number | null;
  current_occupancy_kg: number | null;
  capacity_pcs: number | null;
  current_occupancy_pcs: number | null;
}

export function useStagingLocations() {
  const [locations, setLocations] = useState<StagingLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(
      '/api/items/warehouse_locations' +
        '?filter[zone][_eq]=staging&filter[is_active][_eq]=true' +
        '&fields[]=id&fields[]=location_code&fields[]=capacity_kg&fields[]=current_occupancy_kg' +
        '&fields[]=capacity_pcs&fields[]=current_occupancy_pcs&limit=20'
    )
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => {
        if (!cancelled) setLocations(d?.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setLocations([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { locations, loading };
}
