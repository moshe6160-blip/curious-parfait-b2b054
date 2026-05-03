/* V362 - clean hard lock for Entry modal type/title/number labels.
   Additive only: no login/save/calculation changes. Loaded last. */
(function(){
  'use strict';
  if(window.__V362_ENTRY_TYPE_HARD_LOCK__) return;
  window.__V362_ENTRY_TYPE_HARD_LOCK__ = true;

  var state = { kind:'', id:null, row:null, edit:false, lastClickKind:'' };
  function $(id){ return document.getElementById(id); }
  function norm(v){
    var s = String(v||'').trim().toLowerCase().replace(/[\s-]+/g,'_');
    if(!s) return '';
    if(['order','orders','po','purchase','purchase_order','purchaseorder'].indexOf(s)>=0) return 'order';
    if(['invoice','invoices','inv'].indexOf(s)>=0) return 'invoice';
    if(['dn','delivery','delivery_note','deliverynote','delivery_notes','dm'].indexOf(s)>=0) return 'delivery_note';
    if(['deposit','deposits','dep','advance','advance_payment','supplier_credit'].indexOf(s)>=0) return 'deposit';
    return '';
  }
  function tag(notes, name){
    var m = String(notes||'').match(new RegExp('\\[\\['+name+':([\\s\\S]*?)\\]\\]','i'));
    return m ? String(m[1]||'').trim() : '';
  }
  function getDN(row){
    row=row||{};
    var direct = String(row.delivery_note_no || row.dn_no || row.delivery_no || '').trim();
    if(direct) return direct;
    var inv = String(row.invoice_no || '').trim();
    if(/^DN[-\s]?\d+/i.test(inv)) return inv;
    var notes = String(row.notes || '');
    return tag(notes,'DN') || tag(notes,'DNNO') || tag(notes,'DELIVERYNOTE') || ((notes.match(/\bDN[-\s]?\d+\b/i)||[])[0] || '');
  }
  function isDeposit(row){
    row=row||{};
    var t = norm(row.entry_type || row.type || row.kind || row.mode || '');
    var ref = String(row.order_no || row.reference || row.deposit_no || '').trim();
    var desc = String(row.description || '').toLowerCase();
    var notes = String(row.notes || '').toLowerCase();
    return t === 'deposit' || /^DEP-/i.test(ref) || desc.indexOf('deposit')>=0 || desc.indexOf('advance')>=0 || notes.indexOf('[[dep')>=0;
  }
  function decide(row, forced){
    var f = norm(forced); if(f) return f;
    row=row||{};
    if(isDeposit(row)) return 'deposit';
    var t = norm(row.__forcedKind || row.entry_kind || row.entry_type || row.type || row.kind || row.mode || '');
    var inv = String(row.invoice_no || '').trim();
    // A real invoice number must win over DN tags from the linked order.
    if(t === 'invoice' || (inv && !/^DN[-\s]?\d+/i.test(inv))) return 'invoice';
    if(t === 'delivery_note' || /^DN[-\s]?\d+/i.test(inv) || getDN(row)) return 'delivery_note';
    if(t === 'order' || String(row.order_no || row.reference || '').trim()) return 'order';
    return 'order';
  }
  async function fetchRow(id){
    if(!id || !window.supabase) return null;
    try{
      var r = await window.supabase.from('suppliers').select('*').eq('id', id).single();
      return r && !r.error ? r.data : null;
    }catch(e){ return null; }
  }
  function title(kind, edit){
    var m = {
      order: edit ? 'Edit Order' : 'New Order',
      invoice: edit ? 'Edit Invoice' : 'New Invoice',
      delivery_note: edit ? 'Edit Delivery Note' : 'New Delivery Note',
      deposit: edit ? 'Edit Deposit / Advance' : 'New Deposit / Advance'
    };
    return m[kind] || (edit ? 'Edit Entry' : 'New Entry');
  }
  function sub(kind){
    if(kind === 'order') return 'Supplier purchase order.';
    if(kind === 'invoice') return 'Supplier invoice document.';
    if(kind === 'delivery_note') return 'Delivery note / supplied goods record.';
    if(kind === 'deposit') return 'Supplier deposit / advance payment.';
    return '';
  }
  function setDisplay(id, on){ var x=$(id); if(x) x.style.display = on ? '' : 'none'; }
  function setText(elOrId, txt){ var x=typeof elOrId==='string'?$(elOrId):elOrId; if(x && x.textContent !== txt) x.textContent = txt; }
  function setVal(id, val){ var x=$(id); if(x && x.value !== String(val||'')) x.value = String(val||''); }
  function lock(kind, edit, row){
    kind = norm(kind) || state.kind || 'order';
    state.kind=kind; state.edit=!!edit; if(row) state.row=row;
    window.__VP_ENTRY_KIND_LOCK = kind;
    window.__VARDOPHASE_ACTIVE_ENTRY_TYPE = kind;
    window.ACTIVE_ENTRY_TYPE = kind;
    var modal=$('entryModal');
    if(modal){
      modal.dataset.entryKind=kind; modal.dataset.lockedType=kind; modal.dataset.entryType=kind;
    }
    setVal('entryMode', kind);
    setText('entryModalTitle', title(kind, !!edit));
    setText('entryModalSub', sub(kind));

    var orderLabel = $('entryOrderLabel') || document.querySelector('#entryOrderWrap span');
    var invoiceLabel = $('entryInvoiceLabel') || document.querySelector('#entryInvoiceWrap span');
    var inv = $('entryInvoiceNo');
    var ord = $('entryOrderNo');
    var typeSel = $('entryType');

    setDisplay('entryTypeWrap', false);
    if(kind === 'order'){
      setDisplay('entryOrderWrap', true); setDisplay('entryInvoiceWrap', false);
      if(orderLabel) setText(orderLabel, 'Order No');
      if(ord && !ord.value && !edit && typeof window.nextOrderNo === 'function') { try{ window.nextOrderNo().then(function(no){ if(state.kind==='order' && !ord.value) ord.value=no; }); }catch(e){} }
    }else if(kind === 'invoice'){
      setDisplay('entryOrderWrap', true); setDisplay('entryInvoiceWrap', true);
      if(orderLabel) setText(orderLabel, 'Order No / PO');
      if(invoiceLabel) setText(invoiceLabel, 'Invoice No');
      if(inv){ inv.placeholder='Invoice No'; inv.title='Invoice No'; inv.readOnly=false; inv.style.opacity=''; }
      if(typeSel) typeSel.value='invoice';
    }else if(kind === 'delivery_note'){
      setDisplay('entryOrderWrap', true); setDisplay('entryInvoiceWrap', true);
      if(orderLabel) setText(orderLabel, 'Order No / PO');
      if(invoiceLabel) setText(invoiceLabel, 'DN No');
      if(inv){
        inv.placeholder='DN-0001'; inv.title='Delivery Note No'; inv.readOnly=false; inv.style.opacity='';
        var d = getDN(row || state.row || {}); if(d && inv.value !== d) inv.value = d;
      }
      if(typeSel) typeSel.value='invoice';
    }else if(kind === 'deposit'){
      setDisplay('entryOrderWrap', true); setDisplay('entryInvoiceWrap', false);
      if(orderLabel) setText(orderLabel, 'Deposit No');
      if(typeSel) typeSel.value='deposit';
    }
  }
  function pulse(kind, edit, row){
    [0,20,60,120,250,500,900,1400,2200,3500].forEach(function(ms){ setTimeout(function(){ lock(kind, edit, row); }, ms); });
  }

  var previousOpen = window.openEntryModal;
  if(typeof previousOpen === 'function'){
    window.openEntryModal = async function(id, forcedMode){
      id = (id == null || id === '') ? null : id;
      var row = id ? await fetchRow(id) : null;
      var kind = decide(row, forcedMode || state.lastClickKind || '');
      state = { kind:kind, id:id, row:row, edit:!!id, lastClickKind:'' };
      window.__VP_ENTRY_KIND_LOCK = kind;
      var result = await previousOpen.call(this, id, kind);
      lock(kind, !!id, row);
      pulse(kind, !!id, row);
      return result;
    };
  }

  window.openOrderModal = function(){ state.lastClickKind='order'; return window.openEntryModal(null, 'order'); };
  window.openInvoiceModal = function(){ state.lastClickKind='invoice'; return window.openEntryModal(null, 'invoice'); };
  window.openDeliveryNoteModal = function(){ state.lastClickKind='delivery_note'; return window.openEntryModal(null, 'delivery_note'); };
  window.openDepositModal = function(){ state.lastClickKind='deposit'; return window.openEntryModal(null, 'deposit'); };

  function getActiveKind(){
    var modal=$('entryModal');
    return norm(state.kind || window.__VP_ENTRY_KIND_LOCK || window.ACTIVE_ENTRY_TYPE || (modal && (modal.dataset.entryKind||modal.dataset.lockedType)) || $('entryMode')?.value || 'order');
  }
  var oldPrint = window.vardoPrintCurrentDocument;
  window.vardoPrintCurrentDocument = function(){
    var k = getActiveKind(); lock(k, state.edit, state.row);
    if(k === 'invoice' && typeof window.__v349PrintInvoice === 'function') return window.__v349PrintInvoice();
    if(k === 'delivery_note' && typeof window.__v349PrintDN === 'function') return window.__v349PrintDN();
    if(k === 'deposit' && typeof window.__v349PrintDeposit === 'function') return window.__v349PrintDeposit();
    if(k === 'order' && typeof window.__v349PrintOrder === 'function') return window.__v349PrintOrder();
    if(typeof oldPrint === 'function' && oldPrint !== window.vardoPrintCurrentDocument) return oldPrint.apply(this, arguments);
  };

  document.addEventListener('click', function(ev){
    var b = ev.target && ev.target.closest ? ev.target.closest('button') : null;
    if(!b) return;
    var txt = String(b.textContent || '').trim().toLowerCase();
    var oc = String(b.getAttribute('onclick') || '').toLowerCase();
    var k = '';
    if(txt === 'order' || oc.indexOf('openordermodal')>=0 || oc.indexOf("openentrymodal(null, 'order")>=0 || oc.indexOf('openentrymodal(null,"order')>=0) k='order';
    else if(txt === 'invoice' || oc.indexOf('openinvoicemodal')>=0 || oc.indexOf("openentrymodal(null, 'invoice")>=0 || oc.indexOf('openentrymodal(null,"invoice')>=0) k='invoice';
    else if(txt === 'delivery note' || oc.indexOf('opendeliverynotemodal')>=0 || oc.indexOf('delivery_note')>=0) k='delivery_note';
    else if(txt === 'add deposit' || txt === 'deposit' || oc.indexOf('opendepositmodal')>=0 || oc.indexOf("openentrymodal(null, 'deposit")>=0 || oc.indexOf('openentrymodal(null,"deposit')>=0) k='deposit';
    if(k){ state.lastClickKind=k; setTimeout(function(){ pulse(k, false, null); }, 0); }
    if(txt === 'print' && $('entryModal') && $('entryModal').classList.contains('show')){
      ev.preventDefault(); ev.stopPropagation(); window.vardoPrintCurrentDocument();
    }
  }, true);

  // Continuous guard only while the modal is open. This stops legacy scripts from reverting the title/labels.
  setInterval(function(){
    var modal=$('entryModal');
    if(!modal || !modal.classList.contains('show')) return;
    var k=getActiveKind();
    lock(k, state.edit, state.row);
  }, 250);
})();
