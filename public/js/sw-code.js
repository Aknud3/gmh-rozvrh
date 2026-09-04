/// DO NOT CHANGE THIS FILE!!! 

export const SW_CODE = `
const CACHE_NAME = 'test-cache';
const ASSETS = [
  '/',
  '/assets/site.webmanifest',
  '/assets/favicon-96x96.png',
  '/assets/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
  // Skip cross-origin and non-GET requests
  if (!event.request.url.startsWith(self.location.origin) || event.request.method !== 'GET') {
    return;
  }

  // Network-First strategy for API
  if (event.request.url.includes('/api/timetable')) {
        event.respondWith(
            fetch(event.request).then(response => {
                const resClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request.url, resClone);
                });
                return response;
            }).catch(() => {
                return caches.match(event.request.url);
            })
        );
        return; // D\u016Fle\u017Eit\xE9: ukon\u010D\xED fetch handler, aby nepokra\u010Doval d\xE1l
  }

  // Cache-First strategy for assets
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(res => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
        return res;
      });
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      if (windowClients.length > 0) {
        return windowClients[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});
`;