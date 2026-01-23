/**
 * CSRF Protection Middleware
 *
 * SECURITY: This module provides CSRF protection for mutation endpoints.
 * While Supabase uses SameSite=Lax cookies, explicit CSRF tokens add defense-in-depth.
 *
 * Implementation:
 * - Double-submit cookie pattern
 * - Origin/Referer validation
 * - Custom header requirement for API calls
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';

// ============================================================================
// CONSTANTS
// ============================================================================

const CSRF_COOKIE_NAME = '__Host-csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_MAX_AGE = 60 * 60 * 24; // 24 hours

// Methods that require CSRF protection
const PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

// Paths that are exempt from CSRF (webhooks, etc.)
const EXEMPT_PATHS = ['/api/webhooks/', '/api/cron/'];

// ============================================================================
// TOKEN GENERATION
// ============================================================================

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Hash a CSRF token for comparison (prevents timing attacks)
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Securely compare two tokens (constant-time comparison)
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  const aHash = hashToken(a);
  const bHash = hashToken(b);

  let result = 0;
  for (let i = 0; i < aHash.length; i++) {
    result |= aHash.charCodeAt(i) ^ bHash.charCodeAt(i);
  }

  return result === 0;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate CSRF token from request
 */
export function validateCSRFToken(request: NextRequest): {
  valid: boolean;
  reason?: string;
} {
  // Skip validation for safe methods
  if (!PROTECTED_METHODS.includes(request.method)) {
    return { valid: true };
  }

  // Skip validation for exempt paths
  const pathname = request.nextUrl.pathname;
  if (EXEMPT_PATHS.some((path) => pathname.startsWith(path))) {
    return { valid: true };
  }

  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (!cookieToken) {
    return { valid: false, reason: 'Missing CSRF cookie' };
  }

  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (!headerToken) {
    return { valid: false, reason: 'Missing CSRF header' };
  }

  // Compare tokens
  if (!secureCompare(cookieToken, headerToken)) {
    return { valid: false, reason: 'CSRF token mismatch' };
  }

  return { valid: true };
}

/**
 * Validate Origin/Referer header
 */
export function validateOrigin(request: NextRequest): {
  valid: boolean;
  reason?: string;
} {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // For non-mutation requests, skip validation
  if (!PROTECTED_METHODS.includes(request.method)) {
    return { valid: true };
  }

  // At least one of origin or referer should be present for browser requests
  if (!origin && !referer) {
    // Could be a direct API call (curl, Postman, etc.)
    // Allow if using API key or other authentication
    const hasAuthHeader = request.headers.has('authorization');
    if (hasAuthHeader) {
      return { valid: true };
    }
    // For now, allow - but log for monitoring
    console.warn('CSRF: Request without origin/referer headers', {
      method: request.method,
      path: request.nextUrl.pathname,
    });
    return { valid: true };
  }

  const allowedOrigins = getAllowedOrigins();

  // Check origin header
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (!allowedOrigins.includes(originUrl.origin)) {
        return { valid: false, reason: `Invalid origin: ${origin}` };
      }
    } catch {
      return { valid: false, reason: 'Malformed origin header' };
    }
  }

  // Check referer header as fallback
  if (referer && !origin) {
    try {
      const refererUrl = new URL(referer);
      if (!allowedOrigins.includes(refererUrl.origin)) {
        return { valid: false, reason: `Invalid referer: ${referer}` };
      }
    } catch {
      return { valid: false, reason: 'Malformed referer header' };
    }
  }

  return { valid: true };
}

/**
 * Get list of allowed origins
 */
function getAllowedOrigins(): string[] {
  const origins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
  ];

  // Add production URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      const publicUrl = new URL(process.env.NEXT_PUBLIC_APP_URL);
      origins.push(publicUrl.origin);
    } catch {
      // Ignore invalid URL
    }
  }

  // Add Vercel preview URLs
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }

  return origins;
}

// ============================================================================
// MIDDLEWARE HELPER
// ============================================================================

/**
 * CSRF protection middleware wrapper
 * Use this in API routes that need CSRF protection
 */
export function withCSRFProtection<T>(
  handler: (request: NextRequest) => Promise<T>,
): (request: NextRequest) => Promise<T | NextResponse> {
  return async (request: NextRequest) => {
    // Validate origin
    const originResult = validateOrigin(request);
    if (!originResult.valid) {
      console.warn('CSRF origin validation failed:', originResult.reason);
      return NextResponse.json(
        { error: { code: 'CSRF_ERROR', message: 'Invalid request origin' } },
        { status: 403 },
      );
    }

    // SECURITY: Full CSRF token validation (double-submit cookie pattern)
    // This provides defense-in-depth on top of Supabase's SameSite=Lax cookies
    // SECURITY FIX: CSRF can ONLY be disabled in development, never in production
    // This prevents attackers from disabling CSRF protection via environment variables
    const isRealProduction =
      process.env.VERCEL_ENV === 'production' ||
      (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV);
    const csrfEnabled = isRealProduction || process.env.CSRF_VALIDATION_ENABLED !== 'false';
    
    if (csrfEnabled) {
      const csrfResult = validateCSRFToken(request);
      if (!csrfResult.valid) {
        console.warn('CSRF token validation failed:', csrfResult.reason);
        return NextResponse.json(
          { error: { code: 'CSRF_ERROR', message: 'Invalid CSRF token' } },
          { status: 403 },
        );
      }
    }

    return handler(request);
  };
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

/**
 * Set CSRF cookie on response
 */
export function setCSRFCookie(response: NextResponse, token?: string): void {
  const csrfToken = token || generateCSRFToken();

  response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false, // Must be readable by JS for double-submit
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_TOKEN_MAX_AGE,
    path: '/',
  });
}
