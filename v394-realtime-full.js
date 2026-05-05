(function(){
  'use strict';
  const VERSION = 'V394_REALTIME_FULL';
  let channel = null;
  let renderTimer = null;
  let lastEventAt = 0;
  let active = false;

  function db(){ return window.vpSupabase || window.supabase || null; }
  function appReady(){ return !!(document.getElementById('app') || document.getElementById('appScreen')); }
  function modalOpen(){ return !!document.querySelector('.modal.show'); }
  function userIsTyping(){
    const el = document.activeElement;
    if(!el) return false;
    const tag = String(el.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
  }
  function toast(msg){
    let t = document.getElementById('v394RealtimeToast');
    if(t) t.remove();
    t = document.createElement('div');
    t.id = 'v394RealtimeToast';
    t.textContent = msg;
    t.style.cssText = 'position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 122px);transform:translateX(-50%);z-index:1000004;background:rgba(17,18,22,.94);color:#f2d09a;border:1px solid rgba(215,176,108,.72);border-radius:14px;padding:10px 14px;font-weight:900;box-shadow:0 18px 55px rgba(0,0,0,.45);max-width:92vw;text-align:center;font-family:Arial,Helvetica,sans-serif';
    document.body.appendChild(t);
    setTimeout(function(){ try{ t.remove(); }catch(_e){} }, 2200);
  }
  async function safeRender(reason){
    const x = window.scrollX || 0;
    const y = window.scrollY || 0;
    try{
      if(typeof window.render === 'function'){
        await window.render();
        await new Promise(function(resolve){ requestAnimationFrame(function(){ requestAnimationFrame(resolve); }); });
      }
      ['renderApprovals','renderDashboard','updateDashboard','renderToolbarButtons','renderSelectionButtons'].forEach(function(name){
        try{ if(typeof window[name] === 'function') window[name](); }catch(_e){}
      });
      try{ window.dispatchEvent(new Event('resize')); }catch(_e){}
      if(typeof window.v379TriggerApprovalPush === 'function'){
        try{ setTimeout(function(){ window.v379TriggerApprovalPush(false); }, 500); }catch(_e){}
      }
      console.log(VERSION, 'rendered from realtime', reason || 'change');
    }catch(e){
      console.warn(VERSION, 'render error', e && (e.message || e));
    }finally{
      setTimeout(function(){ try{ window.scrollTo(x, y); }catch(_e){} }, 30);
    }
  }
  function scheduleRender(reason){
    lastEventAt = Date.now();
    if(userIsTyping() || modalOpen()){
      clearTimeout(renderTimer);
      renderTimer = setTimeout(function(){ scheduleRender(reason || 'delayed'); }, 1200);
      return;
    }
    clearTimeout(renderTimer);
    renderTimer = setTimeout(function(){ safeRender(reason || 'change'); }, 250);
  }
  function stopRealtime(){
    const supa = db();
    if(channel && supa){
      try{ supa.removeChannel(channel); }catch(_e){}
    }
    channel = null;
    active = false;
  }
  function startRealtime(){
    const supa = db();
    if(!supa || !appReady()) return false;
    if(channel) return true;
    try{
      channel = supa.channel('v394-suppliers-realtime-' + Math.random().toString(36).slice(2));
      channel
        .on('postgres_changes', { event:'*', schema:'public', table:'suppliers' }, function(payload){
          console.log(VERSION, 'suppliers change', payload && payload.eventType, payload);
          scheduleRender(payload && payload.eventType ? payload.eventType : 'suppliers');
        })
        .subscribe(function(status){
          console.log(VERSION, 'status', status);
          if(status === 'SUBSCRIBED'){
            active = true;
            toast('Realtime connected');
          }
          if(status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED'){
            active = false;
            stopRealtime();
            setTimeout(startRealtime, 6000);
          }
        });
      return true;
    }catch(e){
      console.warn(VERSION, 'start error', e && (e.message || e));
      return false;
    }
  }
  function install(){
    startRealtime();
    // Safety fallback: if realtime did not connect, keep existing Sync button available.
    setInterval(function(){
      if(document.hidden) return;
      if(!channel || !active) startRealtime();
    }, 30000);
  }
  window.v394StartRealtime = startRealtime;
  window.v394StopRealtime = stopRealtime;
  window.addEventListener('load', function(){ setTimeout(install, 1800); });
  document.addEventListener('visibilitychange', function(){
    if(!document.hidden){
      setTimeout(startRealtime, 300);
      if(Date.now() - lastEventAt > 3000) scheduleRender('visible');
    }
  });
  console.log(VERSION, 'loaded');
})();
