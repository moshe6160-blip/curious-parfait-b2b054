// V387 FIX: Netlify Blobs store with explicit siteID + token from Environment Variables
// Required env vars in Netlify:
// NETLIFY_SITE_ID
// NETLIFY_AUTH_TOKEN

const crypto = require('crypto');
const { getStore } = require('@netlify/blobs');

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value || String(value).trim() === '') {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return String(value).trim();
}

function store() {
  return getStore({
    name: 'vardophase-push-subscriptions',
    siteID: getRequiredEnv('NETLIFY_SITE_ID'),
    token: getRequiredEnv('NETLIFY_AUTH_TOKEN')
  });
}

function keyFor(subscription) {
  const endpoint = subscription && subscription.endpoint ? String(subscription.endpoint) : '';
  if (!endpoint) throw new Error('Missing subscription endpoint');
  return 'sub-' + crypto.createHash('sha256').update(endpoint).digest('hex');
}

async function saveSubscription(subscription, meta = {}) {
  const s = store();
  const key = keyFor(subscription);
  const record = {
    subscription,
    meta,
    endpoint: subscription.endpoint,
    updatedAt: new Date().toISOString()
  };
  await s.setJSON(key, record);
  return { key, record };
}

async function listSubscriptions() {
  const s = store();
  const list = await s.list({ prefix: 'sub-' });
  const blobs = list && list.blobs ? list.blobs : [];
  const out = [];
  for (const b of blobs) {
    try {
      const rec = await s.get(b.key, { type: 'json' });
      if (rec && rec.subscription) out.push(rec);
    } catch (e) {
      console.warn('Failed reading subscription blob', b.key, e && e.message ? e.message : e);
    }
  }
  return out;
}

async function deleteSubscription(subscriptionOrEndpoint) {
  const endpoint = typeof subscriptionOrEndpoint === 'string'
    ? subscriptionOrEndpoint
    : subscriptionOrEndpoint && subscriptionOrEndpoint.endpoint;
  if (!endpoint) return false;
  const key = 'sub-' + crypto.createHash('sha256').update(String(endpoint)).digest('hex');
  await store().delete(key);
  return true;
}

module.exports = {
  store,
  saveSubscription,
  listSubscriptions,
  deleteSubscription,
  keyFor
};
