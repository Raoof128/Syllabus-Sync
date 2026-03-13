// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

export {};

// Only initialize Sentry if DSN is configured
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const sentryEnabled =
  Boolean(dsn) && (process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true');

if (sentryEnabled) {
  void import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.init({
        dsn,

        // Performance Monitoring
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

        // Setting this option to true will print useful information to the console while you're setting up Sentry.
        debug: false,

        // Environment tagging
        environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',

        // Only send errors in production (unless explicitly enabled)
        enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true',
      });
    })
    .catch((error) => {
      console.warn('Sentry edge init failed:', error);
    });
}
