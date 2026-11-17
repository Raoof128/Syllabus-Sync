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

    // SECURITY (P0): the credential must belong to the user this challenge was
    // issued for.
    //
    // Identity and key material arrive from two different places and nothing
    // used to reconcile them. `userId` comes from the challenge row, which
    // /api/webauthn/authenticate/options creates for whatever email the CALLER
    // supplied. `dbCredential` comes from getCredentialById(), a lookup on
    // `credential_id` alone with no user_id filter. So an attacker could take a
    // challenge minted for a victim, sign it with their OWN authenticator, and
    // have the signature checked against their OWN public key — then have the
    // block below mint a session for the VICTIM. Unauthenticated, no victim
    // interaction, and `/api/webauthn/authenticate/` is on the middleware's
    // public allowlist so the edge never saw it.
    //
    // @simplewebauthn cannot catch this: verifyAuthenticationResponse only
    // asserts `id === rawId`; it never compares the response's credential id
    // against the credential record it is handed. And `credential_id` is UNIQUE,
    // so the lookup is deterministic — the attack was not probabilistic.
    //
    // This must stay AHEAD of verifyAuthenticationResponse and of the session
    // mint, so a mismatched credential costs no crypto and no privileged call.
    // The legacy branch above is already safe by construction: it reads
    // `biometric_credential_id` off the challenge user's own record and requires
    // it to equal the presented id, so identity and key share one source.
    //
    // The sibling /api/webauthn/register/verify has always had the equivalent
    // check (`storedChallenge.userId !== user.id`); this route was missing it.
    if (dbCredential && dbCredential.userId !== userId) {
      logger.warn('WebAuthn credential does not belong to the challenge user', {
        challengeUserId: userId,
        credentialId,
      });
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
