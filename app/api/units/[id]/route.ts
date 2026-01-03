import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { jsonError } from '@/app/api/_lib/response';
import { mapUnitRow } from '@/app/api/_lib/mappers';

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
  location: z
    .object({
      building: z.string().min(1),
      room: z.string().min(1),
    })
    .optional(),
  schedule: z.array(classTimeSchema).optional(),
  createdAt: dateSchema.optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient();
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = unitUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError('Invalid unit payload.', 400);
  }

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
    .select('*')
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json(mapUnitRow(data));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient();
  const { id } = await params;
  const { error } = await supabase.from('units').delete().eq('id', id);

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json({ id });
}
