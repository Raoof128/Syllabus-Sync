import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import {
  jsonSuccess,
  jsonError,
  jsonUnauthorized,
  ERROR_CODES,
} from "@/app/api/_lib/response";
import { mfaEnrollLimiter } from "@/lib/security/mfa";
import { getClientIP } from "@/lib/security/ip";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const { allowed, remaining, resetIn } = await mfaEnrollLimiter(clientIP);

  if (!allowed) {
    return jsonError(
      `Too many enrollment attempts. Try again in ${Math.ceil(resetIn / 60)} minutes.`,
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
      logger.warn("MFA enroll: No authenticated user", {
        error: authError?.message,
      });
      return jsonUnauthorized("Authentication required");
    }

    // First, list existing factors to clean up any unverified ones
    let factorsData;
    try {
      const listResult = await supabase.auth.mfa.listFactors();
      factorsData = listResult.data;
      if (listResult.error) {
        logger.warn("MFA enroll: Failed to list factors", {
          userId: user.id,
          error: listResult.error.message,
        });
      }
    } catch (listError) {
      logger.warn("MFA enroll: Exception listing factors", {
        userId: user.id,
        error: listError instanceof Error ? listError.message : "Unknown error",
      });
    }

    // Clean up any existing unverified TOTP factors before enrolling
    // This prevents "factor already exists" errors when re-attempting enrollment
    if (factorsData?.totp && factorsData.totp.length > 0) {
      for (const factor of factorsData.totp) {
        if (factor.status === "unverified") {
          try {
            logger.info("Cleaning up unverified TOTP factor:", {
              factorId: factor.id,
              userId: user.id,
            });
            await supabase.auth.mfa.unenroll({ factorId: factor.id });
          } catch (unenrollError) {
            logger.warn("Failed to clean up unverified factor:", {
              factorId: factor.id,
              error:
                unenrollError instanceof Error
                  ? unenrollError.message
                  : "Unknown error",
            });
            // Continue anyway - the enroll might still work
          }
        }
      }
    }

    // Now attempt enrollment
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Authenticator App",
    });

    if (error) {
      logger.error("MFA TOTP enrollment error:", {
        userId: user.id,
        error: error.message,
        code: error.code,
        status: error.status,
      });

      // Provide more specific error messages
      let errorMessage = "Failed to start authenticator setup";
      if (
        error.message?.includes("already exists") ||
        error.message?.includes("duplicate")
      ) {
        errorMessage =
          "A TOTP authenticator is already set up. Please disable it first before setting up a new one.";
      } else if (error.message?.includes("rate limit")) {
        errorMessage =
          "Too many attempts. Please wait a few minutes and try again.";
      } else if (error.message?.includes("session")) {
        errorMessage = "Your session has expired. Please sign in again.";
      }

      return jsonError(errorMessage, 400, ERROR_CODES.BAD_REQUEST);
    }

    if (!data || !data.totp) {
      logger.error("MFA TOTP enrollment returned invalid data:", {
        userId: user.id,
        data,
      });
      return jsonError(
        "Invalid response from authentication server",
        500,
        ERROR_CODES.INTERNAL_ERROR,
      );
    }

    // SECURITY: Prevent proxy caching of TOTP secrets
    const response = jsonSuccess({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
    });
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate",
    );
    response.headers.set("Pragma", "no-cache");
    return response;
  } catch (error) {
    logger.error("MFA enroll unexpected error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return jsonError(
      "Failed to set up authenticator. Please try again later.",
      500,
      ERROR_CODES.INTERNAL_ERROR,
    );
  }
}
