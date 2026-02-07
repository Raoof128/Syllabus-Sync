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

    // Look up user by email
    const { data: users, error: userError } = await adminClient.auth.admin.listUsers();

    if (userError) {
      logger.error('User lookup error:', userError);
      return jsonError('Passkey login unavailable', 500, ERROR_CODES.INTERNAL_ERROR);
    }

    const userRecord = users.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (!userRecord) {
      // Don't reveal whether user exists
      return jsonError('Passkey not available for this account', 404, ERROR_CODES.NOT_FOUND);
    }

    // Get credentials from DB table
    const credentials = await getCredentialsForUser(userRecord.id);

    // Also check legacy user_metadata for backwards compatibility
    const metadata = (userRecord.user_metadata || {}) as Record<string, unknown>;
    const legacyCredentialId = metadata.biometric_credential_id as string | undefined;

    if (credentials.length === 0 && !legacyCredentialId) {
      return jsonError('Passkey not available for this account', 404, ERROR_CODES.NOT_FOUND);
    }

    const host = request.headers.get('host') ?? new URL(request.url).hostname;
    const rpId = getRelyingPartyId(host);

    // Build allowCredentials from DB + legacy
    const allowCredentials: Array<{
      id: string;
      transports?: AuthenticatorTransportFuture[];
    }> = credentials.map((c) => ({
      id: c.credentialId,
      transports: c.transports as AuthenticatorTransportFuture[],
    }));

    if (legacyCredentialId && !allowCredentials.some((c) => c.id === legacyCredentialId)) {
      const legacyTransports =
        (metadata.biometric_transports as AuthenticatorTransportFuture[]) ?? undefined;
      allowCredentials.push({
        id: legacyCredentialId,
        transports: legacyTransports,
      });
    }

    const options = await generateAuthenticationOptions({
      rpID: rpId,
      allowCredentials,
      userVerification: 'required',
    });

    // Store challenge in DB
    await storeChallenge(options.challenge, 'authentication', userRecord.id);

    return jsonSuccess({ options });
  } catch (error) {
    logger.error('WebAuthn auth options error:', error);
    return jsonError('Failed to create authentication options', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
