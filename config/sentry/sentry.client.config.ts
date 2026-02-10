// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

export {};

// Only initialize Sentry if DSN is configured
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const sentryEnabled =
  Boolean(dsn) &&
  (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SENTRY_ENABLED === 'true');

if (sentryEnabled) {
  void import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.init({
        dsn,

        // Performance Monitoring
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

        // Session Replay
        replaysSessionSampleRate: 0.1, // 10% of sessions
        replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

        // Setting this option to true will print useful information to the console while you're setting up Sentry.
        debug: false,

        // Environment tagging
        environment: process.env.NODE_ENV || 'development',

        // Only send errors in production (unless explicitly enabled)
        enabled:
          process.env.NODE_ENV === 'production' ||
          process.env.NEXT_PUBLIC_SENTRY_ENABLED === 'true',

        // Integrations
        integrations: [
          Sentry.replayIntegration({
            // Mask all text and block all media for privacy
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],

        // Filter out sensitive data
        beforeSend(event) {
          // Remove potentially sensitive data
          if (event.request?.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
          }

          return event;
        },

        // Ignore common non-actionable errors
        ignoreErrors: [
          // Network errors
          'Failed to fetch',
          'NetworkError',
          'Load failed',
          'ChunkLoadError',
          // Browser extensions
          'chrome-extension://',
          'moz-extension://',
          // User cancellation
          'AbortError',
          // Non-actionable React errors
          'ResizeObserver loop',
          // Hydration mismatches (usually browser extension interference)
          'Hydration failed',
          'Text content does not match',
        ],
      });
    })
    .catch((error) => {
      console.warn('Sentry client init failed:', error);
    });
}
