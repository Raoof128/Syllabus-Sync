import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  jsonSuccess,
  jsonError,
  jsonUnauthorized,
  ERROR_CODES,
} from '@/app/api/_lib/response';
import {
  generateVerificationToken,
  hashToken,
  getTokenExpiry,
  emailVerifySendLimiter,
} from '@/lib/security/emailVerification';
import { sendVerificationEmail } from '@/lib/services/emailService';
import { getClientIP } from '@/lib/security/ip';
import { logger } from '@/lib/logger';

/**
 * POST /api/auth/email/send-verification
 *
 * Sends a verification email to the authenticated user.
 * - Invalidates any previous active tokens for this user
 * - Generates a new token (32 random bytes, hex)
 * - Stores SHA-256 hash in DB (never the raw token)
 * - Sends branded HTML email via Resend
 */
export async function POST(request: NextRequest) {
  // 1. Rate limit (3 sends per hour per IP)
  const clientIP = getClientIP(request);
  const { allowed, remaining, resetIn } = await emailVerifySendLimiter(clientIP);

  if (!allowed) {
    logger.warn('Email verification rate limit exceeded', { clientIP });
    return jsonError(
      'Too many requests. Please try again later.',
      429,
      ERROR_CODES.RATE_LIMITED,
      { retryAfter: resetIn, remaining },
    );
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

    // 4. Invalidate previous tokens for this user
    await adminClient
      .from('email_verifications')
      .update({ used: true })
      .eq('user_id', user.id)
      .eq('used', false);

    // 5. Generate token and store hash
    const rawToken = generateVerificationToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = getTokenExpiry();

    const { error: insertError } = await adminClient.from('email_verifications').insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      logger.error('Failed to store verification token', {
        userId: user.id,
        error: insertError.message,
      });
      return jsonError('Failed to send verification email', 500, ERROR_CODES.INTERNAL_ERROR);
    }

    // 6. Send email via Resend (raw token in URL, NOT logged)
    const email = user.email;
    if (!email) {
      return jsonError('No email address on account', 400, ERROR_CODES.BAD_REQUEST);
    }

    const result = await sendVerificationEmail({ to: email, token: rawToken });

    if (!result.success) {
      logger.error('Verification email send failed', { userId: user.id });
      return jsonError('Failed to send verification email', 500, ERROR_CODES.EXTERNAL_SERVICE_ERROR);
    }

    logger.info('Verification email sent', { userId: user.id });

    return jsonSuccess({ sent: true });
  } catch (error) {
    logger.error('Send verification error:', error);
    return jsonError('Failed to send verification email', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
