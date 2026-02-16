import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  jsonSuccess,
  jsonError,
  parseJsonBody,
  BODY_SIZE_LIMITS,
  ERROR_CODES,
} from '@/app/api/_lib/response';
import { getClientIP } from '@/lib/security/ip';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import {
  passwordResetRequestLimiter,
  createAndSendPasswordReset,
} from '@/lib/security/passwordReset';

const requestSchema = z.object({
  email: z
    .string()
    .email()
    .transform((v) => v.trim().toLowerCase()),
});

// SECURITY: Anti-enumeration. Always return the same success response.
const GENERIC_SUCCESS = {
  sent: true,
  message: 'If an account exists for this email, you will receive a reset link shortly.',
};

/**
 * POST /api/auth/password/request-reset
 *
 * Sends a password reset link to the user via Resend.
 * This endpoint is anti-enumeration: it always returns success.
 */
export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const { allowed, remaining, resetIn } = await passwordResetRequestLimiter(clientIP);

  if (!allowed) {
    return jsonError('Too many requests. Please try again later.', 429, ERROR_CODES.RATE_LIMITED, {
      retryAfter: resetIn,
      remaining,
    });
  }

  try {
    const adminClient = createAdminClient();
    if (!adminClient) {
      // Graceful degradation: do not leak whether email exists.
      return jsonSuccess(GENERIC_SUCCESS);
    }

    const { data: body, error: parseError } = await parseJsonBody(request, BODY_SIZE_LIMITS.AUTH);
    if (parseError) return parseError;

    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid request', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const { email } = parsed.data;

    // Use service-role-only RPC to avoid listUsers / system table access.
    const { data: lookupResult, error: lookupError } = await adminClient.rpc(
      'lookup_user_by_email',
      { lookup_email: email },
    );

    if (lookupError) {
      logger.error('Password reset lookup error', { message: lookupError.message });
      return jsonSuccess(GENERIC_SUCCESS);
    }

    const userRow = Array.isArray(lookupResult) ? lookupResult[0] : lookupResult;
    const userId = userRow?.user_id as string | undefined;

    if (!userId) {
      return jsonSuccess(GENERIC_SUCCESS);
    }

    // Best-effort send. Still return generic response on failure.
    const sendResult = await createAndSendPasswordReset(adminClient, userId, email);
    if (!sendResult.success) {
      logger.warn('Password reset email not sent', { userId });
    }

    return jsonSuccess(GENERIC_SUCCESS);
  } catch (error) {
    logger.error('Password reset request error', error);
    return jsonSuccess(GENERIC_SUCCESS);
  }
}
