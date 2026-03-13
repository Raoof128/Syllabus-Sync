// app/api/profiles/route.ts
// ============================================
// PROFILES API - User Profile Management
// ============================================

import { createServerClient } from '@/lib/supabase/server';
import {
  jsonSuccess,
  jsonError,
  parseJsonBody,
  BODY_SIZE_LIMITS,
  ERROR_CODES,
} from '@/app/api/_lib/response';
import { requireAuth, requireAuthWithRateLimit } from '@/app/api/_lib/middleware';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const UpdateProfileSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  student_id: z.string().min(1).max(20).nullable().optional(),
  faculty: z.string().max(100).nullable().optional(),
  course: z.string().max(100).nullable().optional(),
  year: z.string().max(20).nullable().optional(),
  avatar_url: z.string().url().max(500).nullable().optional(),
});

// ============================================================================
// GET /api/profiles - Get current user's profile
// ============================================================================

export async function GET(request: Request) {
  return requireAuth(request, async (userId: string) => {
    try {
      const supabase = await createServerClient();

      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        // PGRST116 is "not found" - profile may not exist yet
        // Auto-create profile for authenticated users who don't have one
        if (profileError.code === 'PGRST116') {
          logger.warn('Profile not found, auto-creating for user:', userId);

          const { data: userData } = await supabase.auth.getUser();
          const user = userData?.user;

          // Create profile from user metadata
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: user?.email,
              full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
              student_id: user?.user_metadata?.student_id || null,
            })
            .select()
            .single();

          if (createError) {
            logger.error('Auto-create profile failed:', createError);
            // Return null instead of erroring - let client handle it
            return jsonSuccess(null);
          }

          return jsonSuccess(newProfile);
        }
        logger.error('Profile fetch error:', profileError);
        return jsonError('Failed to fetch profile', 500);
      }

      return jsonSuccess(profile);
    } catch (error) {
      logger.error('Profile GET error:', error);
      return jsonError('Internal server error', 500);
    }
  });
}

// ============================================================================
// PUT /api/profiles - Update current user's profile
// ============================================================================

export async function PUT(request: Request) {
  return requireAuthWithRateLimit(
    request,
    async (userId: string) => {
      try {
        const supabase = await createServerClient();

        // Parse and validate request body
        const { data: body, error: parseError } = await parseJsonBody(
          request,
          BODY_SIZE_LIMITS.DEFAULT,
        );
        if (parseError) return parseError;

        const validation = UpdateProfileSchema.safeParse(body);
        if (!validation.success) {
          logger.error(
            'Profile validation failed:',
            JSON.stringify(validation.error.flatten().fieldErrors),
          );
          return jsonError('Invalid profile data', 400, 'VALIDATION_ERROR', {
            errors: validation.error.flatten().fieldErrors,
          });
        }

        const updates = validation.data;
        const updatePayload: Record<string, string | null> = {
          updated_at: new Date().toISOString(),
        };
        if ('full_name' in updates) updatePayload.full_name = updates.full_name ?? null;
        if ('student_id' in updates) updatePayload.student_id = updates.student_id ?? null;
        if ('faculty' in updates) updatePayload.faculty = updates.faculty ?? null;
        if ('course' in updates) updatePayload.course = updates.course ?? null;
        if ('year' in updates) updatePayload.year = updates.year ?? null;
        if ('avatar_url' in updates) updatePayload.avatar_url = updates.avatar_url ?? null;

        // SECURITY: Only allow updating safe fields
        const { data: profile, error: updateError } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', userId)
          .select()
          .single();

        if (updateError) {
          logger.error('Profile update error:', updateError.code, updateError.details);
          if (updateError.message?.includes('Cannot modify')) {
            return jsonError('Cannot modify protected fields', 403);
          }
          // SECURITY: Don't leak internal error messages to client
          return jsonError('Failed to update profile', 500, ERROR_CODES.DATABASE_ERROR);
        }

        return jsonSuccess(profile);
      } catch (error) {
        logger.error('Profile PUT error:', error);
        return jsonError('Internal server error', 500);
      }
    },
    'profiles',
  );
}

// ============================================================================
// DELETE /api/profiles - Delete current user's profile
// ============================================================================

export async function DELETE(request: Request) {
  return requireAuthWithRateLimit(
    request,
    async (userId: string) => {
      try {
        const supabase = await createServerClient();

        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) {
          return jsonError('Failed to delete profile', 500);
        }

        await supabase.from('user_preferences').delete().eq('user_id', userId);

        return jsonSuccess({ id: userId });
      } catch (error) {
        logger.error('Profile DELETE error:', error);
        return jsonError('Internal server error', 500);
      }
    },
    'profiles',
  );
}
