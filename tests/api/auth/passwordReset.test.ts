import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/password/reset/route';

const createAdminClientMock = vi.fn();

vi.mock('@/lib/security/password-breach', () => ({
  // BA-0041 added a server-side HIBP lookup to these routes. Mocked here so the
  // suite stays deterministic and offline-capable — the guard's own behaviour is
  // covered by tests/security/breached-password-enforced.test.ts. Returning
  // false keeps these cases exercising the paths they were written for.
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
  };
});

/**
 * @param record        the row the step-1 lookup finds, or null for "no such token"
 * @param claimedRows   rows the step-2 conditional UPDATE reports as affected.
 *                      1 = this request won the claim. 0 = a concurrent request
 *                      already spent the token (BA-0006), which must NOT be
 *                      treated as success.
 */
function makePasswordResetsTable(
  record: { id: string; user_id: string } | null,
  claimedRows: number = 1,
) {
  const chain: any = {};

  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.gt = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.single = vi.fn(async () => ({
    data: record,
    error: record ? null : { message: 'not found' },
  }));

  // update(...).eq(...).eq(...).select('id') → { data: rows, error }
  const updateChain: any = {};
  updateChain.eq = vi.fn(() => updateChain);
  updateChain.select = vi.fn(async () => ({
    data: Array.from({ length: claimedRows }, () => ({ id: record?.id ?? 'row' })),
    error: null,
  }));

  return {
    select: chain.select,
    eq: chain.eq,
    gt: chain.gt,
    limit: chain.limit,
    single: chain.single,
    update: vi.fn(() => updateChain),
  };
}

describe('password reset consume API', () => {
  beforeEach(() => {
    createAdminClientMock.mockReset();
  });

  it('rejects invalid token format', async () => {
    createAdminClientMock.mockReturnValue({
      from: vi.fn(),
      auth: { admin: { updateUserById: vi.fn() } },
    });

    const req = new NextRequest('http://localhost/api/auth/password/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'bad', newPassword: 'A'.repeat(12) }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when token is not found', async () => {
    const passwordResets = makePasswordResetsTable(null);
    const updateUserById = vi.fn();

    createAdminClientMock.mockReturnValue({
      from: vi.fn(() => passwordResets),
      auth: { admin: { updateUserById } },
    });

    const req = new NextRequest('http://localhost/api/auth/password/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'a'.repeat(64),
        newPassword: 'A'.repeat(12),
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it('resets password when token is valid', async () => {
    const passwordResets = makePasswordResetsTable({
      id: 'token-1',
      user_id: 'user-1',
    });
    const updateUserById = vi.fn().mockResolvedValue({ error: null });

    createAdminClientMock.mockReturnValue({
      from: vi.fn(() => passwordResets),
      auth: { admin: { updateUserById } },
    });

    const req = new NextRequest('http://localhost/api/auth/password/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'b'.repeat(64),
        newPassword: 'A'.repeat(12),
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.reset).toBe(true);
    expect(updateUserById).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ password: 'A'.repeat(12) }),
    );
  });

  /**
   * BA-0006. The route already filtered the claiming UPDATE with
   * `.eq('used', false)` and the comment called it an atomic guard, but only
   * `updateError` was inspected. A conditional UPDATE that matches zero rows is
   * not an error — it succeeds having changed nothing — so the loser of a race
   * saw `error === null` and reset the password with an already-spent token.
   *
   * This models the loser: the step-1 lookup still sees the token as unused
   * (both requests read before either wrote), but the claim takes 0 rows.
   */
  it('refuses to reset when a concurrent request already claimed the token', async () => {
    const passwordResets = makePasswordResetsTable({ id: 'token-1', user_id: 'user-1' }, 0);
    const updateUserById = vi.fn().mockResolvedValue({ error: null });

    createAdminClientMock.mockReturnValue({
      from: vi.fn(() => passwordResets),
      auth: { admin: { updateUserById } },
    });

    const req = new NextRequest('http://localhost/api/auth/password/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'c'.repeat(64),
        newPassword: 'B'.repeat(12),
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    // The whole point: the password must not be changed by the losing request.
    expect(updateUserById).not.toHaveBeenCalled();
    // And the refusal must not disclose that the token existed but was taken.
    const json = await res.json();
    expect(JSON.stringify(json)).toMatch(/Invalid or expired reset link/i);
  });
});
