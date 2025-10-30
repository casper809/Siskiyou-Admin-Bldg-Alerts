const CACHE_NAME = 'admin-alerts-v1';
const OFFLINE_URL = '/';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
];

// Install - cache resources
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate - cleanup old caches
self.addEventListener('activate', event => {
  clients.claim();
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    })
  );
});

// Fetch - cache-first for assets, network-first for navigation
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // For navigation requests, try network first, fallback to cache
  if (request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(request).then(response => {
        // save a copy to cache
        const respClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, respClone));
        return response;
      }).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // For other requests, try cache first
  event.respondWith(
    caches.match(request).then(cached => {
      return cached || fetch(request).then(resp => {
        // Optionally cache fetched assets
        return resp;
      }).catch(() => {
        // If request is for an image or icon fallback, return the 192 icon
        if (request.destination === 'image') {
          return caches.match('/assets/icons/icon-192.png');
        }
      });
    })
  );
});
