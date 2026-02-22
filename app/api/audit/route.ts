/**
 * Audit Logs API Endpoint
 *
 * SECURITY: This endpoint provides access to audit logs for the current user.
 * Only authenticated users can access their own audit logs.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { jsonError, ERROR_CODES } from "@/app/api/_lib/response";
import { requireAuth } from "@/app/api/_lib/middleware";
import { getClientIP } from "@/lib/security/ip";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

// ============================================================================
// GET HANDLER - Fetch audit logs
// ============================================================================

export async function GET(request: NextRequest) {
  return requireAuth(request, async (userId: string) => {
    try {
      const supabase = await createServerClient();
      const searchParams = request.nextUrl.searchParams;

      // Parse query parameters
      const limit = parseInt(searchParams.get("limit") || "100", 10);
      const offset = parseInt(searchParams.get("offset") || "0", 10);
      const action = searchParams.get("action") || undefined;
      const severity = searchParams.get("severity") || undefined;
      const startDate = searchParams.get("startDate") || undefined;
      const endDate = searchParams.get("endDate") || undefined;

      // Validate limit
      if (limit < 1 || limit > 1000) {
        return jsonError(
          "Limit must be between 1 and 1000",
          400,
          ERROR_CODES.BAD_REQUEST,
        );
      }

      // Validate offset
      if (offset < 0) {
        return jsonError(
          "Offset must be non-negative",
          400,
          ERROR_CODES.BAD_REQUEST,
        );
      }

      // Validate action
      const validActions = [
        "CREATE",
        "READ",
        "UPDATE",
        "DELETE",
        "LOGIN",
        "LOGOUT",
        "PASSWORD_CHANGE",
        "PASSWORD_RESET",
        "EMAIL_CHANGE",
        "MFA_ENABLE",
        "MFA_DISABLE",
        "MFA_BACKUP_CODE_USED",
        "API_KEY_CREATE",
        "API_KEY_REVOKE",
        "SETTINGS_CHANGE",
        "EXPORT",
        "IMPORT",
        "SESSION_TERMINATED",
        "SECURITY_EVENT",
        "RATE_LIMIT_EXCEEDED",
        "IP_ANOMALY_DETECTED",
        "DEVICE_FINGERPRINT_CHANGED",
        "SUSPICIOUS_ACTIVITY",
      ];

      if (action && !validActions.includes(action)) {
        return jsonError(
          "Invalid action parameter",
          400,
          ERROR_CODES.BAD_REQUEST,
        );
      }

      // Validate severity
      const validSeverities = ["info", "warning", "critical"];
      if (severity && !validSeverities.includes(severity)) {
        return jsonError(
          "Invalid severity parameter",
          400,
          ERROR_CODES.BAD_REQUEST,
        );
      }

      // Validate dates
      let parsedStartDate: Date | undefined;
      let parsedEndDate: Date | undefined;

      if (startDate) {
        parsedStartDate = new Date(startDate);
        if (isNaN(parsedStartDate.getTime())) {
          return jsonError(
            "Invalid startDate format",
            400,
            ERROR_CODES.BAD_REQUEST,
          );
        }
      }

      if (endDate) {
        parsedEndDate = new Date(endDate);
        if (isNaN(parsedEndDate.getTime())) {
          return jsonError(
            "Invalid endDate format",
            400,
            ERROR_CODES.BAD_REQUEST,
          );
        }
      }

      // Fetch audit logs
      const { data: logs, error } = await supabase.rpc("get_my_audit_logs", {
        p_limit: limit,
        p_offset: offset,
        p_action: action || null,
        p_severity: severity || null,
        p_start_date: parsedStartDate?.toISOString() || null,
        p_end_date: parsedEndDate?.toISOString() || null,
      });

      if (error) {
        logger.error("Failed to fetch audit logs:", error);
        return jsonError(
          "Failed to fetch audit logs",
          500,
          ERROR_CODES.INTERNAL_ERROR,
        );
      }

      // Get total count
      const { count, error: countError } = await supabase
        .from("audit_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (countError) {
        logger.error("Failed to count audit logs:", countError);
      }

      return NextResponse.json({
        logs,
        pagination: {
          limit,
          offset,
          total: count || 0,
          hasMore: offset + limit < (count || 0),
        },
      });
    } catch (error) {
      logger.error("Audit logs API error:", error);
      return jsonError(
        "Failed to process request",
        500,
        ERROR_CODES.INTERNAL_ERROR,
      );
    }
  });
}

// ============================================================================
// POST HANDLER - Log custom audit event
// ============================================================================

export async function POST(request: NextRequest) {
  return requireAuth(request, async (userId: string) => {
    try {
      const body = await request.json();
      const {
        action,
        tableName,
        recordId,
        oldData,
        newData,
        severity,
        metadata,
      } = body;

      // Validate required fields
      if (!action) {
        return jsonError("Action is required", 400, ERROR_CODES.BAD_REQUEST);
      }

      // Validate action
      const validActions = [
        "CREATE",
        "READ",
        "UPDATE",
        "DELETE",
        "LOGIN",
        "LOGOUT",
        "PASSWORD_CHANGE",
        "PASSWORD_RESET",
        "EMAIL_CHANGE",
        "MFA_ENABLE",
        "MFA_DISABLE",
        "MFA_BACKUP_CODE_USED",
        "API_KEY_CREATE",
        "API_KEY_REVOKE",
        "SETTINGS_CHANGE",
        "EXPORT",
        "IMPORT",
        "SESSION_TERMINATED",
        "SECURITY_EVENT",
        "RATE_LIMIT_EXCEEDED",
        "IP_ANOMALY_DETECTED",
        "DEVICE_FINGERPRINT_CHANGED",
        "SUSPICIOUS_ACTIVITY",
      ];

      if (!validActions.includes(action)) {
        return jsonError("Invalid action", 400, ERROR_CODES.BAD_REQUEST);
      }

      // Validate severity
      const validSeverities = ["info", "warning", "critical"];
      const finalSeverity = severity || "info";
      if (!validSeverities.includes(finalSeverity)) {
        return jsonError("Invalid severity", 400, ERROR_CODES.BAD_REQUEST);
      }

      const supabase = await createServerClient();
      const ip = getClientIP(request);
      const userAgent = request.headers.get("user-agent") || undefined;

      // Log audit event
      const { data: logId, error } = await supabase.rpc("log_audit", {
        p_user_id: userId,
        p_action: action,
        p_table_name: tableName || null,
        p_record_id: recordId || null,
        p_old_data: oldData ? JSON.stringify(oldData) : null,
        p_new_data: newData ? JSON.stringify(newData) : null,
        p_severity: finalSeverity,
        p_ip_address: ip,
        p_user_agent: userAgent,
        p_metadata: metadata ? JSON.stringify(metadata) : "{}",
      });

      if (error) {
        logger.error("Failed to log audit event:", error);
        return jsonError(
          "Failed to log audit event",
          500,
          ERROR_CODES.INTERNAL_ERROR,
        );
      }

      return NextResponse.json({
        success: true,
        logId,
      });
    } catch (error) {
      logger.error("Audit log API error:", error);
      return jsonError(
        "Failed to process request",
        500,
        ERROR_CODES.INTERNAL_ERROR,
      );
    }
  });
}
