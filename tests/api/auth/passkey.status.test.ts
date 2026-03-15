import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/passkey/status/route';

const rpcMock = vi.fn();
const fromMock = vi.fn();
const listFactorsMock = vi.fn();
const createAdminClientMock = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => createAdminClientMock(),
}));

vi.mock('@/lib/security/ip', () => ({
  getClientIP: () => '127.0.0.1',
}));

vi.mock('@/lib/services/rateLimitService', () => ({
  passkeyStatusLimiter: vi.fn(async () => ({ allowed: true, remaining: 10, resetIn: 0 })),
}));

function makeRequest(email: string) {
  return new NextRequest('http://localhost/api/auth/passkey/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'content-length': '100' },
    body: JSON.stringify({ email }),
  });
}

describe('passkey status route', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    createAdminClientMock.mockReturnValue({
      rpc: rpcMock,
      from: fromMock,
      auth: {
        admin: {
          mfa: {
            listFactors: listFactorsMock,
          },
        },
      },
    });

    listFactorsMock.mockResolvedValue({ data: { factors: [] } });
  });

  it('returns available for legacy metadata-backed passkeys', async () => {
    rpcMock.mockResolvedValue({
      data: [{ user_id: 'user-1', user_meta: { biometric_credential_id: 'legacy-cred' } }],
      error: null,
    });

    fromMock.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
    });

    const response = await POST(makeRequest('test@mq.edu.au'));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.available).toBe(true);
  });

  it('returns available for DB-backed WebAuthn credentials', async () => {
    rpcMock.mockResolvedValue({
      data: [{ user_id: 'user-1', user_meta: {} }],
      error: null,
    });

    const chain = {
      select: vi.fn(),
      eq: vi.fn(),
    };
    chain.select.mockReturnValue(chain);
    chain.eq.mockResolvedValue({ count: 1, error: null });
    fromMock.mockReturnValue(chain);

    const response = await POST(makeRequest('test@mq.edu.au'));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.available).toBe(true);
    expect(fromMock).toHaveBeenCalledWith('webauthn_credentials');
  });

  it('returns unavailable when user has no legacy or DB passkeys', async () => {
    rpcMock.mockResolvedValue({
      data: [{ user_id: 'user-1', user_meta: {} }],
      error: null,
    });

    const chain = {
      select: vi.fn(),
      eq: vi.fn(),
    };
    chain.select.mockReturnValue(chain);
    chain.eq.mockResolvedValue({ count: 0, error: null });
    fromMock.mockReturnValue(chain);

    const response = await POST(makeRequest('test@mq.edu.au'));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.available).toBe(false);
  });
});
