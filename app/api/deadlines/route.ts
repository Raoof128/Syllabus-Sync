import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { jsonError, ERROR_CODES } from '@/app/api/_lib/response';
import { mapDeadlineRow, serializeDeadline } from '@/app/api/_lib/mappers';
import { requireAuth, requireAuthWithRateLimit, parseJsonBody } from '@/app/api/_lib/middleware';

const dateSchema = z.preprocess((value) => value, z.coerce.date());
const deadlineSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().min(1),
  unitCode: z.string().min(1),
  unitId: z.string().optional(),
  dueDate: dateSchema,
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  type: z.enum(['Assignment', 'Exam', 'Quiz', 'Presentation']),
  completed: z.boolean(),
  createdAt: dateSchema.optional(),
});

export async function GET(request: Request) {
  return requireAuth(request, async (userId) => {
    try {
      const supabase = await createServerClient();
      // Security: Filter by user_id to prevent IDOR - only return user's own deadlines
      // Exclude soft-deleted records
      const { data, error } = await supabase
        .from('deadlines')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('due_date', { ascending: true });

      if (error) {
        return jsonError('A database error occurred', 500, ERROR_CODES.DATABASE_ERROR);
      }

      return NextResponse.json(data?.map(mapDeadlineRow) ?? []);
    } catch (error) {
      console.error('Deadlines GET error:', error);
      return jsonError('Internal server error', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  });
}

export async function POST(request: Request) {
  // SECURITY: Use rate-limited auth for mutation endpoint
  return requireAuthWithRateLimit(request, async (userId) => {
    try {
      const supabase = await createServerClient();
      // SECURITY: Parse with size limit protection
      const bodyResult = await parseJsonBody(request);
      if (!bodyResult.success) {
        return jsonError(bodyResult.error, 413, ERROR_CODES.VALIDATION_ERROR);
      }
      const parsed = deadlineSchema.safeParse(bodyResult.data);

      if (!parsed.success) {
        return jsonError('Invalid deadline payload.', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      // Resolve unit_id logic:
      // 1. Verify provided unitId exists if present.
      // 2. If not present or invalid, look up by unitCode.
      // 3. If unit doesn't exist, auto-create it to ensure data integrity.

      let unitId = parsed.data.unitId;

      if (unitId) {
        // Verify specific unit exists and belongs to user
        const { count } = await supabase
          .from('units')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('id', unitId);

        if (!count) {
          console.warn(`Provided unitId ${unitId} invalid or not found. Falling back to unitCode.`);
          unitId = undefined;
        }
      }

      if (!unitId && parsed.data.unitCode) {
        // Try to resolve unit_id from unitCode
        const { data: unit } = await supabase
          .from('units')
          .select('id')
          .eq('user_id', userId)
          .eq('code', parsed.data.unitCode)
          .maybeSingle();

        if (unit) {
          unitId = unit.id;
        } else {
          // Auto-create the unit if it doesn't exist
          // This ensures strict referential integrity without blocking the user
          console.log(`Auto-creating unit for code: ${parsed.data.unitCode}`);
           const { data: newUnit, error: createError } = await supabase
            .from('units')
            .insert({
              user_id: userId,
              code: parsed.data.unitCode,
              name: parsed.data.unitCode, // Default name
              color: '#3B82F6', // Default color
            })
            .select('id')
            .single();

           if (newUnit) {
             unitId = newUnit.id;
           } else {
             console.error('Failed to auto-create unit:', createError);
             // One last try: maybe it was created concurrently?
             const { data: retryUnit } = await supabase
               .from('units')
               .select('id')
               .eq('user_id', userId)
               .eq('code', parsed.data.unitCode)
               .maybeSingle();
             if (retryUnit) unitId = retryUnit.id;
           }
        }
      }

      const payload = {
        ...parsed.data,
        id: parsed.data.id ?? crypto.randomUUID(),
        user_id: userId, // Security: Associate deadline with current user
        unitId,
        createdAt: parsed.data.createdAt ?? new Date(),
      };

      const { data, error } = await supabase
        .from('deadlines')
        .insert(serializeDeadline(payload))
        .select('*')
        .single();

      if (error) {
        console.error(
          'Database error creating deadline:',
          error.code,
          error.message,
          error.details,
        );
        // Return actual error for debugging
        return jsonError(`Failed to create deadline: ${error.message}`, 500, ERROR_CODES.DATABASE_ERROR);
      }

      return NextResponse.json(mapDeadlineRow(data));
    } catch (error) {
      console.error('Deadlines POST error:', error);
      return jsonError('Internal server error', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  });
}
