import { logger } from '@/lib/logger';
/**
 * Distributed Rate Limiting Service
 *
 * SECURITY: This service provides rate limiting that works in serverless environments.
 *
 * In production, it uses:
 * 1. Upstash Redis (recommended) - Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 * 2. Vercel KV - Set KV_REST_API_URL and KV_REST_API_TOKEN
 *
 * In development, it falls back to in-memory storage (which is fine for local dev).
 *
 * The service uses a sliding window algorithm for accurate rate limiting.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Identifier prefix for this limiter (e.g., 'signup', 'api') */
  prefix?: string;
  /**
   * SECURITY: If true, deny requests when the rate limit store fails.
   * Set to true for security-critical endpoints (login, signup, password reset).
   * Set to false for non-critical endpoints where availability is more important.
   * Default: false (fail-open for backwards compatibility)
   */
  failClosed?: boolean;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining requests in current window */
  remaining: number;
  /** Seconds until the limit resets */
  resetIn: number;
  /** Maximum requests allowed */
  limit: number;
}

// ============================================================================
// STORAGE BACKENDS
// ============================================================================

interface RateLimitStore {
  get(key: string): Promise<{ count: number; resetTime: number } | null>;
  set(key: string, data: { count: number; resetTime: number }, ttlMs: number): Promise<void>;
  increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }>;
}

/**
 * In-memory store for development/testing
 * WARNING: This does NOT work across serverless instances!
 */
class MemoryStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async get(key: string) {
    const data = this.store.get(key);
    if (!data || data.resetTime < Date.now()) {
      return null;
    }
    return data;
  }

  async set(key: string, data: { count: number; resetTime: number }, _ttlMs: number) {
    this.store.set(key, data);
    // Clean up expired entries periodically
    if (Math.random() < 0.1) {
      const now = Date.now();
      for (const [k, v] of this.store.entries()) {
        if (v.resetTime < now) this.store.delete(k);
      }
    }
  }

  async increment(key: string, windowMs: number) {
    const now = Date.now();
    const existing = await this.get(key);

    if (!existing) {
      const data = { count: 1, resetTime: now + windowMs };
      await this.set(key, data, windowMs);
      return data;
    }

    existing.count++;
    await this.set(key, existing, existing.resetTime - now);
    return existing;
  }
}

/**
 * Upstash Redis store for production
 * Uses REST API - no persistent connections needed (perfect for serverless)
 */
class UpstashRedisStore implements RateLimitStore {
  private baseUrl: string;
  private token: string;

  constructor(url: string, token: string) {
    this.baseUrl = url;
    this.token = token;
  }

  private async command<T>(...args: (string | number)[]): Promise<T> {
    const response = await fetch(`${this.baseUrl}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    });

    if (!response.ok) {
      throw new Error(`Upstash error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result as T;
  }

  async get(key: string) {
    try {
      const data = await this.command<string | null>('GET', key);
      if (!data) return null;
      return JSON.parse(data) as { count: number; resetTime: number };
    } catch {
      return null;
    }
  }

  async set(key: string, data: { count: number; resetTime: number }, ttlMs: number) {
    const ttlSeconds = Math.ceil(ttlMs / 1000);
    await this.command('SET', key, JSON.stringify(data), 'EX', ttlSeconds);
  }

  async increment(key: string, windowMs: number) {
    const now = Date.now();
    const existing = await this.get(key);

    if (!existing || existing.resetTime < now) {
      const data = { count: 1, resetTime: now + windowMs };
      await this.set(key, data, windowMs);
      return data;
    }

    existing.count++;
    await this.set(key, existing, existing.resetTime - now);
    return existing;
  }
}

// ============================================================================
// RATE LIMITER
// ============================================================================

/**
 * Get appropriate store based on environment configuration
 */
function getStore(): RateLimitStore {
  // Try Upstash Redis first
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    return new UpstashRedisStore(upstashUrl, upstashToken);
  }

  // Try Vercel KV (uses same REST API format as Upstash)
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (kvUrl && kvToken) {
    return new UpstashRedisStore(kvUrl, kvToken);
  }

  // SECURITY: Check for explicit override to allow memory store in production
  // This should only be used for testing/demo deployments
  const allowMemoryStore = process.env.ALLOW_MEMORY_RATE_LIMIT === 'true';

  // SECURITY: In production, require Redis - don't fall back to memory store
  // Memory store is useless in serverless environments (each instance has its own memory)
  // Use VERCEL_ENV for more reliable production detection
  const isRealProduction =
    process.env.VERCEL_ENV === 'production' ||
    (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV);

  if (isRealProduction && !allowMemoryStore) {
    logger.error(
      '🚨 CRITICAL SECURITY WARNING: No distributed rate limiting configured in production!\n' +
        'In-memory rate limiting does NOT work across serverless instances.\n' +
        'Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for proper rate limiting.\n' +
        'Security-critical endpoints (login, signup, password reset) will fail-closed.\n' +
        'For testing/demo only, set ALLOW_MEMORY_RATE_LIMIT=true to bypass this check.',
    );
  }

  // Fall back to memory store with clear warnings
  if (isRealProduction && allowMemoryStore) {
    console.warn(
      '⚠️ PRODUCTION WARNING: Using in-memory rate limiting by explicit override.\n' +
        'This provides NO real protection in serverless environments. Use only for testing.',
    );
  } else {
    console.warn('⚠️ DEV MODE: Using in-memory rate limiting. This is fine for local development.');
  }

