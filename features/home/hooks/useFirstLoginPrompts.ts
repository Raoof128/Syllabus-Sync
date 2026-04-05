'use client';

import { useEffect, useRef } from 'react';
import { useNotificationPreferencesStore } from '@/lib/store/notificationPreferencesStore';
import { logger } from '@/lib/logger';

/**
 * Fires **once** after a fresh login/onboarding completion to prompt the user for
 * browser notification and geolocation permissions.
 *
 * The trigger is a sessionStorage flag (`PROMPT_FLAG`) set by the login success
 * handler and the onboarding completion handler right before they redirect to
 * `/home`. Using sessionStorage means:
 *   - The prompt only fires once per login (survives the full-page redirect,
 *     dies when the tab closes).
 *   - Returning users who just open /home in a new tab are NOT prompted again.
 *
 * When the user grants notification permission, we immediately call
 * `setPushEnabled(true)` on the notification preferences store. That store
 * already handles the server-side persist + push subscription + flipping the
 * "Push notifications" toggle in Settings → General, so the Settings screen
 * reflects the new state on next visit with zero extra wiring.
 *
 * Location permission is requested via `navigator.geolocation.getCurrentPosition`
 * which is the only way to trigger the browser's permission prompt — we don't
 * need the returned coordinates here; the map/weather features will read from
 * the now-granted API whenever they mount.
 */
const PROMPT_FLAG = 'syllabus-sync:pending-login-prompts';

export function useFirstLoginPrompts(): void {
  const setPushEnabled = useNotificationPreferencesStore((s) => s.setPushEnabled);
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    if (typeof window === 'undefined') return;

    let pending: string | null = null;
    try {
      pending = sessionStorage.getItem(PROMPT_FLAG);
    } catch {
      // sessionStorage unavailable (private mode / SSR) — nothing to do
      return;
    }

    if (pending !== '1') return;

    hasRunRef.current = true;
    try {
      sessionStorage.removeItem(PROMPT_FLAG);
    } catch {
      /* ignore — flag will simply re-fire next login, which is fine */
    }

    // Run both prompts in parallel so the browser shows them one after the
    // other naturally (Chrome queues permission prompts). We don't await them
    // in the useEffect callback because we want the Home UI to render
    // immediately rather than block on permission dialogs.
    void promptNotifications(setPushEnabled);
    void promptGeolocation();
  }, [setPushEnabled]);
}

async function promptNotifications(
  setPushEnabled: (enabled: boolean) => Promise<boolean>,
): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  // Don't re-prompt if the user has already made a choice (granted or denied).
  // The browser would just return the cached result, but skipping the call
  // avoids a spurious setPushEnabled(true) that would turn the toggle back on
  // after the user deliberately turned it off.
  if (Notification.permission !== 'default') return;

  try {
    // Route through setPushEnabled so the whole chain runs: request permission
    // → subscribe to push → persist `push_notifications: true` on the server →
    // update the zustand store (which the Settings toggle reads from).
    await setPushEnabled(true);
  } catch (error) {
    logger.warn('First-login notification prompt failed', error);
  }
}

function promptGeolocation(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      resolve();
      return;
    }
    // We don't need the position here — map/weather features will read it
    // directly once permission is granted. We just need to trigger the
    // browser's permission prompt.
    navigator.geolocation.getCurrentPosition(
      () => resolve(),
      () => resolve(), // resolve on denial too — we never reject from this helper
      { timeout: 10_000, maximumAge: 5 * 60 * 1000 },
    );
  });
}

/**
 * Marks the first-login prompt as pending. Call this from login success
 * handlers and the onboarding-complete handler, immediately before redirecting
 * to `/home`. Safe to call from server actions' client callers or any client
 * context.
 */
export function markFirstLoginPromptsPending(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(PROMPT_FLAG, '1');
  } catch {
    /* ignore — sessionStorage unavailable (e.g. strict private mode) */
  }
}
