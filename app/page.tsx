/**
 * Root page — redirects authenticated users to their role-specific dashboard.
 * Unauthenticated users are redirected to /login by middleware.
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAuthHeaders, getDaaSUrl } from '@/lib/api/auth-headers';

const ROLE_ROUTES: Record<string, string> = {
  Administrator: '/admin',
  Manager: '/manager',
  PPIC: '/ppic',
  'Warehouse Operation': '/warehouse',
  QC: '/qc',
  Logistic: '/logistic',
  Production: '/production',
};

async function getUserRoleRoute(): Promise<string> {
  try {
    const headers = await getAuthHeaders();
    const daasUrl = getDaaSUrl();

    // Step 1: Get current user ID from DaaS
    const meRes = await fetch(`${daasUrl}/api/users/me`, { headers, cache: 'no-store' });
    if (!meRes.ok) return '/admin';
    const meData = await meRes.json();
    const userId = meData?.data?.id;
    if (!userId) return '/admin';

    // Step 2: Get user's role assignments from junction table
    const urRes = await fetch(
      `${daasUrl}/api/items/daas_user_roles?filter=${encodeURIComponent(JSON.stringify({ user_id: { _eq: userId } }))}&fields[]=role_id`,
      { headers, cache: 'no-store' }
    );
    if (!urRes.ok) return '/admin';
    const urData = await urRes.json();
    const roleIds: string[] = (urData?.data ?? []).map((r: { role_id: string }) => r.role_id);
    if (roleIds.length === 0) return '/admin';

    // Step 3: Get role names
    const rolesRes = await fetch(
      `${daasUrl}/api/roles?filter=${encodeURIComponent(JSON.stringify({ id: { _in: roleIds } }))}&fields[]=id&fields[]=name`,
      { headers, cache: 'no-store' }
    );
    if (!rolesRes.ok) return '/admin';
    const rolesData = await rolesRes.json();
    const roleNames: string[] = (rolesData?.data ?? []).map((r: { name: string }) => r.name);

    // Find the first matching non-admin role
    for (const roleName of roleNames) {
      if (roleName === 'Administrator') continue;
      const route = ROLE_ROUTES[roleName];
      if (route) return route;
    }

    // If only Administrator, go to admin
    if (roleNames.includes('Administrator')) return '/admin';
  } catch (err) {
    console.error('Role detection failed:', err);
  }

  return '/admin';
}

export default async function HomePage() {
  const supabase = await createClient();
  let hasUser = false;

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.warn(`Supabase auth check failed (${error.status ?? 'unknown status'}). Redirecting to login.`);
    }

    hasUser = Boolean(user);
  } catch (error) {
    const status =
      typeof error === 'object' && error !== null && 'status' in error
        ? String(error.status)
        : 'unknown status';
    console.warn(`Supabase auth check unavailable (${status}). Redirecting to login.`);
  }

  if (!hasUser) {
    redirect('/login');
  }

  const route = await getUserRoleRoute();
  redirect(route);
}
