// public/sw.js
const CACHE_NAME = 'syllabus-sync-v1';
const STATIC_CACHE = 'syllabus-sync-static-v1';
const DYNAMIC_CACHE = 'syllabus-sync-dynamic-v1';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/home',
  '/calendar',
  '/settings',
  '/feed',
  '/map',
  '/manifest.webmanifest',
  '/favicon.ico',
];

// Security: Paths that should NEVER be cached (authenticated/sensitive data)
const NO_CACHE_PATHS = ['/api/', '/auth/'];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external requests
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }

  // Security: NEVER cache API or auth routes - they contain authenticated/sensitive data
  // This prevents stale user data from persisting after logout and protects privacy
  if (NO_CACHE_PATHS.some(path => url.pathname.startsWith(path))) {
    event.respondWith(fetch(request));
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response.ok) {
          return response;
        }

        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });

        return response;
      });
    })
  );
});