const webpush = require('web-push');
const { getStore } = require('@netlify/blobs');
exports.handler = async (event) => {
  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:info@vardophase.co.za';
    if (!publicKey || !privateKey) return { statusCode: 500, body: 'Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY' };
    webpush.setVapidDetails(subject, publicKey, privateKey);
    const body = JSON.parse(event.body || '{}');
    const count = Number(body.count || 0);
    if (!count) return { statusCode: 200, body: JSON.stringify({ ok: true, sent: 0 }) };
    const store = getStore('vardophase-push');
    const subscriptions = (await store.get('subscriptions', { type: 'json' })) || [];
    const first = Array.isArray(body.orders) && body.orders[0] ? body.orders[0] : null;
    const payload = JSON.stringify({
      title: 'Vardophase: approvals waiting',
      body: count === 1 ? `יש הזמנה לאישור: ${first?.order_no || ''}` : `יש ${count} הזמנות שממתינות לאישור`,
      url: body.url || '/?approvals=1',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'vardophase-approvals'
    });
    let sent = 0;
    const alive = [];
    await Promise.all(subscriptions.map(async (sub) => {
      try { await webpush.sendNotification(sub, payload); sent++; alive.push(sub); }
      catch (err) { if (!(err && (err.statusCode === 404 || err.statusCode === 410))) alive.push(sub); }
    }));
    if (alive.length !== subscriptions.length) await store.setJSON('subscriptions', alive);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, sent }) };
  } catch (err) {
    return { statusCode: 500, body: err.message || 'Push failed' };
  }
};
