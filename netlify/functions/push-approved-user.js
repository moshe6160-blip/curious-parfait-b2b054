const webpush = require('web-push');

exports.handler = async (event) => {
  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:info@vardophase.co.za';
    if (!publicKey || !privateKey) {
      return { statusCode: 500, body: 'Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY' };
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const body = JSON.parse(event.body || '{}');
    const subscription = body.subscription;
    if (!subscription || !subscription.endpoint) {
      return { statusCode: 400, body: 'No subscription supplied. Press Enable first.' };
    }

    const orderNo = body.order_no || body.orderNo || 'Order';
    const supplier = body.supplier || '';
    const total = body.total || body.amount || '';
    const project = body.project || '';

    const details = [supplier, project, total].filter(Boolean).join(' · ');
    const payload = JSON.stringify({
      title: 'Vardophase: Order approved ✅',
      body: `${orderNo} אושרה${details ? ' — ' + details : ''}. אפשר לשלוח לספק.`,
      url: body.url || '/?approvals=1',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `vardophase-approved-${orderNo}`,
      renotify: true
    });

    await webpush.sendNotification(subscription, payload);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, sent: 1, mode: 'approved-user-no-blobs' })
    };
  } catch (err) {
    return { statusCode: 500, body: err.message || 'Approved push failed' };
  }
};
