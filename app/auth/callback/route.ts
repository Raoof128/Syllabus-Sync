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

  // Always exchange the code for a session first (PKCE handshake).
  // This sets the session cookie so downstream pages have auth context.
  const supabase = await createServerClient();
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('Auth callback code exchange error:', {
      message: exchangeError.message,
      status: (exchangeError as Record<string, unknown>).status,
      code: (exchangeError as Record<string, unknown>).code,
    });
    // For recovery, redirect back to reset-password with error
    if (type === 'recovery') {
      const resetUrl = new URL('/reset-password', requestUrl.origin);
      resetUrl.searchParams.set('error', 'verification_failed');
      resetUrl.searchParams.set(
        'error_description',
        'Invalid or expired reset link. Please request a new one.',
      );
      return NextResponse.redirect(resetUrl);
    }

    // Hybrid-A: signup email verification via PKCE frequently "fails" here
    // because a link-scanning bot (Gmail/Outlook/corporate proxy) has already
    // consumed the one-time code — but the server-side effect (email marked
    // verified) still took place. Detect the signup flow by the redirectTo
    // we set during signUp (`/login?verified=1`) and treat it optimistically:
    // send the user to login with a soft-success banner instead of a scary
    // error. True OAuth failures (redirectTo=/home or other) still get the
    // retry-style error.
    const looksLikeSignupVerification =
      rawRedirect === '/login?verified=1' ||
      (rawRedirect?.startsWith('/login') && rawRedirect.includes('verified=1'));

    if (looksLikeSignupVerification) {
      const loginUrl = new URL('/login', requestUrl.origin);
      loginUrl.searchParams.set('verified', '1');
      loginUrl.searchParams.set('from', 'email_link');
      return NextResponse.redirect(loginUrl);
    }

    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', 'verification_failed');
    if (isValidRedirect(rawRedirect)) {
      loginUrl.searchParams.set('redirectTo', rawRedirect!);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Detect password recovery flow:
  // 1. Explicit type=recovery param (set by our resetPasswordForEmail redirectTo)
  if (type === 'recovery') {
    return NextResponse.redirect(new URL('/reset-password?recovery=1', requestUrl.origin));
  }

  // 2. Fallback: check if recovery was recently requested (handles case where
  //    Supabase stripped our query params from redirect_to)
  if (data?.user?.recovery_sent_at) {
    const recoveryTime = new Date(data.user.recovery_sent_at).getTime();
    if (Date.now() - recoveryTime < 10 * 60 * 1000) {
      return NextResponse.redirect(new URL('/reset-password?recovery=1', requestUrl.origin));
    }
  }

  // 3. Honor explicit redirectTo pointing to reset-password
  if (rawRedirect === '/reset-password' || redirectTo === '/reset-password') {
    return NextResponse.redirect(new URL('/reset-password?recovery=1', requestUrl.origin));
  }

  // For OAuth sign-ins (not email/magic-link), check if profile is complete.
  // Skip this for email-based flows where the user already went through signup.
  const isOAuthSignIn =
    data?.user?.app_metadata?.provider && data.user.app_metadata.provider !== 'email';

  if (isOAuthSignIn) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('faculty, course, year')
      .eq('id', data.user.id)
      .maybeSingle();

    const isIncomplete = !profile?.faculty || !profile?.course || !profile?.year;
    if (isIncomplete) {
      const onboardingUrl = new URL('/onboarding', requestUrl.origin);
      onboardingUrl.searchParams.set('next', redirectTo);
      return NextResponse.redirect(onboardingUrl);
    }
  }

  // Normal flow: redirect to the validated target.
  // The session cookie is now set and the proxy will recognize the user.
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}
