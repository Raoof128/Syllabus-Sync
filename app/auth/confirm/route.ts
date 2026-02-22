import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Email Confirmation Handler (token_hash flow)
 *
 * Handles email verification links that use token_hash instead of PKCE codes.
 * This is the recommended approach for password recovery in Next.js because
 * PKCE code_verifier cookies are unreliable across the email→browser redirect.
 *
 * The email template sends: /auth/confirm?token_hash=xxx&type=recovery&next=/reset-password
 * This route verifies the token server-side and redirects to the target page.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  // Validate the next param is a relative path
  const redirectPath = next.startsWith("/") ? next : "/";

  if (!token_hash || !type) {
    const errorUrl = new URL("/reset-password", request.url);
    errorUrl.searchParams.set("error", "missing_params");
    errorUrl.searchParams.set(
      "error_description",
      "Invalid reset link. Please request a new one.",
    );
    return NextResponse.redirect(errorUrl);
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  });

  if (error) {
    console.error("Token verification error:", error.message);
    const errorUrl = new URL("/reset-password", request.url);
    errorUrl.searchParams.set("error", "verification_failed");
    errorUrl.searchParams.set(
      "error_description",
      "Invalid or expired reset link. Please request a new one.",
    );
    return NextResponse.redirect(errorUrl);
  }

  // Session is established. Redirect to the target page.
  // For recovery, this will be /reset-password
  const redirectUrl = new URL(redirectPath, request.url);
  if (type === "recovery") {
    redirectUrl.searchParams.set("recovery", "1");
  }
  return NextResponse.redirect(redirectUrl);
}
