/**
 * Retry Utility Tests
 * Tests the retry logic, error handling, conditions, and wrappers
 */
import { describe, it, expect, vi } from 'vitest';
import {
  withRetry,
  RetryError,
  retryConditions,
  createRetryWrapper,
  retryWrappers,
} from '@/lib/utils/retry';

describe('withRetry', () => {
  it('should return result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValueOnce('success');

    const result = await withRetry(fn, { maxAttempts: 3, delayMs: 10 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw RetryError after max attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));

    await expect(withRetry(fn, { maxAttempts: 3, delayMs: 10 })).rejects.toThrow(RetryError);

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should include attempt count and last error in RetryError', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('oops'));

    try {
      await withRetry(fn, { maxAttempts: 2, delayMs: 10 });
    } catch (error) {
      expect(error).toBeInstanceOf(RetryError);
      const retryErr = error as RetryError;
      expect(retryErr.attempts).toBe(2);
      expect(retryErr.lastError.message).toBe('oops');
    }
  });

  it('should respect retryCondition - stop if condition returns false', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('client error'));

    await expect(
      withRetry(fn, {
        maxAttempts: 3,
        delayMs: 10,
        retryCondition: () => false,
      }),
    ).rejects.toThrow(RetryError);

    expect(fn).toHaveBeenCalledTimes(1); // No retries
  });

  it('should apply backoff multiplier', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('ok');

    const start = Date.now();
    await withRetry(fn, { maxAttempts: 3, delayMs: 50, backoffMultiplier: 2 });
    const elapsed = Date.now() - start;

    // First delay: ~50ms, second delay: ~100ms -> total ~150ms
    expect(elapsed).toBeGreaterThanOrEqual(100);
  });

  it('should convert non-Error throws to Error objects', async () => {
    const fn = vi.fn().mockRejectedValue('string error');

    try {
      await withRetry(fn, { maxAttempts: 1, delayMs: 10 });
    } catch (error) {
      expect(error).toBeInstanceOf(RetryError);
      expect((error as RetryError).lastError.message).toBe('string error');
    }
  });
});

describe('retryConditions', () => {
  it('networkError detects network errors', () => {
    expect(retryConditions.networkError(new Error('NetworkError: failed'))).toBe(true);
    expect(retryConditions.networkError(new Error('Failed to fetch'))).toBe(true);

    const timeoutErr = new Error('timeout');
    timeoutErr.name = 'TimeoutError';
    expect(retryConditions.networkError(timeoutErr)).toBe(true);

    expect(retryConditions.networkError(new Error('404 not found'))).toBe(false);
  });

  it('serverError detects 5xx errors', () => {
    expect(retryConditions.serverError(new Error('500 Internal Server Error'))).toBe(true);
    expect(retryConditions.serverError(new Error('502 Bad Gateway'))).toBe(true);
    expect(retryConditions.serverError(new Error('503 Service Unavailable'))).toBe(true);
    expect(retryConditions.serverError(new Error('504 Gateway Timeout'))).toBe(true);
    expect(retryConditions.serverError(new Error('404 not found'))).toBe(false);
  });

  it('always returns true', () => {
    expect(retryConditions.always()).toBe(true);
  });

  it('never returns false', () => {
    expect(retryConditions.never()).toBe(false);
  });
});

describe('createRetryWrapper', () => {
  it('creates a reusable wrapper', async () => {
    const wrapper = createRetryWrapper({ maxAttempts: 2, delayMs: 10 });
    const fn = vi.fn().mockResolvedValue(42);

    const result = await wrapper(fn);
    expect(result).toBe(42);
  });
});

describe('retryWrappers', () => {
  it('apiCall wrapper exists', () => {
    expect(typeof retryWrappers.apiCall).toBe('function');
  });

  it('critical wrapper exists', () => {
    expect(typeof retryWrappers.critical).toBe('function');
  });

  it('fast wrapper exists', () => {
    expect(typeof retryWrappers.fast).toBe('function');
  });

  it('fast wrapper retries on network error', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValueOnce('ok');

    const result = await retryWrappers.fast(fn);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
