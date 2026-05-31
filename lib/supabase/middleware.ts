/**
 * @buildpad-origin @buildpad/cli/supabase-auth/middleware
 * @buildpad-version 1.0.0
 *
 * This file was copied from Buildpad UI Packages.
 * To update, run: npx @buildpad/cli add supabase-auth/middleware --overwrite
 *
 * Docs: https://buildpad.dev/components/supabase-auth/middleware
 */

/**
 * Supabase Auth Middleware
 * 
 * Refreshes auth tokens and protects routes.
 * This file is copied to your project by the Buildpad CLI.
 * 
 * @buildpad/origin: supabase/middleware
 * @buildpad/version: 1.0.0
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Allow request to proceed but log warning
    console.warn('Supabase not configured - auth middleware skipped');
    return NextResponse.next({ request });
  }

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/auth', '/api/auth'];
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');

  let supabaseResponse = NextResponse.next({ request });

  if (isPublicRoute || isApiRoute) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

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

  // Redirect unauthenticated users to login (except for public and API routes)
  if (!hasUser) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
