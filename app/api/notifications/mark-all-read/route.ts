import { createServerClient } from '@/lib/supabase/server';
import { jsonError, jsonSuccess, ERROR_CODES } from '@/app/api/_lib/response';
import { requireAuthWithRateLimit } from '@/app/api/_lib/middleware';
import { logger } from '@/lib/logger';

export async function PUT(request: Request) {
  return requireAuthWithRateLimit(request, async (userId) => {
    try {
      const supabase = await createServerClient();

      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)
        .select('id');

      if (error) {
        // SECURITY: Log actual error server-side, return generic message to client
        logger.error('Database error marking notifications read:', error.code, error.message);
        return jsonError('Database operation failed', 500, ERROR_CODES.DATABASE_ERROR);
      }

      return jsonSuccess({
        updated: data?.length ?? 0,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      logger.error('Error marking notifications as read:', error);
      return jsonError('Failed to mark notifications as read', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  });
}
