import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import {
  jsonSuccess,
  jsonError,
  handleValidationError,
  handleDatabaseError,
  ERROR_CODES
} from '@/app/api/_lib/response';
import { mapUnitRow, serializeUnit } from '@/app/api/_lib/mappers';
import { requireAuth, validateRequest } from '@/app/api/_lib/middleware';

// ============================================================================
// SCHEMAS & VALIDATION
// ============================================================================

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
  id: z.string().uuid().optional(),
  day: daySchema,
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
});

const dateSchema = z.preprocess((value) => value, z.coerce.date());

const unitSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1).max(20).regex(/^[A-Z]{3}\d{3}$/, 'Unit code must be in format AAA123'),
  name: z.string().min(1).max(200),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'),
  location: z.object({
    building: z.string().min(1).max(100),
    room: z.string().min(1).max(50),
  }),
  schedule: z.array(classTimeSchema).min(0).max(14), // Max 14 class times per week
  createdAt: dateSchema.optional(),
});

const unitQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['code', 'name', 'created_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * GET /api/units - List units with their schedules
 *
 * Query Parameters:
 * - search: Search in unit code or name
 * - limit: Maximum number of results (1-100, default: 50)
 * - offset: Pagination offset (default: 0)
 * - sortBy: Sort field (code, name, created_at; default: created_at)
 * - sortOrder: Sort order (asc, desc; default: desc)
 */
export async function GET(request: Request) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return requireAuth(request, async (_userId) => {
    try {
      const supabase = await createServerClient();
      const url = new URL(request.url);
      const query = unitQuerySchema.parse({
        search: url.searchParams.get('search') || undefined,
        limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
        offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : undefined,
        sortBy: url.searchParams.get('sortBy') || undefined,
        sortOrder: url.searchParams.get('sortOrder') || undefined,
      });

      // Get units with pagination and search
      let unitsQuery = supabase
        .from('units')
        .select('*', { count: 'exact' })
        .order(query.sortBy, { ascending: query.sortOrder === 'asc' });

      // Apply search filter
      if (query.search) {
        unitsQuery = unitsQuery.or(
          `code.ilike.%${query.search}%,name.ilike.%${query.search}%`
        );
      }

      // Apply pagination
      unitsQuery = unitsQuery.range(query.offset, query.offset + query.limit - 1);

      const { data: unitsData, error: unitsError, count } = await unitsQuery;

      if (unitsError) {
        return handleDatabaseError(unitsError);
      }

      // Get unit IDs for class times query
      const unitIds = unitsData?.map(unit => unit.id) ?? [];

      // Get class times for these units
      const { data: classTimesData, error: classTimesError } = await supabase
        .from('class_times')
        .select('*')
        .in('unit_id', unitIds)
        .order('day', { ascending: true });

      if (classTimesError) {
        return handleDatabaseError(classTimesError);
      }

      // Group class times by unit_id
      const classTimesByUnit = (classTimesData ?? []).reduce((acc, ct) => {
        const unitId = String(ct.unit_id);
        if (!acc[unitId]) acc[unitId] = [];

        acc[unitId].push({
          id: String(ct.id),
          day: ct.day as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday',
          startTime: String(ct.start_time),
          endTime: String(ct.end_time),
        });
        return acc;
      }, {} as Record<string, Array<{id: string; day: string; startTime: string; endTime: string}>>);

      // Map units with their class times
      const units = (unitsData ?? []).map(unit => ({
        ...mapUnitRow(unit),
        schedule: classTimesByUnit[String(unit.id)] ?? [],
      }));

      return jsonSuccess(units, 200, {
        pagination: {
          page: Math.floor(query.offset / query.limit) + 1,
          limit: query.limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / query.limit),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleValidationError(error);
      }
      console.error('GET /api/units error:', error);
      return jsonError('Failed to fetch units', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  });
}

/**
 * POST /api/units - Create unit with schedule
 *
 * Request Body:
 * {
 *   "code": "CSC101",
 *   "name": "Introduction to Computer Science",
 *   "color": "#3B82F6",
 *   "location": {
 *     "building": "Engineering Building",
 *     "room": "E101"
 *   },
 *   "schedule": [
 *     {
 *       "day": "Monday",
 *       "startTime": "09:00",
 *       "endTime": "11:00"
 *     },
 *     {
 *       "day": "Wednesday",
 *       "startTime": "09:00",
 *       "endTime": "11:00"
 *     }
 *   ]
 * }
 */
export async function POST(request: Request) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return requireAuth(request, async (_userId) => {
    return validateRequest(unitSchema)(request, async (validatedData) => {
      try {
        const supabase = await createServerClient();
        const { schedule, ...unitData } = validatedData;
        const payload = {
          ...unitData,
          id: unitData.id ?? crypto.randomUUID(),
          createdAt: unitData.createdAt ?? new Date(),
        };

        // Start transaction-like approach for unit and class times
        const { data: unitDataResult, error: unitError } = await supabase
          .from('units')
          .insert(serializeUnit(payload))
          .select('*')
          .single();

        if (unitError) {
          if (unitError.code === '23505') { // Unique constraint violation
            return jsonError('Unit code already exists', 409, ERROR_CODES.CONFLICT);
          }
          return handleDatabaseError(unitError);
        }

        let createdClassTimes: Array<{ id: string; day: string; startTime: string; endTime: string; unit_id?: string }> = [];

        // Insert class times if any
        if (schedule && schedule.length > 0) {
          const classTimesToInsert = schedule.map(ct => ({
            unit_id: unitData.id,
            day: ct.day,
            start_time: ct.startTime,
            end_time: ct.endTime,
          }));

          const { data: classTimesData, error: classTimesError } = await supabase
            .from('class_times')
            .insert(classTimesToInsert)
            .select('*');

          if (classTimesError) {
            // Rollback by deleting the unit (best effort)
            await supabase.from('units').delete().eq('id', unitData.id);
            return handleDatabaseError(classTimesError);
          }

          createdClassTimes = classTimesData?.map(ct => ({
            id: String(ct.id),
            day: ct.day as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday',
            startTime: String(ct.start_time),
            endTime: String(ct.end_time),
          })) ?? [];
        }

        return jsonSuccess({
          ...mapUnitRow(unitData),
          schedule: createdClassTimes,
        }, 201);
      } catch (error) {
        console.error('POST /api/units error:', error);
        return jsonError('Failed to create unit', 500, ERROR_CODES.INTERNAL_ERROR);
      }
    });
  });
}
