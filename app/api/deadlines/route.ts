import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { jsonError, ERROR_CODES } from '@/app/api/_lib/response';
import { mapDeadlineRow, serializeDeadline } from '@/app/api/_lib/mappers';
import { requireAuth } from '@/app/api/_lib/middleware';

const dateSchema = z.preprocess((value) => value, z.coerce.date());
const deadlineSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().min(1),
  unitCode: z.string().min(1),
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
      const { data, error } = await supabase
        .from('deadlines')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Database error:', error);
        return jsonError('Failed to fetch deadlines', 500, ERROR_CODES.DATABASE_ERROR);
      }

      return NextResponse.json(data?.map(mapDeadlineRow) ?? []);
    } catch (error) {
      console.error('Deadlines GET error:', error);
      return jsonError('Internal server error', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  });
}

export async function POST(request: Request) {
  return requireAuth(request, async (userId) => {
    try {
      const supabase = await createServerClient();
      const body = await request.json().catch(() => null);
      const parsed = deadlineSchema.safeParse(body);

      if (!parsed.success) {
        return jsonError('Invalid deadline payload.', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      const payload = {
        ...parsed.data,
        id: parsed.data.id ?? crypto.randomUUID(),
        user_id: userId, // Security: Associate deadline with current user
        createdAt: parsed.data.createdAt ?? new Date(),
      };

      const { data, error } = await supabase
        .from('deadlines')
        .insert(serializeDeadline(payload))
        .select('*')
        .single();

      if (error) {
        console.error('Database error:', error);
        return jsonError('Failed to create deadline', 500, ERROR_CODES.DATABASE_ERROR);
      }

      return NextResponse.json(mapDeadlineRow(data));
    } catch (error) {
      console.error('Deadlines POST error:', error);
      return jsonError('Internal server error', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  });
}
