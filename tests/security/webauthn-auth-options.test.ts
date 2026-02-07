/**
 * Security Audit Tests — WebAuthn Authenticate Options
 *
 * Tests POST /api/webauthn/authenticate/options after security audit fix:
 * - Validates RPC-based user lookup (replaces listUsers() DoS vector)
 * - Rate limiting enforcement
 * - User enumeration prevention
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/webauthn/authenticate/options/route';

// Mocks
const mockAdminClient = {
  rpc: vi.fn(),
};

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockAdminClient,
}));

const mockGetCredentialsForUser = vi.fn();
const mockStoreChallenge = vi.fn();
const mockWebauthnAuthLimiter = vi.fn();

vi.mock('@/lib/security/webauthn', () => ({
  getCredentialsForUser: (...args: unknown[]) => mockGetCredentialsForUser(...args),
  storeChallenge: (...args: unknown[]) => mockStoreChallenge(...args),
  getRelyingPartyId: (host: string) => host.split(':')[0],
  webauthnAuthLimiter: (...args: unknown[]) => mockWebauthnAuthLimiter(...args),
}));

vi.mock('@/lib/security/ip', () => ({
  getClientIP: () => '127.0.0.1',
}));

vi.mock('@simplewebauthn/server', () => ({
  generateAuthenticationOptions: vi.fn().mockResolvedValue({
    challenge: 'test-challenge-abc',
    allowCredentials: [],
    rpID: 'localhost',
    userVerification: 'required',
  }),
}));

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/webauthn/authenticate/options', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'content-length': '100' },
    body: JSON.stringify(body),
  });
}

describe('WebAuthn Authenticate Options (Security Audit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWebauthnAuthLimiter.mockResolvedValue({ allowed: true, resetIn: 0 });
    mockStoreChallenge.mockResolvedValue(undefined);
  });

  it('returns 429 when rate limited', async () => {
    mockWebauthnAuthLimiter.mockResolvedValue({ allowed: false, resetIn: 120 });

    const response = await POST(makeRequest({ email: 'test@example.com' }));
    expect(response.status).toBe(429);
  });

  it('uses RPC lookup_user_by_email instead of listUsers', async () => {
    mockAdminClient.rpc.mockResolvedValue({
      data: [{ user_id: 'user-1', user_email: 'test@mq.edu.au', user_meta: {} }],
      error: null,
    });
    mockGetCredentialsForUser.mockResolvedValue([
      { credentialId: 'cred-1', transports: ['internal'] },
    ]);

    const response = await POST(makeRequest({ email: 'test@mq.edu.au' }));

    // Verify RPC was called with correct email
    expect(mockAdminClient.rpc).toHaveBeenCalledWith('lookup_user_by_email', {
      lookup_email: 'test@mq.edu.au',
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.options).toBeDefined();
  });

  it('returns 404 without revealing user existence for unknown email', async () => {
    mockAdminClient.rpc.mockResolvedValue({ data: [], error: null });

    const response = await POST(makeRequest({ email: 'nobody@example.com' }));

    expect(response.status).toBe(404);
    const json = await response.json();
    // Error message should be generic (no user enumeration)
    expect(json.error.message).toBe('Passkey not available for this account');
  });

  it('returns 404 when user exists but has no credentials', async () => {
    mockAdminClient.rpc.mockResolvedValue({
      data: [{ user_id: 'user-1', user_email: 'test@mq.edu.au', user_meta: {} }],
      error: null,
    });
    mockGetCredentialsForUser.mockResolvedValue([]);

    const response = await POST(makeRequest({ email: 'test@mq.edu.au' }));

    expect(response.status).toBe(404);
    const json = await response.json();
    // Same message as "user not found" — no enumeration
    expect(json.error.message).toBe('Passkey not available for this account');
  });

  it('includes legacy credentials from user_metadata', async () => {
    mockAdminClient.rpc.mockResolvedValue({
      data: [
        {
          user_id: 'user-1',
          user_email: 'test@mq.edu.au',
          user_meta: {
            biometric_credential_id: 'legacy-cred-123',
            biometric_transports: ['internal'],
          },
        },
      ],
      error: null,
    });
    mockGetCredentialsForUser.mockResolvedValue([]);

    const response = await POST(makeRequest({ email: 'test@mq.edu.au' }));

    expect(response.status).toBe(200);
    expect(mockStoreChallenge).toHaveBeenCalledWith('test-challenge-abc', 'authentication', 'user-1');
  });

  it('handles RPC errors gracefully', async () => {
    mockAdminClient.rpc.mockResolvedValue({
      data: null,
      error: { message: 'database error' },
    });

    const response = await POST(makeRequest({ email: 'test@mq.edu.au' }));

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error.message).toBe('Passkey login unavailable');
  });

  it('rejects invalid email format', async () => {
    const response = await POST(makeRequest({ email: 'not-an-email' }));
    expect(response.status).toBe(400);
  });
});
