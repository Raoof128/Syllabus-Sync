/**
 * Tests for POST /api/auth/password (authenticated password change)
 *
 * BA-0005: password change did not revoke any other active session. A
 * stolen/leaked session (or the very compromise that motivated the change)
 * survived a password change indefinitely - and, per BA-0002, could even be
 * used to plant a permanent WebAuthn backdoor that a password change alone
 * would never clear. The fix revokes every other session via Supabase's
 * native `auth.signOut({ scope: 'others' })` once the new password is set.
 *
 * BA-0064: the route is outside the middleware AAL2 gate, so it enforces
 * step-up itself, and it verifies the current password without replacing the
 * caller's session.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/password/route';

const createServerClientMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => createServerClientMock(),
}));

// The current password is checked on a throwaway client (BA-0064), never the
// caller's cookie-bound one.
const probeSignIn = vi.fn();
const probeSignOut = vi.fn().mockResolvedValue({ error: null });
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { signInWithPassword: probeSignIn, signOut: probeSignOut } }),
}));

vi.mock(import('@/lib/services/rateLimitService'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    passwordResetLimiter: vi.fn().mockResolvedValue({ allowed: true, remaining: 4, resetIn: 0 }),
  };
});

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/auth/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

type Mfa = { factors?: Array<{ status: string }>; aal?: string; factorsError?: boolean };

function serverClient(opts: {
  updateUser?: ReturnType<typeof vi.fn>;
  signOut?: ReturnType<typeof vi.fn>;
  signInWithPassword?: ReturnType<typeof vi.fn>;
  mfa?: Mfa;
}) {
  const mfa = opts.mfa ?? {};
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1', email: 'user@example.com' } },
        error: null,
      }),
      signInWithPassword: opts.signInWithPassword ?? vi.fn(),
      updateUser: opts.updateUser ?? vi.fn().mockResolvedValue({ error: null }),
      signOut: opts.signOut ?? vi.fn().mockResolvedValue({ error: null }),
      mfa: {
        listFactors: vi
          .fn()
          .mockResolvedValue(
            mfa.factorsError
              ? { data: null, error: { message: 'down' } }
              : { data: { all: mfa.factors ?? [] }, error: null },
          ),
        getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
          data: { currentLevel: mfa.aal ?? 'aal1', nextLevel: mfa.aal ?? 'aal1' },
          error: null,
        }),
      },
    },
  };
}

const body = { currentPassword: 'OldPassword123!', newPassword: 'NewPassword456!' };

describe('password change API', () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
    probeSignIn.mockReset();
    probeSignOut.mockClear();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_test';
    probeSignIn.mockResolvedValue({ data: { session: { access_token: 't' } }, error: null });
  });

  it('BA-0005: revokes every other session after a successful password change', async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    const signOut = vi.fn().mockResolvedValue({ error: null });
    createServerClientMock.mockResolvedValue(serverClient({ updateUser, signOut }));

    const res = await POST(makeRequest(body));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.message).toBe('Password changed successfully');
    expect(updateUser).toHaveBeenCalledWith(
      expect.objectContaining({ password: 'NewPassword456!' }),
    );
    // The current session (which just proved the old password) must be kept;
    // only every OTHER session is revoked.
    expect(signOut).toHaveBeenCalledWith({ scope: 'others' });
  });

  it('does not revoke sessions when the password update itself fails', async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: { message: 'update failed' } });
    const signOut = vi.fn();
    createServerClientMock.mockResolvedValue(serverClient({ updateUser, signOut }));

    const res = await POST(makeRequest(body));

    expect(res.status).toBe(400);
    expect(signOut).not.toHaveBeenCalled();
  });

  it('does not change the password or revoke sessions when current password is wrong', async () => {
    probeSignIn.mockResolvedValue({ data: { session: null }, error: { message: 'invalid' } });
    const updateUser = vi.fn();
    const signOut = vi.fn();
    createServerClientMock.mockResolvedValue(serverClient({ updateUser, signOut }));

    const res = await POST(makeRequest({ ...body, currentPassword: 'WrongPassword' }));

    expect(res.status).toBe(400);
    expect(updateUser).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("BA-0064: verifies the password without replacing the caller's session", async () => {
    const signInWithPassword = vi.fn();
    createServerClientMock.mockResolvedValue(serverClient({ signInWithPassword }));

    const res = await POST(makeRequest(body));

    expect(res.status).toBe(200);
    expect(signInWithPassword).not.toHaveBeenCalled();
    expect(probeSignIn).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'OldPassword123!',
    });
    // The probe revokes only the session it had to create.
    expect(probeSignOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('BA-0064: refuses an AAL1 session when a verified factor exists', async () => {
    const updateUser = vi.fn();
    const signOut = vi.fn();
    createServerClientMock.mockResolvedValue(
      serverClient({
        updateUser,
        signOut,
        mfa: { factors: [{ status: 'verified' }], aal: 'aal1' },
      }),
    );

    const res = await POST(makeRequest(body));

    expect(res.status).toBe(403);
    expect(probeSignIn).not.toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it('BA-0064: allows an AAL2 session when a verified factor exists', async () => {
    createServerClientMock.mockResolvedValue(
      serverClient({ mfa: { factors: [{ status: 'verified' }], aal: 'aal2' } }),
    );

    const res = await POST(makeRequest(body));
    expect(res.status).toBe(200);
  });

  it('BA-0064: fails closed when MFA status cannot be determined', async () => {
    const updateUser = vi.fn();
    createServerClientMock.mockResolvedValue(
      serverClient({ updateUser, mfa: { factorsError: true } }),
    );

    const res = await POST(makeRequest(body));

    expect(res.status).toBe(503);
    expect(updateUser).not.toHaveBeenCalled();
  });
});
