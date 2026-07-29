import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  jsonSuccess,
  jsonError,
  jsonUnauthorized,
  parseJsonBody,
  BODY_SIZE_LIMITS,
  ERROR_CODES,
} from '@/app/api/_lib/response';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const biometricSchema = z.object({
  enabled: z.boolean(),
});

type BiometricMetadata = {
  biometric_enabled?: boolean;
  biometric_credential_id?: string | null;
  biometric_public_key?: string | null;
  biometric_counter?: number | null;
  biometric_transports?: string[] | null;
  biometric_updated_at?: string | null;
};

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonUnauthorized('Not authenticated');
    }

    const metadata = (user.user_metadata || {}) as BiometricMetadata;
    const { count: dbCredentialCount, error: credentialsError } = await supabase
      .from('webauthn_credentials')
      .select('id', { head: true, count: 'exact' })
      .eq('user_id', user.id);

    if (credentialsError) {
      logger.warn('Biometric GET credential lookup failed:', credentialsError);
    }

    const hasDbCredentials = (dbCredentialCount ?? 0) > 0;

    return jsonSuccess({
      enabled: Boolean(metadata.biometric_enabled) || hasDbCredentials,
      credentialId: metadata.biometric_credential_id ?? null,
      publicKey: metadata.biometric_public_key ?? null,
      counter: metadata.biometric_counter ?? null,
      transports: metadata.biometric_transports ?? null,
      updatedAt: metadata.biometric_updated_at ?? null,
      credentialCount: dbCredentialCount ?? 0,
    });
  } catch (error) {
    logger.error('Biometric GET error:', error);
    return jsonError('Internal server error', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonUnauthorized('Not authenticated');
    }

    const { data: body, error: parseError } = await parseJsonBody(request, BODY_SIZE_LIMITS.AUTH);
    if (parseError) return parseError;

    const parsed = biometricSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid biometric payload', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const { enabled } = parsed.data;

    // SECURITY (BA-0002): This endpoint must never accept client-supplied
    // credential material (credentialId/publicKey). Doing so previously let
    // an attacker with a briefly-hijacked session plant their own public key
    // in user_metadata with zero WebAuthn ceremony - no challenge, no
    // attestation, no proof of possession - which
    // app/api/webauthn/authenticate/verify and app/api/auth/passkey/verify
    // then trusted to mint a session, creating a permanent
    // password-independent backdoor. Enabling biometric/passkey login must
    // go through a real registration ceremony
    // (POST /api/auth/passkey/register-options + /api/auth/passkey/register,
    // which calls verifyRegistrationResponse against a server-issued
    // challenge) or the DB-backed /api/webauthn/register flow. This endpoint
    // only supports disabling and reporting status.
    if (enabled) {
      return jsonError(
        'Enabling biometric login requires completing passkey registration',
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const { error: deleteCredentialsError } = await supabase
      .from('webauthn_credentials')
      .delete()
      .eq('user_id', user.id);

    if (deleteCredentialsError) {
      logger.error('Biometric disable credential cleanup failed:', deleteCredentialsError);
      return jsonError('Failed to update biometric settings', 400, ERROR_CODES.BAD_REQUEST);
    }

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        biometric_enabled: false,
        biometric_credential_id: null,
        biometric_public_key: null,
        biometric_counter: null,
        biometric_transports: null,
        biometric_updated_at: new Date().toISOString(),
      },
    });

    if (updateError) {
      logger.error('Biometric update failed:', updateError.message);
      return jsonError('Failed to update biometric settings', 400, ERROR_CODES.BAD_REQUEST);
    }

    return jsonSuccess({
      enabled: false,
      credentialId: null,
      publicKey: null,
      counter: null,
      transports: null,
      credentialCount: 0,
    });
  } catch (error) {
    logger.error('Biometric POST error:', error);
    return jsonError('Internal server error', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
