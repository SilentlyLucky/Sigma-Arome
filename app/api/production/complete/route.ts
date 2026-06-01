/**
 * POST /api/production/complete
 *
 * Production action: complete a production order.
 * Body: {
 *   production_order_id: string,
 *   actual_output_qty: number,
 *   actual_unit?: string,
 *   completion_notes?: string,
 * }
 *
 * Patches the production order with actual output fields and status='completed'.
 * The 'Production Order - Complete + Auto-create FG Batch' extension fires and:
 *   - calculates yield_pct
 *   - creates a finished_product batch (qc_pending) → routes to QC
 *   - writes inventory_movements row (movement_type='production_output')
 *   - links fg_batch_id back to the order
 */
import { type NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders, getDaaSUrl } from '@/lib/api/auth-headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { production_order_id, actual_output_qty, actual_unit, completion_notes } = body ?? {};
    if (!production_order_id || actual_output_qty == null) {
      return NextResponse.json(
        { errors: [{ message: 'production_order_id and actual_output_qty are required' }] },
        { status: 400 }
      );
    }
    const qty = Number(actual_output_qty);
    if (!Number.isFinite(qty) || qty <= 0) {
      return NextResponse.json(
        { errors: [{ message: 'actual_output_qty must be a positive number' }] },
        { status: 400 }
      );
    }

    const daasUrl = getDaaSUrl();
    const headers = await getAuthHeaders(request);

    const patch = await fetch(`${daasUrl}/api/items/production_orders/${production_order_id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        actual_output_qty: qty,
        actual_unit: actual_unit ?? null,
        completion_notes: completion_notes ?? null,
        status: 'completed',
      }),
    });

    const data = await patch.json();
    return NextResponse.json(data, { status: patch.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Complete failed';
    return NextResponse.json({ errors: [{ message }] }, { status: 500 });
  }
}
