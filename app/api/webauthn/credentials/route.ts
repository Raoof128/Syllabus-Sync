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
import { getCredentialsForUser, deleteCredential } from '@/lib/security/webauthn';
import { logger } from '@/lib/logger';
import { z } from 'zod';

/**
 * GET /api/webauthn/credentials
 * List all passkeys for the authenticated user.
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonUnauthorized('Authentication required');
    }

    const credentials = await getCredentialsForUser(user.id);

    return jsonSuccess({
      credentials: credentials.map((c) => ({
        id: c.id,
        credentialId: c.credentialId,
        deviceName: c.deviceName,
        createdAt: c.createdAt,
        lastUsedAt: c.lastUsedAt,
      })),
      count: credentials.length,
    });
  } catch (error) {
    logger.error('List credentials error:', error);
    return jsonError('Failed to list passkeys', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}

const deleteSchema = z.object({
  credentialDbId: z.string().uuid(),
});

/**
 * DELETE /api/webauthn/credentials
 * Remove a passkey by database ID.
 */
export async function DELETE(request: NextRequest) {
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

    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid request', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const success = await deleteCredential(user.id, parsed.data.credentialDbId);

    if (!success) {
      return jsonError('Failed to remove passkey', 400, ERROR_CODES.BAD_REQUEST);
    }

    logger.info('WebAuthn credential deleted', {
      userId: user.id,
      credentialDbId: parsed.data.credentialDbId,
    });

    return jsonSuccess({ removed: true });
  } catch (error) {
    logger.error('Delete credential error:', error);
    return jsonError('Failed to remove passkey', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
