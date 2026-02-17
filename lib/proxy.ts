import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getCSP } from '@/lib/security/csp';
import { setCSRFCookie } from '@/lib/security/csrf';
import { logger } from '@/lib/logger';
import { fetchWithTimeout } from '@/lib/supabase/fetch';

let lastTransientProxyAuthLogAt = 0;
const TRANSIENT_PROXY_LOG_INTERVAL_MS = 60_000;

function isTransientProxyAuthError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const message = err.message.toLowerCase();
  return (
    err.name === 'AbortError' ||
    message.includes('fetch failed') ||
    message.includes('econnreset') ||
    message.includes('network')
  );
}

function shouldLogTransientProxyAuthError(): boolean {
  const now = Date.now();
  if (now - lastTransientProxyAuthLogAt < TRANSIENT_PROXY_LOG_INTERVAL_MS) {
    return false;
  }
  lastTransientProxyAuthLogAt = now;
  return true;
}

function isPublicApiPath(path: string): boolean {
  return (
    path.startsWith('/api/auth/') ||
    path.startsWith('/api/health') ||
    path.startsWith('/api/mq-demo') ||
    path.startsWith('/api/weather') ||
    path.startsWith('/api/test-weather')
  );
}

/**
 * Next.js 16 Proxy handler (formerly Middleware)
 * Enforces security headers, refreshes sessions, and protects routes.
 */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const protectedRoutes = ['/calendar', '/feed', '/map', '/settings', '/manage-profiles'];
  const authRoutes = ['/login', '/signup', '/reset-password'];
  const publicRoutes = ['/test-weather'];
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => path.startsWith(route));
  const isApiRoute = path.startsWith('/api/');
  const isPublicApi = isPublicApiPath(path);
  const shouldResolveUser = isProtectedRoute || isAuthRoute || (isApiRoute && !isPublicApi);

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

  // Set CSRF cookie for page navigations (not API).
  // Avoid setting cookies on public/cacheable API responses to preserve CDN caching
  // and reduce Vercel function invocations.
  if (!isApiRoute && !request.cookies.get('__Host-csrf')?.value) {
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

  // Fast path: routes that don't require user context avoid expensive auth fetch.
  if (!shouldResolveUser) {
    return response;
  }

  // 2. Initialize Supabase Client
  const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
    global: {
      fetch: fetchWithTimeout,
    },
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

  // 3. Refresh Session — race against a hard deadline so a slow upstream
  //    Supabase response never blocks the entire page render.
  const PROXY_AUTH_DEADLINE_MS = process.env.NODE_ENV === 'development' ? 12_000 : 6_000;

  let user = null;
  let authResolution: 'resolved' | 'unknown' = 'unknown';
  try {
    const authPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), PROXY_AUTH_DEADLINE_MS),
    );

    const result = await Promise.race([authPromise, timeoutPromise]);

    if (result && 'data' in result) {
      authResolution = 'resolved';
      const {
        data: { user: authUser },
        error,
      } = result;

      if (authUser) {
        user = authUser;
      } else if (error) {
        const isRefreshTokenError =
          error.message?.includes('Refresh Token Not Found') ||
          error.code === 'refresh_token_not_found' ||
          error.status === 400;

        if (!isRefreshTokenError) {
          if (isTransientProxyAuthError(new Error(error.message))) {
            if (shouldLogTransientProxyAuthError()) {
              console.warn('Proxy auth status: transient network/auth issue; request continuing');
            }
          } else {
            console.warn('Proxy auth status:', error.message);
          }
        } else {
          try {
            await supabase.auth.signOut({ scope: 'local' });
          } catch {
            // Ignore signout errors during refresh failure
          }
        }
      }
    } else {
      // Timeout — let the request through without auth context.
      // Protected routes should NOT hard-redirect to /login on timeout; this creates
      // buggy redirect loops when Supabase is cold-starting or transiently slow.
      if (shouldLogTransientProxyAuthError()) {
        console.warn(`Proxy auth: timed out after ${PROXY_AUTH_DEADLINE_MS}ms; request continuing`);
      }
    }
  } catch (err) {
    const isRefreshError = err instanceof Error && err.message.includes('Refresh Token Not Found');
    const isTransient = isTransientProxyAuthError(err);

    if (isTransient) {
      if (shouldLogTransientProxyAuthError()) {
        console.warn('Proxy auth status: transient upstream failure; request continuing');
      }
    } else if (!isRefreshError) {
      logger.error('Proxy auth exception:', err);
    }
  }

  // 4. Route Protection

  // Logic:
  // If authenticated and on auth route -> redirect to /home
  // MFA enforcement:
  // If a user has MFA factors enrolled, Supabase may issue an aal1 session after password auth.
  // We must prevent access to protected routes until the session is upgraded to aal2.
  let requiresMfaUpgrade = false;
  let mfaResolution: 'resolved' | 'unknown' = 'unknown';
  if (user && (isProtectedRoute || isAuthRoute || (isApiRoute && !isPublicApi))) {
    const MFA_AAL_DEADLINE_MS = process.env.NODE_ENV === 'development' ? 4000 : 2500;
    try {
      const aalPromise = supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), MFA_AAL_DEADLINE_MS),
      );

      const result = await Promise.race([aalPromise, timeoutPromise]);

      if (result && 'data' in result) {
        mfaResolution = 'resolved';
        const aal = result.data;
        requiresMfaUpgrade = aal?.nextLevel === 'aal2' && aal?.currentLevel === 'aal1';
      } else {
        // Unknown MFA status (timeout). For API routes we fail closed below.
        // For page routes, do not redirect to /login on this path; it causes user-facing flapping.
      }
    } catch (err) {
      logger.warn('Proxy MFA AAL check failed; MFA status unknown', { path, err });
    }
  }

  if (isAuthRoute && user) {
    // Allow /reset-password even when authenticated - user needs to set new password after recovery
    if (path.startsWith('/reset-password')) {
      return response;
    }

    // If MFA is required, allow /login to render so the user can complete the challenge.
    // Other auth routes should redirect back to /login in MFA mode.
    if (requiresMfaUpgrade) {
      if (!path.startsWith('/login')) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('mfa', '1');
        return NextResponse.redirect(redirectUrl);
      }
    } else {
      return NextResponse.redirect(new URL('/home', request.url));
    }
  }

  // Temporary: Disable authentication for home page
  if (
    isProtectedRoute &&
    !user &&
    !publicRoutes.some((route) => path.startsWith(route)) &&
    path !== '/home'
  ) {
    // If auth status couldn't be resolved (timeout/transient upstream issue), do not
    // redirect to /login. This avoids redirect loops and "blinking" UX.
    if (authResolution === 'unknown') {
      return response;
    }
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', path);
    return NextResponse.redirect(redirectUrl);
  }

  // If authenticated but MFA upgrade required and on protected route -> redirect to /login MFA step
  if (isProtectedRoute && user && requiresMfaUpgrade) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('mfa', '1');
    redirectUrl.searchParams.set('redirectTo', path);
    return NextResponse.redirect(redirectUrl);
  }

  // If authenticated and MFA status is unknown (timeout/error) on a non-public API route -> 503
  if (isApiRoute && !isPublicApi && user && mfaResolution === 'unknown') {
    const unavailableResponse = NextResponse.json(
      { error: 'Auth temporarily unavailable', code: 'AUTH_UNAVAILABLE' },
      { status: 503 },
    );
    setSecurityHeaders(unavailableResponse.headers);
    return unavailableResponse;
  }

  // If authenticated but MFA upgrade required and on non-public API route -> 403
  if (isApiRoute && !isPublicApi && user && requiresMfaUpgrade) {
    const forbiddenResponse = NextResponse.json(
      { error: 'MFA required', code: 'MFA_REQUIRED' },
      { status: 403 },
    );
    setSecurityHeaders(forbiddenResponse.headers);
    return forbiddenResponse;
  }

  // If auth status is unknown (timeout/transient upstream issue) on a non-public API route -> 503
  if (isApiRoute && !isPublicApi && !user && authResolution === 'unknown') {
    const unavailableResponse = NextResponse.json(
      { error: 'Auth temporarily unavailable', code: 'AUTH_UNAVAILABLE' },
      { status: 503 },
    );
    setSecurityHeaders(unavailableResponse.headers);
    return unavailableResponse;
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
