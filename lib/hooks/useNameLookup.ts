'use client';

import { useEffect, useMemo, useState } from 'react';

const LOOKUP_LIMIT = 500;

type LookupRecord = Record<string, unknown>;

const lookupCache = new Map<string, Map<string, string>>();
const fullyLoadedLookups = new Set<string>();
const inFlightLookups = new Map<string, Promise<Map<string, string>>>();

function getLookupKey(collection: string, displayField: string) {
  return `${collection}:${displayField}`;
}

function getCachedLookup(collection: string, displayField: string) {
  const key = getLookupKey(collection, displayField);
  let cached = lookupCache.get(key);
  if (!cached) {
    cached = new Map<string, string>();
    lookupCache.set(key, cached);
  }
  return cached;
}

function upsertLookupRows(collection: string, displayField: string, rows: LookupRecord[]) {
  const cached = getCachedLookup(collection, displayField);

  for (const item of rows) {
    const id = item.id;
    const displayValue = item[displayField];
    if (id !== null && id !== undefined && displayValue !== null && displayValue !== undefined) {
      cached.set(String(id), String(displayValue));
    }
  }

  return new Map(cached);
}

function pickCachedNames(ids: string[], cached: Map<string, string>) {
  const entries: Array<[string, string]> = [];
  for (const id of ids) {
    const name = cached.get(id);
    if (name) entries.push([id, name]);
  }
  return new Map(entries);
}

async function fetchLookup(
  collection: string,
  displayField: string,
  ids?: string[],
): Promise<Map<string, string>> {
  const baseKey = getLookupKey(collection, displayField);
  const uniqueIds = ids ? [...new Set(ids.filter(Boolean))].sort() : [];
  const cached = getCachedLookup(collection, displayField);

  if (!collection || !displayField) return new Map();
  if (uniqueIds.length === 0 && fullyLoadedLookups.has(baseKey)) return new Map(cached);

  const missingIds = uniqueIds.filter((id) => !cached.has(id));
  if (uniqueIds.length > 0 && missingIds.length === 0) return new Map(cached);

  const requestKey = uniqueIds.length > 0 ? `${baseKey}:ids:${missingIds.join(',')}` : `${baseKey}:all`;
  const existing = inFlightLookups.get(requestKey);
  if (existing) return existing;

  const params = new URLSearchParams();
  params.append('fields[]', 'id');
  params.append('fields[]', displayField);
  params.set('limit', String(uniqueIds.length > 0 ? Math.max(missingIds.length, 1) : LOOKUP_LIMIT));
  if (uniqueIds.length > 0) params.set('filter[id][_in]', missingIds.join(','));

  const request = fetch(`/api/items/${collection}?${params.toString()}`)
    .then(async (res) => {
      if (!res.ok) {
        if (res.status === 429) {
          console.warn(`Name lookup rate limited for ${collection}.${displayField}; using cached values.`);
        }
        return new Map(cached);
      }

      const data = await res.json();
      const rows = (data?.data ?? []) as LookupRecord[];
      const next = upsertLookupRows(collection, displayField, rows);
      if (uniqueIds.length === 0) fullyLoadedLookups.add(baseKey);
      return next;
    })
    .catch((error) => {
      console.warn(`Name lookup failed for ${collection}.${displayField}`, error);
      return new Map(cached);
    })
    .finally(() => {
      inFlightLookups.delete(requestKey);
    });

  inFlightLookups.set(requestKey, request);
  return request;
}

/**
 * Fetches a name lookup map from a collection (id -> displayField).
 * Used by list pages to render FK IDs as human-readable names.
 */
export function useNameLookup(collection: string, displayField = 'name'): Map<string, string> {
  const [nameMap, setNameMap] = useState<Map<string, string>>(
    () => new Map(getCachedLookup(collection, displayField)),
  );

  useEffect(() => {
    if (!collection || !displayField) {
      setNameMap(new Map());
      return;
    }

    let cancelled = false;
    fetchLookup(collection, displayField).then((map) => {
      if (!cancelled) setNameMap(map);
    });

    return () => {
      cancelled = true;
    };
  }, [collection, displayField]);

  return nameMap;
}

/**
 * Batch version for pages that already know the IDs visible on screen.
 * It only requests missing IDs and reuses the shared collection + field cache.
 */
export function useNameLookupBatch(
  collection: string,
  ids: Array<string | number | null | undefined>,
  displayField = 'name',
): Map<string, string> {
  const idsKey = useMemo(
    () => [...new Set(ids.map((id) => (id === null || id === undefined ? '' : String(id))).filter(Boolean))].sort(),
    [ids],
  ).join(',');
  const stableIds = useMemo(() => (idsKey ? idsKey.split(',') : []), [idsKey]);
  const [nameMap, setNameMap] = useState<Map<string, string>>(() => {
    const cached = getCachedLookup(collection, displayField);
    return pickCachedNames(stableIds, cached);
  });

  useEffect(() => {
    if (!collection || !displayField || stableIds.length === 0) {
      setNameMap(new Map());
      return;
    }

    let cancelled = false;
    fetchLookup(collection, displayField, stableIds).then((map) => {
      if (cancelled) return;
      setNameMap(pickCachedNames(stableIds, map));
    });

    return () => {
      cancelled = true;
    };
  }, [collection, displayField, stableIds]);

  return nameMap;
}
