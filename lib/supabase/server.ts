import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Check if Supabase is properly configured (not placeholder values)
function isSupabaseConfigured(): boolean {
  return !!(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-id') &&
    supabaseAnonKey !== 'your-anon-key-here'
  );
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
