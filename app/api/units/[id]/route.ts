import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { jsonError, jsonSuccess, ERROR_CODES } from '@/app/api/_lib/response';
import { mapUnitRow } from '@/app/api/_lib/mappers';
import { requireAuthWithRateLimit, parseJsonBody } from '@/app/api/_lib/middleware';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  id: z.string().min(1),
  day: daySchema,
  startTime: z.string().min(1),
  endTime: z.string().min(1),
});
const dateSchema = z.preprocess((value) => value, z.coerce.date());
const unitUpdateSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  location: z
    .object({
      building: z.string().default(''),
      room: z.string().default(''),
    })
    .optional(),
  schedule: z.array(classTimeSchema).optional(),
  createdAt: dateSchema.optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // SECURITY: Use rate-limited auth for mutation endpoint
  return requireAuthWithRateLimit(request, async (userId) => {
    try {
      const { id } = await params;

      // Validate UUID format
      if (!UUID_REGEX.test(id)) {
        return jsonError('Invalid unit ID format', 400, ERROR_CODES.BAD_REQUEST);
      }

      // SECURITY: Parse with size limit protection
      const bodyResult = await parseJsonBody(request);
      if (!bodyResult.success) {
        return jsonError(bodyResult.error, 413, ERROR_CODES.VALIDATION_ERROR);
      }
      const parsed = unitUpdateSchema.safeParse(bodyResult.data);

      if (!parsed.success) {
        return jsonError('Invalid unit payload.', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      const supabase = await createServerClient();

      const updatePayload: Record<string, unknown> = {
        ...parsed.data,
      };
      if (parsed.data.createdAt) {
        updatePayload.created_at = parsed.data.createdAt.toISOString();
        delete updatePayload.createdAt;
      }

      const { data, error } = await supabase
        .from('units')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) {
        // SECURITY: Log actual error server-side, return generic message to client
        console.error('Database error updating unit:', error.code, error.message);
        if (error.code === 'PGRST116') {
          return jsonError('Unit not found', 404, ERROR_CODES.NOT_FOUND);
        }
        return jsonError('Database operation failed', 500, ERROR_CODES.DATABASE_ERROR);
      }

      return jsonSuccess(mapUnitRow(data));
    } catch (error) {
      console.error('Error updating unit:', error);
      return jsonError('Failed to update unit', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // SECURITY: Use rate-limited auth for mutation endpoint
  return requireAuthWithRateLimit(request, async (userId) => {
    try {
      const { id } = await params;

      // Validate UUID format
      if (!UUID_REGEX.test(id)) {
        return jsonError('Invalid unit ID format', 400, ERROR_CODES.BAD_REQUEST);
      }

      const supabase = await createServerClient();
      const { error } = await supabase.from('units').delete().eq('id', id).eq('user_id', userId);

      if (error) {
        // SECURITY: Log actual error server-side, return generic message to client
        console.error('Database error deleting unit:', error.code, error.message);
        return jsonError('Database operation failed', 500, ERROR_CODES.DATABASE_ERROR);
      }

      return jsonSuccess({ id });
    } catch (error) {
      console.error('Error deleting unit:', error);
      return jsonError('Failed to delete unit', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  });
}
