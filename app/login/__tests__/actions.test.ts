import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginAction } from '../actions';
import { checkRateLimit } from '@/lib/utils/rate-limit';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    },
  })),
}));

vi.mock('@/lib/utils/rate-limit', () => ({
  checkRateLimit: vi.fn(),
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
    vi.mocked(checkRateLimit).mockResolvedValue({ success: false, remaining: 0 });
    const result = await loginAction({ email: 'test@uni.edu.au', password: 'password' });
    expect(result.error).toBe('rate_limit_exceeded');
  });

  it('succeeds with valid data', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ success: true, remaining: 5 });
    const result = await loginAction({ email: 'test@uni.edu.au', password: 'password' });
    expect(result.success).toBe(true);
  });
});
