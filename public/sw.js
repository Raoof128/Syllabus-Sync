// public/sw.js
// ============================================================================
// SERVICE WORKER - Security-Hardened Caching Strategy
// ============================================================================
// SECURITY: This service worker implements a strict caching policy to prevent
// sensitive data from being cached and exposed after logout or on shared devices.

const CACHE_NAME = 'syllabus-sync-v3'; // Bump version for cache invalidation
const STATIC_CACHE = 'syllabus-sync-static-v3';
const DYNAMIC_CACHE = 'syllabus-sync-dynamic-v3';
const MAP_CACHE = 'syllabus-sync-map-v1'; // Dedicated cache for map assets

// SECURITY: Only cache truly static assets - NO HTML pages that may contain user data
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/favicon.ico',
  '/MQ_Logo_Final.png',
];

// Map assets to precache for offline support (non-sensitive public data)
const MAP_ASSETS = [
  '/maps/raster/mq-campus.png',
  '/maps/raster/mq-campus.png?v=2026-02-02-1',
  '/maps/overlays/Campus-Map_parking.png',
  '/maps/overlays/Drinking-water.png',
  '/maps/overlays/map_accessibility.png',
  '/maps/overlays/map_special_permits_service_vehicles.png',
  '/maps/overlays/Exam-Map-S22024.png',
  '/maps/overlays/MU87371-MQ-Loop-Walk-Map-digital-June-2024.png',
  '/images/leaflet/marker-icon.png',
  '/images/leaflet/marker-icon-2x.png',
  '/images/leaflet/marker-shadow.png',
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

// Install event - cache essential static assets and map assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(MAP_CACHE).then((cache) => {
        // Map assets are optional - don't fail install if they're missing
        return Promise.allSettled(
          MAP_ASSETS.map((asset) =>
            fetch(asset)
              .then((response) => {
                if (response.ok) {
                  return cache.put(asset, response);
                }
              })
              .catch(() => {
                /* ignore failures - map will still work with network */
              })
          )
        );
      }),
    ])
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const validCaches = [STATIC_CACHE, DYNAMIC_CACHE, MAP_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old cache versions
          if (!validCaches.includes(cacheName)) {
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

/**
 * Check if URL is a map asset (for dedicated map cache)
 */
function isMapAsset(url) {
  const pathname = url.pathname;
  return pathname.startsWith('/maps/') || 
         pathname.startsWith('/images/leaflet/') ||
         MAP_ASSETS.some(asset => pathname === asset);
}

/**
 * Build a safe offline response for requests that are intentionally network-only.
 * This prevents unhandled fetch rejections while keeping sensitive routes uncached.
 */
function getOfflineResponse(request) {
  const isDocumentRequest =
    request.mode === 'navigate' || request.destination === 'document';

  if (isDocumentRequest) {
    return new Response(
      '<!doctype html><html><head><meta charset="utf-8"><title>Offline</title></head><body><h1>Offline</h1><p>Please reconnect and try again.</p></body></html>',
      {
        status: 503,
        statusText: 'Offline',
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  const acceptHeader = request.headers.get('accept') || '';
  const isJsonRequest =
    acceptHeader.includes('application/json') || request.url.includes('/api/');

  if (isJsonRequest) {
    return new Response(JSON.stringify({ error: 'Network unavailable' }), {
      status: 503,
      statusText: 'Offline',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  return new Response('', {
    status: 503,
    statusText: 'Offline',
    headers: {
      'Cache-Control': 'no-store',
    },
  });
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
    event.respondWith(
      fetch(request).catch(() => {
        return getOfflineResponse(request);
      })
    );
    return;
  }

  // Special handling for map assets - cache-first with map cache
  if (isMapAsset(url)) {
    event.respondWith(
      caches.open(MAP_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            // Return from cache, update in background
            fetch(request).then((response) => {
              if (response.ok) {
                cache.put(request, response);
              }
            }).catch(() => {/* ignore */});
            return cachedResponse;
          }
          
          // Not in cache, fetch and cache
          return fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => {
            // Return offline placeholder if map fails to load
            return new Response('', { status: 503, statusText: 'Map unavailable offline' });
          });
        });
      })
    );
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
