const webpush = require('web-push');
const { getStore } = require('@netlify/blobs');
function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}
exports.handler = async (event) => {
  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:info@vardophase.co.za';
    if (!publicKey || !privateKey) return json(500, { error: 'Missing VAPID keys in Netlify' });
    webpush.setVapidDetails(subject, publicKey, privateKey);
    const store = getStore('vardophase-push');
    const subscriptions = (await store.get('subscriptions', { type: 'json' })) || [];
    if (!subscriptions.length) return json(400, { error: 'No push subscriptions saved yet. Press Enable first.' });
    const body = JSON.parse(event.body || '{}');
    const payload = JSON.stringify({
      title: 'Vardophase test notification',
      body: 'Push עובד ✅ ההתראות מחוברות.',
      url: body.url || '/?approvals=1',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'vardophase-test-' + Date.now()
    });
    let sent = 0; const alive = [];
    await Promise.all(subscriptions.map(async (sub) => {
      try { await webpush.sendNotification(sub, payload); sent++; alive.push(sub); }
      catch (err) { if (!(err && (err.statusCode === 404 || err.statusCode === 410))) alive.push(sub); }
    }));
    if (alive.length !== subscriptions.length) await store.setJSON('subscriptions', alive);
    return json(200, { ok: true, sent, subscriptions: subscriptions.length });
  } catch (err) {
    return json(500, { error: err.message || 'Push test failed' });
  }
};
