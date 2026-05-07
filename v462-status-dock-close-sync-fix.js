/* V462 Status/Dock Close Sync Fix
   Base: V461 full system.
   Fixes only:
   1) Real Order documents must show medal = Order and must NOT show APPROVED stamp.
   2) Closing the open document removes its Dock icon too.
   3) Clicking X on a Dock icon removes the icon and closes the matching open window when it is the same document.
   No save/numbering/items/VAT/login/approval workflow changes. */
(function(){
  'use strict';
  if(window.__V462_STATUS_DOCK_CLOSE_SYNC_FIX__) return;
  window.__V462_STATUS_DOCK_CLOSE_SYNC_FIX__ = true;

  var q=function(s,r){return (r||document).querySelector(s);};
  var qa=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
  var clean=function(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();};
  var low=function(v){return clean(v).toLowerCase();};
  var slug=function(v){return low(v).replace(/[^a-z0-9א-ת_-]+/gi,'_').replace(/^_+|_+$/g,'');};
  var esc=function(v){try{return CSS.escape(v);}catch(e){return String(v||'').replace(/["\\]/g,'\\$&');}};
  function modal(){return document.getElementById('entryModal');}
  function dock(){return document.getElementById('v420MacDock');}
  function val(id){var el=document.getElementById(id); return clean(el && el.value);}
  function visible(){var m=modal(); return !!(m && m.classList.contains('show') && !m.classList.contains('v420-modal-minimized'));}
  function currentId(){var m=modal(); return clean((m && (m.dataset.v462EntryId || m.dataset.v422EditingId || m.dataset.v453EditingId || m.dataset.v451EntryId || m.dataset.v375EntryId)) || window.editingId || '');}
  function currentMode(){var m=modal(); return val('entryMode') || val('entryType') || clean(m && (m.dataset.v422Mode || m.dataset.v462Mode)) || 'order';}
  function currentNo(){return val('entryOrderNo') || val('entryInvoiceNo') || val('entrySupplier') || 'Draft';}
  function sidFor(id,mode,no){id=clean(id); if(id) return 'doc_'+slug(id); mode=clean(mode)||'order'; no=clean(no); return no ? slug(mode)+'_'+slug(no) : '';}
  function currentSid(){return sidFor(currentId(), currentMode(), currentNo());}
  function itemSid(item){return clean(item && (item.dataset.v454Sid || item.dataset.v453SessionId || item.dataset.v422SessionId || item.dataset.v420WindowId || item.dataset.v456Key));}
  function text(el){return clean(el && (el.innerText || el.textContent || ''));}

  function labelFromRow(row){
    row=row||{};
    var explicit=low(row.process || row.process_status || row.workflow_status || row.document_process || row.status || '');
    if(explicit==='pre-order' || explicit==='pre order' || explicit==='preorder') return 'Pre-Order';
    if(explicit==='app order' || explicit==='approved order' || explicit==='approved') return 'App order';
    if(explicit==='order' || explicit==='order sent' || explicit==='sent' || explicit==='sent to supplier') return 'Order';
    if(explicit==='dn' || explicit==='delivery note' || explicit==='delivery-note') return 'Delivery Note';
    if(explicit==='invoice' || explicit==='invoiced' || explicit==='done') return 'Invoice';
    try{ if(row && typeof window.processStatusLabel==='function') return clean(window.processStatusLabel(row)); }catch(e){}
    var hasOrder=!!clean(row.order_no), hasInv=!!clean(row.invoice_no);
    var s=low(row.status+' '+row.notes);
    if(s.indexOf('order sent')>=0 || s.indexOf('sent to supplier')>=0 || s.indexOf('נשלח')>=0 || s==='sent') return 'Order';
    if(hasOrder && !hasInv && (s.indexOf('app order')>=0 || s.indexOf('approved')>=0 || s.indexOf('מאושר')>=0)) return 'App order';
    if(hasOrder && !hasInv) return 'Pre-Order';
    if(hasOrder && hasInv) return 'Invoice';
    if(hasInv) return 'Done';
    return '';
  }
  function labelFromFields(){
    var s=low(val('entryStatus')+' '+val('entryNotes'));
    if(s.indexOf('order sent')>=0 || s.indexOf('sent to supplier')>=0 || s.indexOf('נשלח')>=0 || s==='sent') return 'Order';
    if(s.indexOf('app order')>=0 || s.indexOf('approved')>=0 || s.indexOf('מאושר')>=0) return 'App order';
    if(s.indexOf('pre-order')>=0 || s.indexOf('pre order')>=0 || s.indexOf('pending approval')>=0) return 'Pre-Order';
    return '';
  }
  function labelFromListById(id){
    id=clean(id); var no=val('entryOrderNo'); if(!id && !no) return '';
    var found='';
    qa('tr,[onclick*="openEntryModal"],.order-row,.list-row,.dashboard-row').some(function(el){
      if(el.closest && el.closest('#entryModal')) return false;
      var oc=clean(el.getAttribute && el.getAttribute('onclick'));
      var tx=text(el);
      var hit=(id && oc.indexOf(id)>=0) || (no && tx.indexOf(no)>=0);
      if(!hit) return false;
      // V464: read ONLY the Process column cell from this row. Do not scan other badges in the row.
      var cells=qa('td',el);
      var b='';
      try{
        var table=el.closest('table'), idx=-1;
        if(table){ qa('thead th',table).some(function(th,i){ if(low(text(th))==='process'){ idx=i; return true; } return false; }); }
        if(idx>=0 && cells[idx]) b=text(cells[idx]);
      }catch(e){}
      if(!b && cells[4]) b=text(cells[4]);
      var l=low(b);
      if(l==='order' || l==='order sent' || l==='sent' || l==='sent to supplier'){ found='Order'; return true; }
      if(l==='app order' || l==='approved order' || l==='approved'){ found='App order'; return true; }
      if(l==='pre-order' || l==='pre order' || l==='preorder'){ found='Pre-Order'; return true; }
      if(l==='dn' || l==='delivery note' || l==='delivery-note'){ found='Delivery Note'; return true; }
      if(l==='invoice' || l==='invoiced' || l==='done'){ found='Invoice'; return true; }
      return false;
    });
    return found;
  }
  function authoritativeLabel(){
    var m=modal();
    var ds=clean(m && m.dataset.v462RealStatus);
    if(ds) return ds;
    return labelFromFields() || labelFromListById(currentId()) || '';
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
    if(!wrap){ wrap=document.createElement('div'); wrap.className='v432-status-wrap'; var med=document.createElement('div'); med.className='v432-status-medal v432-default'; med.textContent='Status'; wrap.appendChild(med); actions.insertAdjacentElement('afterend',wrap); }
    return q('.v432-status-medal',wrap);
  }
  function setStampVisible(show){
    var m=modal(); if(!m) return;
    qa('.v459-approved-stamp,.v425-approved-stamp,.v457-approved-stamp',m).forEach(function(st){
      if(show){ st.style.display='block'; st.style.visibility='visible'; st.style.opacity='1'; }
      else { try{st.remove();}catch(e){st.style.display='none'; st.style.visibility='hidden'; st.style.opacity='0';} }
    });
    if(!show){
      delete m.dataset.v459Approved; delete m.dataset.v459ApprovedKey;
    }
  }
  function enforceStatus(){
    var m=modal(); if(!m || !m.classList.contains('show')) return;
    var label=authoritativeLabel(); if(!label) return;
    var med=ensureMedal();
    if(med){ med.textContent=label; med.className='v432-status-medal '+classFor(label); }
    // APPROVED stamp belongs ONLY to App order. Real Order must not show it.
    if(label==='App order'){
      m.dataset.v459Approved='1'; m.dataset.v459ApprovedKey=currentSid()||currentId()||currentNo();
    }else{
      setStampVisible(false);
    }
  }

  function removeDockItemsForSid(sid){
    var d=dock(); if(!d || !sid) return;
    qa('.v420-window,[data-v454-sid],[data-v453-session-id],[data-v422-session-id],[data-v420-window-id],[data-v456-key]',d).forEach(function(item){
      if(itemSid(item)===sid){ try{item.remove();}catch(e){item.style.display='none';} }
    });
    var has=!!q('.v420-window,[data-v454-sid],[data-v453-session-id],[data-v422-session-id]',d);
    var sep=q('.v420-dock-separator',d); if(!has && sep) try{sep.remove();}catch(e){}
  }
  function closeOpenWindowIfSid(sid){
    if(!sid || !visible()) return;
    if(currentSid()!==sid) return;
    var old=window.__V462_ORIGINAL_CLOSE__;
    if(typeof old==='function') old.call(window);
    else { var m=modal(); if(m) m.classList.remove('show','v420-modal-minimized'); window.editingId=null; }
  }
  function installCloseWrapper(){
    if(window.__V462_CLOSE_WRAPPED__) return;
    if(typeof window.closeEntryModal!=='function') return;
    window.__V462_CLOSE_WRAPPED__=true;
    var old=window.closeEntryModal;
    window.__V462_ORIGINAL_CLOSE__=old;
    window.closeEntryModal=function(){
      var sid=currentSid();
      var res=old.apply(this,arguments);
      removeDockItemsForSid(sid);
      setTimeout(function(){removeDockItemsForSid(sid);},80);
      return res;
    };
  }
  function installDockXCapture(){
    if(window.__V462_DOCK_X_CAPTURE__) return;
    window.__V462_DOCK_X_CAPTURE__=true;
    function handler(e){
      var x=e.target && e.target.closest && e.target.closest('#v420MacDock .v457-close,#v420MacDock .v456-close');
      if(!x) return;
      var item=x.closest('.v420-window,[data-v454-sid],[data-v453-session-id],[data-v422-session-id],[data-v420-window-id],[data-v456-key]');
      var sid=itemSid(item);
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      closeOpenWindowIfSid(sid);
      removeDockItemsForSid(sid);
    }
    document.addEventListener('pointerdown',handler,true);
    document.addEventListener('click',handler,true);
  }
  function wrapOpen(){
    if(window.__V462_OPEN_WRAPPED__) return;
    if(typeof window.openEntryModal!=='function') return;
    window.__V462_OPEN_WRAPPED__=true;
    var old=window.openEntryModal;
    window.openEntryModal=async function(id,forcedMode){
      var res=await old.apply(this,arguments);
      var m=modal(); if(m){ if(id) m.dataset.v462EntryId=id; if(forcedMode) m.dataset.v462Mode=forcedMode; delete m.dataset.v462RealStatus; }
      if(id && window.supabase){
        try{
          var r=await window.supabase.from('suppliers').select('*').eq('id',id).single();
          var row=r && r.data;
          var label=labelFromRow(row);
          if(m && label) m.dataset.v462RealStatus=label;
        }catch(e){}
      }else{
        var lf=labelFromFields(); if(m && lf) m.dataset.v462RealStatus=lf;
      }
      enforceStatus();
      setTimeout(enforceStatus,40); setTimeout(enforceStatus,180); setTimeout(enforceStatus,600);
      return res;
    };
  }
  function injectCss(){
    if(q('#v462StatusDockCloseCss')) return;
    var st=document.createElement('style'); st.id='v462StatusDockCloseCss';
    st.textContent='.v462-force-hide-approved{display:none!important;visibility:hidden!important;opacity:0!important;}';
    document.head.appendChild(st);
  }
  function boot(){ injectCss(); wrapOpen(); installCloseWrapper(); installDockXCapture(); enforceStatus(); }
  document.addEventListener('DOMContentLoaded',boot);
  window.addEventListener('load',boot);
  document.addEventListener('click',function(){setTimeout(boot,30); setTimeout(enforceStatus,220);},true);
  document.addEventListener('change',function(){setTimeout(enforceStatus,40);},true);
  document.addEventListener('input',function(){setTimeout(enforceStatus,80);},true);
  setInterval(function(){try{boot();}catch(e){}},700);
})();
