/* V361 - stable entry type router
   Fixes only modal titles/labels and print routing by document kind.
   No login/save/calculation logic is changed. */
(function(){
  'use strict';
  if(window.__V361_ENTRY_TYPE_ROUTER_STABLE__) return;
  window.__V361_ENTRY_TYPE_ROUTER_STABLE__ = true;

  var active = { kind:'', id:null, row:null, editing:false };
  function el(id){ return document.getElementById(id); }
  function setText(id, txt){ var x=el(id); if(x) x.textContent = txt; }
  function setVal(id, v){ var x=el(id); if(x) x.value = (v == null ? '' : String(v)); }
  function show(id, on){ var x=el(id); if(x) x.style.display = on ? '' : 'none'; }
  function norm(v){
    var s = String(v||'').trim().toLowerCase().replace(/[\s-]+/g,'_');
    if(!s) return '';
    if(['order','orders','po','purchase','purchase_order','purchaseorder'].indexOf(s)>=0) return 'order';
    if(['invoice','invoices','inv'].indexOf(s)>=0) return 'invoice';
    if(['dn','delivery','delivery_note','deliverynote','delivery_notes'].indexOf(s)>=0) return 'delivery_note';
    if(['deposit','deposits','dep','advance','advance_payment','supplier_credit'].indexOf(s)>=0) return 'deposit';
    return '';
  }
  function tag(notes, name){
    var m = String(notes||'').match(new RegExp('\\[\\['+name+':([\\s\\S]*?)\\]\\]','i'));
    return m ? String(m[1]||'').trim() : '';
  }
  function dnNo(row){
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
    var ref = String(row.order_no || row.reference || '').trim();
    var desc = String(row.description || '').toLowerCase();
    var notes = String(row.notes || '').toLowerCase();
    return t === 'deposit' || /^DEP-/i.test(ref) || desc.indexOf('deposit')>=0 || desc.indexOf('advance')>=0 || notes.indexOf('deposit')>=0 || notes.indexOf('[[dep')>=0;
  }
  function decideKind(row, forced){
    var f = norm(forced); if(f) return f;
    row = row || {};
    var t = norm(row.__forcedKind || row.entry_kind || row.entry_type || row.type || row.kind || row.mode || '');
    if(isDeposit(row)) return 'deposit';
    // Important: real invoice must win over DN tags on the same order chain.
    var inv = String(row.invoice_no || '').trim();
    if(t === 'invoice' || (inv && !/^DN[-\s]?\d+/i.test(inv))) return 'invoice';
    if(t === 'delivery_note' || dnNo(row)) return 'delivery_note';
    if(t === 'order' || String(row.order_no || row.reference || '').trim()) return 'order';
    return 'order';
  }
  function title(kind, editing){
    var map = {
      order: editing ? 'Edit Order' : 'New Order',
      invoice: editing ? 'Edit Invoice' : 'New Invoice',
      delivery_note: editing ? 'Edit Delivery Note' : 'New Delivery Note',
      deposit: editing ? 'Edit Deposit / Advance' : 'New Deposit / Advance'
    };
    return map[kind] || (editing ? 'Edit Entry' : 'New Entry');
  }
  function subtitle(kind){
    if(kind === 'order') return 'Supplier purchase order.';
    if(kind === 'invoice') return 'Supplier invoice document.';
    if(kind === 'delivery_note') return 'Delivery note / supplied goods record.';
    if(kind === 'deposit') return 'Supplier deposit / advance payment.';
    return '';
  }
  function applyKind(kind, editing, row){
    kind = norm(kind) || active.kind || 'order';
    active.kind = kind; active.editing = !!editing; active.row = row || active.row || null;
    window.__VP_ENTRY_KIND_LOCK = kind;
    window.__VARDOPHASE_ACTIVE_ENTRY_TYPE = kind;
    var modal = el('entryModal');
    if(modal){ modal.dataset.entryKind = kind; modal.dataset.entryType = kind; modal.dataset.lockedType = kind; }
    setVal('entryMode', kind);
    setText('entryModalTitle', title(kind, !!editing));
    setText('entryModalSub', subtitle(kind));

    var orderLabel = el('entryOrderLabel') || document.querySelector('#entryOrderWrap span');
    var invoiceLabel = el('entryInvoiceLabel') || document.querySelector('#entryInvoiceWrap span');
    show('entryTypeWrap', false);

    if(kind === 'order'){
      show('entryOrderWrap', true); show('entryInvoiceWrap', false);
      if(orderLabel) orderLabel.textContent = 'Order No';
    } else if(kind === 'invoice'){
      show('entryOrderWrap', true); show('entryInvoiceWrap', true);
      if(orderLabel) orderLabel.textContent = 'Order No / PO';
      if(invoiceLabel) invoiceLabel.textContent = 'Invoice No';
      var inv=el('entryInvoiceNo'); if(inv){ inv.placeholder='Invoice No'; inv.title='Invoice No'; inv.readOnly=false; }
    } else if(kind === 'delivery_note'){
      show('entryOrderWrap', true); show('entryInvoiceWrap', true);
      if(orderLabel) orderLabel.textContent = 'Order No / PO';
      if(invoiceLabel) invoiceLabel.textContent = 'Delivery Note No';
      var dn=el('entryInvoiceNo'); if(dn){ dn.placeholder='DN-001'; dn.title='Delivery Note No'; dn.readOnly=false; var d=dnNo(row||active.row); if(d) dn.value=d; }
    } else if(kind === 'deposit'){
      show('entryOrderWrap', true); show('entryInvoiceWrap', false);
      if(orderLabel) orderLabel.textContent = 'Deposit No';
      var typeSel=el('entryType'); if(typeSel) typeSel.value='deposit';
    }
  }
  function schedule(kind, editing, row){
    [0,10,30,80,160,320,650,1200,2200].forEach(function(ms){ setTimeout(function(){ applyKind(kind, editing, row); }, ms); });
  }
  async function fetchRow(id){
    if(!id || !window.supabase) return null;
    try{ var r = await window.supabase.from('suppliers').select('*').eq('id', id).single(); return r && !r.error ? r.data : null; }catch(e){ return null; }
  }

  var baseOpen = window.openEntryModal;
  if(typeof baseOpen === 'function'){
    window.openEntryModal = async function(id, forcedMode){
      id = id == null ? null : id;
      var row = id ? await fetchRow(id) : null;
      var kind = decideKind(row, forcedMode);
      active = { kind:kind, id:id, row:row, editing:!!id };
      window.__VP_ENTRY_KIND_LOCK = kind;
      var out = await baseOpen.call(this, id, kind === 'delivery_note' ? 'delivery_note' : kind);
      applyKind(kind, !!id, row);
      schedule(kind, !!id, row);
      return out;
    };
  }

  // Top dashboard buttons: bypass older direct modal initializers that left default title.
  window.openOrderModal = async function(){ return window.openEntryModal(null, 'order'); };
  window.openInvoiceModal = async function(){ return window.openEntryModal(null, 'invoice'); };
  window.openDepositModal = async function(){ return window.openEntryModal(null, 'deposit'); };
  window.openDeliveryNoteModal = async function(){ return window.openEntryModal(null, 'delivery_note'); };

  // Print routing: use the locked modal kind, not fallback PO logic.
  function activeKind(){
    var modal=el('entryModal');
    return norm(active.kind || window.__VP_ENTRY_KIND_LOCK || (modal && (modal.dataset.entryKind || modal.dataset.lockedType)) || el('entryMode')?.value || '');
  }
  var oldPrint = window.vardoPrintCurrentDocument;
  window.vardoPrintCurrentDocument = function(){
    var k = activeKind() || 'order';
    applyKind(k, active.editing, active.row);
    if(k === 'invoice' && typeof window.__v349PrintInvoice === 'function') return window.__v349PrintInvoice();
    if(k === 'delivery_note' && typeof window.__v349PrintDN === 'function') return window.__v349PrintDN();
    if(k === 'deposit' && typeof window.__v349PrintDeposit === 'function') return window.__v349PrintDeposit();
    if(k === 'order' && typeof window.__v349PrintOrder === 'function') return window.__v349PrintOrder();
    if(typeof oldPrint === 'function' && oldPrint !== window.vardoPrintCurrentDocument) return oldPrint();
  };

  document.addEventListener('click', function(ev){
    var b = ev.target && ev.target.closest ? ev.target.closest('button') : null;
    if(!b) return;
    var txt = String(b.textContent||'').trim().toLowerCase();
    if(txt === 'order') schedule('order', false, null);
    if(txt === 'invoice') schedule('invoice', false, null);
    if(txt === 'add deposit') schedule('deposit', false, null);
    if(txt === 'delivery note') schedule('delivery_note', false, null);
    if(txt === 'print' && el('entryModal') && el('entryModal').classList.contains('show')){
      ev.preventDefault(); ev.stopPropagation(); window.vardoPrintCurrentDocument();
    }
  }, true);
})();
