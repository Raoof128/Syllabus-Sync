// lib/utils/serviceWorker.ts

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
            // New content is available, notify user
            console.warn(
              'New content is available and will be used when all tabs for this page are closed.',
            );
          }
        });
      }
    });

    console.warn('Service Worker registered successfully');
  } catch (error) {
    console.error('Service Worker registration failed:', error);
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
    console.error('Service Worker unregistration failed:', error);
  }
};
