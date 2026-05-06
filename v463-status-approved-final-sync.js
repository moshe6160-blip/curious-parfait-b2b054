/* V463 Final Status + APPROVED stamp sync
   Base: V462 full system.
   Fixes:
   - Real Order opened from list/dock must show medal = Order and never APPROVED.
   - App order shows one static APPROVED stamp only, no border/text flicker.
   - Print/PDF/share receives APPROVED only for App order, never for real Order.
   - Does not touch login/save/items/numbering/VAT/approval workflow. */
(function(){
  'use strict';
  if(window.__V463_STATUS_APPROVED_FINAL_SYNC__) return;
  window.__V463_STATUS_APPROVED_FINAL_SYNC__ = true;

  var q=function(s,r){return (r||document).querySelector(s);};
  var qa=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
  var clean=function(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();};
  var low=function(v){return clean(v).toLowerCase();};
  var clickedStatusById={};
  var clickedStatusByNo={};
  var lastLabel='';
  var lastKey='';

  function modal(){return document.getElementById('entryModal');}
  function text(el){return clean(el && (el.innerText || el.textContent || ''));}
  function val(id){var el=document.getElementById(id); return clean(el && el.value);}
  function currentId(){var m=modal(); return clean((m && (m.dataset.v462EntryId || m.dataset.v453EditingId || m.dataset.v422EditingId || m.dataset.v451EntryId || m.dataset.v375EntryId)) || window.editingId || '');}
  function currentNo(){return val('entryOrderNo') || val('entryInvoiceNo') || clean((modal()||{}).dataset && ((modal()||{}).dataset.orderNo || (modal()||{}).dataset.v456OrderNo)) || '';}
  function currentKey(){return currentId() || currentNo() || 'current';}

  function isOrderText(s){ s=low(s); return s==='order' || s==='order sent' || s.indexOf('sent to supplier')>=0 || s.indexOf('נשלח')>=0; }
  function isAppText(s){ s=low(s); return s==='app order' || s==='approved' || s.indexOf('app order')>=0 || s.indexOf('מאושר')>=0; }
  function isPreText(s){ s=low(s); return s==='pre-order' || s==='pre order' || s.indexOf('pending approval')>=0; }
  function normalizeLabel(s){
    s=clean(s); var l=low(s);
    if(!l) return '';
    if(l==='order' || l==='order sent' || l.indexOf('sent to supplier')>=0 || l.indexOf('נשלח')>=0) return 'Order';
    if(l==='app order' || l==='approved' || l.indexOf('app order')>=0 || l.indexOf('מאושר')>=0) return 'App order';
    if(l==='pre-order' || l==='pre order' || l.indexOf('pending approval')>=0) return 'Pre-Order';
    if(l.indexOf('delivery note')>=0) return 'Delivery Note';
    if(l.indexOf('credit note')>=0) return 'Credit Note';
    if(l.indexOf('deposit')>=0) return 'Deposit';
    if(l.indexOf('invoice')>=0 || l==='done') return 'Invoice';
    return '';
  }
  function labelFromRowText(row){
    if(!row) return '';
    // Prefer small status badges/chips/cells rather than the whole row, because the row can include action buttons.
    var candidates=qa('.badge,.chip,.status-badge,.process-badge,.status,.document-status,td,span,b', row).map(function(x){return text(x);}).filter(Boolean);
    var exact='';
    candidates.some(function(t){ var lab=normalizeLabel(t); if(lab){ exact=lab; return true; } return false; });
    if(exact) return exact;
    var joined=text(row);
    // In full row text, Order must win over App Order only when a clear Order badge/action exists.
    if(/(^|\s|\|)Order(\s|\||$)/i.test(joined) && low(joined).indexOf('app order')<0 && low(joined).indexOf('pre-order')<0) return 'Order';
    return normalizeLabel(joined);
  }
  function captureClickedRow(e){
    var row=e.target && e.target.closest && e.target.closest('tr,[onclick*="openEntryModal"],.order-row,.list-row,.dashboard-row,[data-id],[data-order-no]');
    if(!row || (row.closest && row.closest('#entryModal'))) return;
    var lab=labelFromRowText(row); if(!lab) return;
    var oc=clean(row.getAttribute && row.getAttribute('onclick'));
    var m=oc.match(/openEntryModal\(['"]([^'"]+)['"]/);
    var id=clean((m&&m[1]) || (row.dataset && (row.dataset.id || row.dataset.entryId)) || '');
    var no=clean((row.dataset && (row.dataset.orderNo || row.dataset.order || row.dataset.no)) || '');
    if(!no){
      var tx=text(row), nm=tx.match(/(?:PO|ORD|ORDER|PRE)[-\s#]*\d+[A-Z0-9-]*/i) || tx.match(/\b\d{3,}\b/);
      no=clean(nm && nm[0]);
    }
    if(id) clickedStatusById[id]=lab;
    if(no) clickedStatusByNo[no]=lab;
    lastLabel=lab; lastKey=id||no||lastKey;
  }
  document.addEventListener('pointerdown', captureClickedRow, true);
  document.addEventListener('click', captureClickedRow, true);

  function rowLabelByIdOrNo(id,no){
    id=clean(id); no=clean(no); var found='';
    qa('tr,[onclick*="openEntryModal"],.order-row,.list-row,.dashboard-row,[data-id],[data-order-no]').some(function(row){
      if(row.closest && row.closest('#entryModal')) return false;
      var oc=clean(row.getAttribute && row.getAttribute('onclick'));
      var tx=text(row);
      var rid=clean(row.dataset && (row.dataset.id || row.dataset.entryId));
      var rno=clean(row.dataset && (row.dataset.orderNo || row.dataset.order || row.dataset.no));
      var hit=(id && (rid===id || oc.indexOf(id)>=0)) || (no && (rno===no || tx.indexOf(no)>=0));
      if(!hit) return false;
      var lab=labelFromRowText(row);
      if(lab){found=lab; return true;}
      return false;
    });
    return found;
  }
  function labelFromFieldsStrict(){
    var s=low(val('entryStatus')+' '+val('entryNotes'));
    if(s.indexOf('order sent')>=0 || s.indexOf('sent to supplier')>=0 || s.indexOf('נשלח')>=0 || s==='sent') return 'Order';
    if(s.indexOf('app order')>=0 || s.indexOf('approved')>=0 || s.indexOf('מאושר')>=0) return 'App order';
    if(s.indexOf('pre-order')>=0 || s.indexOf('pre order')>=0 || s.indexOf('pending approval')>=0) return 'Pre-Order';
    return '';
  }
  function authoritativeLabel(){
    var m=modal(), id=currentId(), no=currentNo(), key=currentKey();
    var ds=clean(m && (m.dataset.v463RealStatus || m.dataset.v462RealStatus));
    // If clicked/opened from row as Order, it is more reliable than old modal text/buttons.
    if(id && clickedStatusById[id]==='Order') return 'Order';
    if(no && clickedStatusByNo[no]==='Order') return 'Order';
    var fromList=rowLabelByIdOrNo(id,no);
    if(fromList==='Order') return 'Order';
    if(ds==='Order') return 'Order';
    if(id && clickedStatusById[id]) return clickedStatusById[id];
    if(no && clickedStatusByNo[no]) return clickedStatusByNo[no];
    if(ds) return ds;
    if(fromList) return fromList;
    var f=labelFromFieldsStrict();
    if(f) return f;
    if(lastKey===key && lastLabel) return lastLabel;
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
    if(!wrap){
      wrap=document.createElement('div'); wrap.className='v432-status-wrap';
      var med=document.createElement('div'); med.className='v432-status-medal v432-default'; med.textContent='Status';
      wrap.appendChild(med); actions.insertAdjacentElement('afterend',wrap);
    }
    return q('.v432-status-medal',wrap);
  }
  function injectCss(){
    if(q('#v463FinalStatusStampCss')) return;
    var st=document.createElement('style'); st.id='v463FinalStatusStampCss';
    st.textContent =
      '#entryModal .vp-status-medal-live,#entryModal .v440-status-medal{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}\n'+
      '#entryModal .v459-approved-stamp,#entryModal .v425-approved-stamp,#entryModal .v457-approved-stamp{display:none!important;visibility:hidden!important;opacity:0!important;animation:none!important;transition:none!important;}\n'+
      '#entryModal.v463-status-app .v463-approved-stamp{display:block!important;visibility:visible!important;opacity:1!important;}\n'+
      '#entryModal.v463-status-order .v463-approved-stamp,#entryModal.v463-status-pre .v463-approved-stamp{display:none!important;visibility:hidden!important;opacity:0!important;}\n'+
      '.v463-approved-stamp{position:absolute!important;right:24px!important;top:86px!important;z-index:2147483000!important;transform:rotate(-12deg)!important;border:3px solid #189150!important;outline:0!important;border-radius:10px!important;padding:8px 13px!important;color:#26c66e!important;background:transparent!important;box-shadow:none!important;text-shadow:none!important;filter:none!important;mix-blend-mode:normal!important;animation:none!important;transition:none!important;will-change:auto!important;backface-visibility:hidden!important;contain:paint!important;font:1000 24px/1 Arial,Helvetica,sans-serif!important;letter-spacing:2px!important;text-transform:uppercase!important;pointer-events:none!important;}\n'+
      '@media(max-width:680px){.v463-approved-stamp{right:16px!important;top:76px!important;font-size:18px!important;padding:7px 10px!important;}}\n'+
      '@media print{.v463-approved-stamp{display:block!important;position:fixed!important;right:28mm!important;top:34mm!important;color:#198f50!important;border-color:#198f50!important;background:transparent!important;box-shadow:none!important;opacity:1!important;visibility:visible!important;}}';
    document.head.appendChild(st);
  }
  function updateClasses(m,label){
    m.classList.remove('v463-status-app','v463-status-order','v463-status-pre');
    if(label==='App order') m.classList.add('v463-status-app');
    else if(label==='Order') m.classList.add('v463-status-order');
    else if(label==='Pre-Order') m.classList.add('v463-status-pre');
  }
  function removeOldStamps(m){
    qa('.v459-approved-stamp,.v425-approved-stamp,.v457-approved-stamp',m).forEach(function(x){ try{x.remove();}catch(e){x.style.display='none';} });
    if(m){ delete m.dataset.v459Approved; delete m.dataset.v459ApprovedKey; }
  }
  function ensureOwnStamp(m,label){
    var box=q('.modal-box',m)||m;
    var st=q('.v463-approved-stamp',box);
    if(label==='App order'){
      if(!st){ st=document.createElement('div'); st.className='v463-approved-stamp'; st.textContent='APPROVED'; box.appendChild(st); }
      st.textContent='APPROVED'; st.style.display='block';
    }else if(st){ try{st.remove();}catch(e){st.style.display='none';} }
  }
  function enforce(){
    injectCss();
    var m=modal(); if(!m || !m.classList.contains('show')) return;
    var label=authoritativeLabel(); if(!label) return;
    m.dataset.v463RealStatus=label;
    lastLabel=label; lastKey=currentKey();
    updateClasses(m,label);
    var med=ensureMedal();
    if(med){ med.textContent=label; med.className='v432-status-medal '+classFor(label); }
    removeOldStamps(m);
    ensureOwnStamp(m,label);
  }

  function addPrintStamp(html){
    if(authoritativeLabel()!=='App order') return String(html).replace(/<style[^>]*id=["']v459PrintApprovedCss["'][\s\S]*?<\/style>/gi,'').replace(/<div[^>]*class=["']v459-print-approved-stamp["'][\s\S]*?<\/div>/gi,'');
    html=String(html);
    html=html.replace(/<style[^>]*id=["']v459PrintApprovedCss["'][\s\S]*?<\/style>/gi,'').replace(/<div[^>]*class=["']v459-print-approved-stamp["'][\s\S]*?<\/div>/gi,'');
    if(html.indexOf('v463-print-approved-stamp')>=0) return html;
    var css='<style id="v463PrintApprovedCss">.v463-print-approved-stamp{position:absolute;right:46px;top:112px;z-index:9999;transform:rotate(-12deg);border:4px solid #198f50;color:#198f50;border-radius:12px;padding:9px 15px;font:900 28px/1 Arial,Helvetica,sans-serif;letter-spacing:3px;background:rgba(255,255,255,.74);text-transform:uppercase;opacity:.95}@media print{.v463-print-approved-stamp{display:block!important}}</style>';
    var stamp='<div class="v463-print-approved-stamp">APPROVED</div>';
    if(html.indexOf('</head>')>=0) html=html.replace('</head>',css+'</head>'); else html=css+html;
    if(html.indexOf('<div class="page">')>=0) return html.replace('<div class="page">','<div class="page" style="position:relative">'+stamp);
    if(html.indexOf("<div class='page'>")>=0) return html.replace("<div class='page'>","<div class='page' style='position:relative'>"+stamp);
    return html.indexOf('<body>')>=0 ? html.replace('<body>','<body>'+stamp) : stamp+html;
  }
  function installPrintGuard(){
    if(window.__V463_PRINT_GUARD__) return; window.__V463_PRINT_GUARD__=true;
    var originalOpen=window.open;
    window.open=function(){
      var w=originalOpen.apply(window,arguments);
      try{
        if(w && w.document && typeof w.document.write==='function'){
          var ow=w.document.write.bind(w.document);
          w.document.write=function(html){ return ow(addPrintStamp(html)); };
        }
      }catch(e){}
      return w;
    };
  }
  function wrapOpen(){
    if(window.__V463_OPEN_WRAPPED__ || typeof window.openEntryModal!=='function') return;
    window.__V463_OPEN_WRAPPED__=true;
    var old=window.openEntryModal;
    window.openEntryModal=async function(id,forcedMode){
      var key=clean(id);
      var pre=key && clickedStatusById[key];
      var res=await old.apply(this,arguments);
      var m=modal();
      if(m){ if(key) m.dataset.v463EntryId=key; if(pre) m.dataset.v463RealStatus=pre; }
      enforce();
      setTimeout(enforce,30); setTimeout(enforce,120); setTimeout(enforce,350); setTimeout(enforce,900);
      return res;
    };
  }
  function boot(){ wrapOpen(); installPrintGuard(); enforce(); }
  document.addEventListener('DOMContentLoaded',boot);
  window.addEventListener('load',boot);
  document.addEventListener('click',function(){ setTimeout(boot,20); setTimeout(enforce,160); },true);
  document.addEventListener('change',function(){ setTimeout(enforce,40); },true);
  document.addEventListener('input',function(){ setTimeout(enforce,80); },true);
  setInterval(function(){ try{boot();}catch(e){} },250);
})();
