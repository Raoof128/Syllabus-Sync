// import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import {
  jsonSuccess,
  jsonError,
  handleValidationError,
  handleDatabaseError,
  ERROR_CODES,
} from '@/app/api/_lib/response';
import { mapUnitRow } from '@/app/api/_lib/mappers';
import { requireAuth, requireAuthWithRateLimit, validateRequest } from '@/app/api/_lib/middleware';
import { logger } from '@/lib/logger';
import { isValidBuilding } from '@/lib/utils/buildingValidation';

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
  code: z
    .string()
    .min(1, 'Unit code is required')
    .max(20, 'Unit code must be 20 characters or less')
    .regex(/^[^<>]*$/, 'Unit code contains invalid characters') // XSS prevention
    .transform((val) => val.trim().toUpperCase()), // Normalize: trim and uppercase
  name: z
    .string()
    .min(1, 'Unit name is required')
    .max(200)
    .regex(/^[^<>]*$/, 'Unit name contains invalid characters'), // XSS prevention
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
    .default('#3B82F6'),
  description: z
    .string()
    .max(500)
    .regex(/^[^<>]*$/, 'Description contains invalid characters') // XSS prevention
    .optional(),
  location: z
    .object({
      building: z
        .string()
        .max(100)
        .regex(/^[^<>]*$/, 'Building contains invalid characters')
        .default(''),
      room: z
        .string()
        .max(50)
        .regex(/^[^<>]*$/, 'Room contains invalid characters')
        .default(''),
    })
    .optional()
    .default({ building: '', room: '' }),
  schedule: z.array(classTimeSchema).optional().default([]), // Max 14 class times per week
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
 * Sanitize search input to prevent SQL injection via LIKE patterns
 * Escapes special characters: %, _, \
 */
