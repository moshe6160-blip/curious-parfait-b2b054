(function(){
  'use strict';
  if(window.__v348InvoicePrintFixInstalled) return;
  window.__v348InvoicePrintFixInstalled = true;

  const oldPrint = window.printEntryOrder;
  const oldEmail = window.emailEntryOrder;
  const oldWhatsApp = window.whatsappEntryOrder;

  function el(id){ return document.getElementById(id); }
  function val(id){ return String(el(id)?.value ?? '').trim(); }
  function money(v){ const n = Number(String(v ?? '').replace(/[^0-9.-]/g,'')); return (isFinite(n)?n:0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2}); }
  function esc(s){ return String(s ?? '').replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function cleanNotes(s){ return String(s||'').replace(/\[\[V\d+_[^\]]+\]\]/g,'').replace(/\[\[GL_ALLOCATIONS:[\s\S]*?\]\]/g,'').trim(); }
  function field(tr,n){ return String(tr.querySelector('[data-field="'+n+'"]')?.value ?? '').trim(); }

  function currentEntryData(){
    const items = Array.from(document.querySelectorAll('#v309OrderItemsBody tr')).map((tr,i)=>{
      const qty = Number(field(tr,'qty')) || 0;
      const price = Number(field(tr,'price')) || 0;
      const disc = Number(field(tr,'discount')) || 0;
      const discAmount = Math.max(0, qty * price * (Math.max(0, Math.min(100, disc)) / 100));
      return {
        no:i+1,
        manual: field(tr,'manualDescription') || field(tr,'item') || '',
        desc: field(tr,'description'),
        code: field(tr,'codeDisplay') || field(tr,'glCode'),
        qty: field(tr,'qty'),
        price: field(tr,'price'),
        discount: field(tr,'discount'),
        discountAmount: discAmount ? money(discAmount) : '',
        total: field(tr,'total')
      };
    }).filter(r=>r.manual || r.desc || r.code || r.qty || r.price || r.discount || r.total);

    return {
      type: String(val('entryType') || 'invoice').toLowerCase(),
      title: String(document.querySelector('#entryModal h3, .modal h3')?.textContent || ''),
      orderNo: val('entryOrderNo'),
      invoiceNo: val('entryInvoiceNo'),
      supplierOrderNo: val('entrySupplierOrderNo'),
      supplier: val('entrySupplier'),
      project: val('entryProject'),
      net: val('entryNetAmount'),
      vat: val('entryVatAmount'),
      total: val('entryTotal'),
      notes: cleanNotes(val('entryNotes')),
      items
    };
  }

  function supplierDetails(name){
    try{ if(typeof window.getSupplierDetails === 'function') return window.getSupplierDetails(name) || {}; }catch(e){}
    try{ return (JSON.parse(localStorage.getItem('vp_supplier_details_v325') || '{}') || {})[name] || {}; }catch(e){ return {}; }
  }
  function supplierBlock(name){
    const d = supplierDetails(name);
    const rows = [
      ['Supplier', name],
      ['Contact Person', d.contactPerson || d.contact || ''],
      ['Phone', d.phone || ''],
      ['Email', d.email || ''],
      ['Contractor Name', d.contractorName || d.contractor || ''],
      ['Address', d.address || '']
    ].filter(x=>String(x[1]||'').trim());
    return rows.length ? '<div class="supplierBox"><div class="boxTitle">Supplier Details</div><div class="meta smallMeta">'+rows.map(x=>'<div class="label">'+esc(x[0])+'</div><div>'+esc(x[1])+'</div>').join('')+'</div></div>' : '';
  }

  function isInvoiceContext(d){
    if(d.invoiceNo) return true;
    if(d.type === 'invoice' && !/order/i.test(d.title || '')) return true;
    return false;
  }

  function htmlFor(d, kind){
    const isInv = kind === 'invoice';
    const isDep = kind === 'deposit';
    const docTitle = isInv ? 'INVOICE' : (isDep ? 'DEPOSIT / ADVANCE RECEIPT' : 'PURCHASE ORDER');
    const sub = isInv ? 'Supplier invoice document' : (isDep ? 'Supplier advance / deposit record' : 'Official supplier purchase order');
    const rows = d.items.length ? d.items.map(r=>'<tr><td>'+esc(r.no)+'</td><td>'+esc(r.manual)+'</td><td>'+esc(r.desc)+'</td><td>'+esc(r.code)+'</td><td class="num">'+esc(r.qty)+'</td><td class="num">'+esc(r.price)+'</td><td class="num">'+(r.discount?esc(r.discount)+'%':'')+'</td><td class="num">'+esc(r.discountAmount||'')+'</td><td class="num totalCell">'+esc(r.total||'0.00')+'</td></tr>').join('') : '<tr><td colspan="9" class="empty">No item lines</td></tr>';
    const referenceRows = isInv
      ? [['Invoice No', d.invoiceNo], ['Order No / PO', d.orderNo], ['Supplier Order No', d.supplierOrderNo], ['Project', d.project]]
      : isDep
        ? [['Deposit No', d.orderNo || d.invoiceNo], ['Supplier', d.supplier], ['Project', d.project]]
        : [['Order No', d.orderNo], ['Supplier Order No', d.supplierOrderNo], ['Project', d.project]];

    return '<!doctype html><html><head><meta charset="utf-8"><title>'+esc(docTitle+' '+(d.invoiceNo||d.orderNo||''))+'</title><style>'+css()+'</style></head><body><div class="page"><button class="printBtn" onclick="window.print()">Print</button><header><div class="brand"><img src="assets/logo.png" alt="Vardophase"><div><h1>VARDOPHASE</h1><p>Suppliers Cloud Pro</p></div></div><div class="doc"><h2>'+esc(docTitle)+'</h2><p>'+esc(sub)+'</p><p>'+esc(new Date().toLocaleDateString())+'</p></div></header><div class="line"></div><section class="meta">'+referenceRows.filter(x=>String(x[1]||'').trim()).map(x=>'<div class="label">'+esc(x[0])+'</div><div>'+esc(x[1])+'</div>').join('')+'</section>'+supplierBlock(d.supplier)+'<h3>'+(isInv?'Invoice Items':'Items')+'</h3><table><thead><tr><th>#</th><th>Manual Description</th><th>Description</th><th>GL Code</th><th>Qty</th><th>Price</th><th>Disc. %</th><th>Disc. Amount</th><th>Total</th></tr></thead><tbody>'+rows+'</tbody></table><div class="totals"><div><span>Net Before VAT</span><b>'+esc(money(d.net))+'</b></div><div><span>VAT Amount</span><b>'+esc(money(d.vat))+'</b></div><div class="grand"><span>'+(isInv?'Invoice Total':'Total After VAT')+'</span><b>'+esc(money(d.total))+'</b></div></div>'+(d.notes?'<div class="notes"><b>Notes</b><br>'+esc(d.notes)+'</div>':'')+'</div></body></html>';
  }

  function css(){ return `
    body{margin:0;background:#f6f2ee;color:#181818;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif}.page{max-width:960px;margin:24px auto;background:#fff;padding:34px 38px;border-radius:18px;box-shadow:0 12px 36px rgba(0,0,0,.08)}.printBtn{float:right;border:0;border-radius:12px;padding:9px 16px;background:#111;color:#fff}header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.brand{display:flex;align-items:center;gap:14px}.brand img{width:58px;height:58px;object-fit:contain}.brand h1{font-size:22px;letter-spacing:.08em;margin:0}.brand p,.doc p{margin:3px 0;color:#777;font-size:12px}.doc{text-align:right}.doc h2{margin:0;font-size:25px;letter-spacing:.04em}.line{height:2px;background:linear-gradient(90deg,#9b6a4e,#d8aa86,#9b6a4e);margin:22px 0}.meta{display:grid;grid-template-columns:165px 1fr;gap:7px 14px;margin:12px 0 18px}.label{font-weight:700;color:#555}.supplierBox{border:1px solid rgba(216,163,127,.38);border-radius:12px;padding:13px 15px;margin:14px 0 22px;background:#fffdfb}.boxTitle{font-weight:800;margin-bottom:8px}.smallMeta{margin:0}h3{margin:18px 0 9px;font-size:16px}table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #e0d8d1;border-radius:12px;overflow:hidden}th{background:#f4eee9;color:#4a3a32;font-size:12px;text-transform:uppercase;letter-spacing:.03em}th,td{padding:9px 10px;border-bottom:1px solid #eee;font-size:13px;text-align:left}td.num,th:nth-last-child(-n+5){text-align:right}.totalCell{font-weight:700}.empty{text-align:center;color:#888;padding:22px}.totals{width:330px;margin:22px 0 0 auto;border-top:2px solid #c99b78;padding-top:10px}.totals div{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee}.totals .grand{font-weight:800;font-size:16px}.notes{margin-top:22px;padding-top:12px;border-top:1px solid #eee;white-space:pre-wrap}@media print{body{background:#fff}.page{box-shadow:none;margin:0;max-width:none;border-radius:0}.printBtn{display:none}}`; }

  function openDoc(kind){
    const d = currentEntryData();
    const w = window.open('', '_blank');
    if(!w){ alert('Popup blocked. Please allow popups to print.'); return; }
    w.document.open(); w.document.write(htmlFor(d, kind)); w.document.close();
    setTimeout(()=>{ try{ w.focus(); w.print(); }catch(e){} }, 350);
  }

  window.printEntryOrder = function(){
    const d = currentEntryData();
    if(d.type === 'deposit') return openDoc('deposit');
    if(isInvoiceContext(d)) return openDoc('invoice');
    if(typeof oldPrint === 'function') return oldPrint.apply(this, arguments);
    return openDoc('order');
  };
  window.emailEntryOrder = function(){
    const d = currentEntryData();
    if(d.type === 'deposit' || isInvoiceContext(d)){ openDoc(d.type === 'deposit' ? 'deposit' : 'invoice'); setTimeout(()=>alert('The branded print/PDF page is open. Use Share / Save PDF and attach it to Email.'),500); return; }
    if(typeof oldEmail === 'function') return oldEmail.apply(this, arguments);
    window.printEntryOrder();
  };
  window.whatsappEntryOrder = function(){
    const d = currentEntryData();
    if(d.type === 'deposit' || isInvoiceContext(d)){ openDoc(d.type === 'deposit' ? 'deposit' : 'invoice'); setTimeout(()=>alert('The branded print/PDF page is open. Use Share / Save PDF and send it in WhatsApp.'),500); return; }
    if(typeof oldWhatsApp === 'function') return oldWhatsApp.apply(this, arguments);
    window.printEntryOrder();
  };
})();
