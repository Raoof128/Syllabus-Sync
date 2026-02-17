import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
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
import { passwordResetRequestLimiter } from '@/lib/security/passwordReset';

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
 * Sends a password reset link to the user via Supabase's native email (SMTP).
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
    const { data: body, error: parseError } = await parseJsonBody(request, BODY_SIZE_LIMITS.AUTH);
    if (parseError) return parseError;

    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid request', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const { email } = parsed.data;

    // Use Supabase's native resetPasswordForEmail
    // This sends email via the SMTP configured in Supabase dashboard
    const supabase = await createServerClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Redirect directly to /reset-password - Supabase will add tokens in hash fragment
    // The reset-password page listens for PASSWORD_RECOVERY event
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/reset-password`,
    });

    if (error) {
      // Log error but return generic success for anti-enumeration
      logger.warn('Password reset request error', {
        message: error.message,
        email_hint: email.substring(0, 3) + '***'
      });
    }

    return jsonSuccess(GENERIC_SUCCESS);
  } catch (error) {
    logger.error('Password reset request error', error);
    return jsonSuccess(GENERIC_SUCCESS);
  }
}
