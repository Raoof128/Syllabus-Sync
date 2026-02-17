import { createServerClient } from '@/lib/supabase/server';
import { isValidRedirect } from '@/lib/utils/security';
import { NextResponse } from 'next/server';

/**
 * Auth Callback Handler
 *
 * This route handles OAuth/email verification/password recovery callbacks from Supabase.
 * When a user clicks a link in their email, Supabase redirects them here with
 * a temporary `code` parameter. We exchange this code for a session.
 *
 * For password recovery, we redirect to /reset-password with the code.
 * For other flows (signup verification, OAuth), we redirect to the target page.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const type = requestUrl.searchParams.get('type'); // Supabase sends type=recovery for password reset
  const rawRedirect =
    requestUrl.searchParams.get('redirectTo') ?? requestUrl.searchParams.get('next');
  const redirectTo = isValidRedirect(rawRedirect) ? rawRedirect! : '/home';

  // OAuth providers can redirect back with error query params.
  if (error || errorDescription) {
    console.error('OAuth callback error:', {
      error,
      errorDescription,
    });
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', 'oauth_failed');
    if (isValidRedirect(rawRedirect)) {
      loginUrl.searchParams.set('redirectTo', rawRedirect!);
    }
    return NextResponse.redirect(loginUrl);
  }

  // If no code is present, there is nothing to exchange. Send the user back to login.
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', requestUrl.origin));
  }

  // For password recovery, redirect to reset-password page with the code
  // The reset-password page will handle the code exchange and show the new password form
  if (type === 'recovery') {
    const resetUrl = new URL('/reset-password', requestUrl.origin);
    resetUrl.searchParams.set('code', code);
    return NextResponse.redirect(resetUrl);
  }

  const supabase = await createServerClient();

  // The handshake: Exchange temporary code for permanent session
  // This validates the code with Supabase and sets the session cookie
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    // Log error but redirect to login - user can try again
    console.error('Auth callback code exchange error:', exchangeError.message);
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', 'verification_failed');
    return NextResponse.redirect(loginUrl);
  }

  // Check if this was a password recovery flow by examining the session
  // Supabase sets a special recovery flag in the session when it's a password recovery
  // A more reliable check: if redirectTo was /reset-password, honor it
  if (rawRedirect === '/reset-password' || redirectTo === '/reset-password') {
    return NextResponse.redirect(new URL('/reset-password', requestUrl.origin));
  }

  // Redirect to the validated target after successful verification/OAuth.
  // The session cookie is now set and the proxy will recognize the user.
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}
