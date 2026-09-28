import { createClient } from "@supabase/supabase-js";

// SECURITY/RELIABILITY (BA-0017): these used to be module-scope `const`s
// read once at import time. That's fragile under OpenNext on Cloudflare
// Workers, which populates `process.env` for a request/isolate at its own
// point in the startup sequence — if this module were evaluated before that
// happened, the captured values would stay empty strings for the rest of
// the isolate's lifetime, even after the real env became available.
// Reading `process.env` fresh inside each function call instead means
// `createAdminClient()` always reflects the environment's current state.
function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

function getSupabaseServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

// One-time warning flag to prevent console spam
let adminWarningShown = false;

// Check if admin client is properly configured
function isAdminConfigured(): boolean {
  const supabaseUrl = getSupabaseUrl();
  const supabaseServiceRoleKey = getSupabaseServiceRoleKey();

  // Check URL is valid
  const hasValidUrl = !!(
    supabaseUrl &&
    supabaseUrl.includes("supabase.co") &&
    !supabaseUrl.includes("your-project-id")
  );

  // Legacy service_role keys are JWTs ("eyJ…"). Supabase's replacement secret
  // keys start "sb_secret_" and the legacy keys are deprecated by the end of
  // 2026; rejecting them would silently disable every admin-backed route on
  // key rotation (BA-0066). A publishable key must never pass as a secret.
  const hasValidKey = !!(
    supabaseServiceRoleKey &&
    (supabaseServiceRoleKey.startsWith("eyJ") ||
      supabaseServiceRoleKey.startsWith("sb_secret_")) &&
    supabaseServiceRoleKey !== "your-service-role-key-here" &&
    !supabaseServiceRoleKey.includes("PASTE")
  );

  return hasValidUrl && hasValidKey;
}

/**
 * Creates a Supabase admin client with service role key.
 *
 * SECURITY WARNING:
 * - This client bypasses Row Level Security (RLS)
 * - Only use in server-side code (API routes, server actions)
 * - NEVER expose to client-side code
 * - Use for admin operations like auto-confirming dev emails, managing users
 *
 * @returns Supabase client with admin privileges, or null if not configured
 */
export function createAdminClient() {
  if (!isAdminConfigured()) {
    if (!adminWarningShown) {
      console.warn(
        "⚠️ Supabase admin client not configured. Admin features disabled.\n" +
          "To enable admin features, add SUPABASE_SERVICE_ROLE_KEY to .env.local\n" +
          "Get it from: https://supabase.com/dashboard/project/_/settings/api",
      );
      adminWarningShown = true;
    }
    return null;
  }

  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Check if admin client is available (service role key is configured)
 */
export function isAdminClientAvailable(): boolean {
  return isAdminConfigured();
}
