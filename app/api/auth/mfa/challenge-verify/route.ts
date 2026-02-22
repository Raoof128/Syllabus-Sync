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
import { mfaVerifyLimiter, isValidTOTPCode } from "@/lib/security/mfa";
import { getClientIP } from "@/lib/security/ip";
import { logger } from "@/lib/logger";
import { z } from "zod";

const challengeVerifySchema = z.object({
  factorId: z.string().uuid(),
  challengeId: z.string().uuid().optional(),
  code: z
    .string()
    .length(6)
    .regex(/^\d{6}$/),
});

/**
 * MFA Challenge + Verify endpoint for login flow.
 * Creates a challenge and immediately verifies with the provided code.
 * Used during the login MFA step (after password auth, before aal2).
 */
export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const { allowed, remaining, resetIn } = await mfaVerifyLimiter(clientIP);

  if (!allowed) {
    return jsonError(
      `Too many verification attempts. Account temporarily locked. Try again in ${Math.ceil(resetIn / 60)} minutes.`,
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

    const parsed = challengeVerifySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        "Invalid verification payload",
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const { factorId, challengeId, code } = parsed.data;

    if (!isValidTOTPCode(code)) {
      return jsonError(
        "Invalid verification code format",
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    let effectiveChallengeId = challengeId;
    if (!effectiveChallengeId) {
      // Create challenge (required for phone factors; safe for TOTP)
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({
          factorId,
        });

      if (challengeError || !challenge) {
        logger.error("MFA login challenge error:", {
          userId: user.id,
          factorId,
          error: challengeError?.message,
        });
        return jsonError(
          "Failed to create verification challenge",
          400,
          ERROR_CODES.BAD_REQUEST,
        );
      }

      effectiveChallengeId = challenge.id;
    }

    // Verify code
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: effectiveChallengeId,
      code,
    });

    if (verifyError) {
      logger.warn("MFA login verification failed:", {
        userId: user.id,
        factorId,
        error: verifyError.message,
      });
      return jsonError(
        "Invalid verification code. Please try again.",
        401,
        ERROR_CODES.UNAUTHORIZED,
      );
    }

    logger.info("MFA login verification success", {
      userId: user.id,
      factorId,
    });

    return jsonSuccess({
      verified: true,
      aal: "aal2",
    });
  } catch (error) {
    logger.error("MFA challenge-verify error:", error);
    return jsonError("Verification failed", 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
