/* V459 APPROVED stamp stable + print/export injection
   Base: V458 full system. Safe UI/print patch only.
   - Keeps a single APPROVED stamp locked for App order/Approved documents, no flicker during refresh.
   - Adds the same APPROVED stamp to Purchase Order print/PDF/share/WhatsApp printable document.
   - Does not change save, numbering, items, VAT, approval workflow, or DB updates. */
(function(){
  'use strict';
  if(window.__V459_APPROVED_STAMP_PRINT_STABLE__) return;
  window.__V459_APPROVED_STAMP_PRINT_STABLE__ = true;

  var q=function(s,r){return (r||document).querySelector(s);};
  var qa=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
  var clean=function(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();};
  var low=function(v){return clean(v).toLowerCase();};
  function modal(){return document.getElementById('entryModal');}
  function val(id){var el=document.getElementById(id); return clean(el && el.value);}
  function text(el){return clean(el && (el.innerText || el.textContent || ''));}
  function orderNo(){return val('entryOrderNo') || clean(q('#entryModal [name="order_no"]') && q('#entryModal [name="order_no"]').value);}
  function invoiceNo(){return val('entryInvoiceNo') || clean(q('#entryModal [name="invoice_no"]') && q('#entryModal [name="invoice_no"]').value);}
  function currentKey(){
    var m=modal();
    var id=clean((m && (m.dataset.v456Key || m.dataset.v454Sid || m.dataset.v453EditingId || m.dataset.v422EditingId || m.dataset.v451EntryId)) || window.editingId || '');
    return clean(id || orderNo() || invoiceNo() || 'current');
  }
  function labelFromText(t){
    t=low(t);
    if(!t) return '';
    if(t.indexOf('app order')>=0 || t.indexOf('approved')>=0 || t.indexOf('מאושר')>=0) return 'App order';
    if(t.indexOf('order sent')>=0 || t.indexOf('sent to supplier')>=0) return 'Order';
    if(t.indexOf('pre-order')>=0 || t.indexOf('pre order')>=0 || t.indexOf('pending approval')>=0) return 'Pre-Order';
    return '';
  }
  function statusFromList(){
    var no=orderNo(), id=currentKey();
    if(!no && !id) return '';
    var rows=qa('tr,.order-row,.list-row,.table-row,.card,.dashboard-row,[onclick*="openEntryModal"],[data-id],[data-order-no]');
    var found='';
    rows.some(function(el){
      if(el.closest && el.closest('#entryModal')) return false;
      var tx=text(el), oc=clean(el.getAttribute && el.getAttribute('onclick'));
      var hit=(no && tx.indexOf(no)>=0) || (id && (oc.indexOf(id)>=0 || clean(el.dataset && (el.dataset.id || el.dataset.orderNo || el.dataset.key)).indexOf(id)>=0));
      if(!hit) return false;
      var lab=labelFromText(tx);
      if(lab){ found=lab; return true; }
      return false;
    });
    return found;
  }
  function rawStatusText(){
    var parts=[];
    parts.push(val('entryStatus'));
    var m=modal();
    if(m){
      parts.push(text(q('.v432-status-medal',m)));
      parts.push(text(q('.v425-status-medal',m)));
      parts.push(text(q('.v456-status-medal',m)));
      parts.push(text(q('.v457-status-medal',m)));
      parts.push(clean(m.dataset && (m.dataset.realStatus || m.dataset.v456Status || m.dataset.v454Status || m.dataset.status)));
    }
    parts.push(statusFromList());
    return parts.join(' ');
  }
  function isApprovedText(t){
    t=low(t);
    return t.indexOf('app order')>=0 || t.indexOf('approved')>=0 || t.indexOf('מאושר')>=0;
  }
  function isPreOnlyText(t){
    t=low(t);
    return (t.indexOf('pre-order')>=0 || t.indexOf('pre order')>=0 || t.indexOf('pending approval')>=0) && !isApprovedText(t);
  }
  function isApprovedCurrent(){
    var m=modal();
    var key=currentKey();
    var raw=rawStatusText();
    if(isApprovedText(raw)){
      if(m){ m.dataset.v459ApprovedKey=key; m.dataset.v459Approved='1'; }
      return true;
    }
    // Keep approved locked for the same loaded document to prevent flicker when old render briefly writes Pre-Order.
    if(m && m.dataset.v459Approved==='1' && m.dataset.v459ApprovedKey===key) return true;
    return false;
  }
  function injectCss(){
    if(q('#v459ApprovedStableCss')) return;
    var st=document.createElement('style');
    st.id='v459ApprovedStableCss';
    st.textContent =
      '.v459-approved-stamp{position:absolute!important;right:24px!important;top:86px!important;z-index:2147483000!important;transform:rotate(-12deg)!important;border:3px solid rgba(24,145,80,.92)!important;color:rgba(38,198,110,.98)!important;border-radius:10px!important;padding:8px 13px!important;font:1000 24px/1 Arial,Helvetica,sans-serif!important;letter-spacing:2px!important;text-transform:uppercase!important;pointer-events:none!important;mix-blend-mode:screen!important;box-shadow:0 0 0 1px rgba(255,255,255,.12) inset,0 0 18px rgba(24,145,80,.22)!important;display:block!important;opacity:1!important;visibility:visible!important;animation:none!important;transition:none!important;}\n'+
      '.v425-approved-stamp,.v457-approved-stamp{animation:none!important;transition:none!important;}\n'+
      '@media(max-width:680px){.v459-approved-stamp{right:16px!important;top:76px!important;font-size:18px!important;padding:7px 10px!important;}}\n'+
      '@media print{.v459-approved-stamp,.v425-approved-stamp,.v457-approved-stamp{display:block!important;position:fixed!important;right:28mm!important;top:34mm!important;color:#198f50!important;border-color:#198f50!important;mix-blend-mode:normal!important;opacity:1!important;visibility:visible!important;}}';
    document.head.appendChild(st);
  }
  function ensureStamp(){
    injectCss();
    var m=modal(); if(!m || !m.classList.contains('show')) return;
    var box=q('.modal-box',m) || m;
    var old=qa('.v425-approved-stamp,.v457-approved-stamp',box);
    var stamp=q('.v459-approved-stamp',box);
    var approved=isApprovedCurrent();
    if(approved){
      old.forEach(function(x){ if(!x.classList.contains('v459-approved-stamp')){ try{x.style.display='none';}catch(e){} } });
      if(!stamp){ stamp=document.createElement('div'); stamp.className='v459-approved-stamp'; stamp.textContent='APPROVED'; box.appendChild(stamp); }
      stamp.textContent='APPROVED';
      stamp.style.display='block'; stamp.style.opacity='1'; stamp.style.visibility='visible';
    }else if(stamp && isPreOnlyText(rawStatusText())){
      // Only remove when the current real state is clearly pending and no approved cache exists.
      try{stamp.remove();}catch(e){stamp.style.display='none';}
    }
  }

  function addPrintStampToHtml(html){
    if(!isApprovedCurrent()) return html;
    if(String(html).indexOf('v459-print-approved-stamp')>=0) return html;
    var css='<style id="v459PrintApprovedCss">.v459-print-approved-stamp{position:absolute;right:46px;top:112px;z-index:9999;transform:rotate(-12deg);border:4px solid #198f50;color:#198f50;border-radius:12px;padding:9px 15px;font:900 28px/1 Arial,Helvetica,sans-serif;letter-spacing:3px;background:rgba(255,255,255,.74);text-transform:uppercase;opacity:.95}@media print{.v459-print-approved-stamp{display:block!important}}</style>';
    var stamp='<div class="v459-print-approved-stamp">APPROVED</div>';
    html=String(html);
    if(html.indexOf('</head>')>=0) html=html.replace('</head>', css+'</head>');
    else html=css+html;
    if(html.indexOf('<div class="page">')>=0) return html.replace('<div class="page">','<div class="page" style="position:relative">'+stamp);
    if(html.indexOf("<div class='page'>")>=0) return html.replace("<div class='page'>","<div class='page' style='position:relative'>"+stamp);
    return html.replace('<body>','<body>'+stamp);
  }
  function wrapPrintable(name){
    var old=window[name];
    if(typeof old!=='function' || old.__v459Wrapped) return;
    var wrapped=function(){
      ensureStamp();
      var originalOpen=window.open;
      window.open=function(){
        var w=originalOpen.apply(window,arguments);
        try{
          if(w && w.document && typeof w.document.write==='function'){
            var ow=w.document.write.bind(w.document);
            w.document.write=function(html){ return ow(addPrintStampToHtml(html)); };
          }
        }catch(e){}
        return w;
      };
      try{ return old.apply(this,arguments); }
      finally{ setTimeout(function(){ window.open=originalOpen; },0); }
    };
    wrapped.__v459Wrapped=true;
    window[name]=wrapped;
  }
  function installPrintWrappers(){
    ['vardoPrintCurrentDocument','printEntryOrder','printEntryInvoice','printEntryDeposit','printEntryDeliveryNote','emailEntryOrder','whatsappEntryOrder'].forEach(wrapPrintable);
  }
  function boot(){ ensureStamp(); installPrintWrappers(); }
  document.addEventListener('DOMContentLoaded',boot);
  window.addEventListener('load',boot);
  document.addEventListener('click',function(){ setTimeout(boot,20); setTimeout(boot,140); setTimeout(boot,420); },true);
  document.addEventListener('change',function(){ setTimeout(boot,40); },true);
  document.addEventListener('input',function(){ setTimeout(boot,80); },true);
  setInterval(function(){ try{boot();}catch(e){} },500);
})();
