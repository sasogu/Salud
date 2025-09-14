const CACHE_NAME = 'peso-cache-v1.1.1';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        '/Salud/',
        '/Salud/index.html',
        '/Salud/tension.html',
        '/Salud/peso.html',
        '/Salud/sleep.html',
        '/Salud/medication.html',
        '/Salud/css/style.css',
        '/Salud/js/peso.js',
        '/Salud/js/tension.js',
        '/Salud/js/sleep.js',
        '/Salud/js/medication.js',
        '/Salud/js/backup.js',
        '/Salud/js/sync.js',
        '/Salud/assets/icon-192.png',
        '/Salud/assets/icon-512.png',
        '/Salud/manifest.json'
      ]);
    })
  );
});

self.addEventListener('activate', e => {
  console.log(`Activating new Service Worker: ${CACHE_NAME}`);
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log(`Deleting old cache: ${cache}`);
            return caches.delete(cache).catch(err => {
              console.error(`Failed to delete cache: ${cache}`, err);
            });
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
