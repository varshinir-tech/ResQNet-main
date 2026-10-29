/*
 * ResQNet Service Worker
 * Provides offline shell caching, static assets caching, and graceful offline fallbacks.
 */

const CACHE_NAME = 'resqnet-cache-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/icon-192.svg',
  '/icon-512.svg'
];

// Install: Cache essential shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first for dynamic navigation, Cache-falling-back-to-network for static assets
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip caching Socket.IO and non-GET requests
  if (req.method !== 'GET' || url.pathname.startsWith('/socket.io/')) {
    return;
  }

  // API Requests: Network-first with cached fallback if available
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          // If valid response, clone and cache read-only GET requests (e.g. shelters, stats)
          if (response && response.status === 200) {
            const respClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, respClone);
            });
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) {
            return cached;
          }
          return new Response(
            JSON.stringify({
              success: false,
              offline: true,
              message: 'You are currently offline. Live database server is unreachable.'
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // HTML Navigation Requests (Single Page App routing)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          const respClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, respClone));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
          return caches.match('/');
        })
    );
    return;
  }

  // Static Assets (JS, CSS, images, fonts): Cache-first with network fallback & background update
  event.respondWith(
    caches.match(req).then((cachedResp) => {
      if (cachedResp) {
        // Fetch in background to update cache (stale-while-revalidate)
        fetch(req).then((netResp) => {
          if (netResp && netResp.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, netResp));
          }
        }).catch(() => {});
        return cachedResp;
      }

      return fetch(req)
        .then((networkResp) => {
          if (!networkResp || networkResp.status !== 200 || networkResp.type !== 'basic') {
            return networkResp;
          }
          const respClone = networkResp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, respClone));
          return networkResp;
        })
        .catch(() => {
          // Return generic fallback or empty 404
          return new Response('Resource unavailable offline', { status: 408 });
        });
    })
  );
});
