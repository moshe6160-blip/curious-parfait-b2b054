/* V454 Root Dock/Open/Status Fix
   Fixes the remaining V453/V422 interaction:
   1) Opening a second existing order after restoring from Dock must minimize the active order once only.
   2) Restored/open document must not leave a duplicate Dock icon for the same document.
   3) Dock click toggles the same document: open -> Dock, Dock -> open.
   4) Status medal is locked from row/session/DB label and is protected from fallback Pre-Order flicker.
   No save/numbering/items/VAT/approval logic is changed. */
(function(){
  'use strict';
  if(window.__V454_DOCK_OPEN_STATUS_ROOT_FIX__) return;
  window.__V454_DOCK_OPEN_STATUS_ROOT_FIX__ = true;

  var rowStatusById = Object.create(null);
  var sessionStatusBySid = Object.create(null);
  var openingLock = false;
  var restoringLock = Object.create(null);
  var lastPaint = { sid:'', label:'', at:0 };

  function q(s,r){ return (r||document).querySelector(s); }
  function qa(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }
  function clean(v){ return String(v||'').trim(); }
  function low(v){ return clean(v).toLowerCase(); }
  function val(id){ var el=document.getElementById(id); return el ? clean(el.value) : ''; }
  function modal(){ return document.getElementById('entryModal'); }
  function dock(){ return document.getElementById('v420MacDock'); }
  function api(){ return window.v423EntryDockSessions || window.v422EntryDockSessions || null; }
  function visible(){ var m=modal(); return !!(m && m.classList.contains('show') && !m.classList.contains('v420-modal-minimized')); }
  function slug(v){ return clean(v).toLowerCase().replace(/[^a-z0-9_-]+/gi,'_').replace(/^_+|_+$/g,''); }
  function esc(v){ try{ return CSS.escape(v); }catch(e){ return String(v).replace(/"/g,'\\"'); } }

  function currentEditingId(){
    var m=modal();
    return clean((m && (m.dataset.v422EditingId || m.dataset.v451EntryId || m.dataset.v375EntryId)) || window.editingId || '');
  }
  function currentMode(){
    var m=modal();
    return val('entryMode') || val('entryType') || clean(m && m.dataset.v422Mode) || 'order';
  }
  function currentNo(){ return val('entryOrderNo') || val('entryInvoiceNo') || val('entrySupplier') || 'Draft'; }
  function sidFor(id, mode, no){
    id=clean(id); if(id) return 'doc_'+slug(id);
    no=clean(no); mode=clean(mode)||'order';
    if(no) return slug(mode)+'_'+slug(no);
    return '';
  }
  function currentSid(){ return sidFor(currentEditingId(), currentMode(), currentNo()); }
  function sidFromItem(item){ return clean(item && (item.dataset.v454Sid || item.dataset.v453SessionId || item.dataset.v422SessionId || item.dataset.v420WindowId)); }
  function itemForSid(sid){ var d=dock(); return d && sid ? q('[data-v454-sid="'+esc(sid)+'"],[data-v453-session-id="'+esc(sid)+'"],[data-v422-session-id="'+esc(sid)+'"]', d) : null; }

  function labelFromText(text){
    var t=low(text);
    if(!t) return '';
    if(t.indexOf('credit note')>=0) return 'Credit Note';
    if(t.indexOf('delivery note')>=0 || t.indexOf('dn-')>=0) return 'Delivery Note';
    if(t.indexOf('deposit')>=0) return 'Deposit';
    if(t.indexOf('app order')>=0 || t.indexOf('approved')>=0 || t.indexOf('approval')>=0) return 'App order';
    if(t.indexOf('order sent')>=0 || t.indexOf('sent to supplier')>=0) return 'Order';
    if(t.indexOf('pre-order')>=0 || t.indexOf('pre order')>=0 || t.indexOf('pending approval')>=0) return 'Pre-Order';
    if(t.indexOf('invoice')>=0 || t.indexOf('done')>=0) return 'Invoice';
    return '';
  }
  function rowIdFromOnclick(row){
    var oc=row && row.getAttribute && (row.getAttribute('onclick')||'');
    var m=oc.match(/openEntryModal\(['"]([^'"]+)['"]/);
    return m && m[1] ? m[1] : '';
  }
  function captureRowClick(){
    document.addEventListener('click', function(e){
      var row=e.target && e.target.closest && e.target.closest('tr,[onclick*="openEntryModal"]');
      if(!row) return;
      var id=rowIdFromOnclick(row); if(!id) return;
      var label=labelFromText(row.innerText || row.textContent || '');
      if(label) rowStatusById[id]=label;
    }, true);
  }

  function modeLabel(mode){
    mode=low(mode);
    if(mode==='delivery_note'||mode==='dn') return 'Delivery Note';
    if(mode==='deposit') return 'Deposit';
    if(mode.indexOf('credit')>=0) return 'Credit Note';
    if(mode==='invoice') return 'Invoice';
    return 'Order';
  }
  function iconFor(mode){
    mode=low(mode);
    if(mode==='delivery_note'||mode==='dn') return '🚚';
    if(mode==='deposit') return '💰';
    if(mode.indexOf('credit')>=0) return '↩️';
    if(mode==='invoice') return '🧾';
    return '📦';
  }
  function titleForCurrent(){ return modeLabel(currentMode())+' · '+currentNo(); }
  function normalizeDockItem(item, sid){
    if(!item || !sid) return;
    item.dataset.v454Sid=sid;
    item.dataset.v453SessionId=sid;
    item.dataset.v422SessionId=sid;
    item.classList.add('v420-window');
  }
  function removeOpenItem(sid){
    var d=dock(); if(!d || !sid) return;
    qa('[data-v454-sid="'+esc(sid)+'"],[data-v453-session-id="'+esc(sid)+'"],[data-v422-session-id="'+esc(sid)+'"]', d).forEach(function(item){
      try{ item.remove(); }catch(e){ item.style.display='none'; }
    });
  }
  function cleanupDock(activeOpenSid){
    var d=dock(); if(!d) return;
    var seen=Object.create(null);
    qa('.v420-window,[data-v422-session-id],[data-v453-session-id],[data-v454-sid]', d).forEach(function(item){
      var title=low(item.title || item.textContent || '');
      if(title.indexOf('invoice')>=0 && title.indexOf('draft')>=0){ try{ item.remove(); }catch(e){ item.style.display='none'; } return; }
      var sid=sidFromItem(item) || slug(item.title || item.textContent || '');
      if(!sid) return;
      normalizeDockItem(item, sid);
      if(activeOpenSid && sid===activeOpenSid){ try{ item.remove(); }catch(e){ item.style.display='none'; } return; }
      if(seen[sid] && seen[sid]!==item){ try{ item.remove(); }catch(e){ item.style.display='none'; } return; }
      seen[sid]=item;
    });
    var sep=q('.v420-dock-separator',d);
    var has=!!q('.v420-window,[data-v422-session-id],[data-v453-session-id],[data-v454-sid]',d);
    if(!has && sep) sep.remove();
  }

  function ensureDockItemForCurrent(sid){
    var d=dock(), a=api(); if(!d || !sid) return null;
    var item=itemForSid(sid);
    if(!item){
      item=document.createElement('button');
      item.type='button';
      item.className='v420-dock-item v420-window';
      var sep=q('.v420-dock-separator',d);
      if(!sep){ sep=document.createElement('div'); sep.className='v420-dock-separator'; sep.setAttribute('aria-hidden','true'); d.appendChild(sep); }
      d.insertBefore(item, sep.nextSibling || null);
    }
    normalizeDockItem(item,sid);
    item.title=titleForCurrent();
    item.innerHTML=iconFor(currentMode())+'<span class="v420-badge"></span>';
    var label=currentLabel(); if(label) sessionStatusBySid[sid]=label;
    return item;
  }

  function minimizeActiveOnce(){
    if(!visible()) return false;
    var sid=currentSid(); if(!sid) return false;
    var a=api(); if(!a || typeof a.minimizeCurrentEntry!=='function') return false;
    sessionStatusBySid[sid]=currentLabel() || sessionStatusBySid[sid] || '';
    try{ a.minimizeCurrentEntry(sid); }catch(e){ return false; }
    ensureDockItemForCurrent(sid);
    cleanupDock('');
    return true;
  }

  function classFor(label){
    var l=low(label);
    if(l.indexOf('pre')>=0) return 'v432-preorder';
    if(l.indexOf('app')>=0) return 'v432-apporder';
    if(l==='order') return 'v432-order';
    if(l.indexOf('delivery')>=0) return 'v432-dn';
    if(l.indexOf('invoice')>=0) return 'v432-invoice';
    if(l.indexOf('deposit')>=0) return 'v432-deposit';
    if(l.indexOf('credit')>=0) return 'v432-credit';
    return 'v432-default';
  }
  function ensureMedal(){
    var m=modal(); if(!m || !m.classList.contains('show')) return null;
    var actions=q('.modal-actions',m)||q('.modal-footer',m)||q('.window-actions',m); if(!actions) return null;
    var wrap=q('.v432-status-wrap',m);
    if(!wrap){
      wrap=document.createElement('div'); wrap.className='v432-status-wrap';
      var med=document.createElement('div'); med.className='v432-status-medal v432-default'; med.textContent='Status';
      wrap.appendChild(med); actions.insertAdjacentElement('afterend',wrap);
    }
    return q('.v432-status-medal',wrap);
  }
  function currentLabel(){
    var sid=currentSid(), id=currentEditingId();
    if(sid && sessionStatusBySid[sid]) return sessionStatusBySid[sid];
    if(id && rowStatusById[id]) return rowStatusById[id];
    var f=labelFromText(val('entryStatus')+' '+val('entryNotes'));
    if(f) return f;
    var med=q('#entryModal .v432-status-medal');
    var existing=clean(med && med.textContent);
    if(existing && existing!=='Status') return existing;
    return 'Pre-Order';
  }
  function paintStatus(forceLabel){
    var med=ensureMedal(); if(!med) return;
    var sid=currentSid();
    var label=forceLabel || currentLabel();
    if(!label) return;
    if(sid){ sessionStatusBySid[sid]=label; lastPaint={sid:sid,label:label,at:Date.now()}; }
    med.textContent=label;
    med.className='v432-status-medal '+classFor(label);
  }
  function protectStatusFlicker(){
    var m=modal(); if(!m || !window.MutationObserver) return;
    if(m.__v454StatusObserver) return;
    var obs=new MutationObserver(function(){
      var med=q('.v432-status-medal',m); if(!med) return;
      var sid=currentSid();
      if(!sid) return;
      var locked=sessionStatusBySid[sid] || (currentEditingId() && rowStatusById[currentEditingId()]) || '';
      if(locked && clean(med.textContent)!==locked){
        med.textContent=locked;
        med.className='v432-status-medal '+classFor(locked);
      }
    });
    obs.observe(m,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
    m.__v454StatusObserver=obs;
  }

  function installOpenGuard(){
    if(window.__V454_OPEN_GUARD__) return;
    if(typeof window.openEntryModal!=='function') return;
    window.__V454_OPEN_GUARD__=true;
    var old=window.openEntryModal;
    window.openEntryModal=async function(id, forcedMode){
      if(openingLock) return old.apply(this, arguments);
      var targetSid=sidFor(id || '', forcedMode || '', '');
      // Important: pre-minimize active restored window before older V422 wrapper runs.
      // This prevents V422 from receiving undefined activeSessionId and creating a second icon.
      if(visible()){
        var activeSid=currentSid();
        if(activeSid && (!targetSid || activeSid!==targetSid)) minimizeActiveOnce();
      }
      openingLock=true;
      try{
        var res=await old.apply(this, arguments);
        setTimeout(function(){
          var m=modal();
          if(m){
            if(id) m.dataset.v422EditingId=id;
            if(forcedMode) m.dataset.v422Mode=forcedMode;
          }
          var sid=currentSid();
          if(id && rowStatusById[id]) sessionStatusBySid[sid]=rowStatusById[id];
          cleanupDock(sid); // active/open document has no Dock icon
          paintStatus(); protectStatusFlicker();
        },30);
        setTimeout(function(){ var sid=currentSid(); cleanupDock(sid); paintStatus(); },220);
        setTimeout(function(){ var sid=currentSid(); cleanupDock(sid); paintStatus(); },700);
        return res;
      }finally{
        setTimeout(function(){ openingLock=false; },80);
      }
    };
  }

  async function restoreOrToggle(sid){
    if(!sid || restoringLock[sid]) return;
    if(visible() && currentSid()===sid){ minimizeActiveOnce(); return; }
    restoringLock[sid]=true;
    var a=api();
    try{
      if(a && typeof a.restoreSession==='function') await a.restoreSession(sid);
      setTimeout(function(){
        var openSid=currentSid();
        if(openSid===sid){ removeOpenItem(sid); cleanupDock(sid); }
        paintStatus(sessionStatusBySid[sid] || ''); protectStatusFlicker();
      },40);
      setTimeout(function(){ var openSid=currentSid(); if(openSid===sid){ removeOpenItem(sid); cleanupDock(sid); } paintStatus(sessionStatusBySid[sid] || ''); },260);
      setTimeout(function(){ var openSid=currentSid(); if(openSid===sid){ removeOpenItem(sid); cleanupDock(sid); } paintStatus(sessionStatusBySid[sid] || ''); },760);
    }finally{
      setTimeout(function(){ restoringLock[sid]=false; },360);
    }
  }

  function installDockCapture(){
    if(window.__V454_DOCK_CAPTURE__) return;
    window.__V454_DOCK_CAPTURE__=true;
    document.addEventListener('click', function(e){
      var item=e.target && e.target.closest && e.target.closest('#v420MacDock .v420-window,#v420MacDock [data-v422-session-id],#v420MacDock [data-v453-session-id],#v420MacDock [data-v454-sid]');
      if(!item) return;
      var sid=sidFromItem(item); if(!sid) return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      restoreOrToggle(sid);
    }, true);
  }

  function installWindowActionGuard(){
    if(window.__V454_WINDOW_ACTION_GUARD__) return;
    if(typeof window.windowAction!=='function') return;
    window.__V454_WINDOW_ACTION_GUARD__=true;
    var old=window.windowAction;
    window.windowAction=function(ev,action){
      var isEntry=ev && ev.target && ev.target.closest && ev.target.closest('#entryModal');
      if(isEntry && action==='compact'){
        if(ev && ev.preventDefault){ ev.preventDefault(); ev.stopPropagation(); }
        minimizeActiveOnce();
        return;
      }
      return old.apply(this, arguments);
    };
  }

  function boot(){
    installOpenGuard(); installDockCapture(); installWindowActionGuard(); protectStatusFlicker();
    var sid=visible()?currentSid():'';
    cleanupDock(sid); paintStatus();
  }

  captureRowClick();
  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('load', boot);
  document.addEventListener('change', function(e){ if(e.target && e.target.closest && e.target.closest('#entryModal')) setTimeout(function(){ paintStatus(); },40); }, true);
  document.addEventListener('click', function(){ setTimeout(boot,120); }, true);
  setInterval(boot, 900);
})();
