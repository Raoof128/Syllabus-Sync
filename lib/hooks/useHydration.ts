// lib/hooks/useHydration.ts
'use client';

import { useSyncExternalStore } from 'react';

/**
 * Hook to track client-side hydration status.
 * Returns true once the component has mounted on the client.
 * Useful for avoiding hydration mismatches with localStorage-based stores.
 * Uses useSyncExternalStore for proper React 18+ compatibility.
 */
export function useHydration(): boolean {
  return useSyncExternalStore(
    () => () => {}, // subscribe - no-op since this never changes
    () => true,     // getSnapshot (client) - always true on client
    () => false     // getServerSnapshot - always false on server
  );
}
