(function(){
  'use strict';
  if(window.__V442_REAL_DOCUMENT_MEDAL_FROM_DB__) return;
  window.__V442_REAL_DOCUMENT_MEDAL_FROM_DB__ = true;

  var currentRow = null;
  var currentId = null;
  var currentMode = '';

  function q(s,r){ return (r||document).querySelector(s); }
  function val(id){ var el=document.getElementById(id); return el ? String(el.value||'').trim() : ''; }
  function norm(v){ return String(v == null ? '' : v).trim().toLowerCase(); }
  function clean(v){ return String(v == null ? '' : v).trim(); }
  function db(){ return window.vpSupabase || window.supabase || null; }

  function removeOldWrongMedals(){
    document.querySelectorAll('.vp-status-medal-live,.v440-status-medal').forEach(function(el){
      try{ el.remove(); }catch(e){ el.style.display='none'; }
    });
  }

  function hasDeliveryNote(row){
    try{ if(typeof window.extractDeliveryNoteNo === 'function') return !!window.extractDeliveryNoteNo(row); }catch(e){}
    var n = norm((row && row.notes) || '');
    return n.indexOf('delivery note') >= 0 || n.indexOf('dn no') >= 0 || n.indexOf('[[dn') >= 0;
  }

  function isCredit(row){
    try{ if(typeof window.displayEntryKind === 'function' && window.displayEntryKind(row) === 'credit_note') return true; }catch(e){}
    return norm(row && row.entry_type).indexOf('credit') >= 0;
  }
  function isDeposit(row){
    try{ if(typeof window.displayEntryKind === 'function' && window.displayEntryKind(row) === 'deposit') return true; }catch(e){}
    return norm(row && row.entry_type).indexOf('deposit') >= 0;
  }

  function labelFromRow(row){
    row = row || {};
    var mode = norm(row.entry_type || currentMode || val('entryMode') || val('entryType'));
    var s = norm(row.status);
    var orderNo = clean(row.order_no || val('entryOrderNo'));
    var invNo = clean(row.invoice_no || val('entryInvoiceNo'));

    if(isCredit(row) || mode.indexOf('credit') >= 0) return 'Credit Note';
    if(isDeposit(row) || mode.indexOf('deposit') >= 0) return 'Deposit';
    if(mode.indexOf('delivery') >= 0 || hasDeliveryNote(row)) return 'Delivery Note';
    if(invNo && !orderNo) return 'Invoice';
    if(invNo && orderNo) return 'Invoice';

    if(orderNo || mode === 'order'){
      if(s.indexOf('sent') >= 0 || s.indexOf('order sent') >= 0 || s.indexOf('sent to supplier') >= 0 || s.indexOf('נשלח') >= 0) return 'Order';
      if(s.indexOf('approved') >= 0 || s.indexOf('app order') >= 0 || s.indexOf('מאושר') >= 0) return 'App Order';
      return 'Pre-Order';
    }

    if(s.indexOf('sent') >= 0) return 'Order';
    if(s.indexOf('approved') >= 0 || s.indexOf('app order') >= 0) return 'App Order';
    return invNo ? 'Invoice' : 'Pre-Order';
  }

  function classFor(label){
    var l = norm(label);
    if(l.indexOf('pre') >= 0) return 'v442-preorder';
    if(l.indexOf('app') >= 0) return 'v442-apporder';
    if(l === 'order') return 'v442-order';
    if(l.indexOf('delivery') >= 0) return 'v442-dn';
    if(l.indexOf('invoice') >= 0) return 'v442-invoice';
    if(l.indexOf('deposit') >= 0) return 'v442-deposit';
    if(l.indexOf('credit') >= 0) return 'v442-credit';
    return 'v442-default';
  }

  function ensureStyle(){
    if(q('#v442MedalStyle')) return;
    var st=document.createElement('style');
    st.id='v442MedalStyle';
    st.textContent = ''+
      '.vp-status-medal-live,.v440-status-medal{display:none!important}' +
      '#entryModal .v432-status-wrap{width:100%!important;display:flex!important;justify-content:center!important;align-items:center!important;margin:10px 0 4px 0!important;clear:both!important;order:9999!important}' +
      '#entryModal .v432-status-medal{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:132px!important;min-height:42px!important;padding:8px 22px!important;border-radius:999px!important;font:900 18px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important;letter-spacing:.2px!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.10),0 8px 20px rgba(0,0,0,.24)!important;white-space:nowrap!important;direction:ltr!important}' +
      '#entryModal .v442-preorder{background:rgba(107,67,3,.88)!important;color:#ffd993!important;border:2px solid rgba(255,217,147,.85)!important}' +
      '#entryModal .v442-apporder{background:rgba(31,65,111,.86)!important;color:#bcd6ff!important;border:2px solid rgba(168,201,255,.88)!important}' +
      '#entryModal .v442-order{background:rgba(13,75,48,.88)!important;color:#99e4ba!important;border:2px solid rgba(127,214,164,.88)!important}' +
      '#entryModal .v442-dn{background:rgba(73,57,22,.88)!important;color:#ffe0a2!important;border:2px solid rgba(255,220,158,.85)!important}' +
      '#entryModal .v442-invoice{background:rgba(32,82,80,.88)!important;color:#a7f0e9!important;border:2px solid rgba(160,235,226,.85)!important}' +
      '#entryModal .v442-deposit{background:rgba(70,50,87,.88)!important;color:#e8ccff!important;border:2px solid rgba(226,197,255,.85)!important}' +
      '#entryModal .v442-credit{background:rgba(90,38,38,.88)!important;color:#ffc1c1!important;border:2px solid rgba(255,183,183,.85)!important}' +
      '#entryModal .v442-default{background:rgba(30,30,34,.88)!important;color:#f4d6a0!important;border:2px solid rgba(244,214,160,.75)!important}';
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
      medal.className = 'v432-status-medal v442-default';
      medal.textContent = 'Status';
      wrap.appendChild(medal);
      actions.insertAdjacentElement('afterend', wrap);
    }
    return q('.v432-status-medal', wrap);
  }

  function rowFromFormFallback(){
    return {
      supplier: val('entrySupplier'),
      project: val('entryProject'),
      order_no: val('entryOrderNo'),
      invoice_no: val('entryInvoiceNo'),
      status: val('entryStatus'),
      entry_type: val('entryMode') || val('entryType'),
      notes: val('entryNotes')
    };
  }

  function renderMedal(){
    ensureStyle();
    removeOldWrongMedals();
    var medal = ensureMedal();
    if(!medal) return;
    var row = currentRow || rowFromFormFallback();
    var label = labelFromRow(row);
    medal.textContent = label;
    medal.className = 'v432-status-medal ' + classFor(label);
  }

  async function fetchRow(id){
    currentId = id || null;
    if(!id) { currentRow = null; return null; }
    var sup = db();
    if(!sup) return null;
    try{
      var res = await sup.from('suppliers').select('*').eq('id', id).single();
      if(res && !res.error && res.data){ currentRow = res.data; return res.data; }
    }catch(e){}
    return null;
  }

  function installOpenPatch(){
    if(typeof window.openEntryModal !== 'function' || window.__v442OpenEntryModalPatched) return;
    window.__v442OpenEntryModalPatched = true;
    var oldOpen = window.openEntryModal;
    window.openEntryModal = async function(id, forcedMode){
      currentId = id || null;
      currentMode = forcedMode || '';
      currentRow = null;
      var pre = id ? fetchRow(id) : Promise.resolve(null);
      var result = await oldOpen.apply(this, arguments);
      var modal = q('#entryModal');
      if(modal && id){
        modal.dataset.v442EntryId = String(id);
        modal.dataset.entryId = String(id);
      }
      await pre;
      await fetchRow(id);
      if(forcedMode) currentMode = forcedMode;
      renderMedal();
      setTimeout(renderMedal, 80);
      setTimeout(renderMedal, 300);
      setTimeout(renderMedal, 900);
      return result;
    };
  }

  function inferIdFromModal(){
    var modal = q('#entryModal');
    return modal && (modal.dataset.v442EntryId || modal.dataset.entryId || modal.dataset.v375EntryId || modal.getAttribute('data-v375-entry-id')) || currentId;
  }

  async function keepSynced(){
    installOpenPatch();
    var id = inferIdFromModal();
    if(id && String(id) !== String(currentId || '')) await fetchRow(id);
    renderMedal();
  }

  document.addEventListener('DOMContentLoaded', keepSynced);
  window.addEventListener('load', keepSynced);
  document.addEventListener('input', function(e){ if(e.target && e.target.closest && e.target.closest('#entryModal')) setTimeout(renderMedal, 40); }, true);
  document.addEventListener('change', function(e){ if(e.target && e.target.closest && e.target.closest('#entryModal')) setTimeout(renderMedal, 40); }, true);
  document.addEventListener('click', function(){ setTimeout(keepSynced, 120); setTimeout(keepSynced, 500); }, true);
  setInterval(keepSynced, 900);
})();
