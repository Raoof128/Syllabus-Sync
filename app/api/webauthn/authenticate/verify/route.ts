import { NextRequest } from 'next/server';
import {
  verifyAuthenticationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
} from '@simplewebauthn/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@/lib/supabase/server';
import {
  jsonSuccess,
  jsonError,
  parseJsonBody,
  BODY_SIZE_LIMITS,
  ERROR_CODES,
} from '@/app/api/_lib/response';
import {
  consumeChallenge,
  getCredentialById,
  updateCredentialCounter,
  getRelyingPartyId,
  getExpectedOrigin,
  webauthnAuthLimiter,
} from '@/lib/security/webauthn';
import { base64UrlToBuffer } from '@/app/api/auth/passkey/_lib';
import { getClientIP } from '@/lib/security/ip';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const verifySchema = z.object({
  credential: z.record(z.string(), z.unknown()),
});

/**
 * POST /api/webauthn/authenticate/verify
 * Verify an authentication response and establish a session.
 */
export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const { allowed, resetIn } = await webauthnAuthLimiter(clientIP);

  if (!allowed) {
    return jsonError(
      `Too many attempts. Try again in ${Math.ceil(resetIn / 60)} minutes.`,
      429,
      ERROR_CODES.RATE_LIMITED,
    );
  }

  try {
    const adminClient = createAdminClient();
    if (!adminClient) {
      return jsonError('Passkey login is not configured', 503, ERROR_CODES.EXTERNAL_SERVICE_ERROR);
    }

    const { data: body, error: parseError } = await parseJsonBody(request, BODY_SIZE_LIMITS.AUTH);
    if (parseError) return parseError;

    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid authentication payload', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const authResponse = parsed.data.credential as unknown as AuthenticationResponseJSON;

    // Decode clientDataJSON to extract challenge
    const clientDataStr = Buffer.from(authResponse.response.clientDataJSON, 'base64url').toString(
      'utf-8',
    );
    const clientData = JSON.parse(clientDataStr) as { challenge: string };
    const challengeFromClient = clientData.challenge;

    // Consume challenge from DB
    const storedChallenge = await consumeChallenge(challengeFromClient, 'authentication');

    if (!storedChallenge || !storedChallenge.userId) {
      return jsonError('Challenge expired or invalid', 400, ERROR_CODES.BAD_REQUEST);
    }

    const userId = storedChallenge.userId;

    // Look up credential from DB
    const credentialId = authResponse.id;
    const dbCredential = await getCredentialById(credentialId);

    // BA-0056 (P0): bind the presented credential to the challenge's user.
    //
    // Two identities meet here and they were never compared. `userId` comes
    // from the challenge, which /api/webauthn/authenticate/options creates from
    // a client-supplied email — so it is the account being logged INTO.
    // `dbCredential` is resolved by getCredentialById(), which queries
    // webauthn_credentials by credential_id alone through the service-role
    // client, bypassing RLS and every user scope. It therefore returns ANY
    // user's credential.
    //
    // The public key handed to verifyAuthenticationResponse below came from
    // that row. Without this check an attacker requested a challenge for a
    // victim's email, ignored the returned allowCredentials, signed the
    // challenge with their OWN registered authenticator on the real origin,
    // and the route verified the signature against the attacker's own public
    // key — then minted a Supabase session for the victim at line ~176. A
    // genuine signature over a genuine challenge, attributed to the wrong
    // account: full account takeover from a self-serve account, no victim
    // interaction and no origin spoofing.
    //
    // mapDbCredential() already populates userId; the route simply never read
    // it. Rejecting rather than falling through to the legacy branch is
    // deliberate — treating a mismatch as "not found" would let the same
    // assertion be retried against user_metadata.
    if (dbCredential && dbCredential.userId !== userId) {
      logger.warn('WebAuthn credential/challenge user mismatch rejected', {
        challengeUserId: userId,
        credentialUserId: dbCredential.userId,
      });
      return jsonError('Passkey not recognized', 401, ERROR_CODES.UNAUTHORIZED);
    }

    // Fallback: check legacy user_metadata
    let isLegacyCredential = false;
    let legacyPublicKey: string | undefined;
    let legacyCounter = 0;
    let legacyTransports: AuthenticatorTransportFuture[] | undefined;

    if (!dbCredential) {
      const { data: userRecord } = await adminClient.auth.admin.getUserById(userId);

      if (userRecord?.user) {
        const metadata = (userRecord.user.user_metadata || {}) as Record<string, unknown>;
        const metaCredId = metadata.biometric_credential_id as string | undefined;

        if (metaCredId === credentialId) {
          isLegacyCredential = true;
          legacyPublicKey = metadata.biometric_public_key as string;
          legacyCounter = (metadata.biometric_counter as number) ?? 0;
          legacyTransports = metadata.biometric_transports as
            | AuthenticatorTransportFuture[]
            | undefined;
        }
      }
    }

    if (!dbCredential && !isLegacyCredential) {
      return jsonError('Passkey not recognized', 401, ERROR_CODES.UNAUTHORIZED);
    }

    const host = request.headers.get('host') ?? new URL(request.url).hostname;
    const rpId = getRelyingPartyId(host);
    const origin = request.headers.get('origin') ?? new URL(request.url).origin;
    const expectedOrigin = getExpectedOrigin(origin);

    const credentialPublicKey = dbCredential
      ? base64UrlToBuffer(dbCredential.publicKey)
      : base64UrlToBuffer(legacyPublicKey!);
    const credentialCounter = dbCredential ? dbCredential.counter : legacyCounter;
    const credentialTransports = dbCredential
      ? (dbCredential.transports as AuthenticatorTransportFuture[])
      : legacyTransports;

    const verification = await verifyAuthenticationResponse({
      response: authResponse,
      expectedChallenge: storedChallenge.challenge,
      expectedOrigin: expectedOrigin,
      expectedRPID: rpId,
      credential: {
        id: credentialId,
        publicKey: credentialPublicKey,
        counter: credentialCounter,
        transports: credentialTransports,
      },
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.authenticationInfo) {
      return jsonError('Passkey verification failed', 401, ERROR_CODES.UNAUTHORIZED);
    }

    const newCounter = verification.authenticationInfo.newCounter;

    // Update counter
    if (dbCredential) {
      await updateCredentialCounter(credentialId, newCounter);
    } else if (isLegacyCredential) {
      // Update legacy counter in user_metadata
      await adminClient.auth.admin.updateUserById(userId, {
        user_metadata: {
          biometric_counter: newCounter,
          biometric_updated_at: new Date().toISOString(),
        },
      });
    }

    // Establish session via magic link (same pattern as existing passkey verify)
    const { data: userRecord } = await adminClient.auth.admin.getUserById(userId);

    if (!userRecord?.user?.email) {
      return jsonError('Failed to complete sign-in', 500, ERROR_CODES.INTERNAL_ERROR);
    }

    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: userRecord.user.email,
    });

    if (linkError || !linkData?.properties?.email_otp) {
      return jsonError('Failed to complete sign-in', 500, ERROR_CODES.INTERNAL_ERROR);
    }

    const serverClient = await createServerClient();
    const { data: sessionData, error: verifyError } = await serverClient.auth.verifyOtp({
      email: userRecord.user.email,
      token: linkData.properties.email_otp,
      type: 'magiclink',
    });

    if (verifyError || !sessionData.session) {
      return jsonError('Failed to complete sign-in', 500, ERROR_CODES.INTERNAL_ERROR);
    }

    logger.info('WebAuthn authentication success', {
      userId,
      credentialId,
      isLegacy: isLegacyCredential,
    });

    return jsonSuccess({ signedIn: true });
  } catch (error) {
    logger.error('WebAuthn auth verify error:', error);
    return jsonError('Failed to verify passkey', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
