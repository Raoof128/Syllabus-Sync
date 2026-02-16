import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/password/request-reset/route';

const createAdminClientMock = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => createAdminClientMock(),
}));

const mocks = vi.hoisted(() => ({
  limiterMock: vi.fn(async (_id: string) => ({
    allowed: true,
    remaining: 5,
    resetIn: 3600,
  })),
  createAndSendPasswordResetMock: vi.fn(async () => ({ success: true })),
}));

vi.mock('@/lib/security/passwordReset', () => ({
  passwordResetRequestLimiter: (id: string) => mocks.limiterMock(id),
  createAndSendPasswordReset: mocks.createAndSendPasswordResetMock,
}));

describe('password reset request API', () => {
  beforeEach(() => {
    createAdminClientMock.mockReset();
    mocks.limiterMock.mockClear();
    mocks.createAndSendPasswordResetMock.mockClear();
  });

  it('returns generic success when admin client is not configured', async () => {
    createAdminClientMock.mockReturnValue(null);

    const req = new NextRequest('http://localhost/api/auth/password/request-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.sent).toBe(true);
    expect(mocks.createAndSendPasswordResetMock).not.toHaveBeenCalled();
  });

  it('does not leak user existence (unknown email still returns success)', async () => {
    createAdminClientMock.mockReturnValue({
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    const req = new NextRequest('http://localhost/api/auth/password/request-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'unknown@example.com' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.sent).toBe(true);
    expect(mocks.createAndSendPasswordResetMock).not.toHaveBeenCalled();
  });

  it('triggers password reset send when user exists', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ user_id: 'user-1', user_email: 'user@example.com', user_meta: {} }],
      error: null,
    });

    createAdminClientMock.mockReturnValue({ rpc });

    const req = new NextRequest('http://localhost/api/auth/password/request-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.sent).toBe(true);
    expect(rpc).toHaveBeenCalledWith('lookup_user_by_email', { lookup_email: 'user@example.com' });
    expect(mocks.createAndSendPasswordResetMock).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      'user@example.com',
    );
  });
});
