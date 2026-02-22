import { NextRequest } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { createServerClient } from "@/lib/supabase/server";
import { APP_CONFIG } from "@/lib/config";
import {
  jsonSuccess,
  jsonError,
  jsonUnauthorized,
  ERROR_CODES,
} from "@/app/api/_lib/response";
import {
  getRpId,
  setPasskeyCookies,
  uuidToBuffer,
} from "@/app/api/auth/passkey/_lib";
import { logger } from "@/lib/logger";

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

    const rpId = getRpId(request);
    const existingCredentialId =
      (user.user_metadata?.biometric_credential_id as string | undefined) ??
      null;

    const options = await generateRegistrationOptions({
      rpName: APP_CONFIG.name,
      rpID: rpId,
      userID: uuidToBuffer(user.id),
      userName: user.email ?? user.id,
      attestationType: "none",
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "preferred",
        userVerification: "required",
      },
      excludeCredentials: existingCredentialId
        ? [
            {
              id: existingCredentialId,
            },
          ]
        : [],
    });

    const response = jsonSuccess({ options });
    setPasskeyCookies(response, options.challenge, user.id);
    return response;
  } catch (error) {
    logger.error("Passkey register options error:", error);
    return jsonError(
      "Failed to create passkey options",
      500,
      ERROR_CODES.INTERNAL_ERROR,
    );
  }
}
