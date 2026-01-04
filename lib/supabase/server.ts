import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Check if Supabase is properly configured (not placeholder values)
function isSupabaseConfigured(): boolean {
  // Check URL is valid
  const hasValidUrl = !!(
    supabaseUrl &&
    supabaseUrl.includes('supabase.co') &&
    !supabaseUrl.includes('your-project-id')
  );

  // Check key is valid - Supabase anon keys are JWT tokens starting with "eyJ"
  const hasValidKey = !!(
    supabaseAnonKey &&
    supabaseAnonKey.startsWith('eyJ') &&
    supabaseAnonKey !== 'your-anon-key-here' &&
    !supabaseAnonKey.includes('PASTE')
  );

  return hasValidUrl && hasValidKey;
}

export async function createServerClient() {
  if (!isSupabaseConfigured()) {
    console.warn(
      '⚠️ Supabase not configured for server. Auth features disabled.\n' +
      'To enable auth, update .env.local with your Supabase credentials.'
    );
    // Return a mock client for demo mode
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
      },
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: { message: 'Supabase not configured.' } }),
        update: () => ({ data: null, error: { message: 'Supabase not configured.' } }),
        delete: () => ({ data: null, error: { message: 'Supabase not configured.' } }),
      }),
    } as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>;
  }

  const cookieStore = await cookies();

  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}
