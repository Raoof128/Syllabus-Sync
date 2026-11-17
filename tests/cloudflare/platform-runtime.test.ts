import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getConfiguredAppOrigin,
  getDeploymentEnvironment,
  getDeploymentPlatform,
  isProductionDeployment,
} from '@/lib/platform/runtime';

describe('deployment runtime detection', () => {
  it('detects Cloudflare production explicitly', () => {
    const env = {
      DEPLOYMENT_PLATFORM: 'cloudflare',
      DEPLOYMENT_ENV: 'production',
      NEXT_PUBLIC_APP_URL: 'https://www.syllabus-sync.app',
    };

    expect(getDeploymentPlatform(env)).toBe('cloudflare');
    expect(getDeploymentEnvironment(env)).toBe('production');
    expect(isProductionDeployment(env)).toBe(true);
    expect(getConfiguredAppOrigin(env)).toBe('https://www.syllabus-sync.app');
  });

  it('retains Vercel production detection for rollback', () => {
    const env = {
      VERCEL: '1',
      VERCEL_ENV: 'production',
      VERCEL_PROJECT_PRODUCTION_URL: 'www.syllabus-sync.app',
    };

    expect(getDeploymentPlatform(env)).toBe('vercel');
    expect(getDeploymentEnvironment(env)).toBe('production');
    expect(isProductionDeployment(env)).toBe(true);
    expect(getConfiguredAppOrigin(env)).toBe('https://www.syllabus-sync.app');
  });

  it('retains Vercel development detection for rollback', () => {
    const env = {
      VERCEL: '1',
      VERCEL_ENV: 'development',
      NODE_ENV: 'production',
    };

    expect(getDeploymentPlatform(env)).toBe('vercel');
    expect(getDeploymentEnvironment(env)).toBe('development');
    expect(isProductionDeployment(env)).toBe(false);
  });

  it('does not classify a Cloudflare preview as production', () => {
    const env = {
      DEPLOYMENT_PLATFORM: 'cloudflare',
      DEPLOYMENT_ENV: 'preview',
      NODE_ENV: 'production',
    };

    expect(isProductionDeployment(env)).toBe(false);
  });

  it('classifies test and development deterministically', () => {
    expect(getDeploymentEnvironment({ NODE_ENV: 'test' })).toBe('test');
    expect(getDeploymentEnvironment({ NODE_ENV: 'development' })).toBe('development');
    expect(getDeploymentEnvironment({ DEPLOYMENT_ENV: 'test', NODE_ENV: 'production' })).toBe(
      'test',
    );
    expect(
      getDeploymentEnvironment({ DEPLOYMENT_ENV: 'development', NODE_ENV: 'production' }),
    ).toBe('development');
  });

  it('does not detect whitespace-only Vercel environment values', () => {
    expect(getDeploymentPlatform({ VERCEL_ENV: '  ', NODE_ENV: 'production' })).toBe('unknown');
  });

  it('rejects malformed configured origins', () => {
    expect(getConfiguredAppOrigin({ NEXT_PUBLIC_APP_URL: 'not a URL' })).toBeNull();
  });

  it('accepts only HTTP origins and strips paths, queries, and fragments', () => {
    expect(
      getConfiguredAppOrigin({
        NEXT_PUBLIC_APP_URL: ' https://www.syllabus-sync.app/account?a=1#profile ',
      }),
    ).toBe('https://www.syllabus-sync.app');
    expect(getConfiguredAppOrigin({ NEXT_PUBLIC_APP_URL: 'ftp://files.example.com' })).toBeNull();
    expect(getConfiguredAppOrigin({ NEXT_PUBLIC_APP_URL: 'javascript:alert(1)' })).toBeNull();
  });

  it('rejects credential-bearing configured origins', () => {
    expect(
      getConfiguredAppOrigin({ NEXT_PUBLIC_APP_URL: 'https://user:secret@example.org/path' }),
    ).toBeNull();
  });

  it('does not treat a scheme or path as a Vercel hostname', () => {
    expect(getConfiguredAppOrigin({ VERCEL_URL: 'http://attacker.example' })).toBeNull();
    expect(getConfiguredAppOrigin({ VERCEL_URL: 'trusted.example/redirect' })).toBeNull();
  });

  it('normalizes a configured Vercel hostname to lowercase', () => {
    expect(getConfiguredAppOrigin({ VERCEL_URL: 'Preview-Team.Vercel.App' })).toBe(
      'https://preview-team.vercel.app',
    );
  });

  it('falls through an invalid direct candidate to the next configured origin', () => {
    expect(
      getConfiguredAppOrigin({
        NEXT_PUBLIC_APP_URL: 'not a URL',
        NEXT_PUBLIC_SITE_URL: 'https://site.syllabus-sync.app/path',
      }),
    ).toBe('https://site.syllabus-sync.app');
  });
});

describe('platform-neutral runtime consumers', () => {
  const readSource = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

  it('keeps Vercel environment compatibility inside the centralized runtime helper', () => {
    const consumers = [
      'lib/security/ip.ts',
      'lib/security/csrf.ts',
      'lib/services/rateLimitService.ts',
      'app/api/_lib/middleware.ts',
      'app/api/_lib/response.ts',
      'app/api/auth/signin/route.ts',
      'app/api/auth/signup/route.ts',
      'lib/services/emailService.ts',
      'config/sentry/sentry.server.config.ts',
      'config/sentry/sentry.edge.config.ts',
    ];

    for (const file of consumers) {
      expect(readSource(file), file).not.toContain('process.env.VERCEL_ENV');
    }
  });

  it('centralizes configured Vercel URL aliases', () => {
    const originConsumers = [
      'lib/security/ip.ts',
      'lib/security/csrf.ts',
      'app/api/auth/signup/route.ts',
    ];

    for (const file of originConsumers) {
      expect(readSource(file), file).not.toMatch(
        /VERCEL_(?:URL|BRANCH_URL|PROJECT_PRODUCTION_URL)/,
      );
    }
  });

  it('uses the shared client IP implementation in API middleware', () => {
    const middlewareSource = readSource('app/api/_lib/middleware.ts');
    expect(middlewareSource).toContain("import { getClientIP } from '@/lib/security/ip';");
    expect(middlewareSource).not.toMatch(/function\s+(?:isValidIP|getClientIP)\s*\(/);
  });

  it('retains browser-safe Sentry gating and adds a platform-neutral public tag', () => {
    const clientSource = readSource('config/sentry/sentry.client.config.ts');
    expect(clientSource).toContain("process.env.NODE_ENV === 'production'");
    expect(clientSource).toContain('process.env.NEXT_PUBLIC_SENTRY_ENABLED');
    expect(clientSource).toContain('process.env.NEXT_PUBLIC_DEPLOYMENT_ENV');
    expect(clientSource).toContain('process.env.NEXT_PUBLIC_VERCEL_ENV');
  });
});
