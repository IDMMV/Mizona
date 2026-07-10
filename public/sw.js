const CACHE_VERSION = 'mizona-v8-etapa30-43-9-reset';

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request, { cache: 'no-store' }).catch(() => {
    if (event.request.mode === 'navigate') {
      return new Response('<!doctype html><title>MiZona</title><body style="font-family:system-ui;padding:24px"><h1>MiZona sin conexión</h1><p>Vuelve a conectarte y actualiza.</p></body>', {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    return new Response('', { status: 504, statusText: 'Sin conexión' });
  }));
});
