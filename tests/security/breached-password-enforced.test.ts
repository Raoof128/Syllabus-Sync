/**
 * Reproduction for BA-0041 — found while red-teaming on 2026-07-30.
 *
 * The project ships a complete HIBP k-anonymity implementation
 * (`lib/security/password-breach.ts`) and exposes it at
 * `/api/security/check-password-breach`. But the only caller is
 * `components/security/PasswordStrengthIndicator.tsx` — the browser. Nothing on
 * the server consulted it, so the check was a UX hint rather than a control:
 * posting straight to `/api/auth/signup` or `/api/auth/password/reset` with a
 * known-breached password bypassed it entirely.
 *
 * Supabase's own `password_hibp_enabled` would have covered this at the platform
 * level, but it is gated behind the Pro plan (the Management API returns
 * HTTP 402 on the Free plan), so enforcement has to live in the app.
 *
 * Deliberately FAIL-OPEN on a HIBP outage. api.pwnedpasswords.com is a
 * third-party dependency, and letting it take registration and password reset
 * down with it would trade a small credential-quality gain for a total
 * availability loss. A breached password that slips through during an outage is
 * still subject to the 12-character policy, rate limiting and MFA.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHash } from 'node:crypto';

/**
 * Mirrors the module's private hashPassword(): uppercase SHA-1 hex, split at 5.
 * Recomputed here rather than exporting the internal helper, so the test does
 * not widen the module's public surface just to be observable.
 */
function suffixOf(password: string): string {
  return createHash('sha1').update(password, 'utf8').digest('hex').toUpperCase().slice(5);
}

const BREACHED = 'Password123456';
const CLEAN = 'Tr0ubadour-Vestibule-9182';

/** HIBP returns "SUFFIX:COUNT" lines for a SHA-1 prefix. */
function hibpBody(suffix: string, count: number): string {
  return `0000000000000000000000000000000000A:12\n${suffix}:${count}\nFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF:3`;
}

describe('BA-0041: breached passwords must be rejected server-side', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('flags a breached password', async () => {
    const { checkPasswordBreach } = await import('@/lib/security/password-breach');
    const suffix = suffixOf(BREACHED);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(hibpBody(suffix, 24_230_577), { status: 200 })),
    );

    const result = await checkPasswordBreach(BREACHED, { useCache: false });
    expect(result.isBreached).toBe(true);
    expect(result.breachCount).toBeGreaterThan(0);
  });

  it('does not flag a password absent from the range response', async () => {
    const { checkPasswordBreach } = await import('@/lib/security/password-breach');

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(hibpBody('NOTOURSUFFIX00000000000000000000000', 5), { status: 200 })),
    );

    const result = await checkPasswordBreach(CLEAN, { useCache: false });
    expect(result.isBreached).toBe(false);
  });

  it('exposes a guard that rejects breached passwords and fails open on outage', async () => {
    const mod = await import('@/lib/security/password-breach');
    expect(
      typeof (mod as Record<string, unknown>).isPasswordBreachBlocked,
      'expected an isPasswordBreachBlocked() guard for server-side use',
    ).toBe('function');

    const { isPasswordBreachBlocked } = mod as typeof mod & {
      isPasswordBreachBlocked: (p: string) => Promise<boolean>;
    };

    const suffix = suffixOf(BREACHED);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(hibpBody(suffix, 24_230_577), { status: 200 })),
    );
    await expect(isPasswordBreachBlocked(BREACHED)).resolves.toBe(true);

    // HIBP unreachable -> must NOT block, so an outage cannot stop signups.
    //
    // Uses a DIFFERENT password from the call above on purpose: checkPasswordBreach
    // memoises by password hash, so re-checking BREACHED here would be served from
    // cache and return "blocked" without ever touching the stubbed fetch — the
    // assertion would pass or fail for reasons unrelated to outage behaviour.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );
    await expect(isPasswordBreachBlocked('Uncached-Outage-Probe-4471')).resolves.toBe(false);
  });
});

describe('BA-0041: the password-setting routes consult the guard', () => {
  const ROUTES = [
    'app/api/auth/signup/route.ts',
    'app/api/auth/password/reset/route.ts',
  ] as const;

  it.each(ROUTES)('%s enforces the breach guard', async (rel) => {
    const { readFile } = await import('node:fs/promises');
    const path = await import('node:path');
    const source = await readFile(path.resolve(process.cwd(), rel), 'utf8');
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');

    expect(code).toMatch(/isPasswordBreachBlocked/);
  });
});
