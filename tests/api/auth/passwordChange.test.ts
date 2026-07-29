/**
 * Tests for POST /api/auth/password (authenticated password change)
 *
 * BA-0005: password change did not revoke any other active session. A
 * stolen/leaked session (or the very compromise that motivated the change)
 * survived a password change indefinitely - and, per BA-0002, could even be
 * used to plant a permanent WebAuthn backdoor that a password change alone
 * would never clear. The fix revokes every other session via Supabase's
 * native `auth.signOut({ scope: 'others' })` once the new password is set.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/password/route';

const createServerClientMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => createServerClientMock(),
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

describe('password change API', () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
  });

  it('BA-0005: revokes every other session after a successful password change', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    const signOut = vi.fn().mockResolvedValue({ error: null });

    createServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', email: 'user@example.com' } },
          error: null,
        }),
        signInWithPassword,
        updateUser,
        signOut,
      },
    });

    const res = await POST(
      makeRequest({ currentPassword: 'OldPassword123!', newPassword: 'NewPassword456!' }),
    );
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
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
    const updateUser = vi.fn().mockResolvedValue({ error: { message: 'update failed' } });
    const signOut = vi.fn();

    createServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', email: 'user@example.com' } },
          error: null,
        }),
        signInWithPassword,
        updateUser,
        signOut,
      },
    });

    const res = await POST(
      makeRequest({ currentPassword: 'OldPassword123!', newPassword: 'NewPassword456!' }),
    );

    expect(res.status).toBe(400);
    expect(signOut).not.toHaveBeenCalled();
  });

  it('does not change the password or revoke sessions when current password is wrong', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: { message: 'invalid' } });
    const updateUser = vi.fn();
    const signOut = vi.fn();

    createServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', email: 'user@example.com' } },
          error: null,
        }),
        signInWithPassword,
        updateUser,
        signOut,
      },
    });

    const res = await POST(
      makeRequest({ currentPassword: 'WrongPassword', newPassword: 'NewPassword456!' }),
    );

    expect(res.status).toBe(400);
    expect(updateUser).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });
});
