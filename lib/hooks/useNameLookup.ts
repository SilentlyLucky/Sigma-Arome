'use client';

import { useState, useEffect } from 'react';

/**
 * Fetches a name lookup map from a collection (id → displayField).
 * Used by list pages to render FK IDs as human-readable names.
 */
export function useNameLookup(collection: string, displayField = 'name'): Map<string, string> {
  const [nameMap, setNameMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    fetch(`/api/items/${collection}?fields[]=id&fields[]=${displayField}&limit=500`)
      .then((r) => r.json())
      .then((d) => {
        const map = new Map<string, string>();
        for (const item of (d?.data ?? []) as Record<string, string>[]) {
          if (item.id && item[displayField]) map.set(item.id, item[displayField]);
        }
        setNameMap(map);
      })
      .catch(() => {});
  }, [collection, displayField]);

  return nameMap;
}
