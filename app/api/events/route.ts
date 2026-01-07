import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { jsonError, jsonSuccess, ERROR_CODES } from '@/app/api/_lib/response';
import { mapEventRow } from '@/app/api/_lib/mappers';
import { requireAuth } from '@/app/api/_lib/middleware';

const eventSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.date(),
  time: z.string().min(1),
  location: z.string().min(1),
  building: z.string().optional(),
  category: z.enum(['Career', 'Social', 'Academic', 'Free Food']),
  imageUrl: z.string().optional(),
  createdAt: z.date().optional(),
});

export async function GET(request: Request) {
  return requireAuth(request, async (_userId) => {
    try {
      const supabase = await createServerClient();
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) {
        return jsonError(error.message, 500, ERROR_CODES.DATABASE_ERROR);
      }

      return jsonSuccess(data?.map(mapEventRow) ?? []);
    } catch (error) {
      console.error('Error fetching events:', error);
      return jsonError('Failed to fetch events', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  });
}

export async function POST(request: Request) {
  return requireAuth(request, async () => {
    try {
      const body = await request.json().catch(() => null);
      const parsed = eventSchema.safeParse(body);

      if (!parsed.success) {
        return jsonError('Invalid event payload.', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      const supabase = await createServerClient();

      const payload = {
        ...parsed.data,
        id: parsed.data.id ?? crypto.randomUUID(),
        createdAt: parsed.data.createdAt ?? new Date(),
      };

      const { data, error } = await supabase
        .from('events')
        .insert({
          id: payload.id,
          title: payload.title,
          description: payload.description,
          event_date: payload.date.toISOString().split('T')[0], // Date only
          event_time: payload.time,
          location: payload.location,
          building: payload.building,
          category: payload.category,
          image_url: payload.imageUrl,
          created_at: payload.createdAt.toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        return jsonError(error.message, 500, ERROR_CODES.DATABASE_ERROR);
      }

      return jsonSuccess(mapEventRow(data), 201);
    } catch (error) {
      console.error('Error creating event:', error);
      return jsonError('Failed to create event', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  });
}
