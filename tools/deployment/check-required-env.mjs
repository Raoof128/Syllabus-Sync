#!/usr/bin/env node

/**
 * Platform-neutral deployment environment validation.
 *
 * Validates the build-time and runtime configuration required by a Cloudflare
 * Workers or Vercel deployment. Reports variable NAMES only — never values —
 * so it is safe to run in CI logs.
 *
 * Usage:
 *   npm run deploy:env:check
 *
 * Unlike `tools/vercel/check-required-env.mjs`, which interrogates the Vercel
 * project through the Vercel CLI, this script validates the environment of the
 * process it runs in. Both are kept: the Vercel one still guards rollback.
 */

export const REQUIRED_PUBLIC = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_APP_URL',
];

export const REQUIRED_SERVER = ['SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY', 'CRON_SECRET'];

/**
 * Any one complete backend satisfies the distributed rate-limit requirement.
 * Order mirrors `getStore()` in `lib/services/rateLimitService.ts`.
 */
export const DISTRIBUTED_RATE_LIMIT_BACKENDS = [
  ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
  ['KV_REST_API_URL', 'KV_REST_API_TOKEN'],
  ['SUPABASE_SERVICE_ROLE_KEY'],
];

export const FEATURE_GATED = [
  ['GOOGLE_ROUTES_API_KEY', 'Google route proxy'],
  ['GOOGLE_WEATHER_API_KEY', 'weather widget'],
  ['ORS_API_KEY', 'campus-raster navigation'],
  ['VAPID_PRIVATE_KEY', 'Web Push'],
  ['VAPID_SUBJECT', 'Web Push'],
  ['SENTRY_AUTH_TOKEN', 'Sentry source-map upload'],
];

export const PRODUCTION_WEBAUTHN = {
  WEBAUTHN_RP_ID: 'syllabus-sync.app',
  WEBAUTHN_ORIGIN: 'https://www.syllabus-sync.app',
};

const PLACEHOLDER_MARKERS = ['your-', 'placeholder', 'paste'];

function read(env, name) {
  return typeof env[name] === 'string' ? env[name].trim() : '';
}

function looksLikePlaceholder(value) {
  const lowered = value.toLowerCase();
  return PLACEHOLDER_MARKERS.some((marker) => lowered.includes(marker));
}

function isProduction(env) {
  const explicit = read(env, 'DEPLOYMENT_ENV').toLowerCase();
  if (explicit) return explicit === 'production';
  return read(env, 'VERCEL_ENV').toLowerCase() === 'production';
}

/**
 * @returns {{ errors: string[], warnings: string[], production: boolean }}
 */
export function validateEnvironment(env = process.env) {
  const errors = [];
  const warnings = [];
  const production = isProduction(env);

  for (const name of [...REQUIRED_PUBLIC, ...REQUIRED_SERVER]) {
    const value = read(env, name);
    if (!value) {
      errors.push(`${name} is missing or empty`);
      continue;
    }
    if (looksLikePlaceholder(value)) {
      errors.push(`${name} still contains an example placeholder`);
    }
  }

  for (const name of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_SITE_URL']) {
    const value = read(env, name);
    if (!value) continue;

    let url;
    try {
      url = new URL(value);
    } catch {
      errors.push(`${name} is not a valid URL`);
      continue;
    }

    if (!['http:', 'https:'].includes(url.protocol)) {
      errors.push(`${name} must use http or https`);
      continue;
    }

    if (production) {
      if (url.protocol !== 'https:') {
        errors.push(`${name} must use https in production`);
      }
      if (url.hostname === 'example.com' || url.hostname.endsWith('.example.com')) {
        errors.push(`${name} still points at an example host`);
      }
    }
  }

  const satisfiedBackend = DISTRIBUTED_RATE_LIMIT_BACKENDS.find((backend) =>
    backend.every((name) => read(env, name)),
  );

  if (!satisfiedBackend) {
    errors.push(
      'No complete distributed rate-limit backend configured ' +
        '(UPSTASH_REDIS_REST_URL+UPSTASH_REDIS_REST_TOKEN, ' +
        'KV_REST_API_URL+KV_REST_API_TOKEN, or SUPABASE_SERVICE_ROLE_KEY)',
    );
  } else if (satisfiedBackend[0] === 'SUPABASE_SERVICE_ROLE_KEY') {
    warnings.push(
      'Rate limiting will use the Supabase Postgres fallback; Upstash Redis is preferred',
    );
  }

  if (production && read(env, 'ALLOW_MEMORY_RATE_LIMIT')) {
    errors.push('ALLOW_MEMORY_RATE_LIMIT must not be set in production');
  }

  if (production) {
    for (const [name, expected] of Object.entries(PRODUCTION_WEBAUTHN)) {
      const value = read(env, name);
      if (value !== expected) {
        errors.push(`${name} must be exactly the canonical production value`);
      }
    }
  }

  for (const [name, feature] of FEATURE_GATED) {
    if (!read(env, name)) {
      warnings.push(`${name} is not set; ${feature} will be unavailable`);
    }
  }

  return { errors, warnings, production };
}

export function runCli(env = process.env) {
  const { errors, warnings, production } = validateEnvironment(env);

  console.log(`Validating ${production ? 'production' : 'non-production'} deployment environment.`);

  for (const warning of warnings) {
    console.warn(`warning: ${warning}`);
  }

  if (errors.length > 0) {
    console.error('Deployment environment validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return 1;
  }

  console.log(`Deployment environment validation passed with ${warnings.length} warning(s).`);
  return 0;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (invokedDirectly) {
  runCli();
}
