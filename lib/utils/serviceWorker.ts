// lib/utils/serviceWorker.ts

import { errorHandler } from '@/lib/utils/errorHandling';

export const registerServiceWorker = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available; UI notification hook can be added here.
          }
        });
      }
    });
  } catch (error) {
    errorHandler.logError(
      error instanceof Error ? error : new Error('Service Worker registration failed'),
      'ServiceWorker',
      'high',
    );
  }
};

export const unregisterServiceWorker = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.unregister();
    // Service Worker unregistered
  } catch (error) {
    errorHandler.logError(
      error instanceof Error ? error : new Error('Service Worker unregistration failed'),
      'ServiceWorker',
      'high',
    );
  }
};

/**
 * SECURITY: Clear all service worker caches
 * Call this on logout to remove any cached sensitive data
 */
export const clearAllCaches = async (): Promise<void> => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Method 1: Tell service worker to clear caches
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_ALL_CACHES' });
    }

    // Method 2: Also clear from main thread (backup)
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    }
  } catch (error) {
    errorHandler.logError(
      error instanceof Error ? error : new Error('Cache clearing failed'),
      'ServiceWorker',
      'medium',
    );
  }
};

/**
 * SECURITY: Clear all client-side storage on logout
 * This includes localStorage, sessionStorage, IndexedDB, and caches
 */
export const clearAllClientStorage = async (): Promise<void> => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Clear localStorage
    localStorage.clear();

    // Clear sessionStorage
    sessionStorage.clear();

    // Clear service worker caches
    await clearAllCaches();

    // Clear IndexedDB databases (if any)
    if ('indexedDB' in window) {
      const databases = await indexedDB.databases?.();
      if (databases) {
        await Promise.all(
          databases.map((db) => {
            if (db.name) {
              return new Promise<void>((resolve, reject) => {
                const request = indexedDB.deleteDatabase(db.name!);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
              });
            }
            return Promise.resolve();
          }),
        );
      }
    }
  } catch (error) {
    errorHandler.logError(
      error instanceof Error ? error : new Error('Client storage clearing failed'),
      'Security',
      'high',
    );
  }
};
