const CACHE_NAME = 'haterra-v5';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icons/haterra-app-icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/brand/haterra-lockup-horizontal-light.svg',
  '/brand/haterra-lockup-horizontal-dark.svg',
  '/brand/haterra-mark-transparent.svg'
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

// Fetch: NEVER cache /api/* or cross-origin requests; Network-first for HTML, Cache-first for hashed assets
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  const isHtmlRequest =
    event.request.mode === 'navigate' ||
    event.request.headers.get('accept')?.includes('text/html') ||
    url.pathname === '/' ||
    url.pathname === '/index.html';

  if (isHtmlRequest) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request).then((res) => res || caches.match('/index.html')))
    );
    return;
  }

  const isHashedAsset = url.pathname.startsWith('/assets/');

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse && isHashedAsset) {
        return cachedResponse;
      }

      if (cachedResponse) {
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

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
        .catch(() => new Response('', { status: 503, statusText: 'Offline - Resource unavailable' }));
    })
  );
});
