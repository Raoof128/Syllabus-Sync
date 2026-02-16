import { describe, expect, it, vi, beforeEach } from 'vitest';

const sendVerificationEmailMock = vi.fn();

vi.mock('@/lib/services/emailService', () => ({
  sendVerificationEmail: sendVerificationEmailMock,
}));

type FromBuilder = {
  update: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
};

function makeEmailVerificationsBuilder(state: {
  insertedId: string;
  deleteCalls: Array<{ field: string; value: string }>;
}) {
  const builder: Partial<FromBuilder> = {};

  const chain = {
    eq: vi.fn(() => chain),
  };

  const insertChain = {
    select: vi.fn(() => insertChain),
    single: vi.fn(async () => ({ data: { id: state.insertedId }, error: null })),
  };

  const deleteChain = {
    eq: vi.fn(async (field: string, value: string) => {
      state.deleteCalls.push({ field, value });
      return { data: null, error: null };
    }),
  };

  builder.update = vi.fn(() => chain);
  builder.eq = chain.eq;
  builder.insert = vi.fn(() => insertChain);
  builder.select = insertChain.select;
  builder.single = insertChain.single;
  builder.delete = vi.fn(() => deleteChain);

  return builder as FromBuilder;
}

describe('createAndSendVerification', () => {
  beforeEach(() => {
    vi.resetModules();
    sendVerificationEmailMock.mockReset();
  });

  it('deletes the inserted token record when email send fails', async () => {
    sendVerificationEmailMock.mockResolvedValue({ success: false, error: 'fail' });

    const state = { insertedId: 'token_1', deleteCalls: [] as Array<{ field: string; value: string }> };
    const emailVerifications = makeEmailVerificationsBuilder(state);

    const adminClient = {
      from: (table: string) => {
        if (table === 'email_verifications') return emailVerifications;
        throw new Error(`unexpected table: ${table}`);
      },
    } as any;

    const mod = await import('@/lib/security/emailVerification');
    const res = await mod.createAndSendVerification(adminClient, 'user_1', 'user@example.com');

    expect(res.success).toBe(false);
    expect(state.deleteCalls).toEqual([{ field: 'id', value: 'token_1' }]);
  });

  it('does not delete the inserted token record when email send succeeds', async () => {
    sendVerificationEmailMock.mockResolvedValue({ success: true });

    const state = { insertedId: 'token_2', deleteCalls: [] as Array<{ field: string; value: string }> };
    const emailVerifications = makeEmailVerificationsBuilder(state);

    const adminClient = {
      from: (table: string) => {
        if (table === 'email_verifications') return emailVerifications;
        throw new Error(`unexpected table: ${table}`);
      },
    } as any;

    const mod = await import('@/lib/security/emailVerification');
    const res = await mod.createAndSendVerification(adminClient, 'user_2', 'user@example.com');

    expect(res.success).toBe(true);
    expect(state.deleteCalls).toEqual([]);
  });
});

