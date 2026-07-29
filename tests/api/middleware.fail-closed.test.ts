/**
 * Fail-closed regression tests for lib/middleware.ts
 *
 * BA-0008: protected PAGE routes were served rather than redirected when
 * auth.getUser() times out or errors (authResolution === 'unknown'). The
 * equivalent API-route branch already failed closed (503); page routes must
 * fail closed too, by denying access (redirect to /login) rather than
 * rendering the protected page.
 *
 * BA-0010: when Supabase env config is invalid/missing, the proxy silently
 * returned `response` (i.e. forwarded the request to its handler with zero
 * auth check) for every route that isn't in the page-only `protectedRoutes`
 * list - which includes every non-public API route. Non-public API routes
 * must fail closed (503) instead of bypassing auth entirely.
 */
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

describe('middleware fail-closed on unresolved auth checks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJ.test';

    supabaseMocks.getAalMock.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal1' },
      error: null,
    });
  });

  it('BA-0008: redirects a protected page to /login instead of serving it when auth.getUser() times out', async () => {
    vi.useFakeTimers();
    supabaseMocks.getUserMock.mockImplementationOnce(() => new Promise(() => {}) as never);

    const { middleware } = await import('@/lib/middleware');

    const req = new NextRequest('http://localhost/calendar');
    const pending = middleware(req);
    await vi.advanceTimersByTimeAsync(6000);
    const res = await pending;

    expect(res.status).toBeGreaterThanOrEqual(300);
    const location = res.headers.get('location');
    expect(location).toContain('/login');
    expect(location).toContain('redirectTo=%2Fcalendar');
    vi.useRealTimers();
  });

  it('BA-0010: fails closed with 503 for a protected API route when Supabase env config is invalid', async () => {
    // Invalid URL (missing "supabase.co") makes hasValidUrl false, the same
    // condition that previously let the request through with no auth check.
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://your-project-id.example.com';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJ.test';

    const { middleware } = await import('@/lib/middleware');

    const req = new NextRequest('http://localhost/api/user/export');
    const res = await middleware(req);
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json.code).toBe('AUTH_UNAVAILABLE');
    // The route handler must never have been reached - getUser should not
    // even be called once middleware short-circuits on invalid env config.
    expect(supabaseMocks.getUserMock).not.toHaveBeenCalled();
  });

  it('BA-0010: still redirects protected pages to /login when Supabase env config is invalid (unchanged safe behavior)', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://your-project-id.example.com';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJ.test';

    const { middleware } = await import('@/lib/middleware');

    const req = new NextRequest('http://localhost/calendar');
    const res = await middleware(req);

    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('BA-0010: public API routes remain reachable when Supabase env config is invalid', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://your-project-id.example.com';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJ.test';

    const { middleware } = await import('@/lib/middleware');

    const req = new NextRequest('http://localhost/api/health');
    const res = await middleware(req);

    expect(res.status).not.toBe(503);
    expect(res.status).not.toBe(401);
  });
});
