// app/api/sync/route.ts
// ============================================================================
// OFFLINE SYNC API - Conflict Resolution Endpoint
// ============================================================================
// Processes queued offline mutations with version-based conflict detection.
// Uses Last-Write-Wins (LWW) with optional client-override via _forceVersion.

import { createServerClient } from "@/lib/supabase/server";
import {
  jsonSuccess,
  jsonError,
  jsonUnauthorized,
  parseJsonBody,
  BODY_SIZE_LIMITS,
} from "@/app/api/_lib/response";
import { z } from "zod";
import { logger } from "@/lib/logger";

// ============================================================================
// VALIDATION
// ============================================================================

const ALLOWED_TABLES = ["events", "deadlines", "todos"] as const;
type AllowedTable = (typeof ALLOWED_TABLES)[number];

const SyncActionSchema = z.object({
  type: z.enum(["CREATE", "UPDATE", "DELETE"]),
  table: z.enum(ALLOWED_TABLES),
  recordId: z.string().uuid(),
  data: z.record(z.string(), z.unknown()).nullable(),
  clientVersion: z.number().int().min(0),
});

// SECURITY: Allowlist of fields per table that clients can set
const ALLOWED_FIELDS: Record<AllowedTable, string[]> = {
  events: [
    "title",
    "description",
    "location",
    "building",
    "room",
    "category",
    "color",
    "image_url",
    "start_at",
    "end_at",
    "all_day",
    "notification_enabled",
  ],
  deadlines: [
    "title",
    "description",
    "unit_code",
    "unit_id",
    "due_date",
    "priority",
    "type",
    "completed",
    "completed_at",
  ],
  todos: [
    "title",
    "priority",
    "due_date",
    "completed",
    "completed_at",
    "color",
  ],
};

function sanitizePayload(
  table: AllowedTable,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const allowed = ALLOWED_FIELDS[table];
  const sanitized: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in data) {
      sanitized[key] = data[key];
    }
  }
  return sanitized;
}

// ============================================================================
// POST /api/sync - Process a single sync action
// ============================================================================

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonUnauthorized("Not authenticated");
    }

    // Parse and validate request body
    const { data: body, error: parseError } = await parseJsonBody(
      request,
      BODY_SIZE_LIMITS.DEFAULT,
    );
    if (parseError) return parseError;

    const validation = SyncActionSchema.safeParse(body);
    if (!validation.success) {
      return jsonError("Invalid sync action", 400, "VALIDATION_ERROR", {
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { type, table, recordId, data, clientVersion } = validation.data;
    const forceVersion = data?._forceVersion === true;

    // ========================================================================
    // CHECK PERMISSIONS (for shared schedules)
    // ========================================================================
    if (table === "events") {
      // Check if this event belongs to a shared schedule
      const { data: event } = await supabase
        .from("events")
        .select("user_id, schedule_id, version")
        .eq("id", recordId)
        .maybeSingle();

      if (event && event.schedule_id) {
        // Verify user has editor/owner role on the schedule
        const { data: membership } = await supabase
          .from("schedule_members")
          .select("role")
          .eq("schedule_id", event.schedule_id)
          .eq("user_id", user.id)
          .maybeSingle();

        const isOwner = event.user_id === user.id;
        const isEditor =
          membership?.role === "editor" || membership?.role === "owner";

        if (!isOwner && !isEditor) {
          return jsonError("Insufficient permissions", 403);
        }
      }
    }

    // ========================================================================
    // HANDLE SYNC BY TYPE
    // ========================================================================

    if (type === "CREATE") {
      if (!data) {
        return jsonError("Data required for CREATE", 400);
      }

      const sanitized = sanitizePayload(table, data);
      const insertPayload = {
        ...sanitized,
        id: recordId,
        user_id: user.id,
        version: 1,
        last_modified_by: user.id,
      };

      const { data: created, error: insertError } = await supabase
        .from(table)
        .insert(insertPayload)
        .select()
        .single();

      if (insertError) {
        // If record already exists (conflict on INSERT), treat as UPDATE
        if (insertError.code === "23505") {
          return jsonError("Record already exists", 409, "CONFLICT", {
            serverVersion: 1,
            serverData: {},
          });
        }
        logger.error(`Sync CREATE error on ${table}:`, insertError);
        return jsonError("Failed to create record", 500);
      }

      return jsonSuccess(created);
    }

    if (type === "UPDATE") {
      if (!data) {
        return jsonError("Data required for UPDATE", 400);
      }

      // Fetch current server version
      const { data: current, error: fetchError } = await supabase
        .from(table)
        .select("*")
        .eq("id", recordId)
        .maybeSingle();

      if (fetchError || !current) {
        return jsonError("Record not found", 404);
      }

      // SECURITY: Never trust client timestamps or versions blindly
      const serverVersion = current.version ?? 1;

      // Version conflict check
      if (!forceVersion && clientVersion < serverVersion) {
        // 409 Conflict: server has a newer version
        return new Response(
          JSON.stringify({
            error: "Version conflict",
            serverVersion,
            serverData: current,
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Apply the update
      const sanitized = sanitizePayload(table, data);
      const updatePayload = {
        ...sanitized,
        version: serverVersion + 1,
        last_modified_by: user.id,
        updated_at: new Date().toISOString(),
      };

      const { data: updated, error: updateError } = await supabase
        .from(table)
        .update(updatePayload)
        .eq("id", recordId)
        .select()
        .single();

      if (updateError) {
        logger.error(`Sync UPDATE error on ${table}:`, updateError);
        return jsonError("Failed to update record", 500);
      }

      return jsonSuccess(updated);
    }

    if (type === "DELETE") {
      // Soft-delete: set is_deleted = true (preserve for sync)
      const { error: deleteError } = await supabase
        .from(table)
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          last_modified_by: user.id,
        })
        .eq("id", recordId);

      if (deleteError) {
        logger.error(`Sync DELETE error on ${table}:`, deleteError);
        return jsonError("Failed to delete record", 500);
      }

      return jsonSuccess({ id: recordId, deleted: true });
    }

    return jsonError("Invalid action type", 400);
  } catch (error) {
    logger.error("Sync API error:", error);
    return jsonError("Internal server error", 500);
  }
}
