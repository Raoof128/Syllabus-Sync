/**
 * Secure IP Extraction Utility
 *
 * SECURITY: This module provides consistent, secure IP extraction across all API routes.
 * It prioritizes verified proxy headers that cannot be spoofed by end users.
 *
 * Trust hierarchy (in production):
 * 1. x-vercel-forwarded-for - Set by Vercel's edge network (highest trust)
 * 2. cf-connecting-ip - Set by Cloudflare (high trust)
 * 3. x-forwarded-for - Standard header (lower trust, validated)
 * 4. x-real-ip - Fallback
 */

import { NextRequest } from 'next/server';

// ============================================================================
// IP VALIDATION
// ============================================================================

/**
 * Validates IP address format to prevent injection attacks
 * Accepts both IPv4 and IPv6 formats
 */
export function isValidIP(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;

  // Trim and check length (prevent DoS via long strings)
  const trimmed = ip.trim();
  if (trimmed.length > 45) return false; // Max IPv6 length

  // IPv4 pattern: xxx.xxx.xxx.xxx
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Pattern.test(trimmed)) {
    // Validate each octet is 0-255
    const octets = trimmed.split('.');
    return octets.every((octet) => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
  }

  // IPv6 pattern (simplified but covers most cases)
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  if (ipv6Pattern.test(trimmed)) {
    return true;
  }

  // IPv6 with IPv4 suffix (::ffff:192.168.1.1)
  const ipv6v4Pattern = /^(::ffff:)?(\d{1,3}\.){3}\d{1,3}$/i;
  if (ipv6v4Pattern.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Extracts the first valid IP from a comma-separated list
 * (x-forwarded-for format: client, proxy1, proxy2)
 */
function extractFirstIP(header: string | null): string | null {
  if (!header) return null;

  const firstIp = header.split(',')[0]?.trim();
  if (firstIp && isValidIP(firstIp)) {
    return firstIp;
  }

  return null;
}

// ============================================================================
// MAIN IP EXTRACTION
// ============================================================================

export interface GetClientIPOptions {
  /** Trust x-forwarded-for header even in production (not recommended) */
  trustForwardedFor?: boolean;
}

interface HeaderAccessor {
  get(name: string): string | null;
}

/**
 * Securely extracts client IP address from request headers
 *
 * SECURITY CONSIDERATIONS:
 * - In production, only trusts headers set by verified proxies (Vercel, Cloudflare)
 * - In development, accepts x-forwarded-for for local testing
 * - Returns 'unknown' if no valid IP can be determined (fail-safe)
 *
 * @param request - Next.js request object
 * @param options - Optional configuration
 * @returns Client IP address or 'unknown'
 */
export function getClientIPFromHeaders(
  headers: HeaderAccessor,
  options: GetClientIPOptions = {},
): string {
  // Prefer Vercel's env signal when available; NODE_ENV is "production" on Vercel previews too.
  const isRealProduction =
    process.env.VERCEL_ENV === 'production' ||
    (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV);
  const isVercelRuntime = Boolean(process.env.VERCEL) || Boolean(process.env.VERCEL_ENV);
  const { trustForwardedFor = false } = options;

  // In production, prefer verified proxy headers that cannot be spoofed
  if (isRealProduction) {
    // 1. Vercel's verified header (highest trust)
    // This header is set by Vercel's edge network and cannot be spoofed
    const vercelIp = extractFirstIP(headers.get('x-vercel-forwarded-for'));
    if (vercelIp) return vercelIp;

    // 2. Cloudflare's verified header
    // Set by Cloudflare when used as a CDN/proxy
    const cfIp = headers.get('cf-connecting-ip');
    if (cfIp && isValidIP(cfIp)) return cfIp;

    // 3. Vercel commonly provides `x-real-ip` / `x-forwarded-for` on Node requests.
    // Prefer `x-real-ip` (single value), then allow `x-forwarded-for` when we are on Vercel
    // (Vercel sets/overwrites it at the edge) or when explicitly trusted.
    const realIp = headers.get('x-real-ip');
    if (realIp && isValidIP(realIp)) return realIp;

    if (isVercelRuntime || trustForwardedFor) {
      const forwardedIp = extractFirstIP(headers.get('x-forwarded-for'));
      if (forwardedIp) return forwardedIp;
    }
  } else {
    // In development, accept standard headers for local testing
    const forwardedIp = extractFirstIP(headers.get('x-forwarded-for'));
    if (forwardedIp) return forwardedIp;

    const realIp = headers.get('x-real-ip');
    if (realIp && isValidIP(realIp)) return realIp;

    // Local dev fallback: keep rate limiting stable rather than collapsing to a shared "unknown".
    return '127.0.0.1';
  }

  // Last resort: return 'unknown' (fail-safe for rate limiting)
  return 'unknown';
}

export function getClientIP(request: NextRequest, options: GetClientIPOptions = {}): string {
  return getClientIPFromHeaders(request.headers, options);
}

/**
 * Get client identifier for rate limiting
 * Uses IP address but could be extended to include user ID for authenticated requests
 */
export function getRateLimitIdentifier(request: NextRequest, userId?: string): string {
  if (userId) {
    // For authenticated requests, use user ID for more accurate limiting
    return `user:${userId}`;
  }

  const ip = getClientIP(request);
  return `ip:${ip}`;
}

// ============================================================================
// SECURITY HEADERS
// ============================================================================

/**
 * Check if request is coming from a trusted origin
 * Used for CORS and CSRF protection
 */
export function isTrustedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');

  if (!origin) {
    // No origin header - could be same-origin request or non-browser client
    // Check referer as fallback
    const referer = request.headers.get('referer');
    if (!referer) return true; // Same-origin or API client

    try {
      const refererUrl = new URL(referer);
      return isSameHost(refererUrl.host);
    } catch {
      return false;
    }
  }

  try {
    const originUrl = new URL(origin);
    return isSameHost(originUrl.host);
  } catch {
    return false;
  }
}

/**
 * Check if a host matches our allowed hosts
 */
function isSameHost(host: string): boolean {
  const allowedHosts = [
    'localhost',
    '127.0.0.1',
    process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL).host
      : 'syllabus-sync.vercel.app',
  ];

  return allowedHosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}
