(function(){
  'use strict';
  const VERSION = 'V392_UI_SYNC_FIX';
  const INTERVAL_MS = 15000;
  let timer = null;
  let lastSignature = '';
  let running = false;
  let manualLock = false;

  function supa(){ return window.vpSupabase || window.supabase || null; }
  function appVisible(){ const app = document.getElementById('appScreen'); return !!app && !app.classList.contains('hidden'); }
  function modalOpen(){ return !!document.querySelector('.modal.show'); }
  function userIsTyping(){
    const el = document.activeElement;
    if(!el) return false;
    const tag = String(el.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
  }
  function selectedCount(){ try { return Array.isArray(window.selectedIds) ? window.selectedIds.length : 0; } catch(_e){ return 0; } }
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
    let t = document.getElementById('v392SyncToast') || document.getElementById('v391SyncToast');
    if(t) t.remove();
    t = document.createElement('div');
    t.id = 'v392SyncToast';
    t.textContent = msg;
    t.style.cssText = 'position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 72px);transform:translateX(-50%);z-index:1000003;background:rgba(17,18,22,.94);color:#f2d09a;border:1px solid rgba(215,176,108,.72);border-radius:14px;padding:10px 14px;font-weight:900;box-shadow:0 18px 55px rgba(0,0,0,.45);max-width:92vw;text-align:center;font-family:Arial,Helvetica,sans-serif';
    document.body.appendChild(t);
    setTimeout(function(){ try{ t.remove(); }catch(_e){} }, 2600);
  }
  function setButtonState(text, busy){
    const btn = document.getElementById('v392SyncBtn') || document.getElementById('v391SyncBtn') || document.getElementById('v390RefreshBtn');
    if(!btn) return;
    btn.textContent = text || '🔄 Sync';
    btn.disabled = !!busy;
    btn.style.opacity = busy ? '.72' : '';
  }
  function compact(rows){
    return (rows || []).map(r => [
      r.id, r.created_at || '', r.updated_at || '', r.order_no || '', r.invoice_no || '',
      r.supplier || '', r.project || '', r.status || '', r.entry_type || '',
      r.total || r.amount || 0, r.notes || ''
    ].join('~')).join('|');
  }
  async function remoteSnapshot(){
    const db = supa();
    if(!db) return { signature:'', count:0, rows:[] };
    const { data, error } = await db
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending:false })
      .limit(5000);
    if(error) throw error;
    const rows = data || [];
    return { signature: compact(rows), count: rows.length, rows };
  }
  function forceDomReflow(){
    try { document.body.offsetHeight; } catch(_e){}
    try { window.dispatchEvent(new Event('resize')); } catch(_e){}
  }
  function visibleTableRows(){
    try{
      const rows = document.querySelectorAll('.table-wrap tbody tr, table tbody tr');
      return rows ? rows.length : 0;
    }catch(_e){ return 0; }
  }
  async function redrawUI(reason, snap){
    const x = window.scrollX || 0;
    const y = window.scrollY || 0;
    try{
      if(reason === 'manual'){
        try { window.selectedIds = []; } catch(_e){}
      }
      // render() is the real source-driven renderer in the app. Await it, then force a second
      // frame so mobile Safari/PWA replaces the stale table DOM after cloud sync.
      if(typeof window.render === 'function'){
        await window.render();
        await new Promise(function(resolve){ requestAnimationFrame(function(){ requestAnimationFrame(resolve); }); });
        forceDomReflow();
      }
      // Extra hooks for older patch files if present.
      const hooks = ['renderApprovals','renderDashboard','updateDashboard','renderToolbarButtons','renderSelectionButtons'];
      hooks.forEach(function(name){ try{ if(typeof window[name] === 'function') window[name](); }catch(_e){} });
      if(typeof window.v379TriggerApprovalPush === 'function'){
        try { setTimeout(function(){ window.v379TriggerApprovalPush(false); }, 700); } catch(_e){}
      }
      // Manual fallback: if a manual sync completed but the DOM is still stale, do exactly what
      // closing/reopening the app does, with a cache-buster. This only triggers when needed.
      if(reason === 'manual'){
        setTimeout(function(){
          try{
            const rowsNow = visibleTableRows();
            if(snap && snap.count >= 0 && rowsNow > snap.count + 1){
              sessionStorage.setItem('v392SyncReloadOnce','1');
              const u = new URL(location.href);
              u.searchParams.set('sync', Date.now().toString());
              location.replace(u.toString());
            }
          }catch(_e){}
        }, 450);
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
      const changed = !lastSignature || snap.signature !== lastSignature;
      if(reason === 'manual' || changed){
        lastSignature = snap.signature;
        await redrawUI(reason || 'auto', snap);
        if(reason === 'manual') toast('Synced from cloud. Rows: ' + snap.count);
        console.log(VERSION, 'UI synced from Supabase source', reason || 'auto', snap.count);
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
  async function seedSignature(){ try { const snap = await remoteSnapshot(); lastSignature = snap.signature || ''; } catch(e){ console.warn(VERSION, e && (e.message || e)); } }
  function start(){ stop(); setTimeout(seedSignature, 1200); /* V411: realtime handles live changes; no 15s polling. */ }
  function stop(){ if(timer){ clearInterval(timer); timer = null; } }
  window.manualRefresh = async function(){
    manualLock = true;
    try { await checkForChanges('manual'); }
    finally { setTimeout(function(){ manualLock = false; }, 800); start(); }
  };
  function injectButton(){
    ['v390RefreshBtn','v391SyncBtn','v392SyncBtn'].forEach(function(id){ const old = document.getElementById(id); if(old) old.remove(); });
    if(!document.getElementById('v392SyncStyle')){
      const st = document.createElement('style');
      st.id = 'v392SyncStyle';
      st.textContent = '#v392SyncBtn{position:fixed;left:14px;bottom:calc(env(safe-area-inset-bottom,0px) + 14px);z-index:1000000;border:1px solid rgba(215,176,108,.55);border-radius:999px;background:rgba(17,18,22,.88);color:#f2d09a;box-shadow:0 12px 35px rgba(0,0,0,.35);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);height:42px;padding:0 13px;font-weight:900}#v392SyncBtn:active{transform:scale(.98)}#v392SyncBtn:disabled{cursor:wait}';
      document.head.appendChild(st);
    }
    const btn = document.createElement('button');
    btn.id = 'v392SyncBtn';
    btn.type = 'button';
    btn.textContent = '🔄 Sync';
    btn.onclick = function(){ window.manualRefresh && window.manualRefresh(); };
    document.body.appendChild(btn);
  }
  window.v392StartSmartSync = start;
  window.v392StopSmartSync = stop;
  window.addEventListener('load', function(){ setTimeout(function(){ injectButton(); start(); }, 1200); });
  document.addEventListener('visibilitychange', function(){ /* V411: no automatic sync on login/typing. Use realtime/manual Sync. */ });
  console.log(VERSION, 'loaded');
})();
