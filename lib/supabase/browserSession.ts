'use client';

import type { User, Session } from '@supabase/supabase-js';
import { createBrowserClient, isSupabaseConfigured } from './client';

export type BrowserAuthSnapshot = {
  session: Session | null;
  user: User | null;
};

/**
 * Returns the current Supabase browser session/user without calling our own API.
 * This avoids extra Vercel function invocations from `/api/auth/user` when the UI
 * only needs client-side auth state.
 */
export async function getBrowserAuthSnapshot(): Promise<BrowserAuthSnapshot> {
  if (!isSupabaseConfigured()) {
    return { session: null, user: null };
  }

  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    return { session: null, user: null };
  }

  return { session: data.session ?? null, user: data.session?.user ?? null };
}

