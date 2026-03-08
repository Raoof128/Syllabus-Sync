'use client';

let _promise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (_promise) return _promise;

  _promise = new Promise((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      _promise = null;
      return reject(new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured'));
    }

    const cb = '__gmInit__';
    (window as unknown as Record<string, unknown>)[cb] = () => {
      delete (window as unknown as Record<string, unknown>)[cb];
      resolve();
    };

    // Remove any stale script from previous failed attempts
    const existing = document.getElementById('google-maps-js');
    if (existing) existing.remove();

    const s = document.createElement('script');
    s.id = 'google-maps-js';
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=marker,places&callback=${cb}&loading=async`;
    s.async = true;
    s.defer = true;
    s.onerror = () => {
      _promise = null;
      delete (window as unknown as Record<string, unknown>)[cb];
      s.remove();
      reject(new Error('Google Maps SDK failed to load'));
    };
    document.head.appendChild(s);
  });

  return _promise;
}