function sanitizeSearchInput(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&');
}

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
  return requireAuth(request, async (userId) => {
    try {
      const supabase = await createServerClient();
      const url = new URL(request.url);
      const query = unitQuerySchema.parse({
        search: url.searchParams.get('search') || undefined,
        limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
        offset: url.searchParams.get('offset')
          ? parseInt(url.searchParams.get('offset')!)
          : undefined,
        sortBy: url.searchParams.get('sortBy') || undefined,
        sortOrder: url.searchParams.get('sortOrder') || undefined,
      });

      // Get units with pagination and search - SECURITY: filter by user_id to prevent IDOR
      // Exclude soft-deleted records
      let unitsQuery = supabase
        .from('units')
        .select('*', { count: 'exact' })
        .eq('user_id', userId) // Security: Only return user's own units
        .is('deleted_at', null) // Exclude soft-deleted
        .order(query.sortBy, { ascending: query.sortOrder === 'asc' });

      // Apply search filter (sanitized to prevent SQL injection)
      if (query.search) {
        const sanitizedSearch = sanitizeSearchInput(query.search);
        unitsQuery = unitsQuery.or(
          `code.ilike.%${sanitizedSearch}%,name.ilike.%${sanitizedSearch}%`,
        );
      }

      // Apply pagination
      unitsQuery = unitsQuery.range(query.offset, query.offset + query.limit - 1);

      const { data: unitsData, error: unitsError, count } = await unitsQuery;

      if (unitsError) {
        return handleDatabaseError(unitsError);
      }

      // Get unit IDs for class times query
      const unitIds = unitsData?.map((unit: { id: unknown }) => String(unit.id)) ?? [];

      // Avoid `.in()` with an empty list (can error in PostgREST)
      if (unitIds.length === 0) {
        return jsonSuccess([], 200, {
          pagination: {
            page: Math.floor(query.offset / query.limit) + 1,
            limit: query.limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / query.limit),
          },
        });
      }

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
      const classTimesByUnit = ((classTimesData ?? []) as unknown[]).reduce(
        (
          acc: Record<
            string,
            Array<{
              id: string;
              day:
                | 'Monday'
                | 'Tuesday'
                | 'Wednesday'
                | 'Thursday'
                | 'Friday'
                | 'Saturday'
                | 'Sunday';
              startTime: string;
              endTime: string;
            }>
          >,
          ct: unknown,
        ) => {
          const c = ct as Record<string, unknown>;
          const unitId = String(c.unit_id);
          if (!acc[unitId]) acc[unitId] = [];

          acc[unitId].push({
            id: String(c.id),
            day: String(c.day) as
              | 'Monday'
              | 'Tuesday'
              | 'Wednesday'
              | 'Thursday'
              | 'Friday'
              | 'Saturday'
              | 'Sunday',
            startTime: String(c.start_time),
            endTime: String(c.end_time),
          });
          return acc;
        },
        {} as Record<
          string,
          Array<{
            id: string;
            day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
            startTime: string;
            endTime: string;
          }>
        >,
      );

      // Map units with their class times
      const units = (unitsData ?? []).map((unit: unknown) => {
        const u = unit as Record<string, unknown>;
        return {
          ...mapUnitRow(u),
          schedule: classTimesByUnit[String(u.id)] ?? [],
        };
      });

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
      logger.error(
        'GET /api/units error:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return jsonError('Failed to fetch units', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  });
}

/**
 * POST /api/units - Create unit with schedule
 * SECURITY: Rate limited to prevent abuse
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
  // SECURITY: Rate-limited auth for mutation. CSRF is enforced at proxy level.
  return requireAuthWithRateLimit(request, async (userId) => {
    return validateRequest(unitSchema)(request, async (validatedData) => {
      try {
        const supabase = await createServerClient();
        const { schedule, location, ...unitData } = validatedData;

        // VALIDATION: Check building against the 118 supported buildings
        const building = location?.building;
        if (building && building.trim() !== '' && !isValidBuilding(building)) {
          return jsonError(
            'Building not found in the campus list. Please select a valid building.',
            400,
            ERROR_CODES.VALIDATION_ERROR,
            { field: 'location.building', value: building },
          );
        }

        // 1. Insert Unit
        const unitId = unitData.id || crypto.randomUUID();
        const unitPayload = {
          id: unitId,
          user_id: userId,
          code: unitData.code,
          name: unitData.name,
          color: unitData.color,
          location: location
            ? { building: location.building || '', room: location.room || '' }
            : null,
          description: unitData.description || null,
          created_at: unitData.createdAt
            ? unitData.createdAt.toISOString()
            : new Date().toISOString(),
        };

        const { data: unit, error: unitError } = await supabase
          .from('units')
          .insert(unitPayload)
          .select()
          .single();

        if (unitError) {
          logger.error(
            'Unit insert error:',
            unitError.code,
            unitError.message,
            unitError.details,
            unitError.hint,
          );
          if (unitError.code === '23505') {
            // Unique constraint violation
            return jsonError('Unit code already exists', 409, ERROR_CODES.CONFLICT);
          }
          return handleDatabaseError(unitError);
        }

        type ClassTimeRow = {
          id: string;
          day: string;
          start_time: string;
          end_time: string;
        };

        // 2. Insert Class Times (if any)
        let insertedSchedule: ClassTimeRow[] = [];
        if (schedule && schedule.length > 0) {
          const classTimesPayload = schedule.map((ct) => ({
            id: ct.id || crypto.randomUUID(),
            unit_id: unitId,
            day: ct.day,
            start_time: ct.startTime,
            end_time: ct.endTime,
          }));

          const { data: classTimesRaw, error: scheduleError } = await supabase
            .from('class_times')
            .insert(classTimesPayload)
            .select();

          if (scheduleError) {
            // Rollback: Delete the unit if schedule insertion fails
            // This mimics the atomic transaction of the RPC
            await supabase.from('units').delete().eq('id', unitId);
            return handleDatabaseError(scheduleError);
          }

          insertedSchedule = ((classTimesRaw ?? []) as unknown[]).map((row) => row as ClassTimeRow);
        }

        // 3. Construct Response
        const responseData = {
          ...mapUnitRow(unit),
          schedule: insertedSchedule.map((ct) => ({
            id: ct.id,
            day: ct.day,
            startTime: ct.start_time,
            endTime: ct.end_time,
          })),
        };

        return jsonSuccess(responseData, 201);
      } catch (error) {
        logger.error(
          'POST /api/units error:',
          error instanceof Error ? error.message : 'Unknown error',
        );
        return jsonError('Failed to create unit', 500, ERROR_CODES.INTERNAL_ERROR);
      }
    });
  });
}
