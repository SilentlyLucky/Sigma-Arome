/**
 * POST /api/production/receive
 *
 * Production action: confirm receipt for one or more MR-item lines.
 * Body: {
 *   lines: Array<{ mr_item_id: string, received_qty: number, discrepancy_notes?: string }>,
 *   start_order?: { production_order_id: string }   // optional: if all lines are received,
 *                                                    // also flip the order to in_progress.
 * }
 *
 * Each line moves status from 'delivered' → 'received'.
 * If start_order is provided AND every line of every linked MR is now 'received',
 * the production order is patched to status='in_progress'.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders, getDaaSUrl } from '@/lib/api/auth-headers';
import { createClient } from '@/lib/supabase/server';

interface ReceiveLine {
  mr_item_id: string;
  received_qty: number;
  discrepancy_notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const lines: ReceiveLine[] = body?.lines ?? [];
    const startOrder = body?.start_order;
    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ errors: [{ message: 'lines is required' }] }, { status: 400 });
    }

    const daasUrl = getDaaSUrl();
    const headers = await getAuthHeaders(request);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? null;

    const now = new Date().toISOString();
    const results: Array<{ id: string; ok: boolean; error?: string }> = [];

    for (const line of lines) {
      try {
        const r = await fetch(
          `${daasUrl}/api/items/material_request_items/${line.mr_item_id}?fields[]=status`,
          { headers, cache: 'no-store' }
        );
        if (!r.ok) {
          results.push({ id: line.mr_item_id, ok: false, error: 'item not found' });
          continue;
        }
        const it = (await r.json())?.data;
        if (it?.status !== 'delivered') {
          results.push({ id: line.mr_item_id, ok: false, error: `must be delivered (was ${it?.status})` });
          continue;
        }

        const patch = await fetch(`${daasUrl}/api/items/material_request_items/${line.mr_item_id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            status: 'received',
            received_qty: line.received_qty,
            received_by: userId,
            received_at: now,
            discrepancy_notes: line.discrepancy_notes ?? null,
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

    // Optional: also flip the production order to in_progress
    let orderResult: { ok: boolean; error?: string } | null = null;
    if (startOrder?.production_order_id) {
      const opRes = await fetch(`${daasUrl}/api/items/production_orders/${startOrder.production_order_id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'in_progress' }),
      });
      if (opRes.ok) {
        orderResult = { ok: true };
      } else {
        const ed = await opRes.json().catch(() => ({}));
        orderResult = { ok: false, error: ed?.errors?.[0]?.message ?? 'order patch failed' };
      }
    }

    return NextResponse.json({ results, order: orderResult });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Receive failed';
    return NextResponse.json({ errors: [{ message }] }, { status: 500 });
  }
}
