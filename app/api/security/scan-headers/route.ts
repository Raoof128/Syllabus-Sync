/**
 * Security Headers Scan API Endpoint
 *
 * SECURITY: This endpoint scans a URL for security headers
 * and provides recommendations for improvements.
 */

import { NextRequest, NextResponse } from 'next/server';
import dns from 'node:dns/promises';
import net from 'node:net';
import { scanURLHeaders, generateSecurityReport } from '@/lib/security/headers-scanner';
import { createServerClient } from '@/lib/supabase/server';
import {
  jsonError,
  ERROR_CODES,
  parseJsonBody,
  BODY_SIZE_LIMITS,
} from '@/app/api/_lib/response';
import { securityScanLimiter } from '@/lib/services/rateLimitService';
import { getClientIP } from '@/lib/security/ip';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

const BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  '169.254.169.254',
]);

const BLOCKED_PORTS = new Set([22, 25, 3306, 5432, 6379, 9200, 9300, 11211, 27017, 2375, 2376]);

function ipv4ToInt(ip: string): number {
  const octets = ip.split('.').map((part) => Number.parseInt(part, 10));
  return (
    ((octets[0] << 24) >>> 0) +
    ((octets[1] << 16) >>> 0) +
    ((octets[2] << 8) >>> 0) +
    (octets[3] >>> 0)
  );
}

function isPrivateIPv4(ip: string): boolean {
  const value = ipv4ToInt(ip);
  const inRange = (start: string, end: string) =>
    value >= ipv4ToInt(start) && value <= ipv4ToInt(end);
  return (
    inRange('10.0.0.0', '10.255.255.255') ||
    inRange('127.0.0.0', '127.255.255.255') ||
    inRange('172.16.0.0', '172.31.255.255') ||
    inRange('192.168.0.0', '192.168.255.255') ||
    inRange('169.254.0.0', '169.254.255.255')
  );
}

function isPrivateOrLoopbackAddress(address: string): boolean {
  const normalized = address.toLowerCase();

  if (normalized.startsWith('::ffff:')) {
    return isPrivateIPv4(normalized.replace('::ffff:', ''));
  }

  if (net.isIP(normalized) === 4) {
    return isPrivateIPv4(normalized);
  }

  if (net.isIP(normalized) !== 6) {
    return false;
  }

  if (normalized === '::1' || normalized === '::') return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // ULA
  if (
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb')
  )
    return true; // Link-local

  return false;
}

async function validateScanTarget(rawUrl: string): Promise<{ valid: true; url: URL } | { valid: false; message: string }> {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, message: 'Invalid URL format' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, message: 'Only HTTP(S) URLs are supported' };
  }

  if (parsed.username || parsed.password) {
    return { valid: false, message: 'URL credentials are not allowed' };
  }

  if (parsed.port) {
    const port = Number.parseInt(parsed.port, 10);
    if (!Number.isNaN(port) && BLOCKED_PORTS.has(port)) {
      return { valid: false, message: 'Target port is not allowed' };
    }
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    BLOCKED_HOSTS.has(hostname) ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.localhost')
  ) {
    return { valid: false, message: 'Target host is not allowed' };
  }

  if (net.isIP(hostname) && isPrivateOrLoopbackAddress(hostname)) {
    return { valid: false, message: 'Private network targets are not allowed' };
  }

  try {
    const resolvedAddresses = await dns.lookup(hostname, { all: true, verbatim: true });
    if (resolvedAddresses.some((entry) => isPrivateOrLoopbackAddress(entry.address))) {
      return { valid: false, message: 'Target resolves to a private network address' };
    }
  } catch {
    return { valid: false, message: 'Unable to resolve target host' };
  }

  return { valid: true, url: parsed };
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return jsonError('Authentication required', 401, ERROR_CODES.UNAUTHORIZED);
  }

  const clientIp = getClientIP(request);
  const { allowed, remaining, resetIn, limit } = await securityScanLimiter(`${user.id}:${clientIp}`);

  if (!allowed) {
    const response = jsonError(
      `Too many scan requests. Please retry in ${resetIn} seconds.`,
      429,
      ERROR_CODES.RATE_LIMITED,
      { retryAfter: resetIn },
    );
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', resetIn.toString());
    response.headers.set('Retry-After', resetIn.toString());
    return response;
  }

  try {
    const { data: body, error: bodyError } = await parseJsonBody<{ url?: string }>(
      request,
      BODY_SIZE_LIMITS.DEFAULT,
    );
    if (bodyError) return bodyError;

    const { url } = body;

    if (!url || typeof url !== 'string') {
      return jsonError('URL is required', 400, ERROR_CODES.BAD_REQUEST);
    }

    const validation = await validateScanTarget(url.trim());
    if (!validation.valid) {
      return jsonError(validation.message, 400, ERROR_CODES.BAD_REQUEST);
    }

    const targetUrl = validation.url.toString();
    const result = await scanURLHeaders(targetUrl);

    const response = NextResponse.json({
      success: true,
      result,
      report: generateSecurityReport(result, targetUrl),
    });
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', resetIn.toString());
    return response;
  } catch (error) {
    logger.error('Header scan error:', error);
    return jsonError('Failed to scan headers', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
