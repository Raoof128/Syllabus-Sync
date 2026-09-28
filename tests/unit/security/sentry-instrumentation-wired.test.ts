/**
 * Regression guard for BA-0061.
 *
 * `@sentry/nextjs` only auto-injects the client config. Server and edge Sentry
 * start exclusively from Next's `instrumentation.ts` `register()` hook, and
 * this repository had no such file — so every server-side error was invisible
 * to Sentry, and the scrubbing configured for those runtimes never ran.
 *
 * Source inspection, matching tests/unit/security/sentry-init-awaited.test.ts:
 * importing the real configs drags in the Next/webpack module graph.
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi, afterEach } from 'vitest';

const ROOT = process.cwd();
const FILE = path.join(ROOT, 'instrumentation.ts');

describe('instrumentation.ts wires server and edge Sentry (BA-0061)', () => {
  it('exists at the project root, where Next.js looks for it', () => {
    expect(existsSync(FILE)).toBe(true);
  });

  it('loads the server config on the Node.js runtime and the edge config on edge', () => {
    const src = readFileSync(FILE, 'utf-8');
    expect(src).toMatch(
      /NEXT_RUNTIME === 'nodejs'[\s\S]*?await import\('\.\/config\/sentry\/sentry\.server\.config'\)/,
    );
    expect(src).toMatch(
      /NEXT_RUNTIME === 'edge'[\s\S]*?await import\('\.\/config\/sentry\/sentry\.edge\.config'\)/,
    );
  });

  it('exports onRequestError backed by Sentry.captureRequestError', () => {
    const src = readFileSync(FILE, 'utf-8');
    expect(src).toMatch(/export const onRequestError/);
    expect(src).toMatch(/captureRequestError\(/);
  });

  it('both imported config files keep a beforeSend scrubber', () => {
    for (const rel of ['config/sentry/sentry.server.config.ts', 'config/sentry/sentry.edge.config.ts']) {
      expect(readFileSync(path.join(ROOT, rel), 'utf-8')).toMatch(/beforeSend/);
    }
  });

  describe('onRequestError behaviour', () => {
    const saved = process.env.NEXT_PUBLIC_SENTRY_DSN;
    afterEach(() => {
      if (saved === undefined) delete process.env.NEXT_PUBLIC_SENTRY_DSN;
      else process.env.NEXT_PUBLIC_SENTRY_DSN = saved;
      vi.doUnmock('@sentry/nextjs');
      vi.resetModules();
    });

    const args = [
      new Error('boom'),
      { path: '/api/x', method: 'GET', headers: {} },
      { routerKind: 'App Router', routePath: '/api/x', routeType: 'route', renderSource: undefined },
    ] as const;

    it('forwards to Sentry when a DSN is configured', async () => {
      const captureRequestError = vi.fn();
      vi.doMock('@sentry/nextjs', () => ({ captureRequestError }));
      process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://public@example.ingest.sentry.io/1';
      const { onRequestError } = await import('@/instrumentation');
      await onRequestError(...(args as unknown as Parameters<typeof onRequestError>));
      expect(captureRequestError).toHaveBeenCalledTimes(1);
    });

    it('does nothing without a DSN', async () => {
      const captureRequestError = vi.fn();
      vi.doMock('@sentry/nextjs', () => ({ captureRequestError }));
      delete process.env.NEXT_PUBLIC_SENTRY_DSN;
      const { onRequestError } = await import('@/instrumentation');
      await onRequestError(...(args as unknown as Parameters<typeof onRequestError>));
      expect(captureRequestError).not.toHaveBeenCalled();
    });
  });
});
