/* V453 Safe Dock/Window Bugfix
   Goal: remove V451/V452 dock conflicts, stop Invoice Draft ghost icons,
   make yellow minimize and dock click use one stable session per real document.
   Does not change save, numbering, items, VAT, approvals, or DB writes. */
(function(){
  'use strict';
  if(window.__V453_DOCK_WINDOW_BUGFIX_SAFE__) return;
  window.__V453_DOCK_WINDOW_BUGFIX_SAFE__ = true;

  // Block older experimental layers from wrapping open/dock again if their files are still cached.
  window.__V452_OPEN_MARKER__ = true;
  window.__V452_WINDOW_ACTION_WRAPPED__ = true;
  window.__V452_DOCK_CLICK_CAPTURE__ = true;
  window.__V451_WINDOW_ACTION_INSTALLED__ = true;

  var lastClicked = { id:'', label:'', at:0 };
  var restoreLock = Object.create(null);

  function q(s,r){ return (r||document).querySelector(s); }
  function qa(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }
  function clean(v){ return String(v||'').trim(); }
  function val(id){ var el=document.getElementById(id); return el ? clean(el.value) : ''; }
  function modal(){ return document.getElementById('entryModal'); }
  function dock(){ return document.getElementById('v420MacDock'); }
  function api(){ return window.v423EntryDockSessions || window.v422EntryDockSessions || null; }
  function visible(){ var m=modal(); return !!(m && m.classList.contains('show') && !m.classList.contains('v420-modal-minimized')); }
  function slug(v){ return clean(v).toLowerCase().replace(/[^a-z0-9_-]+/gi,'_').replace(/^_+|_+$/g,''); }

  function currentEditingId(){
    var m=modal();
    return clean((m && (m.dataset.v422EditingId || m.dataset.v451EntryId || m.dataset.v375EntryId)) || window.editingId || '');
  }
  function currentMode(){ return val('entryMode') || val('entryType') || (modal() && modal().dataset.v422Mode) || 'order'; }
  function currentNo(){ return val('entryOrderNo') || val('entryInvoiceNo') || val('entrySupplier') || 'Draft'; }
  function stableSessionId(){
    var id=currentEditingId();
    if(id) return 'doc_'+slug(id);
    var order=val('entryOrderNo'); if(order) return 'order_'+slug(order);
    var inv=val('entryInvoiceNo'); if(inv) return 'invoice_'+slug(inv);
    return 'draft_'+slug(currentMode()+'_'+currentNo());
  }
  function modeLabel(mode){
    mode=clean(mode).toLowerCase();
    if(mode==='delivery_note' || mode==='dn') return 'Delivery Note';
    if(mode==='deposit') return 'Deposit';
    if(mode.indexOf('credit')>=0) return 'Credit Note';
    if(mode==='invoice') return 'Invoice';
    return 'Order';
  }
  function iconFor(mode){
    mode=clean(mode).toLowerCase();
    if(mode==='delivery_note' || mode==='dn') return '🚚';
    if(mode==='deposit') return '💰';
    if(mode.indexOf('credit')>=0) return '↩️';
    if(mode==='invoice') return '🧾';
    return '📦';
  }
  function titleNow(){ return modeLabel(currentMode())+' · '+currentNo(); }
  function dataForSid(sid){ var a=api(); return a && a.sessions && a.sessions.get ? a.sessions.get(sid) : null; }
  function dataTitle(data){ return (data && data.title) || titleNow(); }
  function dataMode(data){ return (data && (data.mode || (data.values && (data.values.entryMode || data.values.entryType)))) || currentMode(); }
  function dataEditingId(data){ return clean(data && data.editingId); }

  function injectCss(){
    if(q('#v453DockBugfixStyle')) return;
    var st=document.createElement('style'); st.id='v453DockBugfixStyle';
    st.textContent = '\n'+
      '#entryModal.show .modal-box{animation:v453SoftOpen .42s cubic-bezier(.16,1,.3,1) both!important;transform-origin:50% 96%!important;}\n'+
      '@keyframes v453SoftOpen{0%{opacity:0;transform:translateY(22px) scale(.97);filter:blur(8px)}70%{opacity:1;transform:translateY(-1px) scale(1.002);filter:blur(.7px)}100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}}\n'+
      '#entryModal.v453-minimize .modal-box{animation:v453SoftMin .22s cubic-bezier(.4,0,.2,1) both!important;}\n'+
      '@keyframes v453SoftMin{to{opacity:0;transform:translateY(34px) scale(.9);filter:blur(7px)}}\n'+
      '#v420MacDock .v420-window[data-v453-open="1"]::after{content:"";position:absolute;bottom:-6px;left:50%;width:6px;height:6px;transform:translateX(-50%);border-radius:50%;background:#f7d8a6;box-shadow:0 0 8px rgba(247,216,166,.75);}\n'+
      '#v420MacDock .v453-ghost-draft{display:none!important;}\n';
    document.head.appendChild(st);
  }

  function findItemBySid(sid){ var d=dock(); return d ? q('[data-v453-session-id="'+CSS.escape(sid)+'"],[data-v422-session-id="'+CSS.escape(sid)+'"]', d) : null; }
  function normalizeItem(item,sid,data){
    if(!item) return item;
    var title=dataTitle(data), mode=dataMode(data);
    item.type='button';
    item.classList.add('v420-window');
    item.dataset.v453SessionId=sid;
    item.dataset.v422SessionId=sid;
    item.dataset.v453DocKey=sid;
    item.title=title;
    item.innerHTML = iconFor(mode)+'<span class="v420-badge"></span>';
    return item;
  }
  function ensureDockItem(sid,data){
    var d=dock(); if(!d || !sid) return null;
    var item=findItemBySid(sid);
    if(!item){
      item=document.createElement('button');
      item.className='v420-dock-item v420-window';
      var sep=q('.v420-dock-separator',d);
      if(!sep){ sep=document.createElement('div'); sep.className='v420-dock-separator'; sep.setAttribute('aria-hidden','true'); d.appendChild(sep); }
      d.insertBefore(item, sep.nextSibling || null);
    }
    return normalizeItem(item,sid,data);
  }

  function isGhostDraft(item){
    var t=clean((item && (item.title || item.textContent)) || '').toLowerCase();
    if(!t) return false;
    if(t.indexOf('invoice')>=0 && t.indexOf('draft')>=0) return true;
    if(t==='invoice · draft' || t==='invoice draft') return true;
    return false;
  }
  function cleanupDock(){
    var d=dock(); if(!d) return;
    var seen=Object.create(null);
    qa('.v420-window,[data-v422-session-id],[data-v453-session-id],[data-v420-window-id]',d).forEach(function(item){
      if(isGhostDraft(item)){ try{ item.remove(); }catch(e){ item.classList.add('v453-ghost-draft'); } return; }
      var sid=item.dataset.v453SessionId || item.dataset.v422SessionId || item.dataset.v420WindowId || slug(item.title || item.textContent);
      if(!sid) return;
      item.dataset.v453SessionId=sid;
      if(seen[sid] && seen[sid]!==item){ try{ item.remove(); }catch(e){ item.classList.add('v453-ghost-draft'); } return; }
      seen[sid]=item;
    });
    var sep=q('.v420-dock-separator',d);
    var has=!!q('.v420-window,[data-v422-session-id],[data-v453-session-id]',d);
    if(!has && sep) sep.remove();
    markOpen();
  }
  function markOpen(){
    var d=dock(); if(!d) return;
    var sid=visible()?stableSessionId():'';
    qa('.v420-window,[data-v422-session-id],[data-v453-session-id]',d).forEach(function(item){
      item.dataset.v453Open = (sid && ((item.dataset.v453SessionId||item.dataset.v422SessionId)===sid)) ? '1' : '0';
    });
  }

  function minimizeNow(){
    var m=modal(); if(!m || !visible()) return false;
    var a=api(); if(!a || typeof a.minimizeCurrentEntry!=='function') return false;
    var sid=stableSessionId();
    m.classList.add('v453-minimize');
    setTimeout(function(){
      try{ a.minimizeCurrentEntry(sid); }catch(e){}
      m.classList.remove('v453-minimize');
      ensureDockItem(sid,dataForSid(sid));
      cleanupDock();
    },120);
    return true;
  }

  async function restoreSid(sid){
    var a=api(); if(!a || !sid || typeof a.restoreSession!=='function') return;
    if(restoreLock[sid]) return;
    restoreLock[sid]=true;
    try{
      var data=dataForSid(sid);
      var currentId=currentEditingId();
      if(visible() && data && dataEditingId(data) && dataEditingId(data)===currentId){ minimizeNow(); return; }
      await a.restoreSession(sid);
      setTimeout(function(){ ensureDockItem(sid,dataForSid(sid)||data); cleanupDock(); paintStatus(); },60);
      setTimeout(function(){ ensureDockItem(sid,dataForSid(sid)||data); cleanupDock(); paintStatus(); },260);
    }finally{
      setTimeout(function(){ restoreLock[sid]=false; },320);
    }
  }

  function installWindowAction(){
    if(window.__V453_WINDOW_ACTION_WRAP__) return;
    if(typeof window.windowAction!=='function') return;
    window.__V453_WINDOW_ACTION_WRAP__=true;
    var old=window.windowAction;
    window.windowAction=function(ev,action){
      var isEntry=ev && ev.target && ev.target.closest && ev.target.closest('#entryModal');
      if(isEntry && action==='compact'){
        if(ev && ev.preventDefault){ ev.preventDefault(); ev.stopPropagation(); }
        minimizeNow();
        return;
      }
      var res=old.apply(this,arguments);
      setTimeout(cleanupDock,80);
      return res;
    };
  }
  function installDockClick(){
    if(window.__V453_DOCK_CLICK__) return;
    window.__V453_DOCK_CLICK__=true;
    document.addEventListener('click',function(e){
      var item=e.target && e.target.closest && e.target.closest('#v420MacDock .v420-window,#v420MacDock [data-v422-session-id],#v420MacDock [data-v453-session-id]');
      if(!item) return;
      var sid=item.dataset.v453SessionId || item.dataset.v422SessionId;
      if(!sid) return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      restoreSid(sid);
    },true);
  }

  function rowIdFromOnclick(row){ var oc=row && row.getAttribute && (row.getAttribute('onclick')||''); var m=oc.match(/openEntryModal\(['"]([^'"]+)['"]/); return m&&m[1]?m[1]:''; }
  function labelFromText(txt){
    var t=clean(txt).toLowerCase();
    if(t.indexOf('delivery note')>=0 || t.indexOf('dn-')>=0) return 'Delivery Note';
    if(t.indexOf('credit note')>=0) return 'Credit Note';
    if(t.indexOf('deposit')>=0) return 'Deposit';
    if(t.indexOf('app order')>=0 || t.indexOf('approved')>=0) return 'App order';
    if(t.indexOf('order sent')>=0 || t.indexOf('sent to supplier')>=0) return 'Order';
    if(t.indexOf('pre-order')>=0 || t.indexOf('pre order')>=0 || t.indexOf('pending approval')>=0) return 'Pre-Order';
    if(t.indexOf('invoice')>=0) return 'Invoice';
    return '';
  }
  function captureListClick(){
    document.addEventListener('click',function(e){
      var row=e.target && e.target.closest && e.target.closest('tr,[onclick*="openEntryModal"]');
      if(!row) return;
      var id=rowIdFromOnclick(row); if(!id) return;
      var label=labelFromText(row.innerText||'');
      if(label) lastClicked={id:id,label:label,at:Date.now()};
    },true);
  }
  function ensureMedal(){
    var m=modal(); if(!m || !m.classList.contains('show')) return null;
    var actions=q('.modal-actions',m)||q('.modal-footer',m)||q('.window-actions',m); if(!actions) return null;
    var wrap=q('.v432-status-wrap',m);
    if(!wrap){ wrap=document.createElement('div'); wrap.className='v432-status-wrap'; var med=document.createElement('div'); med.className='v432-status-medal v432-default'; med.textContent='Status'; wrap.appendChild(med); actions.insertAdjacentElement('afterend',wrap); }
    return q('.v432-status-medal',wrap);
  }
  function medalClass(label){
    var l=clean(label).toLowerCase();
    if(l.indexOf('pre')>=0) return 'v432-preorder';
    if(l.indexOf('app')>=0) return 'v432-apporder';
    if(l==='order') return 'v432-order';
    if(l.indexOf('delivery')>=0) return 'v432-dn';
    if(l.indexOf('invoice')>=0) return 'v432-invoice';
    if(l.indexOf('deposit')>=0) return 'v432-deposit';
    if(l.indexOf('credit')>=0) return 'v432-credit';
    return 'v432-default';
  }
  function paintStatus(){
    var med=ensureMedal(); if(!med) return;
    var id=currentEditingId();
    var label='';
    if(id && lastClicked.id===id && Date.now()-lastClicked.at<60000) label=lastClicked.label;
    if(!label) label=labelFromText((val('entryStatus')+' '+val('entryNotes')+' '+currentMode()).trim()) || med.textContent || 'Pre-Order';
    med.textContent=label;
    med.className='v432-status-medal '+medalClass(label);
  }

  function installOpenLight(){
    if(window.__V453_OPEN_LIGHT__) return;
    if(typeof window.openEntryModal!=='function') return;
    window.__V453_OPEN_LIGHT__=true;
    var old=window.openEntryModal;
    window.openEntryModal=async function(id,forcedMode){
      var res=await old.apply(this,arguments);
      setTimeout(function(){
        var m=modal(); if(m){
          if(id) m.dataset.v422EditingId=id;
          m.dataset.v422Mode=val('entryMode') || forcedMode || m.dataset.v422Mode || '';
        }
        // Do not create a dock icon for a newly opened active document.
        // Only normalize existing icons and remove wrong Invoice Draft ghosts.
        cleanupDock(); paintStatus();
      },40);
      setTimeout(function(){ cleanupDock(); paintStatus(); },260);
      return res;
    };
  }

  function boot(){ injectCss(); installWindowAction(); installDockClick(); installOpenLight(); cleanupDock(); markOpen(); paintStatus(); }
  captureListClick();
  document.addEventListener('DOMContentLoaded',boot);
  window.addEventListener('load',boot);
  setInterval(boot,1200);
  document.addEventListener('click',function(){ setTimeout(function(){ cleanupDock(); paintStatus(); },180); },true);
  document.addEventListener('change',function(e){ if(e.target && e.target.closest && e.target.closest('#entryModal')) setTimeout(paintStatus,50); },true);
})();
