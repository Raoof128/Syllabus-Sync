import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  jsonSuccess,
  jsonError,
  parseJsonBody,
  BODY_SIZE_LIMITS,
  ERROR_CODES,
} from '@/app/api/_lib/response';
import { hashResetToken } from '@/lib/security/passwordReset';
import { isPasswordBreachBlocked } from '@/lib/security/password-breach';
import { passwordResetTokenLimiter } from '@/lib/services/rateLimitService';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { SECURITY_CONFIG } from '@/lib/constants/config';

const resetSchema = z.object({
  token: z
    .string()
    .length(64)
    .regex(/^[0-9a-f]{64}$/),
  newPassword: z.string().min(SECURITY_CONFIG.MIN_PASSWORD_LENGTH),
});

/**
 * POST /api/auth/password/reset
 *
 * Consumes a password reset token and sets a new password via Supabase admin API.
 *
 * SECURITY:
 * - Token lookup by SHA-256 hash only
 * - Atomic token consumption (used=false guard)
 * - Generic error messaging (no information leakage)
 */
export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    if (!adminClient) {
      return jsonError('Password reset is not available', 503, ERROR_CODES.EXTERNAL_SERVICE_ERROR);
    }

    // SECURITY: Rate limit token verification to prevent brute-force
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimitResult = await passwordResetTokenLimiter(`ip:${ip}:password-reset`);
    if (!rateLimitResult.allowed) {
      return jsonError(
        `Too many attempts. Try again in ${rateLimitResult.resetIn} seconds.`,
        429,
        ERROR_CODES.RATE_LIMITED,
      );
    }

    const { data: body, error: parseError } = await parseJsonBody(request, BODY_SIZE_LIMITS.AUTH);
    if (parseError) return parseError;

    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid or expired reset link', 400, ERROR_CODES.BAD_REQUEST);
    }

    const { token, newPassword } = parsed.data;

    // BA-0041: refuse known-breached passwords here too. Reset is the other route
    // by which a password enters the system, and it was equally unguarded.
    // Fails open if HIBP is unreachable — see isPasswordBreachBlocked().
    if (await isPasswordBreachBlocked(newPassword)) {
      return jsonError(
        'This password has appeared in a known data breach. Please choose a different one.',
        400,
        ERROR_CODES.VALIDATION_ERROR,
        { target: 'newPassword' },
      );
    }

    const tokenHash = hashResetToken(token);

    // 1) Find matching non-used, non-expired token
    const { data: record, error: lookupError } = await adminClient
      .from('password_resets')
      .select('id, user_id')
      .eq('token_hash', tokenHash)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .single();

    if (lookupError || !record) {
      return jsonError('Invalid or expired reset link', 400, ERROR_CODES.BAD_REQUEST);
    }

    // 2) Claim the token: conditional update whose ROW COUNT decides the winner.
    //
    // BA-0006: `.eq('used', false)` was already here, but the result was
    // discarded and only `updateError` was checked. A conditional UPDATE that
    // matches zero rows is not an error — it succeeds having changed nothing.
    // So two concurrent requests could both pass the step-1 lookup, both reach
    // here, and the loser would see `updateError === null` and go on to reset
    // the password with an already-spent token. The guard was present; its
    // verdict was thrown away.
    //
    // `.select('id')` makes PostgREST return the affected rows, so the claim is
    // decided by how many rows this statement actually took.
    const { data: claimed, error: updateError } = await adminClient
      .from('password_resets')
      .update({ used: true })
      .eq('id', record.id)
      .eq('used', false)
      .select('id');

    if (updateError) {
      logger.error('Failed to mark password reset token used', {
        tokenId: record.id,
        error: updateError.message,
      });
      return jsonError('Password reset failed', 500, ERROR_CODES.INTERNAL_ERROR);
    }

    if (!claimed || claimed.length !== 1) {
      // Another request claimed this token first. Same generic message as an
      // invalid or expired token, so nothing is disclosed about which case hit.
      return jsonError('Invalid or expired reset link', 400, ERROR_CODES.BAD_REQUEST);
    }

    // 3) Update password
    const { error: pwError } = await adminClient.auth.admin.updateUserById(record.user_id, {
      password: newPassword,
      user_metadata: {
        password_reset_at: new Date().toISOString(),
        password_reset_method: 'custom_token',
      },
    });

    if (pwError) {
      logger.error('Failed to update password', {
        userId: record.user_id,
        error: pwError.message,
      });
      return jsonError('Password reset failed', 500, ERROR_CODES.INTERNAL_ERROR);
    }

    logger.info('Password reset successful', { userId: record.user_id });
    return jsonSuccess({ reset: true });
  } catch (error) {
    logger.error('Password reset error', error);
    return jsonError('Password reset failed', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
