import { createServerClient } from '@/lib/supabase/server';
import {
  jsonError,
  jsonSuccess,
  ERROR_CODES,
  handleValidationError,
} from '@/app/api/_lib/response';
import { requireAuth } from '@/app/api/_lib/middleware';
import { z } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

interface AwardXPResult {
  xpAwarded: number;
  oldXp: number;
  newXp: number;
  oldLevel: number;
  newLevel: number;
  leveledUp: boolean;
}

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const awardXPSchema = z.object({
  eventType: z.enum(['event_attended', 'profile_completed']),
  referenceId: z.string().uuid().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

type AwardXPRequest = z.infer<typeof awardXPSchema>;

// ============================================================================
// LEVEL CALCULATION (mirrors database function)
// ============================================================================

function calculateLevel(xp: number): number {
  if (xp < 0) return 1;
  return Math.min(100, Math.floor(Math.sqrt(xp / 25)) + 1);
}

function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return (level - 1) * (level - 1) * 25;
}

// ============================================================================
// API HANDLER
// ============================================================================

/**
 * POST /api/gamification/award-xp - Award XP for specific events
 *
 * This endpoint is for awarding XP for events that are triggered from the client:
 * - event_attended: When user clicks "Remind Me" on an event
 * - profile_completed: When user completes their profile
 *
 * Other XP events (deadline_completed, unit_added, etc.) are handled by database triggers.
 *
 * Security:
 * - Requires authentication
 * - Only allows specific event types (prevents abuse)
 * - Uses database RPC function for atomic XP award
 */
export async function POST(request: Request) {
  return requireAuth(request, async (userId) => {
    // Parse and validate request body
    let body: AwardXPRequest;
    try {
      const rawBody = await request.json();
      const parseResult = awardXPSchema.safeParse(rawBody);

      if (!parseResult.success) {
        return handleValidationError(parseResult.error);
      }

      body = parseResult.data;
    } catch {
      return jsonError('Invalid JSON body', 400, ERROR_CODES.BAD_REQUEST);
    }

    const { eventType, referenceId, metadata } = body;

    // Additional security: Check for duplicate awards (prevent spam clicking)
    const supabase = await createServerClient();

    // For event_attended, check if XP was already awarded for this event
    if (eventType === 'event_attended' && referenceId) {
      const { data: existingEvent } = await supabase
        .from('xp_events')
        .select('id')
        .eq('user_id', userId)
        .eq('event_type', 'event_attended')
        .eq('reference_id', referenceId)
        .single();

      if (existingEvent) {
        return jsonError('XP already awarded for this event', 409, ERROR_CODES.CONFLICT, {
          eventType,
          referenceId,
        });
      }
    }

    // For profile_completed, check if already awarded (one-time bonus)
    if (eventType === 'profile_completed') {
      const { data: existingProfileXP } = await supabase
        .from('xp_events')
        .select('id')
        .eq('user_id', userId)
        .eq('event_type', 'profile_completed')
        .single();

      if (existingProfileXP) {
        return jsonError('Profile completion XP already awarded', 409, ERROR_CODES.CONFLICT, {
          eventType,
        });
      }
    }

    // Call the database function to award XP
    const { data: result, error } = await supabase.rpc('award_xp', {
      p_user_id: userId,
      p_event_type: eventType,
      p_reference_id: referenceId || null,
      p_metadata: metadata,
    });

    if (error) {
      console.error('Failed to award XP:', error);
      return jsonError('Failed to award XP', 500, ERROR_CODES.INTERNAL_ERROR);
    }

    // Parse the result from the database function
    const awardResult: AwardXPResult = {
      xpAwarded: result.xp_awarded,
      oldXp: result.old_xp,
      newXp: result.new_xp,
      oldLevel: result.old_level,
      newLevel: result.new_level,
      leveledUp: result.leveled_up,
    };

    // Fetch updated profile to return complete state
    const { data: profileData, error: profileError } = await supabase
      .from('gamification_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      // XP was awarded but failed to fetch profile - still return success
      console.error('Failed to fetch updated profile:', profileError);
      return jsonSuccess({
        message: `Earned ${awardResult.xpAwarded} XP for ${eventType}!`,
        result: awardResult,
      });
    }

    const xp = profileData?.xp ?? awardResult.newXp;
    const level = calculateLevel(xp);
    const currentLevelXp = xpForLevel(level);
    const nextLevelXp = xpForLevel(level + 1);
    const xpInCurrentLevel = xp - currentLevelXp;
    const xpNeededForLevel = nextLevelXp - currentLevelXp;

    return jsonSuccess({
      message: `Earned ${awardResult.xpAwarded} XP for ${formatEventType(eventType)}!`,
      result: awardResult,
      profile: {
        xp,
        level,
        streakDays: profileData?.streak_days ?? 0,
        longestStreak: profileData?.longest_streak ?? 0,
        lastActivityDate: profileData?.last_activity_date ?? null,
        xpToNextLevel: nextLevelXp - xp,
        xpForCurrentLevel: currentLevelXp,
        levelProgress:
          xpNeededForLevel > 0 ? Math.round((xpInCurrentLevel / xpNeededForLevel) * 100) : 100,
      },
    });
  });
}

// ============================================================================
// HELPERS
// ============================================================================

function formatEventType(eventType: string): string {
  const eventTypeMap: Record<string, string> = {
    event_attended: 'attending an event',
    profile_completed: 'completing your profile',
  };
  return eventTypeMap[eventType] || eventType.replace(/_/g, ' ');
}
