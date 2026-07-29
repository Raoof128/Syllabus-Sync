/**
 * Reproduction for BA-0001.
 *
 * A WebAuthn challenge must be single-use. `consumeChallenge()` originally read
 * the row and then deleted it in a second statement, so two callers racing the
 * same challenge could both pass the read before either delete committed, and a
 * failed delete was discarded silently — leaving the challenge usable until its
 * five-minute expiry.
 *
 * The fake below is deliberately faithful to that ordering: every builder step
 * yields to the microtask queue, so two concurrent consumers interleave the way
 * they would against a real database. Only an atomic
 * `DELETE ... WHERE ... RETURNING *` lets exactly one of them win.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

type ChallengeRow = {
  id: string;
  challenge: string;
  type: string;
  user_id: string | null;
  expires_at: string;
};

/** Rows visible to the fake database for the current test. */
let rows: ChallengeRow[] = [];
/** Counts committed deletes so we can prove single-use at the storage layer. */
let deleteCount = 0;

type Filter = (row: ChallengeRow) => boolean;

class FakeQuery implements PromiseLike<{ data: unknown; error: unknown }> {
  private op: 'select' | 'delete' = 'select';
  private filters: Filter[] = [];
  private returning = false;

  select(): this {
    // `.select()` after `.delete()` marks a RETURNING clause rather than a read.
    if (this.op === 'delete') this.returning = true;
    return this;
  }

  delete(): this {
    this.op = 'delete';
    return this;
  }

  eq(column: keyof ChallengeRow, value: unknown): this {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  gt(column: keyof ChallengeRow, value: string): this {
    this.filters.push((row) => String(row[column]) > value);
    return this;
  }

  limit(): this {
    return this;
  }

  private matches(): ChallengeRow[] {
    return rows.filter((row) => this.filters.every((f) => f(row)));
  }

  /**
   * Runs the operation. The `await` before mutating is what exposes the race:
   * a non-atomic implementation releases the microtask queue between its read
   * and its delete, letting a second consumer observe the same row.
   */
  private async run(): Promise<{ data: ChallengeRow | null; error: unknown }> {
    await Promise.resolve();
    const matched = this.matches();

    if (this.op === 'delete') {
      // Atomic: match and remove in one uninterrupted step.
      rows = rows.filter((row) => !matched.includes(row));
      deleteCount += matched.length;
      return { data: this.returning ? (matched[0] ?? null) : null, error: null };
    }

    await Promise.resolve();
    return { data: matched[0] ?? null, error: matched.length ? null : { message: 'not found' } };
  }

  async single(): Promise<{ data: ChallengeRow | null; error: unknown }> {
    return this.run();
  }

  then<TResult1 = { data: unknown; error: unknown }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.run().then(onfulfilled, onrejected);
  }
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: () => new FakeQuery() }),
  isAdminClientAvailable: () => true,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

describe('BA-0001: WebAuthn challenge single-use', () => {
  beforeEach(() => {
    deleteCount = 0;
    rows = [
      {
        id: 'row-1',
        challenge: 'challenge-abc',
        type: 'authentication',
        user_id: 'user-1',
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      },
    ];
  });

  it('lets only one of two concurrent consumers claim the same challenge', async () => {
    const { consumeChallenge } = await import('@/lib/security/webauthn');

    const [first, second] = await Promise.all([
      consumeChallenge('challenge-abc', 'authentication'),
      consumeChallenge('challenge-abc', 'authentication'),
    ]);

    const winners = [first, second].filter((result) => result !== null);

    expect(winners).toHaveLength(1);
    expect(deleteCount).toBe(1);
    expect(rows).toHaveLength(0);
  });

  it('does not return a challenge it failed to remove', async () => {
    const { consumeChallenge } = await import('@/lib/security/webauthn');

    const result = await consumeChallenge('challenge-abc', 'authentication');

    // Consuming must be the same act as deleting: a returned challenge proves
    // the row is gone, so a later attempt can never succeed.
    expect(result).not.toBeNull();
    expect(rows).toHaveLength(0);

    const replay = await consumeChallenge('challenge-abc', 'authentication');
    expect(replay).toBeNull();
  });

  it('rejects an expired challenge', async () => {
    rows = [
      {
        id: 'row-expired',
        challenge: 'challenge-old',
        type: 'authentication',
        user_id: 'user-1',
        expires_at: new Date(Date.now() - 1000).toISOString(),
      },
    ];

    const { consumeChallenge } = await import('@/lib/security/webauthn');

    expect(await consumeChallenge('challenge-old', 'authentication')).toBeNull();
  });
});
