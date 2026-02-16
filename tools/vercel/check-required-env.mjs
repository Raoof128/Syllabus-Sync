/**
 * Vercel required env key check (names only, never values).
 *
 * This script is meant to be run locally or in CI using the Vercel CLI:
 * - `npm run vercel:env:check`
 *
 * It validates that the Vercel project has the minimum keys needed for:
 * - Resend transactional email (verification)
 * - Cron cleanup endpoint auth
 *
 * Notes:
 * - Requires the Vercel CLI to be authenticated (`vercel login`) OR `VERCEL_TOKEN`.
 * - Does not print secret values.
 */

import { execFileSync } from 'node:child_process';

const REQUIRED_KEYS = [
  // Resend email service
  'RESEND_API_KEY',
  'VERIFICATION_EMAIL_FROM',
  'VERIFICATION_EMAIL_NAME',
  // Email verification link base URL (fallbacks exist, but this is recommended)
  'NEXT_PUBLIC_APP_URL',
  // Cron endpoint auth
  'CRON_SECRET',
];

function readEnvList(environment) {
  const args = ['env', 'ls', environment];

  // Prefer explicit non-interactive auth in CI when available.
  if (process.env.VERCEL_TOKEN?.trim()) {
    args.push('--token', process.env.VERCEL_TOKEN.trim());
  }
  if (process.env.VERCEL_ORG_ID?.trim()) {
    args.push('--scope', process.env.VERCEL_ORG_ID.trim());
  }

  // `vercel env ls <env>` prints a table including keys; we only need to detect names.
  const out = execFileSync('vercel', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });
  return out;
}

function main() {
  const environment = process.env.VERCEL_ENVIRONMENT || 'production';

  let output;
  try {
    output = readEnvList(environment);
  } catch (err) {
    const msg =
      err?.stderr?.toString?.() ||
      err?.message ||
      'failed to run `vercel env ls` (is the Vercel CLI installed and authenticated?)';
    console.error(msg);
    process.exitCode = 2;
    return;
  }

  const missing = REQUIRED_KEYS.filter((k) => !output.includes(k));
  if (missing.length > 0) {
    console.error(
      [
        `Missing required Vercel environment keys for "${environment}":`,
        ...missing.map((k) => `- ${k}`),
        '',
        'Fix:',
        `- vercel env add <KEY> ${environment}`,
        `- or set them in the Vercel dashboard: Project -> Settings -> Environment Variables`,
      ].join('\n'),
    );
    process.exitCode = 1;
    return;
  }

  console.log(`OK: required env keys present for "${environment}".`);
}

main();
