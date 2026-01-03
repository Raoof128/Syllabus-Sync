import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { jsonError } from '@/app/api/_lib/response';
import { mapUnitRow, serializeUnit } from '@/app/api/_lib/mappers';

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
const unitSchema = z.object({
  id: z.string().min(1).optional(),
  code: z.string().min(1),
  name: z.string().min(1),
  color: z.string().min(1),
  location: z.object({
    building: z.string().min(1),
    room: z.string().min(1),
  }),
  schedule: z.array(classTimeSchema),
  createdAt: dateSchema.optional(),
});

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('units')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json(data?.map(mapUnitRow) ?? []);
}

export async function POST(request: Request) {
  const supabase = createServerClient();
  const body = await request.json().catch(() => null);
  const parsed = unitSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError('Invalid unit payload.', 400);
  }

  const payload = {
    ...parsed.data,
    id: parsed.data.id ?? crypto.randomUUID(),
    createdAt: parsed.data.createdAt ?? new Date(),
  };

  const { data, error } = await supabase
    .from('units')
    .insert(serializeUnit(payload))
    .select('*')
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json(mapUnitRow(data));
}
