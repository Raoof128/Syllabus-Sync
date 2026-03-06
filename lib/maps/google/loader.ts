'use client';

declare global {
  interface Window {
    __syllabusSyncGoogleMapsInit?: () => void;
  }
}

let googleMapsLoaderPromise: Promise<typeof google.maps> | null = null;

function buildGoogleMapsScriptUrl(apiKey: string): string {
  const params = new URLSearchParams({
    key: apiKey,
    v: 'weekly',
    loading: 'async',
    callback: '__syllabusSyncGoogleMapsInit',
  });

  return `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
}

export async function loadGoogleMaps(): Promise<typeof google.maps> {
  if (typeof window === 'undefined') {
    throw new Error('Google Maps can only be loaded in the browser.');
  }

  if (
    typeof window.google !== 'undefined' &&
    typeof window.google.maps !== 'undefined' &&
    typeof window.google.maps.importLibrary === 'function'
  ) {
    return window.google.maps;
  }

  if (!googleMapsLoaderPromise) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured.');
    }

    googleMapsLoaderPromise = new Promise<typeof google.maps>((resolve, reject) => {
      const existingScript = document.getElementById('google-maps-js');
      if (
        existingScript &&
        typeof window.google !== 'undefined' &&
        typeof window.google.maps !== 'undefined' &&
        typeof window.google.maps.importLibrary === 'function'
      ) {
        resolve(window.google.maps);
        return;
      }

      window.__syllabusSyncGoogleMapsInit = () => {
        if (
          typeof window.google !== 'undefined' &&
          typeof window.google.maps !== 'undefined' &&
          typeof window.google.maps.importLibrary === 'function'
        ) {
          resolve(window.google.maps);
          return;
        }

        reject(new Error('Google Maps loaded without importLibrary support.'));
      };

      const script = document.createElement('script');
      script.id = 'google-maps-js';
      script.src = buildGoogleMapsScriptUrl(apiKey);
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        googleMapsLoaderPromise = null;
        reject(new Error('Failed to load Google Maps JavaScript API.'));
      };

      document.head.appendChild(script);
    });
  }

  return googleMapsLoaderPromise;
}
