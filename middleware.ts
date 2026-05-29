/**
 * Next.js Middleware
 * 
 * 1. Supabase session refresh (via updateSession)
 * 2. Role-based route protection
 */

import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Route prefix → allowed role_keys
const ROLE_ROUTES: Record<string, string[]> = {
  '/admin':      ['administrator'],
  '/ppic':       ['ppic'],
  '/manager':    ['manager'],
  '/warehouse':  ['warehouse_operation'],
  '/qc':         ['qc'],
  '/logistic':   ['logistic'],
  '/production': ['production'],
};

// In-memory cache: userId → { route, expiresAt }
const roleCache = new Map<string, { route: string; expiresAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function getUserRoute(accessToken: string, userId: string): Promise<string | null> {
  const cached = roleCache.get(userId);
  if (cached && Date.now() < cached.expiresAt) return cached.route;

  try {
    const daasUrl = process.env.NEXT_PUBLIC_BUILDPAD_DAAS_URL;
    if (!daasUrl) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(
      `${daasUrl}/api/items/app_user_access?fields[]=route&sort[]=priority&limit=1`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    const route = data?.data?.[0]?.route ?? null;
    if (route) roleCache.set(userId, { route, expiresAt: Date.now() + CACHE_TTL_MS });
    return route;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  // Step 1: Refresh Supabase session + redirect unauthenticated to /login
  const response = await updateSession(request);

  // If updateSession issued a redirect, return it immediately
  const location = response.headers.get('location');
  if (location) return response;

  const pathname = request.nextUrl.pathname;

  // Step 2: Skip role enforcement for routes that don't need it
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth')
  ) {
    return response;
  }

  // Step 3: Check if this path requires a specific role
  let requiredRoles: string[] | null = null;
  for (const [prefix, roles] of Object.entries(ROLE_ROUTES)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      requiredRoles = roles;
      break;
    }
  }
  if (!requiredRoles) return response;

  // Step 4: Get user's role from cookie cache or DaaS
  // Read the access token from the Supabase auth cookie (already refreshed by updateSession)
  const cookieName = request.cookies.getAll().find(c => c.name.includes('-auth-token'))?.name;
  if (!cookieName) return response;

  const cookieValue = request.cookies.get(cookieName)?.value;
  if (!cookieValue) return response;

  // Parse the Supabase auth cookie to extract access_token and user id
  let accessToken: string | null = null;
  let userId: string | null = null;
  try {
    // Cookie format: base64-{json} where json has access_token and user.id
    const jsonStr = cookieValue.startsWith('base64-')
      ? Buffer.from(cookieValue.slice(7), 'base64').toString('utf-8')
      : cookieValue;
    const parsed = JSON.parse(jsonStr);
    accessToken = parsed.access_token ?? null;
    userId = parsed.user?.id ?? null;
  } catch {
    return response; // Can't parse cookie — allow through
  }

  if (!accessToken || !userId) return response;

  // Step 5: Get user's assigned route
  const userRoute = await getUserRoute(accessToken, userId);
  if (!userRoute) return response; // Can't determine — allow through

  // Step 6: Enforce — redirect if user is on wrong role's route
  const userRoleKey = userRoute.replace('/', '');
  if (!requiredRoles.includes(userRoleKey)) {
    // Prevent infinite redirect
    if (userRoute !== pathname) {
      return NextResponse.redirect(new URL(userRoute, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
