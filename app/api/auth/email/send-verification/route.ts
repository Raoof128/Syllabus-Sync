import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { jsonSuccess, jsonError, jsonUnauthorized, ERROR_CODES } from '@/app/api/_lib/response';
import {
  emailVerifySendLimiter,
  createAndSendVerification,
} from '@/lib/security/emailVerification';
import { getClientIP } from '@/lib/security/ip';
import { logger } from '@/lib/logger';

/**
 * POST /api/auth/email/send-verification
 *
 * Sends a verification email to the authenticated user.
 * Used for resending verification emails (user already signed in).
 */
export async function POST(request: NextRequest) {
  // 1. Rate limit (3 sends per hour per IP)
  const clientIP = getClientIP(request);
  const { allowed, remaining, resetIn } = await emailVerifySendLimiter(clientIP);

  if (!allowed) {
    logger.warn('Email verification rate limit exceeded', { clientIP });
    return jsonError('Too many requests. Please try again later.', 429, ERROR_CODES.RATE_LIMITED, {
      retryAfter: resetIn,
      remaining,
    });
  }

  try {
    // 2. Authenticate user
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonUnauthorized('Authentication required');
    }

    // 3. Check admin client
    const adminClient = createAdminClient();
    if (!adminClient) {
      return jsonError(
        'Email verification is not configured',
        503,
        ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      );
    }

    // 4. Check user has an email
    if (!user.email) {
      return jsonError('No email address on account', 400, ERROR_CODES.BAD_REQUEST);
    }

    // 5. Create token, store hash, send email
    const result = await createAndSendVerification(adminClient, user.id, user.email);

    if (!result.success) {
      return jsonError('Failed to send verification email', 500, ERROR_CODES.INTERNAL_ERROR);
    }

    return jsonSuccess({ sent: true });
  } catch (error) {
    logger.error('Send verification error:', error);
    return jsonError('Failed to send verification email', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
