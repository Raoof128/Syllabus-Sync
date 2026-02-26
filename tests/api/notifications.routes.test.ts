import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE as DELETE_COLLECTION } from '@/app/api/notifications/route';
import { DELETE as DELETE_BY_ID, GET as GET_BY_ID } from '@/app/api/notifications/[id]/route';
import { PUT as MARK_ALL_READ } from '@/app/api/notifications/mark-all-read/route';

const createServerClientMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => createServerClientMock(),
}));

vi.mock('@/app/api/_lib/middleware', () => ({
  requireAuth: (_request: Request, handler: (userId: string) => Promise<Response>) =>
    handler('user-1'),
  requireAuthWithRateLimit: (_request: Request, handler: (userId: string) => Promise<Response>) =>
    handler('user-1'),
  validateRequest:
    (schema: { parse: (input: unknown) => unknown }) =>
    async (request: Request, handler: (payload: unknown) => Promise<Response>) => {
      const body = await request.json();
      const parsed = schema.parse(body);
      return handler(parsed);
    },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

function createCollectionUpdateChain(result: { data: unknown; error: unknown }) {
  const chain = {
    update: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    select: vi.fn(async () => result),
  };
  chain.update.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.is.mockReturnValue(chain);
  return chain;
}

function createItemUpdateChain(result: { data: unknown; error: { code?: string } | null }) {
  const chain = {
    update: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    select: vi.fn(),
    single: vi.fn(async () => result),
  };
  chain.update.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.is.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  return chain;
}

function createSingleSelectChain(result: { data: unknown; error: { code?: string } | null }) {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    single: vi.fn(async () => result),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.is.mockReturnValue(chain);
  return chain;
}

describe('notifications API routes', () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
  });

  it('soft-deletes all notifications in collection DELETE', async () => {
    const table = createCollectionUpdateChain({
      data: [{ id: 'n1' }, { id: 'n2' }],
      error: null,
    });

    createServerClientMock.mockResolvedValue({
      from: vi.fn(() => table),
    });

    const response = await DELETE_COLLECTION(new Request('http://localhost/api/notifications'));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(table.update).toHaveBeenCalledTimes(1);
    expect(table.update.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        deleted_at: expect.any(String),
      }),
    );
    expect(table.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(table.is).toHaveBeenCalledWith('deleted_at', null);
    expect(json.data.deleted).toBe(2);
  });

  it('returns 404 when deleting an already-deleted or missing notification by id', async () => {
    const table = createItemUpdateChain({
      data: null,
      error: { code: 'PGRST116' },
    });

    createServerClientMock.mockResolvedValue({
      from: vi.fn(() => table),
    });

    const response = await DELETE_BY_ID(new Request('http://localhost/api/notifications/n1'), {
      params: Promise.resolve({ id: 'n1' }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(table.is).toHaveBeenCalledWith('deleted_at', null);
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('filters deleted notifications in GET /api/notifications/[id]', async () => {
    const table = createSingleSelectChain({
      data: {
        id: 'n1',
        title: 'Notification',
        message: 'Body',
        type: 'system',
        read: false,
        created_at: new Date().toISOString(),
      },
      error: null,
    });

    createServerClientMock.mockResolvedValue({
      from: vi.fn(() => table),
    });

    const response = await GET_BY_ID(new Request('http://localhost/api/notifications/n1'), {
      params: Promise.resolve({ id: 'n1' }),
    });

    expect(response.status).toBe(200);
    expect(table.is).toHaveBeenCalledWith('deleted_at', null);
  });

  it('marks only non-deleted notifications as read in mark-all-read', async () => {
    const table = createCollectionUpdateChain({
      data: [{ id: 'n1' }],
      error: null,
    });

    createServerClientMock.mockResolvedValue({
      from: vi.fn(() => table),
    });

    const response = await MARK_ALL_READ(
      new Request('http://localhost/api/notifications/mark-all-read', { method: 'PUT' }),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(table.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(table.eq).toHaveBeenCalledWith('read', false);
    expect(table.is).toHaveBeenCalledWith('deleted_at', null);
    expect(json.data.updated).toBe(1);
  });
});
