#!/usr/bin/env node

/**
 * Public and unauthenticated smoke tests for a Worker origin.
 *
 * Usage:
 *   npm run cf:smoke -- http://localhost:8787
 *   npm run cf:smoke -- "$PREVIEW_ORIGIN"
 *
 * Covers only what can be asserted without credentials. Authenticated flows —
 * login, passkeys, MFA, email, push — stay in the manual preview parity matrix.
 * Never prints response bodies or cookies.
 */

const TIMEOUT_MS = 15_000;

const REQUIRED_HTML_HEADERS = [
  'content-security-policy',
  'strict-transport-security',
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
  'permissions-policy',
];

export function normaliseBaseUrl(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('A base URL is required');
  }

  const url = new URL(input.trim());
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Base URL must be http or https');
  }

  return `${url.origin}`;
}

/**
 * @returns {Array<{ name: string, path: string, check: (response: Response) => string | null, init?: RequestInit }>}
 */
export function buildChecks() {
  const htmlHeaders = (response) => {
    const missing = REQUIRED_HTML_HEADERS.filter((header) => !response.headers.has(header));
    return missing.length > 0 ? `missing security headers: ${missing.join(', ')}` : null;
  };

  const expectStatus = (expected) => (response) =>
    response.status === expected ? null : `expected ${expected}, received ${response.status}`;

  const expectHtmlPage = (response) => expectStatus(200)(response) ?? htmlHeaders(response);

  return [
    { name: 'home', path: '/', check: expectHtmlPage },
    { name: 'login', path: '/login', check: expectHtmlPage },
    { name: 'privacy', path: '/privacy', check: expectHtmlPage },
    { name: 'terms', path: '/terms', check: expectHtmlPage },
    { name: 'health', path: '/api/health', check: expectStatus(200) },
    {
      name: 'manifest',
      path: '/manifest.webmanifest',
      check: (response) => {
        const status = expectStatus(200)(response);
        if (status) return status;
        const type = response.headers.get('content-type') ?? '';
        return type.includes('manifest+json') ? null : `unexpected content-type: ${type}`;
      },
    },
    {
      name: 'app-icon',
      path: '/icons/icon-192.png',
      check: (response) => {
        const status = expectStatus(200)(response);
        if (status) return status;
        const cacheControl = response.headers.get('cache-control') ?? '';
        return cacheControl.includes('immutable')
          ? null
          : `expected an immutable cache-control, received: ${cacheControl}`;
      },
    },
    {
      name: 'protected-page-redirect',
      path: '/calendar',
      init: { redirect: 'manual' },
      check: (response) => {
        if (response.status < 300 || response.status >= 400) {
          return `expected a redirect, received ${response.status}`;
        }
        const location = response.headers.get('location') ?? '';
        return location.includes('/login')
          ? null
          : `expected a redirect to /login, got ${location}`;
      },
    },
    {
      name: 'protected-api-refuses-anonymous',
      path: '/api/user/export',
      init: { redirect: 'manual' },
      check: (response) =>
        [401, 403, 503].includes(response.status)
          ? null
          : `protected API must refuse anonymous access, received ${response.status}`,
    },
  ];
}

export async function runSmoke(baseUrl, fetchImpl = globalThis.fetch, log = console.log) {
  const origin = normaliseBaseUrl(baseUrl);
  const checks = buildChecks();
  const failures = [];

  log(`Smoke testing ${origin}`);

  for (const check of checks) {
    let outcome;
    try {
      const response = await fetchImpl(`${origin}${check.path}`, {
        redirect: 'follow',
        ...check.init,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      outcome = check.check(response);
    } catch (error) {
      outcome = `request failed: ${error.message}`;
    }

    if (outcome) {
      failures.push(`${check.name} (${check.path}): ${outcome}`);
      log(`FAIL ${check.name} ${check.path} — ${outcome}`);
    } else {
      log(`PASS ${check.name} ${check.path}`);
    }
  }

  log(`${checks.length - failures.length}/${checks.length} checks passed`);
  return { ok: failures.length === 0, failures, total: checks.length };
}

const invokedDirectly =
  process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (invokedDirectly) {
  try {
    const result = await runSmoke(process.argv[2]);
    process.exitCode = result.ok ? 0 : 1;
  } catch (error) {
    console.error(`Smoke run could not start: ${error.message}`);
    process.exitCode = 1;
  }
}
