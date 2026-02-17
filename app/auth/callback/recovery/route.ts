import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Password Recovery Callback Handler
 *
 * Dedicated route for password reset flow. Using a separate path avoids
 * relying on query params (which Supabase GoTrue strips from redirect_to)
 * or heuristics like recovery_sent_at timing.
 *
 * Flow:
 * 1. resetPasswordForEmail() sets redirectTo to /auth/callback/recovery
 * 2. User clicks email link → Supabase verifies → redirects here with ?code=xxx
 * 3. We exchange the code server-side (has access to PKCE code_verifier cookie)
 * 4. Redirect to /reset-password?recovery=1 with session established
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (!code) {
    const resetUrl = new URL('/reset-password', requestUrl.origin);
    resetUrl.searchParams.set('error', 'missing_code');
    resetUrl.searchParams.set('error_description', 'Invalid reset link. Please request a new one.');
    return NextResponse.redirect(resetUrl);
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Recovery callback code exchange error:', error.message);
    const resetUrl = new URL('/reset-password', requestUrl.origin);
    resetUrl.searchParams.set('error', 'verification_failed');
    resetUrl.searchParams.set('error_description', 'Invalid or expired reset link. Please request a new one.');
    return NextResponse.redirect(resetUrl);
  }

  // Session is now set via cookies. Redirect to the password form.
  return NextResponse.redirect(new URL('/reset-password?recovery=1', requestUrl.origin));
}
