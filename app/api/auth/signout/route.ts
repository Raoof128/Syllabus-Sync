import type { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { jsonSuccess, jsonError } from '@/app/api/_lib/response';
import { logger } from '@/lib/logger';
import { logAuthAuditEvent } from '@/lib/security/auth-audit';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Q3: capture the user before signOut clears the session, otherwise the
    // audit row cannot say who left.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error('Signout error:', error);
      logAuthAuditEvent('signout_failed', request, {
        userId: user?.id ?? null,
        reason: error.message,
      });
      return jsonError('Failed to sign out', 400);
    }

    logAuthAuditEvent('signout_success', request, { userId: user?.id ?? null });

    return jsonSuccess({ message: 'Signout successful' });
  } catch (error) {
    logger.error('Signout error:', error);
    return jsonError('Internal server error', 500);
  }
}
