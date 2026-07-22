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
    expect(config.assets.run_worker_first).toEqual(
      expect.arrayContaining(['/*', '!/_next/static/*', '!/icons/*', '!/images/*']),
    );
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
    expect(production.triggers.crons).toEqual([]);
  });
});
