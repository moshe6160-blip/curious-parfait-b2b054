/* V465 Final macOS Window/Dock + Status Sync
   Base: V463/V464 line. Surgical patch only.
   Fixes:
   1) If a document was opened from a row whose Process/Status badge is Order, the document footer medal is forced to Order and APPROVED is removed.
   2) App order alone shows the APPROVED stamp.
   3) Dock X closes the matching open order window as well as the dock icon.
   4) Closing the open order window removes its matching dock icon.
   No login/save/items/VAT/numbering/database schema changes. */
(function(){
  'use strict';
  if(window.__V465_MAC_WINDOW_STATUS_DOCK_SYNC_FINAL__) return;
  window.__V465_MAC_WINDOW_STATUS_DOCK_SYNC_FINAL__ = true;

  var q=function(s,r){return (r||document).querySelector(s);};
  var qa=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
  var clean=function(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();};
  var low=function(v){return clean(v).toLowerCase();};
  var slug=function(v){return low(v).replace(/[^a-z0-9א-ת_-]+/gi,'_').replace(/^_+|_+$/g,'');};

  var clickedLabelById = Object.create(null);
  var clickedLabelByNo = Object.create(null);
  var dbLabelById = Object.create(null);
  var lastClickedLabel = '';
  var lastClickedKey = '';
  var openLabelByKey = Object.create(null);

  function modal(){ return document.getElementById('entryModal'); }
  function dock(){ return document.getElementById('v420MacDock'); }
  function text(el){ return clean(el && (el.innerText || el.textContent || '')); }
  function val(id){ var el=document.getElementById(id); return clean(el && el.value); }
  function visible(){ var m=modal(); return !!(m && m.classList.contains('show') && !m.classList.contains('v420-modal-minimized')); }
  function currentId(){ var m=modal(); return clean((m && (m.dataset.v465EntryId || m.dataset.v464EntryId || m.dataset.v463EntryId || m.dataset.v462EntryId || m.dataset.v453EditingId || m.dataset.v422EditingId || m.dataset.v451EntryId || m.dataset.v375EntryId)) || window.editingId || ''); }
  function currentMode(){ var m=modal(); return val('entryMode') || val('entryType') || clean(m && (m.dataset.v422Mode || m.dataset.v462Mode || m.dataset.v465Mode)) || 'order'; }
  function currentNo(){ return val('entryOrderNo') || val('entryInvoiceNo') || clean((modal()||{}).dataset && ((modal()||{}).dataset.orderNo || (modal()||{}).dataset.v456OrderNo)) || ''; }
  function currentKey(){ var id=currentId(); if(id) return 'id:'+slug(id); var no=currentNo(); return no ? 'doc:'+slug(currentMode())+':'+slug(no) : ''; }

  function normLabel(s){
    var l=low(s); if(!l) return '';
    if(l==='order' || l==='sent' || l==='order sent' || l.indexOf('order sent')>=0 || l.indexOf('sent to supplier')>=0 || l.indexOf('נשלח')>=0) return 'Order';
    if(l==='app order' || l==='approved' || l==='approved order' || l.indexOf('app order')>=0 || l.indexOf('מאושר')>=0) return 'App order';
    if(l==='pre-order' || l==='pre order' || l.indexOf('pending approval')>=0) return 'Pre-Order';
    if(l.indexOf('delivery note')>=0) return 'Delivery Note';
    if(l.indexOf('credit note')>=0) return 'Credit Note';
    if(l.indexOf('deposit')>=0) return 'Deposit';
    if(l.indexOf('invoice')>=0 || l==='done') return 'Invoice';
    return '';
  }

  function processLabelFromDbRow(row){
    if(!row) return '';
    // First use the actual process badge calculation when it is final Order.
    try{ if(typeof window.processStatusLabel==='function'){ var p=clean(window.processStatusLabel(row)); if(p==='Order') return 'Order'; } }catch(e){}
    var status=clean(row.status), notes=clean(row.notes), process=clean(row.process || row.order_status || row.kind || row.document_status);
    var combined=[status,notes,process,row.entry_type,row.type].join(' ');
    var direct=normLabel(process) || normLabel(status);
    if(direct==='Order') return 'Order';
    if(normLabel(combined)==='Order') return 'Order';
    var hasOrder=!!clean(row.order_no), hasInvoice=!!clean(row.invoice_no);
    var hasDN=false; try{ hasDN=typeof window.extractDeliveryNoteNo==='function' && !!window.extractDeliveryNoteNo(row); }catch(e){}
    var kind=''; try{ kind=typeof window.displayEntryKind==='function' ? clean(window.displayEntryKind(row)) : clean(row.entry_type); }catch(e){ kind=clean(row.entry_type); }
    if(kind==='credit_note') return 'Credit Note';
    if(kind==='deposit') return 'Deposit';
    if(hasOrder && hasDN && !hasInvoice) return 'Delivery Note';
    if(hasOrder && hasDN && hasInvoice) return 'Invoice';
    if(hasOrder && hasInvoice) return 'Invoice';
    if(hasOrder && !hasInvoice && !hasDN){
      if(direct==='App order') return 'App order';
      if(direct==='Pre-Order') return 'Pre-Order';
      return direct || 'Pre-Order';
    }
    return direct;
  }

  function rowStatusBadgeText(row){
    if(!row) return '';
    var selectors=['.v375-order-badge','.v399-app-order-badge','.v398-app-order-badge','.v375-preorder-badge','.process-badge','.status-badge','.document-status','td .badge','.badge','.chip','.status'];
    for(var i=0;i<selectors.length;i++){
      var el=q(selectors[i],row); var lab=normLabel(text(el));
      if(lab) return lab;
    }
    // Fallback: look at cells, but ignore action button text.
    var cells=qa('td,span,b,small',row).map(function(x){return text(x);}).filter(Boolean);
    for(var j=0;j<cells.length;j++){ var lab2=normLabel(cells[j]); if(lab2) return lab2; }
    return '';
  }
  function idNoFromRow(row){
    var out={id:'',no:''}; if(!row) return out;
    var oc=clean(row.getAttribute && row.getAttribute('onclick'));
    var m=oc.match(/openEntryModal\(['"]([^'"]+)['"]/); if(m&&m[1]) out.id=clean(m[1]);
    if(row.dataset){ out.id = out.id || clean(row.dataset.id || row.dataset.entryId || row.dataset.v375EntryId); out.no = clean(row.dataset.orderNo || row.dataset.order || row.dataset.no || row.dataset.invoiceNo); }
    if(!out.no){
      var t=text(row);
      var n=t.match(/\b(?:PO|APOL|GLC|ORD|ORDER|PRE|DN|INV)[-\s#]*[A-Z0-9\/-]+\b/i) || t.match(/\b[A-Z]{2,6}-[A-Z0-9-]{1,}\b/i);
      out.no=clean(n && n[0]);
    }
    return out;
  }
  function captureRow(e){
    var row=e.target && e.target.closest && e.target.closest('tr,[role="row"],[onclick*="openEntryModal"],.order-row,.list-row,.dashboard-row,.table-row,.data-row,.entry-row,.order-card,.entry-card,.list-card,[data-id],[data-entry-id],[data-order-no]');
    if(!row || (row.closest && row.closest('#entryModal'))) return;
    var lab=rowStatusBadgeText(row); if(!lab) return;
    var ids=idNoFromRow(row);
    if(ids.id) clickedLabelById[ids.id]=lab;
    if(ids.no) clickedLabelByNo[ids.no]=lab;
    lastClickedLabel=lab; lastClickedKey=ids.id || ids.no || lastClickedKey;
  }

  function authoritativeLabel(){
    var m=modal(); if(!m) return '';
    var id=currentId(), no=currentNo(), key=currentKey();
    var fields=val('entryStatus')+' '+val('entryNotes');
    // Final Order wins when any reliable source says Order.
    if(id && clickedLabelById[id]==='Order') return 'Order';
    if(no && clickedLabelByNo[no]==='Order') return 'Order';
    if(id && dbLabelById[id]==='Order') return 'Order';
    if(normLabel(fields)==='Order') return 'Order';
    var ds=clean(m.dataset.v465RealStatus || m.dataset.v464RealStatus || m.dataset.v463RealStatus || m.dataset.v462RealStatus);
    if(ds==='Order') return 'Order';
    if(openLabelByKey[key]==='Order') return 'Order';

    if(id && clickedLabelById[id]) return clickedLabelById[id];
    if(no && clickedLabelByNo[no]) return clickedLabelByNo[no];
    if(ds) return ds;
    if(id && dbLabelById[id]) return dbLabelById[id];
    var nf=normLabel(fields); if(nf) return nf;
    if(openLabelByKey[key]) return openLabelByKey[key];
    if((lastClickedKey===id || lastClickedKey===no || lastClickedKey===key) && lastClickedLabel) return lastClickedLabel;
    return '';
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
  function killApproved(m){
    qa('.v425-approved-stamp,.v457-approved-stamp,.v459-approved-stamp,.v463-approved-stamp,.v464-approved-stamp,.v465-approved-stamp',m).forEach(function(x){ try{x.remove();}catch(e){x.style.display='none'; x.style.visibility='hidden'; x.style.opacity='0';} });
    delete m.dataset.v459Approved; delete m.dataset.v459ApprovedKey;
  }
  function ensureApproved(m,label){
    if(label!=='App order'){ killApproved(m); return; }
    qa('.v425-approved-stamp,.v457-approved-stamp,.v459-approved-stamp,.v463-approved-stamp,.v464-approved-stamp',m).forEach(function(x){ try{x.remove();}catch(e){x.style.display='none';} });
    var box=q('.modal-box',m)||m;
    var st=q('.v465-approved-stamp',box);
    if(!st){ st=document.createElement('div'); st.className='v465-approved-stamp'; st.textContent='APPROVED'; box.appendChild(st); }
    st.style.display='block'; st.style.visibility='visible'; st.style.opacity='1';
  }
  function paint(){
    var m=modal(); if(!m || !m.classList.contains('show')) return;
    var label=authoritativeLabel(); if(!label) return;
    var key=currentKey(); if(key) openLabelByKey[key]=label;
    m.dataset.v465RealStatus=label;
    m.dataset.v464RealStatus=label;
    m.dataset.v463RealStatus=label;
    m.dataset.v462RealStatus=label;
    m.classList.remove('v463-status-app','v463-status-order','v463-status-pre','v464-status-app','v464-status-order','v464-status-pre','v465-status-app','v465-status-order','v465-status-pre');
    if(label==='App order') m.classList.add('v465-status-app');
    if(label==='Order') m.classList.add('v465-status-order');
    if(label==='Pre-Order') m.classList.add('v465-status-pre');
    var med=ensureMedal(); if(med){ med.textContent=label; med.className='v432-status-medal '+classFor(label); }
    ensureApproved(m,label);
  }

  function itemText(item){ return clean(item && (item.getAttribute('title') || text(item))); }
  function itemKey(item){
    if(!item) return '';
    var ds=item.dataset||{};
    var explicit=clean(ds.v465Key || ds.v464Key || ds.v456Key || ds.v454Sid || ds.v453SessionId || ds.v422SessionId || ds.v420WindowId);
    if(explicit) return explicit;
    var t=itemText(item); return t ? 'title:'+slug(t) : '';
  }
  function itemMatchesCurrent(item){
    var ik=itemKey(item), ck=currentKey(), no=currentNo(), id=currentId();
    if(!item || !ik) return false;
    if(ck && ik===ck) return true;
    var title=low(itemText(item));
    if(no && (title.indexOf(low(no))>=0 || ik.indexOf(slug(no))>=0)) return true;
    if(id && ik.indexOf(slug(id))>=0) return true;
    return false;
  }
  function removeItem(item){ if(!item) return; try{ item.remove(); }catch(e){ item.style.display='none'; } }
  function removeDockForCurrent(){
    var d=dock(); if(!d) return;
    qa('.v420-window,[data-v465-key],[data-v464-key],[data-v456-key],[data-v454-sid],[data-v453-session-id],[data-v422-session-id],[data-v420-window-id]',d).forEach(function(item){ if(itemMatchesCurrent(item)) removeItem(item); });
    cleanupSeparator();
  }
  function cleanupSeparator(){ var d=dock(); if(!d) return; var has=!!q('.v420-window,[data-v465-key],[data-v464-key],[data-v456-key],[data-v454-sid],[data-v453-session-id],[data-v422-session-id]',d); var sep=q('.v420-dock-separator',d); if(!has && sep) removeItem(sep); }
  function closeCurrentWindow(){
    var m=modal(); if(!m) return;
    var old=window.__V462_ORIGINAL_CLOSE__;
    if(typeof old==='function'){ try{ old.call(window); }catch(e){} }
    m.classList.remove('show','v420-modal-minimized');
    m.style.pointerEvents=''; m.style.background='';
    var box=q('.modal-box',m); if(box) box.style.display='';
    try{ window.editingId=null; }catch(e){}
  }
  function dockItemMatchesOpenWindow(item){ return visible() && itemMatchesCurrent(item); }
  function installDockXClose(){
    if(window.__V465_DOCK_X_CLOSE__) return; window.__V465_DOCK_X_CLOSE__=true;
    function handler(e){
      var x=e.target && e.target.closest && e.target.closest('#v420MacDock .v457-close,#v420MacDock .v456-close,#v420MacDock .v464-dock-close,#v420MacDock .v465-dock-close');
      if(!x) return;
      var item=x.closest('.v420-window,[data-v465-key],[data-v464-key],[data-v456-key],[data-v454-sid],[data-v453-session-id],[data-v422-session-id],[data-v420-window-id]');
      if(!item) return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      if(dockItemMatchesOpenWindow(item)) closeCurrentWindow();
      removeItem(item); cleanupSeparator();
    }
    document.addEventListener('pointerdown',handler,true);
    document.addEventListener('click',handler,true);
  }
  function installWindowCloseSync(){
    if(window.__V465_WINDOW_CLOSE_SYNC__ || typeof window.windowAction!=='function') return; window.__V465_WINDOW_CLOSE_SYNC__=true;
    var old=window.windowAction;
    window.windowAction=function(ev,action){
      var isEntry=ev && ev.target && ev.target.closest && ev.target.closest('#entryModal');
      if(isEntry && action==='close'){
        if(ev){ ev.preventDefault(); ev.stopPropagation(); }
        removeDockForCurrent();
        closeCurrentWindow();
        setTimeout(removeDockForCurrent,80);
        return;
      }
      return old.apply(this,arguments);
    };
  }
  function installPlainCloseSync(){
    if(window.__V465_CLOSE_ENTRY_SYNC__ || typeof window.closeEntryModal!=='function') return; window.__V465_CLOSE_ENTRY_SYNC__=true;
    var old=window.closeEntryModal;
    window.closeEntryModal=function(){ removeDockForCurrent(); var r=old.apply(this,arguments); setTimeout(removeDockForCurrent,80); return r; };
  }
  function installOpenWrap(){
    if(window.__V465_OPEN_WRAP__ || typeof window.openEntryModal!=='function') return; window.__V465_OPEN_WRAP__=true;
    var old=window.openEntryModal;
    window.openEntryModal=async function(id,forcedMode){
      var idClean=clean(id); var pre=idClean && clickedLabelById[idClean];
      var res=await old.apply(this,arguments);
      var m=modal(); if(m){ if(idClean) m.dataset.v465EntryId=idClean; if(forcedMode) m.dataset.v465Mode=forcedMode; }
      if(idClean && (window.vpSupabase || window.supabase)){
        try{
          var sup=window.vpSupabase || window.supabase;
          var r=await sup.from('suppliers').select('*').eq('id',idClean).single();
          var lab=processLabelFromDbRow(r && r.data);
          if(pre==='Order') lab='Order';
          if(lab){ dbLabelById[idClean]=lab; if(m){ m.dataset.v465RealStatus=lab; m.dataset.v464RealStatus=lab; m.dataset.v463RealStatus=lab; m.dataset.v462RealStatus=lab; } }
        }catch(e){ if(pre && m){ m.dataset.v465RealStatus=pre; m.dataset.v464RealStatus=pre; m.dataset.v463RealStatus=pre; m.dataset.v462RealStatus=pre; } }
      } else if(pre && m){ m.dataset.v465RealStatus=pre; m.dataset.v464RealStatus=pre; m.dataset.v463RealStatus=pre; m.dataset.v462RealStatus=pre; }
      paint(); setTimeout(paint,20); setTimeout(paint,120); setTimeout(paint,420); setTimeout(paint,950);
      return res;
    };
  }
  function injectCss(){
    if(q('#v465MacWindowStatusCss')) return;
    var st=document.createElement('style'); st.id='v465MacWindowStatusCss';
    st.textContent=
      '#entryModal.v465-status-order .v425-approved-stamp,#entryModal.v465-status-order .v457-approved-stamp,#entryModal.v465-status-order .v459-approved-stamp,#entryModal.v465-status-order .v463-approved-stamp,#entryModal.v465-status-order .v464-approved-stamp,#entryModal.v465-status-pre .v425-approved-stamp,#entryModal.v465-status-pre .v457-approved-stamp,#entryModal.v465-status-pre .v459-approved-stamp,#entryModal.v465-status-pre .v463-approved-stamp,#entryModal.v465-status-pre .v464-approved-stamp{display:none!important;visibility:hidden!important;opacity:0!important;animation:none!important;transition:none!important;}\n'+
      '.v465-approved-stamp{position:absolute!important;right:24px!important;top:86px!important;z-index:2147483000!important;transform:rotate(-12deg)!important;border:3px solid #189150!important;border-radius:10px!important;padding:8px 13px!important;color:#26c66e!important;background:transparent!important;box-shadow:none!important;text-shadow:none!important;filter:none!important;animation:none!important;transition:none!important;will-change:auto!important;contain:paint!important;font:1000 24px/1 Arial,Helvetica,sans-serif!important;letter-spacing:2px!important;text-transform:uppercase!important;pointer-events:none!important;}\n'+
      '@media(max-width:680px){.v465-approved-stamp{right:16px!important;top:76px!important;font-size:18px!important;padding:7px 10px!important;}}\n'+
      '.v456-gemini-open #entryModal .modal-box,.v465-gemini-open #entryModal .modal-box{animation:v465GeminiOpen .72s cubic-bezier(.16,1,.3,1) both!important;}\n'+
      '@keyframes v465GeminiOpen{0%{opacity:0;transform:translateY(22px) scale(.965);filter:blur(8px) brightness(1.15)}48%{opacity:.96;transform:translateY(-3px) scale(1.004);filter:blur(0) brightness(1.05)}100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0) brightness(1)}}';
    document.head.appendChild(st);
  }
  function boot(){ injectCss(); installOpenWrap(); installWindowCloseSync(); installPlainCloseSync(); installDockXClose(); paint(); }

  document.addEventListener('pointerdown', captureRow, true);
  document.addEventListener('click', captureRow, true);
  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('load', boot);
  document.addEventListener('click',function(){ setTimeout(boot,20); setTimeout(paint,90); setTimeout(paint,260); },true);
  document.addEventListener('change',function(){ setTimeout(paint,30); },true);
  document.addEventListener('input',function(){ setTimeout(paint,70); },true);
  setInterval(function(){ try{ boot(); }catch(e){} },450);
})();
