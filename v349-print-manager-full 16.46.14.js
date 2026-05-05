(function(){
  'use strict';
  if(window.__v349PrintManagerInstalled) return;
  window.__v349PrintManagerInstalled = true;

  function byId(id){ return document.getElementById(id); }
  function val(id){ return String(byId(id)?.value ?? '').trim(); }
  function esc(s){ return String(s ?? '').replace(/[&<>'"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]; }); }
  function num(v){ const n = Number(String(v ?? '').replace(/[^0-9.\-]/g,'')); return isFinite(n) ? n : 0; }
  function money(v){ return num(v).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2}); }
  function cleanNotes(s){ return String(s||'').replace(/\[\[V\d+_[^\]]+\]\]/g,'').replace(/\[\[GL_ALLOCATIONS:[\s\S]*?\]\]/g,'').trim(); }
  function field(tr,n){ return String(tr.querySelector('[data-field="'+n+'"]')?.value ?? '').trim(); }

  function currentItems(){
    const body = byId('v309OrderItemsBody');
    if(!body) return [];
    return Array.from(body.querySelectorAll('tr')).map(function(tr,i){
      const qty = num(field(tr,'qty'));
      const price = num(field(tr,'price'));
      const disc = Math.max(0, Math.min(100, num(field(tr,'discount'))));
      const discAmount = qty && price && disc ? qty * price * (disc/100) : 0;
      return {
        no: i+1,
        manual: field(tr,'manualDescription') || field(tr,'item') || '',
        desc: field(tr,'description'),
        code: field(tr,'codeDisplay') || field(tr,'glCode'),
        qty: field(tr,'qty'),
        price: field(tr,'price'),
        discount: field(tr,'discount'),
        discountAmount: discAmount ? money(discAmount) : '',
        total: field(tr,'total')
      };
    }).filter(function(r){ return r.manual || r.desc || r.code || r.qty || r.price || r.discount || r.total; });
  }

  function getSupplierDetails(name){
    try{ if(typeof window.getSupplierDetails === 'function') return window.getSupplierDetails(name) || {}; }catch(e){}
    try{ return (JSON.parse(localStorage.getItem('vp_supplier_details_v325') || '{}') || {})[name] || {}; }catch(e){ return {}; }
  }

  function supplierBlock(name){
    const d = getSupplierDetails(name);
    const rows = [
      ['Supplier', name],
      ['Contact Person', d.contactPerson || d.contact || ''],
      ['Phone', d.phone || ''],
      ['Email', d.email || ''],
      ['Contractor Name', d.contractorName || d.contractor || ''],
      ['Address', d.address || '']
    ].filter(function(x){ return String(x[1]||'').trim(); });
    if(!rows.length) return '';
    return '<section class="supplierBox"><div class="boxTitle">Supplier Details</div><div class="meta smallMeta">'+rows.map(function(x){ return '<div class="label">'+esc(x[0])+'</div><div>'+esc(x[1])+'</div>'; }).join('')+'</div></section>';
  }

  function getContextData(){
    const modalTitle = String(document.querySelector('#entryModal h3, #entryModalTitle, .modal h3')?.textContent || '');
    return {
      mode: String(val('entryMode')).toLowerCase(),
      type: String(val('entryType')).toLowerCase(),
      title: modalTitle,
      orderNo: val('entryOrderNo'),
      invoiceNo: val('entryInvoiceNo'),
      supplierOrderNo: val('entrySupplierOrderNo'),
      supplier: val('entrySupplier'),
      project: val('entryProject'),
      net: val('entryNetAmount'),
      vat: val('entryVatAmount'),
      total: val('entryTotal'),
      notes: cleanNotes(val('entryNotes')),
      items: currentItems()
    };
  }

  function resolveKind(d){
    const title = String(d.title || '').toLowerCase();
    const notes = String(d.notes || '').toLowerCase();
    if(d.type === 'deposit' || d.mode === 'deposit') return 'deposit';
    if(d.mode === 'delivery_note' || d.type === 'delivery_note' || /delivery note/.test(title)) return 'delivery_note';
    // Most important fix: the modal opened from the Invoice button has entryMode="invoice"
    // even before an invoice number is typed. It must print as Invoice, not Purchase Order.
    if(d.mode === 'invoice' || d.type === 'invoice' || d.invoiceNo || /invoice/.test(title)) return 'invoice';
    if(/\[\[dn/i.test(notes) || /delivery note/.test(notes)) return 'delivery_note';
    return 'order';
  }

  function css(){ return `
    body{margin:0;background:#f7f4f0;color:#151515;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif}.page{max-width:980px;margin:22px auto;background:#fff;padding:34px 38px;border-radius:18px;box-shadow:0 12px 34px rgba(0,0,0,.08)}.printBtn{float:right;border:0;border-radius:14px;padding:9px 17px;background:#eee;color:#111;font-weight:700}header{display:flex;justify-content:space-between;align-items:flex-start;gap:22px}.brand{display:flex;align-items:center;gap:14px}.brand img{width:60px;height:60px;object-fit:contain}.brand h1{margin:0;font-size:23px;letter-spacing:.10em}.brand p,.doc p{margin:3px 0;color:#666;font-size:12px}.doc{text-align:right}.doc h2{margin:0;font-size:28px;letter-spacing:.04em}.line{height:2px;background:linear-gradient(90deg,#a87758,#ddb28f,#a87758);margin:22px 0}.meta{display:grid;grid-template-columns:170px 1fr;gap:7px 16px;margin:12px 0 18px}.label{font-weight:800;color:#474747}.supplierBox{border:1px solid rgba(205,158,124,.45);border-radius:14px;padding:13px 15px;margin:14px 0 22px;background:#fffdfb}.boxTitle{font-weight:800;margin-bottom:8px}.smallMeta{margin:0}h3{margin:18px 0 10px;font-size:17px}table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #e4dcd5;border-radius:12px;overflow:hidden}th{background:#f3eee9;color:#493a32;font-size:11px;text-transform:uppercase;letter-spacing:.04em}th,td{padding:9px 10px;border-bottom:1px solid #eee;font-size:13px;text-align:left}td.num,th.num{text-align:right}.totalCell{font-weight:800}.empty{text-align:center;color:#888;padding:22px}.totals{width:350px;margin:24px 0 0 auto;border-top:2px solid #c99b78;padding-top:10px}.totals div{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #eee}.totals .grand{font-weight:900;font-size:16px}.notes{margin-top:22px;padding-top:12px;border-top:1px solid #eee;white-space:pre-wrap;font-size:12px;color:#555}.foot{margin-top:36px;display:flex;justify-content:space-between;gap:80px;color:#8a674d}.sig{flex:1;border-top:1px solid #c99b78;padding-top:8px}@media print{body{background:#fff}.page{box-shadow:none;margin:0;max-width:none;border-radius:0}.printBtn{display:none}}`; }

  function docLabels(kind){
    if(kind === 'invoice') return {title:'INVOICE', sub:'Supplier invoice document', total:'Invoice Total'};
    if(kind === 'delivery_note') return {title:'DELIVERY NOTE', sub:'Delivery note / supplied goods record', total:'Delivered Total'};
    if(kind === 'deposit') return {title:'DEPOSIT / ADVANCE RECEIPT', sub:'Supplier advance / deposit record', total:'Deposit Total'};
    return {title:'PURCHASE ORDER', sub:'Official supplier purchase order', total:'Total After VAT'};
  }

  function htmlFor(d, kind){
    const labels = docLabels(kind);
    const rows = d.items.length ? d.items.map(function(r){
      return '<tr><td>'+esc(r.no)+'</td><td>'+esc(r.manual)+'</td><td>'+esc(r.desc)+'</td><td>'+esc(r.code)+'</td><td class="num">'+esc(r.qty)+'</td><td class="num">'+esc(r.price)+'</td><td class="num">'+(r.discount?esc(r.discount)+'%':'')+'</td><td class="num">'+esc(r.discountAmount||'')+'</td><td class="num totalCell">'+esc(r.total||'0.00')+'</td></tr>';
    }).join('') : '<tr><td colspan="9" class="empty">No item lines</td></tr>';
    let refRows;
    if(kind === 'invoice') refRows = [['Invoice No', d.invoiceNo], ['Order No / PO', d.orderNo], ['Supplier Order No', d.supplierOrderNo], ['Project', d.project]];
    else if(kind === 'delivery_note') refRows = [['Delivery Note No', d.invoiceNo || d.orderNo], ['Order No / PO', d.orderNo], ['Supplier Order No', d.supplierOrderNo], ['Project', d.project]];
    else if(kind === 'deposit') refRows = [['Deposit No', d.orderNo || d.invoiceNo], ['Supplier', d.supplier], ['Project', d.project]];
    else refRows = [['Order No', d.orderNo], ['Supplier Order No', d.supplierOrderNo], ['Project', d.project]];

    return '<!doctype html><html><head><meta charset="utf-8"><title>'+esc(labels.title+' '+(d.invoiceNo||d.orderNo||''))+'</title><style>'+css()+'</style></head><body><div class="page"><button class="printBtn" onclick="window.print()">Print</button><header><div class="brand"><img src="assets/logo.png" alt="Vardophase"><div><h1>VARDOPHASE</h1><p>Suppliers Cloud Pro</p></div></div><div class="doc"><h2>'+esc(labels.title)+'</h2><p>'+esc(labels.sub)+'</p><p>'+esc(new Date().toLocaleDateString())+'</p></div></header><div class="line"></div><section class="meta">'+refRows.filter(function(x){return String(x[1]||'').trim();}).map(function(x){return '<div class="label">'+esc(x[0])+'</div><div>'+esc(x[1])+'</div>';}).join('')+'</section>'+supplierBlock(d.supplier)+'<h3>'+(kind==='invoice'?'Invoice Items':(kind==='delivery_note'?'Delivered Items':'Items'))+'</h3><table><thead><tr><th>#</th><th>Manual Description</th><th>Description</th><th>GL Code</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Disc. %</th><th class="num">Disc. Amount</th><th class="num">Total</th></tr></thead><tbody>'+rows+'</tbody></table><div class="totals"><div><span>Net Before VAT</span><b>'+esc(money(d.net))+'</b></div><div><span>VAT Amount</span><b>'+esc(money(d.vat))+'</b></div><div class="grand"><span>'+esc(labels.total)+'</span><b>'+esc(money(d.total))+'</b></div></div>'+(d.notes?'<div class="notes"><b>Notes</b><br>'+esc(d.notes)+'</div>':'')+'<div class="foot"><div class="sig">Prepared by</div><div class="sig">Approved by</div></div></div></body></html>';
  }

  function openPrint(kind){
    const d = getContextData();
    const finalKind = kind || resolveKind(d);
    const w = window.open('', '_blank');
    if(!w){ alert('Popup blocked. Please allow popups to print.'); return; }
    w.document.open();
    w.document.write(htmlFor(d, finalKind));
    w.document.close();
    setTimeout(function(){ try{ w.focus(); w.print(); }catch(e){} }, 350);
  }

  window.vardoPrintCurrentDocument = function(){
    const d = getContextData();
    return openPrint(resolveKind(d));
  };
  window.printEntryOrder = window.vardoPrintCurrentDocument;
  window.printEntryInvoice = function(){ return openPrint('invoice'); };
  window.printEntryDeposit = function(){ return openPrint('deposit'); };
  window.printEntryDeliveryNote = function(){ return openPrint('delivery_note'); };

  // Keep Email / WhatsApp safe: open the correct branded printable document, then user can share/save PDF.
  window.emailEntryOrder = function(){
    window.vardoPrintCurrentDocument();
    setTimeout(function(){ alert('The correct branded document is open. Use Print / Save PDF and attach it to Email.'); }, 450);
  };
  window.whatsappEntryOrder = function(){
    window.vardoPrintCurrentDocument();
    setTimeout(function(){ alert('The correct branded document is open. Use Share / Save PDF and send it in WhatsApp.'); }, 450);
  };

  // Mark mode clearly when opening shortcut modals; no core save/login logic touched.
  function wrapOpen(name, mode){
    const old = window[name];
    if(typeof old !== 'function' || old.__v349Wrapped) return;
    const wrapped = async function(){
      const res = await old.apply(this, arguments);
      const f = byId('entryMode'); if(f && mode) f.value = mode;
      return res;
    };
    wrapped.__v349Wrapped = true;
    window[name] = wrapped;
  }
  setTimeout(function(){
    wrapOpen('openInvoiceModal', 'invoice');
    wrapOpen('openOrderModal', 'order');
    wrapOpen('openDepositModal', 'deposit');
  }, 0);
})();
