/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { jsonError, ERROR_CODES } from '@/app/api/_lib/response';
import { requireAuth, requireAuthWithRateLimit, parseJsonBody } from '@/app/api/_lib/middleware';
import { withCSRFProtection } from '@/lib/security/csrf';
import type { Todo } from '@/lib/types';

const dateSchema = z.preprocess((value) => value, z.coerce.date());

const todoSchema = z.object({
  id: z.string().min(1).optional(),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title is too long')
    .regex(/^[^<>]*$/, 'Title contains invalid characters'),
  description: z
    .string()
    .max(1000, 'Description is too long')
    .regex(/^[^<>]*$/, 'Description contains invalid characters')
    .optional(),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  completed: z.boolean().default(false),
  dueDate: dateSchema.optional().nullable(),
  createdAt: dateSchema.optional(),
  completedAt: dateSchema.optional().nullable(),
});

// Map database row to Todo type
const mapTodoRow = (row: Record<string, unknown>): Todo => ({
  id: String(row.id ?? ''),
  title: String(row.title ?? ''),
  description: row.description ? String(row.description) : undefined,
  priority: row.priority as Todo['priority'],
  completed: Boolean(row.completed),
  dueDate: row.due_date ? new Date(row.due_date as string) : undefined,
  createdAt: new Date((row.created_at as string) ?? new Date()),
  completedAt: row.completed_at ? new Date(row.completed_at as string) : undefined,
});

// Serialize Todo for database
const serializeTodo = (todo: Todo & { user_id?: string }) => ({
  id: todo.id,
  user_id: todo.user_id,
  title: todo.title,
  description: todo.description || null,
  priority: todo.priority,
  completed: todo.completed,
  due_date: todo.dueDate?.toISOString() || null,
  created_at: todo.createdAt.toISOString(),
  completed_at: todo.completedAt?.toISOString() || null,
});

export async function GET(request: Request) {
  return requireAuth(request, async (userId) => {
    try {
      const supabase = await createServerClient();
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        return jsonError('A database error occurred', 500, ERROR_CODES.DATABASE_ERROR);
      }

      return NextResponse.json(data?.map(mapTodoRow) ?? []);
    } catch (error) {
      console.error('Todos GET error:', error);
      return jsonError('Internal server error', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  });
}

export async function POST(_request: Request) {
  return withCSRFProtection(async (req) => {
    return requireAuthWithRateLimit(req, async (userId) => {
      try {
        const supabase = await createServerClient();
        const bodyResult = await parseJsonBody(req);
        if (!bodyResult.success) {
          return jsonError(bodyResult.error, 413, ERROR_CODES.VALIDATION_ERROR);
        }
        const parsed = todoSchema.safeParse(bodyResult.data);

        if (!parsed.success) {
          const error: z.ZodError = parsed.error;
          console.error('Todo validation failed:', JSON.stringify(error.issues, null, 2));
          return jsonError('Invalid todo payload.', 400, ERROR_CODES.VALIDATION_ERROR, {
            errors: error.issues,
          });
        }

        const payload = {
          ...parsed.data,
          id: parsed.data.id ?? crypto.randomUUID(),
          user_id: userId,
          createdAt: parsed.data.createdAt ?? new Date(),
          dueDate: parsed.data.dueDate ?? undefined,
          completedAt: parsed.data.completedAt ?? undefined,
        };

        const { data, error } = await supabase
          .from('todos')
          .insert(serializeTodo(payload as Todo & { user_id: string }))
          .select('*')
          .single();

        if (error) {
          console.error('Database error creating todo:', error.code, error.message, error.details);
          return jsonError(
            `Failed to create todo: ${error.message}`,
            500,
            ERROR_CODES.DATABASE_ERROR,
          );
        }

        return NextResponse.json(mapTodoRow(data));
      } catch (error) {
        console.error('Todos POST error:', error);
        return jsonError('Internal server error', 500, ERROR_CODES.INTERNAL_ERROR);
      }
    });
  })(_request as any) as any;
}
