import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

// One-time warning flag to prevent console spam
let adminWarningShown = false;

// Check if admin client is properly configured
function isAdminConfigured(): boolean {
  // Check URL is valid
  const hasValidUrl = !!(
    supabaseUrl &&
    supabaseUrl.includes('supabase.co') &&
    !supabaseUrl.includes('your-project-id')
  );

  // Service role keys are JWT tokens starting with "eyJ"
  const hasValidKey = !!(
    supabaseServiceRoleKey &&
    supabaseServiceRoleKey.startsWith('eyJ') &&
    supabaseServiceRoleKey !== 'your-service-role-key-here' &&
    !supabaseServiceRoleKey.includes('PASTE')
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
        '⚠️ Supabase admin client not configured. Admin features disabled.\n' +
          'To enable admin features, add SUPABASE_SERVICE_ROLE_KEY to .env.local\n' +
          'Get it from: https://supabase.com/dashboard/project/_/settings/api',
      );
      adminWarningShown = true;
    }
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
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
