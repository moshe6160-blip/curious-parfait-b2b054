const webpush = require('web-push');
const { getStore } = require('@netlify/blobs');
const { listSubscriptions, deleteSubscription } = require('./_push-store');

const EVENT_STORE = 'vardophase-push-event-dedupe';

function eventStore(){
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID || '';
  const token = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN || '';
  if(siteID && token){
    try { return getStore({ name: EVENT_STORE, siteID, token }); } catch(_e) {}
    try { return getStore(EVENT_STORE, { siteID, token }); } catch(_e) {}
  }
  return getStore(EVENT_STORE);
}

function cleanText(value){
  return String(value == null ? '' : value).trim();
}

function normalizeStatus(value){
  return cleanText(value).toLowerCase();
}

function isApproved(row){
  const s = normalizeStatus(row && row.status);
  return s.includes('approved') || s.includes('sent') || s.includes('מאושר') || s === 'order';
}

function isPending(row){
  const s = normalizeStatus(row && row.status);
  return !isApproved(row) && !!cleanText(row && row.order_no);
}

function money(value){
  const n = Number(value || 0);
  if(!Number.isFinite(n) || n === 0) return '';
  try { return 'R ' + n.toLocaleString('en-ZA', { maximumFractionDigits: 2 }); }
  catch(_e){ return 'R ' + String(n); }
}

function buildPayload(body){
  const eventType = cleanText(body.eventType || body.type).toUpperCase();
  const row = body.new || body.row || {};
  const oldRow = body.old || {};
  const orderNo = cleanText(row.order_no || row.po_no || row.po || row.id || 'Order');
  const supplier = cleanText(row.supplier || row.supplier_name || row.vendor || '');
  const project = cleanText(row.project || row.project_name || '');
  const total = money(row.total || row.amount || row.net_amount || row.balance || 0);
  const details = [orderNo, supplier, project, total].filter(Boolean).join(' · ');

  if(eventType === 'INSERT' && isPending(row)){
    return {
      kind: 'preorder-created',
      title: 'Vardophase: Pre-Order לאישור',
      body: details ? `נוצר Pre-Order חדש: ${details}` : 'נוצר Pre-Order חדש שממתין לאישור.',
      url: '/?approvals=1',
      tag: 'vardophase-preorder-' + cleanText(row.id || orderNo).replace(/[^a-zA-Z0-9_-]/g, '-')
    };
  }

  if(eventType === 'UPDATE'){
    const wasApproved = isApproved(oldRow);
    const nowApproved = isApproved(row);
    if(nowApproved && !wasApproved){
      return {
        kind: 'order-approved',
        title: 'Vardophase: הזמנה אושרה ✅',
        body: details ? `${details} אושרה. אפשר לשלוח לספק.` : 'הזמנה אושרה. אפשר לשלוח לספק.',
        url: '/?approvals=1',
        tag: 'vardophase-approved-' + cleanText(row.id || orderNo).replace(/[^a-zA-Z0-9_-]/g, '-')
      };
    }
  }

  return null;
}

async function alreadyHandled(key){
  const s = eventStore();
  const existing = await s.get(key, { type: 'json' }).catch(() => null);
  if(existing) return true;
  await s.setJSON(key, { handledAt: new Date().toISOString() });
  return false;
}

async function sendOne(subscription, payload, key){
  try{
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { ok: true };
  }catch(err){
    const code = Number(err && err.statusCode || 0);
    if((code === 404 || code === 410) && key) await deleteSubscription(key);
    return { ok: false, error: err.message || String(err), statusCode: code };
  }
}

exports.handler = async (event) => {
  try{
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:info@vardophase.co.za';
    if(!publicKey || !privateKey){
      return { statusCode: 500, body: 'Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY' };
    }
    webpush.setVapidDetails(subject, publicKey, privateKey);

    const body = JSON.parse(event.body || '{}');
    const payloadInfo = buildPayload(body);
    if(!payloadInfo){
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, sent: 0, reason: 'event ignored' }) };
    }

    const row = body.new || body.row || {};
    const eventType = cleanText(body.eventType || body.type).toUpperCase();
    const eventId = [payloadInfo.kind, eventType, row.id || row.order_no || '', isApproved(row) ? 'approved' : (isPending(row) ? 'pending' : normalizeStatus(row.status))].join('|');
    const dedupeKey = 'evt-' + Buffer.from(eventId).toString('base64url').slice(0, 180);
    if(await alreadyHandled(dedupeKey)){
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, sent: 0, reason: 'duplicate skipped', key: dedupeKey }) };
    }

    const subscriptions = await listSubscriptions();
    if(!subscriptions.length){
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, sent: 0, reason: 'no saved subscriptions' }) };
    }

    const payload = {
      title: payloadInfo.title,
      body: payloadInfo.body,
      url: payloadInfo.url,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: payloadInfo.tag,
      renotify: false
    };

    const results = [];
    for(const sub of subscriptions){
      results.push(await sendOne(sub.subscription, payload, sub.key));
    }
    const sent = results.filter(r => r.ok).length;
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: sent > 0, sent, targets: subscriptions.length, kind: payloadInfo.kind, results }) };
  }catch(err){
    return { statusCode: 500, body: err.message || 'Push realtime event failed' };
  }
};
