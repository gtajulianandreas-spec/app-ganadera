const CACHE_NAME = 'app-ganadera-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install: Cache critical static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Cache-first for static immutable assets, stale-while-revalidate for dynamic content
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignore browser extensions or external protocols
  if (!url.protocol.startsWith('http')) return;

  const isHashedAsset = url.pathname.startsWith('/assets/');

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If we have a cached version of a hashed immutable asset, serve it immediately
      if (cachedResponse && isHashedAsset) {
        return cachedResponse;
      }

      if (cachedResponse) {
        // Stale-while-revalidate for mutable shell documents
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
          })
          .catch(() => {
            // Offline - noop, we already served cached response
          });
        return cachedResponse;
      }

      // Not in cache: fetch from network and dynamically cache
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is HTML/navigation, serve cached /index.html
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
          // Return null/empty fallback for failed assets when offline
          return new Response('', { status: 503, statusText: 'Offline - Resource unavailable' });
        });
    })
  );
});
