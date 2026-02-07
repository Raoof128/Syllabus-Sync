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
import { smsSendLimiter, isValidE164Phone } from '@/lib/security/mfa';
import { getClientIP } from '@/lib/security/ip';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const smsEnrollSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{6,14}$/, 'Invalid phone number (E.164 format required)'),
});

/**
 * POST /api/auth/mfa/sms/enroll
 * Enrolls a phone number for SMS MFA.
 */
export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const { allowed, remaining, resetIn } = await smsSendLimiter(clientIP);

  if (!allowed) {
    return jsonError(
      `Too many SMS requests. Try again in ${Math.ceil(resetIn / 60)} minutes.`,
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

    const parsed = smsEnrollSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        'Invalid phone number. Use E.164 format (e.g., +61412345678).',
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const { phone } = parsed.data;

    if (!isValidE164Phone(phone)) {
      return jsonError('Invalid phone number format', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'phone',
      phone,
      friendlyName: `SMS (${phone.slice(-4)})`,
    });

    if (error) {
      logger.error('SMS MFA enrollment error:', {
        userId: user.id,
        error: error.message,
      });

      // Check for specific error types
      if (error.message?.includes('not enabled') || error.message?.includes('phone')) {
        return jsonError(
          'SMS verification is not configured for this project. Contact your administrator.',
          503,
          ERROR_CODES.EXTERNAL_SERVICE_ERROR,
        );
      }

      return jsonError('Failed to start SMS verification', 400, ERROR_CODES.BAD_REQUEST);
    }

    logger.info('SMS MFA enrollment started', {
      userId: user.id,
      factorId: data.id,
    });

    return jsonSuccess({
      factorId: data.id,
      phone: `****${phone.slice(-4)}`,
    });
  } catch (error) {
    logger.error('SMS enroll error:', error);
    return jsonError('Failed to set up SMS verification', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
