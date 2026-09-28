import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/auth/sessions/route';

const createServerClientMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => createServerClientMock(),
}));

describe('auth sessions API', () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
  });

  it('returns 401 when unauthenticated', async () => {
    createServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    });

    const request = new NextRequest('http://localhost/api/auth/sessions');
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it('returns current session when authenticated', async () => {
    createServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: { id: 'user-1', last_sign_in_at: '2026-01-23T00:00:00Z' },
          },
          error: null,
        }),
      },
    });

    const request = new NextRequest('http://localhost/api/auth/sessions', {
      headers: { 'user-agent': 'Mozilla/5.0 Chrome' },
    });
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.sessions).toHaveLength(1);
    expect(json.data.sessions[0].current).toBe(true);
  });

  it('signs out sessions by scope', async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    createServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
        signOut,
        mfa: {
          listFactors: vi.fn().mockResolvedValue({ data: { all: [] }, error: null }),
          getAuthenticatorAssuranceLevel: vi.fn(),
        },
      },
    });

    const request = new NextRequest('http://localhost/api/auth/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'content-length': '21' },
      body: JSON.stringify({ scope: 'global' }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.scope).toBe('global');
    expect(signOut).toHaveBeenCalledWith({ scope: 'global' });
  });

  describe('BA-0064: revoking other devices needs step-up when MFA is enrolled', () => {
    const client = (aal: 'aal1' | 'aal2', signOut: ReturnType<typeof vi.fn>) => ({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
        signOut,
        mfa: {
          listFactors: vi
            .fn()
            .mockResolvedValue({ data: { all: [{ status: 'verified' }] }, error: null }),
          getAuthenticatorAssuranceLevel: vi
            .fn()
            .mockResolvedValue({ data: { currentLevel: aal, nextLevel: 'aal2' }, error: null }),
        },
      },
    });
    const post = (scope: string) =>
      POST(
        new NextRequest('http://localhost/api/auth/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scope }),
        }),
      );

    it.each(['others', 'global'])('refuses scope=%s at AAL1', async (scope) => {
      const signOut = vi.fn();
      createServerClientMock.mockResolvedValue(client('aal1', signOut));
      const res = await post(scope);
      expect(res.status).toBe(403);
      expect(signOut).not.toHaveBeenCalled();
    });

    it('still lets an AAL1 session sign itself out (scope=local)', async () => {
      const signOut = vi.fn().mockResolvedValue({ error: null });
      createServerClientMock.mockResolvedValue(client('aal1', signOut));
      const res = await post('local');
      expect(res.status).toBe(200);
      expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
    });

    it('allows scope=global at AAL2', async () => {
      const signOut = vi.fn().mockResolvedValue({ error: null });
      createServerClientMock.mockResolvedValue(client('aal2', signOut));
      const res = await post('global');
      expect(res.status).toBe(200);
    });
  });
});
