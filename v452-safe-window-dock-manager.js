/* V452 Safe Window/Dock Manager
   Scope: Dock toggle, no duplicate dock icons for the same document, stable restore status.
   Does NOT change save, numbering, items, VAT, approval, or DB write logic. */
(function(){
  'use strict';
  if(window.__V452_SAFE_WINDOW_DOCK_MANAGER__) return;
  window.__V452_SAFE_WINDOW_DOCK_MANAGER__ = true;

  function q(s,r){ return (r||document).querySelector(s); }
  function qa(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }
  function val(id){ var el=document.getElementById(id); return el ? String(el.value||'').trim() : ''; }
  function clean(v){ return String(v||'').trim(); }
  function slug(v){ return clean(v).toLowerCase().replace(/[^a-z0-9_-]+/gi,'_').replace(/^_+|_+$/g,''); }
  function api(){ return window.v423EntryDockSessions || window.v422EntryDockSessions || null; }
  function dock(){ return document.getElementById('v420MacDock'); }
  function modal(){ return document.getElementById('entryModal'); }
  function isModalVisible(){ var m=modal(); return !!(m && m.classList.contains('show') && !m.classList.contains('v420-modal-minimized')); }
  function currentId(){ var m=modal(); return clean((m && (m.dataset.v451EntryId || m.dataset.v422EditingId || m.dataset.v375EntryId)) || window.editingId || ''); }
  function currentDocNo(){ return val('entryOrderNo') || val('entryInvoiceNo') || val('entrySupplier') || 'Draft'; }
  function currentMode(){ return val('entryMode') || val('entryType') || 'invoice'; }
  function modeLabel(mode){
    mode=clean(mode).toLowerCase();
    if(mode==='delivery_note' || mode==='dn') return 'Delivery Note';
    if(mode==='order') return 'Order';
    if(mode==='deposit') return 'Deposit';
    if(mode.indexOf('credit')>=0) return 'Credit Note';
    return 'Invoice';
  }
  function iconFor(mode){
    mode=clean(mode).toLowerCase();
    if(mode==='delivery_note' || mode==='dn') return '🚚';
    if(mode==='order') return '📦';
    if(mode==='deposit') return '💰';
    if(mode.indexOf('credit')>=0) return '↩️';
    return '🧾';
  }
  function activeKey(){
    var id=currentId();
    if(id) return 'id:'+id;
    var no=val('entryOrderNo') || val('entryInvoiceNo');
    if(no) return 'no:'+no;
    return 'draft:'+currentMode()+':'+currentDocNo();
  }
  function sessionIdForKey(key){ return 'v452_' + slug(key || activeKey() || ('draft_'+Date.now())); }
  function labelForNow(){ return modeLabel(currentMode()) + ' · ' + currentDocNo(); }

  function injectCss(){
    if(q('#v452WindowDockStyle')) return;
    var st=document.createElement('style'); st.id='v452WindowDockStyle';
    st.textContent = '\n'+
      '#entryModal.show .modal-box{animation:v452MagicOpen .52s cubic-bezier(.16,1,.3,1) both!important;transform-origin:50% 100%!important;}\n'+
      '@keyframes v452MagicOpen{0%{opacity:0;transform:translateY(34px) scale(.94);filter:blur(14px) brightness(1.18)}45%{opacity:.92;transform:translateY(4px) scale(.988);filter:blur(4px) brightness(1.08)}78%{opacity:1;transform:translateY(-2px) scale(1.004);filter:blur(.8px)}100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}}\n'+
      '#entryModal.v452-minimizing .modal-box{animation:v452MagicMin .28s cubic-bezier(.4,0,.2,1) both!important;}\n'+
      '@keyframes v452MagicMin{to{opacity:0;transform:translateY(46px) scale(.86);filter:blur(8px)}}\n'+
      '#v420MacDock .v420-dock-item[data-v452-doc-key]{outline:0!important;}\n'+
      '#v420MacDock .v420-dock-item[data-v452-open="1"]::after{content:"";position:absolute;bottom:-6px;left:50%;width:6px;height:6px;transform:translateX(-50%);border-radius:50%;background:#f7d8a6;box-shadow:0 0 8px rgba(247,216,166,.75);}\n'+
      '.v452-hidden-duplicate{display:none!important;}\n';
    document.head.appendChild(st);
  }

  function normalizeDockItem(item, key, sid, title, mode){
    if(!item) return;
    item.dataset.v452DocKey = key;
    item.dataset.v452SessionId = sid;
    item.dataset.v422SessionId = sid;
    item.classList.add('v420-window');
    item.title = title || item.title || 'Document';
    if(!item.innerHTML || item.innerHTML.indexOf('v420-badge')<0){
      item.innerHTML = iconFor(mode) + '<span class="v420-badge"></span>';
    }
    var short = (item.title || '').length > 16 ? item.title.slice(0,15)+'…' : item.title;
    var lbl = q('.v425-dock-label,.v428-dock-name', item);
    if(lbl) lbl.textContent = short;
  }

  function findDockItemByKey(key){
    var d=dock(); if(!d) return null;
    return q('[data-v452-doc-key="'+CSS.escape(key)+'"]', d);
  }
  function findDockItemBySession(sid){
    var d=dock(); if(!d) return null;
    return q('[data-v452-session-id="'+CSS.escape(sid)+'"],[data-v422-session-id="'+CSS.escape(sid)+'"]', d);
  }

  function makeDockItemForCurrent(key, sid){
    var d=dock(); if(!d) return null;
    var title=labelForNow();
    var mode=currentMode();
    var existing=findDockItemByKey(key) || findDockItemBySession(sid);
    if(existing){ normalizeDockItem(existing,key,sid,title,mode); return existing; }
    var item=document.createElement('button');
    item.type='button';
    item.className='v420-dock-item v420-window';
    normalizeDockItem(item,key,sid,title,mode);
    var sep=q('.v420-dock-separator',d);
    if(!sep){ sep=document.createElement('div'); sep.className='v420-dock-separator'; sep.setAttribute('aria-hidden','true'); d.appendChild(sep); }
    d.insertBefore(item, sep.nextSibling || null);
    return item;
  }

  function dedupeDock(){
    var d=dock(); if(!d) return;
    var seen=Object.create(null);
    qa('.v420-window,[data-v422-session-id],[data-v420-window-id]',d).forEach(function(item){
      var key=item.dataset.v452DocKey || item.dataset.v451DocKey || item.dataset.v422SessionId || item.dataset.v420WindowId || item.title || item.textContent;
      if(!key) return;
      if(seen[key] && seen[key]!==item){
        try{ item.remove(); }catch(e){ item.classList.add('v452-hidden-duplicate'); }
        return;
      }
      seen[key]=item;
    });
  }

  function markOpenFlag(){
    var d=dock(); if(!d) return;
    var key=isModalVisible() ? activeKey() : '';
    qa('.v420-window,[data-v422-session-id]',d).forEach(function(item){
      item.dataset.v452Open = (key && item.dataset.v452DocKey === key) ? '1' : '0';
    });
  }

  function minimizeActiveToDock(){
    var m=modal();
    if(!m || !isModalVisible()) return false;
    var key=activeKey();
    var sid=sessionIdForKey(key);
    m.dataset.v452DocKey = key;
    m.dataset.v452SessionId = sid;
    var item=makeDockItemForCurrent(key,sid);
    var a=api();
    if(a && typeof a.minimizeCurrentEntry==='function'){
      m.classList.add('v452-minimizing');
      setTimeout(function(){
        try{ a.minimizeCurrentEntry(sid); }catch(e){}
        m.classList.remove('v452-minimizing');
        var newest=findDockItemBySession(sid) || item;
        normalizeDockItem(newest,key,sid,labelForNow(),currentMode());
        dedupeDock(); markOpenFlag();
      },160);
      return true;
    }
    m.classList.remove('show');
    markOpenFlag();
    return true;
  }

  async function restoreFromDock(item){
    var sid=item.dataset.v452SessionId || item.dataset.v422SessionId;
    var key=item.dataset.v452DocKey || item.dataset.v451DocKey || '';
    if(isModalVisible() && key && activeKey() === key){
      minimizeActiveToDock();
      return;
    }
    var a=api();
    if(a && sid && typeof a.restoreSession==='function'){
      await a.restoreSession(sid);
      setTimeout(function(){
        var m=modal(); if(m){ m.dataset.v452DocKey=key; m.dataset.v452SessionId=sid; }
        // Existing V422 removes the icon on restore; immediately recreate one persistent icon for toggle behavior.
        var data = a.sessions && a.sessions.get ? a.sessions.get(sid) : null;
        var title = (data && data.title) || item.title || labelForNow();
        var mode = (data && data.mode) || currentMode();
        var newItem = makeDockItemForCurrent(key || activeKey(), sid);
        normalizeDockItem(newItem, key || activeKey(), sid, title, mode);
        dedupeDock(); markOpenFlag();
        try{ if(typeof window.__v451PaintStatusMedal==='function') window.__v451PaintStatusMedal(); }catch(e){}
      },220);
      setTimeout(markOpenFlag,520);
      return;
    }
  }

  function installWindowAction(){
    if(window.__V452_WINDOW_ACTION_WRAPPED__) return;
    if(typeof window.windowAction !== 'function') return;
    window.__V452_WINDOW_ACTION_WRAPPED__ = true;
    var old=window.windowAction;
    window.windowAction=function(ev,action){
      var target=ev && ev.target;
      var isEntry=target && target.closest && target.closest('#entryModal');
      if(isEntry && action==='compact'){
        if(ev && ev.preventDefault){ ev.preventDefault(); ev.stopPropagation(); }
        minimizeActiveToDock();
        return;
      }
      if(isEntry && action==='close'){
        var key=activeKey(); var sid=sessionIdForKey(key);
        var item=findDockItemByKey(key) || findDockItemBySession(sid);
        if(item) item.remove();
        setTimeout(function(){ dedupeDock(); markOpenFlag(); },80);
      }
      return old.apply(this,arguments);
    };
  }

  function installDockClickCapture(){
    if(window.__V452_DOCK_CLICK_CAPTURE__) return;
    window.__V452_DOCK_CLICK_CAPTURE__ = true;
    document.addEventListener('click',function(e){
      var item=e.target && e.target.closest && e.target.closest('#v420MacDock .v420-window,#v420MacDock [data-v422-session-id]');
      if(!item) return;
      if(item.dataset.v452Handling==='1') return;
      var sid=item.dataset.v452SessionId || item.dataset.v422SessionId;
      if(!sid) return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      item.dataset.v452Handling='1';
      Promise.resolve(restoreFromDock(item)).finally(function(){ setTimeout(function(){ item.dataset.v452Handling='0'; },250); });
    },true);
  }

  function installOpenMarker(){
    if(window.__V452_OPEN_MARKER__) return;
    if(typeof window.openEntryModal !== 'function') return;
    window.__V452_OPEN_MARKER__ = true;
    var old=window.openEntryModal;
    window.openEntryModal=async function(){
      var res=await old.apply(this,arguments);
      setTimeout(function(){
        var key=activeKey(); var sid=sessionIdForKey(key);
        var m=modal(); if(m){ m.dataset.v452DocKey=key; m.dataset.v452SessionId=sid; }
        var item=makeDockItemForCurrent(key,sid);
        normalizeDockItem(item,key,sid,labelForNow(),currentMode());
        dedupeDock(); markOpenFlag();
      },260);
      return res;
    };
  }

  function boot(){ injectCss(); installWindowAction(); installDockClickCapture(); installOpenMarker(); dedupeDock(); markOpenFlag(); }
  document.addEventListener('DOMContentLoaded',boot);
  window.addEventListener('load',boot);
  document.addEventListener('click',function(){ setTimeout(function(){ dedupeDock(); markOpenFlag(); },320); },true);
  setInterval(boot,900);
})();
