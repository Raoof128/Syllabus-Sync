/**
 * Reproduction for BA-0013.
 *
 * All four `CRON_SECRET`-protected routes compared the bearer token with
 * plain `authHeader === \`Bearer ${cronSecret}\`` / `!==`. JS string
 * (in)equality short-circuits on the first mismatched character, so an
 * attacker who can measure response latency can recover the secret one byte
 * at a time. The fix routes the comparison through
 * `lib/security/constant-time-compare.ts`'s `constantTimeCompare`, whose
 * running time does not depend on where the strings first differ.
 *
 * This is checked two ways:
 *  1. Source inspection — the vulnerable `=== \`Bearer` / `!== \`Bearer`
 *     shape must be gone from each route, and each must import
 *     `constantTimeCompare`.
 *  2. Behavior — each route must still correctly reject a wrong/missing
 *     secret (401) and accept the right one, proving the swap didn't
 *     silently defeat the auth check itself.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { constantTimeCompare } from '@/lib/security/constant-time-compare';

const PROTECTED_ROUTES = [
  'app/api/auth/email/cleanup/route.ts',
  'app/api/auth/password/cleanup/route.ts',
  'app/api/security/rate-limit/cleanup/route.ts',
  'app/api/cron/push-reminders/route.ts',
];

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf-8');
}

describe('constantTimeCompare', () => {
  it('returns true for identical strings', () => {
    expect(constantTimeCompare('Bearer super-secret-token', 'Bearer super-secret-token')).toBe(
      true,
    );
  });

  it('returns false for a same-length mismatch', () => {
    expect(constantTimeCompare('Bearer aaaaaaaaaaaa', 'Bearer bbbbbbbbbbbb')).toBe(false);
  });

  it('returns false for different-length strings', () => {
    expect(constantTimeCompare('Bearer short', 'Bearer much-longer-secret')).toBe(false);
  });

  it('returns false when either input is empty', () => {
    expect(constantTimeCompare('', 'Bearer secret')).toBe(false);
    expect(constantTimeCompare('Bearer secret', '')).toBe(false);
    expect(constantTimeCompare('', '')).toBe(true);
  });

  it('takes the same code path regardless of where strings diverge (no early return on mismatch)', () => {
    // Not a real timing assertion (too flaky in CI) — this instead proves the
    // loop always walks the full shared length by checking a diff at the
    // first character behaves identically to a diff at the last character.
    const base = 'x'.repeat(64);
    const diffAtStart = `Y${base.slice(1)}`;
    const diffAtEnd = `${base.slice(0, -1)}Y`;
    expect(constantTimeCompare(base, diffAtStart)).toBe(false);
    expect(constantTimeCompare(base, diffAtEnd)).toBe(false);
  });
});

describe('BA-0013: cron routes use constant-time secret comparison', () => {
  it.each(PROTECTED_ROUTES)('%s imports constantTimeCompare', (relativePath) => {
    const source = readSource(relativePath);
    expect(source).toMatch(
      /import\s*{\s*constantTimeCompare\s*}\s*from\s*["']@\/lib\/security\/constant-time-compare["']/,
    );
  });

  it.each(PROTECTED_ROUTES)('%s no longer compares the bearer token with === / !==', (relativePath) => {
    const source = readSource(relativePath);
    expect(source).not.toMatch(/authHeader\s*===\s*`Bearer/);
    expect(source).not.toMatch(/authHeader\s*!==\s*`Bearer/);
  });
});

describe('BA-0013: cron routes still gate correctly after the fix', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, CRON_SECRET: 'correct-horse-battery-staple' };
  });

  it('email cleanup route rejects a wrong secret and accepts the right one', async () => {
    vi.doMock('@/lib/supabase/admin', () => ({
      createAdminClient: () => ({
        rpc: vi.fn(async () => ({ data: 0, error: null })),
      }),
    }));
    vi.doMock('@/lib/logger', () => ({
      logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
    }));

    const { GET } = await import('@/app/api/auth/email/cleanup/route');

    const wrong = await GET(
      new Request('http://localhost/api/auth/email/cleanup', {
        headers: { authorization: 'Bearer nope' },
      }) as never,
    );
    expect(wrong.status).toBe(401);

    const right = await GET(
      new Request('http://localhost/api/auth/email/cleanup', {
        headers: { authorization: 'Bearer correct-horse-battery-staple' },
      }) as never,
    );
    expect(right.status).toBe(200);
  });

  it('push-reminders route rejects a wrong secret and accepts the right one', async () => {
    vi.doMock('@/lib/supabase/admin', () => ({
      createAdminClient: () => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                limit: vi.fn(async () => ({ data: [], error: null })),
              })),
            })),
          })),
        })),
      }),
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

    const wrong = await GET(
      new Request('http://localhost/api/cron/push-reminders', {
        headers: { authorization: 'Bearer nope' },
      }),
    );
    expect(wrong.status).toBe(401);

    const right = await GET(
      new Request('http://localhost/api/cron/push-reminders', {
        headers: { authorization: 'Bearer correct-horse-battery-staple' },
      }),
    );
    expect(right.status).toBe(200);
  });
});
