import { describe, expect, it } from 'vitest';
import { validateEnvironment } from '../../tools/deployment/check-required-env.mjs';

type ValidationResult = {
  errors: string[];
  warnings: string[];
  production: boolean;
};

const validate = validateEnvironment as (env: Record<string, string>) => ValidationResult;

const COMPLETE_PREVIEW: Record<string, string> = {
  DEPLOYMENT_PLATFORM: 'cloudflare',
  DEPLOYMENT_ENV: 'preview',
  NEXT_PUBLIC_SUPABASE_URL: 'https://abcdefghijkl.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.preview',
  NEXT_PUBLIC_APP_URL: 'https://syllabus-sync-preview.workers.dev',
  SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service',
  RESEND_API_KEY: 're_preview_key',
  CRON_SECRET: 'a'.repeat(64),
  UPSTASH_REDIS_REST_URL: 'https://redis.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'upstash-token',
  GOOGLE_ROUTES_API_KEY: 'routes',
  GOOGLE_WEATHER_API_KEY: 'weather',
  ORS_API_KEY: 'ors',
  VAPID_PRIVATE_KEY: 'vapid-private',
  VAPID_SUBJECT: 'mailto:ops@syllabus-sync.app',
  SENTRY_AUTH_TOKEN: 'sentry-token',
};

const COMPLETE_PRODUCTION: Record<string, string> = {
  ...COMPLETE_PREVIEW,
  DEPLOYMENT_ENV: 'production',
  NEXT_PUBLIC_APP_URL: 'https://www.syllabus-sync.app',
  NEXT_PUBLIC_SITE_URL: 'https://www.syllabus-sync.app',
  WEBAUTHN_RP_ID: 'syllabus-sync.app',
  WEBAUTHN_ORIGIN: 'https://www.syllabus-sync.app',
};

describe('deployment environment validation', () => {
  it('accepts a complete Cloudflare preview environment', () => {
    const result = validate(COMPLETE_PREVIEW);

    expect(result.production).toBe(false);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it('accepts a complete Cloudflare production environment', () => {
    const result = validate(COMPLETE_PRODUCTION);

    expect(result.production).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('fails when CRON_SECRET is missing', () => {
    const { CRON_SECRET: _omitted, ...env } = COMPLETE_PRODUCTION;

    expect(validate(env).errors).toContain('CRON_SECRET is missing or empty');
  });

  it('fails when a required value is only whitespace', () => {
    const result = validate({ ...COMPLETE_PRODUCTION, RESEND_API_KEY: '   ' });

    expect(result.errors).toContain('RESEND_API_KEY is missing or empty');
  });

  it('rejects placeholder Supabase credentials', () => {
    const result = validate({
      ...COMPLETE_PRODUCTION,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'PASTE_YOUR_KEY_HERE',
    });

    expect(result.errors).toContain(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY still contains an example placeholder',
    );
  });

  it('rejects an http production origin', () => {
    const result = validate({
      ...COMPLETE_PRODUCTION,
      NEXT_PUBLIC_APP_URL: 'http://www.syllabus-sync.app',
    });

    expect(result.errors).toContain('NEXT_PUBLIC_APP_URL must use https in production');
  });

  it('rejects an example production origin', () => {
    const result = validate({
      ...COMPLETE_PRODUCTION,
      NEXT_PUBLIC_SITE_URL: 'https://preview.example.com',
    });

    expect(result.errors).toContain('NEXT_PUBLIC_SITE_URL still points at an example host');
  });

  it('rejects a malformed URL', () => {
    const result = validate({ ...COMPLETE_PRODUCTION, NEXT_PUBLIC_APP_URL: 'not a URL' });

    expect(result.errors).toContain('NEXT_PUBLIC_APP_URL is not a valid URL');
  });

  it('rejects a wrong production WebAuthn RP ID', () => {
    const result = validate({ ...COMPLETE_PRODUCTION, WEBAUTHN_RP_ID: 'www.syllabus-sync.app' });

    expect(result.errors).toContain(
      'WEBAUTHN_RP_ID must be exactly the canonical production value',
    );
  });

  it('does not enforce production WebAuthn values on preview', () => {
    const result = validate({
      ...COMPLETE_PREVIEW,
      WEBAUTHN_RP_ID: 'syllabus-sync-preview.workers.dev',
    });

    expect(result.errors).toEqual([]);
  });

  it('fails when no distributed rate-limit backend is complete', () => {
    const {
      UPSTASH_REDIS_REST_URL: _url,
      UPSTASH_REDIS_REST_TOKEN: _token,
      SUPABASE_SERVICE_ROLE_KEY: _service,
      ...env
    } = COMPLETE_PRODUCTION;

    const result = validate(env);

    expect(
      result.errors.some((error) => error.startsWith('No complete distributed rate-limit backend')),
    ).toBe(true);
  });

  it('accepts the Vercel KV backend for rollback', () => {
    const {
      UPSTASH_REDIS_REST_URL: _url,
      UPSTASH_REDIS_REST_TOKEN: _token,
      ...env
    } = COMPLETE_PRODUCTION;

    const result = validate({
      ...env,
      KV_REST_API_URL: 'https://kv.vercel-storage.com',
      KV_REST_API_TOKEN: 'kv-token',
    });

    expect(result.errors).toEqual([]);
  });

  it('warns when only the Supabase Postgres fallback is available', () => {
    const {
      UPSTASH_REDIS_REST_URL: _url,
      UPSTASH_REDIS_REST_TOKEN: _token,
      ...env
    } = COMPLETE_PRODUCTION;

    const result = validate(env);

    expect(result.errors).toEqual([]);
    expect(result.warnings).toContain(
      'Rate limiting will use the Supabase Postgres fallback; Upstash Redis is preferred',
    );
  });

  it('refuses in-memory rate limiting in production', () => {
    const result = validate({ ...COMPLETE_PRODUCTION, ALLOW_MEMORY_RATE_LIMIT: 'true' });

    expect(result.errors).toContain('ALLOW_MEMORY_RATE_LIMIT must not be set in production');
  });

  it('warns without failing for a disabled optional feature', () => {
    const { GOOGLE_WEATHER_API_KEY: _omitted, ...env } = COMPLETE_PRODUCTION;

    const result = validate(env);

    expect(result.errors).toEqual([]);
    expect(result.warnings).toContain(
      'GOOGLE_WEATHER_API_KEY is not set; weather widget will be unavailable',
    );
  });

  it('never reports a configured value, only its name', () => {
    const result = validate({
      ...COMPLETE_PRODUCTION,
      NEXT_PUBLIC_APP_URL: 'http://www.syllabus-sync.app',
      CRON_SECRET: 'super-secret-cron-value',
      RESEND_API_KEY: '',
    });

    const reported = [...result.errors, ...result.warnings].join('\n');
    expect(reported).not.toContain('super-secret-cron-value');
    expect(reported).not.toContain('upstash-token');
  });

  it('treats Vercel production as production for rollback validation', () => {
    const { DEPLOYMENT_ENV: _omitted, ...env } = COMPLETE_PRODUCTION;

    expect(validate({ ...env, VERCEL_ENV: 'production' }).production).toBe(true);
  });
});
