"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/mq/button";
import { logger } from "@/lib/logger";
import { useTypedTranslation } from "@/lib/hooks/useTypedTranslation";

interface AuthRedirectHandlerProps {
  fallbackRedirect: string;
}

/**
 * Handles auth redirects from Supabase email links.
 *
 * When users click email verification or password reset links,
 * Supabase redirects them to the configured redirect_to URL with tokens in the hash fragment.
 * This component detects those tokens and redirects appropriately.
 */
export default function AuthRedirectHandler({
  fallbackRedirect,
}: AuthRedirectHandlerProps) {
  const { t } = useTypedTranslation();
  const router = useRouter();
  const [status, setStatus] = useState<
    "loading" | "processing" | "redirecting" | "error"
  >("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const handledRef = useRef(false);
  const supabase = createBrowserClient();

  // Memoized handler for setting error state
  const handleError = useCallback((message: string) => {
    handledRef.current = true;
    // Use queueMicrotask to avoid calling setState synchronously in effect
    queueMicrotask(() => {
      setStatus("error");
      setErrorMessage(message);
    });
  }, []);

  // Check for recovery/auth tokens on mount
  useEffect(() => {
    if (typeof window === "undefined" || handledRef.current) return;

    const hash = window.location.hash;
    const search = window.location.search;

    // Parse hash fragment - Supabase puts tokens here after PKCE flow
    // Format: #access_token=xxx&token_type=bearer&type=recovery&...
    const hashParams = new URLSearchParams(hash.substring(1));
    const searchParams = new URLSearchParams(search);

    const typeFromHash = hashParams.get("type");
    const typeFromSearch = searchParams.get("type");
    const type = typeFromHash || typeFromSearch;

    const error = hashParams.get("error") || searchParams.get("error");
    const errorDescription =
      hashParams.get("error_description") ||
      searchParams.get("error_description");

    logger.info("AuthRedirectHandler: Checking URL", {
      hash: hash ? `${hash.substring(0, 50)}...` : "none",
      type,
      error,
    });

    // Handle errors
    if (error) {
      logger.error("AuthRedirectHandler: Error in URL", {
        error,
        errorDescription,
      });
      handleError(errorDescription || error || "Authentication failed.");
      return;
    }

    // PKCE flow: Supabase may redirect here with ?code= if the redirect URL
    // was stripped to root. Forward to /auth/callback for server-side code exchange.
    const codeParam = searchParams.get("code");
    if (codeParam) {
      logger.info(
        "AuthRedirectHandler: PKCE code detected, forwarding to /auth/callback",
      );
      handledRef.current = true;
      queueMicrotask(() => setStatus("redirecting"));
      window.location.href = `/auth/callback${search}`;
      return;
    }

    // If type=recovery, redirect to /reset-password with the hash
    if (type === "recovery") {
      logger.info(
        "AuthRedirectHandler: Recovery detected, redirecting to /reset-password",
      );
      handledRef.current = true;
      queueMicrotask(() => setStatus("redirecting"));
      // Pass the entire hash to reset-password so it can process the tokens
      router.replace(`/reset-password${hash}`);
      return;
    }

    // Check if there are auth tokens in the hash
    const hasAuthTokens =
      hash && (hash.includes("access_token") || hash.includes("refresh_token"));

    if (!hasAuthTokens) {
      // No auth params - redirect to fallback
      logger.info(
        "AuthRedirectHandler: No auth params, redirecting to fallback",
      );
      router.replace(fallbackRedirect);
      return;
    }

    // Has auth tokens but not recovery type - let Supabase process
    queueMicrotask(() => setStatus("processing"));
  }, [router, fallbackRedirect, handleError]);

  // Listen for auth state changes from Supabase
  useEffect(() => {
    if (handledRef.current) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, session: unknown) => {
      if (handledRef.current) return;

      logger.info("AuthRedirectHandler: Auth state change:", { event });

      if (event === "PASSWORD_RECOVERY" && session) {
        // Recovery flow - redirect to reset-password
        handledRef.current = true;
        queueMicrotask(() => setStatus("redirecting"));
        router.replace("/reset-password");
      } else if (event === "SIGNED_IN" && session) {
        // Normal sign in - redirect to home
        handledRef.current = true;
        queueMicrotask(() => setStatus("redirecting"));
        router.replace("/home");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);

  // Fallback timeout - if nothing happens after 5 seconds, redirect to fallback
  useEffect(() => {
    if (handledRef.current || status !== "processing") return;

    const timeout = setTimeout(async () => {
      if (handledRef.current) return;

      logger.info("AuthRedirectHandler: Timeout, checking session");
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        handledRef.current = true;
        setStatus("redirecting");
        router.replace("/home");
      } else {
        // No session - redirect to fallback
        router.replace(fallbackRedirect);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [status, router, supabase.auth, fallbackRedirect]);

  // Show error state
  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mq-background px-4">
        <div className="w-full max-w-md text-center">
          <div className="rounded-2xl border border-mq-border bg-mq-card-background shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-mq-content">
                {t("linkExpiredOrInvalid")}
              </h1>
              <p className="text-sm text-mq-content-secondary">
                {errorMessage || t("invalidResetLink")}
              </p>
            </div>
            <div className="space-y-3">
              <Button
                type="button"
                className="w-full h-12 rounded-xl font-bold"
                onClick={() => router.push("/reset-password")}
              >
                {t("requestNewResetLink")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 rounded-xl font-bold"
                onClick={() => router.push("/login")}
              >
                {t("backToLogin")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while processing
  return (
    <div className="min-h-screen flex items-center justify-center bg-mq-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-mq-primary" />
        <p className="mt-4 text-mq-content-secondary">
          {status === "loading" && t("loading")}
          {status === "processing" && t("verifyingRequest")}
          {status === "redirecting" && t("redirecting")}
        </p>
      </div>
    </div>
  );
}
