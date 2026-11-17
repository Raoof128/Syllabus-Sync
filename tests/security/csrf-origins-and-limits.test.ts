/**
 * Reproduction for BA-0037, BA-0038 and BA-0039 — found by red-teaming the live
 * deployment on 2026-07-29/30.
 *
 * ---------------------------------------------------------------------------
 * BA-0037 (P2): `https://maps.googleapis.com` was a trusted CSRF origin.
 *
 * `getTrustedOrigins()` added it unconditionally, so a state-changing POST
 * carrying `Origin: https://maps.googleapis.com` passed the origin check.
 * Confirmed against production: that origin returned 401 (credential check
 * reached) where `https://evil.example.com` returned 403 (origin rejected).
 *
 * The app only ever loads the Maps JS SDK *outbound* via a `<script src>` in
 * `lib/maps/google/loader.ts`. Nothing on that host ever posts to this app, so
 * the entry bought nothing and widened the CSRF trust boundary to a third-party
 * origin that also appears in `script-src` — the same host trusted for code and
 * for request provenance.
 *
 * ---------------------------------------------------------------------------
 * BA-0038 (P2): production rate limits were left at "increased for testing".
 *
 * The source comments said so outright. login 50/15min, signup 20/hour, passkey
 * auth 50/15min. 50 attempts per 15 minutes is ~4,800 password guesses per day
 * per account from a single IP. The limiter itself is sound and fails closed
 * (verified live: the 10/hour reset limiter returned 429) — only the thresholds
 * were wrong.
 *
 * ---------------------------------------------------------------------------
 * BA-0039 (P3, latent): six localhost origins were allow-listed unconditionally.
 *
 * `getAllowedOrigins()` returned localhost:3000-3002 and 127.0.0.1:3000-3002 in
 * every environment, including production. It is currently unreachable there —
 * the global middleware applies the stricter `validateCSRF()`/`getTrustedOrigins()`
 * check first and returns 403 (verified live for all six) — but `validateOrigin()`
 * is still wired into `app/api/_lib/middleware.ts`, `app/api/navigate/route.ts`
 * and `withCSRFProtection()`, so it becomes live the moment a path is excluded
 * from the middleware matcher. Defence in depth should not depend on an outer
 * layer that a routing change can remove.
 */

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();

async function read(rel: string): Promise<string> {
  return readFile(path.resolve(ROOT, rel), 'utf8');
}

describe('BA-0037: CSRF trust must not extend to third-party origins', () => {
  it('does not trust maps.googleapis.com as a request origin', async () => {
    const csrf = await read('lib/security/csrf.ts');

    const trusted = /function\s+getTrustedOrigins\(\)[\s\S]*?\n}/.exec(csrf);
    expect(trusted, 'expected getTrustedOrigins() to exist').not.toBeNull();

    expect(trusted![0]).not.toMatch(/origins\.add\(\s*['"]https:\/\/maps\.googleapis\.com['"]/);
  });

  it('still trusts the configured app origin and the Supabase project', async () => {
    const csrf = await read('lib/security/csrf.ts');
    const trusted = /function\s+getTrustedOrigins\(\)[\s\S]*?\n}/.exec(csrf)![0];

    // Guards against over-correction: removing the Google entry must not strip
    // the origins the app genuinely needs.
    expect(trusted).toMatch(/getConfiguredAppOrigin\(\)/);
    expect(trusted).toMatch(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});

describe('BA-0038: production rate limits must not be testing values', () => {
  const LIMITS: ReadonlyArray<readonly [string, number]> = [
    ['loginLimiter', 10],
    ['signupLimiter', 5],
    ['passkeyAuthLimiter', 10],
  ];

  it.each(LIMITS)('%s allows at most %d requests per window', async (name, max) => {
    const svc = await read('lib/services/rateLimitService.ts');

    const block = new RegExp(
      `export\\s+const\\s+${name}\\s*=\\s*createRateLimiter\\(\\{([\\s\\S]*?)\\}\\)`,
    ).exec(svc);
    expect(block, `expected ${name} to be defined`).not.toBeNull();

    const configured = /maxRequests:\s*(\d+)/.exec(block![1]);
    expect(configured, `expected ${name} to set maxRequests`).not.toBeNull();
    expect(Number(configured![1])).toBeLessThanOrEqual(max);

    // The comment that shipped these to production must be gone, so the next
    // reader cannot mistake a deliberate value for a temporary one.
    expect(block![1]).not.toMatch(/increased for testing/i);
  });

  it('keeps the security-critical limiters fail-closed', async () => {
    const svc = await read('lib/services/rateLimitService.ts');
    for (const [name] of LIMITS) {
      const block = new RegExp(
        `export\\s+const\\s+${name}\\s*=\\s*createRateLimiter\\(\\{([\\s\\S]*?)\\}\\)`,
      ).exec(svc)![1];
      expect(block, `${name} must fail closed`).toMatch(/failClosed:\s*true/);
    }
  });
});

describe('BA-0039: localhost must not be allow-listed in production', () => {
  it('gates the localhost origins behind a non-production check', async () => {
    const csrf = await read('lib/security/csrf.ts');

    const fn = /function\s+getAllowedOrigins\(\)[\s\S]*?\n}/.exec(csrf);
    expect(fn, 'expected getAllowedOrigins() to exist').not.toBeNull();

    const body = fn![0];
    // Localhost may still be present for local development, but only behind an
    // explicit environment check.
    if (/localhost/.test(body)) {
      expect(body).toMatch(/isProductionDeployment|NODE_ENV|DEPLOYMENT_ENV/);
    }
  });
});
