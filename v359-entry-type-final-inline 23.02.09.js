/* V359 - real final entry type control
   This is loaded LAST. It does not touch login/save calculations.
   It only controls modal mode/title/labels and print routing. */
(function(){
  'use strict';
  if(window.__V359_ENTRY_TYPE_FINAL__) return;
  window.__V359_ENTRY_TYPE_FINAL__ = true;

  var active = { type:'', id:null, row:null, editing:false, forced:false };
  function $(id){ return document.getElementById(id); }
  function val(id,v){ var el=$(id); if(el) el.value = v == null ? '' : String(v); }
  function show(id,on){ var el=$(id); if(el) el.style.display = on ? '' : 'none'; }
  function txt(id,s){ var el=$(id); if(el) el.textContent = s; }
  function lower(v){ return String(v||'').trim().toLowerCase(); }
  function cleanType(v){
    var s = lower(v).replace(/[\s-]+/g,'_');
    if(!s) return '';
    if(['dn','delivery','deliverynote','delivery_note','delivery_notes'].includes(s)) return 'delivery_note';
    if(['order','orders','po','purchase_order','purchaseorder','purchase'].includes(s)) return 'order';
    if(['invoice','invoices','inv'].includes(s)) return 'invoice';
    if(['deposit','deposits','dep','advance','advance_payment','supplier_credit'].includes(s)) return 'deposit';
    return '';
  }
  function noteTag(notes, tag){
    var m = String(notes||'').match(new RegExp('\\[\\['+tag+':([\\s\\S]*?)\\]\\]','i'));
    return m ? String(m[1]||'').trim() : '';
  }
  function getDN(row){
    row = row || {};
    var direct = String(row.delivery_note_no || row.dn_no || row.delivery_no || '').trim();
    if(direct) return direct;
    var inv = String(row.invoice_no || '').trim();
    if(/^DN[-\s]?\d+/i.test(inv)) return inv;
    var notes = String(row.notes || '');
    return noteTag(notes,'DN') || noteTag(notes,'DNNO') || ((notes.match(/\bDN[-\s]?\d+\b/i)||[])[0]||'');
  }
  function isDeposit(row){
    row = row || {};
    var t = cleanType(row.entry_type || row.type || row.kind || row.mode || '');
    var order = String(row.order_no || row.reference || '').trim();
    var desc = lower(row.description || '');
    var notes = lower(row.notes || '');
    return t === 'deposit' || /^DEP-/i.test(order) || desc.indexOf('deposit') >= 0 || desc.indexOf('advance') >= 0 || notes.indexOf('[[dep') >= 0;
  }
  function decideType(row, forced){
    var f = cleanType(forced);
    if(f) return f;
    row = row || {};
    var t = cleanType(row.entry_type || row.type || row.kind || row.entry_kind || row.entry_mode || row.mode || '');
    if(isDeposit(row)) return 'deposit';
    if(t === 'delivery_note') return 'delivery_note';
    // Data fallback for rows stored as order but carrying DN. DN must win over Order.
    if(getDN(row)) return 'delivery_note';
    if(t === 'invoice') return 'invoice';
    if(t === 'order') return 'order';
    var inv = String(row.invoice_no || '').trim();
    if(inv && !/^DN[-\s]?\d+/i.test(inv)) return 'invoice';
    if(String(row.order_no || row.reference || '').trim()) return 'order';
    return 'invoice';
  }
  async function fetchRow(id){
    if(!id || !window.supabase) return null;
    try{
      var res = await window.supabase.from('suppliers').select('*').eq('id', id).single();
      return res && !res.error ? res.data : null;
    }catch(e){ return null; }
  }
  function title(type, editing){
    if(type === 'order') return editing ? 'Edit Order' : 'New Order';
    if(type === 'invoice') return editing ? 'Edit Invoice' : 'New Invoice';
    if(type === 'delivery_note') return editing ? 'Edit Delivery Note' : 'New Delivery Note';
    if(type === 'deposit') return editing ? 'Edit Deposit / Advance' : 'New Deposit / Advance';
    return editing ? 'Edit Entry' : 'New Entry';
  }
  function subtitle(type){
    if(type === 'order') return 'Supplier purchase order.';
    if(type === 'invoice') return 'Supplier invoice document.';
    if(type === 'delivery_note') return 'Delivery note / supplied goods record.';
    if(type === 'deposit') return 'Supplier deposit / advance payment.';
    return '';
  }
  function applyType(type, editing, row){
    type = cleanType(type) || active.type || 'invoice';
    active.type = type; active.editing = !!editing; active.row = row || active.row;
    window.__VARDOPHASE_ACTIVE_ENTRY_TYPE = type;
    window.__VARDOPHASE_LOCKED_ENTRY_TYPE = type;
    window.currentEntryType = type;
    var modal = $('entryModal');
    if(modal){ modal.dataset.entryType = type; modal.dataset.lockedType = type; modal.dataset.entryKind = type; }
    val('entryMode', type);
    txt('entryModalTitle', title(type, !!editing));
    txt('entryModalSub', subtitle(type));

    var orderLabel = $('entryOrderLabel') || document.querySelector('#entryOrderWrap span');
    var invLabel = $('entryInvoiceLabel') || document.querySelector('#entryInvoiceWrap span');
    show('entryTypeWrap', false);
    if(type === 'order'){
      show('entryOrderWrap', true); show('entryInvoiceWrap', false);
      if(orderLabel) orderLabel.textContent = 'Order No';
    }else if(type === 'invoice'){
      show('entryOrderWrap', true); show('entryInvoiceWrap', true);
      if(orderLabel) orderLabel.textContent = 'Order No / PO';
      if(invLabel) invLabel.textContent = 'Invoice No';
      var inv=$('entryInvoiceNo'); if(inv){ inv.placeholder='Invoice No'; inv.readOnly=false; inv.title=''; }
    }else if(type === 'delivery_note'){
      show('entryOrderWrap', true); show('entryInvoiceWrap', true);
      if(orderLabel) orderLabel.textContent = 'Order No / PO';
      if(invLabel) invLabel.textContent = 'Delivery Note No';
      var dn=$('entryInvoiceNo');
      if(dn){ dn.placeholder='DN-001'; dn.readOnly=false; dn.title='Delivery Note No'; var dnNo=getDN(row||active.row); if(dnNo) dn.value=dnNo; }
    }else if(type === 'deposit'){
      show('entryOrderWrap', true); show('entryInvoiceWrap', false);
      if(orderLabel) orderLabel.textContent = 'Deposit No';
      var typeSel=$('entryType'); if(typeSel) typeSel.value='deposit';
    }
    // Keep the real document type available for save/report/print.
    var sel = $('entryType');
    if(sel){
      if(type === 'deposit') sel.value = 'deposit';
      else if(type === 'delivery_note') sel.value = 'delivery_note';
      else if(type === 'order') sel.value = 'order';
      else sel.value = 'invoice';
    }
  }
  function scheduleLock(type, editing, row){
    [0,20,60,120,250,500,900,1500,2500].forEach(function(ms){ setTimeout(function(){ applyType(type, editing, row); }, ms); });
  }

  var baseOpen = window.openEntryModal;
  if(typeof baseOpen === 'function'){
    window.openEntryModal = async function(id, forcedMode){
      id = id == null ? null : id;
      var row = id ? await fetchRow(id) : null;
      var type = decideType(row, forcedMode);
      active = { type:type, id:id, row:row, editing:!!id, forced:!!forcedMode };
      var result = await baseOpen.call(this, id, type);
      // For new DN, call existing preparation if available, but relock after it runs.
      if(type === 'delivery_note' && !id && typeof window.prepareDeliveryNoteMode === 'function'){
        try{ window.prepareDeliveryNoteMode(); }catch(e){}
      }
      applyType(type, !!id, row);
      scheduleLock(type, !!id, row);
      return result;
    };
  }

  window.openOrderModal = async function(){ return window.openEntryModal(null, 'order'); };
  window.openInvoiceModal = async function(){ return window.openEntryModal(null, 'invoice'); };
  window.openDepositModal = async function(){ return window.openEntryModal(null, 'deposit'); };
  window.openDeliveryNoteModal = async function(){ return window.openEntryModal(null, 'delivery_note'); };

  var baseClose = window.closeEntryModal;
  window.closeEntryModal = function(){
    active = {type:'', id:null, row:null, editing:false, forced:false};
    window.__VARDOPHASE_ACTIVE_ENTRY_TYPE = '';
    return typeof baseClose === 'function' ? baseClose.apply(this, arguments) : ($('entryModal') && $('entryModal').classList.remove('show'));
  };

  function getActiveType(){
    var modal = $('entryModal');
    return cleanType(active.type || window.__VARDOPHASE_ACTIVE_ENTRY_TYPE || (modal && modal.dataset.lockedType) || $('entryMode')?.value || '');
  }
  function printDocument(){
    var t = getActiveType() || 'order';
    applyType(t, active.editing, active.row);
    if(t === 'invoice' && typeof window.__v349PrintInvoice === 'function') return window.__v349PrintInvoice();
    if(t === 'delivery_note' && typeof window.__v349PrintDN === 'function') return window.__v349PrintDN();
    if(t === 'deposit' && typeof window.__v349PrintDeposit === 'function') return window.__v349PrintDeposit();
    if(t === 'order' && typeof window.__v349PrintOrder === 'function') return window.__v349PrintOrder();
    // Fallback to existing print function, after locking type.
    if(typeof window.vardoPrintCurrentDocument === 'function' && window.vardoPrintCurrentDocument !== printDocument) return window.vardoPrintCurrentDocument();
  }
  // Preserve V349 print functions if they exist now.
  if(typeof window.printEntryOrder === 'function') window.__v349PrintOrder = window.printEntryOrder;
  if(typeof window.printEntryInvoice === 'function') window.__v349PrintInvoice = window.printEntryInvoice;
  if(typeof window.printEntryDeliveryNote === 'function') window.__v349PrintDN = window.printEntryDeliveryNote;
  if(typeof window.printEntryDeposit === 'function') window.__v349PrintDeposit = window.printEntryDeposit;
  window.vardoPrintCurrentDocument = printDocument;
  window.printEntryOrder = function(){ applyType('order', active.editing, active.row); return (window.__v349PrintOrder || printDocument)(); };
  window.printEntryInvoice = function(){ applyType('invoice', active.editing, active.row); return (window.__v349PrintInvoice || printDocument)(); };
  window.printEntryDeliveryNote = function(){ applyType('delivery_note', active.editing, active.row); return (window.__v349PrintDN || printDocument)(); };
  window.printEntryDeposit = function(){ applyType('deposit', active.editing, active.row); return (window.__v349PrintDeposit || printDocument)(); };

  // Catch any print/share buttons in the entry modal that still point to old function.
  document.addEventListener('click', function(e){
    var b = e.target && e.target.closest ? e.target.closest('button') : null;
    if(!b) return;
    var label = String(b.textContent || '').trim().toLowerCase();
    if(label === 'print' && $('entryModal')?.classList.contains('show')){
      e.preventDefault(); e.stopPropagation(); printDocument();
    }
  }, true);

  setInterval(function(){
    var modal = $('entryModal');
    if(modal && modal.classList.contains('show') && active.type) applyType(active.type, active.editing, active.row);
  }, 250);
})();
