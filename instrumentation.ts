import type { Instrumentation } from 'next';

/**
 * Next.js instrumentation hook — the only place server and edge Sentry start.
 *
 * BA-0061: this file did not exist. `@sentry/nextjs` v8+ injects only the
 * client config; the server and edge configs must be loaded from
 * `register()`, and the SDK says so at build time ("An instrumentation file is
 * required for the Sentry SDK to be initialized on the server"). Without it,
 * `config/sentry/sentry.{server,edge}.config.ts` were never imported, so no
 * route-handler, server-component or middleware error ever reached Sentry,
 * and the BA-0018 awaited-init fix and the 2026-08-17 `beforeSend` scrubbing
 * on those two runtimes had nothing to act on.
 *
 * Both configs are inert unless a DSN is set and the deployment is production
 * (or SENTRY_ENABLED=true), so this changes nothing in local development.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./config/sentry/sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./config/sentry/sentry.edge.config');
  }
}

/**
 * Report errors from nested React Server Components, route handlers and
 * middleware. Loaded lazily so the SDK is not pulled onto the request path
 * when Sentry is not configured; `captureRequestError` is a no-op before
 * `Sentry.init()`, and the scrubbing in `beforeSend` applies to what it sends.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  const Sentry = await import('@sentry/nextjs');
  Sentry.captureRequestError(error, request, context);
};
