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
