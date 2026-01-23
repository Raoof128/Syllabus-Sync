import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { jsonError, jsonSuccess, ERROR_CODES } from '@/app/api/_lib/response';
import { requireAuth, optionalAuth } from '@/app/api/_lib/middleware';
import { withCSRFProtection } from '@/lib/security/csrf';
import { apiLimiter } from '@/lib/services/rateLimitService';
import { getClientIP } from '@/lib/security/ip';

// ============================================================================
// TYPES
// ============================================================================

interface GamificationProfile {
  xp: number;
  level: number;
  streakDays: number;
  longestStreak: number;
  lastActivityDate: string | null;
  xpToNextLevel: number;
  xpForCurrentLevel: number;
  levelProgress: number; // 0-100 percentage
}

interface XPEvent {
  id: string;
  eventType: string;
  xpAmount: number;
  referenceId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ============================================================================
// LEVEL CALCULATION (mirrors database function)
// ============================================================================

/**
 * Calculate level from XP using progressive curve
 * Must match database function calculate_level()
 */
function calculateLevel(xp: number): number {
  if (xp < 0) return 1;
  return Math.min(100, Math.floor(Math.sqrt(xp / 25)) + 1);
}

/**
 * Calculate XP required to reach a specific level
 * Must match database function xp_for_level()
 */
function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return (level - 1) * (level - 1) * 25;
}

// ============================================================================
// DEMO MODE DATA
// ============================================================================

/**
 * Generate demo gamification profile for unauthenticated users
 * This allows the UI to show the feature without requiring login
 */
