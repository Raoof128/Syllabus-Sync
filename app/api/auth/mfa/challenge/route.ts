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
import { smsSendLimiter } from '@/lib/security/mfa';
import { getClientIP } from '@/lib/security/ip';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const challengeSchema = z.object({
  factorId: z.string().uuid(),
});

/**
 * POST /api/auth/mfa/challenge
 *
 * Creates an MFA challenge for an existing factor.
 *
 * - For phone factors, this triggers an SMS send.
 * - For TOTP factors, it generates a challenge ID used for verification.
 *
 * This endpoint exists to support correct SMS flows (challenge -> verify)
 * and to allow "resend code" without consuming verification attempts.
 */
export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const { allowed, remaining, resetIn } = await smsSendLimiter(`mfa-challenge:${clientIP}`);

  if (!allowed) {
    return jsonError(
      `Too many requests. Try again in ${Math.ceil(resetIn / 60)} minutes.`,
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

    const parsed = challengeSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid request', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const { factorId } = parsed.data;

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeError || !challenge) {
      logger.error('MFA challenge error:', {
        userId: user.id,
        factorId,
        error: challengeError?.message,
      });
      return jsonError('Failed to create verification challenge', 400, ERROR_CODES.BAD_REQUEST);
    }

    return jsonSuccess({
      challengeId: challenge.id,
      expiresAt: (challenge as { expires_at?: string }).expires_at,
    });
  } catch (error) {
    logger.error('MFA challenge error:', error);
    return jsonError('Failed to create verification challenge', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
