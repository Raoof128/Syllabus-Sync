/**
 * Regression guard for BA-0063.
 *
 * The Upstash/KV store implemented `increment` as GET-then-SET on a JSON blob.
 * Every request in a concurrent burst read the same count and wrote count+1,
 * so a burst of N parallel login attempts all passed a limit far below N. Its
 * `get()` also turned store errors into "no entry", starting a fresh window, so
 * a failClosed limiter admitted requests on exactly the failure it exists to
 * refuse.
 *
 * A fake Upstash REST endpoint stands in for Redis. Each call resolves on a
 * later macrotask, the way a real network round trip does, which is what lets
 * the requests of a burst interleave.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

type Entry = { value: string; expiresAt: number | null };

function fakeUpstash() {
  const db = new Map<string, Entry>();
  const alive = (k: string) => {
    const e = db.get(k);
    if (e && e.expiresAt !== null && e.expiresAt <= Date.now()) db.delete(k);
    return db.get(k);
  };

  const run = (cmd: (string | number)[]): unknown => {
    const [name, ...args] = cmd;
    switch (String(name).toUpperCase()) {
      case 'GET':
        return alive(String(args[0]))?.value ?? null;
      case 'SET': {
        const [key, value, , px] = args;
        db.set(String(key), { value: String(value), expiresAt: Date.now() + Number(px) });
        return 'OK';
      }
      case 'PTTL': {
        const e = alive(String(args[0]));
        if (!e) return -2;
        return e.expiresAt === null ? -1 : e.expiresAt - Date.now();
      }
      case 'EVAL': {
        // Mirrors INCREMENT_SCRIPT; runs synchronously, i.e. atomically, as a
        // Lua script does inside Redis.
        const [, , key, windowMs] = args;
        const k = String(key);
        const e = alive(k);
        const count = (e ? Number(e.value) : 0) + 1;
        if (!Number.isInteger(count)) throw new Error('ERR value is not an integer');
        const expiresAt = e?.expiresAt ?? Date.now() + Number(windowMs);
        db.set(k, { value: String(count), expiresAt });
        return [count, expiresAt - Date.now()];
      }
      default:
        throw new Error(`fake upstash: unsupported ${String(name)}`);
    }
  };

  const fetchImpl = vi.fn(async (_url: string, init: { body: string }) => {
    await new Promise((r) => setTimeout(r, 0));
    const cmd = JSON.parse(init.body) as (string | number)[];
    try {
      return new Response(JSON.stringify({ result: run(cmd) }), { status: 200 });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), { status: 400 });
    }
  });

  return { db, fetchImpl };
}

describe('Upstash rate-limit store (BA-0063)', () => {
  const saved = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...saved,
      UPSTASH_REDIS_REST_URL: 'https://fake.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'test-token',
    } as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...saved };
  });

  it('admits exactly maxRequests from a concurrent burst', async () => {
    const { fetchImpl } = fakeUpstash();
    vi.stubGlobal('fetch', fetchImpl);
    const { checkRateLimit } = await import('@/lib/services/rateLimitService');

    const config = { windowMs: 60_000, maxRequests: 5, prefix: 'burst', failClosed: true };
    const results = await Promise.all(
      Array.from({ length: 25 }, () => checkRateLimit('ip:203.0.113.9', config)),
    );

    expect(results.filter((r) => r.allowed)).toHaveLength(5);
    expect(results.filter((r) => !r.allowed)).toHaveLength(20);
  });

  it('keeps counting across sequential windows and reports resetIn', async () => {
    const { fetchImpl } = fakeUpstash();
    vi.stubGlobal('fetch', fetchImpl);
    const { checkRateLimit } = await import('@/lib/services/rateLimitService');

    const config = { windowMs: 60_000, maxRequests: 2, prefix: 'seq' };
    const a = await checkRateLimit('u', config);
    const b = await checkRateLimit('u', config);
    const c = await checkRateLimit('u', config);

    expect([a.allowed, b.allowed, c.allowed]).toEqual([true, true, false]);
    expect(c.resetIn).toBeGreaterThan(0);
    expect(c.resetIn).toBeLessThanOrEqual(60);
  });

  it('fails closed when the store errors, instead of starting a fresh window', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('upstream down', { status: 503, statusText: 'down' })),
    );
    const { checkRateLimit } = await import('@/lib/services/rateLimitService');

    const result = await checkRateLimit('ip:203.0.113.9', {
      windowMs: 60_000,
      maxRequests: 5,
      prefix: 'login',
      failClosed: true,
    });

    expect(result.allowed).toBe(false);
  });

  it('a failing read cannot reset the window (partial outage)', async () => {
    // The old get() mapped a GET error to "no entry" and SET then wrote a fresh
    // count of 1, so every request passed while reads were failing.
    const { fetchImpl } = fakeUpstash();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: { body: string }) => {
        const [name] = JSON.parse(init.body) as string[];
        if (String(name).toUpperCase() === 'GET') {
          return new Response('read replica down', { status: 503, statusText: 'down' });
        }
        return fetchImpl(url, init);
      }),
    );
    const { checkRateLimit } = await import('@/lib/services/rateLimitService');

    const config = { windowMs: 60_000, maxRequests: 2, prefix: 'partial', failClosed: true };
    const results = [];
    for (let i = 0; i < 6; i++) results.push(await checkRateLimit('ip:203.0.113.9', config));

    expect(results.filter((r) => r.allowed)).toHaveLength(2);
  });

  it('never INCRs a key that may still hold a legacy JSON value', async () => {
    const { db, fetchImpl } = fakeUpstash();
    // What the old implementation left behind for an in-flight window.
    db.set('ratelimit:login:ip:1', {
      value: JSON.stringify({ count: 3, resetTime: Date.now() + 60_000 }),
      expiresAt: Date.now() + 60_000,
    });
    vi.stubGlobal('fetch', fetchImpl);
    const { checkRateLimit } = await import('@/lib/services/rateLimitService');

    const result = await checkRateLimit('ip:1', {
      windowMs: 60_000,
      maxRequests: 5,
      prefix: 'login',
      failClosed: true,
    });

    expect(result.allowed).toBe(true);
  });
});
