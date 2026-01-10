// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

// Only initialize Sentry if DSN is configured
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 0.1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Environment tagging
    environment: process.env.NODE_ENV || 'development',

    // Only send errors in production (unless explicitly enabled)
    enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true',

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
            return { ...breadcrumb, data: { ...breadcrumb.data, url: '[REDACTED]' } };
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
}
