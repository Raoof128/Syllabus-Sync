// app/api/user-preferences/route.ts
// ============================================
// USER PREFERENCES API
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

const UpdatePreferencesSchema = z.object({
  notifications_enabled: z.boolean().optional(),
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
});

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

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        const { data: created, error: insertError } = await supabase
          .from('user_preferences')
          .insert({ user_id: user.id })
          .select('*')
          .single();

        if (insertError) {
          return jsonError('Failed to create user preferences', 500);
        }

        return jsonSuccess(created);
      }

      return jsonError('Failed to fetch user preferences', 500);
    }

    return jsonSuccess(data);
  } catch (error) {
    console.error('User preferences GET error:', error);
    return jsonError('Internal server error', 500);
  }
}

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

    const { data: body, error: parseError } = await parseJsonBody(
      request,
      BODY_SIZE_LIMITS.DEFAULT,
    );
    if (parseError) return parseError;

    const validation = UpdatePreferencesSchema.safeParse(body);
    if (!validation.success) {
      return jsonError('Invalid preferences data', 400, 'VALIDATION_ERROR', {
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const updates = validation.data;
    if (Object.keys(updates).length === 0) {
      return jsonError('No preference updates provided', 400, 'VALIDATION_ERROR');
    }

    // First check if the record exists
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let data;
    let error;

    if (existing) {
      // Update existing record
      const result = await supabase
        .from('user_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select('*')
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Insert new record
      const result = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          ...updates,
        })
        .select('*')
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('User preferences update/insert error:', error);
      return jsonError('Failed to update user preferences', 500);
    }

    return jsonSuccess(data);
  } catch (error) {
    console.error('User preferences PUT error:', error);
    return jsonError('Internal server error', 500);
  }
}
