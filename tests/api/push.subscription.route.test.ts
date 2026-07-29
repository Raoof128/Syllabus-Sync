import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE, POST } from '@/app/api/push/subscription/route';

const createAdminClientMock = vi.fn();
const createServerClientMock = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => createAdminClientMock(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => createServerClientMock(),
}));

vi.mock('@/app/api/_lib/middleware', () => ({
  requireAuthWithRateLimit: (_request: Request, handler: (userId: string) => Promise<Response>) =>
    handler('user-1'),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

function createUpsertChain(result: { data: unknown; error: unknown }) {
  const chain = {
    upsert: vi.fn(),
    select: vi.fn(),
    single: vi.fn(async () => result),
  };
  chain.upsert.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  return chain;
}

function createDeleteChain(result: { error: unknown }) {
  const chain = {
    delete: vi.fn(),
    eq: vi.fn(),
    then: (resolve: (value: { error: unknown }) => void) => resolve(result),
  };
  chain.delete.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  return chain;
}

describe('push subscription route', () => {
  beforeEach(() => {
    createAdminClientMock.mockReset();
    createServerClientMock.mockReset();
  });

  it('stores a push subscription via POST using the RLS-scoped server client', async () => {
    const table = createUpsertChain({
      data: { id: 'sub-1', endpoint: 'https://push.example/sub' },
      error: null,
    });

    createServerClientMock.mockResolvedValue({
      from: vi.fn(() => table),
    });

    const response = await POST(
      new Request('http://localhost/api/push/subscription', {
        method: 'POST',
        body: JSON.stringify({
          endpoint: 'https://push.example/sub',
          expirationTime: null,
          keys: {
            p256dh: 'p256dh-key',
            auth: 'auth-key',
          },
          userAgent: 'Vitest',
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(table.upsert).toHaveBeenCalledTimes(1);
    expect(table.upsert.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        user_id: 'user-1',
        endpoint: 'https://push.example/sub',
        p256dh_key: 'p256dh-key',
        auth_key: 'auth-key',
      }),
    );
    // SECURITY (BA-0012) REGRESSION: the RLS-bypassing admin client must
    // never be used for this mutation. push_subscriptions.endpoint is
    // globally unique and the RLS policies scope INSERT/UPDATE to
    // `auth.uid() = user_id`; routing through the admin/service-role client
    // silently defeated that check, letting any authenticated user upsert a
    // known/guessed endpoint and reassign (hijack) another user's existing
    // subscription. The mutation must go through the RLS-scoped
    // createServerClient() so Postgres enforces ownership.
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it('deletes a push subscription via DELETE using the RLS-scoped server client', async () => {
    const table = createDeleteChain({ error: null });
    createServerClientMock.mockResolvedValue({
      from: vi.fn(() => table),
    });

    const response = await DELETE(
      new Request('http://localhost/api/push/subscription', {
        method: 'DELETE',
        body: JSON.stringify({
          endpoint: 'https://push.example/sub',
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });
});
