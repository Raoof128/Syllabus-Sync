/**
 * Reproduction for BA-0018.
 *
 * `config/sentry/sentry.server.config.ts` and `sentry.edge.config.ts` used
 * to initialize Sentry with a *floating* promise:
 *
 *   void import('@sentry/nextjs').then((Sentry) => { Sentry.init({...}); });
 *
 * The `void` explicitly discards the promise instead of awaiting it. These
 * config files are loaded via Next's Sentry-SDK-generated instrumentation
 * `register()` hook, which itself is `await import(...)`-ed once per Worker
 * isolate before the isolate starts handling requests. Because the inner
 * `@sentry/nextjs` import + `Sentry.init()` chain was never awaited, the
 * outer `await import('./sentry.server.config')` only waited for this
 * module's *synchronous* top-level code to finish — not for Sentry to
 * actually finish initializing. Per Cloudflare's own docs, a Worker
 * invocation's async work is not guaranteed to keep running once the first
 * response has been sent unless it's awaited or handed to
 * `ctx.waitUntil()`; on a cold isolate whose first request completes fast,
 * `Sentry.init()` could simply never resolve for that isolate's lifetime.
 *
 * Fixed by awaiting the import chain (`await import(...).then(...)`)
 * instead of firing it with `void`, so any caller that awaits importing
 * this module (as Next's generated instrumentation does) transitively waits
 * for Sentry.init() to actually settle.
 *
 * This is proven behaviorally: `@sentry/nextjs` is mocked as a promise this
 * test controls the resolution of. Before the fix, dynamically importing
 * the config module resolves immediately regardless of whether the mocked
 * `@sentry/nextjs` import has resolved. After the fix, importing the config
 * module stays pending until `Sentry.init` has actually been called.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };

function enableSentryEnv() {
  process.env = {
    ...originalEnv,
    DEPLOYMENT_ENV: 'production',
    NEXT_PUBLIC_SENTRY_DSN: 'https://examplePublicKey@o0.ingest.sentry.io/0',
  };
}

describe.each([
  ['server', '@/config/sentry/sentry.server.config'],
  ['edge', '@/config/sentry/sentry.edge.config'],
])('BA-0018: %s Sentry config awaits initialization', (_label, modulePath) => {
  beforeEach(() => {
    vi.resetModules();
    enableSentryEnv();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('does not finish loading until Sentry.init has been invoked', async () => {
    const initMock = vi.fn();
    let releaseSentryModule: ((mod: { init: typeof initMock }) => void) | undefined;

    vi.doMock('@sentry/nextjs', () => {
      return new Promise((resolve) => {
        releaseSentryModule = resolve as typeof releaseSentryModule;
      });
    });

    let loaded = false;
    const importPromise = import(modulePath).then(() => {
      loaded = true;
    });

    // Let any already-queued microtasks/macrotasks settle without resolving
    // the mocked @sentry/nextjs import ourselves.
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(initMock).not.toHaveBeenCalled();
    expect(loaded).toBe(false);

    releaseSentryModule?.({ init: initMock });
    await importPromise;

    expect(loaded).toBe(true);
    expect(initMock).toHaveBeenCalledTimes(1);
  });
});
