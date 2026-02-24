import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  jsonSuccess,
  jsonError,
  parseJsonBody,
  BODY_SIZE_LIMITS,
  ERROR_CODES,
} from '@/app/api/_lib/response';
import {
  emailVerifyResendLimiter,
  createAndSendVerification,
} from '@/lib/security/emailVerification';
import { getClientIP } from '@/lib/security/ip';
import { emailKeyPrefix } from '@/lib/security/identifiers';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const resendSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

// SECURITY: Always return generic success to prevent account enumeration.
const GENERIC_RESEND_SUCCESS =
  'If this email is registered, you will receive a confirmation email shortly.';

/**
 * POST /api/auth/email/resend-verification
 *
 * Resend verification email by email address (unauthenticated).
 * - Rate limited by ip+hashed email
 * - Anti-enumeration: always returns success (except 429)
 */
export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);

  try {
    const { data: body, error: bodyError } = await parseJsonBody(request, BODY_SIZE_LIMITS.AUTH);
    if (bodyError) return bodyError;

    const parsed = resendSchema.safeParse(body);
    if (!parsed.success) {
      return jsonSuccess({ sent: true, message: GENERIC_RESEND_SUCCESS });
    }

    const email = parsed.data.email;
    const rateKey = `ip:${clientIP}:em:${emailKeyPrefix(email)}`;
    const { allowed, remaining, resetIn } = await emailVerifyResendLimiter(rateKey);

    if (!allowed) {
      return jsonError(
        'Too many requests. Please try again later.',
        429,
        ERROR_CODES.RATE_LIMITED,
        { retryAfter: resetIn, remaining },
      );
    }

    const adminClient = createAdminClient();
    if (!adminClient) {
      return jsonSuccess({ sent: true, message: GENERIC_RESEND_SUCCESS });
    }

    // Look up user id without loading all users into memory.
    const { data: lookup, error: lookupError } = await adminClient.rpc('lookup_user_by_email', {
      lookup_email: email,
    });

    const record = Array.isArray(lookup) ? lookup[0] : null;
    const userId = record?.user_id as string | undefined;

    if (!userId || lookupError) {
      return jsonSuccess({ sent: true, message: GENERIC_RESEND_SUCCESS });
    }

    // Avoid sending if already confirmed (best-effort).
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(userId);
    const alreadyConfirmed = !userError && Boolean(userData?.user?.email_confirmed_at);
    if (alreadyConfirmed) {
      return jsonSuccess({ sent: true, message: GENERIC_RESEND_SUCCESS });
    }

    const sendResult = await createAndSendVerification(adminClient, userId, email);
    if (!sendResult.success) {
      logger.error('Failed to resend verification email', { userId });
    }

    return jsonSuccess({ sent: true, message: GENERIC_RESEND_SUCCESS });
  } catch (error) {
    logger.error('Resend verification error:', error);
    return jsonSuccess({ sent: true, message: GENERIC_RESEND_SUCCESS });
  }
}
