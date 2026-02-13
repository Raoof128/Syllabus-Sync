/**
 * Email Verification Token Utilities
 *
 * SECURITY:
 * - Tokens are 32 random bytes (hex-encoded)
 * - Only SHA-256 hashes are stored in the database
 * - Tokens expire after 20 minutes
 * - Only 1 active token per user (previous tokens invalidated on new request)
 * - Raw tokens must NEVER appear in logs
 */

import { randomBytes, createHash } from 'crypto';
import { createRateLimiter } from '@/lib/services/rateLimitService';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Token expiry: 20 minutes */
export const EMAIL_VERIFY_TOKEN_EXPIRY_MS = 20 * 60 * 1000;

/** Max verification email sends per hour per user */
export const EMAIL_VERIFY_MAX_SENDS_PER_HOUR = 3;

// ============================================================================
// RATE LIMITERS
// ============================================================================

/** Rate limiter for sending verification emails (3 per hour per user) */
export const emailVerifySendLimiter = createRateLimiter({
  prefix: 'email-verify-send',
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: EMAIL_VERIFY_MAX_SENDS_PER_HOUR,
  failClosed: true,
});

// ============================================================================
// TOKEN FUNCTIONS
// ============================================================================

/**
 * Generate a cryptographically secure verification token.
 * Returns the raw hex token (to be sent to the user via email).
 */
export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Hash a token using SHA-256.
 * Only the hash is stored in the database.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Compute the expiry timestamp for a new token.
 */
export function getTokenExpiry(): Date {
  return new Date(Date.now() + EMAIL_VERIFY_TOKEN_EXPIRY_MS);
}
