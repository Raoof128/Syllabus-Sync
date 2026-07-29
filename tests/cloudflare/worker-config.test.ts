import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

function parseJsonc(input: string): unknown {
  return JSON.parse(
    input
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
      .replace(/,\s*([}\]])/g, '$1'),
  );
}

describe('Cloudflare Worker configuration', () => {
  it('uses the custom OpenNext worker with required compatibility flags', async () => {
    const raw = await readFile('wrangler.jsonc', 'utf8');
    const config = parseJsonc(raw) as {
      main: string;
      compatibility_date: string;
      compatibility_flags: string[];
      assets: { directory: string; binding: string; run_worker_first: boolean | string[] };
      images: { binding: string };
      keep_vars: boolean;
      triggers: { crons: string[] };
    };

    expect(config.main).toBe('custom-worker.ts');
    expect(config.compatibility_date).toBe('2026-07-22');
    expect(config.compatibility_flags).toEqual(
      expect.arrayContaining(['nodejs_compat', 'global_fetch_strictly_public']),
    );
    expect(config.assets.directory).toBe('.open-next/assets');
    expect(config.assets.binding).toBe('ASSETS');

    if (!Array.isArray(config.assets.run_worker_first)) {
      throw new Error('assets.run_worker_first must be an explicit route list');
    }

    expect(config.assets.run_worker_first).toEqual([
      '/*',
      '!/_next/static/*',
      '!/icons/*',
      '!/images/*',
      '!/favicon.ico',
      '!/manifest.webmanifest',
      '!/*.webmanifest',
      '!/*.woff2',
      '!/sw.js',
    ]);

    for (const unsafeBypass of [
      '!/*',
      '!/*.html',
      '!/*.rsc',
      '!/*?_rsc=*',
      '!/api/*',
      '!/auth/*',
      '!/login',
      '!/signup',
      '!/reset-password',
      '!/_next/image',
      '!/_next/image*',
    ]) {
      expect(config.assets.run_worker_first).not.toContain(unsafeBypass);
    }

    expect(config.images.binding).toBe('IMAGES');
    expect(config.keep_vars).toBe(true);
    expect(config.triggers.crons).toEqual([]);

    const production = (
      config as typeof config & {
        env: {
          production: {
            images: { binding: string };
            services: Array<{ binding: string; service: string }>;
            triggers: { crons: string[] };
          };
        };
      }
    ).env.production;

    expect(production.images.binding).toBe('IMAGES');
    expect(production.services).toContainEqual({
      binding: 'WORKER_SELF_REFERENCE',
      service: 'syllabus-sync-production',
    });

    // Production scheduling was handed over from Vercel Cron to Cloudflare Cron
    // Triggers at the 2026-07-29 cutover, so these three expressions are now the
    // intended state. They must stay exactly in sync with the routes mapped in
    // `lib/cloudflare/scheduled.ts`; an extra or renamed expression throws there
    // at runtime rather than silently skipping a cleanup job. The preview
    // environment above is still asserted empty, because only one environment may
    // ever own a schedule against the shared Supabase backend.
    expect(production.triggers.crons).toEqual(['0 3 * * *', '10 3 * * *', '20 3 * * *']);
  });

  it('enforces runtime compatibility and the isolated Worker typecheck in the global gate', async () => {
    const packageJson = JSON.parse(await readFile('package.json', 'utf8')) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts.check).toBe(
      'npm run check:secrets && npm run check:cloudflare-runtime && npm run format:check && npm run typecheck && npm run typecheck:cloudflare && npm run lint && npm run test && npm run build',
    );
  });
});

/**
 * Regression guard for BA-0033.
 *
 * Signup returned 503 for every user in production from the Cloudflare cutover
 * until 2026-07-30. `app/api/auth/signup/route.ts` refuses to proceed without an
 * app origin:
 *
 *   const appUrl = getConfiguredAppOrigin() ?? (isDev ? 'http://localhost:3000' : null);
 *   if (!appUrl) return 503;
 *
 * `getConfiguredAppOrigin()` reads NEXT_PUBLIC_APP_URL / NEXT_PUBLIC_SITE_URL and
 * then falls back to VERCEL_PROJECT_PRODUCTION_URL / VERCEL_BRANCH_URL /
 * VERCEL_URL. On Vercel that fallback always resolved, so the variable was never
 * needed explicitly. On Workers those variables do not exist, and neither
 * NEXT_PUBLIC_* var was declared — so the origin was null and registration was
 * impossible. `emailService.ts` builds verification and reset links from the same
 * helper.
 *
 * The origin is a public value, so it belongs in `vars` rather than a secret;
 * that also means this file is the single source of truth and a missing value is
 * catchable here rather than only in production.
 */
describe('BA-0033: Worker must declare an app origin for every environment', () => {
  it('declares NEXT_PUBLIC_APP_URL in both preview and production', async () => {
    const raw = await readFile('wrangler.jsonc', 'utf8');
    const config = parseJsonc(raw) as {
      vars: Record<string, string>;
      env: { production: { vars: Record<string, string> } };
    };

    const production = config.env.production.vars;
    const preview = config.vars;

    // Production must be the real customer-facing origin. A wrong value here
    // sends password-reset and verification links to the wrong host, so assert
    // the exact string rather than merely that something is set.
    expect(production.NEXT_PUBLIC_APP_URL).toBe('https://www.syllabus-sync.app');
    expect(preview.NEXT_PUBLIC_APP_URL).toMatch(/^https:\/\/[a-z0-9.-]+$/);
    expect(preview.NEXT_PUBLIC_APP_URL).not.toBe(production.NEXT_PUBLIC_APP_URL);
  });

  it('never falls back to a Vercel-only variable on Cloudflare', async () => {
    const runtime = await readFile('lib/platform/runtime.ts', 'utf8');

    // Guards the premise: if the VERCEL_* fallback is ever removed, this test's
    // reason for existing changes and the comment above should be revisited.
    expect(runtime).toMatch(/VERCEL_PROJECT_PRODUCTION_URL/);

    const raw = await readFile('wrangler.jsonc', 'utf8');
    const config = parseJsonc(raw) as {
      vars: Record<string, string>;
      env: { production: { vars: Record<string, string> } };
    };
    for (const vars of [config.vars, config.env.production.vars]) {
      expect(Object.keys(vars)).not.toContain('VERCEL_URL');
      expect(Object.keys(vars)).not.toContain('VERCEL_PROJECT_PRODUCTION_URL');
    }
  });
});
