// Service Worker minimal para permitir la instalabilidad de la PWA (Oráculo del Tarot)
const CACHE_NAME = 'oraculo-tarot-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Estrategia de red primero con caída a caché para robustez mística
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
