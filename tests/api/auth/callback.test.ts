import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/auth/callback/route';

const createServerClientMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => createServerClientMock(),
}));

describe('auth callback route', () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
  });

  // An OAuth round-trip keeps its session, so it is followed straight to the
  // validated destination. This is the branch that must honour redirectTo
  // directly — the email-verification branch deliberately does not, because it
  // signs the session out first (see callback.signup-verification.test.ts).
  it('redirects an OAuth sign-in to validated redirectTo after exchanging code', async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({
      error: null,
      data: { user: { id: 'u1', app_metadata: { provider: 'google' } } },
    });
    const maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: { faculty: 'Science', course: 'BIT', year: '2' } });
    createServerClientMock.mockResolvedValue({
      auth: { exchangeCodeForSession },
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
    });

    const req = new NextRequest(
      'http://localhost/auth/callback?code=abc&redirectTo=%2Fmap&flow=oauth',
    );
    const res = await GET(req);

    expect(res.headers.get('location')).toBe('http://localhost/map');
    expect(exchangeCodeForSession).toHaveBeenCalledWith('abc');
  });

  it('sends an OAuth sign-in with an incomplete profile through onboarding', async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({
      error: null,
      data: { user: { id: 'u1', app_metadata: { provider: 'google' } } },
    });
    const maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: { faculty: null, course: null, year: null } });
    createServerClientMock.mockResolvedValue({
      auth: { exchangeCodeForSession },
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
    });

    const req = new NextRequest(
      'http://localhost/auth/callback?code=abc&redirectTo=%2Fmap&flow=oauth',
    );
    const res = await GET(req);

    const location = new URL(res.headers.get('location')!);
    expect(location.pathname).toBe('/onboarding');
    expect(location.searchParams.get('next')).toBe('/map');
  });

  it('drops an invalid redirectTo instead of following it', async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null });
    createServerClientMock.mockResolvedValue({
      auth: { exchangeCodeForSession },
    });

    const req = new NextRequest(
      'http://localhost/auth/callback?code=abc&redirectTo=https%3A%2F%2Fevil.com',
    );
    const res = await GET(req);

    expect(res.headers.get('location')).not.toContain('evil.com');
  });

  it('redirects to login with oauth_failed when provider returns an error', async () => {
    const req = new NextRequest(
      'http://localhost/auth/callback?error=access_denied&error_description=nope&redirectTo=%2Fmap',
    );
    const res = await GET(req);

    expect(res.headers.get('location')).toContain('/login');
    expect(res.headers.get('location')).toContain('error=oauth_failed');
    expect(res.headers.get('location')).toContain('redirectTo=%2Fmap');
  });
});
