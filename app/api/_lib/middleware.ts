import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { jsonUnauthorized, jsonError, ERROR_CODES } from './response';
import { checkRateLimit, type RateLimitConfig } from '@/lib/services/rateLimitService';

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Require authentication for API routes
 */
export const requireAuth = async (
  request: Request,
  handler: (userId: string) => Promise<NextResponse>,
): Promise<NextResponse> => {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return jsonUnauthorized('Valid authentication token required');
    }

    return await handler(user.id);
  } catch (error) {
    console.error(
      'Authentication middleware error:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    return jsonError('Authentication failed', 500, ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Optional authentication - provides user ID if authenticated
 */
export const optionalAuth = async (
  request: Request,
  handler: (userId?: string) => Promise<NextResponse>,
): Promise<NextResponse> => {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return await handler(user?.id);
  } catch (error) {
    console.error(
      'Optional auth middleware error:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    // Continue without authentication
    return await handler(undefined);
  }
};

// ============================================================================
// RATE LIMITING MIDDLEWARE
// ============================================================================

/**
 * Validates IP address format to prevent injection
 */
function isValidIP(ip: string): boolean {
  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 pattern (simplified)
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}

/**
 * Extract client IP from request headers securely
 * SECURITY: Only trust verified proxy headers in production
 */
function getClientIP(request: NextRequest): string {
  const isProduction = process.env.NODE_ENV === 'production';

  // In production, prefer verified proxy headers that cannot be spoofed
  if (isProduction) {
    // Vercel's verified header (highest trust)
    const vercelIp = request.headers.get('x-vercel-forwarded-for');
    if (vercelIp) {
      const firstIp = vercelIp.split(',')[0].trim();
      if (firstIp && isValidIP(firstIp)) return firstIp;
    }

    // Cloudflare's verified header
    const cfIp = request.headers.get('cf-connecting-ip');
    if (cfIp && isValidIP(cfIp)) return cfIp;
  }

  // In development or as fallback, use standard headers
  // SECURITY: Be careful with x-forwarded-for in production if not behind a trusted proxy
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp && isValidIP(firstIp)) return firstIp;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp && isValidIP(realIp)) return realIp;

  const clientIp = request.headers.get('x-client-ip');
  if (clientIp && isValidIP(clientIp)) return clientIp;

  return 'unknown';
}

/**
 * Apply rate limiting to API routes
 * SECURITY: Uses distributed store (Redis/KV) in production for serverless compatibility
 */
export const rateLimit = (
  config: RateLimitConfig = { windowMs: 15 * 60 * 1000, maxRequests: 100 },
) => {
  return async (
    request: NextRequest,
    handler: () => Promise<NextResponse>,
  ): Promise<NextResponse> => {
    const ip = getClientIP(request);
    const key = `${ip}:${request.nextUrl.pathname}`;

    // Check rate limit using distributed store
    const { allowed, remaining, resetIn, limit } = await checkRateLimit(key, {
      ...config,
      prefix: config.prefix || 'api',
    });

    if (!allowed) {
      return jsonError(
        `Rate limit exceeded. Try again in ${resetIn} seconds.`,
        429,
        ERROR_CODES.RATE_LIMITED,
        { resetIn, limit, windowMs: config.windowMs },
      );
    }

    try {
      const response = await handler();

      // Add rate limit headers to response
      const newResponse = new NextResponse(response.body, response);
      newResponse.headers.set('X-RateLimit-Limit', limit.toString());
      newResponse.headers.set('X-RateLimit-Remaining', remaining.toString());
      newResponse.headers.set('X-RateLimit-Reset', resetIn.toString());

      return newResponse;
    } catch (error) {
      throw error;
    }
  };
};

// ============================================================================
// CORS MIDDLEWARE
// ============================================================================

/**
 * CORS configuration
 */
