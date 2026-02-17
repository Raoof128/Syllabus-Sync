/**
 * MFA unenroll fail-closed tests
 *
 * Ensures disabling MFA cannot proceed when AAL/factors can't be validated.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/mfa/unenroll/route';

const createServerClientMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => createServerClientMock(),
}));

vi.mock('@/lib/security/mfa', async () => {
  const actual = await vi.importActual<typeof import('@/lib/security/mfa')>('@/lib/security/mfa');
  return {
    ...actual,
    mfaUnenrollLimiter: vi.fn().mockResolvedValue({ allowed: true, remaining: 4, resetIn: 60 }),
  };
});

describe('MFA unenroll fail-closed', () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
  });

  it('returns 503 when listFactors fails', async () => {
    createServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
        mfa: {
          listFactors: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
        },
      },
    });

    const req = new Request('http://localhost/api/auth/mfa/unenroll', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ factorId: '550e8400-e29b-41d4-a716-446655440000' }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(503);
  });

  it('returns 503 when AAL check fails and MFA is active', async () => {
    createServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
        mfa: {
          listFactors: vi.fn().mockResolvedValue({
            data: {
              all: [{ id: 'factor-1', status: 'verified' }],
              totp: [],
              phone: [],
            },
            error: null,
          }),
          getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'aal down' },
          }),
        },
      },
    });

    const req = new Request('http://localhost/api/auth/mfa/unenroll', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ factorId: '550e8400-e29b-41d4-a716-446655440000' }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(503);
  });
});

