import { describe, it, expect, vi, afterEach } from 'vitest';

function snapshotEnv(): NodeJS.ProcessEnv {
  return { ...process.env };
}

function restoreEnv(snapshot: NodeJS.ProcessEnv): void {
  for (const key of Object.keys(process.env)) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete process.env[key];
  }
  Object.assign(process.env, snapshot);
}

function unsetDistributedStoreEnv(): void {
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete process.env.UPSTASH_REDIS_REST_URL;
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete process.env.KV_REST_API_URL;
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete process.env.KV_REST_API_TOKEN;
}

const envBefore = snapshotEnv();

afterEach(() => {
  restoreEnv(envBefore);
  vi.resetModules();
  vi.clearAllMocks();
});

describe('rateLimitService production memory override', () => {
  it('blocks fail-closed limiters in production when no distributed store is configured', async () => {
    process.env.VERCEL_ENV = 'production';
    unsetDistributedStoreEnv();
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete process.env.ALLOW_MEMORY_RATE_LIMIT;

    vi.doMock('@/lib/logger', () => ({
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    }));

    const { checkRateLimit } = await import('@/lib/services/rateLimitService');
    const result = await checkRateLimit('127.0.0.1', {
      prefix: 'login',
      windowMs: 60_000,
      maxRequests: 10,
      failClosed: true,
    });

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.resetIn).toBe(60);
  });

  it('allows fail-closed limiters in production when ALLOW_MEMORY_RATE_LIMIT=true (demo override)', async () => {
    process.env.VERCEL_ENV = 'production';
    process.env.ALLOW_MEMORY_RATE_LIMIT = 'true';
    unsetDistributedStoreEnv();

    vi.doMock('@/lib/logger', () => ({
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    }));

    const { checkRateLimit } = await import('@/lib/services/rateLimitService');
    const result = await checkRateLimit('127.0.0.1', {
      prefix: 'login',
      windowMs: 60_000,
      maxRequests: 10,
      failClosed: true,
    });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
    expect(result.limit).toBe(10);
  });
});