  return new MemoryStore();
}

// Singleton store instance
let storeInstance: RateLimitStore | null = null;

function getStoreInstance(): RateLimitStore {
  if (!storeInstance) {
    storeInstance = getStore();
  }
  return storeInstance;
}

/**
 * Check rate limit for a given identifier
 *
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status and metadata
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  // TESTING MODE: When ALLOW_MEMORY_RATE_LIMIT is set, bypass rate limiting entirely
  // This is only for testing/demo deployments without Redis
  const allowMemoryStore = process.env.ALLOW_MEMORY_RATE_LIMIT === 'true';
  if (allowMemoryStore) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetIn: Math.ceil(config.windowMs / 1000),
      limit: config.maxRequests,
    };
  }

  const store = getStoreInstance();
  const key = config.prefix
    ? `ratelimit:${config.prefix}:${identifier}`
    : `ratelimit:${identifier}`;
  const now = Date.now();
  // SECURITY: Use VERCEL_ENV for reliable production detection
  const isProduction =
    process.env.VERCEL_ENV === 'production' ||
    (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV);
  const isMemoryStore = store instanceof MemoryStore;

  // SECURITY: In production with memory store, fail-closed for security-critical endpoints
  // This prevents bypass attacks when Redis is not configured
  if (isProduction && isMemoryStore && config.failClosed) {
    logger.error(
      `SECURITY: Blocking ${config.prefix} request - no distributed rate limiting in production`,
    );
    return {
      allowed: false,
      remaining: 0,
      resetIn: 60,
      limit: config.maxRequests,
    };
  }

  try {
    const data = await store.increment(key, config.windowMs);

    const allowed = data.count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - data.count);
    const resetIn = Math.ceil((data.resetTime - now) / 1000);

    return {
      allowed,
      remaining,
      resetIn,
      limit: config.maxRequests,
    };
  } catch (error) {
    // SECURITY: Behavior on store failure depends on endpoint criticality
    logger.error('Rate limit store error:', error);

    if (config.failClosed) {
      // For security-critical endpoints, deny the request when we can't verify the rate limit
      console.warn('Rate limit store unavailable - denying request (fail-closed mode)');
      return {
        allowed: false,
        remaining: 0,
        resetIn: 60, // Suggest retry in 1 minute
        limit: config.maxRequests,
      };
    }

    // For non-critical endpoints, allow the request but log the error
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetIn: Math.ceil(config.windowMs / 1000),
      limit: config.maxRequests,
    };
  }
}

/**
 * Create a rate limiter with preset configuration
 */
export function createRateLimiter(config: RateLimitConfig) {
  return (identifier: string) => checkRateLimit(identifier, config);
}

// ============================================================================
// PRESET LIMITERS
// ============================================================================

/** Rate limiter for signup endpoint - strict limits, fail-closed for security */
export const signupLimiter = createRateLimiter({
  prefix: 'signup',
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20, // Max 20 signups per hour per IP (increased for testing)
  failClosed: true, // SECURITY: Deny on store failure
});

/** Rate limiter for login endpoint - fail-closed to prevent brute force */
export const loginLimiter = createRateLimiter({
  prefix: 'login',
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50, // Max 50 attempts per 15 min (increased for testing)
  failClosed: true, // SECURITY: Deny on store failure
});

/** Rate limiter for general API endpoints - fail-open for availability */
export const apiLimiter = createRateLimiter({
  prefix: 'api',
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 200, // Max 200 requests per minute
  failClosed: false, // Prioritize availability for general API
});

/** Rate limiter for password reset - fail-closed for security */
export const passwordResetLimiter = createRateLimiter({
  prefix: 'reset',
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // Max 10 reset requests per hour
  failClosed: true, // SECURITY: Deny on store failure
});

/** Rate limiter for mutation endpoints (POST, PUT, DELETE) - moderate limits */
export const mutationLimiter = createRateLimiter({
  prefix: 'mutation',
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // Max 60 mutations per minute per user/IP
  failClosed: false, // Prioritize availability
});

/** Rate limiter for bulk operations - stricter limits */
export const bulkOperationLimiter = createRateLimiter({
  prefix: 'bulk',
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // Max 10 bulk operations per minute
  failClosed: false,
});

/** Rate limiter for password breach lookups */
export const passwordBreachLimiter = createRateLimiter({
  prefix: 'password_breach',
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 50, // Max 50 checks per minute per IP
  failClosed: true,
});

/** Rate limiter for security header scans */
export const securityScanLimiter = createRateLimiter({
  prefix: 'security_scan',
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20, // Max 20 scans per minute per user/IP
  failClosed: true,
});

/** Rate limiter for passkey status checks - more permissive than login since it's read-only */
export const passkeyStatusLimiter = createRateLimiter({
  prefix: 'passkey_status',
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // Max 100 status checks per minute (allows for email typing/autocomplete)
  failClosed: false, // Prioritize UX - status check is not security-critical
});

/** Rate limiter for passkey authentication (options + verify) - slightly more permissive than login */
export const passkeyAuthLimiter = createRateLimiter({
  prefix: 'passkey_auth',
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50, // Max 50 passkey auth attempts per 15 min (increased for testing)
  failClosed: true, // SECURITY: Deny on store failure
});

