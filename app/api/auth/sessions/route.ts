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
import { requireAal2IfEnrolled } from '@/app/api/_lib/aal';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const signOutSchema = z.object({
  scope: z.enum(['local', 'others', 'global']),
});

const getDeviceLabelFromUA = (ua: string | null) => {
  if (!ua) return 'Unknown device';
  const platformMatch = ua.match(/(Windows NT|Mac OS X|Android|iPhone|iPad|iPod|Linux|CrOS)/);
  const platform = platformMatch ? platformMatch[0].replace('Windows NT', 'Windows') : 'Device';
  const browserMatch = ua.match(/(Edg|Chrome|Firefox|Safari)/);
  const browser = browserMatch ? browserMatch[0].replace('Edg', 'Edge') : 'Browser';
  return `${platform} · ${browser}`;
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonUnauthorized('Not authenticated');
    }

    const device = getDeviceLabelFromUA(request.headers.get('user-agent'));
    const lastActive = user.last_sign_in_at ?? new Date().toISOString();

    return jsonSuccess({
      sessions: [
        {
          id: 'current-session',
          device,
          lastActive,
          current: true,
        },
      ],
    });
  } catch (error) {
    logger.error('Sessions GET error:', error);
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

    const parsed = signOutSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid session action', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const { scope } = parsed.data;

    // BA-0064: signing yourself out ('local') is always allowed. Revoking every
    // OTHER device is a takeover primitive — it evicts the real owner — so it
    // needs the same step-up the middleware would demand outside /api/auth/.
    if (scope !== 'local') {
      const stepUp = await requireAal2IfEnrolled(supabase, user.id, 'Sessions revoke');
      if (stepUp) return stepUp;
    }

    const { error: signOutError } = await supabase.auth.signOut({ scope });

    if (signOutError) {
      return jsonError('Failed to sign out sessions', 400, ERROR_CODES.BAD_REQUEST);
    }

    return jsonSuccess({ scope });
  } catch (error) {
    logger.error('Sessions POST error:', error);
    return jsonError('Internal server error', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
