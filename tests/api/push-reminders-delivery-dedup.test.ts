/**
 * Reproduction for BA-0015.
 *
 * push-reminders delivery de-duplication used to be check-then-insert:
 * SELECT `push_reminder_deliveries` for an existing row keyed by
 * `reminder_key`, and only INSERT a new one if none was found. Two
 * overlapping cron invocations (the job runs every 10 minutes, and a slow
 * run can still be in flight when the next one starts) could both pass the
 * SELECT before either INSERT committed, and both would go on to call
 * `sendPushNotificationToUser` — a duplicate send. This is the same class of
 * bug as the already-fixed BA-0001 (WebAuthn challenge consumption).
 *
 * `push_reminder_deliveries.reminder_key` already has a UNIQUE constraint
 * (supabase/migrations/20260313093000_add_web_push_infrastructure.sql), so
 * the fix does not need a new migration: it INSERTs the delivery row FIRST
 * as an atomic claim, and only sends the push after that claim succeeds.
 * Exactly one of two concurrent claimants can ever win the unique key.
 *
 * The fake database below is deliberately faithful to that ordering: an
 * INSERT is a single microtask-yielding round trip that checks-and-commits
 * without any further await in between, which is precisely what makes a
 * real single-statement UNIQUE-constrained INSERT atomic under concurrent
 * callers — unlike the old SELECT-then-INSERT, which had an await gap
 * between the check and the write.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };

describe('BA-0015: push-reminders delivery dedup is atomic under overlapping invocations', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, CRON_SECRET: 'correct-horse-battery-staple' };
  });

  it('sends exactly once when two overlapping invocations race the same reminder', async () => {
    const claimedKeys = new Set<string>();
    const sendCalls: string[] = [];

    const preferenceRow = {
      user_id: 'user-1',
      notifications_enabled: true,
      push_notifications: true,
      deadline_notifications_enabled: true,
      event_notifications_enabled: false,
      deadline_reminder_timing_minutes: 60,
      event_reminder_timing_minutes: null,
    };

    const deadlineRow = {
      id: 'deadline-1',
      title: 'Assignment 1',
      unit_code: 'COMP101',
      due_date: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };

    function fromMock(table: string) {
      if (table === 'user_preferences') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                limit: async () => ({ data: [preferenceRow], error: null }),
              }),
            }),
          }),
        };
      }

      if (table === 'deadlines') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                gte: () => ({
                  lt: async () => ({ data: [deadlineRow], error: null }),
                }),
              }),
            }),
          }),
        };
      }

      if (table === 'push_reminder_deliveries') {
        return {
          // Old (buggy) shape: SELECT for an existing row, then a separate
          // INSERT. Modeled with a genuine await gap between the read and
          // the write, exactly like two real round trips to the database —
          // this is what let two concurrent callers both observe "no
          // existing row" before either had committed one.
          select: () => ({
            eq: (_field: string, reminderKey: string) => ({
              maybeSingle: async () => {
                await Promise.resolve();
                return {
                  data: claimedKeys.has(reminderKey) ? { id: `delivery:${reminderKey}` } : null,
                  error: null,
                };
              },
            }),
          }),
          // New (fixed) shape: INSERT is the single atomic claim. No await
          // happens between checking and committing, matching how a real
          // UNIQUE-constrained INSERT is atomic regardless of client races.
          insert: (row: { reminder_key: string; user_id: string }) => ({
            select: () => ({
              single: async () => {
                await Promise.resolve();

                if (claimedKeys.has(row.reminder_key)) {
                  return {
                    data: null,
                    error: {
                      code: '23505',
                      message: 'duplicate key value violates unique constraint',
                    },
                  };
                }

                claimedKeys.add(row.reminder_key);
                return { data: { id: `delivery:${row.reminder_key}` }, error: null };
              },
            }),
            // Old shape called `.insert(...)` directly (awaited without
            // `.select().single()`); mirror that too so the pre-fix code
            // path exercises the same claimedKeys bookkeeping.
            then: (resolve: (value: { data: null; error: null }) => void) => {
              claimedKeys.add(row.reminder_key);
              resolve({ data: null, error: null });
            },
          }),
          delete: () => ({ eq: async () => ({ data: null, error: null }) }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }

    vi.doMock('@/lib/supabase/admin', () => ({
      createAdminClient: () => ({ from: fromMock }),
    }));
    vi.doMock('@/lib/server/push', () => ({
      sendPushNotificationToUser: vi.fn(async (userId: string) => {
        sendCalls.push(userId);
        return { sentCount: 1, invalidSubscriptionsRemoved: 0 };
      }),
      isWebPushConfigured: () => true,
    }));
    vi.doMock('@/lib/logger', () => ({
      logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
    }));

    const { GET } = await import('@/app/api/cron/push-reminders/route');

    const makeRequest = () =>
      new Request('http://localhost/api/cron/push-reminders', {
        headers: { authorization: 'Bearer correct-horse-battery-staple' },
      });

    // Two "overlapping" cron invocations racing the same reminder.
    const [responseA, responseB] = await Promise.all([GET(makeRequest()), GET(makeRequest())]);
    const bodyA = (await responseA.json()) as { data: { deliveredReminders: number } };
    const bodyB = (await responseB.json()) as { data: { deliveredReminders: number } };

    expect(responseA.status).toBe(200);
    expect(responseB.status).toBe(200);

    // The reminder must be delivered exactly once across both invocations,
    // not zero (dropped) and not two (duplicate send).
    expect(sendCalls).toEqual(['user-1']);
    expect(bodyA.data.deliveredReminders + bodyB.data.deliveredReminders).toBe(1);
  });
});
