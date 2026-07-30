import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkPasswordBreach,
  isPasswordBreachBlocked,
  clearBreachCache,
} from '@/lib/security/password-breach';

/**
 * The HIBP lookup sits inside signup and password reset (BA-0041), and
 * `isPasswordBreachBlocked` documents that it FAILS OPEN so that
 * api.pwnedpasswords.com cannot take account creation down with it.
 *
 * That promise was not implemented. The fetch carried no timeout and no abort
 * signal, so a connection that HUNG — as opposed to refusing — never settled and
 * the request sat in the password-setting path until the platform killed it.
 * Failing open only helps if the failure is bounded.
 */
describe('HIBP breach lookup is bounded', () => {
  beforeEach(() => clearBreachCache());
  afterEach(() => {
    vi.unstubAllGlobals();
    clearBreachCache();
  });

  it('passes an abort signal to fetch', async () => {
    const fetchSpy = vi.fn(async () => new Response('ABCDEF:1\n', { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);

    await checkPasswordBreach('some-password-value');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const init = fetchSpy.mock.calls[0][1] as RequestInit | undefined;
    expect(init?.signal, 'HIBP fetch must carry a timeout signal').toBeDefined();
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('fails open rather than hanging when the lookup never resolves', async () => {
    // A fetch that only ever settles by abort. Without a signal this test would
    // time out; with one it resolves to the safe default.
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('The operation was aborted.', 'AbortError')),
            );
          }),
      ),
    );

    const blocked = await isPasswordBreachBlocked('some-password-value');

    // Fail-open: an unavailable dependency must not refuse the password, and
    // must not stall the request either.
    expect(blocked).toBe(false);
  }, 10_000);

  it('still blocks a known-breached password when the lookup succeeds', async () => {
    // Non-vacuous: proves the timeout work did not disable enforcement.
    const suffixOfKnownHash = async (password: string) => {
      const { createHash } = await import('node:crypto');
      return createHash('sha1').update(password, 'utf8').digest('hex').toUpperCase().slice(5);
    };
    const suffix = await suffixOfKnownHash('password');

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(`${suffix}:12345\n`, { status: 200 })),
    );

    await expect(isPasswordBreachBlocked('password')).resolves.toBe(true);
  });

  it('fails open when the API returns an error status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 503 })),
    );

    await expect(isPasswordBreachBlocked('some-password-value')).resolves.toBe(false);
  });
});
