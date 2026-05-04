const crypto = require('crypto');
const { getStore } = require('@netlify/blobs');

const STORE_NAME = 'vardophase-push-subscriptions';

function store(){
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID || '';
  const token = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN || '';

  // Netlify Blobs sometimes needs explicit credentials inside Functions.
  // Keep a safe fallback so deployed Netlify runtime can still use default context.
  if(siteID && token){
    try { return getStore({ name: STORE_NAME, siteID, token }); } catch(_e) {}
    try { return getStore(STORE_NAME, { siteID, token }); } catch(_e) {}
  }
  return getStore(STORE_NAME);
}

function keyFor(subscription){
  const endpoint = subscription && subscription.endpoint ? String(subscription.endpoint) : '';
  return 'sub-' + crypto.createHash('sha256').update(endpoint).digest('hex');
}

async function saveSubscription(subscription, meta = {}){
  if(!subscription || !subscription.endpoint) throw new Error('Missing subscription endpoint');
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

async function listSubscriptions(){
  const s = store();
  const list = await s.list({ prefix: 'sub-' });
  const blobs = list && list.blobs ? list.blobs : [];
  const out = [];
  for(const b of blobs){
    try{
      const rec = await s.get(b.key, { type: 'json' });
      if(rec && rec.subscription && rec.subscription.endpoint) out.push({ key: b.key, ...rec });
    }catch(_e){}
  }
  return out;
}

async function deleteSubscription(key){
  if(!key) return;
  try{ await store().delete(key); }catch(_e){}
}

module.exports = { saveSubscription, listSubscriptions, deleteSubscription };
