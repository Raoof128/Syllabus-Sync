import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { jsonSuccess, jsonError, jsonUnauthorized, ERROR_CODES } from '@/app/api/_lib/response';
import { emailVerifySendLimiter } from '@/lib/security/emailVerification';
import { getClientIP } from '@/lib/security/ip';
import { logger } from '@/lib/logger';

/**
 * POST /api/auth/email/send-verification
 *
 * Resends a verification email to the authenticated user via Supabase's native email.
 * Uses the SMTP configured in Supabase dashboard.
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

    // 3. Check user has an email
    if (!user.email) {
      return jsonError('No email address on account', 400, ERROR_CODES.BAD_REQUEST);
    }

    // 4. Use Supabase's native resend confirmation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback`,
      },
    });

    if (error) {
      logger.error('Failed to resend verification email:', {
        message: error.message,
        email_hint: user.email.substring(0, 3) + '***',
      });
      return jsonError('Failed to send verification email', 500, ERROR_CODES.INTERNAL_ERROR);
    }

    return jsonSuccess({ sent: true });
  } catch (error) {
    logger.error('Send verification error:', error);
    return jsonError('Failed to send verification email', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
