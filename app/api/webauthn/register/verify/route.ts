import { NextRequest } from 'next/server';
import { verifyRegistrationResponse, type RegistrationResponseJSON } from '@simplewebauthn/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  jsonSuccess,
  jsonError,
  jsonUnauthorized,
  parseJsonBody,
  BODY_SIZE_LIMITS,
  ERROR_CODES,
} from '@/app/api/_lib/response';
import {
  consumeChallenge,
  storeCredential,
  getRelyingPartyId,
  getExpectedOrigin,
  webauthnRegisterLimiter,
} from '@/lib/security/webauthn';
import { bufferToBase64Url } from '@/app/api/auth/passkey/_lib';
import { getClientIP } from '@/lib/security/ip';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const verifySchema = z.object({
  credential: z.record(z.string(), z.unknown()),
  deviceName: z.string().max(100).optional().default('Passkey'),
});

/**
 * POST /api/webauthn/register/verify
 * Verify a registration response and store the credential.
 */
export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const { allowed, resetIn } = await webauthnRegisterLimiter(clientIP);

  if (!allowed) {
    return jsonError(
      `Too many attempts. Try again in ${Math.ceil(resetIn / 60)} minutes.`,
      429,
      ERROR_CODES.RATE_LIMITED,
    );
  }

  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonUnauthorized('Authentication required');
    }

    const { data: body, error: parseError } = await parseJsonBody(request, BODY_SIZE_LIMITS.AUTH);
    if (parseError) return parseError;

    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid registration payload', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const { credential: credentialResponse, deviceName } = parsed.data;

    // Extract challenge from credential response to look it up
    const clientDataJSON = (credentialResponse as Record<string, unknown>).response as
      | Record<string, unknown>
      | undefined;
    if (!clientDataJSON) {
      return jsonError('Invalid credential response', 400, ERROR_CODES.BAD_REQUEST);
    }

    const host = request.headers.get('host') ?? new URL(request.url).hostname;
    const rpId = getRelyingPartyId(host);
    const origin = request.headers.get('origin') ?? new URL(request.url).origin;
    const expectedOrigin = getExpectedOrigin(origin);

    // Try to find the challenge for this user from database
    // We need to decode the challenge from the clientDataJSON
    const regResponse = credentialResponse as unknown as RegistrationResponseJSON;

    // Decode clientDataJSON to get the challenge
    const clientDataStr = Buffer.from(regResponse.response.clientDataJSON, 'base64url').toString(
      'utf-8',
    );
    const clientData = JSON.parse(clientDataStr) as { challenge: string };
    const challengeFromClient = clientData.challenge;

    // Consume challenge from DB (one-time use, validates expiry)
    const storedChallenge = await consumeChallenge(challengeFromClient, 'registration');

    if (!storedChallenge) {
      return jsonError(
        'Challenge expired or invalid. Please try again.',
        400,
        ERROR_CODES.BAD_REQUEST,
      );
    }

    // Verify user ID matches
    if (storedChallenge.userId !== user.id) {
      return jsonError('Challenge mismatch', 400, ERROR_CODES.BAD_REQUEST);
    }

    const verification = await verifyRegistrationResponse({
      response: regResponse,
      expectedChallenge: storedChallenge.challenge,
      expectedOrigin: expectedOrigin,
      expectedRPID: rpId,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return jsonError('Passkey verification failed', 400, ERROR_CODES.BAD_REQUEST);
    }

    const { credential } = verification.registrationInfo;

    // Store credential in dedicated table
    await storeCredential({
      userId: user.id,
      credentialId: credential.id,
      publicKey: bufferToBase64Url(credential.publicKey),
      counter: credential.counter,
      transports: (credentialResponse as Record<string, unknown>).response
        ? (((credentialResponse as Record<string, Record<string, unknown>>).response
            ?.transports as string[]) ?? [])
        : [],
      deviceName,
    });

    logger.info('WebAuthn credential registered', {
      userId: user.id,
      credentialId: credential.id,
      deviceName,
    });

    return jsonSuccess({
      verified: true,
      credentialId: credential.id,
      deviceName,
    });
  } catch (error) {
    logger.error('WebAuthn register verify error:', error);
    return jsonError('Failed to register passkey', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
