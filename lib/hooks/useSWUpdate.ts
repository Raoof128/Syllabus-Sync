// lib/hooks/useSWUpdate.ts
// ============================================================================
// SERVICE WORKER UPDATE HOOK
// ============================================================================
// Detects when a new service worker version is available and provides
// a function to activate it (skip waiting + reload).

'use client';

import { useState, useEffect, useCallback } from 'react';

export function useSWUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Listen for new service worker installations
    const handleControllerChange = () => {
      // New SW has taken over — reload to get the latest assets
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Check existing registration for waiting workers
    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);

      // If there's already a waiting worker
      if (reg.waiting) {
        setUpdateAvailable(true);
      }

      // Listen for future updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version is installed and waiting to activate
            setUpdateAvailable(true);
          }
        });
      });
    });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (!registration?.waiting) return;

    // Tell the waiting SW to skip waiting and activate
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    // controllerchange event handler will reload the page
  }, [registration]);

  return {
    /** Whether a new SW version is waiting to activate */
    updateAvailable,
    /** Activate the waiting SW and reload */
    applyUpdate,
  };
}
