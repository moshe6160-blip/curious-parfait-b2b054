(function(){
  'use strict';
  const VERSION = 'V399_PROCESS_FLOW_FIX_FULL';

  function norm(v){ return String(v == null ? '' : v).trim().toLowerCase(); }
  function clean(v){ return String(v == null ? '' : v).trim(); }
  function kind(row){ try{ return typeof window.displayEntryKind === 'function' ? window.displayEntryKind(row) : ''; }catch(e){ return ''; } }
  function hasDN(row){ try{ return typeof window.extractDeliveryNoteNo === 'function' && !!window.extractDeliveryNoteNo(row); }catch(e){ return false; } }
  function hasInvoice(row){ return !!clean(row && row.invoice_no); }
  function hasOrder(row){ return !!clean(row && row.order_no); }
  function isSupplierOrderRow(row){
    const k = kind(row);
    return hasOrder(row) && !hasInvoice(row) && !hasDN(row) && k !== 'credit_note' && k !== 'deposit';
  }
  function isSent(row){
    const s = norm(row && row.status);
    return s.includes('sent') || s.includes('נשלח') || s.includes('sent to supplier') || s === 'order sent';
  }
  function isApprovedOnly(row){
    const s = norm(row && row.status);
    return !isSent(row) && (s.includes('approved') || s.includes('מאושר') || s === 'app order' || s === 'approved order');
  }
  function isPending(row){ return isSupplierOrderRow(row) && !isApprovedOnly(row) && !isSent(row); }

  function installProcessFlow(){
    const oldLabel = window.processStatusLabel;
    window.processStatusLabel = function(row){
      try{
        if(kind(row) === 'credit_note') return 'Credit Note';
        if(kind(row) === 'deposit') return 'Deposit';
        if(isSupplierOrderRow(row)){
          if(isSent(row)) return 'Order';
          if(isApprovedOnly(row)) return 'App order';
          return 'Pre-Order';
        }
      }catch(e){}
      return oldLabel ? oldLabel(row) : 'Pre-Order';
    };
    window.processStatusLabel.__v375 = true;
    window.processStatusLabel.__v398 = true;

    const oldClass = window.processStatusClass;
    window.processStatusClass = function(row){
      try{
        const label = window.processStatusLabel(row);
        if(label === 'Pre-Order') return 'unpaid preorder v375-preorder-badge';
        if(label === 'App order') return 'unpaid v398-app-order-badge v399-app-order-badge';
        if(label === 'Order') return 'unpaid v375-order-badge';
      }catch(e){}
      return oldClass ? oldClass(row) : 'unpaid';
    };
    window.processStatusClass.__v375 = true;
    window.processStatusClass.__v398 = true;
  }

  async function markCurrentEntrySentToSupplier(){
    try{
      const sel = document.getElementById('entryStatus');
      if(sel) sel.value = 'Sent';
      const modal = document.getElementById('entryModal');
      const id = modal?.dataset?.v375EntryId || modal?.getAttribute('data-v375-entry-id') || modal?.dataset?.entryId || '';
      if(id && (window.vpSupabase || window.supabase)){
        const sup = window.vpSupabase || window.supabase;
        await sup.from('suppliers').update({status:'Sent'}).eq('id', id);
      } else if(typeof window.saveEntry === 'function') {
        try{ await window.saveEntry(); }catch(e){}
      }
      if(typeof window.render === 'function') setTimeout(()=>window.render(), 350);
    }catch(e){ console.warn(VERSION, 'mark sent failed', e); }
  }

  function installSendHook(){
    if(window.__v398SendHookInstalled) return;
    window.__v398SendHookInstalled = true;
    document.addEventListener('click', function(e){
      const b = e.target && e.target.closest && e.target.closest('button');
      if(!b) return;
      const chooser = b.closest('#v370EmailChooser');
      if(!chooser) return;
      const txt = (b.textContent || '').trim().toLowerCase();
      const isSendAction = txt.includes('send rfq') || txt.includes('share pdf') || txt.includes('gmail') || txt.includes('default email') || txt.includes('outlook');
      const isNonSend = txt.includes('print') || txt.includes('reset') || txt.includes('change email');
      if(isSendAction && !isNonSend){
        setTimeout(markCurrentEntrySentToSupplier, 650);
      }
    }, true);
  }

  function goHomeFromReport(){
    try{
      if(typeof window.closeInlineReport === 'function') window.closeInlineReport();
      const modal = document.getElementById('inlineReportModal');
      if(modal) modal.classList.remove('show');
      if(window.uiState) window.uiState.tab = 'dashboard';
      if(typeof window.render === 'function') window.render();
      window.scrollTo({top:0, behavior:'smooth'});
    }catch(e){
      try{ history.back(); }catch(_e){}
    }
  }

  function makeMainLogoClickable(){
    document.querySelectorAll('.logo, .brand-logo, .brand-left .title, .brand-left').forEach(el=>{
      if(el.dataset.v398LogoClick === '1') return;
      el.dataset.v398LogoClick = '1';
      el.style.cursor = 'pointer';
      el.title = 'Back to dashboard';
      el.addEventListener('click', function(ev){
        if(ev.target && ev.target.closest && ev.target.closest('button')) return;
        goHomeFromReport();
      });
    });
  }

  function patchInlineReportLogo(){
    try{
      const frame = document.getElementById('inlineReportFrame');
      const doc = frame && (frame.contentDocument || frame.contentWindow?.document);
      if(!doc || doc.__v398LogoPatched) return;
      const targets = doc.querySelectorAll('.brand, .top img, img, .logo, header img, header .brand');
      targets.forEach(el=>{
        el.style.cursor = 'pointer';
        el.title = 'Back to dashboard';
        el.addEventListener('click', function(ev){
          ev.preventDefault();
          try{ window.goHomeFromReportV398(); }catch(e){}
        });
      });
      doc.__v398LogoPatched = true;
    }catch(e){}
  }

  function relabelVisibleBadges(){
    try{
      document.querySelectorAll('td .badge, .badge').forEach(b=>{
        const t = (b.textContent || '').trim();
        if(t === 'Approved' || t === 'App Order'){
          b.textContent = 'App order';
          b.classList.add('v398-app-order-badge','v399-app-order-badge');
        }
        if(t === 'Sent'){
          b.textContent = 'Order';
          b.classList.add('v375-order-badge');
        }
      });
    }catch(e){}
  }

  function installCss(){
    if(document.getElementById('v398-process-logo-style')) return;
    const style = document.createElement('style');
    style.id = 'v398-process-logo-style';
    style.textContent = `
      .v398-app-order-badge{background:#1e3558!important;color:#b9d8ff!important;border:1px solid rgba(185,216,255,.75)!important;}
      .logo[data-v398-logo-click="1"], .brand-logo[data-v398-logo-click="1"], .brand-left[data-v398-logo-click="1"]{cursor:pointer!important;}
    `;
    document.head.appendChild(style);
  }

  function boot(){
    installCss();
    installProcessFlow();
    installSendHook();
    makeMainLogoClickable();
    relabelVisibleBadges();
    patchInlineReportLogo();
  }

  window.goHomeFromReportV398 = goHomeFromReport;
  window.markCurrentEntrySentToSupplierV398 = markCurrentEntrySentToSupplier;

  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('load', boot);
  document.addEventListener('click', function(){ setTimeout(boot, 250); }, true);
  // V411: removed 700ms polling. Boot runs on load/click only.
  console.log(VERSION, 'loaded');
})();
