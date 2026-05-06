(function(){
  'use strict';
  if(window.__V432_STATUS_MEDAL_SAFE__) return;
  window.__V432_STATUS_MEDAL_SAFE__ = true;

  var currentRow = null;
  var currentId = null;
  var currentMode = '';
  var lockedLabel = '';
  var clickedLabelById = {};

  function q(s,r){ return (r||document).querySelector(s); }
  function qa(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }
  function val(id){ var el=document.getElementById(id); return el ? el.value : ''; }
  function txt(el){ return String(el && (el.textContent || el.innerText) || '').replace(/\s+/g,' ').trim(); }
  function norm(v){ return String(v||'').trim().toLowerCase(); }

  function labelFromVisibleListRow(row){
    if(!row) return '';
    var joined = qa('.badge,.chip,span,b,td,div', row).map(txt).filter(Boolean).join(' | ').toLowerCase();
    if(joined.indexOf('credit note') >= 0) return 'Credit Note';
    if(joined.indexOf('delivery note') >= 0) return 'Delivery Note';
    if(joined.indexOf('invoice') >= 0 || joined.indexOf('done') >= 0) return 'Invoice';
    if(joined.indexOf('deposit') >= 0) return 'Deposit';
    if(joined.indexOf('app order') >= 0 || joined.indexOf('approved') >= 0) return 'App order';
    if(joined.indexOf('pre-order') >= 0 || joined.indexOf('pre order') >= 0 || joined.indexOf('pending approval') >= 0) return 'Pre-Order';
    if(joined.indexOf('order') >= 0) return 'Order';
    return '';
  }

  document.addEventListener('click', function(e){
    var row = e.target && e.target.closest && e.target.closest('tr,[onclick*="openEntryModal"]');
    if(!row) return;
    var oc = row.getAttribute('onclick') || '';
    var m = oc.match(/openEntryModal\(['"]([^'"]+)['"]/);
    if(m && m[1]){
      var lab = labelFromVisibleListRow(row);
      if(lab) clickedLabelById[m[1]] = lab;
    }
  }, true);

  function rowFromForm(){
    var base = currentRow ? Object.assign({}, currentRow) : {};
    // Existing document: DB/current row is authoritative. Form fields are only fallback.
    base.supplier = base.supplier || val('entrySupplier') || '';
    base.project = base.project || val('entryProject') || '';
    base.order_no = base.order_no || val('entryOrderNo') || '';
    base.invoice_no = base.invoice_no || val('entryInvoiceNo') || '';
    base.status = base.status || val('entryStatus') || '';
    base.entry_type = base.entry_type || val('entryMode') || val('entryType') || currentMode || '';
    base.notes = base.notes || val('entryNotes') || '';
    return base;
  }

  function kind(row){
    var k = norm((row && (row.entry_type || row.type || row.kind || row.mode)) || currentMode);
    if(k.indexOf('delivery') >= 0 || k === 'dn') return 'delivery_note';
    if(k.indexOf('deposit') >= 0) return 'deposit';
    if(k.indexOf('credit') >= 0) return 'credit_note';
    if(k.indexOf('invoice') >= 0) return 'invoice';
    if(k.indexOf('order') >= 0) return 'order';
    return k;
  }

  function fallbackLabel(row){
    row = row || rowFromForm();
    var mode = kind(row);
    var s = norm(row.status);
    var notes = norm(row.notes);
    var hasOrder = !!String(row.order_no || '').trim();
    var hasInv = !!String(row.invoice_no || '').trim();

    if(mode === 'delivery_note') return 'Delivery Note';
    if(mode === 'deposit') return 'Deposit';
    if(mode === 'credit_note') return 'Credit Note';
    if(hasInv && mode !== 'order') return 'Invoice';

    var sent = s.indexOf('sent') >= 0 || s.indexOf('order sent') >= 0 || s.indexOf('נשלח') >= 0 || notes.indexOf('order sent') >= 0;
    var approved = s.indexOf('approved') >= 0 || s.indexOf('app order') >= 0 || s.indexOf('מאושר') >= 0 || notes.indexOf('app order') >= 0 || notes.indexOf('approved') >= 0;

    if(hasOrder || mode === 'order'){
      if(sent) return 'Order';
      if(approved) return 'App order';
      return 'Pre-Order';
    }
    return approved ? 'App order' : (hasInv ? 'Invoice' : 'Pre-Order');
  }

  function classFor(label){
    var l = norm(label);
    if(l.indexOf('pre') >= 0) return 'v432-preorder';
    if(l.indexOf('app') >= 0) return 'v432-apporder';
    if(l === 'order') return 'v432-order';
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
      '#entryModal .vp-status-medal-live,#entryModal .v440-status-medal{display:none!important;visibility:hidden!important}' +
      '#entryModal .v432-status-wrap{width:100%;display:flex;justify-content:center;align-items:center;margin:10px 0 4px 0;clear:both;order:9999}' +
      '#entryModal .v432-status-medal{display:inline-flex;align-items:center;justify-content:center;min-width:106px;min-height:34px;padding:6px 18px;border-radius:999px;font:900 16px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;letter-spacing:.15px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.10),0 8px 20px rgba(0,0,0,.24);white-space:nowrap;direction:ltr}' +
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

  function activeLabel(){
    if(currentId && lockedLabel) return lockedLabel;
    return fallbackLabel(rowFromForm());
  }

  function updateMedal(){
    ensureStyle();
    var medal = ensureMedal();
    if(!medal) return;
    var label = activeLabel();
    medal.textContent = label;
    medal.className = 'v432-status-medal ' + classFor(label);
  }

  async function loadRowForId(id){
    currentRow = null;
    currentId = id || null;
    if(id && clickedLabelById[id]) lockedLabel = clickedLabelById[id];
    if(!id || !(window.vpSupabase || window.supabase)) return;
    try{
      var sup = window.vpSupabase || window.supabase;
      var res = await sup.from('suppliers').select('*').eq('id', id).single();
      if(res && !res.error && res.data){
        currentRow = res.data;
        lockedLabel = fallbackLabel(currentRow);
      }
    }catch(e){}
  }

  function wrapOpen(){
    if(typeof window.openEntryModal !== 'function' || window.__v432OpenWrapped) return;
    window.__v432OpenWrapped = true;
    var oldOpen = window.openEntryModal;
    window.openEntryModal = async function(id, forcedMode){
      currentId = id || null;
      currentMode = forcedMode || '';
      currentRow = null;
      lockedLabel = id && clickedLabelById[id] ? clickedLabelById[id] : '';
      var result = await oldOpen.apply(this, arguments);
      updateMedal();
      await loadRowForId(id);
      if(forcedMode) currentMode = forcedMode;
      updateMedal();
      setTimeout(updateMedal, 80);
      setTimeout(updateMedal, 300);
      return result;
    };
  }

  function resetIfClosed(){
    var modal = q('#entryModal');
    if(!modal || !modal.classList.contains('show')){ currentId=null; currentRow=null; lockedLabel=''; currentMode=''; }
  }

  function boot(){ ensureStyle(); wrapOpen(); updateMedal(); }
  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('load', boot);
  document.addEventListener('change', function(e){
    if(e.target && e.target.id === 'entryStatus'){
      var r = Object.assign({}, currentRow || rowFromForm(), {status:e.target.value});
      lockedLabel = fallbackLabel(r);
    }
    if(e.target && e.target.closest && e.target.closest('#entryModal')) setTimeout(updateMedal, 30);
  }, true);
  document.addEventListener('input', function(e){ if(e.target && e.target.closest && e.target.closest('#entryModal') && !currentId) setTimeout(updateMedal, 30); }, true);
  document.addEventListener('click', function(e){ if(e.target && e.target.closest && e.target.closest('#entryModal')) { setTimeout(updateMedal, 120); } }, true);
  setInterval(function(){ wrapOpen(); resetIfClosed(); updateMedal(); }, 1000);
})();
