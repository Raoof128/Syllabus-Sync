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

  it('redirects to validated redirectTo after exchanging code for session', async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null });
    createServerClientMock.mockResolvedValue({
      auth: { exchangeCodeForSession },
    });

    const req = new NextRequest('http://localhost/auth/callback?code=abc&redirectTo=%2Fmap');
    const res = await GET(req);

    expect(res.headers.get('location')).toBe('http://localhost/map');
    expect(exchangeCodeForSession).toHaveBeenCalledWith('abc');
  });

  it('falls back to /home when redirectTo is invalid', async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null });
    createServerClientMock.mockResolvedValue({
      auth: { exchangeCodeForSession },
    });

    const req = new NextRequest(
      'http://localhost/auth/callback?code=abc&redirectTo=https%3A%2F%2Fevil.com',
    );
    const res = await GET(req);

    expect(res.headers.get('location')).toBe('http://localhost/home');
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
