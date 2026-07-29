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

describe('middleware mfa enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJ.test';

    supabaseMocks.getUserMock.mockResolvedValue({
      data: { user: { id: 'user-1', email_confirmed_at: '2026-01-01T00:00:00Z' } },
      error: null,
    });

    supabaseMocks.getAalMock.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2' },
      error: null,
    });
  });

  it('redirects protected routes to /login?mfa=1 when aal2 upgrade is required', async () => {
    const { middleware } = await import('@/lib/middleware');

    const req = new NextRequest('http://localhost/calendar');
    const res = await middleware(req);

    expect(res.status).toBeGreaterThanOrEqual(300);
    const location = res.headers.get('location');
    expect(location).toContain('/login');
    expect(location).toContain('mfa=1');
    expect(location).toContain('redirectTo=%2Fcalendar');
  });

  it('allows /login to render when aal2 upgrade is required (no redirect to /home)', async () => {
    const { middleware } = await import('@/lib/middleware');

    const req = new NextRequest('http://localhost/login?mfa=1');
    const res = await middleware(req);

    expect(res.headers.get('location')).toBeNull();
  });

  it('redirects authenticated users away from /login when no mfa upgrade is required', async () => {
    supabaseMocks.getAalMock.mockResolvedValueOnce({
      data: { currentLevel: 'aal2', nextLevel: 'aal2' },
      error: null,
    });

    const { middleware } = await import('@/lib/middleware');

    const req = new NextRequest('http://localhost/login');
    const res = await middleware(req);

    expect(res.headers.get('location')).toContain('/home');
  });

  it('returns 403 for non-public API routes when aal2 upgrade is required', async () => {
    const { middleware } = await import('@/lib/middleware');

    const req = new NextRequest('http://localhost/api/user/export');
    const res = await middleware(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.code).toBe('MFA_REQUIRED');
  });

  it('returns 503 for non-public API routes when auth status is unknown', async () => {
    vi.useFakeTimers();
    supabaseMocks.getUserMock.mockImplementationOnce(() => new Promise(() => {}) as any);

    const { middleware } = await import('@/lib/middleware');

    const req = new NextRequest('http://localhost/api/user/export');
    const pending = middleware(req);
    await vi.advanceTimersByTimeAsync(6000);
    const res = await pending;
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json.code).toBe('AUTH_UNAVAILABLE');
    vi.useRealTimers();
  });

  it('BA-0009: redirects a protected page to /login?mfa=1 instead of serving it when the AAL check times out', async () => {
    // SECURITY REGRESSION: requiresMfaUpgrade defaults to false, so when the
    // AAL check itself times out (mfaResolution stays 'unknown'), the
    // protected-page branch used to silently read that as "no MFA upgrade
    // needed" and serve the page - a fail-open bypass of step-up MFA. The
    // API-route branch already fails closed with 503 in the same situation.
    vi.useFakeTimers();
    supabaseMocks.getAalMock.mockImplementationOnce(() => new Promise(() => {}) as any);

    const { middleware } = await import('@/lib/middleware');

    const req = new NextRequest('http://localhost/calendar');
    const pending = middleware(req);
    await vi.advanceTimersByTimeAsync(2500);
    const res = await pending;

    expect(res.status).toBeGreaterThanOrEqual(300);
    const location = res.headers.get('location');
    expect(location).toContain('/login');
    expect(location).toContain('mfa=1');
    vi.useRealTimers();
  });

  it('BA-0009: does not send an already-authenticated visitor from /login to /home when the AAL check times out', async () => {
    vi.useFakeTimers();
    supabaseMocks.getAalMock.mockImplementationOnce(() => new Promise(() => {}) as any);

    const { middleware } = await import('@/lib/middleware');

    const req = new NextRequest('http://localhost/login');
    const pending = middleware(req);
    await vi.advanceTimersByTimeAsync(2500);
    const res = await pending;

    const location = res.headers.get('location');
    expect(location === null || !location.includes('/home')).toBe(true);
    vi.useRealTimers();
  });

  it('allows /api/webauthn/authenticate/* through without auth (pre-login passkey flow)', async () => {
    // Simulate unauthenticated user (no session)
    supabaseMocks.getUserMock.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const { middleware } = await import('@/lib/middleware');

    const optionsReq = new NextRequest('http://localhost/api/webauthn/authenticate/options', {
      method: 'POST',
    });
    const optionsRes = await middleware(optionsReq);
    // Should NOT be 401/403 — the route is public
    expect(optionsRes.status).not.toBe(401);
    expect(optionsRes.status).not.toBe(403);

    const verifyReq = new NextRequest('http://localhost/api/webauthn/authenticate/verify', {
      method: 'POST',
    });
    const verifyRes = await middleware(verifyReq);
    expect(verifyRes.status).not.toBe(401);
    expect(verifyRes.status).not.toBe(403);
  });

  it('blocks /api/webauthn/register/* without auth (requires session)', async () => {
    supabaseMocks.getUserMock.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    const { middleware } = await import('@/lib/middleware');

    const req = new NextRequest('http://localhost/api/webauthn/register/options', {
      method: 'POST',
    });
    const res = await middleware(req);
    expect(res.status).toBe(401);
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

    const { middleware } = await import('@/lib/middleware');

    const req = new NextRequest('http://localhost/calendar');
    const res = await middleware(req);

    expect(supabaseMocks.signOutMock).not.toHaveBeenCalled();
    expect(res.headers.get('location')).toContain('/login');
  });
});
