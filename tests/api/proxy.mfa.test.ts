import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const supabaseMocks = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  signOutMock: vi.fn(),
  getAalMock: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: supabaseMocks.getUserMock,
      signOut: supabaseMocks.signOutMock,
      mfa: {
        getAuthenticatorAssuranceLevel: supabaseMocks.getAalMock,
      },
    },
  })),
}));

describe('proxy mfa enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJ.test';

    supabaseMocks.getUserMock.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    supabaseMocks.getAalMock.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2' },
      error: null,
    });
  });

  it('redirects protected routes to /login?mfa=1 when aal2 upgrade is required', async () => {
    const { proxy } = await import('@/lib/proxy');

    const req = new NextRequest('http://localhost/calendar');
    const res = await proxy(req);

    expect(res.status).toBeGreaterThanOrEqual(300);
    const location = res.headers.get('location');
    expect(location).toContain('/login');
    expect(location).toContain('mfa=1');
    expect(location).toContain('redirectTo=%2Fcalendar');
  });

  it('allows /login to render when aal2 upgrade is required (no redirect to /home)', async () => {
    const { proxy } = await import('@/lib/proxy');

    const req = new NextRequest('http://localhost/login?mfa=1');
    const res = await proxy(req);

    expect(res.headers.get('location')).toBeNull();
  });

  it('redirects authenticated users away from /login when no mfa upgrade is required', async () => {
    supabaseMocks.getAalMock.mockResolvedValueOnce({
      data: { currentLevel: 'aal2', nextLevel: 'aal2' },
      error: null,
    });

    const { proxy } = await import('@/lib/proxy');

    const req = new NextRequest('http://localhost/login');
    const res = await proxy(req);

    expect(res.headers.get('location')).toContain('/home');
  });

  it('returns 403 for non-public API routes when aal2 upgrade is required', async () => {
    const { proxy } = await import('@/lib/proxy');

    const req = new NextRequest('http://localhost/api/user/export');
    const res = await proxy(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.code).toBe('MFA_REQUIRED');
  });

  it('returns 503 for non-public API routes when auth status is unknown', async () => {
    vi.useFakeTimers();
    supabaseMocks.getUserMock.mockImplementationOnce(() => new Promise(() => {}) as any);

    const { proxy } = await import('@/lib/proxy');

    const req = new NextRequest('http://localhost/api/user/export');
    const pending = proxy(req);
    await vi.advanceTimersByTimeAsync(6000);
    const res = await pending;
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json.code).toBe('AUTH_UNAVAILABLE');
    vi.useRealTimers();
  });

  it('does not force local signout for non-refresh 400 auth errors', async () => {
    supabaseMocks.getUserMock.mockResolvedValueOnce({
      data: { user: null },
      error: {
        message: 'Bad Request',
        status: 400,
        code: 'unexpected_error',
      },
    });

    const { proxy } = await import('@/lib/proxy');

    const req = new NextRequest('http://localhost/calendar');
    const res = await proxy(req);

    expect(supabaseMocks.signOutMock).not.toHaveBeenCalled();
    expect(res.headers.get('location')).toContain('/login');
  });
});
