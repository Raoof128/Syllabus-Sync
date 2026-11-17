/**
 * Account deletion.
 *
 * Q3/Q4 (external security and privacy review, 2026-08-17): the reviewer could
 * find no code path that deletes a user account, and was right.
 *
 * `DELETE /api/profiles` removes the caller's `profiles` and `user_preferences`
 * rows and nothing else. Every other user table foreign-keys to `auth.users`
 * rather than to `profiles` (migration 20260124000000), so the cascade fires on
 * `auth.users` and deleting a `profiles` row cascades to nothing. The auth user,
 * email, password hash, MFA secrets, passkey credentials and sessions all
 * survived, and so did every row of academic data.
 *
 * Meanwhile the privacy policy told users "You may request account deletion at
 * any time via your account settings" (locales/en/translations.json), and the
 * i18n strings for a delete control existed in all 34 locales with no component
 * rendering them. The promise was live; the feature was not.
 *
 * No migration is needed. The `ON DELETE CASCADE` constraints already exist and
 * are what makes manual deletion from the Supabase dashboard work correctly.
 * What was missing was the route that triggers them.
 *
 * Order of operations matters and is deliberate:
 *   1. Re-authenticate. Deletion is irreversible, so a stolen session must not
 *      be enough on its own.
 *   2. Write the audit row *first*, while the caller still has a session and
 *      `log_audit()` can attribute it to them. `audit_logs.user_id` is
 *      `ON DELETE SET NULL`, so the row outlives the account with the id kept
 *      in metadata.
 *   3. Delete the auth user with the service-role client, letting the existing
 *      cascades remove everything else.
 *
 * Fails closed throughout: any step that cannot be completed aborts before
 * anything is destroyed, per the AGENT.md mandate for security-critical paths.
 */

import type { NextRequest } from 'next/server';
import type { UserIdentity } from '@supabase/supabase-js';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  jsonSuccess,
  jsonError,
  ERROR_CODES,
  parseJsonBody,
  BODY_SIZE_LIMITS,
} from '@/app/api/_lib/response';
import { requireAuthWithRateLimit } from '@/app/api/_lib/middleware';
import { logAuditServer } from '@/lib/security/audit';
import { logAuthAuditEvent } from '@/lib/security/auth-audit';
import { logger } from '@/lib/logger';

/**
 * Confirmation payload.
 *
 * `password` is required for accounts that hold an email identity.
 * `confirmEmail` is the path for OAuth-only accounts, which have no password to
 * re-enter: the user must type their own address, which is shown to them. Both
 * are optional at the schema level because which one applies depends on the
 * account, and the route decides after loading the user's identities.
 */
const deleteAccountSchema = z.object({
  password: z.string().min(1).max(1024).optional(),
  confirmEmail: z.string().email().optional(),
});

