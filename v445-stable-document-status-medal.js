(function(){
  'use strict';
  if(window.__V445_STABLE_DOCUMENT_STATUS_MEDAL__) return;
  window.__V445_STABLE_DOCUMENT_STATUS_MEDAL__ = true;

  var openedLabelById = {};
  var currentId = '';
  var lockedLabel = '';
  var dbRow = null;

  function q(s,r){ return (r||document).querySelector(s); }
  function qa(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }
  function txt(x){ return String((x && (x.textContent || x.innerText)) || '').replace(/\s+/g,' ').trim(); }
  function norm(v){ return String(v||'').trim().toLowerCase(); }
  function val(id){ var el=document.getElementById(id); return el ? el.value : ''; }
  function has(v){ return String(v||'').trim().length > 0; }

  function readLabelFromClickedRow(row){
    if(!row) return '';
    var badges = qa('.badge,.chip,span,b,td,div', row).map(txt).filter(Boolean);
    var joined = badges.join(' | ').toLowerCase();
    if(joined.indexOf('credit note') >= 0) return 'Credit Note';
    if(joined.indexOf('delivery note') >= 0) return 'Delivery Note';
    if(joined.indexOf('invoice') >= 0) return 'Invoice';
    if(joined.indexOf('deposit') >= 0) return 'Deposit';
    if(joined.indexOf('app order') >= 0 || joined.indexOf('approved') >= 0) return 'App order';
    if(joined.indexOf('pre-order') >= 0 || joined.indexOf('pre order') >= 0 || joined.indexOf('pending approval') >= 0) return 'Pre-Order';
    // Important: only plain Order if App Order was not present.
    if(joined.indexOf('order') >= 0) return 'Order';
    return '';
  }

  document.addEventListener('click', function(e){
    var row = e.target && e.target.closest && e.target.closest('tr,[onclick*="openEntryModal"]');
    if(!row) return;
    var oc = row.getAttribute('onclick') || '';
    var m = oc.match(/openEntryModal\(['"]([^'"]+)['"]/);
    if(m && m[1]){
      var lab = readLabelFromClickedRow(row);
      if(lab) openedLabelById[m[1]] = lab;
    }
  }, true);

  function entryModeFromRow(row){
    var k = norm(row && (row.entry_type || row.type || row.kind || row.mode));
    if(k.indexOf('delivery') >= 0 || k === 'dn') return 'delivery_note';
    if(k.indexOf('deposit') >= 0) return 'deposit';
    if(k.indexOf('credit') >= 0) return 'credit_note';
    if(k.indexOf('order') >= 0) return 'order';
    if(k.indexOf('invoice') >= 0) return 'invoice';
    return '';
  }

  function computeLabel(row){
    row = row || {};
    var mode = entryModeFromRow(row) || norm(val('entryMode') || val('entryType'));
    var status = norm(row.status || val('entryStatus'));
    var orderNo = row.order_no != null ? row.order_no : val('entryOrderNo');
    var invoiceNo = row.invoice_no != null ? row.invoice_no : val('entryInvoiceNo');
    var notes = norm(row.notes || val('entryNotes'));

    if(mode.indexOf('credit') >= 0) return 'Credit Note';
    if(mode.indexOf('deposit') >= 0) return 'Deposit';
    if(mode.indexOf('delivery') >= 0) return 'Delivery Note';

    var hasOrder = has(orderNo);
    var hasInvoice = has(invoiceNo);
    var sent = status.indexOf('sent') >= 0 || status.indexOf('נשלח') >= 0 || notes.indexOf('order sent') >= 0;
    var approved = status.indexOf('approved') >= 0 || status.indexOf('app order') >= 0 || status.indexOf('מאושר') >= 0 || notes.indexOf('app order') >= 0 || notes.indexOf('approved') >= 0;

    if(hasOrder && !hasInvoice){
      if(sent) return 'Order';
      if(approved) return 'App order';
      return 'Pre-Order';
    }
    if(hasOrder && hasInvoice) return 'Invoice';
    if(hasInvoice) return 'Invoice';
    return approved ? 'App order' : 'Pre-Order';
  }

  function currentFormRow(){
    return {
      entry_type: val('entryMode') || val('entryType'),
      status: val('entryStatus'),
      order_no: val('entryOrderNo'),
      invoice_no: val('entryInvoiceNo'),
      notes: val('entryNotes')
    };
  }

  function ensureStyle(){
    if(q('#v445StableMedalStyle')) return;
    var st = document.createElement('style');
    st.id = 'v445StableMedalStyle';
    st.textContent = [
      '#entryModal .v432-status-wrap,#entryModal .vp-status-medal-live,#entryModal .v440-status-medal{display:none!important;visibility:hidden!important}',
      '#entryModal .v445-status-wrap{width:100%;display:flex;justify-content:center;align-items:center;margin:10px 0 4px 0;clear:both;order:99999}',
      '#entryModal .v445-status-medal{display:inline-flex;align-items:center;justify-content:center;min-width:106px;min-height:34px;padding:6px 18px;border-radius:999px;font:900 16px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;letter-spacing:.15px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.10),0 8px 20px rgba(0,0,0,.24);white-space:nowrap;direction:ltr}',
      '#entryModal .v445-preorder{background:rgba(107,67,3,.92);color:#ffd993;border:2px solid rgba(255,217,147,.88)}',
      '#entryModal .v445-apporder{background:rgba(31,65,111,.92);color:#bcd6ff;border:2px solid rgba(168,201,255,.9)}',
      '#entryModal .v445-order{background:rgba(13,75,48,.92);color:#99e4ba;border:2px solid rgba(127,214,164,.9)}',
      '#entryModal .v445-dn{background:rgba(73,57,22,.92);color:#ffe0a2;border:2px solid rgba(255,220,158,.88)}',
      '#entryModal .v445-invoice{background:rgba(32,82,80,.92);color:#a7f0e9;border:2px solid rgba(160,235,226,.88)}',
      '#entryModal .v445-deposit{background:rgba(70,50,87,.92);color:#e8ccff;border:2px solid rgba(226,197,255,.88)}',
      '#entryModal .v445-credit{background:rgba(90,38,38,.92);color:#ffc1c1;border:2px solid rgba(255,183,183,.88)}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function cls(label){
    var l = norm(label);
    if(l.indexOf('pre') >= 0) return 'v445-preorder';
    if(l.indexOf('app') >= 0) return 'v445-apporder';
    if(l === 'order') return 'v445-order';
    if(l.indexOf('delivery') >= 0) return 'v445-dn';
    if(l.indexOf('invoice') >= 0 || l.indexOf('done') >= 0) return 'v445-invoice';
    if(l.indexOf('deposit') >= 0) return 'v445-deposit';
    if(l.indexOf('credit') >= 0) return 'v445-credit';
    return 'v445-preorder';
  }

  function ensureMedal(){
    var modal = q('#entryModal');
    if(!modal || !modal.classList.contains('show')) return null;
    var actions = q('.modal-actions', modal) || q('.modal-footer', modal) || q('.window-actions', modal);
    if(!actions) return null;
    var wrap = q('.v445-status-wrap', modal);
    if(!wrap){
      wrap = document.createElement('div');
      wrap.className = 'v445-status-wrap';
      var medal = document.createElement('div');
      medal.className = 'v445-status-medal v445-preorder';
      medal.textContent = 'Pre-Order';
      wrap.appendChild(medal);
      actions.insertAdjacentElement('afterend', wrap);
    }
    return q('.v445-status-medal', wrap);
  }

  function authoritativeLabel(){
    // While viewing an existing document, do not let periodic form refreshes force it back to Pre-Order.
    if(currentId && lockedLabel) return lockedLabel;
    return computeLabel(currentFormRow());
  }

  function renderMedal(){
    ensureStyle();
    var medal = ensureMedal();
    if(!medal) return;
    var label = authoritativeLabel();
    medal.textContent = label;
    medal.className = 'v445-status-medal ' + cls(label);
  }

  async function fetchDbRow(id){
    dbRow = null;
    if(!id || !(window.vpSupabase || window.supabase)) return null;
    try{
      var sup = window.vpSupabase || window.supabase;
      var res = await sup.from('suppliers').select('*').eq('id', id).single();
      if(res && !res.error && res.data){ dbRow = res.data; return dbRow; }
    }catch(e){}
    return null;
  }

  function lockLabelForOpen(id, row){
    currentId = id || '';
    dbRow = row || dbRow;
    var clicked = id ? openedLabelById[id] : '';
    var fromDb = row ? computeLabel(row) : '';
    // The list status is the user's visible source when opening from Home lists.
    lockedLabel = clicked || fromDb || computeLabel(currentFormRow());
    renderMedal();
  }

  function wrapOpen(){
    if(typeof window.openEntryModal !== 'function' || window.openEntryModal.__v445StableMedal) return;
    var oldOpen = window.openEntryModal;
    window.openEntryModal = async function(id, forcedMode){
      currentId = id || '';
      lockedLabel = id && openedLabelById[id] ? openedLabelById[id] : '';
      dbRow = null;
      var result = await oldOpen.apply(this, arguments);
      renderMedal();
      if(id){
        var row = await fetchDbRow(id);
        lockLabelForOpen(id, row);
      }else{
        currentId = '';
        lockedLabel = computeLabel(currentFormRow());
        renderMedal();
      }
      setTimeout(renderMedal, 60);
      setTimeout(renderMedal, 260);
      setTimeout(renderMedal, 700);
      return result;
    };
    window.openEntryModal.__v445StableMedal = true;
  }

  function closeWatcher(){
    var modal = q('#entryModal');
    if(!modal || !modal.classList.contains('show')){ currentId=''; lockedLabel=''; dbRow=null; }
  }

  document.addEventListener('change', function(e){
    if(e.target && e.target.id === 'entryStatus'){
      var live = computeLabel(Object.assign({}, dbRow || {}, {status:e.target.value}));
      lockedLabel = live;
      renderMedal();
    }
  }, true);

  document.addEventListener('input', function(e){
    if(e.target && e.target.closest && e.target.closest('#entryModal') && !currentId){ setTimeout(renderMedal, 30); }
  }, true);

  var mo = new MutationObserver(function(){ wrapOpen(); closeWatcher(); renderMedal(); });
  function boot(){ ensureStyle(); wrapOpen(); renderMedal(); try{ mo.observe(document.body,{childList:true,subtree:true,attributes:true}); }catch(e){} }
  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('load', boot);
  setInterval(function(){ wrapOpen(); closeWatcher(); renderMedal(); }, 600);
})();
