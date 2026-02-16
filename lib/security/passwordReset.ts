/**
 * Password Reset Utilities (Custom, via Resend)
 *
 * SECURITY:
 * - Tokens are 32 random bytes (hex-encoded)
 * - Only SHA-256 hashes are stored in the database
 * - Tokens expire after 20 minutes
 * - Only 1 active token per user at a time (previous tokens invalidated on new request)
 * - Raw tokens must NEVER appear in logs
 * - All flows are anti-enumeration (same response whether a user exists or not)
 */

import { randomBytes, createHash } from 'crypto';
import { createRateLimiter } from '@/lib/services/rateLimitService';
import { logger } from '@/lib/logger';
import { sendPasswordResetEmail } from '@/lib/services/emailService';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Token expiry: 20 minutes */
export const PASSWORD_RESET_TOKEN_EXPIRY_MS = 20 * 60 * 1000;

/** Max reset emails per hour per IP */
export const PASSWORD_RESET_MAX_SENDS_PER_HOUR = 5;

// ============================================================================
// RATE LIMITERS
// ============================================================================

/** Rate limiter for requesting password reset emails */
export const passwordResetRequestLimiter = createRateLimiter({
  prefix: 'password-reset-request',
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: PASSWORD_RESET_MAX_SENDS_PER_HOUR,
  failClosed: true,
});

// ============================================================================
// TOKEN FUNCTIONS
// ============================================================================

/**
 * Generate a cryptographically secure reset token (hex).
 */
export function generatePasswordResetToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Hash a token using SHA-256.
 */
export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Compute expiry timestamp for a new token.
 */
export function getResetTokenExpiry(): Date {
  return new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_MS);
}

// ============================================================================
// ORCHESTRATOR
// ============================================================================

/**
 * Create a password reset token, store its hash, and send the email.
 *
 * @param adminClient - Supabase admin client (service_role)
 * @param userId - User UUID
 * @param email - User email address
 */
export async function createAndSendPasswordReset(
  adminClient: SupabaseClient,
  userId: string,
  email: string,
): Promise<{ success: boolean; error?: string }> {
  // 1. Invalidate previous active tokens for this user
  await adminClient
    .from('password_resets')
    .update({ used: true })
    .eq('user_id', userId)
    .eq('used', false);

  // 2. Create token and store hash
  const rawToken = generatePasswordResetToken();
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = getResetTokenExpiry();

  const { data: inserted, error: insertError } = await adminClient
    .from('password_resets')
    .insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single();

  if (insertError) {
    logger.error('Failed to store password reset token', { userId, error: insertError.message });
    return { success: false, error: 'Failed to create password reset token' };
  }

  // 3. Send email (raw token in URL, never logged)
  const result = await sendPasswordResetEmail({ to: email, token: rawToken });

  if (!result.success) {
    // Best-effort cleanup: don't leave a valid unused token if email never left.
    if (inserted?.id) {
      await adminClient.from('password_resets').delete().eq('id', inserted.id);
    }
    logger.error('Password reset email send failed', { userId });
    return { success: false, error: 'Failed to send password reset email' };
  }

  logger.info('Password reset email sent', { userId });
  return { success: true };
}

