self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('peso-cache-v1.0.1').then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './style.css',
        './app.js',
        './manifest.json'
      ]);
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(respuesta => {
      return respuesta || fetch(e.request);
    })
  );
});
