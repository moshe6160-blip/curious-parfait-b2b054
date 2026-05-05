const webpush = require('web-push');
exports.handler = async (event) => {
  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:info@vardophase.co.za';
    if (!publicKey || !privateKey) return { statusCode: 500, body: 'Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY' };
    webpush.setVapidDetails(subject, publicKey, privateKey);
    const body = JSON.parse(event.body || '{}');
    const subscription = body.subscription;
    if (!subscription || !subscription.endpoint) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No subscription supplied. Press Enable first.' }) };
    }
    const count = Number(body.count || 0);
    if (!count) return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, sent: 0 }) };
    const first = Array.isArray(body.orders) && body.orders[0] ? body.orders[0] : null;
    const payload = JSON.stringify({
      title: 'Vardophase: approvals waiting',
      body: count === 1 ? `יש הזמנה לאישור: ${first?.order_no || ''}` : `יש ${count} הזמנות שממתינות לאישור`,
      url: body.url || '/?approvals=1',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'vardophase-approvals'
    });
    await webpush.sendNotification(subscription, payload);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, sent: 1, mode: 'no-blobs' }) };
  } catch (err) {
    return { statusCode: 500, body: err.message || 'Push failed' };
  }
};
