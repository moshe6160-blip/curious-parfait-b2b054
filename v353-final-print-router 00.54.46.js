(function(){
  'use strict';
  if(window.__v353FinalPrintRouterLoaded) return;
  window.__v353FinalPrintRouterLoaded = true;

  function $(id){ return document.getElementById(id); }
  function val(id){ return String($(id)?.value || '').trim(); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function num(v){ var n = Number(String(v||'').replace(/[^0-9.\-]/g,'')); return isFinite(n) ? n : 0; }
  function money(v){ return num(v).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2}); }
  function field(tr,n){ return String(tr.querySelector('[data-field="'+n+'"]')?.value || '').trim(); }
  function cleanNotes(s){ return String(s||'').replace(/\[\[V\d+_[^\]]+\]\]/g,'').replace(/\[\[GL_ALLOCATIONS:[\s\S]*?\]\]/g,'').trim(); }

  function items(){
    var body = $('v309OrderItemsBody');
    if(!body) return [];
    return Array.from(body.querySelectorAll('tr')).map(function(tr,i){
      var qty = num(field(tr,'qty'));
      var price = num(field(tr,'price'));
      var disc = Math.max(0, Math.min(100, num(field(tr,'discount'))));
      var discAmount = qty * price * (disc/100);
      return {
        no:i+1,
        manual: field(tr,'manualDescription') || field(tr,'item'),
        desc: field(tr,'description'),
        code: field(tr,'codeDisplay') || field(tr,'glCode'),
        qty: field(tr,'qty'),
        price: field(tr,'price'),
        disc: field(tr,'discount'),
        discAmount: discAmount ? money(discAmount) : '',
        total: field(tr,'total')
      };
    }).filter(function(r){ return r.manual || r.desc || r.code || r.qty || r.price || r.disc || r.total; });
  }

  function supplierDetails(name){
    try{ if(typeof window.getSupplierDetails === 'function') return window.getSupplierDetails(name) || {}; }catch(e){}
    try{ return (JSON.parse(localStorage.getItem('vp_supplier_details_v325') || '{}') || {})[name] || {}; }catch(e){ return {}; }
  }

  function data(){
    var title = String(document.querySelector('#entryModalTitle, #entryModal h3, .modal h3')?.textContent || '');
    return {
      mode: String(val('entryMode')).toLowerCase(),
      type: String(val('entryType')).toLowerCase(),
      title: title,
      supplier: val('entrySupplier'),
      project: val('entryProject'),
      orderNo: val('entryOrderNo'),
      invoiceNo: val('entryInvoiceNo'),
      supplierOrderNo: val('entrySupplierOrderNo'),
      net: val('entryNetAmount'),
      vat: val('entryVatAmount'),
      total: val('entryTotal'),
      notes: cleanNotes(val('entryNotes')),
      items: items()
    };
  }

  function kind(d){
    var m = d.mode || '';
    var t = d.type || '';
    var title = (d.title || '').toLowerCase();
    if(m === 'delivery_note' || m === 'dn' || t === 'delivery_note' || t === 'dn' || /delivery note/.test(title)) return 'delivery_note';
    if(m === 'deposit' || t === 'deposit' || /deposit|advance/.test(title)) return 'deposit';
    if(m === 'invoice' || t === 'invoice' || d.invoiceNo || /invoice/.test(title)) return 'invoice';
    return 'order';
  }

  function labels(k){
    if(k === 'invoice') return {title:'INVOICE', sub:'Supplier invoice document', total:'Invoice Total'};
    if(k === 'delivery_note') return {title:'DELIVERY NOTE', sub:'Delivery note / supplied goods record', total:'Delivered Total'};
    if(k === 'deposit') return {title:'DEPOSIT / ADVANCE RECEIPT', sub:'Supplier advance / deposit record', total:'Deposit Total'};
    return {title:'PURCHASE ORDER', sub:'Official supplier purchase order', total:'Total After VAT'};
  }

  function css(){ return 'body{margin:0;background:#f7f4f0;color:#151515;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}.page{max-width:980px;margin:22px auto;background:#fff;padding:34px 38px;border-radius:18px;box-shadow:0 12px 34px rgba(0,0,0,.08)}.printBtn{float:right;border:0;border-radius:14px;padding:9px 17px;background:#eee;color:#111;font-weight:700}.brand{display:flex;align-items:center;gap:14px}.brand img{width:60px;height:60px;object-fit:contain}.brand h1{margin:0;font-size:23px;letter-spacing:.10em}.brand p{margin:3px 0;color:#666;font-size:12px}.line{height:2px;background:linear-gradient(90deg,#a87758,#ddb28f,#a87758);margin:22px 0}.docHead{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}.doc h2{margin:0;font-size:30px}.doc p{margin:5px 0;color:#666}.pill{border:1px solid #d3a37e;border-radius:18px;padding:8px 13px;font-weight:700}.meta{display:grid;grid-template-columns:170px 1fr;gap:7px 16px;margin:18px 0}.label{font-weight:800;color:#474747}.supplierBox{border:1px solid rgba(205,158,124,.45);border-radius:14px;padding:13px 15px;margin:14px 0 22px;background:#fffdfb}.boxTitle{font-weight:800;margin-bottom:8px}h3{margin:18px 0 10px;font-size:17px}table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #e4dcd5;border-radius:12px;overflow:hidden}th{background:#f3eee9;color:#493a32;font-size:11px;text-transform:uppercase;letter-spacing:.04em}th,td{padding:9px 10px;border-bottom:1px solid #eee;font-size:13px;text-align:left}td.num,th.num{text-align:right}.totalCell{font-weight:800}.empty{text-align:center;color:#888;padding:22px}.totals{width:350px;margin:24px 0 0 auto;border-top:2px solid #c99b78;padding-top:10px}.totals div{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #eee}.totals .grand{font-weight:900;font-size:16px}.notes{margin-top:22px;padding-top:12px;border-top:1px solid #eee;white-space:pre-wrap;font-size:12px;color:#555}.foot{margin-top:36px;display:flex;justify-content:space-between;gap:80px;color:#8a674d}.sig{flex:1;border-top:1px solid #c99b78;padding-top:8px}@media print{body{background:#fff}.page{box-shadow:none;margin:0;max-width:none;border-radius:0}.printBtn{display:none}}'; }

  function supplierBlock(name){
    var d = supplierDetails(name);
    var rows = [['Supplier', name], ['Contact Person', d.contactPerson || d.contact], ['Phone', d.phone], ['Email', d.email], ['Contractor Name', d.contractorName || d.contractor], ['Address', d.address]].filter(function(x){ return String(x[1]||'').trim(); });
    if(!rows.length) return '';
    return '<section class="supplierBox"><div class="boxTitle">Supplier Details</div><div class="meta">'+rows.map(function(x){ return '<div class="label">'+esc(x[0])+'</div><div>'+esc(x[1])+'</div>'; }).join('')+'</div></section>';
  }

  function html(d,k){
    var l = labels(k);
    var ref;
    if(k === 'invoice') ref = [['Invoice No', d.invoiceNo], ['Order No / PO', d.orderNo], ['Supplier Order No', d.supplierOrderNo], ['Project', d.project]];
    else if(k === 'delivery_note') ref = [['Delivery Note No', d.invoiceNo || d.orderNo], ['Order No / PO', d.orderNo], ['Supplier Order No', d.supplierOrderNo], ['Project', d.project]];
    else if(k === 'deposit') ref = [['Deposit No', d.orderNo || d.invoiceNo], ['Supplier', d.supplier], ['Project', d.project]];
    else ref = [['Order No', d.orderNo], ['Supplier Order No', d.supplierOrderNo], ['Project', d.project]];
    var rows = d.items.length ? d.items.map(function(r){ return '<tr><td>'+esc(r.no)+'</td><td>'+esc(r.manual)+'</td><td>'+esc(r.desc)+'</td><td>'+esc(r.code)+'</td><td class="num">'+esc(r.qty)+'</td><td class="num">'+esc(r.price)+'</td><td class="num">'+(r.disc?esc(r.disc)+'%':'')+'</td><td class="num">'+esc(r.discAmount)+'</td><td class="num totalCell">'+esc(r.total||'0.00')+'</td></tr>'; }).join('') : '<tr><td colspan="9" class="empty">No item lines</td></tr>';
    return '<!doctype html><html><head><meta charset="utf-8"><title>'+esc(l.title+' '+(d.invoiceNo||d.orderNo||''))+'</title><style>'+css()+'</style></head><body><div class="page"><button class="printBtn" onclick="window.print()">Print</button><div class="brand"><img src="assets/logo.png"><div><h1>VARDOPHASE</h1><p>Suppliers Cloud Pro</p></div></div><div class="line"></div><div class="docHead"><div class="doc"><h2>'+esc(l.title)+'</h2><p>'+esc(l.sub)+'</p></div><div class="pill">'+esc(new Date().toLocaleDateString())+'</div></div><section class="meta">'+ref.filter(function(x){return String(x[1]||'').trim();}).map(function(x){return '<div class="label">'+esc(x[0])+'</div><div>'+esc(x[1])+'</div>';}).join('')+'</section>'+supplierBlock(d.supplier)+'<h3>'+(k==='invoice'?'Invoice Items':(k==='delivery_note'?'Delivered Items':(k==='deposit'?'Deposit Details':'Items')))+'</h3><table><thead><tr><th>#</th><th>Manual Description</th><th>Description</th><th>GL Code</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Disc. %</th><th class="num">Disc. Amount</th><th class="num">Total</th></tr></thead><tbody>'+rows+'</tbody></table><div class="totals"><div><span>Net Before VAT</span><b>'+esc(money(d.net))+'</b></div><div><span>VAT Amount</span><b>'+esc(money(d.vat))+'</b></div><div class="grand"><span>'+esc(l.total)+'</span><b>'+esc(money(d.total))+'</b></div></div>'+(d.notes?'<div class="notes"><b>Notes</b><br>'+esc(d.notes)+'</div>':'')+'<div class="foot"><div class="sig">Prepared by</div><div class="sig">Approved by</div></div></div></body></html>';
  }

  function open(k){
    var d = data();
    var finalKind = k || kind(d);
    var w = window.open('', '_blank');
    if(!w){ alert('Popup blocked. Please allow popups to print.'); return; }
    w.document.open();
    w.document.write(html(d, finalKind));
    w.document.close();
    setTimeout(function(){ try{ w.focus(); w.print(); }catch(e){} }, 350);
  }

  function install(){
    window.vardoPrintCurrentDocument = function(){ return open(kind(data())); };
    window.printEntryOrder = window.vardoPrintCurrentDocument;
    window.printEntryInvoice = function(){ return open('invoice'); };
    window.printEntryDeliveryNote = function(){ return open('delivery_note'); };
    window.printEntryDeposit = function(){ return open('deposit'); };
    window.emailEntryOrder = function(){ window.vardoPrintCurrentDocument(); setTimeout(function(){ alert('The correct document is open. Use Print / Save PDF and attach it to Email.'); }, 450); };
    window.whatsappEntryOrder = function(){ window.vardoPrintCurrentDocument(); setTimeout(function(){ alert('The correct document is open. Use Share / Save PDF and send it in WhatsApp.'); }, 450); };
  }

  install();
  var until = Date.now() + 20000;
  var timer = setInterval(function(){ install(); if(Date.now() > until) clearInterval(timer); }, 250);
  window.addEventListener('focus', install);
  document.addEventListener('click', function(e){ if(e.target && /Print|Email|WhatsApp/i.test(e.target.textContent || '')) setTimeout(install,0); }, true);
})();
