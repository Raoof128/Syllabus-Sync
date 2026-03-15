import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, PUT } from '@/app/api/user-preferences/route';

const createServerClientMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => createServerClientMock(),
}));

vi.mock('@/app/api/_lib/middleware', () => ({
  requireAuth: (_request: Request, handler: (userId: string) => Promise<Response>) =>
    handler('user-1'),
  requireAuthWithRateLimit: (_request: Request, handler: (userId: string) => Promise<Response>) =>
    handler('user-1'),
}));

describe('user preferences API route', () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
  });

  it('creates default user preferences when none exist yet', async () => {
    const selectChain = {
      select: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(async () => ({
        data: null,
        error: { code: 'PGRST116' },
      })),
    };
    selectChain.select.mockReturnValue(selectChain);
    selectChain.eq.mockReturnValue(selectChain);

    const insertChain = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(async () => ({
        data: {
          user_id: 'user-1',
          deadline_notifications_enabled: true,
          class_notifications_enabled: true,
          event_notifications_enabled: true,
        },
        error: null,
      })),
    };
    insertChain.insert.mockReturnValue(insertChain);
    insertChain.select.mockReturnValue(insertChain);

    createServerClientMock.mockResolvedValue({
      from: vi.fn().mockReturnValueOnce(selectChain).mockReturnValueOnce(insertChain),
    });

    const response = await GET(new Request('http://localhost/api/user-preferences'));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(insertChain.insert).toHaveBeenCalledWith({ user_id: 'user-1' });
    expect(json.data.user_id).toBe('user-1');
  });

  it('updates reminder settings for an existing user_preferences row', async () => {
    const lookupChain = {
      select: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(async () => ({
        data: { id: 'pref-1' },
        error: null,
      })),
    };
    lookupChain.select.mockReturnValue(lookupChain);
    lookupChain.eq.mockReturnValue(lookupChain);

    const updateChain = {
      update: vi.fn(),
      eq: vi.fn(),
      select: vi.fn(),
      single: vi.fn(async () => ({
        data: {
          user_id: 'user-1',
          class_notifications_enabled: false,
          class_reminder_timing_minutes: 30,
        },
        error: null,
      })),
    };
    updateChain.update.mockReturnValue(updateChain);
    updateChain.eq.mockReturnValue(updateChain);
    updateChain.select.mockReturnValue(updateChain);

    createServerClientMock.mockResolvedValue({
      from: vi.fn().mockReturnValueOnce(lookupChain).mockReturnValueOnce(updateChain),
    });

    const response = await PUT(
      new Request('http://localhost/api/user-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_notifications_enabled: false,
          class_reminder_timing_minutes: 30,
        }),
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        class_notifications_enabled: false,
        class_reminder_timing_minutes: 30,
        updated_at: expect.any(String),
      }),
    );
    expect(json.data.class_notifications_enabled).toBe(false);
    expect(json.data.class_reminder_timing_minutes).toBe(30);
  });

  it('rejects empty updates', async () => {
    createServerClientMock.mockResolvedValue({
      from: vi.fn(),
    });

    const response = await PUT(
      new Request('http://localhost/api/user-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });
});
