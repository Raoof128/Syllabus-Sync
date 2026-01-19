import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { jsonError, jsonSuccess, ERROR_CODES } from '@/app/api/_lib/response';
import { mapEventRow, serializeEvent } from '@/app/api/_lib/mappers';
import { requireAuth, requireAuthWithRateLimit, parseJsonBody } from '@/app/api/_lib/middleware';
import type { Event } from '@/lib/types';

// Schema matching the database: start_at, end_at, all_day
const eventSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  location: z.string().min(1),
  building: z.string().optional(),
  category: z.enum(['Career', 'Social', 'Academic', 'Free Food']),
  imageUrl: z.string().optional(),
  // Primary time fields
  startAt: z.preprocess((val) => (typeof val === 'string' ? new Date(val) : val), z.date()),
  endAt: z.preprocess(
    (val) => (val ? (typeof val === 'string' ? new Date(val) : val) : undefined),
    z.date().optional(),
  ),
  allDay: z.boolean().default(false),
});

export async function GET(request: Request) {
  return requireAuth(request, async (userId) => {
    try {
      const supabase = await createServerClient();
      // Security: Return public events (user_id IS NULL) OR user's own events
      // This allows shared campus events while protecting user-specific data
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .is('deleted_at', null) // Exclude soft-deleted events
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .order('start_at', { ascending: true });

      if (error) {
        // SECURITY: Don't expose internal database error messages to clients
        console.error('Database error fetching events:', error.code, error.message);
        return jsonError('Database operation failed', 500, ERROR_CODES.DATABASE_ERROR);
      }

      return jsonSuccess(data?.map(mapEventRow) ?? []);
    } catch (error) {
      console.error(
        'Error fetching events:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return jsonError('Failed to fetch events', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  });
}

export async function POST(request: Request) {
  // SECURITY: Use rate-limited auth for mutation endpoint
  return requireAuthWithRateLimit(request, async (userId) => {
    try {
      // SECURITY: Parse with size limit protection
      const bodyResult = await parseJsonBody(request);
      if (!bodyResult.success) {
        return jsonError(bodyResult.error, 413, ERROR_CODES.VALIDATION_ERROR);
      }
      const parsed = eventSchema.safeParse(bodyResult.data);

      if (!parsed.success) {
        console.error('Event validation failed:', parsed.error.issues);
        return jsonError('Invalid event payload.', 400, ERROR_CODES.VALIDATION_ERROR);
      }

      const supabase = await createServerClient();

      // Create Event object for serialization
      const eventData: Event & { user_id: string } = {
        id: parsed.data.id ?? crypto.randomUUID(),
        user_id: userId, // Security: Associate event with current user
        title: parsed.data.title,
        description: parsed.data.description,
        location: parsed.data.location,
        building: parsed.data.building,
        category: parsed.data.category,
        imageUrl: parsed.data.imageUrl,
        startAt: parsed.data.startAt,
        endAt: parsed.data.endAt,
        allDay: parsed.data.allDay,
        // Computed fields for backward compatibility
        date: parsed.data.startAt,
        time: parsed.data.allDay
          ? ''
          : parsed.data.startAt.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            }),
      };

      const { data, error } = await supabase
        .from('events')
        .insert(serializeEvent(eventData))
        .select('*')
        .single();

      if (error) {
        // SECURITY: Don't expose internal database error messages to clients
        console.error('Database error creating event:', error.code, error.message);
        return jsonError('Database operation failed', 500, ERROR_CODES.DATABASE_ERROR);
      }

      return jsonSuccess(mapEventRow(data), 201);
    } catch (error) {
      console.error(
        'Error creating event:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return jsonError('Failed to create event', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  });
}
