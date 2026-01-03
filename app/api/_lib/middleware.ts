import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { jsonUnauthorized, jsonError, ERROR_CODES } from './response';

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Require authentication for API routes
 */
export const requireAuth = async (
  request: Request,
  handler: (userId: string) => Promise<NextResponse>
): Promise<NextResponse> => {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return jsonUnauthorized('Valid authentication token required');
    }

    return await handler(user.id);
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return jsonError('Authentication failed', 500, ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Optional authentication - provides user ID if authenticated
 */
export const optionalAuth = async (
  request: Request,
  handler: (userId?: string) => Promise<NextResponse>
): Promise<NextResponse> => {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    return await handler(user?.id);
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // Continue without authentication
    return await handler(undefined);
  }
};

// ============================================================================
// RATE LIMITING MIDDLEWARE
// ============================================================================

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting configuration
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean; // Don't count 2xx responses
  skipFailedRequests?: boolean; // Don't count 4xx/5xx responses
}

/**
 * Apply rate limiting to API routes
 */
export const rateLimit = (
  config: RateLimitConfig = { windowMs: 15 * 60 * 1000, maxRequests: 100 }
) => {
  return async (
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> => {
    const ip = request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                request.headers.get('x-client-ip') ||
                'unknown';
    const key = `${ip}:${request.nextUrl.pathname}`;

    const now = Date.now();

    // Clean up old entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }

    const current = rateLimitStore.get(key) || { count: 0, resetTime: now + config.windowMs };

    if (current.count >= config.maxRequests) {
      const resetIn = Math.ceil((current.resetTime - now) / 1000);
      return jsonError(
        `Rate limit exceeded. Try again in ${resetIn} seconds.`,
        429,
        ERROR_CODES.RATE_LIMITED,
        { resetIn, limit: config.maxRequests, windowMs: config.windowMs }
      );
    }

    try {
      const response = await handler();

      // Update rate limit counter based on config
      const shouldCount =
        (!config.skipSuccessfulRequests || response.status >= 400) &&
        (!config.skipFailedRequests || response.status < 400);

      if (shouldCount) {
        current.count++;
        rateLimitStore.set(key, current);
      }

      // Add rate limit headers to response
      const newResponse = new NextResponse(response.body, response);
      newResponse.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
      newResponse.headers.set('X-RateLimit-Remaining', Math.max(0, config.maxRequests - current.count).toString());
      newResponse.headers.set('X-RateLimit-Reset', Math.ceil(current.resetTime / 1000).toString());

      return newResponse;
    } catch (error) {
      // Count failed requests if configured
      if (!config.skipFailedRequests) {
        current.count++;
        rateLimitStore.set(key, current);
      }
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
 */
export const cors = (
  config: CorsConfig = {}
) => {
  const {
    allowedOrigins = ['http://localhost:3000', 'https://localhost:3000'],
    allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders = [],
    credentials = true,
    maxAge = 86400, // 24 hours
  } = config;

  return async (
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> => {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      const origin = request.headers.get('origin');
      const isAllowedOrigin = !origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin);

      if (!isAllowedOrigin) {
        return jsonError('Origin not allowed', 403, ERROR_CODES.FORBIDDEN);
      }

      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin || allowedOrigins[0],
          'Access-Control-Allow-Methods': allowedMethods.join(', '),
          'Access-Control-Allow-Headers': allowedHeaders.join(', '),
          'Access-Control-Allow-Credentials': credentials.toString(),
          'Access-Control-Max-Age': maxAge.toString(),
        },
      });
    }

    const response = await handler();

    // Add CORS headers to actual response
    const origin = request.headers.get('origin');
    const isAllowedOrigin = !origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin);

    if (isAllowedOrigin) {
      const corsHeaders: Record<string, string> = {
        'Access-Control-Allow-Origin': allowedOrigins.includes('*') ? '*' : (origin || allowedOrigins[0]),
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
export const validateRequest = <T>(
  schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: unknown } }
) => {
  return async (
    request: Request,
    handler: (validatedData: T) => Promise<NextResponse>
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
          { errors: (result.error as any).errors }
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
export const logRequest = (
  level: 'warn' | 'error' = 'warn'
) => {
  return async (
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> => {
    const startTime = Date.now();
    const method = request.method;
    const url = request.nextUrl.pathname;
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ip = request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                request.headers.get('x-client-ip') ||
                'Unknown';

    console[level](`[${method}] ${url} - IP: ${ip} - User-Agent: ${userAgent}`);

    try {
      const response = await handler();
      const duration = Date.now() - startTime;

      console[level](`[${method}] ${url} - ${response.status} - ${duration}ms`);
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${method}] ${url} - ERROR - ${duration}ms:`, error);
      throw error;
    }
  };
};
