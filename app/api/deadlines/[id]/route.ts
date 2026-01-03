import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { jsonError } from '@/app/api/_lib/response';
import { mapDeadlineRow } from '@/app/api/_lib/mappers';

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
  const supabase = await createServerClient();
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = deadlineUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError('Invalid deadline payload.', 400);
  }

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
    .select('*')
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json(mapDeadlineRow(data));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient();
  const { id } = await params;
  const { error } = await supabase.from('deadlines').delete().eq('id', id);

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json({ id });
}
