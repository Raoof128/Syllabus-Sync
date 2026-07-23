#!/usr/bin/env node

/**
 * Enforces the Cloudflare Worker compressed-upload budget by parsing the gzip
 * measurement printed by `wrangler deploy --dry-run`.
 *
 * Usage:
 *   npm run check:worker-size -- .open-next/wrangler-dry-run.log
 */

import { readFile } from 'node:fs/promises';

export const WARNING_KIB = 2.8 * 1024;
export const HARD_LIMIT_KIB = 9.5 * 1024;

/**
 * Extracts the last gzip measurement from Wrangler dry-run output.
 *
 * @returns {number} size in KiB
 * @throws when no measurement is present
 */
export function parseGzipKiB(content) {
  const matches = [...content.matchAll(/gzip:\s*([\d.]+)\s*(KiB|MiB)/gi)];

  if (matches.length === 0) {
    throw new Error('No gzip upload measurement found');
  }

  const [, rawValue, rawUnit] = matches.at(-1);
  const value = Number.parseFloat(rawValue);

  if (!Number.isFinite(value)) {
    throw new Error('Malformed gzip upload measurement');
  }

  return rawUnit.toLowerCase() === 'mib' ? value * 1024 : value;
}

/**
 * @returns {{ gzipKiB: number, ok: boolean, warn: boolean }}
 */
export function evaluateWorkerSize(content) {
  const gzipKiB = parseGzipKiB(content);

  return {
    gzipKiB,
    ok: gzipKiB <= HARD_LIMIT_KIB,
    warn: gzipKiB > WARNING_KIB,
  };
}

export async function runCli(logPath = process.argv[2] ?? '.open-next/wrangler-dry-run.log') {
  let content;
  try {
    content = await readFile(logPath, 'utf8');
  } catch {
    console.error(`Unable to read Wrangler dry-run log: ${logPath}`);
    process.exitCode = 1;
    return 1;
  }

  let result;
  try {
    result = evaluateWorkerSize(content);
  } catch (error) {
    console.error(`${error.message} in ${logPath}`);
    process.exitCode = 1;
    return 1;
  }

  console.log(`Worker compressed upload: ${result.gzipKiB.toFixed(2)} KiB`);

  if (!result.ok) {
    console.error(
      `Worker exceeds hard migration limit: ${result.gzipKiB.toFixed(2)} KiB > ${HARD_LIMIT_KIB.toFixed(2)} KiB`,
    );
    process.exitCode = 1;
    return 1;
  }

  if (result.warn) {
    console.warn(
      `Worker exceeds free-plan warning threshold: ${result.gzipKiB.toFixed(2)} KiB > ${WARNING_KIB.toFixed(2)} KiB`,
    );
  }

  return 0;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (invokedDirectly) {
  await runCli();
}
