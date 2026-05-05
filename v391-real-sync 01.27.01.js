(function(){
  'use strict';
  const VERSION = 'V391_REAL_SYNC_SOURCE_ONLY';
  const INTERVAL_MS = 15000;
  let timer = null;
  let lastSignature = '';
  let running = false;
  let manualLock = false;

  function supa(){ return window.vpSupabase || window.supabase || null; }
  function appVisible(){
    const app = document.getElementById('appScreen');
    return !!app && !app.classList.contains('hidden');
  }
  function modalOpen(){ return !!document.querySelector('.modal.show'); }
  function userIsTyping(){
    const el = document.activeElement;
    if(!el) return false;
    const tag = String(el.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
  }
  function selectedCount(){
    try { return Array.isArray(window.selectedIds) ? window.selectedIds.length : 0; } catch(_e){ return 0; }
  }
  function shouldSkipAuto(){
    if(manualLock) return true;
    if(document.hidden) return true;
    if(!appVisible()) return true;
    if(modalOpen()) return true;
    if(userIsTyping()) return true;
    if(selectedCount() > 0) return true;
    return false;
  }
  function toast(msg){
    let t = document.getElementById('v391SyncToast');
    if(t) t.remove();
    t = document.createElement('div');
    t.id = 'v391SyncToast';
    t.textContent = msg;
    t.style.cssText = 'position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 72px);transform:translateX(-50%);z-index:1000003;background:rgba(17,18,22,.94);color:#f2d09a;border:1px solid rgba(215,176,108,.72);border-radius:14px;padding:10px 14px;font-weight:900;box-shadow:0 18px 55px rgba(0,0,0,.45);max-width:92vw;text-align:center;font-family:Arial,Helvetica,sans-serif';
    document.body.appendChild(t);
    setTimeout(function(){ try{ t.remove(); }catch(_e){} }, 2600);
  }
  function setButtonState(text, busy){
    const btn = document.getElementById('v391SyncBtn') || document.getElementById('v390RefreshBtn');
    if(!btn) return;
    btn.textContent = text || '🔄 Sync';
    btn.disabled = !!busy;
    btn.style.opacity = busy ? '.72' : '';
  }
  function compact(rows){
    return (rows || []).map(r => [
      r.id,
      r.created_at || '',
      r.updated_at || '',
      r.order_no || '',
      r.invoice_no || '',
      r.supplier || '',
      r.project || '',
      r.status || '',
      r.entry_type || '',
      r.total || r.amount || 0,
      r.notes || ''
    ].join('~')).join('|');
  }
  async function remoteSnapshot(){
    const db = supa();
    if(!db) return { signature:'', count:0 };
    const { data, error } = await db
      .from('suppliers')
      .select('id,created_at,updated_at,order_no,invoice_no,supplier,project,status,entry_type,total,amount,notes')
      .order('created_at', { ascending:false })
      .limit(5000);
    if(error) throw error;
    const rows = data || [];
    return { signature: compact(rows), count: rows.length };
  }
  async function renderFromSource(reason){
    const x = window.scrollX || 0;
    const y = window.scrollY || 0;
    try{
      // Manual sync must clear selected rows so the mobile table can redraw cleanly.
      if(reason === 'manual'){
        try { window.selectedIds = []; } catch(_e){}
      }
      if(typeof window.render === 'function') await window.render();
      if(typeof window.v379TriggerApprovalPush === 'function'){
        try { setTimeout(function(){ window.v379TriggerApprovalPush(false); }, 700); } catch(_e){}
      }
    } finally {
      setTimeout(function(){ try{ window.scrollTo(x, y); }catch(_e){} }, 30);
    }
  }
  async function checkForChanges(reason){
    if(running) return;
    if(reason !== 'manual' && shouldSkipAuto()) return;
    running = true;
    try{
      if(reason === 'manual') setButtonState('⏳ Syncing...', true);
      const snap = await remoteSnapshot();
      if(!snap.signature){
        if(reason === 'manual') toast('Sync failed: cloud source not ready');
        return;
      }
      if(!lastSignature){
        lastSignature = snap.signature;
        if(reason === 'manual'){
          await renderFromSource('manual');
          toast('Synced. Rows: ' + snap.count);
        }
        return;
      }
      if(reason === 'manual' || snap.signature !== lastSignature){
        lastSignature = snap.signature;
        await renderFromSource(reason || 'auto');
        if(reason === 'manual') toast('Synced from cloud. Rows: ' + snap.count);
        console.log(VERSION, 'UI synced from Supabase source', reason || 'auto');
      } else if(reason === 'manual'){
        toast('Already up to date. Rows: ' + snap.count);
      }
    }catch(e){
      console.warn(VERSION, e && (e.message || e));
      if(reason === 'manual') toast('Sync error: ' + (e && e.message ? e.message : 'unknown'));
      try { if(reason === 'manual' && typeof window.render === 'function') await window.render(); } catch(_e){}
    }finally{
      running = false;
      if(reason === 'manual') setTimeout(function(){ setButtonState('🔄 Sync', false); }, 400);
    }
  }
  async function seedSignature(){
    try { const snap = await remoteSnapshot(); lastSignature = snap.signature || ''; } catch(e){ console.warn(VERSION, e && (e.message || e)); }
  }
  function start(){
    stop();
    setTimeout(seedSignature, 1200);
    timer = setInterval(function(){ checkForChanges('auto'); }, INTERVAL_MS);
  }
  function stop(){ if(timer){ clearInterval(timer); timer = null; } }
  window.manualRefresh = async function(){
    manualLock = true;
    try { await checkForChanges('manual'); }
    finally {
      setTimeout(function(){ manualLock = false; }, 800);
      start();
    }
  };
  function injectButton(){
    const old = document.getElementById('v390RefreshBtn');
    if(old) old.remove();
    if(document.getElementById('v391SyncBtn')) return;
    if(!document.getElementById('v391SyncStyle')){
      const st = document.createElement('style');
      st.id = 'v391SyncStyle';
      st.textContent = '#v391SyncBtn{position:fixed;left:14px;bottom:calc(env(safe-area-inset-bottom,0px) + 14px);z-index:1000000;border:1px solid rgba(215,176,108,.55);border-radius:999px;background:rgba(17,18,22,.88);color:#f2d09a;box-shadow:0 12px 35px rgba(0,0,0,.35);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);height:42px;padding:0 13px;font-weight:900}#v391SyncBtn:active{transform:scale(.98)}#v391SyncBtn:disabled{cursor:wait}';
      document.head.appendChild(st);
    }
    const btn = document.createElement('button');
    btn.id = 'v391SyncBtn';
    btn.type = 'button';
    btn.textContent = '🔄 Sync';
    btn.onclick = function(){ window.manualRefresh && window.manualRefresh(); };
    document.body.appendChild(btn);
  }
  window.v391StartSmartSync = start;
  window.v391StopSmartSync = stop;
  window.addEventListener('load', function(){ setTimeout(function(){ injectButton(); start(); }, 1200); });
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) checkForChanges('auto'); });
  console.log(VERSION, 'loaded');
})();
