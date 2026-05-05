(function(){
  'use strict';
  const VERSION = 'V396_ANTI_DUPLICATE_PUSH';
  const EVENT_COOLDOWN_MS = 30000;
  const seen = new Map();
  const LOCAL_DEDUPE_KEY = 'v396_sent_event_dedupe';
  const LOCAL_DEDUPE_TTL_MS = 10 * 60 * 1000;

  function readLocalDedupe(){
    try { return JSON.parse(localStorage.getItem(LOCAL_DEDUPE_KEY) || '{}'); } catch(_e){ return {}; }
  }
  function writeLocalDedupe(obj){
    try { localStorage.setItem(LOCAL_DEDUPE_KEY, JSON.stringify(obj)); } catch(_e){}
  }
  function recentlyHandledLocal(key){
    const now = Date.now();
    const obj = readLocalDedupe();
    Object.keys(obj).forEach(k => { if(now - Number(obj[k] || 0) > LOCAL_DEDUPE_TTL_MS) delete obj[k]; });
    if(obj[key] && now - Number(obj[key]) < LOCAL_DEDUPE_TTL_MS){ writeLocalDedupe(obj); return true; }
    obj[key] = now;
    writeLocalDedupe(obj);
    return false;
  }

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function db(){ return window.vpSupabase || window.supabase || null; }
  function clean(v){ return String(v == null ? '' : v).trim(); }
  function norm(v){ return clean(v).toLowerCase(); }
  function approved(row){ const s = norm(row && row.status); return s.includes('approved') || s.includes('sent') || s.includes('מאושר') || s === 'order'; }
  function pending(row){ return !!clean(row && row.order_no) && !approved(row); }
  function money(v){ const n = Number(v || 0); if(!Number.isFinite(n) || n === 0) return ''; try{return 'R '+n.toLocaleString('en-ZA',{maximumFractionDigits:2});}catch(_e){return 'R '+String(n);} }
  function rowTitle(row){ return [clean(row && row.order_no), clean(row && row.supplier), money(row && (row.total || row.amount || row.net_amount))].filter(Boolean).join(' · '); }

  function toast(message){
    let t = document.getElementById('v395Toast');
    if(t) t.remove();
    t = document.createElement('div');
    t.id = 'v395Toast';
    t.innerHTML = message;
    t.style.cssText = 'position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 64px);transform:translateX(-50%);z-index:1000010;background:rgba(14,15,18,.96);color:#f8dcae;border:1px solid rgba(215,176,108,.75);border-radius:18px;padding:12px 15px;box-shadow:0 20px 60px rgba(0,0,0,.5);font:800 13px -apple-system,BlinkMacSystemFont,Segoe UI,Arial;max-width:92vw;text-align:center;direction:ltr;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)';
    document.body.appendChild(t);
    setTimeout(function(){ try{ t.remove(); }catch(_e){} }, 4200);
  }

  function addFeed(kind, title, body){
    const item = { id: Date.now() + '-' + Math.random().toString(36).slice(2), kind, title, body, at: new Date().toISOString(), read: false };
    let list = [];
    try{ list = JSON.parse(localStorage.getItem('v395_notification_feed') || '[]'); }catch(_e){}
    list.unshift(item);
    list = list.slice(0, 50);
    localStorage.setItem('v395_notification_feed', JSON.stringify(list));
    updateBadge();
    return item;
  }

  function feed(){
    try{ return JSON.parse(localStorage.getItem('v395_notification_feed') || '[]'); }catch(_e){ return []; }
  }

  function unreadCount(){ return feed().filter(x => !x.read).length; }

  function updateBadge(){
    const b = document.getElementById('v395NotifBadge');
    if(!b) return;
    const n = unreadCount();
    b.textContent = String(n);
    b.style.display = n ? 'inline-flex' : 'none';
  }

  function injectUI(){
    // V397 PRO CLEAN: Live floating notification button/panel removed.
    // Realtime, push, feed and approval logic remain active.
    return;
  }

  function renderPanel(){
    const el = document.getElementById('v395NotifList');
    if(!el) return;
    const list = feed();
    if(!list.length){ el.innerHTML = '<div class="v395-item"><div class="v395-item-title">No notifications</div><div class="v395-item-body">Realtime is connected. New approvals will appear here.</div></div>'; return; }
    el.innerHTML = list.slice(0, 20).map(x => '<div class="v395-item"><div class="v395-item-title">'+esc(x.title)+'</div><div class="v395-item-body">'+esc(x.body)+'</div><div class="v395-item-time">'+esc(new Date(x.at).toLocaleString())+'</div></div>').join('');
  }

  function markAllRead(){
    const list = feed().map(x => Object.assign({}, x, { read: true }));
    localStorage.setItem('v395_notification_feed', JSON.stringify(list));
    updateBadge();
    renderPanel();
  }

  async function callPushFunction(payload){
    try{
      const res = await fetch('/.netlify/functions/push-realtime-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if(!res.ok) console.warn(VERSION, 'push function failed', await res.text());
      else console.log(VERSION, 'push function', await res.json().catch(()=>({ok:true})));
    }catch(e){ console.warn(VERSION, 'push function error', e && (e.message || e)); }
  }

  function handleRealtimeEvent(payload){
    const eventType = clean(payload && payload.eventType).toUpperCase();
    const row = (payload && payload.new) || {};
    const oldRow = (payload && payload.old) || {};
    const eventRowId = row.id || oldRow.id || row.order_no || oldRow.order_no || '';
    const statusPart = approved(row) ? 'approved' : (pending(row) ? 'pending' : norm(row.status || 'other'));
    const key = [eventType, eventRowId, statusPart].join('|');
    const last = seen.get(key) || 0;
    if(Date.now() - last < EVENT_COOLDOWN_MS) return;
    seen.set(key, Date.now());
    // Prevent multiple tabs/devices from calling the server repeatedly for the same visible event.
    if(recentlyHandledLocal('local|' + key)) return;

    if(eventType === 'INSERT' && pending(row)){
      const body = rowTitle(row) || 'Pre-Order חדש ממתין לאישור.';
      addFeed('preorder', 'Pre-Order לאישור', body);
      toast('🔔 Pre-Order חדש לאישור<br><small>'+esc(body)+'</small>');
      callPushFunction({ eventType, new: row, old: oldRow });
      return;
    }

    if(eventType === 'UPDATE' && approved(row) && !approved(oldRow)){
      const body = (rowTitle(row) || clean(row.order_no) || 'Order') + ' אושרה ואפשר לשלוח לספק.';
      addFeed('approved', 'הזמנה אושרה ✅', body);
      toast('✅ הזמנה אושרה<br><small>'+esc(body)+'</small>');
      callPushFunction({ eventType, new: row, old: oldRow });
      return;
    }
  }

  function attachRealtime(){
    const supa = db();
    if(!supa || window.__v396RealtimeChannel) return;
    try{
      window.__v396RealtimeChannel = supa
        .channel('v396-pro-notification-events')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'suppliers' }, handleRealtimeEvent)
        .subscribe(function(status){
          console.log(VERSION, 'status', status);
          if(status === 'SUBSCRIBED') toast('Realtime notifications connected');
        });
    }catch(e){ console.warn(VERSION, 'attach error', e && (e.message || e)); }
  }

  function init(){
    injectUI();
    attachRealtime();
    setInterval(function(){ injectUI(); }, 12000);
  }

  window.v395MarkNotificationsRead = markAllRead;
  window.v395RenderNotificationPanel = renderPanel;
  window.addEventListener('load', function(){ setTimeout(init, 2200); });
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(init, 1800); });
  console.log(VERSION, 'loaded');
})();
