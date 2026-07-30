import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

/**
 * Cloudflare applies EVERY matching `_headers` rule and appends values, so two
 * rules that both match one path and both set the same single-value header
 * produce a comma-joined value. Production served
 *
 *   content-type: application/manifest+json, application/manifest+json
 *
 * for `/manifest.webmanifest`, because it was declared by an exact-path rule and
 * also matched by a `/*.webmanifest` glob. That is not merely cosmetic: a
 * comma-joined `Content-Type` is not a valid media type and a browser may reject
 * it, which for a webmanifest means losing PWA installability.
 *
 * Verified live against https://www.syllabus-sync.app/manifest.webmanifest
 * before the fix; this locks the shape of the file so the overlap cannot return.
 */

const HEADERS_FILE = 'public/_headers';

/**
 * Headers that may only ever carry one value. `Cache-Control` is excluded: it
 * is a legitimately comma-delimited list.
 */
const SINGLE_VALUE_HEADERS = ['content-type', 'x-frame-options', 'x-content-type-options'];

type Rule = { pattern: string; headers: Map<string, string> };

function parseHeadersFile(source: string): Rule[] {
  const rules: Rule[] = [];
  let current: Rule | null = null;

  for (const rawLine of source.split('\n')) {
    const line = rawLine.replace(/\s+$/, '');
    if (!line.trim() || line.trim().startsWith('#')) continue;

    if (!/^\s/.test(line)) {
      current = { pattern: line.trim(), headers: new Map() };
      rules.push(current);
      continue;
    }

    const separator = line.indexOf(':');
    if (separator === -1 || !current) continue;
    current.headers.set(
      line.slice(0, separator).trim().toLowerCase(),
      line.slice(separator + 1).trim(),
    );
  }

  return rules;
}

/** Mirrors Cloudflare's `_headers` matching for the shapes this file uses. */
function matches(pattern: string, path: string): boolean {
  if (!pattern.includes('*')) return pattern === path;
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(path);
}

const REPRESENTATIVE_PATHS = [
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/images/logo.png',
  '/_next/static/chunks/main.js',
  '/favicon.ico',
  '/sw.js',
];

describe('public/_headers never double-sets a single-value header', () => {
  it.each(REPRESENTATIVE_PATHS)('%s receives each single-value header once', async (path) => {
    const rules = parseHeadersFile(await readFile(HEADERS_FILE, 'utf8'));

    for (const header of SINGLE_VALUE_HEADERS) {
      const setters = rules
        .filter((rule) => matches(rule.pattern, path) && rule.headers.has(header))
        .map((rule) => rule.pattern);

      expect(
        setters.length,
        `${header} for ${path} is set by ${setters.length} rules: ${setters.join(' and ')}`,
      ).toBeLessThanOrEqual(1);
    }
  });

  it('still serves the manifest media type from exactly one rule', async () => {
    const rules = parseHeadersFile(await readFile(HEADERS_FILE, 'utf8'));
    const setters = rules.filter(
      (rule) => matches(rule.pattern, '/manifest.webmanifest') && rule.headers.has('content-type'),
    );

    // Non-vacuous: the header must still be declared, just once.
    expect(setters).toHaveLength(1);
    expect(setters[0].headers.get('content-type')).toBe('application/manifest+json');
  });

  it('keeps the baseline security headers applying to every asset', async () => {
    const rules = parseHeadersFile(await readFile(HEADERS_FILE, 'utf8'));
    const catchAll = rules.find((rule) => rule.pattern === '/*');

    expect(catchAll?.headers.get('x-frame-options')).toBe('SAMEORIGIN');
    expect(catchAll?.headers.get('x-content-type-options')).toBe('nosniff');
    expect(catchAll?.headers.has('strict-transport-security')).toBe(true);
    expect(catchAll?.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
  });
});
