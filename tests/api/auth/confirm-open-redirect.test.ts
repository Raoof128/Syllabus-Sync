import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const verifyOtp = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: async () => ({ auth: { verifyOtp } }),
}));

import { GET } from '@/app/auth/confirm/route';

/**
 * `/auth/confirm` validated its `next` parameter with `next.startsWith('/')`,
 * which accepts a PROTOCOL-RELATIVE value. `new URL('//evil.example', <route>)`
 * resolves to `https://evil.example/`.
 *
 * The redirect happens AFTER verifyOtp establishes a session, so this was an
 * open redirect on the product's own domain combined with session fixation: send
 * the victim a genuine syllabus-sync.app link carrying the ATTACKER's
 * token_hash, land them on an attacker-controlled page, and leave their browser
 * signed into the attacker's account.
 *
 * The sibling /auth/callback rejected the same input via isValidRedirect(); this
 * route never got that treatment.
 */
describe('/auth/confirm — next parameter cannot leave the origin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyOtp.mockResolvedValue({ error: null });
  });

  const confirm = (next: string) =>
    GET(
      new NextRequest(
        `https://www.syllabus-sync.app/auth/confirm?token_hash=abc&type=recovery&next=${encodeURIComponent(next)}`,
      ),
    );

  it.each([
    ['//evil.example', 'protocol-relative'],
    ['https://evil.example/', 'absolute off-origin'],
    ['//evil.example/reset-password', 'protocol-relative with a plausible path'],
    ['https://www.syllabus-sync.app.evil.example/', 'suffix-confusion domain'],
  ])('refuses to redirect off-origin for %s (%s)', async (next) => {
    const res = await confirm(next);
    const location = new URL(res.headers.get('location')!);

    expect(location.origin).toBe('https://www.syllabus-sync.app');
    expect(res.headers.get('location')).not.toContain('evil.example');
  });

  it('still lands the recovery flow on /reset-password', async () => {
    // Non-vacuous control. This is why isValidRedirect() is NOT reused here:
    // '/reset-password' is absent from SAFE_REDIRECT_PATHS, so that helper would
    // reject the one destination this route exists to serve.
    const res = await confirm('/reset-password');
    const location = new URL(res.headers.get('location')!);

    expect(location.origin).toBe('https://www.syllabus-sync.app');
    expect(location.pathname).toBe('/reset-password');
    expect(location.searchParams.get('recovery')).toBe('1');
  });

  it('preserves a same-origin path with a query string', async () => {
    const res = await confirm('/calendar?view=week');
    const location = new URL(res.headers.get('location')!);

    expect(location.pathname).toBe('/calendar');
    expect(location.searchParams.get('view')).toBe('week');
  });

  it('does not redirect anywhere when the token fails verification', async () => {
    verifyOtp.mockResolvedValue({ error: { message: 'expired' } });

    const res = await confirm('//evil.example');
    const location = new URL(res.headers.get('location')!);

    expect(location.origin).toBe('https://www.syllabus-sync.app');
    expect(location.pathname).toBe('/reset-password');
    expect(location.searchParams.get('error')).toBe('verification_failed');
  });
});
