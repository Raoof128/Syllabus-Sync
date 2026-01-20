import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { jsonError, jsonSuccess, ERROR_CODES } from '@/app/api/_lib/response';
import { mapUnitRow } from '@/app/api/_lib/mappers';
import { requireAuthWithRateLimit, parseJsonBody } from '@/app/api/_lib/middleware';

// More permissive UUID validation - accepts any valid UUID format
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Helper to check if ID is valid (UUID or other formats for legacy data)
function isValidId(id: string): boolean {
  if (!id || id.trim() === '') return false;
  if (UUID_REGEX.test(id)) return true;
  if (/^\d+$/.test(id)) return true;
  if (/^[a-zA-Z0-9_-]+$/.test(id)) return true;
  return false;
}

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
  color: z.string().min(1).optional(),
  description: z.string().max(500).optional(),
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

      // Validate ID format
      if (!isValidId(id)) {
        console.warn('Invalid unit ID received for PUT:', id);
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

      // Destructure to handle special fields - schedule is stored in class_times table, not units
      const { location, schedule, createdAt, ...rest } = parsed.data;

      const updatePayload: Record<string, unknown> = {
        ...rest,
      };

      // Map location object to JSONB column (not flat columns)
      if (location) {
        updatePayload.location = {
          building: location.building ?? '',
          room: location.room ?? '',
        };
      }

      // Map createdAt to created_at
      if (createdAt) {
        updatePayload.created_at = createdAt.toISOString();
      }

      // Handle schedule updates (stored in separate class_times table)
      if (schedule && schedule.length >= 0) {
        // Delete existing class times for this unit
        const { error: deleteError } = await supabase
          .from('class_times')
          .delete()
          .eq('unit_id', id);

        if (deleteError) {
          console.error('Error deleting class times:', deleteError.code, deleteError.message);
          return jsonError('Database operation failed', 500, ERROR_CODES.DATABASE_ERROR);
        }

        // Insert new class times if any
        if (schedule.length > 0) {
          const classTimesPayload = schedule.map((ct) => ({
            id: ct.id && UUID_REGEX.test(ct.id) ? ct.id : crypto.randomUUID(),
            unit_id: id,
            day: ct.day,
            start_time: ct.startTime,
            end_time: ct.endTime,
          }));

          const { error: insertError } = await supabase
            .from('class_times')
            .insert(classTimesPayload);

          if (insertError) {
            console.error('Error inserting class times:', insertError.code, insertError.message);
            return jsonError('Database operation failed', 500, ERROR_CODES.DATABASE_ERROR);
          }
        }
      }

      // If payload is empty (e.g. only schedule updated), fetch current unit to return it
      if (Object.keys(updatePayload).length === 0) {
        const { data, error } = await supabase
          .from('units')
          .select('*')
          .eq('id', id)
          .eq('user_id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return jsonError('Unit not found', 404, ERROR_CODES.NOT_FOUND);
          }
          return jsonError('Database operation failed', 500, ERROR_CODES.DATABASE_ERROR);
        }

        // Fetch class times for this unit
        const { data: classTimesData } = await supabase
          .from('class_times')
          .select('*')
          .eq('unit_id', id);

        const unitSchedule = (classTimesData ?? []).map((ct: Record<string, unknown>) => ({
          id: String(ct.id),
          day: String(ct.day) as
            | 'Monday'
            | 'Tuesday'
            | 'Wednesday'
            | 'Thursday'
            | 'Friday'
            | 'Saturday'
            | 'Sunday',
          startTime: String(ct.start_time),
          endTime: String(ct.end_time),
        }));

        return jsonSuccess({
          ...mapUnitRow(data),
          schedule: unitSchedule,
        });
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
        if (error.code === '23505') {
          return jsonError('Unit code already exists', 409, ERROR_CODES.CONFLICT);
        }
        return jsonError('Database operation failed', 500, ERROR_CODES.DATABASE_ERROR);
      }

      // Fetch class times for this unit
      const { data: classTimesData } = await supabase
        .from('class_times')
        .select('*')
        .eq('unit_id', id);

      const unitSchedule = (classTimesData ?? []).map((ct: Record<string, unknown>) => ({
        id: String(ct.id),
        day: String(ct.day) as
          | 'Monday'
          | 'Tuesday'
          | 'Wednesday'
          | 'Thursday'
          | 'Friday'
          | 'Saturday'
          | 'Sunday',
        startTime: String(ct.start_time),
        endTime: String(ct.end_time),
      }));

      return jsonSuccess({
        ...mapUnitRow(data),
        schedule: unitSchedule,
      });
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

      // Validate ID format
      if (!isValidId(id)) {
        console.warn('Invalid unit ID received for DELETE:', id);
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
