// lib/hooks/useHydration.ts
"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Hook to track client-side hydration status.
 * Returns true once the component has mounted on the client.
 * Uses useSyncExternalStore so it is safe in concurrent mode and never
 * triggers the react-hooks/set-state-in-effect lint rule.
 */
export function useHydration(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
}
