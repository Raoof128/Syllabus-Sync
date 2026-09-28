import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { jsonSuccess, jsonError, ERROR_CODES } from '@/app/api/_lib/response';
import { passwordResetLimiter } from '@/lib/services/rateLimitService';
import { parseJsonBody } from '@/app/api/_lib/middleware';
import { requireAal2IfEnrolled, verifyPasswordWithoutSession } from '@/app/api/_lib/aal';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// SECURITY: Stronger password policy - min 12 chars
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(12, 'New password must be at least 12 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonError('Not authenticated', 401, ERROR_CODES.UNAUTHORIZED);
    }

    // SECURITY: Rate limit by user ID using distributed store (works in serverless)
    const { allowed, remaining, resetIn } = await passwordResetLimiter(user.id);
    if (!allowed) {
      return jsonError(
        `Too many password change attempts. Please try again in ${Math.ceil(resetIn / 60)} minutes.`,
        429,
        ERROR_CODES.RATE_LIMITED,
        { retryAfter: resetIn },
      );
    }

    // Parse and validate body - SECURITY: Parse with size limit protection
    const bodyResult = await parseJsonBody(request);
    if (!bodyResult.success) {
      return jsonError(bodyResult.error, 413, ERROR_CODES.VALIDATION_ERROR);
    }
    const parsed = passwordChangeSchema.safeParse(bodyResult.data);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return jsonError(
        firstError?.message || 'Invalid request data',
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    // BA-0064: /api/auth/* is outside the middleware's AAL2 gate, so a
    // password alone must not be enough to replace the password of an account
    // that has a second factor.
    const stepUp = await requireAal2IfEnrolled(supabase, user.id, 'Password change');
    if (stepUp) return stepUp;

    if (!user.email) {
      return jsonError(
        'Password change is not available for this account',
        400,
        ERROR_CODES.BAD_REQUEST,
      );
    }

    // Verify the current password WITHOUT touching the caller's session. This
    // used to call signInWithPassword on the cookie-bound client, which
    // replaced the caller's (possibly AAL2) session with a new AAL1 one before
    // updateUser ran.
    const passwordOk = await verifyPasswordWithoutSession(user.email, currentPassword);

    if (!passwordOk) {
      return jsonError('Current password is incorrect', 400, ERROR_CODES.BAD_REQUEST, {
        remainingAttempts: remaining,
      });
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      // SECURITY: Don't expose internal Supabase error messages to client
      logger.error('Password update failed:', updateError.message);
      return jsonError(
        'Failed to update password. Please try again.',
        400,
        ERROR_CODES.BAD_REQUEST,
      );
    }

    // SECURITY (BA-0005): revoke every other session so a stolen/leaked
    // session (or the very compromise that motivated this password change)
    // cannot outlive it. Uses Supabase's native session revocation - the
    // same `auth.signOut({ scope })` mechanism already used by the manual
    // "sign out other devices" action in POST /api/auth/sessions - rather
    // than lib/security/session-termination.ts, which is dead code: it
    // reads/writes a `user_sessions` table that nothing in the app ever
    // inserts into, so it would always operate on zero rows. `scope:
    // 'others'` keeps the current session (the one that just proved
    // knowledge of the current password) signed in.
    const { error: signOutOthersError } = await supabase.auth.signOut({ scope: 'others' });
    if (signOutOthersError) {
      logger.error(
        'Failed to revoke other sessions after password change:',
        signOutOthersError.message,
      );
    }

    return jsonSuccess({
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error('Password change error:', error);
    return jsonError('Internal server error', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
