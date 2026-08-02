/**
 * Reproduction and regression guard for BA-0056 (P0) — WebAuthn authentication
 * bypass giving full account takeover.
 *
 * Two identities meet in POST /api/webauthn/authenticate/verify and were never
 * compared:
 *
 *   userId       <- consumeChallenge(...).userId
 *                   the account being logged INTO, derived from the email the
 *                   client supplied to /authenticate/options
 *   dbCredential <- getCredentialById(credentialId)
 *                   resolved by credential_id ALONE through the service-role
 *                   client (lib/security/webauthn.ts:203-217), which bypasses
 *                   RLS and every user scope, so it returns ANY user's row
 *
 * The public key passed to verifyAuthenticationResponse came from
 * `dbCredential`, but the session was minted for `userId`. So an attacker could
 * request a challenge for a victim's email, ignore the returned
 * allowCredentials, sign that challenge with their OWN registered authenticator
 * on the real origin, and receive a valid Supabase session for the victim. A
 * genuine signature over a genuine challenge, attributed to the wrong account —
 * no origin spoofing, no victim interaction, and both endpoints are in
 * isPublicApiPath so no session is needed to reach them.
 *
 * mapDbCredential() already populated `userId`; the route simply never read it.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const VICTIM = '11111111-1111-4111-8111-111111111111';
const ATTACKER = '22222222-2222-4222-8222-222222222222';

const mockConsumeChallenge = vi.fn();
const mockGetCredentialById = vi.fn();
const mockUpdateCredentialCounter = vi.fn();
const mockVerifyAuthenticationResponse = vi.fn();
const mockGenerateLink = vi.fn();
const mockGetUserById = vi.fn();
const mockVerifyOtp = vi.fn();

vi.mock('@/lib/security/webauthn', () => ({
  consumeChallenge: (...a: unknown[]) => mockConsumeChallenge(...a),
  getCredentialById: (...a: unknown[]) => mockGetCredentialById(...a),
  updateCredentialCounter: (...a: unknown[]) => mockUpdateCredentialCounter(...a),
  getRelyingPartyId: (host: string) => host.split(':')[0],
  getExpectedOrigin: (origin: string) => origin,
  webauthnAuthLimiter: vi.fn(async () => ({ allowed: true, remaining: 9, resetIn: 0 })),
}));

vi.mock('@simplewebauthn/server', () => ({
  // The attacker really did sign the challenge — with their own key. The
  // library is correct to return verified:true; the route is what must refuse.
  verifyAuthenticationResponse: (...a: unknown[]) => mockVerifyAuthenticationResponse(...a),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        getUserById: (...a: unknown[]) => mockGetUserById(...a),
        generateLink: (...a: unknown[]) => mockGenerateLink(...a),
      },
    },
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: async () => ({
    auth: { verifyOtp: (...a: unknown[]) => mockVerifyOtp(...a) },
  }),
}));

vi.mock('@/lib/security/ip', () => ({ getClientIP: () => '127.0.0.1' }));

const { POST } = await import('@/app/api/webauthn/authenticate/verify/route');

/** A minimal assertion whose clientDataJSON decodes to the challenge. */
function assertionFor(challenge: string, credentialId: string) {
  const clientData = Buffer.from(
    JSON.stringify({ type: 'webauthn.get', challenge, origin: 'http://localhost' }),
  ).toString('base64url');
  return {
    id: credentialId,
    rawId: credentialId,
    type: 'public-key',
    clientExtensionResults: {},
    response: {
      clientDataJSON: clientData,
      authenticatorData: 'AA',
      signature: 'AA',
      userHandle: null,
    },
  };
}

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/webauthn/authenticate/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', host: 'localhost', origin: 'http://localhost' },
    body: JSON.stringify(body),
  });
}

describe('BA-0056: a passkey may only authenticate the user it belongs to', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyAuthenticationResponse.mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 1 },
    });
    mockGetUserById.mockResolvedValue({ data: { user: { id: VICTIM, email: 'victim@t.local' } } });
    mockGenerateLink.mockResolvedValue({
      data: { properties: { email_otp: 'otp' } },
      error: null,
    });
    mockVerifyOtp.mockResolvedValue({
      data: { session: { access_token: 'a', refresh_token: 'r' } },
      error: null,
    });
  });

  it("refuses an assertion from another user's credential", async () => {
    // Challenge was issued for the VICTIM (attacker supplied victim's email).
    mockConsumeChallenge.mockResolvedValue({ userId: VICTIM, challenge: 'chal-1' });
    // The presented credential belongs to the ATTACKER.
    mockGetCredentialById.mockResolvedValue({
      id: 'row-1',
      userId: ATTACKER,
      credentialId: 'attacker-cred',
      publicKey: 'QUFB',
      counter: 0,
      transports: [],
    });

    const res = await POST(
      makeRequest({ credential: assertionFor('chal-1', 'attacker-cred') }),
    );

    expect(res.status).toBe(401);
    // The decisive assertion: no session may be minted for the victim.
    expect(mockVerifyOtp).not.toHaveBeenCalled();
    expect(mockGenerateLink).not.toHaveBeenCalled();
  });

  it('still allows a user to authenticate with their own credential', async () => {
    // Guards over-correction: the check must not break legitimate passkey login.
    mockConsumeChallenge.mockResolvedValue({ userId: VICTIM, challenge: 'chal-2' });
    mockGetCredentialById.mockResolvedValue({
      id: 'row-2',
      userId: VICTIM,
      credentialId: 'victim-cred',
      publicKey: 'QUFB',
      counter: 0,
      transports: [],
    });

    const res = await POST(makeRequest({ credential: assertionFor('chal-2', 'victim-cred') }));

    expect(res.status).toBe(200);
    expect(mockVerifyOtp).toHaveBeenCalled();
  });
});
