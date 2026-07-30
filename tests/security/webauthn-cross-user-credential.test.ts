import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * P0 regression cover — cross-user WebAuthn credential confusion.
 *
 * `/api/webauthn/authenticate/verify` took the IDENTITY from one source and the
 * VERIFYING PUBLIC KEY from another, and never reconciled them:
 *
 *   userId       = storedChallenge.userId          // whoever the caller named
 *                                                  // at authenticate/options
 *   dbCredential = getCredentialById(response.id)  // GLOBAL lookup on
 *                                                  // credential_id, no user filter
 *
 * So an attacker could ask for a challenge bound to a victim's account, sign it
 * with their OWN authenticator, and have the server verify that signature
 * against their OWN public key — then mint a session for the VICTIM via
 * admin.generateLink + verifyOtp. Unauthenticated, no victim interaction.
 * `/api/webauthn/authenticate/` is on the middleware public allowlist, so the
 * edge never saw it.
 *
 * The WebAuthn library cannot catch this: verifyAuthenticationResponse only
 * checks `id === rawId`; it never compares the response's credential id against
 * the credential record it was handed. And `credential_id` is UNIQUE, so the
 * lookup is deterministic — the attack is not probabilistic.
 *
 * The sibling route `/api/webauthn/register/verify` has always had exactly the
 * missing assertion (`storedChallenge.userId !== user.id` -> 400). This route
 * did not.
 */

const VICTIM = 'victim-user-id';
const ATTACKER = 'attacker-user-id';
const ATTACKER_CREDENTIAL_ID = 'attacker-credential-id';

const consumeChallenge = vi.fn();
const getCredentialById = vi.fn();
const updateCredentialCounter = vi.fn();
const verifyAuthenticationResponse = vi.fn();
const generateLink = vi.fn();
const getUserById = vi.fn();
const verifyOtp = vi.fn();

vi.mock('@/lib/security/webauthn', () => ({
  consumeChallenge: (...a: unknown[]) => consumeChallenge(...a),
  getCredentialById: (...a: unknown[]) => getCredentialById(...a),
  updateCredentialCounter: (...a: unknown[]) => updateCredentialCounter(...a),
  // Anchors are pinned so the test exercises authorisation, not BA-0003.
  getRelyingPartyId: () => 'syllabus-sync.app',
  getExpectedOrigin: () => 'https://www.syllabus-sync.app',
  webauthnAuthLimiter: vi.fn(async () => ({ allowed: true, remaining: 9, resetIn: 0 })),
}));

vi.mock('@simplewebauthn/server', () => ({
  verifyAuthenticationResponse: (...a: unknown[]) => verifyAuthenticationResponse(...a),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    auth: { admin: { getUserById, generateLink, updateUserById: vi.fn() } },
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: async () => ({ auth: { verifyOtp } }),
}));

import { POST } from '@/app/api/webauthn/authenticate/verify/route';

/** An assertion whose clientDataJSON carries the victim-bound challenge. */
function assertionRequest(credentialId: string) {
  const clientDataJSON = Buffer.from(
    JSON.stringify({ challenge: 'victim-bound-challenge' }),
  ).toString('base64url');

  return new NextRequest('https://www.syllabus-sync.app/api/webauthn/authenticate/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      credential: {
        id: credentialId,
        rawId: credentialId,
        type: 'public-key',
        response: { clientDataJSON, authenticatorData: 'x', signature: 'y' },
      },
    }),
  });
}

describe('/api/webauthn/authenticate/verify — credential must belong to the challenge user', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // The challenge was minted for the VICTIM (attacker just named their email).
    consumeChallenge.mockResolvedValue({
      userId: VICTIM,
      challenge: 'victim-bound-challenge',
    });

    // The signature is genuinely valid — under the ATTACKER's key.
    verifyAuthenticationResponse.mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 1 },
    });

    getUserById.mockResolvedValue({ data: { user: { id: VICTIM, email: 'victim@example.com' } } });
    generateLink.mockResolvedValue({
      data: { properties: { email_otp: 'otp-for-victim' } },
      error: null,
    });
    verifyOtp.mockResolvedValue({ data: { session: { access_token: 'victim-session' } }, error: null });
  });

  it('refuses an assertion signed by a credential belonging to a different user', async () => {
    // The attacker's own registered credential — a real row, just not the victim's.
    getCredentialById.mockResolvedValue({
      id: 'row-1',
      userId: ATTACKER,
      credentialId: ATTACKER_CREDENTIAL_ID,
      publicKey: Buffer.from('attacker-public-key').toString('base64url'),
      counter: 0,
      transports: [],
    });

    const res = await POST(assertionRequest(ATTACKER_CREDENTIAL_ID));

    expect(res.status).toBe(401);

    // The load-bearing assertions: no session may be minted for the victim.
    expect(generateLink).not.toHaveBeenCalled();
    expect(verifyOtp).not.toHaveBeenCalled();
    // And the attacker's counter must not be advanced by a rejected attempt.
    expect(updateCredentialCounter).not.toHaveBeenCalled();
  });

  it('still signs in when the credential does belong to the challenge user', async () => {
    // Non-vacuous control: the fix must not break legitimate passkey login.
    getCredentialById.mockResolvedValue({
      id: 'row-2',
      userId: VICTIM,
      credentialId: 'victim-credential-id',
      publicKey: Buffer.from('victim-public-key').toString('base64url'),
      counter: 0,
      transports: [],
    });

    const res = await POST(assertionRequest('victim-credential-id'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.signedIn).toBe(true);
    expect(generateLink).toHaveBeenCalledWith({
      type: 'magiclink',
      email: 'victim@example.com',
    });
  });

  it('rejects before spending any privileged call, even if verification would pass', async () => {
    // Ordering matters: the ownership check must precede the crypto and the
    // session mint, so a mismatched credential costs nothing.
    getCredentialById.mockResolvedValue({
      id: 'row-3',
      userId: ATTACKER,
      credentialId: ATTACKER_CREDENTIAL_ID,
      publicKey: Buffer.from('attacker-public-key').toString('base64url'),
      counter: 0,
      transports: [],
    });

    await POST(assertionRequest(ATTACKER_CREDENTIAL_ID));

    expect(verifyAuthenticationResponse).not.toHaveBeenCalled();
  });
});
