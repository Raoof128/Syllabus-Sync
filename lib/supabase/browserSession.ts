"use client";

import type { User } from "@supabase/supabase-js";
import { createBrowserClient, isSupabaseConfigured } from "./client";

export type BrowserAuthSnapshot = {
  session: null;
  user: User | null;
  resolution: "resolved" | "unknown";
};

/**
 * Returns the current Supabase browser user validated against the server.
 * Uses `getUser()` instead of `getSession()` to avoid stale/expired local tokens.
 */
export async function getBrowserAuthSnapshot(): Promise<BrowserAuthSnapshot> {
  if (!isSupabaseConfigured()) {
    return { session: null, user: null, resolution: "resolved" };
  }

  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return { session: null, user: null, resolution: "unknown" };
  }

  return { session: null, user: data.user ?? null, resolution: "resolved" };
}
