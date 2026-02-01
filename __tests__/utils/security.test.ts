import { describe, it, expect } from 'vitest';
import { calculatePasswordStrength } from '@/lib/utils/security';

describe('Security Utils', () => {
  it('identifies weak passwords', () => {
    expect(calculatePasswordStrength('12345').strength).toBe('weak');
  });

  it('validates strong passwords correctly', () => {
    const result = calculatePasswordStrength('Raouf_Secure_2026!');
    expect(result.strength).toBe('strong');
    expect(result.score).toBeGreaterThanOrEqual(4);
  });
});
