/**
 * Reproduction for BA-0007.
 *
 * `POST /api/audit` let any authenticated user insert an audit_logs row —
 * `log_audit()` correctly pins `user_id = auth.uid()` (no cross-user
 * forgery), but unlike every other mutating endpoint in this codebase
 * (signin, signup, MFA, passkey, password reset, /api/sync, ...), this
 * route had no rate limiter at all. That lets a user flood their own audit
 * log with junk rows, burying genuine security-relevant entries and
 * consuming storage.
 *
 * Fix: route the handler through `requireAuthWithRateLimit` (already used
 * by other mutation routes, e.g. app/api/units/route.ts) instead of the
 * unlimited `requireAuth`, so `POST /api/audit` gets the same
 * `mutationLimiter` gating as every other write path.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const createServerClientMock = vi.fn();
const mutationLimiterMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => createServerClientMock(),
}));

vi.mock('@/lib/services/rateLimitService', () => ({
  mutationLimiter: (...args: unknown[]) => mutationLimiterMock(...args),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from '@/app/api/audit/route';

function makeSupabaseClient(
  user: { id: string } | null,
  rpcResult: { data: unknown; error: unknown },
) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    rpc: vi.fn().mockResolvedValue(rpcResult),
  };
}

function postAuditRequest(body: Record<string, unknown>) {
  // origin === host so validateOrigin's same-host CSRF check passes without
  // needing a real NextRequest (this is a plain Request, which has no
  // `.nextUrl`).
  return new Request('http://localhost/api/audit', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost',
      host: 'localhost',
    },
    body: JSON.stringify(body),
  });
}

describe('BA-0007: POST /api/audit is rate limited', () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
    mutationLimiterMock.mockReset();
  });

  it('rejects an unauthenticated request before rate limiting', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseClient(null, { data: null, error: null }));

    const response = await POST(postAuditRequest({ action: 'EXPORT' }) as never);

    expect(response.status).toBe(401);
    expect(mutationLimiterMock).not.toHaveBeenCalled();
  });

  it('applies mutationLimiter, keyed by user, for an authenticated request', async () => {
    createServerClientMock.mockReturnValue(
      makeSupabaseClient({ id: 'user-1' }, { data: 'log-id-1', error: null }),
    );
    mutationLimiterMock.mockResolvedValue({
      allowed: true,
      remaining: 59,
      resetIn: 60,
      limit: 60,
    });

    const response = await POST(postAuditRequest({ action: 'EXPORT' }) as never);

    expect(response.status).toBe(200);
    expect(mutationLimiterMock).toHaveBeenCalledTimes(1);
    expect(mutationLimiterMock.mock.calls[0][0]).toContain('user-1');
  });

  it('returns 429 and skips the audit insert when the limiter denies the request', async () => {
    const client = makeSupabaseClient({ id: 'user-1' }, { data: 'log-id-1', error: null });
    createServerClientMock.mockReturnValue(client);
    mutationLimiterMock.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetIn: 30,
      limit: 60,
    });

    const response = await POST(postAuditRequest({ action: 'EXPORT' }) as never);

    expect(response.status).toBe(429);
    expect(client.rpc).not.toHaveBeenCalled();
  });
});
