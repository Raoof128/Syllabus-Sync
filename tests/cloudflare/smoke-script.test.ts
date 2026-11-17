import { describe, expect, it, vi } from 'vitest';
import { buildChecks, normaliseBaseUrl, runSmoke } from '../../tools/cloudflare/smoke.mjs';

type SmokeResult = { ok: boolean; failures: string[]; total: number };

const normalise = normaliseBaseUrl as (input: unknown) => string;
const checks = buildChecks as () => Array<{ name: string; path: string }>;
const smoke = runSmoke as (
  baseUrl: string,
  fetchImpl: typeof fetch,
  log?: (message: string) => void,
) => Promise<SmokeResult>;

const SECURITY_HEADERS = {
  'content-security-policy': "default-src 'self'; script-src 'self' 'nonce-abc'",
  'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'SAMEORIGIN',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=()',
};

function healthyResponder(overrides: Record<string, () => Response> = {}) {
  return vi.fn(async (url: string) => {
    const { pathname } = new URL(url);
    if (overrides[pathname]) return overrides[pathname]();

    if (pathname === '/api/health') return new Response('{}', { status: 200 });
    if (pathname === '/manifest.webmanifest') {
      return new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/manifest+json' },
      });
    }
    if (pathname === '/icons/icon-192.png') {
      return new Response('', {
        status: 200,
        headers: { 'cache-control': 'public,max-age=31536000,immutable' },
      });
    }
    if (pathname === '/calendar') {
      return new Response(null, {
        status: 307,
        headers: { location: '/login?redirectTo=%2Fcalendar' },
      });
    }
    if (pathname === '/api/user/export') return new Response('{}', { status: 401 });

    return new Response('<!doctype html>', { status: 200, headers: SECURITY_HEADERS });
  }) as unknown as typeof fetch;
}

describe('normaliseBaseUrl', () => {
  it('reduces any URL to its origin', () => {
    expect(normalise('https://www.syllabus-sync.app/some/path?x=1')).toBe(
      'https://www.syllabus-sync.app',
    );
    expect(normalise('  http://localhost:8787/  ')).toBe('http://localhost:8787');
  });

  it('rejects a missing, malformed, or non-HTTP base URL', () => {
    expect(() => normalise(undefined)).toThrow('A base URL is required');
    expect(() => normalise('not a url')).toThrow();
    expect(() => normalise('ftp://example.com')).toThrow('Base URL must be http or https');
  });
});

describe('smoke check coverage', () => {
  it('covers the public, static, and protected paths the plan requires', () => {
    const paths = checks().map((check) => check.path);

    expect(paths).toEqual(
      expect.arrayContaining([
        '/',
        '/login',
        '/privacy',
        '/terms',
        '/api/health',
        '/manifest.webmanifest',
        '/icons/icon-192.png',
        '/calendar',
        '/api/user/export',
      ]),
    );
  });
});

describe('runSmoke', () => {
  it('passes against a healthy origin', async () => {
    const result = await smoke('http://localhost:8787', healthyResponder(), () => {});

    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('fails when an HTML route is missing a security header', async () => {
    const { 'content-security-policy': _dropped, ...withoutCsp } = SECURITY_HEADERS;
    const fetchImpl = healthyResponder({
      '/': () => new Response('<!doctype html>', { status: 200, headers: withoutCsp }),
    });

    const result = await smoke('http://localhost:8787', fetchImpl, () => {});

    expect(result.ok).toBe(false);
    expect(result.failures.join()).toContain('content-security-policy');
  });

  it('fails when a protected API answers anonymously with 200', async () => {
    const fetchImpl = healthyResponder({
      '/api/user/export': () => new Response('{"data":[]}', { status: 200 }),
    });

    const result = await smoke('http://localhost:8787', fetchImpl, () => {});

    expect(result.ok).toBe(false);
    expect(result.failures.join()).toContain('protected API must refuse anonymous access');
  });

  it('fails when a protected page stops redirecting to login', async () => {
    const fetchImpl = healthyResponder({
      '/calendar': () =>
        new Response('<!doctype html>', { status: 200, headers: SECURITY_HEADERS }),
    });

    const result = await smoke('http://localhost:8787', fetchImpl, () => {});

    expect(result.ok).toBe(false);
    expect(result.failures.join()).toContain('expected a redirect');
  });

  it('fails when a hashed asset loses immutable caching', async () => {
    const fetchImpl = healthyResponder({
      '/icons/icon-192.png': () =>
        new Response('', { status: 200, headers: { 'cache-control': 'no-store' } }),
    });

    const result = await smoke('http://localhost:8787', fetchImpl, () => {});

    expect(result.ok).toBe(false);
    expect(result.failures.join()).toContain('immutable');
  });

  it('records a network failure instead of throwing', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('connection refused');
    }) as unknown as typeof fetch;

    const result = await smoke('http://localhost:8787', fetchImpl, () => {});

    expect(result.ok).toBe(false);
    expect(result.failures).toHaveLength(result.total);
    expect(result.failures.join()).toContain('connection refused');
  });

  it('never logs response bodies or cookies', async () => {
    const lines: string[] = [];
    const fetchImpl = healthyResponder({
      '/api/user/export': () =>
        new Response('{"secret":"leaked"}', {
          status: 401,
          headers: { 'set-cookie': '__Host-csrf=supersecret; Path=/' },
        }),
    });

    await smoke('http://localhost:8787', fetchImpl, (message: string) => lines.push(message));

    const output = lines.join('\n');
    expect(output).not.toContain('leaked');
    expect(output).not.toContain('supersecret');
  });
});
