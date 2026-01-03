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
