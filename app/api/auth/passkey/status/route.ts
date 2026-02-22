import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonSuccess,
  jsonError,
  parseJsonBody,
  BODY_SIZE_LIMITS,
  ERROR_CODES,
} from "@/app/api/_lib/response";
import { passkeyStatusLimiter } from "@/lib/services/rateLimitService";
import { getClientIP } from "@/lib/security/ip";
import { z } from "zod";
import { logger } from "@/lib/logger";

const statusSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const { allowed, remaining, resetIn } = await passkeyStatusLimiter(clientIP);

  if (!allowed) {
    return jsonError(
      `Too many login attempts. Please try again in ${Math.ceil(resetIn / 60)} minutes.`,
      429,
      ERROR_CODES.RATE_LIMITED,
      { retryAfter: resetIn, remaining },
    );
  }

  try {
    const adminClient = createAdminClient();
    if (!adminClient) {
      return jsonError(
        "Passkey login is not configured",
        503,
        ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      );
    }

    const { data: body, error: parseError } = await parseJsonBody(
      request,
      BODY_SIZE_LIMITS.AUTH,
    );
    if (parseError) return parseError;

    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        "Invalid login payload",
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const { email } = parsed.data;

    // Use targeted RPC lookup instead of from('auth.users') which
    // doesn't work with Supabase JS client for system tables.
    const { data: lookupResult, error: lookupError } = await adminClient.rpc(
      "lookup_user_by_email",
      { lookup_email: email },
    );

    if (lookupError) {
      logger.error("Passkey status lookup error:", lookupError);
      return jsonSuccess({ available: false, mfaEnabled: false });
    }

    const userRow = Array.isArray(lookupResult)
      ? lookupResult[0]
      : lookupResult;

    if (!userRow?.user_id) {
      // Don't reveal whether user exists
      return jsonSuccess({ available: false, mfaEnabled: false });
    }

    const metadata = (userRow.user_meta ?? {}) as Record<string, unknown>;
    const biometricAvailable = Boolean(metadata.biometric_credential_id);

    // Check MFA factors via admin API
    let mfaEnabled = false;
    try {
      const { data: factorsData } =
        await adminClient.auth.admin.mfa.listFactors({
          userId: userRow.user_id,
        });
      const verifiedFactors = factorsData?.factors?.filter(
        (f: { status: string }) => f.status === "verified",
      );
      mfaEnabled = (verifiedFactors?.length ?? 0) > 0;
    } catch {
      // MFA check is best-effort
    }

    return jsonSuccess({ available: biometricAvailable, mfaEnabled });
  } catch (error) {
    logger.error("Passkey status error:", error);
    return jsonError(
      "Failed to check passkey status",
      500,
      ERROR_CODES.INTERNAL_ERROR,
    );
  }
}
