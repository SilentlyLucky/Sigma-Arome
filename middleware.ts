/**
 * Next.js Middleware
 * 
 * 1. Supabase session refresh (via updateSession)
 * 2. Role-based route protection
 */

import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { checkRateLimit, readRateLimitNumber } from '@/lib/api/rate-limit';

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
const API_RATE_LIMIT_MAX = readRateLimitNumber(process.env.API_RATE_LIMIT_MAX, 100);
const API_RATE_LIMIT_WINDOW_MS = readRateLimitNumber(process.env.API_RATE_LIMIT_WINDOW_MS, 60_000);

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return (
    forwardedFor ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

function rateLimitApiRequest(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!pathname.startsWith('/api') || pathname === '/api/health') return null;

  const clientIp = getClientIp(request);
  const result = checkRateLimit(
    `api:${clientIp}`,
    API_RATE_LIMIT_MAX,
    API_RATE_LIMIT_WINDOW_MS
  );

  const headers = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
  };

  if (result.allowed) {
    return { headers };
  }

  return NextResponse.json(
    {
      errors: [{
        message: 'Too many requests. Please wait before trying again.',
      }],
    },
    {
      status: 429,
      headers: {
        ...headers,
        'Retry-After': String(result.retryAfter),
      },
    }
  );
}

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
  const rateLimitResponse = rateLimitApiRequest(request);
  if (rateLimitResponse instanceof NextResponse) return rateLimitResponse;

  // Step 1: Refresh Supabase session + redirect unauthenticated to /login
  const response = await updateSession(request);
  if (rateLimitResponse?.headers) {
    for (const [key, value] of Object.entries(rateLimitResponse.headers)) {
      response.headers.set(key, value);
    }
  }

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
  // Supabase SSR may split cookies into chunks: sb-xxx-auth-token.0, .1, .2, etc.
  const allCookies = request.cookies.getAll();
  const authCookieBase = allCookies.find(c => c.name.includes('-auth-token') && !c.name.includes('.'))?.name
    ?? allCookies.find(c => c.name.includes('-auth-token'))?.name;
  
  if (!authCookieBase) return response;

  // Reassemble chunked cookie if needed
  let cookieValue: string;
  const baseWithoutChunk = authCookieBase.replace(/\.\d+$/, '');
  const chunks = allCookies
    .filter(c => c.name === baseWithoutChunk || c.name.startsWith(baseWithoutChunk + '.'))
    .sort((a, b) => {
      const aNum = parseInt(a.name.split('.').pop() ?? '0', 10) || 0;
      const bNum = parseInt(b.name.split('.').pop() ?? '0', 10) || 0;
      return aNum - bNum;
    });
  
  if (chunks.length > 1) {
    cookieValue = chunks.map(c => c.value).join('');
  } else {
    cookieValue = chunks[0]?.value ?? '';
  }

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

  // Step 6: Enforce — user can only access pages under their assigned route prefix.
  // e.g. if userRoute is '/admin', they can access '/admin', '/admin/users', '/admin/products', etc.
  // If they try to access '/warehouse/...' they get redirected back to '/admin'.
  const currentRoutePrefix = Object.keys(ROLE_ROUTES).find(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );

  if (currentRoutePrefix) {
    // Check if the user's assigned route matches the prefix they're trying to access
    const isAllowed = userRoute === currentRoutePrefix || userRoute.startsWith(currentRoutePrefix + '/');
    if (!isAllowed) {
      // User is trying to access a different role's section — redirect to their own
      if (userRoute !== pathname) {
        return NextResponse.redirect(new URL(userRoute, request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