function generateDemoProfile(): GamificationProfile {
  const demoXp = 275; // Level 4
  const level = calculateLevel(demoXp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const xpInCurrentLevel = demoXp - currentLevelXp;
  const xpNeededForLevel = nextLevelXp - currentLevelXp;

  return {
    xp: demoXp,
    level,
    streakDays: 5,
    longestStreak: 12,
    lastActivityDate: new Date().toISOString().split('T')[0],
    xpToNextLevel: nextLevelXp - demoXp,
    xpForCurrentLevel: currentLevelXp,
    levelProgress: Math.round((xpInCurrentLevel / xpNeededForLevel) * 100),
  };
}

function generateDemoEvents(): XPEvent[] {
  const now = new Date();
  return [
    {
      id: 'demo-1',
      eventType: 'deadline_completed',
      xpAmount: 25,
      referenceId: null,
      metadata: { title: 'COMP2000 Assignment 2' },
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    },
    {
      id: 'demo-2',
      eventType: 'daily_login',
      xpAmount: 5,
      referenceId: null,
      metadata: {},
      createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    },
    {
      id: 'demo-3',
      eventType: 'streak_bonus',
      xpAmount: 25,
      referenceId: null,
      metadata: { streak_days: 5 },
      createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-4',
      eventType: 'unit_added',
      xpAmount: 15,
      referenceId: null,
      metadata: { code: 'COMP3000', name: 'Machine Learning' },
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    },
    {
      id: 'demo-5',
      eventType: 'deadline_early',
      xpAmount: 10,
      referenceId: null,
      metadata: { hours_early: 48 },
      createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
    },
  ];
}

// ============================================================================
// API HANDLERS
// ============================================================================

/**
 * GET /api/gamification - Get user's gamification profile
 * Returns demo data if not authenticated
 */
export async function GET(request: NextRequest) {
  // SECURITY: Apply rate limiting
  const clientIP = getClientIP(request);
  const { allowed, resetIn } = await apiLimiter(`gamification:${clientIP}`);
  if (!allowed) {
    return jsonError(
      'Rate limit exceeded. Please try again later.',
      429,
      ERROR_CODES.RATE_LIMITED,
      { retryAfter: resetIn },
    );
  }

  // Check for events query parameter
  const url = new URL(request.url);
  const includeEvents = url.searchParams.get('events') === 'true';
  const eventsLimit = Math.min(50, parseInt(url.searchParams.get('limit') || '10', 10));

  return optionalAuth(request, async (userId) => {
    // Demo mode: return sample data
    if (!userId) {
      const profile = generateDemoProfile();
      const response: { profile: GamificationProfile; events?: XPEvent[]; isDemo: boolean } = {
        profile,
        isDemo: true,
      };

      if (includeEvents) {
        response.events = generateDemoEvents();
      }

      return jsonSuccess(response);
    }

    // Authenticated: fetch real data from Supabase
    const supabase = await createServerClient();

    // Get or create gamification profile
    const { data: initialProfileData, error: profileError } = await supabase
      .from('gamification_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    let profileData = initialProfileData;

    if (profileError?.code === 'PGRST116') {
      // No profile exists, create one
      const { data: newProfile, error: createError } = await supabase
        .from('gamification_profiles')
        .insert({ user_id: userId })
        .select('*')
        .single();

      if (createError) {
        console.error('Failed to create gamification profile:', createError);
        return jsonError('Failed to create profile', 500, ERROR_CODES.INTERNAL_ERROR);
      }

      profileData = newProfile;
    } else if (profileError) {
      console.error('Failed to fetch gamification profile:', profileError);
      return jsonError('Failed to fetch profile', 500, ERROR_CODES.INTERNAL_ERROR);
    }

    // Calculate derived values
    const xp = profileData?.xp ?? 0;
    const level = calculateLevel(xp);
    const currentLevelXp = xpForLevel(level);
    const nextLevelXp = xpForLevel(level + 1);
    const xpInCurrentLevel = xp - currentLevelXp;
    const xpNeededForLevel = nextLevelXp - currentLevelXp;

    const profile: GamificationProfile = {
      xp,
      level,
      streakDays: profileData?.streak_days ?? 0,
      longestStreak: profileData?.longest_streak ?? 0,
      lastActivityDate: profileData?.last_activity_date ?? null,
      xpToNextLevel: nextLevelXp - xp,
      xpForCurrentLevel: currentLevelXp,
      levelProgress:
        xpNeededForLevel > 0 ? Math.round((xpInCurrentLevel / xpNeededForLevel) * 100) : 100,
    };

    const response: { profile: GamificationProfile; events?: XPEvent[]; isDemo: boolean } = {
      profile,
      isDemo: false,
    };

    // Optionally include recent XP events
    if (includeEvents) {
      const { data: eventsData, error: eventsError } = await supabase
        .from('xp_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(eventsLimit);

      if (eventsError) {
        console.error('Failed to fetch XP events:', eventsError);
        // Don't fail the whole request, just don't include events
      } else {
        response.events = (eventsData ?? []).map(
          (event: {
            id: string;
            event_type: string;
            xp_amount: number;
            reference_id: string | null;
            metadata: Record<string, unknown> | null;
            created_at: string;
          }) => ({
            id: event.id,
            eventType: event.event_type,
            xpAmount: event.xp_amount,
            referenceId: event.reference_id,
            metadata: event.metadata ?? {},
            createdAt: event.created_at,
          }),
        );
      }
    }

    return jsonSuccess(response);
  });
}

/**
 * POST /api/gamification/record-activity - Record user activity (for streak tracking)
 * This is called when the user performs certain actions to update their streak
 */
export async function POST(request: NextRequest) {
  // SECURITY: Apply CSRF protection and rate limiting (stricter for mutations)
  return withCSRFProtection(async (_request) => {
    const clientIP = getClientIP(request);
    const { allowed, resetIn } = await apiLimiter(`gamification-post:${clientIP}`);
    if (!allowed) {
      return jsonError(
        'Rate limit exceeded. Please try again later.',
        429,
        ERROR_CODES.RATE_LIMITED,
        { retryAfter: resetIn },
      );
    }

    return requireAuth(request, async (userId) => {
      const supabase = await createServerClient();

      // Call the update_streak function (which also awards daily XP)
      const { error } = await supabase.rpc('update_streak', { p_user_id: userId });

      if (error) {
        console.error('Failed to update streak:', error);
        return jsonError('Failed to record activity', 500, ERROR_CODES.INTERNAL_ERROR);
      }

      // Fetch updated profile
      const { data: profileData, error: profileError } = await supabase
        .from('gamification_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('Failed to fetch updated profile:', profileError);
        return jsonError(
          'Activity recorded but failed to fetch profile',
          500,
          ERROR_CODES.INTERNAL_ERROR,
        );
      }

      const xp = profileData?.xp ?? 0;
      const level = calculateLevel(xp);
      const currentLevelXp = xpForLevel(level);
      const nextLevelXp = xpForLevel(level + 1);
      const xpInCurrentLevel = xp - currentLevelXp;
      const xpNeededForLevel = nextLevelXp - currentLevelXp;

      return jsonSuccess({
        message: 'Activity recorded',
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
  });
}
