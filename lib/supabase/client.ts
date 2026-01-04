import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Check if Supabase is properly configured (not placeholder values)
export function isSupabaseConfigured(): boolean {
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

export function createBrowserClient() {
  if (!isSupabaseConfigured()) {
    console.warn(
      '⚠️ Supabase not configured. Auth features disabled.\n' +
      'To enable auth, update .env.local with your Supabase credentials from:\n' +
      'https://supabase.com/dashboard/project/_/settings/api'
    );
    // Return a mock client that provides meaningful errors for auth operations
    return {
      auth: {
        signUp: async () => ({
          data: { user: null, session: null },
          error: { message: 'Supabase not configured. Please set up your .env.local file with valid Supabase credentials.' }
        }),
        signInWithPassword: async () => ({
          data: { user: null, session: null },
          error: { message: 'Supabase not configured. Please set up your .env.local file with valid Supabase credentials.' }
        }),
        signOut: async () => ({ error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        resetPasswordForEmail: async () => ({
          data: null,
          error: { message: 'Supabase not configured. Please set up your .env.local file with valid Supabase credentials.' }
        }),
        updateUser: async () => ({
          data: { user: null },
          error: { message: 'Supabase not configured. Please set up your .env.local file with valid Supabase credentials.' }
        }),
        onAuthStateChange: (_event: string, callback: (event: string, session: null) => void) => {
          // Immediately call with null session to indicate no user
          if (typeof callback === 'function') {
            setTimeout(() => callback('SIGNED_OUT', null), 0);
          }
          return { data: { subscription: { unsubscribe: () => {} } } };
        },
      },
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: { message: 'Supabase not configured.' } }),
        update: () => ({ data: null, error: { message: 'Supabase not configured.' } }),
        delete: () => ({ data: null, error: { message: 'Supabase not configured.' } }),
      }),
    } as unknown as ReturnType<typeof createSupabaseBrowserClient>;
  }

  return createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey);
}
