(function(){
  'use strict';
  const VERSION = 'V390_SMART_REFRESH_CHANGE_ONLY';
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
  function compact(rows){
    return (rows || []).map(r => [
      r.id,
      r.created_at,
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
  async function getSignature(){
    const db = supa();
    if(!db) return '';
    const { data, error } = await db
      .from('suppliers')
      .select('id,created_at,order_no,invoice_no,supplier,project,status,entry_type,total,amount,notes')
      .order('created_at', { ascending:false })
      .limit(1000);
    if(error) throw error;
    return compact(data || []);
  }
  async function refreshUI(reason){
    const x = window.scrollX || 0;
    const y = window.scrollY || 0;
    try{
      if(typeof window.render === 'function') await window.render();
      if(typeof window.v379TriggerApprovalPush === 'function' && reason === 'manual') {
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
      const sig = await getSignature();
      if(!sig) return;
      if(!lastSignature){ lastSignature = sig; return; }
      if(sig !== lastSignature){
        lastSignature = sig;
        await refreshUI(reason || 'auto');
        console.log(VERSION, 'updated UI after data change');
      }
    }catch(e){
      console.warn(VERSION, e && (e.message || e));
    }finally{
      running = false;
    }
  }
  function start(){
    stop();
    setTimeout(async function(){
      try { lastSignature = await getSignature(); } catch(e) { console.warn(VERSION, e && (e.message || e)); }
    }, 1500);
    timer = setInterval(function(){ checkForChanges('auto'); }, INTERVAL_MS);
  }
  function stop(){ if(timer){ clearInterval(timer); timer = null; } }
  window.manualRefresh = async function(){
    manualLock = true;
    try{
      lastSignature = '';
      await refreshUI('manual');
      lastSignature = await getSignature();
    }catch(e){
      console.warn(VERSION, e && (e.message || e));
      try { if(typeof window.render === 'function') await window.render(); } catch(_e){}
    }finally{
      setTimeout(function(){ manualLock = false; }, 1200);
      start();
    }
  };
  function injectButton(){
    if(document.getElementById('v390RefreshBtn')) return;
    const st = document.createElement('style');
    st.id = 'v390RefreshStyle';
    st.textContent = '#v390RefreshBtn{position:fixed;left:14px;bottom:calc(env(safe-area-inset-bottom,0px) + 14px);z-index:1000000;border:1px solid rgba(215,176,108,.55);border-radius:999px;background:rgba(17,18,22,.88);color:#f2d09a;box-shadow:0 12px 35px rgba(0,0,0,.35);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);height:42px;padding:0 13px;font-weight:900}#v390RefreshBtn:active{transform:scale(.98)}';
    document.head.appendChild(st);
    const btn = document.createElement('button');
    btn.id = 'v390RefreshBtn';
    btn.type = 'button';
    btn.textContent = '🔄 Sync';
    btn.onclick = function(){ window.manualRefresh && window.manualRefresh(); };
    document.body.appendChild(btn);
  }
  window.v390StartSmartRefresh = start;
  window.v390StopSmartRefresh = stop;
  window.addEventListener('load', function(){ setTimeout(function(){ injectButton(); start(); }, 1200); });
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) checkForChanges('auto'); });
  console.log(VERSION, 'loaded');
})();
