const CACHE_NAME = 'tanoh-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // S'il y a internet, on récupère toujours la nouvelle version Github
        // Et on la met de côté dans le téléphone (Cache) pour plus tard
        if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // En cas de coupure d'internet, on affiche la version en mémoire,
        // l'application fonctionnera quand même !
        return caches.match(event.request);
      })
  );
});
