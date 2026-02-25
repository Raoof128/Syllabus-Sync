import { createServerClient } from '@/lib/supabase/server';
import { jsonSuccess, jsonError } from '@/app/api/_lib/response';
import { logger } from '@/lib/logger';

export async function POST() {
  try {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error('Signout error:', error);
      return jsonError('Failed to sign out', 400);
    }

    return jsonSuccess({ message: 'Signout successful' });
  } catch (error) {
    logger.error('Signout error:', error);
    return jsonError('Internal server error', 500);
  }
}
