/**
 * DaaS Roles Proxy Route
 * Proxies /api/roles requests to the DaaS backend.
 * Used by Admin Role Management UI.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders, getDaaSUrl } from '@/lib/api/auth-headers';

export async function GET(request: NextRequest) {
  try {
    const daasUrl = getDaaSUrl();
    const headers = await getAuthHeaders(request);
    const searchParams = request.nextUrl.searchParams.toString();
    const url = `${daasUrl}/api/roles${searchParams ? `?${searchParams}` : ''}`;

    const response = await fetch(url, { headers, cache: 'no-store' });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Proxy error';
    return NextResponse.json({ errors: [{ message }] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const daasUrl = getDaaSUrl();
    const headers = await getAuthHeaders(request);
    const body = await request.json();

    const response = await fetch(`${daasUrl}/api/roles`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Proxy error';
    return NextResponse.json({ errors: [{ message }] }, { status: 500 });
  }
}
