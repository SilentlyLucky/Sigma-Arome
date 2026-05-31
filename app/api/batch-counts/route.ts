import { type NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders, getDaaSUrl } from '@/lib/api/auth-headers';

interface CountRequest {
  key: string;
  collection: string;
  filter?: Record<string, unknown>;
  primaryKey?: string;
}

function readCount(data: unknown, primaryKey: string): number {
  const row = (data as { data?: Array<{ count?: unknown }> })?.data?.[0];
  const raw = row?.count;
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') return Number(raw) || 0;
  if (raw && typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    const value = record[primaryKey] ?? record['*'] ?? Object.values(record)[0];
    return Number(value) || 0;
  }
  return 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requests: CountRequest[] = Array.isArray(body?.counts) ? body.counts : [];

    if (requests.length === 0) {
      return NextResponse.json({ counts: {} });
    }
    if (requests.length > 50) {
      return NextResponse.json(
        { errors: [{ message: 'Too many count requests.' }] },
        { status: 400 }
      );
    }

    const daasUrl = getDaaSUrl();
    const headers = await getAuthHeaders();

    const entries = await Promise.all(
      requests.map(async ({ key, collection, filter, primaryKey = '*' }) => {
        if (!key || !/^[a-zA-Z0-9_-]+$/.test(key) || !/^[a-zA-Z0-9_]+$/.test(collection)) {
          return [key || collection || 'unknown', 0] as const;
        }

        const params = new URLSearchParams({ 'aggregate[count]': primaryKey });
        if (filter && Object.keys(filter).length > 0) {
          params.set('filter', JSON.stringify(filter));
        }

        const response = await fetch(`${daasUrl}/api/items/${collection}?${params}`, {
          headers,
          cache: 'no-store',
        });

        if (!response.ok) return [key, 0] as const;
        const data = await response.json();
        return [key, readCount(data, primaryKey)] as const;
      })
    );

    return NextResponse.json({ counts: Object.fromEntries(entries) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Proxy error';
    return NextResponse.json({ errors: [{ message }] }, { status: 500 });
  }
}
