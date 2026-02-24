/**
 * Rate Limiting Service Tests
 *
 * Tests for the distributed rate limiting service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkRateLimit,
  createRateLimiter,
  type RateLimitConfig,
  type RateLimitResult,
} from '@/lib/services/rateLimitService';

describe('Rate Limiting Service', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('checkRateLimit', () => {
    const defaultConfig: RateLimitConfig = {
      prefix: 'test',
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5,
    };

    it('should allow requests within limit', async () => {
      const identifier = `test-user-${Date.now()}`;

      const result = await checkRateLimit(identifier, defaultConfig);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4); // 5 - 1 = 4
      expect(result.limit).toBe(5);
    });

    it('should track remaining requests correctly', async () => {
      const identifier = `test-user-remaining-${Date.now()}`;

      // Make 3 requests
      const result1 = await checkRateLimit(identifier, defaultConfig);
      const result2 = await checkRateLimit(identifier, defaultConfig);
      const result3 = await checkRateLimit(identifier, defaultConfig);

      expect(result1.remaining).toBe(4);
      expect(result2.remaining).toBe(3);
      expect(result3.remaining).toBe(2);
    });

    it('should deny requests when limit exceeded', async () => {
      const identifier = `test-user-exceeded-${Date.now()}`;
      const strictConfig: RateLimitConfig = {
        prefix: 'strict',
        windowMs: 60 * 1000,
        maxRequests: 2,
      };

      // Make requests up to limit
      await checkRateLimit(identifier, strictConfig);
      await checkRateLimit(identifier, strictConfig);

      // Third request should be denied
      const result = await checkRateLimit(identifier, strictConfig);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should include reset time in result', async () => {
      const identifier = `test-user-reset-${Date.now()}`;

      const result = await checkRateLimit(identifier, defaultConfig);

      expect(result.resetIn).toBeGreaterThan(0);
      expect(result.resetIn).toBeLessThanOrEqual(60); // Within 1 minute
    });

    it('should use prefix in rate limit key', async () => {
      const identifier = `test-user-prefix-${Date.now()}`;
      const config1: RateLimitConfig = {
        prefix: 'api',
        windowMs: 60000,
        maxRequests: 5,
      };
      const config2: RateLimitConfig = {
        prefix: 'auth',
        windowMs: 60000,
        maxRequests: 5,
      };

      // Same identifier, different prefixes should have separate limits
      await checkRateLimit(identifier, config1);
      await checkRateLimit(identifier, config1);

      const result1 = await checkRateLimit(identifier, config1);
      const result2 = await checkRateLimit(identifier, config2);

      // api: 3 requests made, remaining = 2
      expect(result1.remaining).toBe(2);
      // auth: 1 request made, remaining = 4
      expect(result2.remaining).toBe(4);
    });
  });

  describe('createRateLimiter', () => {
    it('should create a reusable limiter function', async () => {
      const limiter = createRateLimiter({
        prefix: 'custom',
        windowMs: 30 * 1000,
        maxRequests: 10,
      });

      const identifier = `custom-user-${Date.now()}`;
      const result = await limiter(identifier);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(10);
    });

    it('should apply the same config to all calls', async () => {
      const limiter = createRateLimiter({
        prefix: 'consistent',
        windowMs: 60 * 1000,
        maxRequests: 3,
      });

      const id1 = `user1-${Date.now()}`;
      const id2 = `user2-${Date.now()}`;

      const result1 = await limiter(id1);
      const result2 = await limiter(id2);

      expect(result1.limit).toBe(3);
      expect(result2.limit).toBe(3);
    });
  });

  describe('Rate limit configuration', () => {
    it('should handle different window sizes', async () => {
      const shortWindow: RateLimitConfig = {
        prefix: 'short',
        windowMs: 1000, // 1 second
        maxRequests: 2,
      };

      const identifier = `short-window-${Date.now()}`;

      await checkRateLimit(identifier, shortWindow);
      await checkRateLimit(identifier, shortWindow);
      const result = await checkRateLimit(identifier, shortWindow);

      expect(result.allowed).toBe(false);
      expect(result.resetIn).toBeLessThanOrEqual(1);
    });

    it('should handle high request limits', async () => {
      const highLimit: RateLimitConfig = {
        prefix: 'high',
        windowMs: 60 * 1000,
        maxRequests: 1000,
      };

      const identifier = `high-limit-${Date.now()}`;
      const result = await checkRateLimit(identifier, highLimit);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(999);
      expect(result.limit).toBe(1000);
    });
  });

  describe('RateLimitResult structure', () => {
    it('should return all required fields', async () => {
      const config: RateLimitConfig = {
        prefix: 'structure',
        windowMs: 60 * 1000,
        maxRequests: 5,
      };

      const identifier = `structure-test-${Date.now()}`;
      const result: RateLimitResult = await checkRateLimit(identifier, config);

      // Verify all fields exist
      expect(typeof result.allowed).toBe('boolean');
      expect(typeof result.remaining).toBe('number');
      expect(typeof result.resetIn).toBe('number');
      expect(typeof result.limit).toBe('number');
    });

    it('should have non-negative remaining count', async () => {
      const config: RateLimitConfig = {
        prefix: 'nonneg',
        windowMs: 60 * 1000,
        maxRequests: 2,
      };

      const identifier = `nonneg-test-${Date.now()}`;

      // Exceed the limit
      await checkRateLimit(identifier, config);
      await checkRateLimit(identifier, config);
      await checkRateLimit(identifier, config);
      const result = await checkRateLimit(identifier, config);

      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Fail-closed behavior', () => {
    it('should respect failClosed config', async () => {
      const failClosedConfig: RateLimitConfig = {
        prefix: 'failclosed',
        windowMs: 60 * 1000,
        maxRequests: 5,
        failClosed: true,
      };

      const failOpenConfig: RateLimitConfig = {
        prefix: 'failopen',
        windowMs: 60 * 1000,
        maxRequests: 5,
        failClosed: false,
      };

      // In normal operation, both should allow
      const identifier1 = `failclosed-${Date.now()}`;
      const identifier2 = `failopen-${Date.now()}`;

      const result1 = await checkRateLimit(identifier1, failClosedConfig);
      const result2 = await checkRateLimit(identifier2, failOpenConfig);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
    });
  });
});
