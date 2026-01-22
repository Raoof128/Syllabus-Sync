import { createServerClient } from '@/lib/supabase/server';
import { jsonSuccess, jsonError, ERROR_CODES } from '@/app/api/_lib/response';
import { requireAuthWithRateLimit, validateRequest } from '@/app/api/_lib/middleware';
import { z } from 'zod';

// ============================================================================
// SCHEMAS
// ============================================================================

const daySchema = z.enum([
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]);

const classTimeSchema = z.object({
  id: z.string().uuid().optional(),
  day: daySchema,
  startTime: z.string(),
  endTime: z.string(),
});

const unitSyncSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1),
  name: z.string().min(1),
  color: z.string().optional(),
  description: z.string().optional(),
  location: z
    .object({
      building: z.string().optional(),
      room: z.string().optional(),
    })
    .optional(),
  schedule: z.array(classTimeSchema).optional().default([]),
  createdAt: z.string().optional(), // ISO string from client
});

/**
 * POST /api/units/sync
 * Atomic Upsert (Create or Update) for Unit + Schedule
 * Uses Postgres RPC for full transaction safety
 */
export async function POST(request: Request) {
  return requireAuthWithRateLimit(request, async () => {
    return validateRequest(unitSyncSchema)(request, async (validatedData) => {
      try {
        const supabase = await createServerClient();

        // Prepare payloads for RPC
        const unitPayload = {
          id: validatedData.id,
          code: validatedData.code,
          name: validatedData.name,
          color: validatedData.color,
          description: validatedData.description,
          location: validatedData.location,
          created_at: validatedData.createdAt,
        };

        const schedulePayload = validatedData.schedule;

        // Call the Atomic RPC Function
        const { data, error } = await supabase.rpc('upsert_unit_with_schedule', {
          p_unit: unitPayload,
          p_schedule: schedulePayload,
        });

        if (error) {
          console.error('RPC Sync Error:', error);
          return jsonError('Failed to sync unit', 500, ERROR_CODES.DATABASE_ERROR, {
            details: error.message,
          });
        }

        return jsonSuccess(data, 200);
      } catch (error) {
        console.error('Sync Endpoint Error:', error);
        return jsonError('Internal sync error', 500, ERROR_CODES.INTERNAL_ERROR);
      }
    });
  });
}
