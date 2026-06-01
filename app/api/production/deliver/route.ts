/**
 * POST /api/production/deliver
 *
 * Logistic action: confirm delivery for one or more MR-item lines.
 * Body: { lines: Array<{ mr_item_id: string, delivered_qty: number, delivery_notes?: string }> }
 *
 * Each line moves status from 'staged' → 'delivered' with delivered_qty/by/at filled in.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders, getDaaSUrl } from '@/lib/api/auth-headers';
import { createClient } from '@/lib/supabase/server';

interface DeliverLine {
  mr_item_id: string;
  delivered_qty: number;
  delivery_notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const lines: DeliverLine[] = body?.lines ?? [];
    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ errors: [{ message: 'lines is required' }] }, { status: 400 });
    }

    const daasUrl = getDaaSUrl();
    const headers = await getAuthHeaders(request);

    // Resolve current user id via Supabase session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? null;

    const now = new Date().toISOString();
    const results: Array<{ id: string; ok: boolean; error?: string }> = [];

    for (const line of lines) {
      try {
        // Verify line is staged
        const r = await fetch(
          `${daasUrl}/api/items/material_request_items/${line.mr_item_id}?fields[]=status`,
          { headers, cache: 'no-store' }
        );
        if (!r.ok) {
          results.push({ id: line.mr_item_id, ok: false, error: 'item not found' });
          continue;
        }
        const it = (await r.json())?.data;
        if (it?.status !== 'staged') {
          results.push({ id: line.mr_item_id, ok: false, error: `must be staged (was ${it?.status})` });
          continue;
        }

        const patch = await fetch(`${daasUrl}/api/items/material_request_items/${line.mr_item_id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            status: 'delivered',
            delivered_qty: line.delivered_qty,
            delivered_by: userId,
            delivered_at: now,
            delivery_notes: line.delivery_notes ?? null,
          }),
        });
        if (!patch.ok) {
          const ed = await patch.json().catch(() => ({}));
          results.push({ id: line.mr_item_id, ok: false, error: ed?.errors?.[0]?.message ?? 'patch failed' });
          continue;
        }
        results.push({ id: line.mr_item_id, ok: true });
      } catch (err) {
        results.push({ id: line.mr_item_id, ok: false, error: err instanceof Error ? err.message : 'unknown' });
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Deliver failed';
    return NextResponse.json({ errors: [{ message }] }, { status: 500 });
  }
}
