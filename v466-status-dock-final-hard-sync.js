/* V466 HARD status + dock close sync
   Built on V465. Surgical patch only:
   - The footer medal is driven by the Process value of the clicked list row / DB row.
   - Final Order always shows footer medal = Order and removes APPROVED stamp.
   - App order only shows APPROVED.
   - Dock X closes the matching visible document window, not only the dock icon.
   No login/save/items/VAT/numbering/print logic changes. */
(function(){
  'use strict';
  if(window.__V466_STATUS_DOCK_FINAL_HARD_SYNC__) return;
  window.__V466_STATUS_DOCK_FINAL_HARD_SYNC__ = true;

  var byId=Object.create(null), byNo=Object.create(null), dbById=Object.create(null), lastId='', lastNo='', lastLabel='';
  var q=function(s,r){return (r||document).querySelector(s);};
  var qa=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
  var clean=function(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();};
  var low=function(v){return clean(v).toLowerCase();};
  var slug=function(v){return low(v).replace(/[^a-z0-9א-ת_-]+/gi,'_').replace(/^_+|_+$/g,'');};
  function modal(){return document.getElementById('entryModal');}
  function dock(){return document.getElementById('v420MacDock');}
  function val(id){var el=document.getElementById(id); return clean(el && el.value);}
  function txt(el){return clean(el && (el.innerText || el.textContent || ''));}
  function currentId(){var m=modal(); return clean((m && m.dataset && (m.dataset.v466EntryId || m.dataset.v465EntryId || m.dataset.v464EntryId || m.dataset.v463EntryId || m.dataset.v462EntryId || m.dataset.v453EditingId || m.dataset.v422EditingId || m.dataset.v375EntryId)) || window.editingId || '');}
  function currentNo(){var m=modal(); return val('entryOrderNo') || val('entryInvoiceNo') || clean(m && m.dataset && (m.dataset.v466OrderNo || m.dataset.orderNo || m.dataset.v456OrderNo)) || '';}
  function currentKey(){var id=currentId(); if(id) return 'id:'+slug(id); var no=currentNo(); return no ? 'no:'+slug(no) : '';}
  function hasDN(row){try{return typeof window.extractDeliveryNoteNo==='function' && !!window.extractDeliveryNoteNo(row);}catch(e){return false;}}
  function kind(row){try{return typeof window.displayEntryKind==='function' ? clean(window.displayEntryKind(row)) : clean(row && row.entry_type);}catch(e){return clean(row && row.entry_type);}}
  function normLabel(v){
    var s=low(v); if(!s) return '';
    if(s==='order' || s==='sent' || s==='order sent' || s.indexOf('sent to supplier')>=0 || s.indexOf('נשלח')>=0) return 'Order';
    if(s==='app order' || s==='approved' || s==='approved order' || s.indexOf('app order')>=0 || s.indexOf('מאושר')>=0) return 'App order';
    if(s==='pre-order' || s==='pre order' || s.indexOf('pending approval')>=0 || s==='pending') return 'Pre-Order';
    if(s.indexOf('delivery note')>=0) return 'Delivery Note';
    if(s.indexOf('invoice')>=0 || s==='done') return 'Invoice';
    if(s.indexOf('deposit')>=0) return 'Deposit';
    if(s.indexOf('credit note')>=0) return 'Credit Note';
    return '';
  }
  function classFor(label){
    var s=low(label);
    if(s==='order') return 'v432-order';
    if(s.indexOf('app')>=0) return 'v432-apporder';
    if(s.indexOf('pre')>=0) return 'v432-preorder';
    if(s.indexOf('delivery')>=0) return 'v432-dn';
    if(s.indexOf('invoice')>=0) return 'v432-invoice';
    if(s.indexOf('deposit')>=0) return 'v432-deposit';
    if(s.indexOf('credit')>=0) return 'v432-credit';
    return 'v432-default';
  }
  function rowId(row){
    if(!row) return '';
    var oc=clean(row.getAttribute && row.getAttribute('onclick'));
    var m=oc.match(/openEntryModal\(['"]([^'"]+)['"]/); if(m&&m[1]) return clean(m[1]);
    return clean(row.dataset && (row.dataset.id || row.dataset.entryId || row.dataset.v375EntryId));
  }
  function rowNo(row){
    if(!row) return '';
    var ds=row.dataset||{}; var n=clean(ds.orderNo || ds.order || ds.no || ds.invoiceNo); if(n) return n;
    try{ if(row.cells && row.cells[5]) n=clean(row.cells[5].innerText || row.cells[5].textContent); }catch(e){}
    if(n) return n;
    var t=txt(row), mm=t.match(/\b(?:PO|APOL|GLC|ORD|ORDER|PRE|DN|INV)[-\s#]*[A-Z0-9\/-]+\b/i); return clean(mm && mm[0]);
  }
  function rowProcess(row){
    if(!row) return '';
    // Home list table: Process is column 5 (index 4). This is the only reliable UI source.
    try{ if(row.cells && row.cells[4]){ var p=normLabel(txt(row.cells[4])); if(p) return p; } }catch(e){}
    var b=q('.process-badge,.v375-order-badge,.v399-app-order-badge,.v375-preorder-badge,.badge',row);
    return normLabel(txt(b));
  }
  function capture(e){
    var row=e.target && e.target.closest && e.target.closest('tr,[onclick*="openEntryModal"],[data-id],[data-entry-id],.order-row,.entry-row,.list-row,.data-row');
    if(!row || (row.closest && row.closest('#entryModal'))) return;
    var lab=rowProcess(row); if(!lab) return;
    var id=rowId(row), no=rowNo(row);
    if(id) byId[id]=lab;
    if(no) byNo[no]=lab;
    lastId=id; lastNo=no; lastLabel=lab;
  }
  function labelFromDb(row){
    if(!row) return '';
    try{ if(typeof window.processStatusLabel==='function'){ var p=normLabel(window.processStatusLabel(row)); if(p==='Order' || p==='Delivery Note' || p==='Invoice' || p==='Deposit' || p==='Credit Note') return p; } }catch(e){}
    var k=kind(row); if(k==='deposit') return 'Deposit'; if(k==='credit_note') return 'Credit Note';
    var order=!!clean(row.order_no), inv=!!clean(row.invoice_no), dn=hasDN(row), s=low(row.status), proc=normLabel(row.process || row.order_status || row.document_status || row.kind);
    if(order && dn && !inv) return 'Delivery Note';
    if(order && inv) return 'Invoice';
    if(inv && !order) return 'Invoice';
    if(order && !inv && !dn){
      if(proc==='Order') return 'Order';
      if(s.indexOf('sent')>=0 || s.indexOf('order sent')>=0 || s.indexOf('sent to supplier')>=0 || s.indexOf('נשלח')>=0) return 'Order';
      if(proc==='App order' || s.indexOf('approved')>=0 || s==='app order' || s==='approved order' || s.indexOf('מאושר')>=0) return 'App order';
      if(proc==='Pre-Order' || s.indexOf('pending')>=0) return 'Pre-Order';
      return '';
    }
    return proc || normLabel(row.status);
  }
  function authoritative(){
    var id=currentId(), no=currentNo(), m=modal();
    // Final Order from clicked list row wins over all old approval states.
    if(id && byId[id]==='Order') return 'Order';
    if(no && byNo[no]==='Order') return 'Order';
    if(id && dbById[id]==='Order') return 'Order';
    var ds=clean(m && m.dataset && m.dataset.v466RealStatus);
    if(ds==='Order') return 'Order';
    if(id && byId[id]) return byId[id];
    if(no && byNo[no]) return byNo[no];
    if(id && dbById[id]) return dbById[id];
    if(ds) return ds;
    if(lastLabel && (lastId===id || lastNo===no)) return lastLabel;
    var st=normLabel(val('entryStatus'));
    if(st==='Order') return 'Order';
    if(st==='App order') return 'App order';
    return '';
  }
  function ensureMedal(){
    var m=modal(); if(!m || !m.classList.contains('show')) return null;
    var actions=q('.modal-actions',m)||q('.modal-footer',m)||q('.window-actions',m); if(!actions) return null;
    var wrap=q('.v432-status-wrap',m);
    if(!wrap){ wrap=document.createElement('div'); wrap.className='v432-status-wrap'; var med=document.createElement('div'); med.className='v432-status-medal v432-default'; med.textContent='Status'; wrap.appendChild(med); actions.insertAdjacentElement('afterend',wrap); }
    return q('.v432-status-medal',wrap);
  }
  function removeApproved(m){
    qa('.v425-approved-stamp,.v457-approved-stamp,.v459-approved-stamp,.v463-approved-stamp,.v464-approved-stamp,.v465-approved-stamp,.v466-approved-stamp',m).forEach(function(x){try{x.remove();}catch(e){x.style.display='none';}});
    m.classList.remove('v463-status-app','v464-status-app','v465-status-app','v466-status-app');
  }
  function ensureApproved(m){
    qa('.v425-approved-stamp,.v457-approved-stamp,.v459-approved-stamp,.v463-approved-stamp,.v464-approved-stamp,.v465-approved-stamp',m).forEach(function(x){try{x.remove();}catch(e){x.style.display='none';}});
    var box=q('.modal-box',m)||m; var st=q('.v466-approved-stamp',box);
    if(!st){ st=document.createElement('div'); st.className='v466-approved-stamp'; st.textContent='APPROVED'; box.appendChild(st); }
    st.style.display='block'; st.style.visibility='visible'; st.style.opacity='1';
    m.classList.add('v466-status-app');
  }
  function paint(){
    var m=modal(); if(!m || !m.classList.contains('show')) return;
    var label=authoritative(); if(!label) return;
    var id=currentId(), no=currentNo(); if(id) byId[id]=label; if(no) byNo[no]=label;
    m.dataset.v466RealStatus=label; m.dataset.v465RealStatus=label; m.dataset.v464RealStatus=label; m.dataset.v463RealStatus=label; m.dataset.v462RealStatus=label;
    m.classList.remove('v463-status-app','v463-status-order','v463-status-pre','v464-status-app','v464-status-order','v464-status-pre','v465-status-app','v465-status-order','v465-status-pre','v466-status-app','v466-status-order','v466-status-pre');
    if(label==='Order') m.classList.add('v466-status-order');
    if(label==='Pre-Order') m.classList.add('v466-status-pre');
    var med=ensureMedal(); if(med){ if(med.textContent!==label) med.textContent=label; med.className='v432-status-medal '+classFor(label); med.dataset.v466Locked=label; }
    if(label==='App order') ensureApproved(m); else removeApproved(m);
  }
  function installObserver(){
    if(window.__V466_MEDAL_OBSERVER__) return; window.__V466_MEDAL_OBSERVER__=true;
    var mo=new MutationObserver(function(){ try{ paint(); }catch(e){} });
    mo.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','style','value']});
  }
  function installOpenWrap(){
    if(window.__V466_OPEN_WRAP__ || typeof window.openEntryModal!=='function') return; window.__V466_OPEN_WRAP__=true;
    var old=window.openEntryModal;
    window.openEntryModal=async function(id,forcedMode){
      var idc=clean(id), pre=idc && byId[idc];
      var res=await old.apply(this,arguments);
      var m=modal(); if(m && idc){ m.dataset.v466EntryId=idc; }
      try{
        if(idc && (window.vpSupabase || window.supabase)){
          var sup=window.vpSupabase || window.supabase;
          var r=await sup.from('suppliers').select('*').eq('id',idc).single();
          var lab=labelFromDb(r && r.data);
          if(pre==='Order') lab='Order';
          if(lab){ dbById[idc]=lab; if(m) m.dataset.v466RealStatus=lab; var no=clean(r && r.data && (r.data.order_no || r.data.invoice_no)); if(no) byNo[no]=lab; }
        } else if(pre && m){ m.dataset.v466RealStatus=pre; }
      }catch(e){ if(pre && m){ m.dataset.v466RealStatus=pre; } }
      paint(); setTimeout(paint,15); setTimeout(paint,80); setTimeout(paint,220); setTimeout(paint,650); setTimeout(paint,1200);
      return res;
    };
  }
  function itemTitle(item){return clean(item && (item.getAttribute('title') || txt(item)));}
  function closeVisibleEntry(){
    var m=modal(); if(!m || !m.classList.contains('show')) return;
    try{ if(typeof window.closeEntryModal==='function'){ window.closeEntryModal(); } }catch(e){}
    m.classList.remove('show','v420-modal-minimized');
    var box=q('.modal-box',m); if(box) box.style.display='';
    try{ window.editingId=null; }catch(e){}
  }
  function dockXHandler(e){
    var x=e.target && e.target.closest && e.target.closest('#v420MacDock .v457-close,#v420MacDock .v456-close,#v420MacDock .v464-dock-close,#v420MacDock .v465-dock-close,#v420MacDock .v466-dock-close');
    if(!x) return;
    var item=x.closest('.v420-window,[data-v466-key],[data-v465-key],[data-v464-key],[data-v456-key],[data-v454-sid],[data-v453-session-id],[data-v422-session-id],[data-v420-window-id]');
    if(!item) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    var no=currentNo(), title=low(itemTitle(item));
    var windows=qa('#v420MacDock .v420-window');
    if(modal() && modal().classList.contains('show') && (!no || title.indexOf(low(no))>=0 || windows.length<=1)) closeVisibleEntry();
    try{ item.remove(); }catch(err){ item.style.display='none'; }
    var d=dock(); if(d && !q('.v420-window,[data-v466-key],[data-v465-key],[data-v464-key],[data-v456-key],[data-v454-sid],[data-v453-session-id],[data-v422-session-id]',d)){ var sep=q('.v420-dock-separator',d); if(sep) sep.remove(); }
  }
  function installDockClose(){
    if(window.__V466_DOCK_X_CLOSE__) return; window.__V466_DOCK_X_CLOSE__=true;
    document.addEventListener('pointerdown',dockXHandler,true);
    document.addEventListener('click',dockXHandler,true);
  }
  function css(){
    if(q('#v466StatusDockCss')) return;
    var st=document.createElement('style'); st.id='v466StatusDockCss';
    st.textContent=
      '#entryModal.v466-status-order .v425-approved-stamp,#entryModal.v466-status-order .v457-approved-stamp,#entryModal.v466-status-order .v459-approved-stamp,#entryModal.v466-status-order .v463-approved-stamp,#entryModal.v466-status-order .v464-approved-stamp,#entryModal.v466-status-order .v465-approved-stamp,#entryModal.v466-status-pre .v425-approved-stamp,#entryModal.v466-status-pre .v457-approved-stamp,#entryModal.v466-status-pre .v459-approved-stamp,#entryModal.v466-status-pre .v463-approved-stamp,#entryModal.v466-status-pre .v464-approved-stamp,#entryModal.v466-status-pre .v465-approved-stamp{display:none!important;visibility:hidden!important;opacity:0!important;animation:none!important;transition:none!important;}\n'+
      '.v466-approved-stamp{position:absolute!important;right:24px!important;top:86px!important;z-index:2147483001!important;transform:rotate(-12deg)!important;border:3px solid #189150!important;border-radius:10px!important;padding:8px 13px!important;color:#26c66e!important;background:transparent!important;box-shadow:none!important;text-shadow:none!important;filter:none!important;animation:none!important;transition:none!important;will-change:auto!important;contain:paint!important;font:1000 24px/1 Arial,Helvetica,sans-serif!important;letter-spacing:2px!important;text-transform:uppercase!important;pointer-events:none!important;}\n'+
      '@media(max-width:680px){.v466-approved-stamp{right:16px!important;top:76px!important;font-size:18px!important;padding:7px 10px!important;}}';
    document.head.appendChild(st);
  }
  function boot(){css(); installOpenWrap(); installObserver(); installDockClose(); paint();}
  document.addEventListener('pointerdown',capture,true);
  document.addEventListener('click',capture,true);
  document.addEventListener('DOMContentLoaded',boot);
  window.addEventListener('load',boot);
  document.addEventListener('change',function(){setTimeout(paint,5);},true);
  document.addEventListener('input',function(){setTimeout(paint,5);},true);
  document.addEventListener('click',function(){setTimeout(boot,20); setTimeout(paint,40); setTimeout(paint,160);},true);
  setInterval(function(){try{paint();}catch(e){}},120);
})();
