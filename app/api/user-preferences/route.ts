// app/api/user-preferences/route.ts
// ============================================
// USER PREFERENCES API
// ============================================

import { createServerClient } from '@/lib/supabase/server';
import { jsonSuccess, jsonError, parseJsonBody, BODY_SIZE_LIMITS } from '@/app/api/_lib/response';
import { requireAuth, requireAuthWithRateLimit } from '@/app/api/_lib/middleware';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const UpdatePreferencesSchema = z.object({
  notifications_enabled: z.boolean().optional(),
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  deadline_notifications_enabled: z.boolean().optional(),
  class_notifications_enabled: z.boolean().optional(),
  event_notifications_enabled: z.boolean().optional(),
  deadline_reminder_timing_minutes: z.number().int().min(0).optional(),
  class_reminder_timing_minutes: z.number().int().min(0).optional(),
  event_reminder_timing_minutes: z.number().int().min(0).optional(),
});

export async function GET(request: Request) {
  return requireAuth(request, async (userId: string) => {
    try {
      const supabase = await createServerClient();

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          const { data: created, error: insertError } = await supabase
            .from('user_preferences')
            .insert({ user_id: userId })
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
      logger.error('User preferences GET error:', error);
      return jsonError('Internal server error', 500);
    }
  });
}

export async function PUT(request: Request) {
  return requireAuthWithRateLimit(
    request,
    async (userId: string) => {
      try {
        const supabase = await createServerClient();

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
          .eq('user_id', userId)
          .single();

        let data;
        let error;

        if (existing) {
          const result = await supabase
            .from('user_preferences')
            .update({
              ...updates,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .select('*')
            .single();
          data = result.data;
          error = result.error;
        } else {
          const result = await supabase
            .from('user_preferences')
            .insert({
              user_id: userId,
              ...updates,
            })
            .select('*')
            .single();
          data = result.data;
          error = result.error;
        }

        if (error) {
          logger.error('User preferences update/insert error:', error);
          return jsonError('Failed to update user preferences', 500);
        }

        return jsonSuccess(data);
      } catch (error) {
        logger.error('User preferences PUT error:', error);
        return jsonError('Internal server error', 500);
      }
    },
    'preferences',
  );
}
