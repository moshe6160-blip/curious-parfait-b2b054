const VARDOPHASE_SW_VERSION = 'V428-ORDER-DOCK-APPROVED-FIX';
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil((async()=>{
  if (self.clients && self.clients.claim) await self.clients.claim();
})()));
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  // V385: no offline caching. Always let browser/network handle requests to avoid stale blank screens.
});
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { title: 'Vardophase', body: event.data ? event.data.text() : '' }; }
  const title = data.title || 'Vardophase';
  const options = {
    body: data.body || 'יש הזמנות שממתינות לאישור.',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    data: { url: data.url || '/?approvals=1' },
    tag: data.tag || 'vardophase-approvals',
    renotify: false
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification && event.notification.data && event.notification.data.url ? event.notification.data.url : '/?approvals=1';
  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of allClients) {
      if ('focus' in client) { client.navigate(url); return client.focus(); }
    }
    if (clients.openWindow) return clients.openWindow(url);
  })());
});
