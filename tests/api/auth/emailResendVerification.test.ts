import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const createAdminClientMock = vi.fn();

const mocks = vi.hoisted(() => ({
  limiterMock: vi.fn(async (_id: string) => ({
    allowed: true,
    remaining: 2,
    resetIn: 3600,
  })),
  createAndSendVerificationMock: vi.fn(async (_admin: any, _userId: string, _email: string) => ({
    success: true,
  })),
  getClientIpMock: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => createAdminClientMock(),
}));

vi.mock('@/lib/security/ip', () => ({
  getClientIP: () => mocks.getClientIpMock(),
}));

vi.mock('@/lib/security/emailVerification', () => ({
  emailVerifyResendLimiter: (id: string) => mocks.limiterMock(id),
  createAndSendVerification: (admin: any, userId: string, email: string) =>
    mocks.createAndSendVerificationMock(admin, userId, email),
}));

describe('email resend verification API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createAdminClientMock.mockReset();
  });

  it('returns generic success when admin client is not configured', async () => {
    createAdminClientMock.mockReturnValue(null);

    const { POST } = await import('@/app/api/auth/email/resend-verification/route');

    const req = new NextRequest('http://localhost/api/auth/email/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.sent).toBe(true);
    expect(mocks.createAndSendVerificationMock).not.toHaveBeenCalled();
  });

  it('does not leak user existence (unknown email still returns success)', async () => {
    createAdminClientMock.mockReturnValue({
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
      auth: { admin: { getUserById: vi.fn() } },
    });

    const { POST } = await import('@/app/api/auth/email/resend-verification/route');

    const req = new NextRequest('http://localhost/api/auth/email/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'unknown@example.com' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.sent).toBe(true);
    expect(mocks.createAndSendVerificationMock).not.toHaveBeenCalled();
  });

  it('triggers resend when user exists and is not confirmed', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ user_id: 'user-1', user_email: 'user@example.com', user_meta: {} }],
      error: null,
    });
    const getUserById = vi.fn().mockResolvedValue({
      data: { user: { email_confirmed_at: null } },
      error: null,
    });

    createAdminClientMock.mockReturnValue({
      rpc,
      auth: { admin: { getUserById } },
    });

    const { POST } = await import('@/app/api/auth/email/resend-verification/route');

    const req = new NextRequest('http://localhost/api/auth/email/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.sent).toBe(true);
    expect(rpc).toHaveBeenCalledWith('lookup_user_by_email', {
      lookup_email: 'user@example.com',
    });
    expect(getUserById).toHaveBeenCalledWith('user-1');
    expect(mocks.createAndSendVerificationMock).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      'user@example.com',
    );
  });

  it('returns 429 when rate limited', async () => {
    mocks.limiterMock.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetIn: 60,
    });
    createAdminClientMock.mockReturnValue({
      rpc: vi.fn(),
      auth: { admin: { getUserById: vi.fn() } },
    });

    const { POST } = await import('@/app/api/auth/email/resend-verification/route');

    const req = new NextRequest('http://localhost/api/auth/email/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });
});
