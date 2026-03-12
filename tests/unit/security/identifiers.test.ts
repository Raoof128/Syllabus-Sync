/**
 * Security Identifiers Tests
 */
import { describe, it, expect } from 'vitest';
import { sha256HexPrefix, emailKeyPrefix } from '@/lib/security/identifiers';

describe('sha256HexPrefix', () => {
  it('returns a hex string of the specified length', () => {
    const result = sha256HexPrefix('hello', 16);
    expect(result).toHaveLength(16);
    expect(result).toMatch(/^[0-9a-f]+$/);
  });

  it('normalizes input (trim + lowercase)', () => {
    const a = sha256HexPrefix('  HELLO  ', 16);
    const b = sha256HexPrefix('hello', 16);
    expect(a).toBe(b);
  });

  it('defaults to 16 hex chars', () => {
    const result = sha256HexPrefix('test');
    expect(result).toHaveLength(16);
  });

  it('clamps to minimum 8 chars', () => {
    const result = sha256HexPrefix('test', 2);
    expect(result).toHaveLength(8);
  });

  it('clamps to maximum 64 chars', () => {
    const result = sha256HexPrefix('test', 100);
    expect(result).toHaveLength(64);
  });

  it('produces consistent output', () => {
    expect(sha256HexPrefix('foo', 12)).toBe(sha256HexPrefix('foo', 12));
  });

  it('produces different output for different inputs', () => {
    expect(sha256HexPrefix('foo')).not.toBe(sha256HexPrefix('bar'));
  });
});

describe('emailKeyPrefix', () => {
  it('returns a 16-char hex prefix for an email', () => {
    const result = emailKeyPrefix('user@example.com');
    expect(result).toHaveLength(16);
    expect(result).toMatch(/^[0-9a-f]+$/);
  });

  it('normalizes email casing', () => {
    expect(emailKeyPrefix('User@Example.COM')).toBe(emailKeyPrefix('user@example.com'));
  });
});
