(function(){
  'use strict';
  if(window.__v354EntryKindAndPrintFinal) return;
  window.__v354EntryKindAndPrintFinal = true;

  function $(id){ return document.getElementById(id); }
  function val(id){ return String($(id)?.value || '').trim(); }
  function setVal(id, value){ var el=$(id); if(el) el.value = value == null ? '' : String(value); }
  function text(sel, value){ var el=document.querySelector(sel); if(el) el.textContent = value; }
  function lower(v){ return String(v||'').trim().toLowerCase(); }
  function has(v){ return String(v||'').trim().length > 0; }

  function ensureEntryTypeOption(kind){
    var sel = $('entryType');
    if(!sel) return;
    var label = kind === 'order' ? 'Order' : kind === 'delivery_note' ? 'Delivery Note' : kind === 'deposit' ? 'Deposit' : 'Invoice';
    if(!Array.from(sel.options).some(function(o){ return o.value === kind; })){
      var opt = document.createElement('option');
      opt.value = kind;
      opt.textContent = label;
      sel.appendChild(opt);
    }
    sel.value = kind;
  }

  function extractDN(row){
    var n = String(row?.delivery_note_no || row?.dn_no || '').trim();
    if(n) return n;
    var notes = String(row?.notes || '');
    var m = notes.match(/\[\[DN:([^\]]+)\]\]/i) || notes.match(/\[\[DNNO:([^\]]+)\]\]/i) || notes.match(/Delivery Note\s*:?\s*([^\n\]]+)/i) || notes.match(/\bDN-?\d+\b/i);
    return m ? String(m[1] || m[0] || '').trim() : '';
  }

  function deriveKind(row, forced){
    var f = lower(forced);
    if(f === 'dn') f = 'delivery_note';
    if(['order','invoice','delivery_note','deposit'].includes(f)) return f;
    var type = lower(row?.entry_type || row?.type || '');
    var mode = lower(row?.entry_mode || row?.mode || '');
    if(mode === 'dn') mode = 'delivery_note';
    if(type === 'dn') type = 'delivery_note';
    if(type === 'deposit' || mode === 'deposit') return 'deposit';
    if(type === 'delivery_note' || mode === 'delivery_note') return 'delivery_note';
    // Real document fields override a wrong/stale entry_type.
    if(has(row?.invoice_no)) return 'invoice';
    if(extractDN(row)) return 'delivery_note';
    if(has(row?.order_no)) return 'order';
    if(type === 'invoice' || mode === 'invoice') return 'invoice';
    return 'invoice';
  }

  function kindTitle(kind, editing){
    if(kind === 'order') return editing ? 'Edit Order' : 'New Order';
    if(kind === 'invoice') return editing ? 'Edit Invoice' : 'New Invoice';
    if(kind === 'delivery_note') return editing ? 'Edit Delivery Note' : 'New Delivery Note';
    if(kind === 'deposit') return editing ? 'Edit Deposit / Advance' : 'New Deposit / Advance';
    return editing ? 'Edit Entry' : 'New Entry';
  }

  function applyKind(kind, editing){
    window.__vardoActiveEntryKind = kind;
    setVal('entryMode', kind);
    ensureEntryTypeOption(kind);
    text('#entryModalTitle', kindTitle(kind, editing));

    var sub = $('entryModalSub');
    if(sub){
      sub.textContent = kind === 'order' ? 'Supplier purchase order.' :
        kind === 'invoice' ? 'Supplier invoice document.' :
        kind === 'delivery_note' ? 'Delivery note / supplied goods record.' :
        kind === 'deposit' ? 'Supplier deposit / advance payment.' : '';
    }

    var invoiceWrap = $('entryInvoiceWrap');
    var orderWrap = $('entryOrderWrap');
    var typeWrap = $('entryTypeWrap');
    var orderLabel = $('entryOrderLabel');
    var invoiceLabel = $('entryInvoiceLabel');

    if(kind === 'order'){
      if(orderWrap) orderWrap.style.display = '';
      if(invoiceWrap) invoiceWrap.style.display = 'none';
      if(typeWrap) typeWrap.style.display = 'none';
      if(orderLabel) orderLabel.textContent = 'Order No';
    } else if(kind === 'invoice'){
      if(orderWrap) orderWrap.style.display = '';
      if(invoiceWrap) invoiceWrap.style.display = '';
      if(typeWrap) typeWrap.style.display = 'none';
      if(orderLabel) orderLabel.textContent = 'Order No / PO';
      if(invoiceLabel) invoiceLabel.textContent = 'Invoice No';
    } else if(kind === 'delivery_note'){
      if(orderWrap) orderWrap.style.display = '';
      if(invoiceWrap) invoiceWrap.style.display = '';
      if(typeWrap) typeWrap.style.display = 'none';
      if(orderLabel) orderLabel.textContent = 'Order No / PO';
      if(invoiceLabel) invoiceLabel.textContent = 'Delivery Note No';
    } else if(kind === 'deposit'){
      if(orderWrap) orderWrap.style.display = '';
      if(invoiceWrap) invoiceWrap.style.display = 'none';
      if(typeWrap) typeWrap.style.display = 'none';
      if(orderLabel) orderLabel.textContent = 'Deposit No';
    }
  }

  async function rowById(id){
    if(!id || !window.supabase) return null;
    try{
      var res = await window.supabase.from('suppliers').select('*').eq('id', id).single();
      return res && !res.error ? res.data : null;
    }catch(e){ return null; }
  }

  var originalOpen = window.openEntryModal;
  if(typeof originalOpen === 'function' && !originalOpen.__v354Wrapped){
    var wrapped = async function(id, forcedMode){
      var result = await originalOpen.apply(this, arguments);
      var row = await rowById(id);
      var kind = deriveKind(row || {}, forcedMode);
      applyKind(kind, !!id);
      // Keep a reliable source of truth for print/share, even if older scripts later touch entryType.
      setTimeout(function(){ applyKind(kind, !!id); }, 0);
      setTimeout(function(){ applyKind(kind, !!id); }, 250);
      return result;
    };
    wrapped.__v354Wrapped = true;
    window.openEntryModal = wrapped;
  }

  // Make the explicit buttons reliable even if older functions call openEntryModal without a proper type.
  window.openOrderEntryModal = function(){ return window.openEntryModal(null, 'order'); };
  window.openInvoiceEntryModal = function(){ return window.openEntryModal(null, 'invoice'); };
  window.openDepositEntryModal = function(){ return window.openEntryModal(null, 'deposit'); };
  window.openDeliveryNoteEntryModal = function(){ return window.openEntryModal(null, 'delivery_note'); };

  function currentKind(){
    var active = lower(window.__vardoActiveEntryKind);
    if(['order','invoice','delivery_note','deposit'].includes(active)) return active;
    var title = lower(document.querySelector('#entryModalTitle, #entryModal h3, .modal h3')?.textContent || '');
    if(/delivery note/.test(title)) return 'delivery_note';
    if(/deposit|advance/.test(title)) return 'deposit';
    if(/invoice/.test(title)) return 'invoice';
    if(/order/.test(title)) return 'order';
    var mode = lower(val('entryMode'));
    if(mode === 'dn') mode = 'delivery_note';
    if(['order','invoice','delivery_note','deposit'].includes(mode)) return mode;
    return 'order';
  }

  function forceKindBeforePrint(kind){
    applyKind(kind || currentKind(), !!(window.editingId || false));
  }

  // Do not let old routers decide from stale entryType=invoice. Force the active modal kind first.
  var oldPrintEntryOrder = window.printEntryOrder;
  window.printEntryOrder = function(){
    var k = currentKind();
    forceKindBeforePrint(k);
    if(k === 'invoice' && typeof window.printEntryInvoice === 'function') return window.printEntryInvoice();
    if(k === 'delivery_note' && typeof window.printEntryDeliveryNote === 'function') return window.printEntryDeliveryNote();
    if(k === 'deposit' && typeof window.printEntryDeposit === 'function') return window.printEntryDeposit();
    return oldPrintEntryOrder ? oldPrintEntryOrder.apply(this, arguments) : (window.vardoPrintCurrentDocument && window.vardoPrintCurrentDocument());
  };

  function reinstall(){
    // If another script re-overrides printEntryOrder, restore ours.
    if(window.printEntryOrder && !window.printEntryOrder.__v354Print){
      var prior = window.printEntryOrder;
      var fn = function(){
        var k = currentKind();
        forceKindBeforePrint(k);
        if(k === 'invoice' && typeof window.printEntryInvoice === 'function') return window.printEntryInvoice();
        if(k === 'delivery_note' && typeof window.printEntryDeliveryNote === 'function') return window.printEntryDeliveryNote();
        if(k === 'deposit' && typeof window.printEntryDeposit === 'function') return window.printEntryDeposit();
        return prior.apply(this, arguments);
      };
      fn.__v354Print = true;
      window.printEntryOrder = fn;
    }
  }
  reinstall();
  setInterval(function(){
    reinstall();
    var modal = $('entryModal');
    if(modal && modal.classList.contains('show')){
      var k = currentKind();
      if(k) applyKind(k, !!(window.editingId || false));
    }
  }, 500);
})();
