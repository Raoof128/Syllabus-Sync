import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// ============================================================================
// SECURITY: CSP Nonce Generation
// ============================================================================
function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64');
}

function buildCSPHeader(nonce: string): string {
  return [
    "default-src 'self'",
    // Scripts: Allow self, and specific nonce for inline scripts
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
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
  // SECURITY: Generate nonce for CSP
  const nonce = generateNonce();

  // Clone headers and add nonce
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // SECURITY: Add CSP header with nonce
  response.headers.set('Content-Security-Policy', buildCSPHeader(nonce));
  response.headers.set('x-nonce', nonce);

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
            headers: requestHeaders,
          },
        });
        // Re-add security headers after response recreation
        response.headers.set('Content-Security-Policy', buildCSPHeader(nonce));
        response.headers.set('x-nonce', nonce);
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

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
