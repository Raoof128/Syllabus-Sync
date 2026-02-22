import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import {
  jsonSuccess,
  jsonError,
  jsonUnauthorized,
  parseJsonBody,
  BODY_SIZE_LIMITS,
  ERROR_CODES,
} from "@/app/api/_lib/response";
import { mfaUnenrollLimiter } from "@/lib/security/mfa";
import { getClientIP } from "@/lib/security/ip";
import { logger } from "@/lib/logger";
import { z } from "zod";

const unenrollSchema = z.object({
  factorId: z.string().uuid(),
});

/**
 * POST /api/auth/mfa/unenroll
 * Removes an MFA factor. Requires re-authentication (aal2) if MFA is active.
 */
export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const { allowed, remaining, resetIn } = await mfaUnenrollLimiter(clientIP);

  if (!allowed) {
    return jsonError(
      `Too many attempts. Try again in ${Math.ceil(resetIn / 60)} minutes.`,
      429,
      ERROR_CODES.RATE_LIMITED,
      { retryAfter: resetIn, remaining },
    );
  }

  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonUnauthorized("Authentication required");
    }

    const { data: body, error: parseError } = await parseJsonBody(
      request,
      BODY_SIZE_LIMITS.AUTH,
    );
    if (parseError) return parseError;

    const parsed = unenrollSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Invalid request", 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const { factorId } = parsed.data;

    // If MFA is active (verified factors exist), require aal2 to unenroll.
    // SECURITY: Fail closed if we cannot determine AAL/factors.
    const { data: factorsData, error: factorsError } =
      await supabase.auth.mfa.listFactors();
    if (factorsError) {
      logger.error("MFA unenroll list factors error:", {
        userId: user.id,
        error: factorsError.message,
      });
      return jsonError(
        "Unable to verify MFA status. Please try again.",
        503,
        ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      );
    }

    const verifiedFactors =
      (factorsData?.all ?? []).filter(
        (f: { status: string }) => f.status === "verified",
      ) ?? [];

    if (verifiedFactors.length > 0) {
      const { data: aal, error: aalError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (aalError || !aal) {
        logger.error("MFA unenroll AAL check error:", {
          userId: user.id,
          error: aalError?.message,
        });
        return jsonError(
          "Unable to verify identity level. Please try again.",
          503,
          ERROR_CODES.EXTERNAL_SERVICE_ERROR,
        );
      }

      if (aal.currentLevel !== "aal2") {
        return jsonError(
          "Re-authentication required to disable MFA. Please verify your identity first.",
          403,
          ERROR_CODES.FORBIDDEN,
        );
      }
    }

    const { error: unenrollError } = await supabase.auth.mfa.unenroll({
      factorId,
    });

    if (unenrollError) {
      logger.error("MFA unenroll error:", {
        userId: user.id,
        factorId,
        error: unenrollError.message,
      });
      return jsonError(
        "Failed to remove MFA factor",
        400,
        ERROR_CODES.BAD_REQUEST,
      );
    }

    logger.info("MFA factor unenrolled", {
      userId: user.id,
      factorId,
    });

    return jsonSuccess({
      removed: true,
      factorId,
    });
  } catch (error) {
    logger.error("MFA unenroll error:", error);
    return jsonError(
      "Failed to remove MFA factor",
      500,
      ERROR_CODES.INTERNAL_ERROR,
    );
  }
}
