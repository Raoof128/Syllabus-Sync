import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { jsonError, jsonSuccess, ERROR_CODES } from '@/app/api/_lib/response';
import { mapDeadlineRow } from '@/app/api/_lib/mappers';
import { requireAuth } from '@/app/api/_lib/middleware';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const dateSchema = z.preprocess((value) => value, z.coerce.date());
const deadlineUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  unitCode: z.string().min(1).optional(),
  dueDate: dateSchema.optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
  type: z.enum(['Assignment', 'Exam', 'Quiz', 'Presentation']).optional(),
  completed: z.boolean().optional(),
  createdAt: dateSchema.optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return requireAuth(request, async (userId) => {
    try {
      const { id } = await params;

      // Validate UUID format
      if (!UUID_REGEX.test(id)) {
        return jsonError('Invalid deadline ID format', 400, ERROR_CODES.BAD_REQUEST);
      }

      const body = await request.json().catch(() => null);
      const parsed = deadlineUpdateSchema.safeParse(body);

      if (!parsed.success) {
        return jsonError('Invalid deadline payload.', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      const supabase = await createServerClient();

      const updatePayload: Record<string, unknown> = {
        ...parsed.data,
      };
      if (parsed.data.unitCode) {
        updatePayload.unit_code = parsed.data.unitCode;
        delete updatePayload.unitCode;
      }
      if (parsed.data.dueDate) {
        updatePayload.due_date = parsed.data.dueDate.toISOString();
        delete updatePayload.dueDate;
      }
      if (parsed.data.createdAt) {
        updatePayload.created_at = parsed.data.createdAt.toISOString();
        delete updatePayload.createdAt;
      }

      const { data, error } = await supabase
        .from('deadlines')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return jsonError('Deadline not found', 404, ERROR_CODES.NOT_FOUND);
        }
        return jsonError(error.message, 500, ERROR_CODES.DATABASE_ERROR);
      }

      return jsonSuccess(mapDeadlineRow(data));
    } catch (error) {
      console.error('Error updating deadline:', error);
      return jsonError('Failed to update deadline', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return requireAuth(request, async (userId) => {
    try {
      const { id } = await params;

      // Validate UUID format
      if (!UUID_REGEX.test(id)) {
        return jsonError('Invalid deadline ID format', 400, ERROR_CODES.BAD_REQUEST);
      }

      const supabase = await createServerClient();
      const { error } = await supabase
        .from('deadlines')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        return jsonError(error.message, 500, ERROR_CODES.DATABASE_ERROR);
      }

      return jsonSuccess({ id });
    } catch (error) {
      console.error('Error deleting deadline:', error);
      return jsonError('Failed to delete deadline', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  });
}
