/* V364 ROW TYPE SOURCE FINAL
   Root fix: opening from bottom rows must use the row data itself, never the last top button state.
   Loaded as type=module AFTER the main module, so it wraps the real final openEntryModal.
   Login/save/calculations untouched.
*/
(function(){
  if (window.__V364_ROW_TYPE_SOURCE_FINAL__) return;
  window.__V364_ROW_TYPE_SOURCE_FINAL__ = true;

  const STATE = { kind: '', id: null, row: null, edit: false };
  const norm = (v) => String(v ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  const text = (v) => String(v ?? '').trim();
  const $ = (id) => document.getElementById(id);

  function noteTag(notes, tag){
    const m = String(notes || '').match(new RegExp('\\[\\[' + tag + ':([\\s\\S]*?)\\]\\]', 'i'));
    return m ? text(m[1]) : '';
  }
  function getDN(row){
    row = row || {};
    try { if (typeof window.extractDeliveryNoteNo === 'function') { const v = text(window.extractDeliveryNoteNo(row)); if (v) return v; } } catch(e) {}
    const direct = text(row.delivery_note_no || row.dn_no || row.delivery_no || row.delivery_note || '');
    if (direct) return direct;
    const inv = text(row.invoice_no || '');
    if (/^DN[-\s]?\d+/i.test(inv)) return inv;
    const notes = String(row.notes || '');
    return noteTag(notes, 'DN') || noteTag(notes, 'DNNO') || noteTag(notes, 'DELIVERYNOTE') || ((notes.match(/\bDN[-\s]?\d+\b/i) || [])[0] || '');
  }
  function isDeposit(row){
    row = row || {};
    const raw = norm(row.entry_type || row.type || row.kind || row.document_type || row.mode || '');
    const desc = norm(row.description || '');
    const status = norm(row.status || '');
    const orderNo = text(row.order_no || '');
    const invNo = text(row.invoice_no || '');
    const notes = norm(row.notes || '');
    return raw === 'deposit' || raw === 'advance' || raw === 'supplier_credit' || status === 'deposit' || status === 'advance' ||
      /^DEP-/i.test(orderNo) || /^DEP-/i.test(invNo) || desc.includes('deposit') || desc.includes('advance') || notes.includes('deposit');
  }
  function normalizeKind(v){
    const x = norm(v);
    if (!x) return '';
    if (['order','orders','po','purchase','purchase_order','purchaseorder','entry_order'].includes(x)) return 'order';
    if (['invoice','invoices','inv','entry_invoice'].includes(x)) return 'invoice';
    if (['dn','dm','delivery','delivery_note','deliverynote','delivery_notes','entry_delivery_note'].includes(x)) return 'delivery_note';
    if (['deposit','deposits','dep','advance','advance_payment','supplier_credit'].includes(x)) return 'deposit';
    return '';
  }
  function decideKind(row, forced){
    const f = normalizeKind(forced);
    if (f) return f;
    row = row || {};
    if (isDeposit(row)) return 'deposit';

    const raw = normalizeKind(row.entry_type || row.type || row.kind || row.document_type || row.mode || '');
    const invNo = text(row.invoice_no || '');
    const orderNo = text(row.order_no || '');
    const dnNo = getDN(row);

    // Real Invoice wins over DN notes. DN notes remain linked to the chain, but opening the row after invoice should be Invoice.
    if (raw === 'invoice') return 'invoice';
    if (invNo && !/^DN[-\s]?\d+/i.test(invNo) && !/^DEP-/i.test(invNo)) return 'invoice';

    // DN only if there is a DN and no real invoice number.
    if (raw === 'delivery_note' || /^DN[-\s]?\d+/i.test(invNo) || (dnNo && !invNo)) return 'delivery_note';

    if (raw === 'order') return 'order';
    if (orderNo) return 'order';
    return 'order';
  }
  async function fetchRow(id){
    if (!id) return null;
    try{
      const cached = window.__VP_ROW_CACHE && window.__VP_ROW_CACHE[String(id)];
      if (cached) return cached;
    }catch(e){}
    const db = window.__vpDb || window.vpSupabase || window.supabase;
    if (!db || !db.from) return null;
    try {
      const res = await db.from('suppliers').select('*').eq('id', id).single();
      if (!res.error && res.data) return res.data;
    } catch(e) {}
    return null;
  }
  function title(kind, edit){
    const map = {
      order: edit ? 'Edit Order' : 'New Order',
      invoice: edit ? 'Edit Invoice' : 'New Invoice',
      delivery_note: edit ? 'Edit Delivery Note' : 'New Delivery Note',
      deposit: edit ? 'Edit Deposit / Advance' : 'New Deposit / Advance'
    };
    return map[kind] || (edit ? 'Edit Entry' : 'New Entry');
  }
  function sub(kind){
    if (kind === 'order') return 'Supplier purchase order.';
    if (kind === 'invoice') return 'Supplier invoice document.';
    if (kind === 'delivery_note') return 'Delivery note / supplied goods record.';
    if (kind === 'deposit') return 'Supplier deposit / advance payment.';
    return '';
  }
  function show(id, yes){ const el = $(id); if (el) el.style.display = yes ? '' : 'none'; }
  function setVal(id, value){ const el = $(id); if (el && String(el.value ?? '') !== String(value ?? '')) el.value = String(value ?? ''); }
  function setText(idOrEl, value){ const el = typeof idOrEl === 'string' ? $(idOrEl) : idOrEl; if (el && el.textContent !== value) el.textContent = value; }
  function apply(kind, edit, row){
    kind = normalizeKind(kind) || STATE.kind || 'order';
    const modal = $('entryModal');
    if (!modal || !modal.classList.contains('show')) return;

    STATE.kind = kind; STATE.edit = !!edit; STATE.row = row || STATE.row || null;
    window.__VARDOPHASE_ACTIVE_ENTRY_TYPE = kind;
    window.__VP_ENTRY_KIND_LOCK = kind;
    window.ACTIVE_ENTRY_TYPE = kind;
    modal.dataset.entryKind = kind;

    setText('entryModalTitle', title(kind, !!edit));
    setText('entryModalSub', sub(kind));
    setVal('entryMode', kind);

    const orderLabel = $('entryOrderLabel') || document.querySelector('#entryOrderWrap span');
    const invoiceLabel = $('entryInvoiceLabel') || document.querySelector('#entryInvoiceWrap span');
    const inv = $('entryInvoiceNo');
    const ord = $('entryOrderNo');
    const typeSel = $('entryType');
    const status = $('entryStatus');

    show('entryTypeWrap', false);
    if (inv) { inv.readOnly = false; inv.style.opacity = ''; inv.title = ''; }

    if (kind === 'order'){
      show('entryOrderWrap', true); show('entryInvoiceWrap', false); show('entryStatusWrap', true);
      setText(orderLabel, 'Order No');
      if (typeSel) typeSel.value = 'order';
      if (status && !edit) status.value = 'Unpaid';
    } else if (kind === 'invoice'){
      show('entryOrderWrap', true); show('entryInvoiceWrap', true); show('entryStatusWrap', true);
      setText(orderLabel, 'Order No / PO'); setText(invoiceLabel, 'Invoice No');
      if (inv) inv.placeholder = 'INV-001';
      if (typeSel) typeSel.value = 'invoice';
    } else if (kind === 'delivery_note'){
      show('entryOrderWrap', true); show('entryInvoiceWrap', true); show('entryStatusWrap', true);
      setText(orderLabel, 'Order No / PO'); setText(invoiceLabel, 'DN No');
      if (inv) { inv.placeholder = 'DN-0001'; inv.title = 'Delivery Note No'; }
      const dn = getDN(row || STATE.row || {});
      if (dn) setVal('entryInvoiceNo', dn);
      if (typeSel) typeSel.value = 'delivery_note';
    } else if (kind === 'deposit'){
      show('entryOrderWrap', true); show('entryInvoiceWrap', false); show('entryStatusWrap', false);
      setText(orderLabel, 'Deposit No');
      if (ord && !text(ord.value)) {
        const r = row || STATE.row || {};
        const dep = text(r.order_no || r.deposit_no || r.invoice_no || '');
        if (dep) ord.value = dep;
      }
      if (typeSel) typeSel.value = 'deposit';
      if (!text($('entryDescription') && $('entryDescription').value)) setVal('entryDescription', 'Deposit / Advance Payment');
      setVal('entryVatAmount', '0.00');
      if (status) status.value = 'Paid';
    }
  }
  function pulse(kind, edit, row){
    [0, 20, 80, 180, 400, 800, 1400, 2400].forEach(ms => setTimeout(() => apply(kind, edit, row), ms));
  }

  let installedOn = null;
  function install(){
    const current = window.openEntryModal;
    if (typeof current !== 'function') return false;
    if (current.__v364FinalWrapped) return true;
    // If another script replaces openEntryModal later, this installer will wrap again.
    const base = current;
    const wrapped = async function(id = null, forcedMode = ''){
      id = (id == null || id === '') ? null : id;
      if(id){
        try{
          const modal = document.getElementById('entryModal');
          if(modal){
            modal.classList.add('show');
            modal.dataset.fastOpening = '1';
            let badge = document.getElementById('vpFastOpenBadge');
            if(!badge){
              badge = document.createElement('div');
              badge.id = 'vpFastOpenBadge';
              badge.textContent = 'Opening document...';
              badge.style.cssText = 'position:fixed;left:50%;top:84px;transform:translateX(-50%);z-index:999999;background:rgba(10,10,12,.92);color:#f4d2a0;border:1px solid rgba(212,175,127,.75);border-radius:999px;padding:10px 18px;font:800 13px -apple-system,BlinkMacSystemFont,Segoe UI,Arial;box-shadow:0 18px 45px rgba(0,0,0,.38);pointer-events:none';
              document.body && document.body.appendChild(badge);
            }
          }
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        }catch(e){}
      }
      const row = id ? await fetchRow(id) : null;
      // For edit/from row: the row wins. For new/top buttons: forced mode wins.
      const kind = id ? decideKind(row, '') : decideKind(null, forcedMode);
      STATE.kind = kind; STATE.id = id; STATE.row = row; STATE.edit = !!id;
      // V449 performance fix: pass the already-fetched row into the main opener.
      window.__VP_FAST_OPEN_ROW = row;
      window.__VARDOPHASE_ACTIVE_ENTRY_TYPE = kind;
      window.__VP_ENTRY_KIND_LOCK = kind;
      window.ACTIVE_ENTRY_TYPE = kind;
      const result = await base.call(this, id, kind);
      try{
        const modal = document.getElementById('entryModal');
        if(modal) delete modal.dataset.fastOpening;
        const badge = document.getElementById('vpFastOpenBadge');
        if(badge) badge.remove();
      }catch(e){}
      pulse(kind, !!id, row);
      return result;
    };
    wrapped.__v364FinalWrapped = true;
    wrapped.__v364Base = base;
    window.openEntryModal = wrapped;
    installedOn = base;
    return true;
  }

  // Wait for the real module-defined function, then wrap. Keep watching in case old code overwrites it after render.
  const timer = setInterval(() => {
    if (typeof window.openEntryModal === 'function' && !window.openEntryModal.__v364FinalWrapped) install();
  }, 100);
  setTimeout(() => clearInterval(timer), 20000);
  window.addEventListener('load', install);
  document.addEventListener('DOMContentLoaded', install);

  window.openOrderModal = function(){ return window.openEntryModal(null, 'order'); };
  window.openInvoiceModal = function(){ return window.openEntryModal(null, 'invoice'); };
  window.openDeliveryNoteModal = function(){ return window.openEntryModal(null, 'delivery_note'); };
  window.openDepositModal = function(){
    if (typeof window.canAccountant === 'function' && !window.canAccountant()) return alert('Only accountant or admin can add deposit.');
    return window.openEntryModal(null, 'deposit');
  };

  function currentKind(){
    return normalizeKind(window.__VARDOPHASE_ACTIVE_ENTRY_TYPE || window.__VP_ENTRY_KIND_LOCK || STATE.kind || $('entryMode')?.value || 'order') || 'order';
  }
  const oldPrint = window.vardoPrintCurrentDocument;
  window.vardoPrintCurrentDocument = function(){
    const kind = currentKind();
    apply(kind, STATE.edit, STATE.row);
    if (kind === 'invoice' && typeof window.__v349PrintInvoice === 'function') return window.__v349PrintInvoice();
    if (kind === 'delivery_note' && typeof window.__v349PrintDN === 'function') return window.__v349PrintDN();
    if (kind === 'deposit' && typeof window.__v349PrintDeposit === 'function') return window.__v349PrintDeposit();
    if (kind === 'order' && typeof window.__v349PrintOrder === 'function') return window.__v349PrintOrder();
    if (typeof oldPrint === 'function' && oldPrint !== window.vardoPrintCurrentDocument) return oldPrint.apply(this, arguments);
    if (typeof window.print === 'function') return window.print();
  };
  document.addEventListener('click', function(ev){
    const btn = ev.target && ev.target.closest ? ev.target.closest('button') : null;
    if (!btn) return;
    const txt = text(btn.textContent).toLowerCase();
    if (txt === 'print' && $('entryModal') && $('entryModal').classList.contains('show')){
      ev.preventDefault(); ev.stopPropagation(); window.vardoPrintCurrentDocument();
    }
  }, true);
})();
