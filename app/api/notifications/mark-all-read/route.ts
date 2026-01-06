import { createServerClient } from '@/lib/supabase/server';
import { jsonError, jsonSuccess, ERROR_CODES } from '@/app/api/_lib/response';
import { requireAuth } from '@/app/api/_lib/middleware';

export async function PUT(request: Request) {
  return requireAuth(request, async (userId) => {
    try {
      const supabase = await createServerClient();

      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)
        .select('id');

      if (error) {
        return jsonError(error.message, 500, ERROR_CODES.DATABASE_ERROR);
      }

      return jsonSuccess({
        updated: data?.length ?? 0,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      return jsonError('Failed to mark notifications as read', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  });
}