interface CorsConfig {
  allowedOrigins?: string[];
  allowedMethods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

/**
 * Apply CORS headers to API routes
 * SECURITY: This middleware enforces strict origin validation
 * - Never allows '*' with credentials=true (browser security violation)
 * - Validates origins against explicit allowlist
 */
export const cors = (config: CorsConfig = {}) => {
  // Parse CORS_ALLOWED_ORIGINS from environment variable if available
  // Format: comma-separated URLs, e.g., "http://localhost:3000,https://myapp.com"
  const defaultOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : ['http://localhost:3000', 'https://localhost:3000'];

  const {
    allowedOrigins = defaultOrigins,
    allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders = [],
    credentials = true,
    maxAge = 86400, // 24 hours
  } = config;

  // SECURITY: Disallow wildcard origin with credentials
  // This is a browser security requirement - warn developers
  const sanitizedOrigins = allowedOrigins.filter((origin) => {
    if (origin === '*' && credentials) {
      console.warn(
        'SECURITY WARNING: CORS wildcard (*) origin is not allowed with credentials=true. ' +
          'Removing wildcard from allowed origins.',
      );
      return false;
    }
    return true;
  });

  // SECURITY: If no valid origins remain after sanitization, use defaults
  const finalOrigins = sanitizedOrigins.length > 0 ? sanitizedOrigins : defaultOrigins;

  return async (
    request: NextRequest,
    handler: () => Promise<NextResponse>,
  ): Promise<NextResponse> => {
    const origin = request.headers.get('origin');

    // SECURITY: Validate origin against allowlist
    const isAllowedOrigin = !origin || finalOrigins.includes(origin);

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      if (!isAllowedOrigin) {
        return jsonError('Origin not allowed', 403, ERROR_CODES.FORBIDDEN);
      }

      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin || finalOrigins[0],
          'Access-Control-Allow-Methods': allowedMethods.join(', '),
          'Access-Control-Allow-Headers': allowedHeaders.join(', '),
          'Access-Control-Allow-Credentials': credentials.toString(),
          'Access-Control-Max-Age': maxAge.toString(),
        },
      });
    }

    const response = await handler();

    // Add CORS headers to actual response only if origin is allowed
    if (isAllowedOrigin && origin) {
      const corsHeaders: Record<string, string> = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': allowedMethods.join(', '),
        'Access-Control-Allow-Headers': allowedHeaders.join(', '),
        'Access-Control-Allow-Credentials': credentials.toString(),
      };

      if (exposedHeaders.length > 0) {
        corsHeaders['Access-Control-Expose-Headers'] = exposedHeaders.join(', ');
      }

      // Create new response with CORS headers
      const newResponse = new NextResponse(response.body, response);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newResponse.headers.set(key, value);
      });

      return newResponse;
    }

    return response;
  };
};

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

/**
 * Request validation middleware
 */
export const validateRequest = <T>(schema: {
  safeParse: (data: unknown) => { success: boolean; data?: T; error?: unknown };
}) => {
  return async (
    request: Request,
    handler: (validatedData: T) => Promise<NextResponse>,
  ): Promise<NextResponse> => {
    try {
      let body;
      try {
        body = await request.json();
      } catch {
        body = {};
      }

      const result = schema.safeParse(body);

      if (!result.success) {
        return jsonError(
          'Request validation failed',
          400,
          ERROR_CODES.VALIDATION_ERROR,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { errors: (result.error as any).errors },
        );
      }

      return await handler(result.data!);
    } catch (error) {
      console.error('Validation middleware error:', error);
      return jsonError('Request processing failed', 400, ERROR_CODES.BAD_REQUEST);
    }
  };
};

// ============================================================================
// LOGGING MIDDLEWARE
// ============================================================================

/**
 * Request logging middleware
 */
export const logRequest = (level: 'warn' | 'error' = 'warn') => {
  return async (
    request: NextRequest,
    handler: () => Promise<NextResponse>,
  ): Promise<NextResponse> => {
    const startTime = Date.now();
    const method = request.method;
    const url = request.nextUrl.pathname;
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('x-client-ip') ||
      'Unknown';

    // eslint-disable-next-line no-console
    console[level](`[${method}] ${url} - IP: ${ip} - User-Agent: ${userAgent}`);

    try {
      const response = await handler();
      const duration = Date.now() - startTime;

      // eslint-disable-next-line no-console
      console[level](`[${method}] ${url} - ${response.status} - ${duration}ms`);
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${method}] ${url} - ERROR - ${duration}ms:`, error);
      throw error;
    }
  };
};