async function handleDelete(request: NextRequest, userId: string) {
  const supabase = await createServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || user.id !== userId) {
    return jsonError('Unable to verify your session', 401, ERROR_CODES.UNAUTHORIZED);
  }

  // NOTE: two different `parseJsonBody` helpers exist in this codebase —
  // app/api/_lib/response.ts returns `{ data, error: NextResponse }` and
  // app/api/_lib/middleware.ts returns `{ success, data | error: string }`.
  // Mixing them silently rejects every request with a 413, which is how the
  // first version of this route behaved until its tests caught it. This is the
  // response.ts contract; return the error response as-is.
  const { data: body, error: bodyError } = await parseJsonBody(request, BODY_SIZE_LIMITS.AUTH);
  if (bodyError) return bodyError;

  const parsed = deleteAccountSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Invalid confirmation payload', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  // SECURITY: resolve the admin client before destroying anything. If the
  // service-role key is absent we must refuse outright rather than
  // re-authenticate the user, tell them it worked, and delete nothing.
  const admin = createAdminClient();
  if (!admin) {
    logger.error('Account deletion unavailable: no service-role client configured');
    return jsonError(
      'Account deletion is temporarily unavailable. Please contact support.',
      503,
      ERROR_CODES.INTERNAL_ERROR,
    );
  }

  const hasPasswordIdentity = (user.identities ?? []).some(
    (identity: UserIdentity) => identity.provider === 'email',
  );

  // ---- Step 1: re-authenticate -------------------------------------------
  if (hasPasswordIdentity) {
    const { password } = parsed.data;
    if (!password) {
      return jsonError(
        'Your password is required to delete your account',
        400,
        ERROR_CODES.BAD_REQUEST,
      );
    }

    // Verified server-side, matching the pattern in
    // app/api/auth/password/route.ts, so the client never handles the result of
    // a sign-in it did not ask for.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password,
    });

    if (reauthError) {
      logAuthAuditEvent('signin_failed', request, {
        userId,
        context: 'account_deletion_reauth',
      });
      return jsonError('Password is incorrect', 400, ERROR_CODES.BAD_REQUEST);
    }
  } else {
    // OAuth-only account: no password exists to re-enter, so require the user
    // to type the address the account belongs to.
    const { confirmEmail } = parsed.data;
    if (!confirmEmail || confirmEmail.toLowerCase() !== (user.email ?? '').toLowerCase()) {
      return jsonError(
        'Please type your account email address to confirm deletion',
        400,
        ERROR_CODES.BAD_REQUEST,
      );
    }
  }

  // ---- Step 2: audit before destroying ------------------------------------
  // Written while the caller still holds a session, because log_audit() pins
  // the actor to auth.uid() and cannot attribute a row for a user that no
  // longer exists. audit_logs.user_id is ON DELETE SET NULL, so the row
  // survives the cascade; the id is duplicated into metadata so the trail is
  // still readable afterwards.
  const auditId = await logAuditServer(userId, {
    action: 'DELETE',
    tableName: 'auth.users',
    recordId: userId,
    severity: 'critical',
    metadata: {
      category: 'account_deletion',
      deletedUserId: userId,
      requestedAt: new Date().toISOString(),
      method: hasPasswordIdentity ? 'password_reauth' : 'email_confirmation',
    },
  });

  if (!auditId) {
    // Fail closed. An untraceable irreversible deletion is worse than a failed
    // one: the user can retry, but we could never afterwards show what happened.
    logger.error('Account deletion aborted: audit row could not be written', { userId });
    return jsonError(
      'Account deletion could not be recorded. Nothing has been deleted. Please try again.',
      500,
      ERROR_CODES.INTERNAL_ERROR,
    );
  }

  // ---- Step 3: delete -----------------------------------------------------
  // Everything else goes with it through the ON DELETE CASCADE constraints on
  // auth.users: profiles, user_preferences, units, deadlines, events,
  // notifications, gamification_profiles, xp_events, todos, push_subscriptions,
  // sessions and passkey credentials.
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);

  if (deleteError) {
    logger.error('Account deletion failed at the auth layer', deleteError.message);
    return jsonError(
      'Failed to delete your account. Nothing has been deleted. Please contact support.',
      500,
      ERROR_CODES.INTERNAL_ERROR,
    );
  }

  logAuthAuditEvent('signout_success', request, {
    userId,
    context: 'account_deleted',
    auditId,
  });

  // Best effort: the session's user no longer exists, so this mostly clears
  // cookies. A failure here must not turn a completed deletion into an error.
  try {
    await supabase.auth.signOut();
  } catch (signOutError) {
    logger.warn('Sign-out after account deletion failed (non-fatal)', signOutError);
  }

  return jsonSuccess({ deleted: true, auditId });
}

export async function DELETE(request: NextRequest) {
  return requireAuthWithRateLimit(
    request,
    async (userId: string) => {
      try {
        return await handleDelete(request, userId);
      } catch (error) {
        logger.error('Account deletion error:', error);
        return jsonError('Internal server error', 500, ERROR_CODES.INTERNAL_ERROR);
      }
    },
    'account-delete',
  );
}
