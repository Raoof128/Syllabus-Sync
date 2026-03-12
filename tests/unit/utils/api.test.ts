/**
 * API Utility Tests
 * Tests isLikelyNetworkError, isBrowserOffline, initCsrfToken, and apiRequest
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isLikelyNetworkError, isBrowserOffline } from '@/lib/utils/api';

describe('isLikelyNetworkError', () => {
  it('returns true for "Failed to fetch"', () => {
    expect(isLikelyNetworkError(new Error('Failed to fetch'))).toBe(true);
  });

  it('returns true for "NetworkError"', () => {
    expect(isLikelyNetworkError(new Error('NetworkError when attempting to fetch resource'))).toBe(
      true,
    );
  });

  it('returns true for "network request failed"', () => {
    expect(isLikelyNetworkError(new Error('network request failed'))).toBe(true);
  });

  it('returns true for "Load failed"', () => {
    expect(isLikelyNetworkError(new Error('Load failed'))).toBe(true);
  });

  it('returns false for regular errors', () => {
    expect(isLikelyNetworkError(new Error('404 not found'))).toBe(false);
    expect(isLikelyNetworkError(new Error('Validation failed'))).toBe(false);
  });

  it('returns false for non-Error values', () => {
    expect(isLikelyNetworkError('string')).toBe(false);
    expect(isLikelyNetworkError(null)).toBe(false);
    expect(isLikelyNetworkError(undefined)).toBe(false);
    expect(isLikelyNetworkError(42)).toBe(false);
  });
});

describe('isBrowserOffline', () => {
  it('returns false when navigator.onLine is true', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    expect(isBrowserOffline()).toBe(false);
  });

  it('returns true when navigator.onLine is false', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    expect(isBrowserOffline()).toBe(true);
    // Restore
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });
});
