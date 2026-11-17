import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/signout/route';

const signOutMock = vi.fn();
const getUserMock = vi.fn();
const logAuthAuditEventMock = vi.fn();

const makeRequest = () => new NextRequest('http://localhost/api/auth/signout', { method: 'POST' });

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: async () => ({ auth: { signOut: signOutMock, getUser: getUserMock } }),
}));

vi.mock('@/lib/security/auth-audit', () => ({
  logAuthAuditEvent: (...args: unknown[]) => logAuthAuditEventMock(...args),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

describe('POST /api/auth/signout', () => {
  beforeEach(() => {
    signOutMock.mockReset();
    getUserMock.mockReset();
    logAuthAuditEventMock.mockReset();
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  });

  it('signs out the current session only, not every device', async () => {
    signOutMock.mockResolvedValue({ error: null });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    // supabase-js defaults to 'global'; "sign out everywhere" is the separate
    // POST /api/auth/sessions action.
    expect(signOutMock).toHaveBeenCalledWith({ scope: 'local' });
    // The user is read before the session is cleared so the audit row can name them.
    expect(logAuthAuditEventMock).toHaveBeenCalledWith('signout_success', expect.anything(), {
      userId: 'user-1',
    });
  });

  it('returns 400 when Supabase reports a sign-out error', async () => {
    signOutMock.mockResolvedValue({ error: { message: 'boom' } });

    const res = await POST(makeRequest());

    expect(res.status).toBe(400);
  });
});
