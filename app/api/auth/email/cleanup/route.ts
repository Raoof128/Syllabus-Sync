import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { jsonSuccess, jsonError, ERROR_CODES } from '@/app/api/_lib/response';
import { logger } from '@/lib/logger';

/**
 * POST /api/auth/email/cleanup
 *
 * Cron endpoint: deletes expired/used verification tokens.
 * Protected by Authorization header with a shared secret.
 *
 * Can be called by:
 * - pg_cron (via SQL function, set up in migration)
 * - External cron service (Vercel Cron, GitHub Actions, etc.)
 *
 * Expected header: Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  // 1. Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return jsonError('Unauthorized', 401, ERROR_CODES.UNAUTHORIZED);
  }

  try {
    const adminClient = createAdminClient();
    if (!adminClient) {
      return jsonError('Not configured', 503, ERROR_CODES.EXTERNAL_SERVICE_ERROR);
    }

    // 2. Call the SQL cleanup function
    const { data, error } = await adminClient.rpc('cleanup_expired_email_verifications');

    if (error) {
      logger.error('Email verification cleanup failed', { error: error.message });
      return jsonError('Cleanup failed', 500, ERROR_CODES.INTERNAL_ERROR);
    }

    const deletedCount = typeof data === 'number' ? data : 0;
    logger.info('Email verification cleanup completed', { deletedCount });

    return jsonSuccess({ deletedCount });
  } catch (error) {
    logger.error('Cleanup error:', error);
    return jsonError('Cleanup failed', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
