self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {});
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { title: 'Vardophase', body: event.data ? event.data.text() : '' }; }
  const title = data.title || 'Vardophase Approvals';
  const options = {
    body: data.body || 'יש הזמנות שממתינות לאישור.',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    data: { url: data.url || '/?approvals=1' },
    tag: data.tag || 'vardophase-approvals',
    renotify: true
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
