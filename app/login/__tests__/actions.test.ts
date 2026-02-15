import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginAction } from '../actions';
import { loginLimiter } from '@/lib/services/rateLimitService';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      mfa: {
        getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
          data: { currentLevel: 'aal1', nextLevel: 'aal1' },
        }),
        listFactors: vi.fn().mockResolvedValue({ data: { all: [] } }),
      },
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    },
  })),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('@/lib/security/ip', () => ({
  getClientIPFromHeaders: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/lib/services/rateLimitService', () => ({
  loginLimiter: vi.fn(),
}));

// Mock logger to prevent console spam during tests
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('loginAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks invalid email formats', async () => {
    const result = await loginAction({ email: 'not-an-email', password: '123' });
    expect(result.error).toBe('validation_error');
  });

  it('blocks rate limited users', async () => {
    vi.mocked(loginLimiter).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetIn: 60,
      limit: 10,
    });
    const result = await loginAction({ email: 'test@uni.edu.au', password: 'password' });
    expect(result.error).toBe('rate_limit_exceeded');
  });

  it('succeeds with valid data', async () => {
    vi.mocked(loginLimiter).mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetIn: 60,
      limit: 10,
    });
    const result = await loginAction({ email: 'test@uni.edu.au', password: 'password' });
    expect(result.success).toBe(true);
  });
});
