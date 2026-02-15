/**
 * Password Breach Check API Endpoint
 *
 * SECURITY: This endpoint checks if a password has been exposed in data breaches
 * using the Have I Been Pwned (HIBP) API with k-anonymity.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkPasswordBreach } from '@/lib/security/password-breach';
import {
  jsonError,
  ERROR_CODES,
  parseJsonBody,
  BODY_SIZE_LIMITS,
} from '@/app/api/_lib/response';
import { passwordBreachLimiter } from '@/lib/services/rateLimitService';
import { getClientIP } from '@/lib/security/ip';
import { logger } from '@/lib/logger';


export async function POST(request: NextRequest) {
  const clientIp = getClientIP(request);
  const { allowed, remaining, resetIn, limit } = await passwordBreachLimiter(clientIp);

  if (!allowed) {
    const response = jsonError(
      `Too many password checks. Please retry in ${resetIn} seconds.`,
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
    const { data: body, error: bodyError } = await parseJsonBody<{ password?: string }>(
      request,
      BODY_SIZE_LIMITS.AUTH,
    );
    if (bodyError) return bodyError;

    const { password } = body;

    if (!password || typeof password !== 'string') {
      return jsonError('Password is required', 400, ERROR_CODES.BAD_REQUEST);
    }

    if (password.length < 1 || password.length > 1024) {
      return jsonError('Password cannot be empty', 400, ERROR_CODES.BAD_REQUEST);
    }

    // Check password breach
    const result = await checkPasswordBreach(password);

    const response = NextResponse.json({
      success: true,
      result,
    });
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', resetIn.toString());
    return response;
  } catch (error) {
    logger.error('Password breach check error:', error);
    return jsonError('Failed to check password breach', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
