#!/usr/bin/env node
/**
 * Build-output gate: fail if the client bundle is missing a required
 * NEXT_PUBLIC_* value.
 *
 * WHY THIS EXISTS
 *
 * On 2026-07-30 a production deploy took the site down. `NEXT_PUBLIC_*` variables
 * are inlined into the client bundle by Next.js AT BUILD TIME. Cloudflare Worker
 * secrets and `wrangler.jsonc` `vars` are RUNTIME values — they never reach the
 * browser bundle. The build was run with only two of the eight required
 * NEXT_PUBLIC_* variables exported, so `NEXT_PUBLIC_SUPABASE_URL` and
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY` were inlined as empty strings.
 *
 * Nothing failed. The build exited 0, `wrangler deploy` succeeded, and the Worker
 * started fine. But `createAdminClient()` validates the URL before use and
 * returned null, so every admin-backed route degraded (`/api/health` reported
 * `database: not_configured`), and the browser had no Supabase credentials at all.
 * The only signal was in responses, after the deploy was already live.
 *
 * A silent, deploy-time, total-outage failure mode with a green build is exactly
 * what a gate is for. Run this between `opennextjs-cloudflare build` and
 * `wrangler deploy`.
 *
 * Usage:  node tools/cloudflare/check-public-env.mjs [assetsDir]
 */

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const assetsDir = process.argv[2] ?? '.open-next/assets';

/**
 * Each check is a *value* assertion, not a variable-name assertion. The variable
 * name never appears in the output — Next replaces `process.env.NEXT_PUBLIC_X`
 * with the literal string — so the only way to know a value was present at build
 * time is to look for the shape of the value itself.
 */
const REQUIRED = [
  {
    env: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'Supabase project URL',
    pattern: /https:\/\/[a-z0-9]{20}\.supabase\.co/,
    consequence:
      'browser cannot reach Supabase, and createAdminClient() returns null server-side, degrading every admin-backed route',
  },
  {
    env: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    description: 'Supabase publishable key',
    pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{20,}/,
    consequence: 'every client-side query and the whole auth flow fail',
  },
  {
    env: 'NEXT_PUBLIC_APP_URL',
    description: 'canonical app origin',
    pattern: /https:\/\/[a-z0-9.-]*syllabus-sync[a-z0-9.-]*/,
    consequence: 'signup returns 503 (BA-0033), and robots/sitemap/email links lose their base URL',
  },
];

/** Present in the bundle but not fatal — warn only. */
const OPTIONAL = [
  {
    env: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    description: 'Google Maps JS key',
    pattern: /AIza[0-9A-Za-z_-]{35}/,
    consequence: 'the map page cannot load the Google Maps SDK',
  },
  {
    env: 'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
    description: 'Web Push VAPID public key',
    pattern: /["'`]B[A-Za-z0-9_-]{85,87}["'`]/,
    consequence: 'push notification subscription fails in the browser',
  },
];

async function collectChunks(dir) {
  const out = [];
  async function walk(current) {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.endsWith('.js')) out.push(full);
    }
  }
  await walk(dir);
  return out;
}

async function main() {
  const chunkDir = path.join(assetsDir, '_next', 'static');
  const files = await collectChunks(chunkDir);

  if (files.length === 0) {
    console.error(
      `Public env check FAILED: no JS chunks found under ${chunkDir}.\n` +
        'Run `npx opennextjs-cloudflare build` first, or pass the assets directory as an argument.',
    );
    process.exit(1);
  }

  let blob = '';
  for (const file of files) blob += await readFile(file, 'utf8');

  const missingRequired = [];
  const missingOptional = [];

  for (const check of REQUIRED) {
    if (!check.pattern.test(blob)) missingRequired.push(check);
  }
  for (const check of OPTIONAL) {
    if (!check.pattern.test(blob)) missingOptional.push(check);
  }

  console.log(
    `Public env check: scanned ${files.length} chunks (${Math.round(blob.length / 1024)} KiB) in ${chunkDir}`,
  );

  for (const check of REQUIRED) {
    const ok = !missingRequired.includes(check);
    console.log(`  ${ok ? 'PASS' : 'FAIL'} ${check.env} (${check.description})`);
  }
  for (const check of OPTIONAL) {
    const ok = !missingOptional.includes(check);
    console.log(`  ${ok ? 'PASS' : 'WARN'} ${check.env} (${check.description}) [optional]`);
  }

  for (const check of missingOptional) {
    console.warn(`\nWarning: ${check.env} was not inlined — ${check.consequence}.`);
  }

  if (missingRequired.length > 0) {
    console.error('\nPublic env check FAILED. Do not deploy this build.\n');
    for (const check of missingRequired) {
      console.error(`  ${check.env} is missing from the client bundle.`);
      console.error(`    Impact: ${check.consequence}.`);
    }
    console.error(
      '\nNEXT_PUBLIC_* values are inlined at BUILD time. Worker secrets and\n' +
        'wrangler.jsonc `vars` are runtime-only and will NOT fix this. Put the values\n' +
        'in `.env.local` (gitignored) or export them before building, then rebuild.\n',
    );
    process.exit(1);
  }

  console.log('\nPublic env check passed — safe to deploy.');
}

main().catch((error) => {
  console.error('Public env check errored:', error);
  process.exit(1);
});
