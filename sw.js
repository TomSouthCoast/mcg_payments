const CACHE_NAME = 'mcg-payments-v1';
const urlsToCache = [
  '/',
  './index.html' // Cache the main HTML file
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If the request is in the cache, return it, otherwise fetch from the network
        return response || fetch(event.request);
      })
  );
});
