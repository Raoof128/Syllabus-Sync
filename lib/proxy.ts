import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// ============================================================================
// SECURITY: Content Security Policy
// ============================================================================
function buildCSPHeader(): string {
  // Note: We use 'unsafe-inline' for scripts instead of nonce because:
  // 1. Next.js App Router generates different nonces between SSR and hydration
  // 2. This causes hydration mismatches that break the app
  // 3. The inline scripts (theme/RTL) are static and safe
  // 4. For production, consider using hashes instead of unsafe-inline
  return [
    "default-src 'self'",
    // Scripts: Allow self and unsafe-inline (nonce causes hydration mismatch in Next.js App Router)
    "script-src 'self' 'unsafe-inline'",
    // Styles: Allow self and unsafe-inline (required for Tailwind/CSS-in-JS)
    "style-src 'self' 'unsafe-inline'",
    // Images
    "img-src 'self' data: blob: https:",
    // Fonts
    "font-src 'self' data:",
    // Connect (API, WebSocket)
    "connect-src 'self' https://*.supabase.co https://*.openrouteservice.org wss://*.supabase.co",
    // Frame ancestors (clickjacking protection)
    "frame-ancestors 'self'",
    // Base URI
    "base-uri 'self'",
    // Form actions
    "form-action 'self'",
    // Object sources
    "object-src 'none'",
    // Upgrade insecure requests in production
    ...(process.env.NODE_ENV === 'production' ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // SECURITY: Add CSP header
  response.headers.set('Content-Security-Policy', buildCSPHeader());

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
        response.headers.set('Content-Security-Policy', buildCSPHeader());
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protect routes that require authentication
  const protectedRoutes = ['/home', '/calendar', '/feed', '/map', '/settings', '/manage-profiles'];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  if (isProtectedRoute && !session) {
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
