// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { getDeploymentEnvironment, isProductionDeployment } from '@/lib/platform/runtime';

// Only initialize Sentry if DSN is configured
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const sentryEnabled =
  Boolean(dsn) && (isProductionDeployment() || process.env.SENTRY_ENABLED === 'true');

if (sentryEnabled) {
  // SECURITY/RELIABILITY (BA-0018): this used to be `void import(...).then(...)`,
  // a floating promise that is never awaited and never handed to
  // `ctx.waitUntil()`. On Cloudflare Workers, async work outside the
  // request/response lifecycle is not guaranteed to keep running once the
  // first response has been sent — a cold isolate's first request could
  // complete before this promise chain settles, leaving Sentry silently
  // uninitialized for that isolate's lifetime. This file is loaded via
  // Next's Sentry-instrumented `register()` hook as
  // `await import('./sentry.server.config')`, so awaiting the chain here
  // means that outer await transitively waits for Sentry.init() to finish
  // before the isolate starts handling requests.
  await import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.init({
        dsn,

        // Performance Monitoring
        tracesSampleRate: isProductionDeployment() ? 0.1 : 1.0,

        // Set sampling rate for profiling - this is relative to tracesSampleRate
        profilesSampleRate: 0.1,

        // Setting this option to true will print useful information to the console while you're setting up Sentry.
        debug: false,

        // Environment tagging
        environment: getDeploymentEnvironment(),

        // Only send errors in production (unless explicitly enabled)
        enabled: isProductionDeployment() || process.env.SENTRY_ENABLED === 'true',

        // Filter out sensitive data
        beforeSend(event) {
          // Remove potentially sensitive data
          if (event.request?.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
          }

          // Remove sensitive data from breadcrumbs
          if (event.breadcrumbs) {
            event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
              if (breadcrumb.data?.url?.includes('password')) {
                return {
                  ...breadcrumb,
                  data: { ...breadcrumb.data, url: '[REDACTED]' },
                };
              }
              return breadcrumb;
            });
          }

          return event;
        },

        // Ignore common non-actionable errors
        ignoreErrors: [
          // Network errors
          'Failed to fetch',
          'NetworkError',
          'Load failed',
          // Browser extensions
          'chrome-extension://',
          'moz-extension://',
          // User cancellation
          'AbortError',
          // Non-actionable React errors
          'ResizeObserver loop',
        ],
      });
    })
    .catch((error) => {
      console.warn('Sentry server init failed:', error);
    });
}
