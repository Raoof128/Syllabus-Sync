'use client';

import type { User } from '@supabase/supabase-js';
import { createBrowserClient, isSupabaseConfigured } from './client';

export type BrowserAuthSnapshot = {
  session: null;
  user: User | null;
  resolution: 'resolved' | 'unknown';
};

type ConfirmedSnapshotOptions = {
  retries?: number;
  retryDelayMs?: number;
};

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

/**
 * Returns the current Supabase browser user validated against the server.
 * Uses `getUser()` instead of `getSession()` to avoid stale/expired local tokens.
 */
export async function getBrowserAuthSnapshot(): Promise<BrowserAuthSnapshot> {
  if (!isSupabaseConfigured()) {
    return { session: null, user: null, resolution: 'resolved' };
  }

  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return { session: null, user: null, resolution: 'unknown' };
  }

  return { session: null, user: data.user ?? null, resolution: 'resolved' };
}

/**
 * Confirms an apparently signed-out browser snapshot before callers tear down
 * authenticated UI. This filters transient `getUser()` null reads during token
 * refresh or focus recovery without masking a real sign-out.
 */
export async function getConfirmedBrowserAuthSnapshot(
  options?: ConfirmedSnapshotOptions,
): Promise<BrowserAuthSnapshot> {
  const retries = options?.retries ?? 1;
  const retryDelayMs = options?.retryDelayMs ?? 150;

  let snapshot = await getBrowserAuthSnapshot();
  if (snapshot.resolution !== 'resolved' || snapshot.user || retries <= 0) {
    return snapshot;
  }

  for (let attempt = 0; attempt < retries; attempt += 1) {
    if (retryDelayMs > 0) {
      await wait(retryDelayMs);
    }

    snapshot = await getBrowserAuthSnapshot();
    if (snapshot.resolution !== 'resolved' || snapshot.user) {
      return snapshot;
    }
  }

  return snapshot;
}
