const webpush = require('web-push');
const { listSubscriptions, deleteSubscription } = require('./_push-store');

async function sendOne(subscription, payload, key){
  try{
    await webpush.sendNotification(subscription, payload);
    return { ok: true };
  }catch(err){
    const code = Number(err && err.statusCode || 0);
    if((code === 404 || code === 410) && key) await deleteSubscription(key);
    return { ok: false, error: err.message || String(err), statusCode: code };
  }
}

exports.handler = async (event) => {
  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:info@vardophase.co.za';
    if (!publicKey || !privateKey) return { statusCode: 500, body: 'Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY' };
    webpush.setVapidDetails(subject, publicKey, privateKey);

    const body = JSON.parse(event.body || '{}');
    const orderNo = body.order_no || body.orderNo || 'Order';
    const supplier = body.supplier || '';
    const total = body.total || body.amount || '';
    const project = body.project || '';
    const details = [supplier, project, total].filter(Boolean).join(' · ');
    const payload = JSON.stringify({
      title: 'Vardophase: הזמנה אושרה ✅',
      body: `${orderNo} אושרה${details ? ' — ' + details : ''}. אפשר לשלוח לספק.`,
      url: body.url || '/?approvals=1',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `vardophase-approved-${String(orderNo).replace(/[^a-zA-Z0-9_-]/g,'-')}`,
      renotify: true
    });

    let targets = [];
    if (body.subscription && body.subscription.endpoint) targets = [{ subscription: body.subscription, key: null }];
    else targets = await listSubscriptions();
    if (!targets.length) return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, sent: 0, reason: 'no saved subscriptions' }) };

    const results = [];
    for (const t of targets) results.push(await sendOne(t.subscription, payload, t.key));
    const sent = results.filter(r => r.ok).length;
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: sent > 0, sent, targets: targets.length, mode: 'approved-user-true-push', results }) };
  } catch (err) {
    return { statusCode: 500, body: err.message || 'Approved push failed' };
  }
};
