// Service worker de Nubeti Academy: red primero, cache como respaldo.
// Solo cachea recursos del propio sitio (nunca las llamadas a Supabase).
const CACHE_NAME = 'nubeti-v1';
const PRECACHE = [
  'index.html',
  'login.html',
  'manifest.json',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'assets/logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Solo GET, y solo del mismo origen (nunca interceptar Supabase u otros dominios).
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
