const CACHE_NAME = 'bukumoney-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // Force new service worker to activate immediately
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Force clients to use the new service worker
});

self.addEventListener('fetch', event => {
  // Hanya tangani GET request, hindari cache request Chrome Extension dll.
  if (event.request.method !== 'GET') return;

  event.respondWith(
    // Strategi: Network First, Fallback ke Cache
    // Ini menjamin app selalu up-to-date selama ada internet.
    fetch(event.request)
      .then(response => {
        // Simpan versi terbaru ke cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Jika sedang offline, gunakan cache lokal
        return caches.match(event.request);
      })
  );
});
