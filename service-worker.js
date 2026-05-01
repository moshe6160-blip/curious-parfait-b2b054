const CACHE_NAME = 'vardophase-pwa-v308';
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon-180.png', '/icons/icon-192.png', '/icons/icon-512.png'];
self.addEventListener('install', event => { self.skipWaiting(); event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).catch(() => null)); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).then(response => { const clone = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone)).catch(() => null); return response; }).catch(() => caches.match(event.request).then(cached => cached || caches.match('/index.html'))));
});
