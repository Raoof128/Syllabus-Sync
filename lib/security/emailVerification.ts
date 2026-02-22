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

import { randomBytes, createHash } from "crypto";
import { createRateLimiter } from "@/lib/services/rateLimitService";
import { sendVerificationEmail } from "@/lib/services/emailService";
import { logger } from "@/lib/logger";
import type { SupabaseClient } from "@supabase/supabase-js";

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
  prefix: "email-verify-send",
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: EMAIL_VERIFY_MAX_SENDS_PER_HOUR,
  failClosed: true,
});

/**
 * Rate limiter for unauthenticated resend requests (keyed by ip+email hash).
 * We keep this separate from the authenticated resend limiter to avoid allowing
 * anonymous abuse of the user-scoped endpoint.
 */
export const emailVerifyResendLimiter = createRateLimiter({
  prefix: "email-verify-resend",
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
  return randomBytes(32).toString("hex");
}

/**
 * Hash a token using SHA-256.
 * Only the hash is stored in the database.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Compute the expiry timestamp for a new token.
 */
export function getTokenExpiry(): Date {
  return new Date(Date.now() + EMAIL_VERIFY_TOKEN_EXPIRY_MS);
}

// ============================================================================
// ORCHESTRATOR
// ============================================================================

/**
 * Create a verification token, store its hash, and send the email.
 *
 * Used by:
 * - Signup route (no user session — uses admin client)
 * - Send-verification route (authenticated — also uses admin client for DB)
 *
 * @param adminClient - Supabase admin client (service_role)
 * @param userId - User UUID
 * @param email - User email address
 * @returns success boolean and optional error message
 */
export async function createAndSendVerification(
  adminClient: SupabaseClient,
  userId: string,
  email: string,
): Promise<{ success: boolean; error?: string }> {
  // 1. Invalidate previous active tokens for this user
  await adminClient
    .from("email_verifications")
    .update({ used: true })
    .eq("user_id", userId)
    .eq("used", false);

  // 2. Generate token and store hash
  const rawToken = generateVerificationToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = getTokenExpiry();

  const { data: inserted, error: insertError } = await adminClient
    .from("email_verifications")
    .insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (insertError) {
    logger.error("Failed to store verification token", {
      userId,
      error: insertError.message,
    });
    return { success: false, error: "Failed to create verification token" };
  }

  // 3. Send email via Resend (raw token in URL, NOT logged)
  const result = await sendVerificationEmail({ to: email, token: rawToken });

  if (!result.success) {
    // Best-effort cleanup: prevent an undelivered token from lingering.
    // We do not attempt to restore previously invalidated tokens.
    if (inserted?.id) {
      await adminClient
        .from("email_verifications")
        .delete()
        .eq("id", inserted.id);
    }
    logger.error("Verification email send failed", { userId });
    return { success: false, error: "Failed to send verification email" };
  }

  logger.info("Verification email sent", { userId });
  return { success: true };
}
