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
import { passkeyAuthLimiter } from '@/lib/services/rateLimitService';
import { getClientIP } from '@/lib/security/ip';
import { getRpId, setPasskeyCookies } from '@/app/api/auth/passkey/_lib';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const optionsSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const { allowed, remaining, resetIn } = await passkeyAuthLimiter(clientIP);

  if (!allowed) {
    return jsonError(
      `Too many login attempts. Please try again in ${Math.ceil(resetIn / 60)} minutes.`,
      429,
      ERROR_CODES.RATE_LIMITED,
      { retryAfter: resetIn, remaining },
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

    // SECURITY: Use targeted RPC lookup instead of from('auth.users') which
    // doesn't work with Supabase JS client for system tables.
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
    const metadata = (userRow.user_meta ?? {}) as Record<string, unknown>;
    const credentialId = metadata.biometric_credential_id as string | undefined;

    if (!credentialId) {
      return jsonError('Passkey not available for this account', 404, ERROR_CODES.NOT_FOUND);
    }

    const transports =
      (metadata.biometric_transports as AuthenticatorTransportFuture[] | undefined) ?? undefined;

    const options = await generateAuthenticationOptions({
      rpID: getRpId(request),
      allowCredentials: [
        {
          id: credentialId,
          transports,
        },
      ],
      userVerification: 'required',
    });

    const response = jsonSuccess({ options });
    setPasskeyCookies(response, options.challenge, userId);
    return response;
  } catch (error) {
    logger.error('Passkey options error:', error);
    return jsonError('Failed to create passkey options', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
