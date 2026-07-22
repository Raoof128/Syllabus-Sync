// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { getDeploymentEnvironment, isProductionDeployment } from '@/lib/platform/runtime';

// Only initialize Sentry if DSN is configured
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const sentryEnabled =
  Boolean(dsn) && (isProductionDeployment() || process.env.SENTRY_ENABLED === 'true');

if (sentryEnabled) {
  void import('@sentry/nextjs')
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
      });
    })
    .catch((error) => {
      console.warn('Sentry edge init failed:', error);
    });
}
