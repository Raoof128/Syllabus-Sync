/**
 * Q3/Q4 (external security and privacy review, 2026-08-17).
 *
 * The reviewer could find no code path that deletes a user account, and was
 * right: `DELETE /api/profiles` removed the `profiles` and `user_preferences`
 * rows only, and because every other user table foreign-keys to `auth.users`
 * rather than `profiles`, that cascaded to nothing. The auth user, credentials,
 * MFA secrets, passkeys and all academic data survived what the UI called
 * "Permanently delete your account and all data".
 *
 * `DELETE /api/account` is the fix. These tests pin the properties that make it
 * safe rather than merely present:
 *
 *   - re-authentication is required, so a stolen session cannot delete
 *   - OAuth-only accounts, which have no password, get a real confirmation step
 *   - the audit row is written BEFORE the deletion, and a failure to write it
 *     aborts the deletion rather than proceeding untraceably
 *   - an unconfigured service-role client fails closed instead of reporting
 *     success and deleting nothing
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const createServerClientMock = vi.fn();
const createAdminClientMock = vi.fn();
const logAuditServerMock = vi.fn();
const mutationLimiterMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => createServerClientMock(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => createAdminClientMock(),
}));

vi.mock('@/lib/security/audit', () => ({
  logAuditServer: (...args: unknown[]) => logAuditServerMock(...args),
}));

vi.mock('@/lib/security/auth-audit', () => ({
  logAuthAuditEvent: vi.fn(),
  userIdentifier: (email: string) => `hashed:${email}`,
}));

vi.mock('@/lib/services/rateLimitService', () => ({
  mutationLimiter: (...args: unknown[]) => mutationLimiterMock(...args),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { DELETE } from '@/app/api/account/route';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const EMAIL = 'student@example.com';

function makeUser(provider: 'email' | 'google') {
  return {
    id: USER_ID,
    email: EMAIL,
    identities: [{ provider }],
  };
}

function makeSupabaseClient(options: {
  provider?: 'email' | 'google';
  reauthError?: { message: string } | null;
}) {
  const { provider = 'email', reauthError = null } = options;
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: makeUser(provider) }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: reauthError }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      // requireAuth now gates on the assurance level at the route (see app/api/_lib/middleware.ts).
      mfa: {
        getAuthenticatorAssuranceLevel: vi
          .fn()
          .mockResolvedValue({ data: { currentLevel: 'aal1', nextLevel: 'aal1' }, error: null }),
      },
    },
  };
}

function makeAdminClient(deleteError: { message: string } | null = null) {
  return {
    auth: { admin: { deleteUser: vi.fn().mockResolvedValue({ error: deleteError }) } },
  };
}

function deleteRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/account', {
    method: 'DELETE',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost',
      host: 'localhost',
    },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof DELETE>[0];
}

beforeEach(() => {
  vi.clearAllMocks();
  mutationLimiterMock.mockResolvedValue({
    allowed: true,
    remaining: 10,
    resetIn: 60,
    limit: 20,
  });
  logAuditServerMock.mockResolvedValue('audit-row-id');
});

describe('DELETE /api/account', () => {
  it('deletes the auth user, which is what makes the cascades fire', async () => {
    const admin = makeAdminClient();
    createServerClientMock.mockResolvedValue(makeSupabaseClient({}));
    createAdminClientMock.mockReturnValue(admin);

    const response = await DELETE(deleteRequest({ password: 'correct-horse' }));

    expect(response.status).toBe(200);
    expect(admin.auth.admin.deleteUser).toHaveBeenCalledWith(USER_ID);
  });

  it('refuses without the password, so a stolen session is not enough', async () => {
    const admin = makeAdminClient();
    createServerClientMock.mockResolvedValue(makeSupabaseClient({}));
    createAdminClientMock.mockReturnValue(admin);

    const response = await DELETE(deleteRequest({}));

    expect(response.status).toBe(400);
    expect(admin.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it('refuses on a wrong password', async () => {
    const admin = makeAdminClient();
    createServerClientMock.mockResolvedValue(
      makeSupabaseClient({ reauthError: { message: 'Invalid login credentials' } }),
    );
    createAdminClientMock.mockReturnValue(admin);

    const response = await DELETE(deleteRequest({ password: 'wrong' }));

    expect(response.status).toBe(400);
    expect(admin.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it('accepts a matching email confirmation for an OAuth-only account', async () => {
    const admin = makeAdminClient();
    createServerClientMock.mockResolvedValue(makeSupabaseClient({ provider: 'google' }));
    createAdminClientMock.mockReturnValue(admin);

    const response = await DELETE(deleteRequest({ confirmEmail: EMAIL.toUpperCase() }));

    expect(response.status).toBe(200);
    expect(admin.auth.admin.deleteUser).toHaveBeenCalledWith(USER_ID);
  });

  it('refuses a mismatched email confirmation for an OAuth-only account', async () => {
    const admin = makeAdminClient();
    createServerClientMock.mockResolvedValue(makeSupabaseClient({ provider: 'google' }));
    createAdminClientMock.mockReturnValue(admin);

    const response = await DELETE(deleteRequest({ confirmEmail: 'someone-else@example.com' }));

    expect(response.status).toBe(400);
    expect(admin.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it('writes the audit row before deleting, not after', async () => {
    const order: string[] = [];
    logAuditServerMock.mockImplementation(async () => {
      order.push('audit');
      return 'audit-row-id';
    });
    const admin = {
      auth: {
        admin: {
          deleteUser: vi.fn().mockImplementation(async () => {
            order.push('delete');
            return { error: null };
          }),
        },
      },
    };
    createServerClientMock.mockResolvedValue(makeSupabaseClient({}));
    createAdminClientMock.mockReturnValue(admin);

    await DELETE(deleteRequest({ password: 'correct-horse' }));

    expect(order).toEqual(['audit', 'delete']);
  });

  it('aborts the deletion when the audit row cannot be written', async () => {
    logAuditServerMock.mockResolvedValue(null);
    const admin = makeAdminClient();
    createServerClientMock.mockResolvedValue(makeSupabaseClient({}));
    createAdminClientMock.mockReturnValue(admin);

    const response = await DELETE(deleteRequest({ password: 'correct-horse' }));

    expect(response.status).toBe(500);
    expect(admin.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it('fails closed when no service-role client is configured', async () => {
    createServerClientMock.mockResolvedValue(makeSupabaseClient({}));
    createAdminClientMock.mockReturnValue(null);

    const response = await DELETE(deleteRequest({ password: 'correct-horse' }));

    expect(response.status).toBe(503);
    // The critical property: it must not have re-authenticated and reported
    // success while deleting nothing.
    expect(logAuditServerMock).not.toHaveBeenCalled();
  });

  it('reports failure when the auth-layer delete fails', async () => {
    const admin = makeAdminClient({ message: 'user not found' });
    createServerClientMock.mockResolvedValue(makeSupabaseClient({}));
    createAdminClientMock.mockReturnValue(admin);

    const response = await DELETE(deleteRequest({ password: 'correct-horse' }));

    expect(response.status).toBe(500);
  });
});
