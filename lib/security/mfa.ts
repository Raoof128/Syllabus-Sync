/**
 * MFA (Multi-Factor Authentication) Utilities
 *
 * SECURITY: This module provides helper functions for MFA operations
 * using Supabase Auth's built-in TOTP and Phone factor support.
 *
 * - TOTP: Time-based One-Time Password (authenticator apps)
 * - Phone: SMS-based verification (fallback)
 * - Rate limiting on all verification attempts
 * - Audit logging for security events
 */

import { createRateLimiter } from '@/lib/services/rateLimitService';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum TOTP verification attempts per window */
export const MFA_MAX_VERIFY_ATTEMPTS = 5;

/** Rate limit window for MFA verification (15 minutes) */
export const MFA_VERIFY_WINDOW_MS = 15 * 60 * 1000;

/** Cooldown between SMS resends (60 seconds) */
export const SMS_RESEND_COOLDOWN_MS = 60 * 1000;

/** Maximum SMS sends per hour */
export const SMS_MAX_SENDS_PER_HOUR = 5;

/** Lockout duration after max failed attempts (30 minutes) */
export const MFA_LOCKOUT_DURATION_MS = 30 * 60 * 1000;

// ============================================================================
// RATE LIMITERS
// ============================================================================

/** Rate limiter for MFA verification attempts */
export const mfaVerifyLimiter = createRateLimiter({
  prefix: 'mfa-verify',
  windowMs: MFA_VERIFY_WINDOW_MS,
  maxRequests: MFA_MAX_VERIFY_ATTEMPTS,
  failClosed: true,
});

/** Rate limiter for SMS sends */
export const smsSendLimiter = createRateLimiter({
  prefix: 'sms-send',
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: SMS_MAX_SENDS_PER_HOUR,
  failClosed: true,
});

/** Rate limiter for MFA enrollment */
export const mfaEnrollLimiter = createRateLimiter({
  prefix: 'mfa-enroll',
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  failClosed: true,
});

/** Rate limiter for MFA unenrollment */
export const mfaUnenrollLimiter = createRateLimiter({
  prefix: 'mfa-unenroll',
  windowMs: 60 * 60 * 1000,
  maxRequests: 5,
  failClosed: true,
});

// ============================================================================
// TYPES
// ============================================================================

export interface MFAFactor {
  id: string;
  type: 'totp' | 'phone';
  friendlyName?: string;
  status: 'verified' | 'unverified';
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MFAStatus {
  enabled: boolean;
  currentLevel: 'aal1' | 'aal2';
  nextLevel: 'aal1' | 'aal2';
  factors: MFAFactor[];
  totpEnabled: boolean;
  phoneEnabled: boolean;
}

export interface MFAChallengeResult {
  factorId: string;
  challengeId: string;
  expiresAt: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Sanitize phone number for display (mask middle digits)
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 6) return '***';
  const last4 = phone.slice(-4);
  const countryCode = phone.slice(0, phone.length - 8);
  return `${countryCode}****${last4}`;
}

/**
 * Validate TOTP code format (6 digits)
 */
export function isValidTOTPCode(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}

/**
 * Validate phone number format (E.164)
 */
export function isValidE164Phone(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone.trim());
}

/**
 * Map Supabase factor to our MFAFactor type
 */
export function mapSupabaseFactor(factor: {
  id: string;
  factor_type: string;
  friendly_name?: string;
  status: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}): MFAFactor {
  return {
    id: factor.id,
    type: factor.factor_type as 'totp' | 'phone',
    friendlyName: factor.friendly_name,
    status: factor.status as 'verified' | 'unverified',
    phone: factor.phone,
    createdAt: factor.created_at,
    updatedAt: factor.updated_at,
  };
}
