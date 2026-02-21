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
import { mfaVerifyLimiter, isValidTOTPCode } from '@/lib/security/mfa';
import { getClientIP } from '@/lib/security/ip';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const verifySchema = z.object({
  factorId: z.string().uuid(),
  code: z
    .string()
    .length(6)
    .regex(/^\d{6}$/),
});

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

    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid verification code format', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const { factorId, code } = parsed.data;

    if (!isValidTOTPCode(code)) {
      return jsonError('Invalid verification code', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // Create challenge then verify
    logger.info('Creating MFA challenge for enrollment verification', { userId: user.id, factorId });
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeError || !challenge) {
      logger.error('MFA enrollment challenge error:', {
        userId: user.id,
        factorId,
        error: challengeError?.message,
      });
      return jsonError('Failed to create verification challenge. Please refresh and try again.', 400, ERROR_CODES.BAD_REQUEST);
    }

    logger.info('Verifying MFA code', { userId: user.id, factorId, challengeId: challenge.id });
    const { data: verify, error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });

    if (verifyError || !verify) {
      logger.warn('MFA enrollment verification failed:', {
        userId: user.id,
        factorId,
        error: verifyError?.message,
      });
      return jsonError('Invalid verification code. Please check your app and try again.', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    logger.info('MFA TOTP verified successfully', { userId: user.id });

    return jsonSuccess({
      verified: true,
      factorId,
    });
  } catch (error) {
    logger.error('MFA verify error:', error);
    return jsonError('Verification failed', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
