import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { jsonError } from '@/app/api/_lib/response';
import { mapDeadlineRow, serializeDeadline } from '@/app/api/_lib/mappers';

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

export async function GET() {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('deadlines')
    .select('*')
    .order('due_at', { ascending: true });

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json(data?.map(mapDeadlineRow) ?? []);
}

export async function POST(request: Request) {
  const supabase = createServerClient();
  const body = await request.json().catch(() => null);
  const parsed = deadlineSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError('Invalid deadline payload.', 400);
  }

  const payload = {
    ...parsed.data,
    id: parsed.data.id ?? crypto.randomUUID(),
    createdAt: parsed.data.createdAt ?? new Date(),
  };

  const { data, error } = await supabase
    .from('deadlines')
    .insert(serializeDeadline(payload))
    .select('*')
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json(mapDeadlineRow(data));
}
