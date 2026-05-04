exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const subscription = body.subscription;
    if (!subscription || !subscription.endpoint) {
      return { statusCode: 400, body: 'Missing subscription' };
    }
    // V381 NO BLOBS: no server storage. The browser keeps the subscription locally
    // and sends it back whenever it wants to trigger a push.
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, mode: 'no-blobs' })
    };
  } catch (err) {
    return { statusCode: 500, body: err.message || 'Failed to register subscription' };
  }
};
