import { NextRequest } from 'next/server';
import {
  generateAuthenticationOptions,
  type AuthenticatorTransportFuture,
} from '@simplewebauthn/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  jsonSuccess,
  jsonError,
  parseJsonBody,
  BODY_SIZE_LIMITS,
  ERROR_CODES,
} from '@/app/api/_lib/response';
import {
  storeChallenge,
  getCredentialsForUser,
  getRelyingPartyId,
  webauthnAuthLimiter,
} from '@/lib/security/webauthn';
import { getClientIP } from '@/lib/security/ip';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const optionsSchema = z.object({
  email: z.string().email(),
});

/**
 * POST /api/webauthn/authenticate/options
 * Generate authentication options for passkey login.
 * Does NOT require authentication (pre-login).
 */
export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const { allowed, resetIn } = await webauthnAuthLimiter(clientIP);

  if (!allowed) {
    return jsonError(
      `Too many login attempts. Try again in ${Math.ceil(resetIn / 60)} minutes.`,
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

    const parsed = optionsSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid login payload', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const { email } = parsed.data;

    // SECURITY: Use targeted RPC lookup instead of listUsers() which loads
    // ALL users into memory (DoS vector + functional bug for >50 users).
    const { data: lookupResult, error: lookupError } = await adminClient.rpc(
      'lookup_user_by_email',
      { lookup_email: email },
    );

    if (lookupError) {
      logger.error('User lookup error:', lookupError);
      return jsonError('Passkey login unavailable', 500, ERROR_CODES.INTERNAL_ERROR);
    }

    const userRow = Array.isArray(lookupResult) ? lookupResult[0] : lookupResult;

    if (!userRow?.user_id) {
      // Don't reveal whether user exists — use same message as "no passkeys"
      return jsonError('Passkey not available for this account', 404, ERROR_CODES.NOT_FOUND);
    }

    const userId: string = userRow.user_id;

    // SECURITY (BA-0059): only the DB table is a credential source. The legacy
    // `user_metadata.biometric_*` slot is writable by the account holder through
    // Supabase's own `PUT /auth/v1/user`, so it cannot vouch for a public key.
    const credentials = await getCredentialsForUser(userId);

    if (credentials.length === 0) {
      return jsonError('Passkey not available for this account', 404, ERROR_CODES.NOT_FOUND);
    }

    const host = request.headers.get('host') ?? new URL(request.url).hostname;
    const rpId = getRelyingPartyId(host);

    const allowCredentials: Array<{
      id: string;
      transports?: AuthenticatorTransportFuture[];
    }> = credentials.map((c) => ({
      id: c.credentialId,
      transports: c.transports as AuthenticatorTransportFuture[],
    }));

    const options = await generateAuthenticationOptions({
      rpID: rpId,
      allowCredentials,
      userVerification: 'required',
    });

    // Store challenge in DB
    await storeChallenge(options.challenge, 'authentication', userId);

    return jsonSuccess({ options });
  } catch (error) {
    logger.error('WebAuthn auth options error:', error);
    return jsonError('Failed to create authentication options', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
