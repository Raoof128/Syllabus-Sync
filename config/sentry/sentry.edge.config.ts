// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { getDeploymentEnvironment, isProductionDeployment } from '@/lib/platform/runtime';
import { scrubSentryEvent } from '@/lib/observability/sentry-scrub';

// Only initialize Sentry if DSN is configured
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const sentryEnabled =
  Boolean(dsn) && (isProductionDeployment() || process.env.SENTRY_ENABLED === 'true');

if (sentryEnabled) {
  // SECURITY/RELIABILITY (BA-0018): see sentry.server.config.ts — this used
  // to be `void import(...).then(...)`, a floating promise never awaited or
  // handed to `ctx.waitUntil()`, so Sentry.init() could be cut off on
  // Workers before it resolves. Awaiting it here lets the outer
  // `await import('./sentry.edge.config')` in Next's instrumentation
  // register() hook wait for initialization to actually finish.
  await import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.init({
        dsn,

        // Performance Monitoring
        tracesSampleRate: isProductionDeployment() ? 0.1 : 1.0,

        // Setting this option to true will print useful information to the console while you're setting up Sentry.
        debug: false,

        // Environment tagging
        environment: getDeploymentEnvironment(),

        // Only send errors in production (unless explicitly enabled)
        enabled: isProductionDeployment() || process.env.SENTRY_ENABLED === 'true',

        // Filter out sensitive data.
        //
        // This config had no beforeSend hook at all until 2026-08-17, so edge
        // events (middleware, edge routes) were the one path with nothing
        // stripped — not even the `authorization` and `cookie` headers the
        // client and server configs had always removed. Found while closing
        // the review's Q6.
        beforeSend(event) {
          return scrubSentryEvent(event);
        },
      });
    })
    .catch((error) => {
      console.warn('Sentry edge init failed:', error);
    });
}
