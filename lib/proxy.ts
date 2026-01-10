import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getCSP } from '@/lib/security/csp';

export async function proxy(request: NextRequest) {
  // Get appropriate CSP based on environment
  const cspHeader = getCSP();

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // SECURITY: Add CSP header (now using hash-based script validation)
  response.headers.set('Content-Security-Policy', cspHeader);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check if Supabase is properly configured
  // Valid URL should contain supabase.co and not be a placeholder
  // Valid key can be either:
  //   - JWT format: starts with "eyJ"
  //   - New publishable format: starts with "sb_"
  const hasValidUrl =
    supabaseUrl && supabaseUrl.includes('supabase.co') && !supabaseUrl.includes('your-project-id');
  const hasValidKey =
    supabaseAnonKey &&
    (supabaseAnonKey.startsWith('eyJ') || supabaseAnonKey.startsWith('sb_')) &&
    !supabaseAnonKey.includes('PASTE') &&
    !supabaseAnonKey.includes('your');

  if (!hasValidUrl || !hasValidKey) {
    console.warn(
      '⚠️ Supabase not configured. Running in demo mode without authentication.\n' +
        'To enable auth, update .env.local with your Supabase credentials from:\n' +
        'https://supabase.com/dashboard/project/_/settings/api\n' +
        'Note: The anon key should start with "eyJ" (JWT) or "sb_" (publishable)',
    );
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        // Re-add security headers after response recreation
        response.headers.set('Content-Security-Policy', cspHeader);
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });



  // Safe session refresh
  let session = null;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      // If the refresh token is invalid (e.g. revoked, expired, or missing from db),
      // we should clear the local cookies to prevent constant retry loops and error logging.
      if (
        error.message?.includes('Refresh Token Not Found') ||
        error.code === 'refresh_token_not_found'
      ) {
        // Clear invalid session data
        await supabase.auth.signOut();
      }
    } else {
      session = data.session;
    }
  } catch (err) {
    // Suppress unhandled auth errors during refresh to prevent noisy logs
    console.error('Middleware auth error (handled):', err);
  }

  // Protect routes that require authentication
  // SECURITY: Include /api routes to prevent accidental exposure of future endpoints
  const protectedRoutes = ['/home', '/calendar', '/feed', '/map', '/settings', '/manage-profiles'];

  // API routes that require authentication (all except public endpoints)
  const publicApiRoutes = ['/api/auth', '/api/health'];

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  // SECURITY: API routes are protected by default, except explicitly public ones
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const isPublicApiRoute = publicApiRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );
  const isProtectedApiRoute = isApiRoute && !isPublicApiRoute;

  if ((isProtectedRoute || isProtectedApiRoute) && !session) {
    // For API routes, return 401 instead of redirect
    if (isApiRoute) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Content-Security-Policy': cspHeader,
        },
      });
    }
    // Redirect to login if accessing protected route without session
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from auth pages
  const authRoutes = ['/login', '/signup', '/reset-password'];
  const isAuthRoute = authRoutes.some((route) => request.nextUrl.pathname.startsWith(route));

  if (isAuthRoute && session) {
    // Redirect to home if already authenticated
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return response;
}

// Note: Middleware config is defined in middleware.ts
// Next.js requires config to be defined directly in the middleware file
