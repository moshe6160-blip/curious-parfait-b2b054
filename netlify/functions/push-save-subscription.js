const { saveSubscription } = require('./_push-store');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const subscription = body.subscription;
    if (!subscription || !subscription.endpoint) {
      return { statusCode: 400, body: 'Missing subscription' };
    }
    const saved = await saveSubscription(subscription, {
      device: body.device || '',
      user: body.user || '',
      createdAt: body.createdAt || new Date().toISOString()
    });
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, mode: 'netlify-blobs', key: saved.key })
    };
  } catch (err) {
    return { statusCode: 500, body: err.message || 'Failed to register subscription' };
  }
};
