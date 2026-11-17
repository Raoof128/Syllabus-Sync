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
 * This is checked two ways:
 *
 *  1. Source inspection (deterministic, matches the existing convention in
 *     tests/cloudflare/platform-runtime.test.ts) — the vulnerable
 *     `void import(...)` shape must be gone from both files, replaced by an
 *     awaited chain.
 *
 *  2. An isolated behavioral proof of the *pattern* itself: `void p.then(cb)`
 *     lets an enclosing `await import(thisModule)` resolve before `cb` has
 *     run, while `await p.then(cb)` does not. This is exercised against a
 *     minimal stand-in module (not the real Next.js/webpack-oriented Sentry
 *     config files, which pull in Vite's SSR module graph and are prone to
 *     event-loop-scheduling flakiness under a fully parallel test run) so
 *     the regression this fix targets is proven without relying on real
 *     dynamic imports of heavy, framework-instrumented files.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

const SENTRY_CONFIG_FILES = [
  'config/sentry/sentry.server.config.ts',
  'config/sentry/sentry.edge.config.ts',
];

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf-8');
}

describe('BA-0018: Sentry server/edge init awaits initialization instead of firing a floating promise', () => {
  it.each(SENTRY_CONFIG_FILES)('%s no longer uses a floating void import()', (relativePath) => {
    const source = readSource(relativePath);
    expect(source).not.toMatch(/void\s+import\(['"]@sentry\/nextjs['"]\)/);
  });

  it.each(SENTRY_CONFIG_FILES)('%s awaits the @sentry/nextjs import chain', (relativePath) => {
    const source = readSource(relativePath);
    expect(source).toMatch(/await\s+import\(['"]@sentry\/nextjs['"]\)\s*\n?\s*\.then\(/);
  });

  it('proves the pattern: a floating (void) promise lets the caller resolve before the callback runs', async () => {
    const callback = vi.fn();
    let resolveInner: (() => void) | undefined;
    const inner = new Promise<void>((resolve) => {
      resolveInner = resolve;
    });

    async function floatingInit() {
      void inner.then(callback);
    }

    await floatingInit();
    // The outer async function returned without ever waiting for `inner`
    // to settle, so the callback has not run yet — this is the bug.
    expect(callback).not.toHaveBeenCalled();

    resolveInner?.();
    await inner;
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('proves the fix: awaiting the promise chain blocks the caller until the callback has run', async () => {
    const callback = vi.fn();
    let resolveInner: (() => void) | undefined;
    const inner = new Promise<void>((resolve) => {
      resolveInner = resolve;
    });

    async function awaitedInit() {
      await inner.then(callback);
    }

    const initPromise = awaitedInit();
    resolveInner?.();
    await initPromise;

    // By the time the awaited call returns, the callback has definitely run.
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
