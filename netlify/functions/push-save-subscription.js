const { getStore } = require('@netlify/blobs');
exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const subscription = body.subscription;
    if (!subscription || !subscription.endpoint) return { statusCode: 400, body: 'Missing subscription' };
    const store = getStore('vardophase-push');
    const current = (await store.get('subscriptions', { type: 'json' })) || [];
    const next = current.filter(s => s && s.endpoint !== subscription.endpoint);
    next.push({ ...subscription, device: body.device || '', updatedAt: new Date().toISOString() });
    await store.setJSON('subscriptions', next.slice(-200));
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, count: next.length }) };
  } catch (err) {
    return { statusCode: 500, body: err.message || 'Failed to save subscription' };
  }
};
