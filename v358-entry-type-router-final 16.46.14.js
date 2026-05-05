/* V358 - Final Entry Type Router
   Purpose: stop Order/Invoice/DN/Deposit from fighting each other.
   This file is loaded after the old app and print manager.
   It does not touch login, save logic, totals, or database structure. */
(function(){
  'use strict';
  if(window.__V358_ENTRY_TYPE_ROUTER_FINAL__) return;
  window.__V358_ENTRY_TYPE_ROUTER_FINAL__ = true;

  const VALID = ['order','invoice','delivery_note','deposit'];
  const state = {
    kind: '',
    id: null,
    row: null,
    editing: false
  };

  function $(id){ return document.getElementById(id); }
  function getVal(id){ return String($(id)?.value || '').trim(); }
  function setVal(id,v){ const el=$(id); if(el) el.value = v == null ? '' : String(v); }
  function show(id, yes){ const el=$(id); if(el) el.style.display = yes ? '' : 'none'; }
  function text(sel,v){ const el=document.querySelector(sel); if(el) el.textContent = v; }
  function low(v){ return String(v||'').trim().toLowerCase(); }
  function has(v){ return String(v||'').trim().length > 0; }
  function norm(v){
    let s = low(v).replace(/[\s-]+/g,'_');
    if(['dn','delivery','deliverynote','delivery_note','delivery_notes','delivery_note_no'].includes(s)) return 'delivery_note';
    if(['po','purchase','purchase_order','purchaseorder','order','orders'].includes(s)) return 'order';
    if(['inv','invoice','invoices'].includes(s)) return 'invoice';
    if(['dep','deposit','advance','advanced','payment_advance','supplier_credit'].includes(s)) return 'deposit';
    return VALID.includes(s) ? s : '';
  }
  function noteTag(notes, tag){
    const re = new RegExp('\\[\\['+tag+':([\\s\\S]*?)\\]\\]','i');
    const m = String(notes||'').match(re);
    return m ? String(m[1]||'').trim() : '';
  }
  function extractDN(row){
    if(!row) row = {};
    const direct = String(row.delivery_note_no || row.dn_no || row.delivery_no || '').trim();
    if(direct) return direct;
    const inv = String(row.invoice_no || '').trim();
    if(/^DN[-\s]?\d+/i.test(inv)) return inv;
    const notes = String(row.notes || '');
    return noteTag(notes,'DN') || noteTag(notes,'DNNO') || ((notes.match(/\bDN[-\s]?\d+\b/i)||[])[0]||'');
  }
  function isDeposit(row){
    const orderNo = String(row?.order_no || row?.reference || '').trim();
    const type = norm(row?.entry_type || row?.type || row?.kind || row?.mode || '');
    const desc = String(row?.description || '').toLowerCase();
    const notes = String(row?.notes || '').toLowerCase();
    return type === 'deposit' || /^DEP-/i.test(orderNo) || /deposit|advance/.test(desc) || /\[\[dep/i.test(notes);
  }
  function deriveKind(row, forced){
    const f = norm(forced);
    if(f) return f;
    row = row || {};
    const t = norm(row.entry_type || row.type || row.kind || row.entry_kind || row.entry_mode || row.mode || '');
    if(isDeposit(row)) return 'deposit';
    if(t === 'delivery_note') return 'delivery_note';
    const inv = String(row.invoice_no || '').trim();
    if(inv && !/^DN[-\s]?\d+/i.test(inv)) return 'invoice';
    if(extractDN(row)) return 'delivery_note';
    if(t === 'invoice') return 'invoice';
    if(t === 'order') return 'order';
    if(has(row.order_no || row.reference)) return 'order';
    return 'invoice';
  }
  async function fetchRow(id){
    if(!id) return null;
    const client = window.supabase || window.vpSupabase || window.__vpDb;
    if(!client) return null;
    try{
      const res = await client.from('suppliers').select('*').eq('id', id).single();
      return res && !res.error ? res.data : null;
    }catch(e){ return null; }
  }
  function ensureEntryTypeOption(kind){
    const sel = $('entryType');
    if(!sel) return;
    const label = kind === 'delivery_note' ? 'Delivery Note' : kind === 'deposit' ? 'Deposit' : kind === 'order' ? 'Order' : 'Invoice';
    if(!Array.from(sel.options).some(o => o.value === kind)){
      const opt = document.createElement('option');
      opt.value = kind; opt.textContent = label; sel.appendChild(opt);
    }
    // IMPORTANT: keep legacy save rules happy. DN is internally stored in invoice number field.
    sel.value = kind === 'deposit' ? 'deposit' : 'invoice';
  }
  function setLabels(kind, row){
    const orderLabel = $('entryOrderLabel') || document.querySelector('#entryOrderWrap span');
    const invLabel = $('entryInvoiceLabel') || document.querySelector('#entryInvoiceWrap span');
    show('entryTypeWrap', false);
    if(kind === 'order'){
      show('entryOrderWrap', true); show('entryInvoiceWrap', false);
      if(orderLabel) orderLabel.textContent = 'Order No';
    } else if(kind === 'invoice'){
      show('entryOrderWrap', true); show('entryInvoiceWrap', true);
      if(orderLabel) orderLabel.textContent = 'Order No / PO';
      if(invLabel) invLabel.textContent = 'Invoice No';
      const inv=$('entryInvoiceNo'); if(inv){ inv.placeholder='Invoice No'; inv.readOnly=false; }
    } else if(kind === 'delivery_note'){
      show('entryOrderWrap', true); show('entryInvoiceWrap', true);
      if(orderLabel) orderLabel.textContent = 'Order No / PO';
      if(invLabel) invLabel.textContent = 'Delivery Note No';
      const inv=$('entryInvoiceNo'); if(inv){ inv.placeholder='DN-0001'; inv.readOnly=false; const dn=extractDN(row||state.row); if(dn) inv.value=dn; }
    } else if(kind === 'deposit'){
      show('entryOrderWrap', true); show('entryInvoiceWrap', false);
      if(orderLabel) orderLabel.textContent = 'Deposit No';
    }
  }
  function titleFor(kind, editing){
    if(kind === 'order') return editing ? 'Edit Order' : 'New Order';
    if(kind === 'invoice') return editing ? 'Edit Invoice' : 'New Invoice';
    if(kind === 'delivery_note') return editing ? 'Edit Delivery Note' : 'New Delivery Note';
    if(kind === 'deposit') return editing ? 'Edit Deposit / Advance' : 'New Deposit / Advance';
    return editing ? 'Edit Entry' : 'New Entry';
  }
  function subFor(kind){
    if(kind === 'order') return 'Supplier purchase order.';
    if(kind === 'invoice') return 'Supplier invoice document.';
    if(kind === 'delivery_note') return 'Delivery note / supplied goods record.';
    if(kind === 'deposit') return 'Supplier deposit / advance payment.';
    return '';
  }
  function applyKind(kind, editing, row){
    kind = norm(kind) || state.kind || 'invoice';
    row = row || state.row || null;
    state.kind = kind; state.editing = !!editing;
    window.__VARDOPHASE_ACTIVE_ENTRY_TYPE = kind;
    window.__vardoActiveEntryKind = kind;
    window.__v356ActiveEntryKind = kind;
    window.currentEntryType = kind;
    const modal = $('entryModal');
    if(modal){ modal.dataset.entryType = kind; modal.dataset.entryKind = kind; modal.dataset.lockedType = kind; }
    setVal('entryMode', kind);
    ensureEntryTypeOption(kind);
    text('#entryModalTitle', titleFor(kind, !!editing));
    text('#entryModalSub', subFor(kind));
    setLabels(kind, row);
  }
  function lockedKind(){ return norm(state.kind || window.__VARDOPHASE_ACTIVE_ENTRY_TYPE || window.__vardoActiveEntryKind) || 'invoice'; }

  const baseOpenEntryModal = window.openEntryModal;
  if(typeof baseOpenEntryModal === 'function'){
    window.openEntryModal = async function(id=null, forcedMode=''){
      const forcedKind = norm(forcedMode);
      const rowPromise = fetchRow(id);
      // Keep legacy code working, but avoid telling it DN is invoice unless needed.
      const legacyMode = forcedKind || forcedMode || '';
      const result = await baseOpenEntryModal.call(this, id, legacyMode);
      const row = await rowPromise;
      const kind = deriveKind(row || {}, forcedKind || forcedMode);
      state.id = id || null; state.row = row || null; state.kind = kind; state.editing = !!id;
      if(kind === 'delivery_note'){
        const dn = extractDN(row); if(dn) setVal('entryInvoiceNo', dn);
      }
      applyKind(kind, !!id, row);
      // Lock after older async/interval UI code runs.
      [0,30,80,180,400,900,1600,2600].forEach(ms => setTimeout(() => applyKind(kind, !!id, row), ms));
      return result;
    };
  }

  window.openOrderModal = async function(){
    if(typeof window.canCreateOrder === 'function' && !window.canCreateOrder()) return alert('This role cannot create orders.');
    state.kind = 'order'; state.id = null; state.row = null;
    const r = await window.openEntryModal(null, 'order');
    applyKind('order', false, null);
    return r;
  };
  window.openInvoiceModal = async function(){
    if(typeof window.canCreateInvoice === 'function' && !window.canCreateInvoice()) return alert('This role cannot create invoices.');
    state.kind = 'invoice'; state.id = null; state.row = null;
    const r = await window.openEntryModal(null, 'invoice');
    applyKind('invoice', false, null);
    return r;
  };
  window.openDepositModal = async function(){
    if(typeof window.canAccountant === 'function' && !window.canAccountant()) return alert('Only accountant or admin can add deposit.');
    state.kind = 'deposit'; state.id = null; state.row = null;
    const r = await window.openEntryModal(null, 'deposit');
    applyKind('deposit', false, null);
    return r;
  };
  window.openDeliveryNoteModal = async function(){
    state.kind = 'delivery_note'; state.id = null; state.row = null;
    const r = await window.openEntryModal(null, 'delivery_note');
    applyKind('delivery_note', false, null);
    return r;
  };

  const baseClose = window.closeEntryModal;
  window.closeEntryModal = function(){
    state.kind=''; state.id=null; state.row=null; state.editing=false;
    window.__VARDOPHASE_ACTIVE_ENTRY_TYPE='';
    return typeof baseClose === 'function' ? baseClose.apply(this, arguments) : ($('entryModal') && $('entryModal').classList.remove('show'));
  };

  // Stable title lock: old code may still try to rewrite title; restore from state only.
  setInterval(function(){
    const modal = $('entryModal');
    if(!modal || !modal.classList.contains('show') || !state.kind) return;
    applyKind(state.kind, state.editing, state.row);
  }, 120);

  // Print router: calls V349 templates, but first locks the correct document kind.
  const baseCurrent = window.vardoPrintCurrentDocument;
  const baseInv = window.printEntryInvoice;
  const baseDN = window.printEntryDeliveryNote;
  const baseDep = window.printEntryDeposit;
  const baseOrder = window.printEntryOrder || baseCurrent;
  function printFor(kind){
    kind = norm(kind) || lockedKind();
    applyKind(kind, state.editing, state.row);
    if(kind === 'invoice' && typeof baseInv === 'function') return baseInv();
    if(kind === 'delivery_note' && typeof baseDN === 'function') return baseDN();
    if(kind === 'deposit' && typeof baseDep === 'function') return baseDep();
    if(typeof baseCurrent === 'function') return baseCurrent();
    if(typeof baseOrder === 'function') return baseOrder();
  }
  window.vardoPrintCurrentDocument = function(){ return printFor(lockedKind()); };
  window.printEntryOrder = window.vardoPrintCurrentDocument;
  window.printEntryInvoice = function(){ return printFor('invoice'); };
  window.printEntryDeliveryNote = function(){ return printFor('delivery_note'); };
  window.printEntryDeposit = function(){ return printFor('deposit'); };
  window.emailEntryOrder = function(){ window.vardoPrintCurrentDocument(); setTimeout(()=>alert('The correct document is open. Use Print / Save PDF and attach it to Email.'),350); };
  window.whatsappEntryOrder = function(){ window.vardoPrintCurrentDocument(); setTimeout(()=>alert('The correct document is open. Use Share / Save PDF and send it in WhatsApp.'),350); };

  window.v358EntryTypeDebug = {state, deriveKind, extractDN, applyKind, lockedKind};
})();
