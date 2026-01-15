/**
 * Client Storage Utilities
 *
 * Provides functions for managing client-side storage, particularly
 * for clearing user data on logout to prevent data leakage between sessions.
 *
 * SECURITY: Always clear client storage on logout to prevent:
 * - Sensitive data exposure to subsequent users on shared devices
 * - Stale data from previous sessions affecting new sessions
 * - Cross-user data contamination
 */

'use client';

import { devLog } from './devLog';

// ============================================================================
// STORAGE KEYS
// ============================================================================

/**
 * All localStorage keys used by Zustand persist stores
 * Update this list when adding new persisted stores
 */
const ZUSTAND_STORAGE_KEYS = [
  'units-storage', // lib/store/unitsStore.ts
  'deadlines-storage', // lib/store/deadlinesStore.ts
  'notifications-storage', // lib/store/notificationsStore.ts
  'syllabus-sync-gamification', // lib/store/gamificationStore.ts
] as const;

/**
 * Other application localStorage keys that should be cleared on logout
 */
const APP_STORAGE_KEYS = [
  'syllabus-sync-theme', // Theme preference (optional - may want to keep)
  'syllabus-sync-language', // Language preference (optional - may want to keep)
  'syllabus-sync-onboarding', // Onboarding completion state
  'syllabus-sync-last-sync', // Last sync timestamp
] as const;

/**
 * Keys that should be preserved across logouts (user preferences)
 * These are non-sensitive settings that improve UX
 */
const PRESERVED_KEYS = ['syllabus-sync-theme', 'syllabus-sync-language'] as const;

// ============================================================================
// CLEAR FUNCTIONS
// ============================================================================

/**
 * Clears all user-specific data from localStorage
 * Call this on logout to prevent data leakage
 *
 * @param preservePreferences - If true, keeps theme/language settings (default: true)
 */
export function clearAllClientStorage(preservePreferences = true): void {
  if (typeof window === 'undefined') return;

  try {
    // Clear Zustand persisted stores
    for (const key of ZUSTAND_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }

    // Clear app-specific storage
    for (const key of APP_STORAGE_KEYS) {
      if (preservePreferences && (PRESERVED_KEYS as readonly string[]).includes(key)) {
        continue;
      }
      localStorage.removeItem(key);
    }

    // Clear sessionStorage completely (always cleared on logout)
    sessionStorage.clear();

    devLog.auth.info('Client storage cleared on logout');
  } catch (error) {
    // Storage might be unavailable (private browsing, etc.)
    devLog.auth.warn('Failed to clear client storage', error);
  }
}

/**
 * Clears only Zustand store data while preserving other settings
 * Useful for "soft reset" scenarios
 */
export function clearStoreData(): void {
  if (typeof window === 'undefined') return;

  try {
    for (const key of ZUSTAND_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  } catch (error) {
    devLog.store.warn('Failed to clear store data', error);
  }
}

/**
 * Clears all application data including preferences
 * Complete reset - use for "Delete My Data" scenarios
 */
export function clearAllApplicationData(): void {
  clearAllClientStorage(false);
}

/**
 * Gets all storage keys used by the application
 * Useful for debugging and data export
 */
export function getAllStorageKeys(): string[] {
  return [...ZUSTAND_STORAGE_KEYS, ...APP_STORAGE_KEYS];
}

/**
 * Checks if any user data exists in client storage
 */
export function hasUserData(): boolean {
  if (typeof window === 'undefined') return false;

  for (const key of ZUSTAND_STORAGE_KEYS) {
    if (localStorage.getItem(key)) {
      return true;
    }
  }
  return false;
}
