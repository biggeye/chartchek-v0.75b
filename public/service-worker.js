// In a new file: public/service-worker.js
const CACHE_NAME = 'chartchek-v1';
const URLS_TO_CACHE = [
  '/',
  '/protected',
  '/protected/account',
  '/protected/chat',
  '/protected/documents',
  '/protected/patients',
  '/protected/patients/[id]',
  '/protected/patients/[id]/appointments',
  '/protected/patients/[id]/evaluations',
  '/protected/patients/[id]/vitals',
  // Add more static assets
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // Cache API responses with specific patterns
        if (event.request.url.includes('/api/kipu/facilities', '/api/kipu/patients')) {
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return fetchResponse;
      });
    })
  );
});