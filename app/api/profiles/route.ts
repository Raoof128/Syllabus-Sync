// app/api/profiles/route.ts
// ============================================
// PROFILES API - User Profile Management
// ============================================

import { createServerClient } from '@/lib/supabase/server';
import {
  jsonSuccess,
  jsonError,
  jsonUnauthorized,
  parseJsonBody,
  BODY_SIZE_LIMITS,
} from '@/app/api/_lib/response';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const UpdateProfileSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().max(500).nullable().optional(),
});

// ============================================================================
// GET /api/profiles - Get current user's profile
// ============================================================================

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonUnauthorized('Not authenticated');
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // PGRST116 is "not found" - profile may not exist yet
      if (profileError.code === 'PGRST116') {
        return jsonSuccess(null);
      }
      console.error('Profile fetch error:', profileError);
      return jsonError('Failed to fetch profile', 500);
    }

    return jsonSuccess(profile);
  } catch (error) {
    console.error('Profile GET error:', error);
    return jsonError('Internal server error', 500);
  }
}

// ============================================================================
// PUT /api/profiles - Update current user's profile
// ============================================================================

export async function PUT(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonUnauthorized('Not authenticated');
    }

    // Parse and validate request body
    const { data: body, error: parseError } = await parseJsonBody(
      request,
      BODY_SIZE_LIMITS.DEFAULT,
    );
    if (parseError) return parseError;

    const validation = UpdateProfileSchema.safeParse(body);
    if (!validation.success) {
      return jsonError('Invalid profile data', 400, 'VALIDATION_ERROR', {
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const updates = validation.data;

    // SECURITY: Only allow updating safe fields (full_name, avatar_url)
    // email and student_id are protected by DB trigger
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: updates.full_name,
        avatar_url: updates.avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      // Check for protected field modification
      if (updateError.message?.includes('Cannot modify')) {
        return jsonError(updateError.message, 403);
      }
      return jsonError('Failed to update profile', 500);
    }

    return jsonSuccess(profile);
  } catch (error) {
    console.error('Profile PUT error:', error);
    return jsonError('Internal server error', 500);
  }
}
