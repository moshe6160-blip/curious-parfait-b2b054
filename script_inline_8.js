
(function(){
  if(window.__v277AccountingTrueNetLoaded) return;
  window.__v277AccountingTrueNetLoaded = true;
  function parseMoneyText(txt){ var s = String(txt || '').replace(/R/g,'').replace(/\s/g,'').replace(/,/g,'.').replace(/[^\d.-]/g,''); return Number(s || 0) || 0; }
  function moneyV277(n){ try{ if(typeof money === 'function') return money(Number(n||0)); }catch(e){} return 'R ' + Number(n||0).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function norm(t){ return String(t||'').trim().toLowerCase(); }
  function fixFinancialStatusDisplay(){
    try{
      var box = document.getElementById('safeFinancialStatus');
      if(!box) return;
      var byLabel = {};
      Array.from(box.querySelectorAll('.card')).forEach(function(card){
        var labelEl = card.querySelector('div');
        var valueEl = card.querySelector('b');
        if(!labelEl || !valueEl) return;
        byLabel[norm(labelEl.textContent)] = {label:labelEl,value:valueEl,amount:parseMoneyText(valueEl.textContent)};
      });
      var depCredit = byLabel['deposit / credit'];
      var depApplied = byLabel['deposit applied'] || byLabel['credit applied'];
      var creditBal = byLabel['credit balance'];
      var outstanding = byLabel['outstanding'];
      if(depApplied && depApplied.amount < 0){ depApplied.label.textContent = 'Credit Applied'; }
      if(creditBal){
        var hasRealSupplierDeposit = depCredit && depCredit.amount > 0;
        if(!hasRealSupplierDeposit || (depApplied && depApplied.amount < 0)){ creditBal.value.textContent = moneyV277(0); }
      }
      if(outstanding && outstanding.amount < 0){ outstanding.value.textContent = moneyV277(0); }
    }catch(e){ console.warn('V277 financial display fix skipped', e); }
  }
  function run(){ fixFinancialStatusDisplay(); }
  window.addEventListener('load', function(){ setTimeout(run,900); setTimeout(run,2200); setTimeout(run,4000); });
  document.addEventListener('click', function(){ setTimeout(run,800); }, true);
  document.addEventListener('change', function(){ setTimeout(run,800); }, true);
  setInterval(run,1500);
})();

/* === V279 CREDIT NOTE PDF - MODULE SAFE / LOGIN SAFE === */
(function(){
  if(window.__v279CreditNotePdfLoaded) return;
  window.__v279CreditNotePdfLoaded = true;

  function escPdf(v){
    return String(v == null ? '' : v).replace(/[&<>\"]/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c] || c;
    });
  }
  function moneyPdf(n){
    try{ if(typeof money === 'function') return money(Number(n || 0)); }catch(e){}
    return 'R ' + Number(n || 0).toLocaleString('en-ZA', {minimumFractionDigits:2, maximumFractionDigits:2});
  }
  function noteTagPdf(notes, name){
    var re = new RegExp('\\[\\[' + name + ':([\\s\\S]*?)\\]\\]', 'i');
    var m = String(notes || '').match(re);
    return m ? String(m[1] || '').trim() : '';
  }
  function latestCreditHistoryPdf(notes){
    var re = /\[\[CREDITHISTORY:([\s\S]*?)\]\]/gi;
    var m, last = '';
    while((m = re.exec(String(notes || '')))) last = m[1] || '';
    if(!last) return null;
    var p = last.split('|').map(function(x){ return String(x || '').trim(); });
    return {
      date: p[0] || '',
      no: p[1] || '',
      amount: Number(String(p[2] || '').replace(/[^0-9.-]/g,'')) || 0,
      reason: p.slice(3).join(' | ') || ''
    };
  }
  function isCreditRowPdf(row){
    var txt = [row.entry_type, row.status, row.process, row.description, row.invoice_no].map(function(x){return String(x || '').toLowerCase();}).join(' ');
    return txt.indexOf('credit_note') >= 0 || txt.indexOf('credit note') >= 0 || String(row.invoice_no || '').toUpperCase().indexOf('CN-') === 0;
  }
  function creditAmountFromInvoicePdf(row){
    try{ if(typeof extractCreditAmount === 'function') return Math.abs(Number(extractCreditAmount(row) || 0)); }catch(e){}
    return Math.abs(Number(noteTagPdf(row.notes, 'CREDIT') || noteTagPdf(row.notes, 'CREDITAMOUNT') || 0));
  }
  function buildCreditNotePdfData(row){
    var notes = String(row.notes || '');
    var hist = latestCreditHistoryPdf(notes);
    if(isCreditRowPdf(row)){
      return {
        cnNo: String(row.invoice_no || noteTagPdf(notes,'CREDITNO') || 'CN-DRAFT'),
        date: noteTagPdf(notes,'CREDITDATE') || (row.created_at ? String(row.created_at).slice(0,10) : new Date().toISOString().slice(0,10)),
        supplier: row.supplier || '',
        project: row.project || '',
        orderNo: row.order_no || '',
        invoiceRef: noteTagPdf(notes,'PARENTINVOICE') || noteTagPdf(notes,'CREDITPARENT') || '',
        reason: noteTagPdf(notes,'CREDITREASON') || String(row.description || '').replace(/^Credit Note\s*-?\s*/i,'') || 'Credit note',
        amount: Math.abs(Number(row.total || row.amount || row.net_amount || noteTagPdf(notes,'CREDITAMOUNT') || 0)),
        vat: Math.abs(Number(row.vat_amount || 0))
      };
    }
    return {
      cnNo: (hist && hist.no) || noteTagPdf(notes,'LASTCREDITNO') || noteTagPdf(notes,'CREDITNO') || ('CN-' + String(row.invoice_no || row.id || 'DRAFT')),
      date: (hist && hist.date) || noteTagPdf(notes,'LASTCREDITDATE') || noteTagPdf(notes,'CREDITDATE') || new Date().toISOString().slice(0,10),
      supplier: row.supplier || '',
      project: row.project || '',
      orderNo: row.order_no || '',
      invoiceRef: row.invoice_no || '',
      reason: (hist && hist.reason) || noteTagPdf(notes,'LASTCREDITREASON') || noteTagPdf(notes,'CREDITREASON') || 'Credit note',
      amount: (hist && hist.amount) || creditAmountFromInvoicePdf(row),
      vat: 0
    };
  }
  function openCreditNotePdfWindow(cn){
    var total = Math.max(0, Number(cn.amount || 0));
    var vat = Math.max(0, Number(cn.vat || 0));
    var subtotal = Math.max(0, total - vat);
    var w = window.open('', '_blank');
    if(!w) return alert('Popup blocked. Allow popups and try again.');
    w.document.write(`<!doctype html><html><head><title>${escPdf(cn.cnNo)} Credit Note</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>@page{size:A4;margin:14mm}*{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#111;color:#f7efe4}.sheet{min-height:100vh;padding:34px;border:2px solid #c9a46a;background:radial-gradient(circle at top left,rgba(221,188,124,.18),transparent 32%),linear-gradient(145deg,#070707,#171717)}.top{display:flex;justify-content:space-between;gap:24px;border-bottom:1px solid rgba(201,164,106,.55);padding-bottom:22px}.brand{font-size:28px;font-weight:900;letter-spacing:.06em}.sub{color:#d7c29a;font-size:12px;margin-top:6px}.title{text-align:right}.title h1{margin:0;color:#f4d79b;font-size:34px;letter-spacing:.08em}.pill{display:inline-block;margin-top:8px;padding:8px 14px;border:1px solid #c9a46a;border-radius:999px;color:#fff}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:26px}.box{border:1px solid rgba(201,164,106,.45);border-radius:16px;padding:16px;background:rgba(255,255,255,.035)}.label{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#d7c29a}.value{font-size:18px;font-weight:800;margin-top:6px;color:#fff}.table{width:100%;border-collapse:collapse;margin-top:28px}.table th{background:rgba(201,164,106,.22);color:#f4d79b;text-align:left;padding:13px;border-bottom:1px solid rgba(201,164,106,.45);font-size:12px;text-transform:uppercase;letter-spacing:.08em}.table td{padding:14px;border-bottom:1px solid rgba(255,255,255,.12);color:#fff}.amount{text-align:right;font-weight:900}.negative{color:#ffdf9a}.totals{margin-top:22px;margin-left:auto;width:310px}.totrow{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.12)}.grand{font-size:22px;color:#f4d79b;font-weight:900}.note{margin-top:30px;color:#d8d8d8;line-height:1.5}.sign{margin-top:54px;display:flex;justify-content:space-between;gap:30px}.line{border-top:1px solid rgba(201,164,106,.7);padding-top:8px;width:260px;color:#d7c29a}@media print{body{background:#fff}.sheet{min-height:auto;background:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact}.no-print{display:none}}</style>
<style id="v303-clean-no-text-shadow-final">
/* V303: remove text shadow from opened menus and description/list pills; keep rose-gold + black regular dropdown text. */
#app .custom-select-menu,
#app .custom-select-menu *,
#loginScreen .custom-select-menu,
#loginScreen .custom-select-menu *,
#contractorsProScreen .custom-select-menu,
#contractorsProScreen .custom-select-menu *,
.custom-select-menu,
.custom-select-menu *,
.custom-select-item,
div[role="option"],
.custom-select-menu [role="option"] {
  text-shadow: none !important;
  -webkit-text-stroke: 0 !important;
  filter: none !important;
  color: #050505 !important;
  -webkit-text-fill-color: #050505 !important;
  font-weight: 400 !important;
}

#app .custom-select-menu .custom-select-item.placeholder,
#contractorsProScreen .custom-select-menu .custom-select-item.placeholder {
  color: #050505 !important;
  -webkit-text-fill-color: #050505 !important;
  font-weight: 400 !important;
}

/* Remove the glow/shadow from the description chips under Manage Lists */
#app .chips,
#app .chips *,
#app .chip,
#app .chip *,
#contractorsProScreen .chips,
#contractorsProScreen .chips *,
#contractorsProScreen .chip,
#contractorsProScreen .chip *,
.table-wrap .chip,
.table-wrap .chip * {
  text-shadow: none !important;
  -webkit-text-stroke: 0 !important;
  filter: none !important;
}

/* Keep dark field labels readable, but remove only the heavy glow where it affects form/menu UI */
#app .modal-box .custom-select-btn,
#app .modal-box .custom-select-btn *,
#app .modal-box input,
#app .modal-box textarea,
#app .modal-box select {
  text-shadow: none !important;
  -webkit-text-stroke: 0 !important;
  filter: none !important;
}
</style>
</head><body><div class="sheet"><div class="top"><div><div class="brand">VARDOPHASE</div><div class="sub">Suppliers Cloud Pro · Official Accounting Document</div></div><div class="title"><h1>CREDIT NOTE</h1><div class="pill">${escPdf(cn.cnNo)}</div></div></div><div class="grid"><div class="box"><div class="label">Supplier</div><div class="value">${escPdf(cn.supplier)}</div></div><div class="box"><div class="label">Date</div><div class="value">${escPdf(cn.date)}</div></div><div class="box"><div class="label">Original Invoice</div><div class="value">${escPdf(cn.invoiceRef)}</div></div><div class="box"><div class="label">Order / Project</div><div class="value">${escPdf(cn.orderNo)}${cn.project ? ' · ' + escPdf(cn.project) : ''}</div></div></div><table class="table"><thead><tr><th>Description</th><th>VAT</th><th class="amount">Credit Amount</th></tr></thead><tbody><tr><td>${escPdf(cn.reason)}</td><td>${moneyPdf(vat)}</td><td class="amount negative">-${moneyPdf(total)}</td></tr></tbody></table><div class="totals"><div class="totrow"><span>Subtotal</span><b>-${moneyPdf(subtotal)}</b></div><div class="totrow"><span>VAT</span><b>-${moneyPdf(vat)}</b></div><div class="totrow grand"><span>Total Credit</span><b>-${moneyPdf(total)}</b></div></div><div class="note"><b>Accounting note:</b> This credit note is linked to the original invoice above. It reduces the net payable amount for that invoice and does not create a free supplier credit balance.</div><div class="sign"><div class="line">Prepared by</div><div class="line">Approved by</div></div><p class="no-print" style="margin-top:28px"><button onclick="window.print()" style="padding:12px 18px;border-radius:12px;border:1px solid #c9a46a;background:#c9a46a;color:#111;font-weight:900">Print / Save PDF</button></p></div><script>setTimeout(function(){window.print()},500)<\/script></body></html>`);
    w.document.close();
  }

  window.printSelectedCreditNotePDF = async function(){
    try{
      var ids = (typeof window.__vpGetSelectedIds === 'function') ? window.__vpGetSelectedIds() : [];
      if(!Array.isArray(ids) || ids.length !== 1) return alert('Select one Credit Note row, or the original Invoice row that has a Credit Note.');
      var db = window.__vpDb || window.vpSupabase;
      if(!db) return alert('Database connection is not ready. Refresh and try again.');
      var id = ids[0];
      var res = await db.from('suppliers').select('*').eq('id', id).single();
      if(res.error || !res.data) return alert(res.error?.message || 'Could not load selected row.');
      var cn = buildCreditNotePdfData(res.data);
      if(!cn.amount || cn.amount <= 0) return alert('No Credit Note amount found on the selected row. Select the Credit Note row or the original Invoice row after credit was created.');
      openCreditNotePdfWindow(cn);
    }catch(err){
      alert((err && err.message) ? err.message : 'Credit Note PDF error');
    }
  };

  function addCreditNotePdfButton(){
    try{
      document.querySelectorAll('.credit-note-btn-pro,.credit-note-btn').forEach(function(btn){
        var p = btn.parentElement;
        if(!p || p.querySelector('.cn-pdf-btn-pro')) return;
        var b = document.createElement('button');
        b.className = 'cn-pdf-btn-pro main-action';
        b.textContent = 'CN PDF';
        b.onclick = window.printSelectedCreditNotePDF;
        btn.insertAdjacentElement('afterend', b);
      });
    }catch(e){}
  }
  var pdfCss = document.createElement('style');
  pdfCss.textContent = '.cn-pdf-btn-pro{color:#111!important;background:linear-gradient(145deg,#fff4d0,#c9a46a)!important;border:1px solid rgba(255,228,164,.75)!important;font-weight:900!important}.cn-pdf-btn-pro:hover{filter:brightness(1.08)}';
  document.head.appendChild(pdfCss);
  window.addEventListener('load', function(){ setTimeout(addCreditNotePdfButton,900); setTimeout(addCreditNotePdfButton,2200); });
  document.addEventListener('click', function(){ setTimeout(addCreditNotePdfButton,500); }, true);
  setInterval(addCreditNotePdfButton,1500);
})();


/* === V280 PRINT FRIENDLY REPORTS - WHITE GOLD - LOGIN SAFE === */
(function(){
 if(window.__v280Reports) return; window.__v280Reports=true;
 const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const m=n=>{try{if(typeof money==='function')return money(Number(n||0));}catch(e){} return 'R '+Number(n||0).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2});};
 const d=v=>{try{if(typeof localDateFromAnyV97==='function')return localDateFromAnyV97(v);}catch(e){} return String(v||'').slice(0,10);};
 const mon=()=>{try{if(typeof reportMonthLabel==='function')return reportMonthLabel();}catch(e){} return new Date().toISOString().slice(0,7);};
 const k=r=>{try{if(typeof displayEntryKind==='function')return displayEntryKind(r);}catch(e){} return String(r.entry_type||r.status||'');};
 const lab=r=>{try{if(typeof processStatusLabel==='function')return processStatusLabel(r);}catch(e){} return k(r);};
 const b=r=>{try{if(typeof depositBaseAmount==='function')return depositBaseAmount(r);}catch(e){} return Number(r.total||r.amount||0)||0;};
 const get=async()=>{try{return await getEntries();}catch(e){alert('Report data is still loading. Refresh and try again.');return [];}};
 const css='<style>@page{size:A4;margin:12mm}*{box-sizing:border-box}html,body{margin:0;background:#fff;color:#161616;font-family:Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}.sheet{max-width:1120px;margin:0 auto;padding:34px;background:#fff;border:2px solid #c9a46a;min-height:100vh}.top{display:flex;justify-content:space-between;gap:22px;border-bottom:1.5px solid #c9a46a;padding-bottom:22px;margin-bottom:26px}.brand{font-size:30px;font-weight:900;letter-spacing:.07em;color:#151515}.sub{color:#8a6a37;font-size:13px;margin-top:6px;line-height:1.35}.title{text-align:right}.title h1{margin:0;color:#b8893d;font-size:32px;letter-spacing:.07em;text-transform:uppercase}.pill{display:inline-block;margin-top:9px;padding:8px 14px;border:1px solid #c9a46a;border-radius:999px;color:#151515;font-weight:800}.grid{display:grid;grid-template-columns:repeat(4,minmax(150px,1fr));gap:12px;margin:18px 0 26px}.card{border:1px solid rgba(201,164,106,.65);border-radius:16px;padding:14px 16px;background:#fff}.label{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#8a6a37;font-weight:800}.value{font-size:18px;font-weight:900;margin-top:7px;color:#111}.section-title{font-size:18px;font-weight:900;color:#b8893d;margin:26px 0 6px;text-transform:uppercase;letter-spacing:.06em}.wide{overflow:auto}table{width:100%;border-collapse:collapse;margin-top:14px;font-size:12px}th{background:#f5ead7;color:#6f4e18;text-align:left;padding:11px;border-bottom:2px solid #c9a46a;text-transform:uppercase;letter-spacing:.06em;font-size:11px}td{padding:10px;border-bottom:1px solid #e7dcc9;color:#151515;vertical-align:top}tr:nth-child(even) td{background:#fffaf1}.amount{text-align:right;font-weight:800;white-space:nowrap}.note{margin-top:24px;color:#555;line-height:1.5}.sign{margin-top:45px;display:flex;justify-content:space-between;gap:30px}.line{border-top:1px solid #c9a46a;padding-top:8px;width:260px;color:#8a6a37}.btn,.report-back-btn{padding:10px 14px;border:1px solid #c9a46a;border-radius:10px;background:#fff;color:#111;font-weight:900}.btn{background:#c9a46a}@media(max-width:800px){.sheet{padding:22px;border-width:1px}.top{display:block}.title{text-align:left;margin-top:20px}.grid{grid-template-columns:1fr 1fr}}@media print{.no-print,.report-back-btn{display:none!important}.sheet{border:1px solid #c9a46a;min-height:auto}tr{break-inside:avoid}}</style>';
 function openR(title,sub,body){const w=window.open('','_blank'); if(!w){alert('Popup blocked. Allow popups for reports.');return;} w.document.write('<!doctype html><html><head><title>'+esc(title)+'</title><meta name="viewport" content="width=device-width,initial-scale=1">'+css+'
<style id="v303-clean-no-text-shadow-final">
/* V303: remove text shadow from opened menus and description/list pills; keep rose-gold + black regular dropdown text. */
#app .custom-select-menu,
#app .custom-select-menu *,
#loginScreen .custom-select-menu,
#loginScreen .custom-select-menu *,
#contractorsProScreen .custom-select-menu,
#contractorsProScreen .custom-select-menu *,
.custom-select-menu,
.custom-select-menu *,
.custom-select-item,
div[role="option"],
.custom-select-menu [role="option"] {
  text-shadow: none !important;
  -webkit-text-stroke: 0 !important;
  filter: none !important;
  color: #050505 !important;
  -webkit-text-fill-color: #050505 !important;
  font-weight: 400 !important;
}

#app .custom-select-menu .custom-select-item.placeholder,
#contractorsProScreen .custom-select-menu .custom-select-item.placeholder {
  color: #050505 !important;
  -webkit-text-fill-color: #050505 !important;
  font-weight: 400 !important;
}

/* Remove the glow/shadow from the description chips under Manage Lists */
#app .chips,
#app .chips *,
#app .chip,
#app .chip *,
#contractorsProScreen .chips,
#contractorsProScreen .chips *,
#contractorsProScreen .chip,
#contractorsProScreen .chip *,
.table-wrap .chip,
.table-wrap .chip * {
  text-shadow: none !important;
  -webkit-text-stroke: 0 !important;
  filter: none !important;
}

/* Keep dark field labels readable, but remove only the heavy glow where it affects form/menu UI */
#app .modal-box .custom-select-btn,
#app .modal-box .custom-select-btn *,
#app .modal-box input,
#app .modal-box textarea,
#app .modal-box select {
  text-shadow: none !important;
  -webkit-text-stroke: 0 !important;
  filter: none !important;
}
</style>
</head><body><div class="sheet"><button class="report-back-btn" onclick="if(window.opener){window.close()}else{history.back()}">← Back</button><div class="top"><div><div class="brand">VARDOPHASE</div><div class="sub">Suppliers Cloud Pro · Official Accounting Document<br>'+esc(sub||'')+'</div></div><div class="title"><h1>'+esc(title)+'</h1><div class="pill">'+esc(mon())+'</div></div></div>'+body+'<div class="note"><b>Accounting note:</b> Generated from Vardophase Suppliers Cloud Pro.</div><div class="sign"><div class="line">Prepared by</div><div class="line">Approved by</div></div><p class="no-print"><button class="btn" onclick="window.print()">Print / Save PDF</button></p></div><script>setTimeout(function(){window.print()},450)<\/script></body></html>');w.document.close();}
 function table(h,rs){return '<div class="wide"><table><thead><tr>'+h.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rs.map(r=>'<tr>'+r.map((c,i)=>'<td class="'+(/amount|total|vat|credit|balance|due|applied|order|invoice|delivered|outstanding/i.test(h[i]||'')?'amount':'')+'">'+esc(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';}
 function cards(a){return '<div class="grid">'+a.map(x=>'<div class="card"><div class="label">'+esc(x[0])+'</div><div class="value">'+esc(x[1])+'</div></div>').join('')+'</div>';}
 function sum(rs){let s={orders:0,invoices:0,delivered:0,deposits:0,due:0,credit:0,count:rs.length};rs.forEach(r=>{let kk=k(r),bb=b(r);if(kk==='deposit')s.deposits+=bb;else if(kk==='invoice'){s.invoices+=bb;s.due+=Number(r.amount_due||0);}else if(kk==='credit_note'||/credit/i.test(kk))s.credit+=Math.abs(bb);else s.orders+=bb;s.delivered+=Number(r.delivered||0);});return s;}
 function group(rs,key){let g={};rs.forEach(r=>{let name=r[key]||'Unassigned';if(!g[name])g[name]={orders:0,invoices:0,delivered:0,due:0,credit:0,count:0};let kk=k(r),bb=b(r);g[name].count++;if(kk==='invoice'){g[name].invoices+=bb;g[name].due+=Number(r.amount_due||0);}else if(kk==='credit_note'||/credit/i.test(kk))g[name].credit+=Math.abs(bb);else if(kk!=='deposit')g[name].orders+=bb;g[name].delivered+=Number(r.delivered||0);});return Object.entries(g).sort((a,b)=>String(a[0]).localeCompare(String(b[0])));}
 window.printMonthlyReport=async()=>{let rs=await get(),s=sum(rs);openR('Monthly Report','Print friendly white / gold report',cards([['Orders',m(s.orders)],['Delivered',m(s.delivered)],['Invoiced Net',m(s.invoices)],['Credit Applied',m(-s.credit)],['Outstanding',m(s.due)],['Entries',s.count]])+'<div class="section-title">Detailed Entries</div>'+table(['Date','Supplier','Process','Order No','Invoice No','Project','Description','Net','VAT','Total','Credit Applied','Amount Due','Status'],rs.map(r=>[d(r.created_at),r.supplier||'',lab(r),r.order_no||'',r.invoice_no||'',r.project||'',r.description||'',m(r.net_amount||0),m(r.vat_amount||0),m(r.total||r.amount||0),m(r.deposit_applied||0),m(r.amount_due||0),r.status||''])));};
 window.printProjectSummary=async()=>{let rs=await get(),gs=group(rs,'project');openR('Project Report','Project financial summary',cards([['Projects',gs.length],['Period',mon()]])+'<div class="section-title">Project Summary</div>'+table(['Project','Orders','Delivered','Invoices Net','Credit Applied','Outstanding'],gs.map(x=>[x[0],m(x[1].orders),m(x[1].delivered),m(x[1].invoices),m(-x[1].credit),m(x[1].due)])));};
 window.printSupplierDepositReport=async()=>{let rs=await get(),supplier=(window.uiState&&uiState.supplier)||'';if(supplier)rs=rs.filter(r=>(r.supplier||'')===supplier);let gs=group(rs,'supplier'),s=sum(rs);let body=cards([['Suppliers',gs.length],['Invoices Net',m(s.invoices)],['Credit Applied',m(-s.credit)],['Outstanding',m(s.due)],['Credit Balance',m(0)],['Basis','After VAT / Total']])+'<div class="section-title">Supplier Credit Statement</div>'+table(['Supplier','Orders','Delivered','Invoices Net','Credit Applied','Outstanding','Entries'],gs.map(x=>[x[0],m(x[1].orders),m(x[1].delivered),m(x[1].invoices),m(-x[1].credit),m(x[1].due),x[1].count]));if(supplier)body+='<div class="section-title">Transactions</div>'+table(['Date','Type','Reference','Project','Amount','Balance'],rs.map(r=>[d(r.created_at),lab(r),r.invoice_no||r.order_no||'',r.project||'',m(r.total||r.amount||0),m(r.amount_due||0)]));openR('Supplier Credit Statement','Supplier ledger and credit movement',body);};
 window.printOpenOrdersReport=async()=>{let rs=(await get()).filter(r=>k(r)==='order'||/order/i.test(lab(r)));openR('Open Orders Report','Outstanding open purchase orders',cards([['Open Orders',rs.length],['Period',mon()]])+'<div class="section-title">Open Orders</div>'+table(['Date','Supplier','Order No','Project','Amount','Days Open','Status'],rs.map(r=>[d(r.created_at),r.supplier||'',r.order_no||'',r.project||'',m(r.total||r.amount||0),String((typeof daysOld==='function'?daysOld(r.created_at):0)),r.status||'Open'])));};
 window.printTransparencyReport=async()=>{let rs=await get();openR('Transparency Report','Full audit view of supplier entries',cards([['Records',rs.length],['Period',mon()]])+'<div class="section-title">Transparency Detail</div>'+table(['Date','Supplier','Process','Order','Invoice','Project','Status','Created By','Notes'],rs.map(r=>[d(r.created_at),r.supplier||'',lab(r),r.order_no||'',r.invoice_no||'',r.project||'',r.status||'',r.created_by||'',String(r.notes||'').slice(0,120)])));};
 window.printProjectTransparencyReport=async()=>{let rs=await get(),gs=group(rs,'project');openR('Project Transparency','Project-by-project audit view',gs.map(x=>'<div class="section-title">'+esc(x[0])+'</div>'+table(['Date','Supplier','Process','Order','Invoice','Amount','Status'],rs.filter(r=>(r.project||'Unassigned')===x[0]).map(r=>[d(r.created_at),r.supplier||'',lab(r),r.order_no||'',r.invoice_no||'',m(r.total||r.amount||0),r.status||'']))).join(''));};
 window.printSelectedCreditNotePDF=async()=>{try{let ids=(typeof window.__vpGetSelectedIds==='function')?window.__vpGetSelectedIds():[];if(!Array.isArray(ids)||ids.length!==1)return alert('Select one Credit Note row, or the original Invoice row that has a Credit Note.');let db=window.__vpDb||window.vpSupabase;if(!db)return alert('Database connection is not ready. Refresh and try again.');let res=await db.from('suppliers').select('*').eq('id',ids[0]).single();if(res.error||!res.data)return alert((res.error&&res.error.message)||'Could not load selected row.');let r=res.data,notes=String(r.notes||'');let tag=n=>{let mm=notes.match(new RegExp('\\[\\['+n+':([\\s\\S]*?)\\]\\]','i'));return mm?String(mm[1]||'').trim():'';};let amt=Math.abs(Number(r.total||r.amount||r.net_amount||tag('CREDITAMOUNT')||tag('CREDIT')||0));if(!amt)return alert('No Credit Note amount found on the selected row.');let cn=String(r.invoice_no||tag('CREDITNO')||tag('LASTCREDITNO')||'CN-DRAFT'),date=tag('CREDITDATE')||tag('LASTCREDITDATE')||(r.created_at?String(r.created_at).slice(0,10):new Date().toISOString().slice(0,10)),inv=tag('PARENTINVOICE')||'',reason=tag('CREDITREASON')||tag('LASTCREDITREASON')||String(r.description||'').replace(/^Credit Note\s*-?\s*/i,'')||'Credit note',vat=Math.abs(Number(r.vat_amount||0)),sub=Math.max(0,amt-vat);openR('Credit Note','Official Accounting Document · '+cn,'<div class="grid"><div class="card"><div class="label">Supplier</div><div class="value">'+esc(r.supplier||'')+'</div></div><div class="card"><div class="label">Date</div><div class="value">'+esc(date)+'</div></div><div class="card"><div class="label">Original Invoice</div><div class="value">'+esc(inv)+'</div></div><div class="card"><div class="label">Order / Project</div><div class="value">'+esc(r.order_no||'')+(r.project?' · '+esc(r.project):'')+'</div></div></div>'+table(['Description','VAT','Credit Amount'],[[reason,m(vat),'-'+m(amt)]])+cards([['Subtotal','-'+m(sub)],['VAT','-'+m(vat)],['Total Credit','-'+m(amt)]])+'<div class="note"><b>Accounting note:</b> This credit note is linked to the original invoice. It reduces the net payable amount for that invoice and does not create a free supplier credit balance.</div>');}catch(e){alert((e&&e.message)?e.message:'Credit Note PDF error');}};
})();

