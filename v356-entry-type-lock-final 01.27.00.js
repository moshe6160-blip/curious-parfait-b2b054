(function(){
  'use strict';
  if(window.__v356EntryTypeLockFinal) return;
  window.__v356EntryTypeLockFinal = true;

  function $(id){ return document.getElementById(id); }
  function txt(sel, value){ var el = document.querySelector(sel); if(el) el.textContent = value; }
  function setVal(id, value){ var el=$(id); if(el) el.value = value == null ? '' : String(value); }
  function getVal(id){ return String($(id)?.value || '').trim(); }
  function lower(v){ return String(v||'').trim().toLowerCase(); }
  function has(v){ return String(v||'').trim().length > 0; }
  function norm(v){
    v = lower(v).replace(/\s+/g,'_').replace(/-/g,'_');
    if(v === 'dn' || v === 'deliverynote' || v === 'delivery_note') return 'delivery_note';
    if(v === 'po' || v === 'purchase_order' || v === 'purchaseorder' || v === 'order') return 'order';
    if(v === 'inv' || v === 'invoice') return 'invoice';
    if(v === 'dep' || v === 'advance' || v === 'deposit') return 'deposit';
    return v;
  }
  function extractDN(row){
    if(!row) return '';
    var direct = String(row.delivery_note_no || row.dn_no || row.delivery_no || '').trim();
    if(direct) return direct;
    var notes = String(row.notes || '');
    var m = notes.match(/\[\[DN:([^\]]+)\]\]/i) || notes.match(/\[\[DNNO:([^\]]+)\]\]/i) || notes.match(/Delivery\s*Note\s*:?\s*([^\n\]]+)/i) || notes.match(/\bDN-?\d+\b/i);
    return m ? String(m[1] || m[0] || '').trim() : '';
  }
  function deriveFromRow(row, forced){
    var f = norm(forced);
    if(['order','invoice','delivery_note','deposit'].includes(f)) return f;
    var type = norm(row && (row.entry_type || row.type || row.kind || row.entry_kind));
    var mode = norm(row && (row.entry_mode || row.mode));
    if(type === 'deposit' || mode === 'deposit') return 'deposit';
    if(type === 'delivery_note' || mode === 'delivery_note') return 'delivery_note';
    // Real fields override stale entry_type.
    if(has(row && row.invoice_no)) return 'invoice';
    if(extractDN(row)) return 'delivery_note';
    if(has(row && row.order_no)) return 'order';
    if(type === 'order' || mode === 'order') return 'order';
    if(type === 'invoice' || mode === 'invoice') return 'invoice';
    return f || 'invoice';
  }
  function titleFor(kind, editing){
    if(kind === 'order') return editing ? 'Edit Order' : 'New Order';
    if(kind === 'invoice') return editing ? 'Edit Invoice' : 'New Invoice';
    if(kind === 'delivery_note') return editing ? 'Edit Delivery Note' : 'New Delivery Note';
    if(kind === 'deposit') return editing ? 'Edit Deposit / Advance' : 'New Deposit / Advance';
    return editing ? 'Edit Entry' : 'New Entry';
  }
  function labelFor(kind){
    if(kind === 'order') return 'Order';
    if(kind === 'invoice') return 'Invoice';
    if(kind === 'delivery_note') return 'Delivery Note';
    if(kind === 'deposit') return 'Deposit';
    return 'Entry';
  }
  async function rowById(id){
    if(!id) return null;
    var client = window.vpSupabase || window.supabase;
    if(!client) return null;
    try{
      var res = await client.from('suppliers').select('*').eq('id', id).single();
      if(res && !res.error && res.data) return res.data;
    }catch(e){}
    return null;
  }
  function ensureEntryTypeOption(kind){
    var sel = $('entryType');
    if(!sel) return;
    if(!Array.from(sel.options).some(function(o){ return o.value === kind; })){
      var opt = document.createElement('option');
      opt.value = kind; opt.textContent = labelFor(kind);
      sel.appendChild(opt);
    }
    sel.value = kind;
  }
  function setFieldLabels(kind){
    var orderWrap = $('entryOrderWrap');
    var invoiceWrap = $('entryInvoiceWrap');
    var typeWrap = $('entryTypeWrap');
    var orderLabel = $('entryOrderLabel') || document.querySelector('#entryOrderWrap span, #entryOrderWrap label');
    var invoiceLabel = $('entryInvoiceLabel') || document.querySelector('#entryInvoiceWrap span, #entryInvoiceWrap label');
    if(kind === 'order'){
      if(orderWrap) orderWrap.style.display = '';
      if(invoiceWrap) invoiceWrap.style.display = 'none';
      if(typeWrap) typeWrap.style.display = 'none';
      if(orderLabel) orderLabel.textContent = 'Order No';
    } else if(kind === 'invoice'){
      if(orderWrap) orderWrap.style.display = '';
      if(invoiceWrap) invoiceWrap.style.display = '';
      if(typeWrap) typeWrap.style.display = 'none';
      if(orderLabel) orderLabel.textContent = 'Order No';
      if(invoiceLabel) invoiceLabel.textContent = 'Invoice No';
    } else if(kind === 'delivery_note'){
      if(orderWrap) orderWrap.style.display = '';
      if(invoiceWrap) invoiceWrap.style.display = '';
      if(typeWrap) typeWrap.style.display = 'none';
      if(orderLabel) orderLabel.textContent = 'Order No';
      if(invoiceLabel) invoiceLabel.textContent = 'Delivery Note No';
    } else if(kind === 'deposit'){
      if(orderWrap) orderWrap.style.display = '';
      if(invoiceWrap) invoiceWrap.style.display = 'none';
      if(typeWrap) typeWrap.style.display = 'none';
      if(orderLabel) orderLabel.textContent = 'Deposit No';
    }
  }
  function applyKind(kind, editing, row){
    kind = norm(kind) || 'invoice';
    var modal = $('entryModal');
    window.__vardoActiveEntryKind = kind;
    window.__v356ActiveEntryKind = kind;
    if(modal){ modal.dataset.entryKind = kind; modal.dataset.entryType = kind; }
    setVal('entryMode', kind);
    ensureEntryTypeOption(kind);
    txt('#entryModalTitle', titleFor(kind, editing));
    var sub = $('entryModalSub');
    if(sub){
      sub.textContent = kind === 'order' ? 'Supplier purchase order.' :
        kind === 'invoice' ? 'Supplier invoice document.' :
        kind === 'delivery_note' ? 'Delivery note / supplied goods record.' :
        kind === 'deposit' ? 'Supplier deposit / advance payment.' : '';
    }
    setFieldLabels(kind);
    if(kind === 'delivery_note'){
      var dn = extractDN(row) || getVal('entryInvoiceNo');
      if(dn) setVal('entryInvoiceNo', dn);
    }
  }
  function activeKind(){
    var modal = $('entryModal');
    var mKind = norm(modal && (modal.dataset.entryKind || modal.dataset.entryType));
    if(['order','invoice','delivery_note','deposit'].includes(mKind)) return mKind;
    var winKind = norm(window.__v356ActiveEntryKind || window.__vardoActiveEntryKind);
    if(['order','invoice','delivery_note','deposit'].includes(winKind)) return winKind;
    var mode = norm(getVal('entryMode'));
    if(['order','invoice','delivery_note','deposit'].includes(mode)) return mode;
    var title = lower(document.querySelector('#entryModalTitle, #entryModal h3, .modal h3')?.textContent || '');
    if(/delivery note/.test(title)) return 'delivery_note';
    if(/deposit|advance/.test(title)) return 'deposit';
    if(/invoice/.test(title)) return 'invoice';
    if(/order/.test(title)) return 'order';
    return 'order';
  }

  var previousOpen = window.openEntryModal;
  if(typeof previousOpen === 'function'){
    var finalOpen = async function(id, forcedMode){
      var forcedKind = norm(forcedMode);
      var rowPromise = rowById(id);
      var result = await previousOpen.apply(this, arguments);
      var row = await rowPromise;
      var kind = deriveFromRow(row || {}, forcedKind);
      // If this is an explicit delivery note open, make sure legacy DN setup runs once.
      if(kind === 'delivery_note' && typeof window.prepareDeliveryNoteMode === 'function'){
        try{ window.prepareDeliveryNoteMode(); }catch(e){}
      }
      applyKind(kind, !!id, row);
      [0,50,150,350,750,1500].forEach(function(ms){ setTimeout(function(){ applyKind(kind, !!id, row); }, ms); });
      return result;
    };
    finalOpen.__v356FinalOpen = true;
    window.openEntryModal = finalOpen;
  }

  // Explicit action entry points must pass the real type. This fixes the top action buttons.
  window.openOrderEntryModal = function(){ return window.openEntryModal(null, 'order'); };
  window.openInvoiceEntryModal = function(){ return window.openEntryModal(null, 'invoice'); };
  window.openDepositEntryModal = function(){ return window.openEntryModal(null, 'deposit'); };
  window.openDeliveryNoteEntryModal = function(){ return window.openEntryModal(null, 'delivery_note'); };
  window.openDeliveryNoteModal = function(){ return window.openEntryModal(null, 'delivery_note'); };

  // If older scripts keep changing the title back, lock it while modal is open.
  setInterval(function(){
    var modal = $('entryModal');
    if(!modal || !modal.classList.contains('show')) return;
    var k = activeKind();
    applyKind(k, !!(window.editingId || false));
  }, 180);

  // Final print router: every print/share uses activeKind first, not stale invoice/order fallback.
  function routePrint(kind){
    kind = norm(kind) || activeKind();
    applyKind(kind, !!(window.editingId || false));
    if(kind === 'delivery_note' && typeof window.printEntryDeliveryNote === 'function') return window.printEntryDeliveryNote();
    if(kind === 'invoice' && typeof window.printEntryInvoice === 'function') return window.printEntryInvoice();
    if(kind === 'deposit' && typeof window.printEntryDeposit === 'function') return window.printEntryDeposit();
    if(typeof window.__v356OriginalPrintOrder === 'function') return window.__v356OriginalPrintOrder();
    if(typeof window.vardoPrintCurrentDocument === 'function') return window.vardoPrintCurrentDocument();
  }
  window.__v356OriginalPrintOrder = window.__v356OriginalPrintOrder || window.printEntryOrder;
  var printFn = function(){ return routePrint(activeKind()); };
  printFn.__v354Print = true;
  printFn.__v356Print = true;
  window.printEntryOrder = printFn;
  window.vardoPrintCurrentDocument = printFn;

  // Reinstall because older scripts also run intervals.
  setInterval(function(){
    if(window.printEntryOrder !== printFn){ window.printEntryOrder = printFn; }
    if(window.vardoPrintCurrentDocument !== printFn){ window.vardoPrintCurrentDocument = printFn; }
  }, 250);

  window.v356EntryKindDebug = {activeKind:activeKind, applyKind:applyKind, extractDN:extractDN, deriveFromRow:deriveFromRow};
})();
