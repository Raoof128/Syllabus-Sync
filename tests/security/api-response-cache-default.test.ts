/**
 * Regression guard for BA-0076.
 *
 * Route handlers set no Cache-Control of their own, so signed-in JSON (for
 * example GET /api/auth/user, which returns the full user object) carried no
 * caching directive at all. The shared helpers now default to
 * `private, no-store`, and only a route that explicitly opts in keeps a
 * cacheable header.
 */
import { describe, it, expect } from 'vitest';
import { jsonSuccess, jsonError } from '@/app/api/_lib/response';

describe('API responses are private unless a route opts into caching', () => {
  it('jsonSuccess defaults to private, no-store', () => {
    expect(jsonSuccess({ user: { id: 'u1' } }).headers.get('cache-control')).toBe(
      'private, no-store',
    );
  });

  it('jsonError defaults to private, no-store', () => {
    expect(jsonError('nope', 401).headers.get('cache-control')).toBe('private, no-store');
  });

  it('an explicit Cache-Control from the route wins', () => {
    const res = jsonSuccess({ ok: true }, 200, undefined, {
      headers: { 'Cache-Control': 'public, s-maxage=30' },
    });
    expect(res.headers.get('cache-control')).toBe('public, s-maxage=30');
  });

  it('other headers passed by the route survive', () => {
    const res = jsonSuccess({ ok: true }, 200, undefined, { headers: { 'X-Test': '1' } });
    expect(res.headers.get('x-test')).toBe('1');
    expect(res.headers.get('cache-control')).toBe('private, no-store');
  });
});
