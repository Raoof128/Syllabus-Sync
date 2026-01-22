import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getCSP } from '@/lib/security/csp';

/**
 * Next.js 16 Proxy handler (formerly Middleware)
 * Enforces security headers, refreshes sessions, and protects routes.
 */
export async function proxy(request: NextRequest) {
  // Get appropriate CSP based on environment
  const cspHeader = getCSP();

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 1. Set Security Headers
  const setSecurityHeaders = (headers: Headers) => {
    headers.set('Content-Security-Policy', cspHeader);
    headers.set('X-Frame-Options', 'SAMEORIGIN');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(self), payment=(), usb=()',
    );
  };

  setSecurityHeaders(response.headers);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check if Supabase is properly configured
  const hasValidUrl =
    supabaseUrl && supabaseUrl.includes('supabase.co') && !supabaseUrl.includes('your-project-id');
  const hasValidKey =
    supabaseAnonKey &&
    (supabaseAnonKey.startsWith('eyJ') || supabaseAnonKey.startsWith('sb_')) &&
    !supabaseAnonKey.includes('PASTE') &&
    !supabaseAnonKey.includes('your');

  if (!hasValidUrl || !hasValidKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '⚠️ Supabase not configured. Running in demo mode.\n' +
          'To enable auth, update .env.local with your Supabase credentials.',
      );
    }
    return response;
  }

  // 2. Initialize Supabase Client
  const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
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
        setSecurityHeaders(response.headers);
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // 3. Refresh Session
  let user = null;
  try {
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();
    if (!error) {
      user = authUser;
    } else if (
      error.message?.includes('Refresh Token Not Found') ||
      error.code === 'refresh_token_not_found'
    ) {
      // Clear invalid session data
      await supabase.auth.signOut();
    }
  } catch (err) {
    console.error('Proxy auth error (handled):', err);
  }

  // 4. Route Protection
  const path = request.nextUrl.pathname;

  // Protected Pages
  const protectedRoutes = ['/home', '/calendar', '/feed', '/map', '/settings', '/manage-profiles'];
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));

  // Auth Pages
  const authRoutes = ['/login', '/signup', '/reset-password'];
  const isAuthRoute = authRoutes.some((route) => path.startsWith(route));

  // API Protection
  const isApiRoute = path.startsWith('/api/');
  const isPublicApi =
    path.startsWith('/api/auth/') ||
    path.startsWith('/api/health') ||
    path.startsWith('/api/mq-demo');

  // Logic:
  // If authenticated and on auth route -> redirect to /home
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // If not authenticated and on protected route -> redirect to /login
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', path);
    return NextResponse.redirect(redirectUrl);
  }

  // If not authenticated and on non-public API route -> return 401
  if (isApiRoute && !isPublicApi && !user) {
    const unauthorizedResponse = NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
    setSecurityHeaders(unauthorizedResponse.headers);
    return unauthorizedResponse;
  }

  return response;
}
