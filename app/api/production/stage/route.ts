/**
 * POST /api/production/stage
 *
 * Warehouse Operator action: stage a single material_request_items line into a staging bin.
 * Body: { mr_item_id: string, staging_location_id: string }
 *
 * Updates the MR-item to status='staged' with the staging_location_id.
 * The 'MR Item - Stage Handler' DaaS extension then physically moves the source batch.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders, getDaaSUrl } from '@/lib/api/auth-headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mr_item_id, staging_location_id } = body ?? {};
    if (!mr_item_id || !staging_location_id) {
      return NextResponse.json(
        { errors: [{ message: 'mr_item_id and staging_location_id are required' }] },
        { status: 400 }
      );
    }

    const daasUrl = getDaaSUrl();
    const headers = await getAuthHeaders(request);

    // Read current item to confirm it has source_batch_id
    const readRes = await fetch(
      `${daasUrl}/api/items/material_request_items/${mr_item_id}?fields[]=source_batch_id&fields[]=status`,
      { headers, cache: 'no-store' }
    );
    if (!readRes.ok) {
      return NextResponse.json({ errors: [{ message: 'Material request item not found' }] }, { status: 404 });
    }
    const item = (await readRes.json())?.data;
    if (!item?.source_batch_id) {
      return NextResponse.json(
        { errors: [{ message: 'No source batch picked yet — order may need to be re-released to pick FEFO source.' }] },
        { status: 400 }
      );
    }
    if (item.status !== 'pending') {
      return NextResponse.json(
        { errors: [{ message: `Cannot stage from status "${item.status}". Must be "pending".` }] },
        { status: 400 }
      );
    }

    const patchRes = await fetch(`${daasUrl}/api/items/material_request_items/${mr_item_id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        status: 'staged',
        staging_location_id,
        staged_at: new Date().toISOString(),
      }),
    });

    const data = await patchRes.json();
    return NextResponse.json(data, { status: patchRes.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stage failed';
    return NextResponse.json({ errors: [{ message }] }, { status: 500 });
  }
}
