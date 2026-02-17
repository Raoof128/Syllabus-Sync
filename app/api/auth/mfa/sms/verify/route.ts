import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  jsonSuccess,
  jsonError,
  jsonUnauthorized,
  parseJsonBody,
  BODY_SIZE_LIMITS,
  ERROR_CODES,
} from '@/app/api/_lib/response';
import { mfaVerifyLimiter } from '@/lib/security/mfa';
import { getClientIP } from '@/lib/security/ip';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const smsVerifySchema = z.object({
  factorId: z.string().uuid(),
  challengeId: z.string().uuid(),
  code: z
    .string()
    .min(6)
    .max(6)
    .regex(/^\d{6}$/),
});

/**
 * POST /api/auth/mfa/sms/verify
 * Verifies an SMS code during enrollment or login challenge.
 */
export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const { allowed, remaining, resetIn } = await mfaVerifyLimiter(clientIP);

  if (!allowed) {
    return jsonError(
      `Too many verification attempts. Try again in ${Math.ceil(resetIn / 60)} minutes.`,
      429,
      ERROR_CODES.RATE_LIMITED,
      { retryAfter: resetIn, remaining },
    );
  }

  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonUnauthorized('Authentication required');
    }

    const { data: body, error: parseError } = await parseJsonBody(request, BODY_SIZE_LIMITS.AUTH);
    if (parseError) return parseError;

    const parsed = smsVerifySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid verification code', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const { factorId, code } = parsed.data;
    const { challengeId } = parsed.data;

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });

    if (verifyError) {
      logger.warn('SMS verification failed:', {
        userId: user.id,
        factorId,
        error: verifyError.message,
      });
      return jsonError('Invalid verification code', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    logger.info('SMS MFA verified', {
      userId: user.id,
      factorId,
    });

    return jsonSuccess({
      verified: true,
      factorId,
    });
  } catch (error) {
    logger.error('SMS verify error:', error);
    return jsonError('Verification failed', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
