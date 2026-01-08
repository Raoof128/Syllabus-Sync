// public/sw.js
// ============================================================================
// SERVICE WORKER - Security-Hardened Caching Strategy
// ============================================================================
// SECURITY: This service worker implements a strict caching policy to prevent
// sensitive data from being cached and exposed after logout or on shared devices.

const CACHE_NAME = 'syllabus-sync-v2'; // Bump version for cache invalidation
const STATIC_CACHE = 'syllabus-sync-static-v2';
const DYNAMIC_CACHE = 'syllabus-sync-dynamic-v2';

// SECURITY: Only cache truly static assets - NO HTML pages that may contain user data
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/favicon.ico',
  '/MQ_Logo_Final.png',
];

// SECURITY: Paths that should NEVER be cached (authenticated/sensitive data)
// This includes ALL dynamic HTML pages, API routes, and auth-related paths
const NO_CACHE_PATHS = [
  '/api/',
  '/auth/',
  // SECURITY: Don't cache any HTML pages - they may contain user-specific data
  '/home',
  '/calendar',
  '/settings',
  '/feed',
  '/map',
  '/login',
  '/signup',
  '/test-auth',
  '/manage-profiles',
];

// SECURITY: File extensions that are safe to cache (static assets only)
const SAFE_TO_CACHE_EXTENSIONS = [
  '.js',
  '.css',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.json', // Only for non-API JSON files like manifest
];

// Install event - cache only essential static assets
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
          // Delete old cache versions
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control immediately
  self.clients.claim();
});

// SECURITY: Handle cache clear message from app (on logout)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_ALL_CACHES') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        // Notify all clients that caches are cleared
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'CACHES_CLEARED' });
          });
        });
      })
    );
  }
});

/**
 * SECURITY: Check if a URL should be cached
 * Only static assets with safe extensions are cacheable
 */
function isCacheable(url) {
  const pathname = url.pathname;
  
  // Never cache paths in the no-cache list
  if (NO_CACHE_PATHS.some(path => pathname.startsWith(path))) {
    return false;
  }
  
  // Only cache files with safe extensions
  const hasExtension = pathname.includes('.');
  if (hasExtension) {
    return SAFE_TO_CACHE_EXTENSIONS.some(ext => pathname.endsWith(ext));
  }
  
  // Don't cache navigation requests (HTML pages) - they may contain user data
  return false;
}

// Fetch event - network-first for most content, cache only static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external requests
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }

  // SECURITY: NEVER cache API, auth routes, or HTML pages - always go to network
  if (!isCacheable(url)) {
    event.respondWith(fetch(request));
    return;
  }

  // Cache-first strategy ONLY for static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cache, but also update in background (stale-while-revalidate)
        fetch(request).then((response) => {
          if (response.ok) {
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, response);
            });
          }
        }).catch(() => {/* ignore fetch errors for background update */});
        
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response.ok) {
          return response;
        }

        // Cache successful static asset responses
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });

        return response;
      });
    })
  );
});