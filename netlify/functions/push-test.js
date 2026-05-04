const webpush = require('web-push');
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
    const body = JSON.parse(event.body || '{}');
    const subscription = body.subscription;
    if (!subscription || !subscription.endpoint) {
      return json(400, { error: 'No subscription supplied. Press Enable first.' });
    }
    const payload = JSON.stringify({
      title: 'Vardophase test notification',
      body: 'Push עובד ✅ ההתראות מחוברות בלי Blobs.',
      url: body.url || '/?approvals=1',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'vardophase-test-' + Date.now()
    });
    await webpush.sendNotification(subscription, payload);
    return json(200, { ok: true, sent: 1, mode: 'no-blobs' });
  } catch (err) {
    return json(500, { error: err.message || 'Push test failed' });
  }
};
