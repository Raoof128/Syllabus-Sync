// import { NextRequest } from 'next/server';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import {
  jsonSuccess,
  jsonError,
  handleValidationError,
  handleDatabaseError,
  ERROR_CODES,
} from '@/app/api/_lib/response';
import { mapNotificationRow } from '@/app/api/_lib/mappers';
import { requireAuth, validateRequest } from '@/app/api/_lib/middleware';
import { withCSRFProtection } from '@/lib/security/csrf';

// ============================================================================
// SCHEMAS & VALIDATION
// ============================================================================

const notificationSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  type: z.enum(['deadline', 'event', 'class', 'system']),
  read: z.boolean().default(false),
  link: z.string().url().optional(),
  relatedId: z.string().uuid().optional(),
  createdAt: z.date().optional(),
});

const notificationQuerySchema = z.object({
  type: z.enum(['deadline', 'event', 'class', 'system']).optional(),
  read: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// ============================================================================
// API ROUTES
// ============================================================================

/**
 * GET /api/notifications - List notifications
 *
 * Query Parameters:
 * - type: Filter by notification type
 * - read: Filter by read status (true/false)
 * - limit: Maximum number of results (1-100, default: 50)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: Request) {
  return requireAuth(request, async (userId) => {
    try {
      const supabase = await createServerClient();
      const url = new URL(request.url);
      const query = notificationQuerySchema.parse({
        type: url.searchParams.get('type') || undefined,
        read: url.searchParams.get('read') ? url.searchParams.get('read') === 'true' : undefined,
        limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
        offset: url.searchParams.get('offset')
          ? parseInt(url.searchParams.get('offset')!)
          : undefined,
      });

      let queryBuilder = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .is('deleted_at', null) // Exclude soft-deleted
        .order('created_at', { ascending: false });

      // Apply filters
      if (query.type) {
        queryBuilder = queryBuilder.eq('type', query.type);
      }
      if (query.read !== undefined) {
        queryBuilder = queryBuilder.eq('read', query.read);
      }

      // Apply pagination
      queryBuilder = queryBuilder.range(query.offset, query.offset + query.limit - 1);

      const { data, error, count } = await queryBuilder;

      if (error) {
        return handleDatabaseError(error);
      }

      const notifications = data?.map(mapNotificationRow) ?? [];

      return jsonSuccess(notifications, 200, {
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
      console.error('GET /api/notifications error:', error);
      return jsonError('Failed to fetch notifications', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  });
}

/**
 * POST /api/notifications - Create notification
 *
 * Request Body:
 * {
 *   "title": "Assignment Due Soon",
 *   "message": "Your assignment is due in 2 days",
 *   "type": "deadline",
 *   "read": false,
 *   "link": "/calendar",
 *   "relatedId": "uuid"
 * }
 */
export async function POST(_request: Request) {
  // Note: We cast the return of withCSRFProtection to any to bypass strict RouteHandlerConfig validation
  // in Next.js 16 when using higher-order functions that wrap Request handlers.
  return withCSRFProtection(async (req) => {
    return requireAuth(req, async (userId) => {
      return validateRequest(notificationSchema)(req, async (validatedData) => {
        try {
          const supabase = await createServerClient();
          const payload = {
            ...validatedData,
            id: validatedData.id ?? crypto.randomUUID(),
            createdAt: validatedData.createdAt ?? new Date(),
          };

          const { data, error } = await supabase
            .from('notifications')
            .insert({
              id: payload.id,
              user_id: userId,
              title: payload.title,
              message: payload.message,
              type: payload.type,
              read: payload.read,
              link: payload.link,
              related_id: payload.relatedId,
              created_at: payload.createdAt.toISOString(),
            })
            .select('*')
            .single();

          if (error) {
            if (error.code === '23505') {
              // Unique constraint violation
              return jsonError('Notification already exists', 409, ERROR_CODES.CONFLICT);
            }
            return handleDatabaseError(error);
          }

          return jsonSuccess(mapNotificationRow(data), 201);
        } catch (error) {
          console.error('POST /api/notifications error:', error);
          return jsonError('Failed to create notification', 500, ERROR_CODES.INTERNAL_ERROR);
        }
      });
    }) as any;
  })(_request as any) as any;
}
