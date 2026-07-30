import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/auth/callback/route';
import { isValidRedirect } from '@/lib/utils/security';

const createServerClientMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => createServerClientMock(),
}));

/**
 * Regression cover for the signup → email → login hand-off.
 *
 * The bug this locks out: signup used to ask for
 * `/auth/callback?redirectTo=/login%3Fverified%3D1`, but '/login' is not in
 * SAFE_REDIRECT_PATHS, so isValidRedirect() rejected it and `redirectTo` fell
 * back to '/home'. The callback then signed the session out and redirected to
 * '/home', which the middleware bounced to '/login?redirectTo=/home' — losing
 * the `verified=1` flag, so the "email verified" banner never rendered on the
 * one path that matters. Verification still worked; the confirmation did not.
 */
function mockEmailVerificationExchange() {
  const exchangeCodeForSession = vi.fn().mockResolvedValue({
    error: null,
    data: { user: { id: 'user-1', app_metadata: { provider: 'email' } } },
  });
  const signOut = vi.fn().mockResolvedValue({ error: null });
  createServerClientMock.mockResolvedValue({ auth: { exchangeCodeForSession, signOut } });
  return { exchangeCodeForSession, signOut };
}

describe('auth callback — signup email verification', () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
  });

  it('lands on /login?verified=1 so the success banner renders', async () => {
    const { signOut } = mockEmailVerificationExchange();

    const req = new NextRequest('http://localhost/auth/callback?code=abc');
    const res = await GET(req);

    expect(res.headers.get('location')).toBe('http://localhost/login?verified=1');
    // The email link must not leave the user signed in.
    expect(signOut).toHaveBeenCalled();
  });

  it('still reaches the banner if a nested /login redirectTo is supplied', async () => {
    // Exactly what signup used to put in emailRedirectTo. Even if such a link is
    // still sitting in someone's inbox, it must not degrade to /home.
    mockEmailVerificationExchange();

    const req = new NextRequest(
      'http://localhost/auth/callback?redirectTo=/login%3Fverified%3D1&code=abc',
    );
    const res = await GET(req);

    expect(res.headers.get('location')).toBe('http://localhost/login?verified=1');
  });

  it('forwards an explicit destination through the sign-in that follows', async () => {
    mockEmailVerificationExchange();

    const req = new NextRequest('http://localhost/auth/callback?code=abc&redirectTo=%2Fmap');
    const res = await GET(req);

    const location = new URL(res.headers.get('location')!);
    expect(location.pathname).toBe('/login');
    expect(location.searchParams.get('verified')).toBe('1');
    // Preserved rather than followed directly: the session was just dropped, so
    // going to /map would only bounce off the middleware and lose the flag.
    expect(location.searchParams.get('redirectTo')).toBe('/map');
  });

  it('does not forward an attacker-supplied destination', async () => {
    mockEmailVerificationExchange();

    const req = new NextRequest(
      'http://localhost/auth/callback?code=abc&redirectTo=https%3A%2F%2Fevil.com',
    );
    const res = await GET(req);

    const location = new URL(res.headers.get('location')!);
    expect(location.pathname).toBe('/login');
    expect(location.searchParams.get('verified')).toBe('1');
    expect(location.searchParams.get('redirectTo')).toBeNull();
    expect(res.headers.get('location')).not.toContain('evil.com');
  });

  it('documents why /login cannot be used as a redirect target', () => {
    // If this ever flips to true, the callback's wantsLogin guard becomes the
    // only thing preventing a /login?redirectTo=/login bounce.
    expect(isValidRedirect('/login')).toBe(false);
    expect(isValidRedirect('/login?verified=1')).toBe(false);
    expect(isValidRedirect('/map')).toBe(true);
  });
});
