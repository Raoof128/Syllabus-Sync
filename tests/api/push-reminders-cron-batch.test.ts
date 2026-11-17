/**
 * Reproduction for BA-0014.
 *
 * `handlePushReminderCron()` used to load every matching `user_preferences`
 * row with no LIMIT/pagination and then process users one at a time in a
 * single fully sequential loop. As the user base grows, per-invocation work
 * grows linearly with (active users) x (matching reminders); Cloudflare
 * Workers enforce a CPU-time ceiling per invocation, so an unbounded table
 * risks the invocation being killed mid-run. The fix caps how many users a
 * single invocation will process via `PUSH_REMINDER_MAX_USERS_PER_RUN`
 * (default 200); any remainder is picked up on the next 10-minute run.
 *
 * This test proves the preferences query is bounded by asserting `.limit()`
 * is called with the configured cap, and that the route reports how many
 * users it actually scanned plus whether the batch was truncated.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };

function makePreferenceRow(userId: string) {
  return {
    user_id: userId,
    notifications_enabled: true,
    push_notifications: true,
    deadline_notifications_enabled: false,
    event_notifications_enabled: false,
    deadline_reminder_timing_minutes: null,
    event_reminder_timing_minutes: null,
  };
}

describe('BA-0014: push-reminders cron bounds its per-run batch size', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, CRON_SECRET: 'correct-horse-battery-staple' };
  });

  it('applies a LIMIT to the user_preferences query using the configured cap', async () => {
    process.env.PUSH_REMINDER_MAX_USERS_PER_RUN = '3';

    const rows = [makePreferenceRow('u1'), makePreferenceRow('u2'), makePreferenceRow('u3')];
    const limitMock = vi.fn(async () => ({ data: rows, error: null }));
    const eq2Mock = vi.fn(() => ({ limit: limitMock }));
    const eq1Mock = vi.fn(() => ({ eq: eq2Mock }));
    const selectMock = vi.fn(() => ({ eq: eq1Mock }));
    const fromMock = vi.fn(() => ({ select: selectMock }));

    vi.doMock('@/lib/supabase/admin', () => ({
      createAdminClient: () => ({ from: fromMock }),
    }));
    vi.doMock('@/lib/server/push', () => ({
      sendPushNotificationToUser: vi.fn(async () => ({
        sentCount: 0,
        invalidSubscriptionsRemoved: 0,
      })),
      isWebPushConfigured: () => true,
    }));
    vi.doMock('@/lib/logger', () => ({
      logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
    }));

    const { GET } = await import('@/app/api/cron/push-reminders/route');

    const response = await GET(
      new Request('http://localhost/api/cron/push-reminders', {
        headers: { authorization: 'Bearer correct-horse-battery-staple' },
      }),
    );
    const body = (await response.json()) as {
      data: { scannedUsers: number; truncated: boolean; maxUsersPerRun: number };
    };

    expect(response.status).toBe(200);
    expect(limitMock).toHaveBeenCalledWith(3);
    expect(body.data.maxUsersPerRun).toBe(3);
    expect(body.data.scannedUsers).toBe(3);
    // Returned rows === cap, so this invocation could not tell whether more
    // matching users exist beyond the cap — must report truncated so
    // operators know delivery for the overflow is deferred, not dropped.
    expect(body.data.truncated).toBe(true);
  });

  it('reports truncated: false when fewer users than the cap matched', async () => {
    process.env.PUSH_REMINDER_MAX_USERS_PER_RUN = '200';

    const rows = [makePreferenceRow('u1')];
    const limitMock = vi.fn(async () => ({ data: rows, error: null }));
    const eq2Mock = vi.fn(() => ({ limit: limitMock }));
    const eq1Mock = vi.fn(() => ({ eq: eq2Mock }));
    const selectMock = vi.fn(() => ({ eq: eq1Mock }));
    const fromMock = vi.fn(() => ({ select: selectMock }));

    vi.doMock('@/lib/supabase/admin', () => ({
      createAdminClient: () => ({ from: fromMock }),
    }));
    vi.doMock('@/lib/server/push', () => ({
      sendPushNotificationToUser: vi.fn(async () => ({
        sentCount: 0,
        invalidSubscriptionsRemoved: 0,
      })),
      isWebPushConfigured: () => true,
    }));
    vi.doMock('@/lib/logger', () => ({
      logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
    }));

    const { GET } = await import('@/app/api/cron/push-reminders/route');

    const response = await GET(
      new Request('http://localhost/api/cron/push-reminders', {
        headers: { authorization: 'Bearer correct-horse-battery-staple' },
      }),
    );
    const body = (await response.json()) as { data: { truncated: boolean } };

    expect(body.data.truncated).toBe(false);
  });
});
