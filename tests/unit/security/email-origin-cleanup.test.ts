import type { SupabaseClient } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAndSendVerification } from '@/lib/security/emailVerification';
import { createAndSendPasswordReset } from '@/lib/security/passwordReset';

type CleanupState = {
  insertCalls: number;
  deleteCalls: Array<{ field: string; value: string }>;
};

function makeTokenClient(table: string, insertedId: string, state: CleanupState): SupabaseClient {
  const updateChain = {
    eq: vi.fn(() => updateChain),
  };
  const insertChain = {
    select: vi.fn(() => insertChain),
    single: vi.fn(async () => ({ data: { id: insertedId }, error: null })),
  };
  const deleteChain = {
    eq: vi.fn(async (field: string, value: string) => {
      state.deleteCalls.push({ field, value });
      return { data: null, error: null };
    }),
  };
  const builder = {
    update: vi.fn(() => updateChain),
    insert: vi.fn(() => {
      state.insertCalls += 1;
      return insertChain;
    }),
    delete: vi.fn(() => deleteChain),
  };

  return {
    from: vi.fn((requestedTable: string) => {
      if (requestedTable !== table) throw new Error(`Unexpected table: ${requestedTable}`);
      return builder;
    }),
  } as unknown as SupabaseClient;
}

describe('token cleanup when the application origin is unavailable', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      DEPLOYMENT_PLATFORM: 'cloudflare',
      DEPLOYMENT_ENV: 'production',
      RESEND_API_KEY: 're_test_key_123',
      VERIFICATION_EMAIL_FROM: 'onboarding@resend.dev',
      VERIFICATION_EMAIL_NAME: 'Syllabus Sync',
    };

    for (const key of [
      'NEXT_PUBLIC_APP_URL',
      'NEXT_PUBLIC_SITE_URL',
      'VERCEL_PROJECT_PRODUCTION_URL',
      'VERCEL_BRANCH_URL',
      'VERCEL_URL',
    ]) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete process.env[key];
    }
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('deletes a newly inserted verification token after origin validation fails', async () => {
    const state: CleanupState = { insertCalls: 0, deleteCalls: [] };
    const client = makeTokenClient('email_verifications', 'verification-origin-failure', state);

    const result = await createAndSendVerification(client, 'user-1', 'user@example.com');

    expect(result).toEqual({ success: false, error: 'Failed to send verification email' });
    expect(state.insertCalls).toBe(1);
    expect(state.deleteCalls).toEqual([
      { field: 'id', value: 'verification-origin-failure' },
    ]);
  });

  it('deletes a newly inserted reset token after placeholder-origin validation fails', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com/reset';
    const state: CleanupState = { insertCalls: 0, deleteCalls: [] };
    const client = makeTokenClient('password_resets', 'reset-origin-failure', state);

    const result = await createAndSendPasswordReset(client, 'user-2', 'user@example.com');

    expect(result).toEqual({ success: false, error: 'Failed to send password reset email' });
    expect(state.insertCalls).toBe(1);
    expect(state.deleteCalls).toEqual([{ field: 'id', value: 'reset-origin-failure' }]);
  });
});
