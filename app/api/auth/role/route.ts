/**
 * GET /api/auth/role
 * Returns the current user's dashboard redirect path.
 *
 * Queries app_user_access — a denormalized collection with user_id, role_key, route.
 * Each user can only read their own record (permission: user_id = $CURRENT_USER).
 * No admin token needed. No system table access needed.
 *
 * Accepts X-Auth-Token header (from login response) to avoid cookie timing race.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDaaSUrl } from '@/lib/api/auth-headers';

async function getRoleRedirect(bearerToken: string): Promise<string> {
  const daasUrl = getDaaSUrl();

  const res = await fetch(
    `${daasUrl}/api/items/app_user_access?fields[]=route&fields[]=role_key&fields[]=priority&sort[]=priority&limit=1`,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearerToken}`,
      },
      cache: 'no-store',
    }
  );

  if (!res.ok) return '/admin';

  const data = await res.json();
  const first = data?.data?.[0];
  return first?.route ?? '/admin';
}

export async function GET(request: NextRequest) {
  try {
    // X-Auth-Token: passed directly from login (avoids cookie timing race)
    const headerToken = request.headers.get('X-Auth-Token');
    if (headerToken) {
      return NextResponse.json({ redirect: await getRoleRedirect(headerToken) });
    }

    // Fallback: Supabase session cookie
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ redirect: '/login' });

    // Get token for DaaS call (getSession is fine here — we already verified identity via getUser)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return NextResponse.json({ redirect: '/login' });

    return NextResponse.json({ redirect: await getRoleRedirect(session.access_token) });
  } catch (err) {
    console.error('[role] error:', err);
    return NextResponse.json({ redirect: '/admin' });
  }
}
