(function(){
  'use strict';
  if(window.__V432_STATUS_MEDAL_SAFE__) return;
  window.__V432_STATUS_MEDAL_SAFE__ = true;

  var currentRow = null;
  var currentId = null;
  var currentMode = '';

  function q(s,r){ return (r||document).querySelector(s); }
  function val(id){ var el=document.getElementById(id); return el ? el.value : ''; }
  function txt(el){ return String(el && el.textContent || '').replace(/\s+/g,' ').trim(); }
  function norm(v){ return String(v||'').trim().toLowerCase(); }

  function rowFromForm(){
    var base = currentRow ? Object.assign({}, currentRow) : {};
    base.supplier = val('entrySupplier') || base.supplier || '';
    base.project = val('entryProject') || base.project || '';
    base.order_no = val('entryOrderNo') || base.order_no || '';
    base.invoice_no = val('entryInvoiceNo') || base.invoice_no || '';
    base.status = val('entryStatus') || base.status || '';
    base.entry_type = val('entryMode') || val('entryType') || base.entry_type || currentMode || '';
    base.notes = val('entryNotes') || base.notes || '';
    return base;
  }

  function fallbackLabel(row){
    row = row || rowFromForm();
    var mode = norm(row.entry_type || currentMode);
    var s = norm(row.status);
    var hasOrder = !!String(row.order_no || '').trim();
    var hasInv = !!String(row.invoice_no || '').trim();
    if(mode.indexOf('delivery') >= 0) return 'Delivery Note';
    if(mode.indexOf('deposit') >= 0) return 'Deposit';
    if(mode.indexOf('credit') >= 0) return 'Credit Note';
    if(hasInv && mode !== 'order') return 'Invoice';
    if(hasOrder || mode === 'order'){
      if(s.indexOf('sent') >= 0 || s.indexOf('order sent') >= 0) return 'Order';
      if(s.indexOf('approved') >= 0 || s.indexOf('app order') >= 0 || s.indexOf('מאושר') >= 0) return 'App order';
      return 'Pre-Order';
    }
    return hasInv ? 'Invoice' : 'Pre-Order';
  }

  function labelFor(row){
    try{
      if(typeof window.processStatusLabel === 'function') return window.processStatusLabel(row || rowFromForm()) || fallbackLabel(row);
    }catch(e){}
    return fallbackLabel(row);
  }

  function classFor(label){
    var l = norm(label);
    if(l.indexOf('pre') >= 0) return 'v432-preorder';
    if(l.indexOf('app') >= 0) return 'v432-apporder';
    if(l === 'order' || l.indexOf(' order') >= 0) return 'v432-order';
    if(l.indexOf('delivery') >= 0) return 'v432-dn';
    if(l.indexOf('invoice') >= 0 || l.indexOf('done') >= 0) return 'v432-invoice';
    if(l.indexOf('deposit') >= 0) return 'v432-deposit';
    if(l.indexOf('credit') >= 0) return 'v432-credit';
    return 'v432-default';
  }

  function ensureStyle(){
    if(q('#v432StatusMedalStyle')) return;
    var st=document.createElement('style'); st.id='v432StatusMedalStyle';
    st.textContent = ''+
      '#entryModal .v432-status-wrap{width:100%;display:flex;justify-content:center;align-items:center;margin:10px 0 4px 0;clear:both;order:9999}' +
      '#entryModal .v432-status-medal{display:inline-flex;align-items:center;justify-content:center;min-width:132px;min-height:42px;padding:8px 22px;border-radius:999px;font:900 18px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;letter-spacing:.2px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.10),0 8px 20px rgba(0,0,0,.24);white-space:nowrap;direction:ltr}' +
      '#entryModal .v432-preorder{background:rgba(107,67,3,.88);color:#ffd993;border:2px solid rgba(255,217,147,.85)}' +
      '#entryModal .v432-apporder{background:rgba(31,65,111,.86);color:#bcd6ff;border:2px solid rgba(168,201,255,.88)}' +
      '#entryModal .v432-order{background:rgba(13,75,48,.88);color:#99e4ba;border:2px solid rgba(127,214,164,.88)}' +
      '#entryModal .v432-dn{background:rgba(73,57,22,.88);color:#ffe0a2;border:2px solid rgba(255,220,158,.85)}' +
      '#entryModal .v432-invoice{background:rgba(32,82,80,.88);color:#a7f0e9;border:2px solid rgba(160,235,226,.85)}' +
      '#entryModal .v432-deposit{background:rgba(70,50,87,.88);color:#e8ccff;border:2px solid rgba(226,197,255,.85)}' +
      '#entryModal .v432-credit{background:rgba(90,38,38,.88);color:#ffc1c1;border:2px solid rgba(255,183,183,.85)}' +
      '#entryModal .v432-default{background:rgba(30,30,34,.88);color:#f4d6a0;border:2px solid rgba(244,214,160,.75)}';
    document.head.appendChild(st);
  }

  function ensureMedal(){
    var modal = q('#entryModal');
    if(!modal || !modal.classList.contains('show')) return null;
    var actions = q('.modal-actions', modal) || q('.modal-footer', modal) || q('.window-actions', modal);
    if(!actions) return null;
    var wrap = q('.v432-status-wrap', modal);
    if(!wrap){
      wrap = document.createElement('div');
      wrap.className = 'v432-status-wrap';
      var medal = document.createElement('div');
      medal.className = 'v432-status-medal v432-default';
      medal.textContent = 'Status';
      wrap.appendChild(medal);
      actions.insertAdjacentElement('afterend', wrap);
    }
    return q('.v432-status-medal', wrap);
  }

  function updateMedal(){
    ensureStyle();
    var medal = ensureMedal();
    if(!medal) return;
    var row = rowFromForm();
    var label = labelFor(row);
    medal.textContent = label;
    medal.className = 'v432-status-medal ' + classFor(label);
  }

  async function loadRowForId(id){
    currentRow = null;
    currentId = id || null;
    if(!id || !window.supabase) return;
    try{
      var res = await window.supabase.from('suppliers').select('*').eq('id', id).single();
      if(res && !res.error && res.data) currentRow = res.data;
    }catch(e){}
  }

  function wrapOpen(){
    if(typeof window.openEntryModal !== 'function' || window.__v432OpenWrapped) return;
    window.__v432OpenWrapped = true;
    var oldOpen = window.openEntryModal;
    window.openEntryModal = async function(id, forcedMode){
      currentId = id || null;
      currentMode = forcedMode || '';
      var result = await oldOpen.apply(this, arguments);
      await loadRowForId(id);
      if(forcedMode) currentMode = forcedMode;
      setTimeout(updateMedal, 30);
      setTimeout(updateMedal, 250);
      return result;
    };
  }

  function boot(){ wrapOpen(); updateMedal(); }
  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('load', boot);
  document.addEventListener('input', function(e){ if(e.target && e.target.closest && e.target.closest('#entryModal')) setTimeout(updateMedal, 30); }, true);
  document.addEventListener('change', function(e){ if(e.target && e.target.closest && e.target.closest('#entryModal')) setTimeout(updateMedal, 30); }, true);
  document.addEventListener('click', function(e){ if(e.target && e.target.closest && e.target.closest('#entryModal')) { setTimeout(updateMedal, 120); setTimeout(updateMedal, 450); } }, true);
  setInterval(function(){ wrapOpen(); updateMedal(); }, 1000);
})();
