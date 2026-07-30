import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const createAdminClientMock = vi.fn();

vi.mock('@/lib/security/password-breach', () => ({
  isPasswordBreachBlocked: vi.fn(async () => false),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => createAdminClientMock(),
}));

vi.mock(import('@/lib/services/rateLimitService'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    passwordResetTokenLimiter: vi
      .fn()
      .mockResolvedValue({ allowed: true, remaining: 9, resetIn: 0 }),
    emailVerifyTokenLimiter: vi.fn().mockResolvedValue({ allowed: true, remaining: 9, resetIn: 0 }),
  };
});

import { POST as resetPassword } from '@/app/api/auth/password/reset/route';
import { POST as verifyEmail } from '@/app/api/auth/email/verify/route';

/**
 * BA-0006 regression cover.
 *
 * Both routes look the token up with `.eq('used', false)`, then flip it with
 * `.update({ used: true }).eq('id', …).eq('used', false)` under comments
 * claiming the write is "atomic" and an "extra guard against race condition".
 * It guarded nothing: PostgREST reports a zero-row UPDATE as success
 * (`error: null`), so when two requests raced on the same token both passed the
 * lookup, both issued the UPDATE, and the loser proceeded to the privileged
 * side effect anyway — resetting a password / confirming an email off a token
 * that had already been spent.
 *
 * The UPDATE has to BE the single-use gate: ask it which rows it changed and
 * reject when the answer is none.
 */

/**
 * Table double whose UPDATE reports the row count, so a test can simulate the
 * loser of a race (`affectedRows: 0`) rather than only the happy path.
 */
function makeTokenTable(
  record: { id: string; user_id: string } | null,
  options: { affectedRows?: number; updateError?: { message: string } } = {},
) {
  const { affectedRows = 1, updateError = null } = options;

  const lookup: Record<string, unknown> = {};
  lookup.select = vi.fn(() => lookup);
  lookup.eq = vi.fn(() => lookup);
  lookup.gt = vi.fn(() => lookup);
  lookup.limit = vi.fn(() => lookup);
  lookup.single = vi.fn(async () => ({
    data: record,
    error: record ? null : { message: 'not found' },
  }));

  // update(...).eq(...).eq(...).select(...) -> { data: rows, error }
  const rows = Array.from({ length: affectedRows }, (_, i) => ({ id: `row-${i}` }));
  const updateChain: Record<string, unknown> = {};
  updateChain.eq = vi.fn(() => updateChain);
  updateChain.select = vi.fn(async () => ({
    data: updateError ? null : rows,
    error: updateError,
  }));

  return {
    select: lookup.select,
    eq: lookup.eq,
    gt: lookup.gt,
    limit: lookup.limit,
    single: lookup.single,
    update: vi.fn(() => updateChain),
  };
}

function resetRequest() {
  return new NextRequest('http://localhost/api/auth/password/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: 'a'.repeat(64), newPassword: 'A'.repeat(12) }),
  });
}

function verifyRequest() {
  return new NextRequest('http://localhost/api/auth/email/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: 'b'.repeat(64) }),
  });
}

describe('password reset — token is single-use under a race', () => {
  beforeEach(() => createAdminClientMock.mockReset());

  it('refuses to reset the password when the consuming UPDATE changed no rows', async () => {
    const table = makeTokenTable({ id: 'token-1', user_id: 'user-1' }, { affectedRows: 0 });
    const updateUserById = vi.fn().mockResolvedValue({ error: null });
    createAdminClientMock.mockReturnValue({
      from: vi.fn(() => table),
      auth: { admin: { updateUserById } },
    });

    const res = await resetPassword(resetRequest());

    expect(res.status).toBe(400);
    // The whole point: the privileged side effect must not happen.
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it('still resets the password when the UPDATE claims the token', async () => {
    const table = makeTokenTable({ id: 'token-1', user_id: 'user-1' }, { affectedRows: 1 });
    const updateUserById = vi.fn().mockResolvedValue({ error: null });
    createAdminClientMock.mockReturnValue({
      from: vi.fn(() => table),
      auth: { admin: { updateUserById } },
    });

    const res = await resetPassword(resetRequest());

    expect(res.status).toBe(200);
    expect(updateUserById).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ password: 'A'.repeat(12) }),
    );
  });
});

describe('email verification — token is single-use under a race', () => {
  beforeEach(() => createAdminClientMock.mockReset());

  it('refuses to confirm the email when the consuming UPDATE changed no rows', async () => {
    const table = makeTokenTable({ id: 'token-2', user_id: 'user-2' }, { affectedRows: 0 });
    const updateUserById = vi.fn().mockResolvedValue({ error: null });
    createAdminClientMock.mockReturnValue({
      from: vi.fn(() => table),
      auth: { admin: { updateUserById } },
    });

    const res = await verifyEmail(verifyRequest());

    expect(res.status).toBe(400);
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it('still confirms the email when the UPDATE claims the token', async () => {
    const table = makeTokenTable({ id: 'token-2', user_id: 'user-2' }, { affectedRows: 1 });
    const updateUserById = vi.fn().mockResolvedValue({ error: null });
    createAdminClientMock.mockReturnValue({
      from: vi.fn(() => table),
      auth: { admin: { updateUserById } },
    });

    const res = await verifyEmail(verifyRequest());

    expect(res.status).toBe(200);
    expect(updateUserById).toHaveBeenCalledWith(
      'user-2',
      expect.objectContaining({ email_confirm: true }),
    );
  });
});
