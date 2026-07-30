import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';

/**
 * Email Confirmation Handler (token_hash flow)
 *
 * Handles email verification links that use token_hash instead of PKCE codes.
 * This is the recommended approach for password recovery in Next.js because
 * PKCE code_verifier cookies are unreliable across the email→browser redirect.
 *
 * The email template sends: /auth/confirm?token_hash=xxx&type=recovery&next=/reset-password
 * This route verifies the token server-side and redirects to the target page.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';

  // SECURITY: `next.startsWith('/')` is NOT sufficient — it accepts a
  // protocol-relative value, and `new URL('//evil.example', <this route>)`
  // resolves to `https://evil.example/`. Since the redirect below happens AFTER
  // verifyOtp has established a session, that was an open redirect on the
  // product's own domain combined with session fixation: an attacker could send
  // a victim a genuine syllabus-sync.app link carrying the ATTACKER's
  // token_hash, land the victim on an attacker-controlled page, and leave the
  // victim's browser signed into the attacker's account.
  //
  // The sibling /auth/callback validates the same parameter through
  // isValidRedirect(), which explicitly rejects `//`. That helper is not reused
  // here on purpose: SAFE_REDIRECT_PATHS does not contain '/reset-password',
  // which is exactly where the recovery flow has to land, so isValidRedirect
  // would reject the one destination this route exists to serve.
  //
  // Resolving against the request origin and requiring a match is stricter than
  // a prefix test and needs no allowlist: it rejects protocol-relative values,
  // absolute off-origin URLs and backslash variants alike, while preserving
  // every legitimate same-origin path.
  const requestOrigin = new URL(request.url).origin;
  const resolvedNext = new URL(next, request.url);
  const redirectPath =
    resolvedNext.origin === requestOrigin ? `${resolvedNext.pathname}${resolvedNext.search}` : '/';

  if (!token_hash || !type) {
    const errorUrl = new URL('/reset-password', request.url);
    errorUrl.searchParams.set('error', 'missing_params');
    errorUrl.searchParams.set('error_description', 'Invalid reset link. Please request a new one.');
    return NextResponse.redirect(errorUrl);
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  });

  if (error) {
    console.error('Token verification error:', error.message);
    const errorUrl = new URL('/reset-password', request.url);
    errorUrl.searchParams.set('error', 'verification_failed');
    errorUrl.searchParams.set(
      'error_description',
      'Invalid or expired reset link. Please request a new one.',
    );
    return NextResponse.redirect(errorUrl);
  }

  // Session is established. Redirect to the target page.
  // For recovery, this will be /reset-password
  const redirectUrl = new URL(redirectPath, request.url);
  if (type === 'recovery') {
    redirectUrl.searchParams.set('recovery', '1');
  }
  return NextResponse.redirect(redirectUrl);
}
