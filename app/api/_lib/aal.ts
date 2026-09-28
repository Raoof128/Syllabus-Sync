import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { NextResponse } from 'next/server';
import { jsonError, ERROR_CODES } from '@/app/api/_lib/response';
import { fetchWithTimeout } from '@/lib/supabase/fetch';
import { logger } from '@/lib/logger';

/**
 * Step-up enforcement for authenticated routes under `/api/auth/*`.
 *
 * BA-0064: the middleware's AAL2 gate skips the whole `/api/auth/` prefix,
 * because sign-in, sign-up, reset and the passkey login ceremony must be
 * reachable before authentication. The routes under that prefix that act on
 * an existing session therefore have to enforce step-up themselves —
 * otherwise a password alone (no second factor) is enough to change that
 * password or sign every other device out. This is the check
 * POST /api/auth/mfa/unenroll already performed inline, extracted so each such
 * route applies the same fail-closed rule.
 *
 * Returns an error response to send, or `null` when the caller may proceed:
 *   - no verified factor enrolled  → proceed (nothing to step up to)
 *   - verified factor, AAL2        → proceed
 *   - verified factor, AAL1        → 403 MFA_REQUIRED
 *   - factors or AAL undeterminable → 503 (fail closed)
 */
export async function requireAal2IfEnrolled(
  supabase: SupabaseClient,
  userId: string,
  context: string,
): Promise<NextResponse | null> {
  const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
  if (factorsError || !factorsData) {
    logger.error(`${context}: MFA factor lookup failed`, {
      userId,
      error: factorsError?.message,
    });
    return jsonError(
      'Unable to verify MFA status. Please try again.',
      503,
      ERROR_CODES.EXTERNAL_SERVICE_ERROR,
    );
  }

  const hasVerifiedFactor = (factorsData.all ?? []).some((f) => f.status === 'verified');
  if (!hasVerifiedFactor) return null;

  const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalError || !aal) {
    logger.error(`${context}: AAL lookup failed`, { userId, error: aalError?.message });
    return jsonError(
      'Unable to verify identity level. Please try again.',
      503,
      ERROR_CODES.EXTERNAL_SERVICE_ERROR,
    );
  }

  if (aal.currentLevel !== 'aal2') {
    return jsonError('Multi-factor verification required', 403, ERROR_CODES.FORBIDDEN, {
      code: 'MFA_REQUIRED',
    });
  }

  return null;
}

/**
 * Check a password without touching the caller's session.
 *
 * `signInWithPassword` on the cookie-bound server client REPLACES the caller's
 * session with the new one it creates. For an MFA user that silently swaps an
 * AAL2 session for an AAL1 session mid-request. This uses a throwaway client
 * that persists nothing, and revokes the session it had to create.
 *
 * Returns `true` only when Supabase accepted the credentials.
 */
export async function verifyPasswordWithoutSession(
  email: string,
  password: string,
): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase is not configured');
  }

  const probe = createClient(url, key, {
    global: { fetch: fetchWithTimeout },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data, error } = await probe.auth.signInWithPassword({ email, password });
  if (error || !data.session) return false;

  // Revoke only the probe's own session; never the caller's.
  const { error: signOutError } = await probe.auth.signOut({ scope: 'local' });
  if (signOutError) {
    logger.warn('Password probe session could not be revoked', { error: signOutError.message });
  }
  return true;
}
