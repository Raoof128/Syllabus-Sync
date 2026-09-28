/**
 * Regression guard for BA-0062.
 *
 * The password-reset and email-verification token limiters were keyed on
 * `x-forwarded-for.split(',')[0]`. Cloudflare appends the real client address
 * to whatever X-Forwarded-For the client sent, so the first entry is chosen by
 * the caller: rotating it gave every attempt a fresh bucket. Both routes must
 * key on the platform-verified address from getClientIP().
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const passwordResetTokenLimiter = vi.fn();
const emailVerifyTokenLimiter = vi.fn();

vi.mock(import('@/lib/services/rateLimitService'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    passwordResetTokenLimiter: (key: string) => passwordResetTokenLimiter(key),
    emailVerifyTokenLimiter: (key: string) => emailVerifyTokenLimiter(key),
  };
});

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({}) }));

import { POST as resetPOST } from '@/app/api/auth/password/reset/route';
import { POST as verifyPOST } from '@/app/api/auth/email/verify/route';

const REAL_IP = '203.0.113.7';

function req(path: string, spoofedXff: string) {
  return new NextRequest(`https://www.syllabus-sync.app${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'cf-connecting-ip': REAL_IP,
      'x-forwarded-for': `${spoofedXff}, ${REAL_IP}`,
    },
    body: '{}',
  });
}

describe('token limiters key on the verified client IP, not X-Forwarded-For', () => {
  const saved = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...saved,
      DEPLOYMENT_PLATFORM: 'cloudflare',
      DEPLOYMENT_ENV: 'production',
      NODE_ENV: 'production',
      VERCEL: '',
      VERCEL_ENV: '',
    } as NodeJS.ProcessEnv;
    // Deny, so the test stops at the limiter and never touches the database.
    const denied = { allowed: false, remaining: 0, resetIn: 60 };
    passwordResetTokenLimiter.mockResolvedValue(denied);
    emailVerifyTokenLimiter.mockResolvedValue(denied);
  });

  afterEach(() => {
    process.env = { ...saved };
  });

  it('password reset: rotating X-Forwarded-For does not change the bucket', async () => {
    await resetPOST(req('/api/auth/password/reset', '1.1.1.1'));
    await resetPOST(req('/api/auth/password/reset', '2.2.2.2'));

    const keys = passwordResetTokenLimiter.mock.calls.map(([k]) => k);
    expect(keys).toEqual([`ip:${REAL_IP}:password-reset`, `ip:${REAL_IP}:password-reset`]);
  });

  it('email verification: rotating X-Forwarded-For does not change the bucket', async () => {
    await verifyPOST(req('/api/auth/email/verify', '1.1.1.1'));
    await verifyPOST(req('/api/auth/email/verify', '2.2.2.2'));

    const keys = emailVerifyTokenLimiter.mock.calls.map(([k]) => k);
    expect(keys).toEqual([`ip:${REAL_IP}:email-verify`, `ip:${REAL_IP}:email-verify`]);
  });
});
