import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  jsonSuccess,
  jsonError,
  parseJsonBody,
  BODY_SIZE_LIMITS,
  ERROR_CODES,
} from '@/app/api/_lib/response';
import { loginLimiter } from '@/lib/services/rateLimitService';
import { getClientIP } from '@/lib/security/ip';
import { z } from 'zod';

const statusSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const { allowed, remaining, resetIn } = await loginLimiter(clientIP);

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

    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid login payload', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const { email } = parsed.data;
    const { data: userRecord } = await adminClient
      .from('auth.users')
      .select('user_metadata')
      .eq('email', email)
      .limit(1)
      .single();

    const metadata = (userRecord?.user_metadata || {}) as Record<string, unknown>;
    const available = Boolean(metadata.biometric_credential_id);

    return jsonSuccess({ available });
  } catch (error) {
    console.error('Passkey status error:', error);
    return jsonError('Failed to check passkey status', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
