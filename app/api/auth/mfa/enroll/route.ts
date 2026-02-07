import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { jsonSuccess, jsonError, jsonUnauthorized, ERROR_CODES } from '@/app/api/_lib/response';
import { mfaEnrollLimiter } from '@/lib/security/mfa';
import { getClientIP } from '@/lib/security/ip';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const { allowed, remaining, resetIn } = await mfaEnrollLimiter(clientIP);

  if (!allowed) {
    return jsonError(
      `Too many enrollment attempts. Try again in ${Math.ceil(resetIn / 60)} minutes.`,
      429,
      ERROR_CODES.RATE_LIMITED,
      { retryAfter: resetIn, remaining },
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

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Authenticator App',
    });

    if (error) {
      logger.error('MFA TOTP enrollment error:', {
        userId: user.id,
        error: error.message,
      });
      return jsonError('Failed to start authenticator setup', 400, ERROR_CODES.BAD_REQUEST);
    }

    // SECURITY: Prevent proxy caching of TOTP secrets
    const response = jsonSuccess({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
    });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    return response;
  } catch (error) {
    logger.error('MFA enroll error:', error);
    return jsonError('Failed to set up authenticator', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
