/**
 * Security Audit Tests — Login MFA Fail-Closed
 *
 * Tests that the login action properly blocks login when MFA status
 * check fails (fail-closed behavior, not fail-open).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSignInWithPassword = vi.fn();
const mockGetAuthenticatorAssuranceLevel = vi.fn();
const mockListFactors = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () =>
    Promise.resolve({
      auth: {
        signInWithPassword: mockSignInWithPassword,
        mfa: {
          getAuthenticatorAssuranceLevel: mockGetAuthenticatorAssuranceLevel,
          listFactors: mockListFactors,
        },
      },
    }),
}));

vi.mock('@/lib/utils/rate-limit', () => ({
  checkRateLimit: () => ({ success: true }),
}));

// Must import AFTER mocks
const { loginAction } = await import('@/app/login/actions');

describe('Login MFA Fail-Closed (Security Audit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInWithPassword.mockResolvedValue({ error: null });
  });

  it('blocks login when MFA status check throws (fail-closed)', async () => {
    mockGetAuthenticatorAssuranceLevel.mockRejectedValue(new Error('network timeout'));

    const result = await loginAction({
      email: 'test@mq.edu.au',
      password: 'SecurePassword123!',
    });

    expect(result.error).toBe('mfa_check_failed');
    expect(result.success).toBeUndefined();
  });

  it('allows login when no MFA factors are enrolled', async () => {
    mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal1' },
      error: null,
    });

    const result = await loginAction({
      email: 'test@mq.edu.au',
      password: 'SecurePassword123!',
    });

    expect(result.success).toBe(true);
  });

  it('requires MFA when factors are enrolled', async () => {
    mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2' },
      error: null,
    });
    mockListFactors.mockResolvedValue({
      data: {
        all: [
          {
            id: 'factor-1',
            factor_type: 'totp',
            friendly_name: 'Authenticator',
            status: 'verified',
          },
        ],
      },
      error: null,
    });

    const result = await loginAction({
      email: 'test@mq.edu.au',
      password: 'SecurePassword123!',
    });

    expect(result.mfaRequired).toBe(true);
    expect(result.availableFactors).toHaveLength(1);
    expect(result.availableFactors?.[0].type).toBe('totp');
  });

  it('rejects invalid credentials', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    });

    const result = await loginAction({
      email: 'test@mq.edu.au',
      password: 'wrongpassword',
    });

    expect(result.error).toBe('invalid_credentials');
  });
});
