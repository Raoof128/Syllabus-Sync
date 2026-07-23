import { readFile } from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';
import { CRON_ROUTE_BY_EXPRESSION, runScheduledJob } from '@/lib/cloudflare/scheduled';

describe('Cloudflare scheduled cleanup dispatcher', () => {
  it.each([
    ['0 3 * * *', '/api/auth/email/cleanup'],
    ['10 3 * * *', '/api/auth/password/cleanup'],
    ['20 3 * * *', '/api/security/rate-limit/cleanup'],
  ])('maps %s to %s', async (cron, expectedPath) => {
    const invoke = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

    await runScheduledJob(cron, 'test-secret', invoke);

    expect(invoke).toHaveBeenCalledTimes(1);
    const request = invoke.mock.calls[0][0] as Request;
    expect(new URL(request.url).pathname).toBe(expectedPath);
    expect(request.method).toBe('POST');
    expect(request.headers.get('authorization')).toBe('Bearer test-secret');
    expect(request.headers.get('x-syllabus-sync-scheduler')).toBe('cloudflare-cron');
  });

  it('sends no browser origin so server-to-server CSRF validation passes', async () => {
    const invoke = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

    await runScheduledJob('0 3 * * *', 'test-secret', invoke);

    const request = invoke.mock.calls[0][0] as Request;
    expect(request.headers.get('origin')).toBeNull();
    expect(request.headers.get('referer')).toBeNull();
  });

  it('rejects an unknown cron expression', async () => {
    const invoke = vi.fn();

    await expect(runScheduledJob('* * * * *', 'test-secret', invoke)).rejects.toThrow(
      'Unsupported cron expression',
    );
    expect(invoke).not.toHaveBeenCalled();
  });

  it.each([
    ['absent', undefined],
    ['empty', ''],
    ['whitespace-only', '   '],
  ])('fails closed when CRON_SECRET is %s', async (_label, secret) => {
    const invoke = vi.fn();

    await expect(runScheduledJob('0 3 * * *', secret, invoke)).rejects.toThrow(
      'CRON_SECRET is not configured',
    );
    expect(invoke).not.toHaveBeenCalled();
  });

  it('fails when the cleanup endpoint is non-successful', async () => {
    const invoke = vi.fn().mockResolvedValue(new Response('failed', { status: 500 }));

    await expect(runScheduledJob('0 3 * * *', 'test-secret', invoke)).rejects.toThrow(
      'Scheduled cleanup failed',
    );
  });

  it('reports the cron, route, and status without echoing the response body', async () => {
    const invoke = vi
      .fn()
      .mockResolvedValue(new Response('unauthorized: Bearer test-secret', { status: 401 }));

    const error = (await runScheduledJob('0 3 * * *', 'test-secret', invoke).catch(
      (thrown: unknown) => thrown,
    )) as Error;

    expect(error.message).toContain('cron=0 3 * * *');
    expect(error.message).toContain('route=/api/auth/email/cleanup');
    expect(error.message).toContain('status=401');
    expect(error.message).not.toContain('test-secret');
  });

  it('defines exactly the three migrated Vercel schedules', () => {
    expect(CRON_ROUTE_BY_EXPRESSION).toEqual({
      '0 3 * * *': '/api/auth/email/cleanup',
      '10 3 * * *': '/api/auth/password/cleanup',
      '20 3 * * *': '/api/security/rate-limit/cleanup',
    });
  });

  it('matches the schedules Vercel Cron still owns before cutover', async () => {
    const vercelConfig = JSON.parse(await readFile('vercel.json', 'utf8')) as {
      crons: Array<{ path: string; schedule: string }>;
    };

    const vercelSchedules = Object.fromEntries(
      vercelConfig.crons.map((entry) => [entry.schedule, entry.path]),
    );

    expect(vercelSchedules).toEqual(CRON_ROUTE_BY_EXPRESSION);
  });
});

describe('Cloudflare custom worker entry point', () => {
  it('delegates fetch to OpenNext and cron to the shared dispatcher', async () => {
    const source = await readFile('custom-worker.ts', 'utf8');

    expect(source).toContain("import handler from './.open-next/worker.js'");
    expect(source).toContain("from '@/lib/cloudflare/scheduled'");
    expect(source).toContain('fetch: handler.fetch');
    expect(source).toMatch(/runScheduledJob\(\s*event\.cron,\s*env\.CRON_SECRET/);
    expect(source).not.toContain('OpenNext worker has not been built yet');
  });
});
