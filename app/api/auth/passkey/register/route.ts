import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import {
  verifyRegistrationResponse,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

import {
  jsonSuccess,
  jsonError,
  jsonUnauthorized,
  parseJsonBody,
  BODY_SIZE_LIMITS,
  ERROR_CODES,
} from "@/app/api/_lib/response";
import {
  getRpId,
  getOrigin,
  PASSKEY_CHALLENGE_COOKIE,
  PASSKEY_USER_COOKIE,
  clearPasskeyCookies,
  bufferToBase64Url,
} from "@/app/api/auth/passkey/_lib";

type RegistrationBody = {
  credential: Record<string, unknown>;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonUnauthorized("Not authenticated");
    }

    const { data: body, error: parseError } =
      await parseJsonBody<RegistrationBody>(request, BODY_SIZE_LIMITS.AUTH);
    if (parseError) return parseError;

    if (!body?.credential) {
      return jsonError(
        "Missing credential payload",
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const cookieStore = await cookies();
    const expectedChallenge = cookieStore.get(PASSKEY_CHALLENGE_COOKIE)?.value;
    const expectedUser = cookieStore.get(PASSKEY_USER_COOKIE)?.value;

    if (!expectedChallenge || !expectedUser || expectedUser !== user.id) {
      return jsonError(
        "Passkey challenge expired",
        400,
        ERROR_CODES.BAD_REQUEST,
      );
    }

    const verification = await verifyRegistrationResponse({
      response: body.credential as unknown as RegistrationResponseJSON,
      expectedChallenge,
      expectedOrigin: getOrigin(request),
      expectedRPID: getRpId(request),
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return jsonError(
        "Passkey verification failed",
        400,
        ERROR_CODES.BAD_REQUEST,
      );
    }

    const { credential } = verification.registrationInfo;

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        biometric_enabled: true,
        biometric_credential_id: credential.id,
        biometric_public_key: bufferToBase64Url(credential.publicKey),
        biometric_counter: credential.counter,
        biometric_updated_at: new Date().toISOString(),
      },
    });

    if (updateError) {
      logger.error("Passkey registration update failed:", updateError.message);
      return jsonError("Failed to save passkey", 400, ERROR_CODES.BAD_REQUEST);
    }

    const response = jsonSuccess({ verified: true });
    clearPasskeyCookies(response);
    return response;
  } catch (error) {
    logger.error("Passkey register error:", error);
    return jsonError(
      "Failed to register passkey",
      500,
      ERROR_CODES.INTERNAL_ERROR,
    );
  }
}
