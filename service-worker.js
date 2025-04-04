const CACHE_NAME = 'peso-cache-v1.0.20'; // Cambia la versión aquí

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './tension.html',
        './peso.html',
        './sleep.html',
        './css/style.css',
        './css/sleep.css',
        './js/peso.js',
        './js/tension.js',
        './js/sleep.js',
        './assets/icon-192.png',
        './assets/icon-512.png',
        './manifest.json'
        
      ]);
    })
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log(`Deleting old cache: ${cache}`);
            return caches.delete(cache);
          }
        })
      );
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
