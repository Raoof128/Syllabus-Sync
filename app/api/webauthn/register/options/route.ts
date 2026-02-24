import { NextRequest } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { createServerClient } from '@/lib/supabase/server';
import { APP_CONFIG } from '@/lib/config';
import {
  jsonSuccess,
  jsonError,
  jsonUnauthorized,
  parseJsonBody,
  BODY_SIZE_LIMITS,
  ERROR_CODES,
} from '@/app/api/_lib/response';
import {
  storeChallenge,
  getCredentialsForUser,
  getRelyingPartyId,
  webauthnRegisterLimiter,
  MAX_PASSKEYS_PER_USER,
} from '@/lib/security/webauthn';
import { getClientIP } from '@/lib/security/ip';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const optionsSchema = z.object({
  deviceName: z.string().max(100).optional().default('Passkey'),
});

/**
 * POST /api/webauthn/register/options
 * Generate registration options for a new passkey.
 * Requires authentication.
 */
export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const { allowed, resetIn } = await webauthnRegisterLimiter(clientIP);

  if (!allowed) {
    return jsonError(
      `Too many registration attempts. Try again in ${Math.ceil(resetIn / 60)} minutes.`,
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

    const parsed = optionsSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return jsonError('Invalid request', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // Check existing credentials
    const existingCredentials = await getCredentialsForUser(user.id);

    if (existingCredentials.length >= MAX_PASSKEYS_PER_USER) {
      return jsonError(
        `Maximum of ${MAX_PASSKEYS_PER_USER} passkeys reached. Remove one before adding a new one.`,
        400,
        ERROR_CODES.BAD_REQUEST,
      );
    }

    const host = request.headers.get('host') ?? new URL(request.url).hostname;
    const rpId = getRelyingPartyId(host);

    // Convert user ID to buffer
    const userIdBuffer = new TextEncoder().encode(user.id);

    const options = await generateRegistrationOptions({
      rpName: APP_CONFIG.name,
      rpID: rpId,
      userID: userIdBuffer,
      userName: user.email ?? user.id,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required',
      },
      excludeCredentials: existingCredentials.map((c) => ({
        id: c.credentialId,
        transports: c.transports as AuthenticatorTransport[],
      })),
    });

    // Store challenge in DB (not cookies) for security
    await storeChallenge(options.challenge, 'registration', user.id);

    return jsonSuccess({ options });
  } catch (error) {
    logger.error('WebAuthn register options error:', error);
    return jsonError('Failed to create registration options', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
