import { createServerClient } from "@/lib/supabase/server";
import { jsonSuccess, jsonError, ERROR_CODES } from "@/app/api/_lib/response";
import {
  requireAuthWithRateLimit,
  validateRequest,
} from "@/app/api/_lib/middleware";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { isValidBuilding } from "@/lib/utils/buildingValidation";

// ============================================================================
// SCHEMAS
// ============================================================================

const daySchema = z.enum([
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]);

const classTimeSchema = z.object({
  id: z.string().optional(),
  day: daySchema,
  startTime: z.string(),
  endTime: z.string(),
});

const unitSyncSchema = z
  .object({
    id: z.string().uuid().optional(),
    code: z.string().min(1),
    name: z.string().min(1),
    color: z.string().optional(),
    description: z.string().optional().nullable(),
    location: z
      .object({
        building: z.string().optional().default(""),
        room: z.string().optional().default(""),
      })
      .optional()
      .nullable(),
    schedule: z.array(classTimeSchema).optional().default([]),
    createdAt: z.union([z.string(), z.date()]).optional(), // Accept both string and Date
  })
  .passthrough(); // Allow extra fields to pass through

/**
 * POST /api/units/sync
 * Atomic Upsert (Create or Update) for Unit + Schedule
 * Uses Postgres RPC for full transaction safety
 */
export async function POST(request: Request) {
  return requireAuthWithRateLimit(request, async () => {
    return validateRequest(unitSyncSchema)(request, async (validatedData) => {
      try {
        // VALIDATION: Check building against the 118 supported buildings
        const building = validatedData.location?.building;
        if (building && building.trim() !== "" && !isValidBuilding(building)) {
          return jsonError(
            "Building not found in the campus list. Please select a valid building.",
            400,
            ERROR_CODES.VALIDATION_ERROR,
            { field: "location.building", value: building },
          );
        }

        const supabase = await createServerClient();

        // Normalize createdAt to ISO string if it's a Date
        const createdAt =
          validatedData.createdAt instanceof Date
            ? validatedData.createdAt.toISOString()
            : validatedData.createdAt;

        // Prepare payloads for RPC
        const unitPayload = {
          id: validatedData.id,
          code: validatedData.code,
          name: validatedData.name,
          color: validatedData.color,
          description: validatedData.description,
          location: validatedData.location || { building: "", room: "" },
          created_at: createdAt,
        };

        const schedulePayload = validatedData.schedule || [];

        // Call the Atomic RPC Function
        const { data, error } = await supabase.rpc(
          "upsert_unit_with_schedule",
          {
            p_unit: unitPayload,
            p_schedule: schedulePayload,
          },
        );

        if (error) {
          logger.error("RPC Sync Error:", error);

          // Handle duplicate key error - this means we need to update, not insert
          if (
            error.code === "23505" ||
            error.message?.includes("duplicate key")
          ) {
            return jsonError(
              "Unit code already exists",
              409,
              ERROR_CODES.CONFLICT,
              {
                details:
                  "A unit with this code already exists for your account.",
              },
            );
          }

          return jsonError(
            "Failed to sync unit",
            500,
            ERROR_CODES.DATABASE_ERROR,
            {
              details: error.message,
            },
          );
        }

        return jsonSuccess(data, 200);
      } catch (error) {
        logger.error("Sync Endpoint Error:", error);
        return jsonError(
          "Internal sync error",
          500,
          ERROR_CODES.INTERNAL_ERROR,
        );
      }
    });
  });
}
