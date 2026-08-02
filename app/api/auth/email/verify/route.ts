import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  jsonSuccess,
  jsonError,
  parseJsonBody,
  BODY_SIZE_LIMITS,
  ERROR_CODES,
} from '@/app/api/_lib/response';
import { hashToken } from '@/lib/security/emailVerification';
import { emailVerifyTokenLimiter } from '@/lib/services/rateLimitService';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const verifySchema = z.object({
  token: z
    .string()
    .length(64)
    .regex(/^[0-9a-f]{64}$/),
});

/**
 * POST /api/auth/email/verify
 *
 * Verifies an email verification token.
 * - Hashes the incoming token
 * - Finds a matching non-used, non-expired record
 * - Marks the token as used
 * - Marks the user as email-verified via admin API
 *
 * SECURITY: Returns generic error for all failure cases (no information leakage).
 */
export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    if (!adminClient) {
      return jsonError(
        'Email verification is not available',
        503,
        ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      );
    }

    // SECURITY: Rate limit token verification to prevent brute-force
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimitResult = await emailVerifyTokenLimiter(`ip:${ip}:email-verify`);
    if (!rateLimitResult.allowed) {
      return jsonError(
        `Too many attempts. Try again in ${rateLimitResult.resetIn} seconds.`,
        429,
        ERROR_CODES.RATE_LIMITED,
      );
    }

    // 1. Parse and validate body
    const { data: body, error: parseError } = await parseJsonBody(request, BODY_SIZE_LIMITS.AUTH);
    if (parseError) return parseError;

    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      // SECURITY: Generic message — don't reveal token format requirements
      return jsonError('Invalid or expired verification link', 400, ERROR_CODES.BAD_REQUEST);
    }

    const { token } = parsed.data;
    const tokenHash = hashToken(token);

    // 2. Find matching non-used, non-expired token
    const { data: record, error: lookupError } = await adminClient
      .from('email_verifications')
      .select('id, user_id')
      .eq('token_hash', tokenHash)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .single();

    if (lookupError || !record) {
      // SECURITY: Same message for "not found", "expired", and "already used"
      return jsonError('Invalid or expired verification link', 400, ERROR_CODES.BAD_REQUEST);
    }

    // 3. Claim the token: conditional update whose ROW COUNT decides the winner.
    //
    // BA-0006: the `.eq('used', false)` guard was already here and the comment
    // claimed atomicity, but the result was discarded and only `updateError`
    // was checked. A conditional UPDATE matching zero rows is not an error, so
    // the loser of a concurrent race saw `updateError === null` and proceeded to
    // confirm the email with an already-spent token.
    const { data: claimed, error: updateError } = await adminClient
      .from('email_verifications')
      .update({ used: true })
      .eq('id', record.id)
      .eq('used', false)
      .select('id');

    if (updateError) {
      logger.error('Failed to mark verification token used', {
        tokenId: record.id,
        error: updateError.message,
      });
      return jsonError('Verification failed', 500, ERROR_CODES.INTERNAL_ERROR);
    }

    if (!claimed || claimed.length !== 1) {
      // Another request claimed it first. SECURITY: same message as "not found",
      // "expired" and "already used".
      return jsonError('Invalid or expired verification link', 400, ERROR_CODES.BAD_REQUEST);
    }

    // 4. Mark user as email-verified via admin API
    const { error: userUpdateError } = await adminClient.auth.admin.updateUserById(record.user_id, {
      email_confirm: true,
      user_metadata: {
        email_verified_at: new Date().toISOString(),
        email_verified_method: 'custom_token',
      },
    });

    if (userUpdateError) {
      logger.error('Failed to confirm user email', {
        userId: record.user_id,
        error: userUpdateError.message,
      });
      return jsonError('Verification failed', 500, ERROR_CODES.INTERNAL_ERROR);
    }

    logger.info('Email verified successfully', { userId: record.user_id });

    return jsonSuccess({ verified: true });
  } catch (error) {
    logger.error('Email verify error:', error);
    return jsonError('Verification failed', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
