import { createServerClient } from '@/lib/supabase/server';
import { isValidRedirect } from '@/lib/utils/security';
import { NextResponse } from 'next/server';

/**
 * Email Verification Callback Handler
 *
 * This route handles the OAuth/email verification callback from Supabase.
 * When a user clicks the verification link in their email, Supabase redirects
 * them here with a temporary `code` parameter. We exchange this code for a
 * permanent session cookie.
 *
 * SECURITY: This is the "Key Exchange" - the temporary code is single-use
 * and time-limited. Exchanging it for a session cookie establishes the user's
 * authenticated state securely.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
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

  // Redirect to the validated target after successful verification/OAuth.
  // The session cookie is now set and the proxy will recognize the user.
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}
