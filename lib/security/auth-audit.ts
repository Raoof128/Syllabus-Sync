/**
 * Authentication audit logging.
 *
 * Q3 (external security and privacy review, 2026-08-17): the reviewer asked
 * whether login events are audited. They were not.
 *
 * `lib/security/audit.ts` has exported `logAuthEvent` with a `LOGIN` action
 * since January, and `lib/security/index.ts` re-exports it, but nothing has
 * ever called it. `app/api/auth/signin/route.ts` wrote no audit row on success
 * or failure, and `signout` wrote none at all. Signup-side events were covered,
 * which is what made the gap easy to miss: `auth_audit_logs` was never empty,
 * it just never contained a sign-in.
 *
 * Supabase's own auth logs do record sign-ins, so this was not a total blind
 * spot, but our audit trail could not answer "who signed in, from where, and
 * when" without leaving the application.
 *
 * Why this writes through the service-role client rather than
 * `logAuditServer()`: a failed sign-in has no session, so the cookie-bound
 * server client is `anon`, and migration 20260729110000 revoked EXECUTE on
 * `log_audit` from `anon` (BA-0029). A failed-login audit row is exactly the
 * one you most want, so it has to be written by a client that is not the
 * caller. `auth_audit_logs` accepts inserts from `service_role` only and is
 * readable by no one, which is the right shape for this.
 */

import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getClientIP } from '@/lib/security/ip';
import { emailKeyPrefix } from '@/lib/security/identifiers';
import { logger } from '@/lib/logger';

/**
 * Authentication events recorded to `auth_audit_logs`.
 *
 * Signup-side values are already written by `app/api/auth/signup/route.ts`
 * using its own local helper; they are listed here so the vocabulary stays in
 * one place even though that route has not been migrated to this module.
 */
export type AuthAuditEvent =
  | 'signin_success'
  | 'signin_failed'
  | 'signin_provider_mismatch'
  | 'signout_success'
  | 'signout_failed';

/**
 * Record an authentication event.
 *
 * Fire-and-forget by design: an audit write must never add latency to, or fail,
 * a sign-in. It degrades silently when the service-role key is absent (local
 * development and preview builds), matching the signup route's behaviour.
 *
 * Never pass a raw email address or password in `metadata`. Use
 * `userIdentifier()` for a non-reversible handle on the account involved.
 */
export function logAuthAuditEvent(
  event: AuthAuditEvent,
  request: NextRequest,
  metadata: Record<string, unknown> = {},
): void {
  const admin = createAdminClient();
  if (!admin) return;

  void admin
    .from('auth_audit_logs')
    .insert({
      event_type: event,
      ip_address: getClientIP(request),
      user_agent: request.headers.get('user-agent') ?? 'unknown',
      metadata,
    })
    .then(({ error }: { error: unknown }) => {
      if (error) logger.error('Auth audit log failed:', error);
    });
}

/**
 * A non-reversible handle for the account an event concerns.
 *
 * Uses the same hashed prefix the login rate limiter keys on, so an audit row
 * and a rate-limit bucket can be correlated during an incident without either
 * one storing the address. Recording the plaintext email on a *failed* login
 * would build a list of attempted accounts in a table nobody can read but the
 * service role, which is a liability rather than an aid.
 */
export function userIdentifier(email: string): string {
  return emailKeyPrefix(email);
}
