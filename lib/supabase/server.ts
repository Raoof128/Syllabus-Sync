import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// One-time warning flag to prevent console spam
let serverWarningShown = false;

// Check if Supabase is properly configured (not placeholder values)
function isSupabaseConfigured(): boolean {
  // Check URL is valid
  const hasValidUrl = !!(
    supabaseUrl &&
    supabaseUrl.includes("supabase.co") &&
    !supabaseUrl.includes("your-project-id")
  );

  // Check key is valid - Supabase anon keys are JWT tokens starting with "eyJ" or publishable keys starting with "sb_"
  const hasValidKey = !!(
    supabaseAnonKey &&
    (supabaseAnonKey.startsWith("eyJ") || supabaseAnonKey.startsWith("sb_")) &&
    supabaseAnonKey !== "your-anon-key-here" &&
    !supabaseAnonKey.includes("PASTE")
  );

  return hasValidUrl && hasValidKey;
}

export async function createServerClient() {
  if (!isSupabaseConfigured()) {
    if (!serverWarningShown) {
      console.warn(
        "⚠️ Supabase not configured for server. Auth features disabled.\n" +
          "To enable auth, update .env.local with your Supabase credentials.",
      );
      serverWarningShown = true;
    }
    // Return a mock client for demo mode
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
      },
      from: () => {
        // Create a chainable query builder mock
        const chainable = {
          select: () => chainable,
          insert: () => ({
            data: null,
            error: { message: "Supabase not configured." },
          }),
          update: () => chainable,
          delete: () => ({
            data: null,
            error: { message: "Supabase not configured." },
          }),
          upsert: () => ({
            data: null,
            error: { message: "Supabase not configured." },
          }),
          is: () => chainable,
          eq: () => chainable,
          neq: () => chainable,
          gt: () => chainable,
          gte: () => chainable,
          lt: () => chainable,
          lte: () => chainable,
          like: () => chainable,
          ilike: () => chainable,
          in: () => chainable,
          contains: () => chainable,
          containedBy: () => chainable,
          range: () => chainable,
          overlaps: () => chainable,
          match: () => chainable,
          not: () => chainable,
          or: () => chainable,
          filter: () => chainable,
          order: () => chainable,
          limit: () => chainable,
          offset: () => chainable,
          single: () => ({ data: null, error: null }),
          maybeSingle: () => ({ data: null, error: null }),
          // Terminal methods that return the result
          then: (resolve: (value: { data: []; error: null }) => void) => {
            resolve({ data: [], error: null });
          },
          // Make it awaitable
          data: [],
          error: null,
        };
        return chainable;
      },
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
