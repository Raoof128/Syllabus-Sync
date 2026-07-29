/**
 * Regression guard for BA-0047 — the outage this project caused on itself.
 *
 * `NEXT_PUBLIC_*` values are inlined into the client bundle by Next.js at BUILD
 * time. Cloudflare Worker secrets and `wrangler.jsonc` `vars` are RUNTIME values
 * and never reach the browser. On 2026-07-30 a production build was run with only
 * two of the required NEXT_PUBLIC_* variables exported, so
 * `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` were inlined as
 * empty strings.
 *
 * Every existing gate passed. The build exited 0, the 1231-test suite was green,
 * `wrangler deploy --dry-run` was clean, and the Worker booted. Yet
 * `/api/health` went to `database: not_configured` and the browser had no
 * Supabase credentials at all. Recovery was a version rollback.
 *
 * The lesson is that no test which runs *before* the bundle exists can catch
 * this — it has to be asserted against the build OUTPUT. Hence
 * `tools/cloudflare/check-public-env.mjs`, and hence this test, which pins the
 * gate into the deploy scripts so it cannot be quietly dropped.
 */

import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';

describe('BA-0047: the public-env gate must run before every deploy', () => {
  it('exists as a script', async () => {
    const pkg = JSON.parse(await readFile('package.json', 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts['cf:check-public-env']).toMatch(/check-public-env\.mjs/);
  });

  it.each(['cf:deploy', 'cf:deploy:production', 'cf:upload', 'cf:upload:production', 'cf:preview'])(
    '%s runs the gate after building',
    async (script) => {
      const pkg = JSON.parse(await readFile('package.json', 'utf8')) as {
        scripts: Record<string, string>;
      };
      const command = pkg.scripts[script];
      expect(command, `expected ${script} to exist`).toBeTruthy();
      expect(command).toContain('cf:check-public-env');

      // Order matters: the gate is meaningless before the bundle exists, and
      // pointless after the artefact has already been shipped.
      const buildAt = command.indexOf('cf:build');
      const gateAt = command.indexOf('cf:check-public-env');
      const shipAt = Math.max(
        command.indexOf('opennextjs-cloudflare deploy'),
        command.indexOf('opennextjs-cloudflare upload'),
        command.indexOf('opennextjs-cloudflare preview'),
      );
      expect(buildAt).toBeGreaterThanOrEqual(0);
      expect(gateAt).toBeGreaterThan(buildAt);
      if (shipAt >= 0) expect(gateAt).toBeLessThan(shipAt);
    },
  );

  it('treats the Supabase URL, publishable key and app origin as required', async () => {
    const gate = await readFile('tools/cloudflare/check-public-env.mjs', 'utf8');

    // Split so the OPTIONAL list cannot satisfy a REQUIRED assertion.
    const requiredBlock = gate.slice(
      gate.indexOf('const REQUIRED'),
      gate.indexOf('const OPTIONAL'),
    );
    for (const key of [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_APP_URL',
    ]) {
      expect(requiredBlock, `${key} must be required, not optional`).toContain(key);
    }
  });

  it('fails the process rather than only warning', async () => {
    const gate = await readFile('tools/cloudflare/check-public-env.mjs', 'utf8');
    expect(gate).toMatch(/process\.exit\(1\)/);
  });
});
