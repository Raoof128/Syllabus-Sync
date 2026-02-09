import { logger } from '@/lib/logger';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Creates a Supabase client for middleware usage
 * Uses cookies for session management
 */
export function createClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
      },
    },
  });
}

/**
 * Updates the session cookies in the response
 * Called when session is refreshed or created
 */
export async function updateSession(request: NextRequest, response: NextResponse) {
  const supabase = createClient(request);

  // This will refresh the session if it's expired
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    // SILENT: Handle common refresh token failures without logging to console.
    // These occur when a session is expired, revoked, or the token is no longer valid.
    const isRefreshTokenError =
      error.message?.includes('Refresh Token Not Found') ||
      error.code === 'refresh_token_not_found' ||
      error.status === 400;

    if (!isRefreshTokenError) {
      logger.error('Session update error:', error);
    }
    return;
  }

  // If session exists, ensure cookies are properly set
  if (session) {
    // Update the response with the new cookies
    const cookieOptions: CookieOptions = {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    };

    response.cookies.set('sb-access-token', session.access_token, cookieOptions);
    response.cookies.set('sb-refresh-token', session.refresh_token || '', cookieOptions);
  }
}

/**
 * Middleware authentication check
 * Returns user session or null if not authenticated
 */
export async function getAuthenticatedUser(request: NextRequest) {
  try {
    const supabase = createClient(request);
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.user) {
      return null;
    }

    return session.user;
  } catch (error) {
    logger.error('Auth check error:', error);
    return null;
  }
}
