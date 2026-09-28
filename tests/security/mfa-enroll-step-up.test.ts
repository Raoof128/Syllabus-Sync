/**
 * Regression guard for BA-0064 (enrolment half).
 *
 * `/api/auth/*` sits outside the middleware AAL2 gate. Without a check of its
 * own, an attacker holding only the password of an MFA-protected account could
 * enrol their own TOTP app or phone as an additional factor, then pass every
 * future step-up with it.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const createServerClientMock = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => createServerClientMock(),
}));

vi.mock('@/lib/security/mfa', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/security/mfa')>();
  return {
    ...actual,
    smsSendLimiter: vi.fn().mockResolvedValue({ allowed: true, remaining: 9, resetIn: 0 }),
  };
});

vi.mock(import('@/lib/services/rateLimitService'), async (importOriginal) => {
  const actual = await importOriginal();
  const allow = vi.fn().mockResolvedValue({ allowed: true, remaining: 9, resetIn: 0 });
  return { ...actual, checkRateLimit: allow, createRateLimiter: () => allow };
});

import { POST as totpEnroll } from '@/app/api/auth/mfa/enroll/route';
import { POST as smsEnroll } from '@/app/api/auth/mfa/sms/enroll/route';

function client(opts: { verified: boolean; aal: 'aal1' | 'aal2' }) {
  const enroll = vi.fn().mockResolvedValue({
    data: { id: 'f1', totp: { qr_code: 'q', secret: 's', uri: 'u' } },
    error: null,
  });
  return {
    enroll,
    value: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
        mfa: {
          listFactors: vi.fn().mockResolvedValue({
            data: { all: opts.verified ? [{ id: 'f0', status: 'verified' }] : [], totp: [] },
            error: null,
          }),
          getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
            data: { currentLevel: opts.aal, nextLevel: opts.verified ? 'aal2' : 'aal1' },
            error: null,
          }),
          enroll,
          unenroll: vi.fn(),
          challenge: vi.fn().mockResolvedValue({ data: { id: 'c1' }, error: null }),
        },
      },
    },
  };
}

const smsRequest = () =>
  new NextRequest('https://www.syllabus-sync.app/api/auth/mfa/sms/enroll', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ phone: '+61412345678' }),
  });
const totpRequest = () =>
  new NextRequest('https://www.syllabus-sync.app/api/auth/mfa/enroll', { method: 'POST' });

describe('MFA enrolment requires step-up once a factor exists (BA-0064)', () => {
  beforeEach(() => createServerClientMock.mockReset());

  it.each([
    ['TOTP', () => totpEnroll(totpRequest())],
    ['SMS', () => smsEnroll(smsRequest())],
  ])('%s: refuses to add a factor from an AAL1 session', async (_name, call) => {
    const c = client({ verified: true, aal: 'aal1' });
    createServerClientMock.mockResolvedValue(c.value);

    const res = await call();

    expect(res.status).toBe(403);
    expect(c.enroll).not.toHaveBeenCalled();
  });

  it.each([
    ['TOTP', () => totpEnroll(totpRequest())],
    ['SMS', () => smsEnroll(smsRequest())],
  ])('%s: first-time enrolment still works at AAL1', async (_name, call) => {
    const c = client({ verified: false, aal: 'aal1' });
    createServerClientMock.mockResolvedValue(c.value);

    await call();

    expect(c.enroll).toHaveBeenCalledTimes(1);
  });
});
