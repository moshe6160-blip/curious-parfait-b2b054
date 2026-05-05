/* V363 Row Context Router
   Fixes the root issue: opening from the bottom action/table rows must use the row's own data,
   not the last document type opened from the top buttons.
   Additive only: login/save/calculations untouched.
*/
(function(){
  if(window.__v363RowContextRouterLoaded) return;
  window.__v363RowContextRouterLoaded = true;

  const TYPE = {
    order: 'order',
    invoice: 'invoice',
    dn: 'delivery_note',
    deposit: 'deposit',
    credit: 'credit_note'
  };

  let ctx = { kind: '', id: null, mode: 'new', row: null };

  function text(v){ return String(v ?? '').trim(); }
  function low(v){ return text(v).toLowerCase(); }
  function getDN(row){
    try{
      if(typeof window.extractDeliveryNoteNo === 'function') return text(window.extractDeliveryNoteNo(row));
    }catch(e){}
    const notes = text(row && row.notes);
    let m = notes.match(/\[\[DN:([^\]]+)\]\]/i);
    if(m) return text(m[1]);
    m = notes.match(/Delivery\s*Note\s*:?\s*([^\n]+)/i);
    if(m) return text(m[1]);
    return text(row && (row.delivery_note_no || row.dn_no));
  }
  function isDeposit(row){
    const raw = low(row && (row.entry_type || row.type || row.document_type || row.kind));
    const st = low(row && row.status);
    const desc = low(row && row.description);
    const inv = text(row && row.invoice_no);
    return raw === 'deposit' || raw === 'advance' || st === 'deposit' || st === 'advance' || desc.includes('deposit') || desc.includes('advance payment') || /^DEP-/i.test(inv);
  }
  function inferKind(row, forced){
    const f = low(forced);
    if(f === 'dn' || f === 'delivery_note' || f === 'delivery-note' || f === 'delivery note') return TYPE.dn;
    if(f === 'order' || f === 'po' || f === 'purchase_order' || f === 'purchase order') return TYPE.order;
    if(f === 'invoice') return TYPE.invoice;
    if(f === 'deposit' || f === 'advance') return TYPE.deposit;

    const raw = low(row && (row.entry_type || row.type || row.document_type || row.kind));
    const desc = low(row && row.description);
    const status = low(row && row.status);
    const inv = text(row && row.invoice_no);
    const ord = text(row && row.order_no);
    const dn = getDN(row);

    if(raw === 'credit_note' || desc.includes('credit note') || status === 'credit note') return TYPE.credit;
    if(isDeposit(row)) return TYPE.deposit;

    // Invoice must win over DN because an invoice row may also contain a DN tag.
    if(raw === 'invoice' || (/^INV-/i.test(inv)) || (inv && !/^DN-/i.test(inv) && !/^DEP-/i.test(inv))) return TYPE.invoice;

    // DN is stored in notes in this system, not always in entry_type.
    if(raw === 'delivery_note' || raw === 'dn' || dn || /^DN-/i.test(inv)) return TYPE.dn;

    if(raw === 'order' || raw === 'po' || ord) return TYPE.order;
    return TYPE.invoice;
  }
  function titleFor(kind, mode){
    const isEdit = mode === 'edit';
    if(kind === TYPE.order) return isEdit ? 'Edit Order' : 'New Order';
    if(kind === TYPE.invoice) return isEdit ? 'Edit Invoice' : 'New Invoice';
    if(kind === TYPE.dn) return isEdit ? 'Edit Delivery Note' : 'New Delivery Note';
    if(kind === TYPE.deposit) return isEdit ? 'Edit Deposit / Advance' : 'New Deposit / Advance';
    if(kind === TYPE.credit) return isEdit ? 'Edit Credit Note' : 'New Credit Note';
    return isEdit ? 'Edit Entry' : 'New Entry';
  }
  function numberLabelFor(kind){
    if(kind === TYPE.dn) return 'DN No';
    if(kind === TYPE.deposit) return 'Deposit No';
    return 'Invoice No';
  }
  function numberPlaceholderFor(kind){
    if(kind === TYPE.dn) return 'DN-0001';
    if(kind === TYPE.deposit) return 'DEP-001';
    return 'INV-001';
  }
  function modeValue(kind){
    if(kind === TYPE.dn) return 'delivery_note';
    if(kind === TYPE.order) return 'order';
    if(kind === TYPE.deposit) return 'deposit';
    if(kind === TYPE.credit) return 'credit_note';
    return 'invoice';
  }
  function setVal(id, val){ const el = document.getElementById(id); if(el) el.value = val ?? ''; }
  function show(id, yes){ const el = document.getElementById(id); if(el) el.style.display = yes ? '' : 'none'; }

  function applyContext(){
    if(!ctx.kind) return;
    const modal = document.getElementById('entryModal');
    if(!modal || !modal.classList.contains('show')) return;

    const title = document.getElementById('entryModalTitle') || document.querySelector('#entryModal .modal-title, #entryModal h3');
    if(title) title.textContent = titleFor(ctx.kind, ctx.mode);

    setVal('entryMode', modeValue(ctx.kind));

    const label = document.getElementById('entryInvoiceLabel') || document.querySelector('#entryInvoiceWrap span');
    const inv = document.getElementById('entryInvoiceNo');
    if(label) label.textContent = numberLabelFor(ctx.kind);
    if(inv) inv.placeholder = numberPlaceholderFor(ctx.kind);

    if(ctx.kind === TYPE.dn){
      const dn = getDN(ctx.row) || text(ctx.row && ctx.row.invoice_no);
      if(dn) setVal('entryInvoiceNo', dn);
      if(inv){ inv.readOnly = true; inv.title = 'Delivery Note number'; }
      show('entryInvoiceWrap', true);
      show('entryOrderWrap', true);
      show('entryTypeWrap', false);
      show('entryStatusWrap', false);
    } else if(ctx.kind === TYPE.order){
      if(inv){ inv.readOnly = false; inv.title = ''; }
      // Order is not an invoice: keep invoice field hidden to prevent confusion.
      show('entryInvoiceWrap', false);
      show('entryOrderWrap', true);
      show('entryTypeWrap', false);
      show('entryStatusWrap', true);
      setVal('entryStatus', 'Unpaid');
    } else if(ctx.kind === TYPE.deposit){
      if(inv){ inv.readOnly = false; inv.title = ''; }
      show('entryInvoiceWrap', true);
      show('entryOrderWrap', false);
      show('entryTypeWrap', false);
      show('entryStatusWrap', false);
      setVal('entryType', 'deposit');
      if(!text(document.getElementById('entryDescription')?.value)) setVal('entryDescription', 'Deposit / Advance Payment');
      setVal('entryVatAmount', '0.00');
      setVal('entryStatus', 'Paid');
    } else if(ctx.kind === TYPE.invoice){
      if(inv){ inv.readOnly = false; inv.title = ''; }
      show('entryInvoiceWrap', true);
      show('entryOrderWrap', true);
      show('entryTypeWrap', true);
      show('entryStatusWrap', true);
      setVal('entryType', 'invoice');
    }
  }

  function forceApplySoon(){
    applyContext();
    setTimeout(applyContext, 0);
    setTimeout(applyContext, 60);
    setTimeout(applyContext, 200);
    setTimeout(applyContext, 650);
  }

  async function fetchRow(id){
    if(!id) return null;
    try{
      const db = window.vpSupabase || window.supabase;
      if(db && db.from){
        const res = await db.from('suppliers').select('*').eq('id', id).single();
        if(!res.error && res.data) return res.data;
      }
    }catch(e){}
    return null;
  }

  const previousOpen = window.openEntryModal;
  window.openEntryModal = async function(id=null, forcedMode=''){
    const row = id ? await fetchRow(id) : null;
    const kind = id ? inferKind(row, '') : inferKind(null, forcedMode);
    ctx = { kind, id, mode: id ? 'edit' : 'new', row };
    window.__V363_ACTIVE_ENTRY_KIND = kind;

    // For original function: pass only the exact mode, never the last-used state.
    const originalMode = modeValue(kind);
    const result = (typeof previousOpen === 'function')
      ? await previousOpen.call(this, id, originalMode)
      : undefined;

    // Original code may render with its own defaults; our row context wins after render.
    forceApplySoon();
    return result;
  };

  function wrapNewButton(fnName, kind, permissionFn){
    const oldFn = window[fnName];
    window[fnName] = async function(){
      if(typeof permissionFn === 'function' && !permissionFn()){
        if(kind === TYPE.deposit) return alert('Only accountant or admin can add deposit.');
        return alert('This role cannot create this document.');
      }
      ctx = { kind, id: null, mode: 'new', row: null };
      window.__V363_ACTIVE_ENTRY_KIND = kind;
      let result;
      if(typeof oldFn === 'function') result = await oldFn.apply(this, arguments);
      else if(typeof window.openEntryModal === 'function') result = await window.openEntryModal(null, modeValue(kind));
      forceApplySoon();
      return result;
    };
  }

  wrapNewButton('openOrderModal', TYPE.order, window.canCreateOrder);
  wrapNewButton('openInvoiceModal', TYPE.invoice, window.canCreateInvoice);
  wrapNewButton('openDepositModal', TYPE.deposit, window.canAccountant);

  function safeMoney(n){
    try{ if(typeof window.money === 'function') return window.money(Number(n||0)); }catch(e){}
    return 'R ' + Number(n||0).toLocaleString('en-ZA',{minimumFractionDigits:2, maximumFractionDigits:2});
  }
  function escHtml(s){
    return String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  }
  function currentFormData(){
    return {
      supplier: text(document.getElementById('entrySupplier')?.value),
      project: text(document.getElementById('entryProject')?.value),
      orderNo: text(document.getElementById('entryOrderNo')?.value),
      docNo: text(document.getElementById('entryInvoiceNo')?.value),
      description: text(document.getElementById('entryDescription')?.value),
      net: Number(document.getElementById('entryNetAmount')?.value || 0),
      vat: Number(document.getElementById('entryVatAmount')?.value || 0),
      total: Number(document.getElementById('entryTotal')?.value || 0),
      notes: text(document.getElementById('entryNotes')?.value)
    };
  }
  function openSimplePrint(kind){
    const d = currentFormData();
    const titleMap = {
      order: 'PURCHASE ORDER',
      invoice: 'INVOICE',
      delivery_note: 'DELIVERY NOTE',
      deposit: 'DEPOSIT / ADVANCE RECEIPT'
    };
    const noLabelMap = {
      order: 'Order No',
      invoice: 'Invoice No',
      delivery_note: 'DN No',
      deposit: 'Deposit No'
    };
    const title = titleMap[kind] || 'DOCUMENT';
    const ref = kind === TYPE.order ? d.orderNo : d.docNo;
    const w = window.open('', '_blank');
    if(!w) return alert('Popup blocked. Please allow popups to print.');
    w.document.open();
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>'+escHtml(title)+'</title><style>@page{size:A4;margin:14mm}body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0}.page{padding:20px}.brand{display:flex;align-items:center;gap:14px;border-bottom:2px solid #c9a46a;padding-bottom:14px;margin-bottom:22px}.brand img{height:54px}.brand h1{font-size:24px;margin:0}.sub{font-size:12px;color:#666}.docTitle{display:flex;justify-content:space-between;align-items:flex-end;margin:10px 0 22px}.docTitle h2{font-size:28px;margin:0}.meta{display:grid;grid-template-columns:170px 1fr;gap:8px 14px;margin-bottom:24px}.label{font-weight:700;color:#444}.box{border:1px solid #ddd;border-radius:12px;padding:14px;min-height:70px}.totals{margin-top:22px;margin-left:auto;width:320px}.row{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:8px 0}.total{font-size:18px;font-weight:800}@media print{button{display:none}}</style></head><body><div class="page"><button onclick="window.print()" style="float:right;padding:10px 16px">Print</button><div class="brand"><img src="assets/logo.png"><div><h1>VARDOPHASE</h1><div class="sub">Suppliers Cloud Pro</div></div></div><div class="docTitle"><h2>'+escHtml(title)+'</h2><div>'+escHtml(new Date().toLocaleDateString())+'</div></div><div class="meta"><div class="label">'+escHtml(noLabelMap[kind]||'Document No')+'</div><div>'+escHtml(ref)+'</div><div class="label">Order No</div><div>'+escHtml(d.orderNo)+'</div><div class="label">Supplier</div><div>'+escHtml(d.supplier)+'</div><div class="label">Project</div><div>'+escHtml(d.project)+'</div></div><div class="box"><b>Description</b><br>'+escHtml(d.description||'')+'</div><div class="totals"><div class="row"><span>Net Before VAT</span><b>'+escHtml(safeMoney(d.net))+'</b></div><div class="row"><span>VAT Amount</span><b>'+escHtml(safeMoney(d.vat))+'</b></div><div class="row total"><span>Total</span><b>'+escHtml(safeMoney(d.total))+'</b></div></div>'+(d.notes?'<div class="box" style="margin-top:22px"><b>Notes</b><br>'+escHtml(d.notes)+'</div>':'')+'</div><script>setTimeout(function(){window.print()},500)<\/script></body></html>');
    w.document.close();
  }

  // Override the shared Print button. It was previously hard-coded to Purchase Order.
  const previousPrintEntryOrder = window.printEntryOrder;
  window.printEntryOrder = function(){
    const active = ctx.kind || window.__V363_ACTIVE_ENTRY_KIND || modeValue(document.getElementById('entryMode')?.value || 'order');
    const kind = inferKind(null, active);
    return openSimplePrint(kind);
  };
  window.v363PrintByContext = window.printEntryOrder;

  // Keep title stable even if older scripts try to repaint it.
  const obsTarget = document.body;
  if(obsTarget && window.MutationObserver){
    const obs = new MutationObserver(function(){
      if(ctx.kind) applyContext();
    });
    obs.observe(obsTarget, { childList:true, subtree:true, characterData:true });
  }

})();
