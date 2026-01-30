import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getCSP } from '@/lib/security/csp';
import { setCSRFCookie } from '@/lib/security/csrf';

/**
 * Next.js 16 Proxy handler (formerly Middleware)
 * Enforces security headers, refreshes sessions, and protects routes.
 */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path === '/@vite/client') {
    return new NextResponse('', {
      status: 204,
      headers: {
        'Content-Type': 'application/javascript',
      },
    });
  }

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

  // Set CSRF cookie for all requests if not already present
  if (!request.cookies.get('__Host-csrf')?.value) {
    setCSRFCookie(response);
  }

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
        // Update request cookies for downstream middleware/routes
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        // Re-create the response to include the new cookies
        response = NextResponse.next({
          request,
        });

        // Re-apply security headers to the new response
        setSecurityHeaders(response.headers);

        // Apply the cookies to the actual response
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // 3. Refresh Session
  let user = null;
  try {
    // SECURITY: getUser() is the safest way to verify the user as it checks with the server
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (authUser) {
      user = authUser;
    } else if (error) {
      // SILENT: Handle common refresh token failures without logging to console.
      // These occur when a session is expired, revoked, or the token is no longer valid.
      const isRefreshTokenError =
        error.message?.includes('Refresh Token Not Found') ||
        error.code === 'refresh_token_not_found' ||
        error.status === 400;

      if (!isRefreshTokenError) {
        // Only log unexpected auth errors
        console.warn('Proxy auth status:', error.message);
      } else {
        // Quietly clear invalid session data to prevent repeated errors
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch {
          // Ignore signout errors during refresh failure
        }
      }
    }
  } catch (err) {
    // Only log unexpected catastrophic errors, not common refresh failures
    const isRefreshError = err instanceof Error && err.message.includes('Refresh Token Not Found');
    if (!isRefreshError) {
      console.error('Proxy auth exception:', err);
    }
  }

  // 4. Route Protection
  // Protected Pages (temporarily disabled for testing)
  const protectedRoutes = ['/calendar', '/feed', '/map', '/settings', '/manage-profiles'];
  const publicRoutes = ['/test-weather'];
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));

  // Auth Pages
  const authRoutes = ['/login', '/signup', '/reset-password'];
  const isAuthRoute = authRoutes.some((route) => path.startsWith(route));

  // API Protection
  const isApiRoute = path.startsWith('/api/');
  const isPublicApi =
    path.startsWith('/api/auth/') ||
    path.startsWith('/api/health') ||
    path.startsWith('/api/mq-demo') ||
    path.startsWith('/api/weather') ||
    path.startsWith('/api/test-weather');

  // Logic:
  // If authenticated and on auth route -> redirect to /home
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Temporary: Disable authentication for home page
  if (
    isProtectedRoute &&
    !user &&
    !publicRoutes.some((route) => path.startsWith(route)) &&
    path !== '/home'
  ) {
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
