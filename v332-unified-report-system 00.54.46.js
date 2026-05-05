(function(){
  'use strict';
  if(window.__v332UnifiedReportSystem) return;
  window.__v332UnifiedReportSystem = true;

  const LOGO = 'assets/logo.png';
  const ROSE = '#d8a37f';
  const ROSE_DARK = '#9d6f52';

  function esc(v){
    return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function num(v){ return Number(String(v ?? '').replace(/,/g,'.')) || 0; }
  function money(v){
    try{ if(typeof window.money === 'function') return window.money(num(v)); }catch(e){}
    return num(v).toLocaleString('en-ZA',{minimumFractionDigits:2, maximumFractionDigits:2});
  }
  function date(v){
    try{ if(typeof window.localDateFromAnyV97 === 'function') return window.localDateFromAnyV97(v); }catch(e){}
    return v ? String(v).slice(0,10) : new Date().toLocaleDateString();
  }
  function period(){
    try{ if(typeof window.reportMonthLabel === 'function') return window.reportMonthLabel(); }catch(e){}
    return new Date().toISOString().slice(0,7);
  }
  function kind(r){
    try{ if(typeof window.displayEntryKind === 'function') return window.displayEntryKind(r); }catch(e){}
    return String(r?.entry_type || r?.process || r?.status || '');
  }
  function label(r){
    try{ if(typeof window.processStatusLabel === 'function') return window.processStatusLabel(r); }catch(e){}
    const k = kind(r);
    return k ? k.charAt(0).toUpperCase()+k.slice(1) : '';
  }
  function baseAmount(r){
    try{ if(typeof window.depositBaseAmount === 'function') return window.depositBaseAmount(r); }catch(e){}
    return num(r?.total || r?.amount || r?.net_amount || 0);
  }
  function computeReportLedger(rows){
    const sorted = [...(rows||[])].sort((a,b)=>{
      const ad = a.created_at || '';
      const bd = b.created_at || '';
      if(ad !== bd) return String(ad).localeCompare(String(bd));
      return String(a.id||'').localeCompare(String(b.id||''));
    });
    const totalDeposits = {};
    sorted.forEach(r=>{
      const supplier = r.supplier || 'Unknown';
      const type = String(r.entry_type || 'invoice').toLowerCase();
      const amount = num(r.total || r.amount || 0);
      if(type === 'deposit') totalDeposits[supplier] = (totalDeposits[supplier] || 0) + amount;
    });
    const used = {};
    return sorted.map(r=>{
      const e = {...r};
      const supplier = e.supplier || 'Unknown';
      const type = String(e.entry_type || 'invoice').toLowerCase();
      const amount = num(e.total || e.amount || 0);
      const availableBefore = Math.max(0, num(totalDeposits[supplier]) - num(used[supplier]));
      e.entry_type = type;
      if(type === 'deposit'){
        e.status = e.status || 'Deposit';
        e.deposit_applied = 0;
        e.amount_due = 0;
      }else{
        const applied = Math.min(availableBefore, amount);
        e.deposit_applied = num(e.deposit_applied || applied);
        e.amount_due = (e.amount_due !== undefined && e.amount_due !== null && e.amount_due !== '') ? num(e.amount_due) : Math.max(0, amount - applied);
        used[supplier] = num(used[supplier]) + applied;
        if(!e.status){ e.status = e.amount_due <= 0 && amount > 0 ? 'Covered' : 'Unpaid'; }
      }
      e.supplier_credit_balance = Math.max(0, num(totalDeposits[supplier]) - num(used[supplier]));
      return e;
    }).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
  }

  async function getRows(){
    // The main app is inside a module, so its getAllRows()/getEntries() are not always on window.
    // Use the shared Supabase client directly so every report has real database data.
    try{
      const client = window.vpSupabase;
      if(client && client.from){
        const res = await client.from('suppliers').select('*').order('created_at', {ascending:false}).limit(5000);
        if(res.error) throw res.error;
        return computeReportLedger(res.data || []);
      }
    }catch(e){ console.warn('V336 direct report data failed', e); }
    try{ if(typeof window.getAllRows === 'function') return await window.getAllRows(); }catch(e){ console.warn('V336 getAllRows failed', e); }
    try{ if(typeof window.getEntries === 'function') return await window.getEntries(); }catch(e){ console.warn('V336 getEntries fallback failed', e); }
    return [];
  }
  function cleanNotes(s){ return String(s||'').replace(/\[\[V\d+_[^\]]+\]\][A-Za-z0-9+/=]*/g,'').replace(/\[\[GL_ALLOCATIONS:[\s\S]*?\]\]/g,'').trim(); }

  function reportCss(){
    return `
      @page{size:A4;margin:12mm}
      *{box-sizing:border-box}
      html,body{margin:0;padding:0;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      body{font-size:13px;line-height:1.35}
      .vp-page{width:100%;max-width:1040px;margin:0 auto;padding:26px 28px 30px;background:#fff;overflow:hidden}
      .vp-brand{display:flex;align-items:center;gap:15px;border-bottom:2px solid ${ROSE};padding-bottom:12px;margin-bottom:21px}
      .vp-logo{width:58px;height:58px;object-fit:contain;flex:0 0 58px;display:block;background:transparent;border:0;box-shadow:none}
      .vp-brand-title{font-size:27px;font-weight:900;letter-spacing:2px;line-height:1.05;color:#111;white-space:nowrap}
      .vp-brand-sub{font-size:13px;color:#555;margin-top:4px;white-space:nowrap}
      .vp-print-btn{margin-left:auto;border:0;border-radius:18px;padding:9px 17px;background:#eeeeee;color:#111;font-weight:800;cursor:pointer}
      .vp-title{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin:10px 0 18px}
      .vp-title h1{font-size:29px;margin:0 0 6px;color:#111;letter-spacing:.15px}
      .vp-subtitle{color:#666;font-size:13px;max-width:620px}
      .vp-pill{border:1px solid ${ROSE};color:#111;border-radius:999px;padding:7px 12px;white-space:nowrap;font-weight:800;background:#fffaf6}
      .vp-meta{display:grid;grid-template-columns:170px minmax(0,1fr);gap:6px 16px;margin:12px 0 22px}
      .vp-meta-label{font-weight:800;color:#111}.vp-meta-value{min-width:0;overflow-wrap:anywhere}
      .vp-cards{display:grid;grid-template-columns:repeat(4,minmax(145px,1fr));gap:12px;margin:16px 0 24px}
      .vp-card{border:1px solid rgba(216,163,127,.50);border-radius:14px;padding:12px 14px;background:#fffaf6;min-height:74px}
      .vp-card-label{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:${ROSE_DARK};font-weight:900}
      .vp-card-value{font-size:18px;font-weight:900;color:#111;margin-top:7px;overflow-wrap:anywhere}
      .vp-section{font-size:17px;font-weight:900;margin:25px 0 8px;color:#111;border-bottom:1px solid #ead0be;padding-bottom:6px}
      .vp-table-wrap{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
      table.vp-table{width:100%;border-collapse:collapse;margin:8px 0 14px;table-layout:auto}
      .vp-table th{background:#f5eee9;color:#111;border-bottom:2px solid ${ROSE};padding:8px 9px;text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:.055em;white-space:nowrap}
      .vp-table td{border-bottom:1px solid #eadfd8;padding:8px 9px;font-size:12px;vertical-align:middle;overflow-wrap:anywhere}
      .vp-table tr:nth-child(even) td{background:#fffaf6}
      .vp-table th:nth-last-child(-n+6),.vp-table td:nth-last-child(-n+6){text-align:right;white-space:nowrap}
      .vp-table td:last-child{font-weight:800;color:#111}
      .vp-amount{text-align:right;font-weight:800;white-space:nowrap}
      .vp-order-totals{width:335px;margin:20px 0 0 auto;border-top:2px solid ${ROSE};padding-top:8px}
      .vp-order-totals table.vp-table{margin:0}
      .vp-order-totals .vp-table th{background:#fff;border-bottom:1px solid #eadfd8;padding:6px 8px;color:#111;letter-spacing:.08em}
      .vp-order-totals .vp-table td{padding:7px 8px;border-bottom:1px solid #eadfd8;background:#fff!important}
      .vp-order-totals .vp-table tr:last-child td{font-size:14px;font-weight:900;border-bottom:0}
      .vp-note{margin-top:24px;padding-top:12px;border-top:1px solid #eadfd8;color:#666;font-size:12px}
      .vp-sign{display:flex;justify-content:space-between;gap:40px;margin-top:46px;color:${ROSE_DARK}}
      .vp-sign div{border-top:1px solid ${ROSE};padding-top:8px;width:260px}
      @media(max-width:760px){.vp-page{padding:20px 18px}.vp-brand{gap:12px}.vp-logo{width:52px;height:52px;flex-basis:52px}.vp-brand-title{font-size:22px;letter-spacing:1.5px}.vp-brand-sub{font-size:12px}.vp-title{display:block}.vp-pill{display:inline-block;margin-top:8px}.vp-cards{grid-template-columns:1fr 1fr}.vp-meta{grid-template-columns:130px minmax(0,1fr)}.vp-table{min-width:760px}.vp-print-btn{padding:8px 14px}.vp-order-totals{width:100%;max-width:360px}}
      @media print{.vp-print-btn,.no-print{display:none!important}.vp-page{max-width:none;padding:0}.vp-table-wrap{overflow:visible}.vp-sign{break-inside:avoid}.vp-logo{width:54px;height:54px;flex-basis:54px}.vp-brand-title{font-size:24px}.vp-brand-sub{font-size:12px}.vp-title h1{font-size:26px}tr{break-inside:avoid}.vp-order-totals{break-inside:avoid}}
    `;
  }
  function headerHtml(title, subtitle, right){
    return `<div class="vp-brand"><img class="vp-logo" src="${LOGO}" alt="Vardophase logo"><div><div class="vp-brand-title">VARDOPHASE</div><div class="vp-brand-sub">Suppliers Cloud Pro</div></div><button class="vp-print-btn" onclick="window.print()">Print</button></div><div class="vp-title"><div><h1>${esc(title)}</h1>${subtitle?`<div class="vp-subtitle">${esc(subtitle)}</div>`:''}</div><div class="vp-pill">${esc(right || period())}</div></div>`;
  }
  function docHtml(title, subtitle, body, opts={}){
    const right = opts.right || period();
    const footer = opts.footer === false ? '' : `<div class="vp-note"><b>Accounting note:</b> Generated from Vardophase Suppliers Cloud Pro.</div><div class="vp-sign"><div>Prepared by</div><div>Approved by</div></div>`;
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="${esc(location.origin + '/')}"><title>${esc(title)}</title><style>${reportCss()}</style></head><body><div class="vp-page">${headerHtml(title, subtitle, right)}${body}${footer}</div>${opts.autoPrint===false?'':'<script>setTimeout(function(){try{window.print()}catch(e){}},500)<\/script>'}</body></html>`;
  }
  function openReport(title, subtitle, body, opts={}){
    const w = window.open('', '_blank');
    if(!w){ alert('Popup blocked. Allow popups for reports.'); return; }
    w.document.open();
    w.document.write(docHtml(title, subtitle, body, opts));
    w.document.close();
  }
  function cards(arr){
    return `<div class="vp-cards">${arr.map(x=>`<div class="vp-card"><div class="vp-card-label">${esc(x[0])}</div><div class="vp-card-value">${esc(x[1])}</div></div>`).join('')}</div>`;
  }
  function table(headers, rows){
    return `<div class="vp-table-wrap"><table class="vp-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>`<td class="${/(amount|total|vat|credit|balance|due|applied|price|net|qty|order|invoice|delivered|outstanding)/i.test(headers[i]||'')?'vp-amount':''}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function section(t){ return `<div class="vp-section">${esc(t)}</div>`; }
  function sumRows(rows){
    const s={orders:0,invoices:0,delivered:0,deposits:0,due:0,credit:0,count:rows.length, net:0, vat:0, total:0};
    rows.forEach(r=>{
      const k=kind(r); const a=baseAmount(r);
      s.net += num(r.net_amount); s.vat += num(r.vat_amount); s.total += num(r.total || r.amount);
      if(k==='deposit') s.deposits += a;
      else if(k==='invoice'){ s.invoices += a; s.due += num(r.amount_due); }
      else if(k==='credit_note' || /credit/i.test(k)) s.credit += Math.abs(a);
      else s.orders += a;
      s.delivered += num(r.delivered || r.delivered_amount || 0);
    });
    return s;
  }
  function grouped(rows, key){
    const out={};
    rows.forEach(r=>{
      const name=String(r[key] || 'Unassigned');
      if(!out[name]) out[name]={orders:0,invoices:0,delivered:0,due:0,credit:0,total:0,count:0,rows:[]};
      const g=out[name], k=kind(r), a=baseAmount(r);
      g.count++; g.rows.push(r); g.total += num(r.total || r.amount);
      if(k==='invoice'){ g.invoices += a; g.due += num(r.amount_due); }
      else if(k==='credit_note' || /credit/i.test(k)) g.credit += Math.abs(a);
      else if(k!=='deposit') g.orders += a;
      g.delivered += num(r.delivered || r.delivered_amount || 0);
    });
    return Object.entries(out).sort((a,b)=>String(a[0]).localeCompare(String(b[0])));
  }

  function rowList(rows){
    return rows.map(r=>[
      date(r.created_at), r.supplier||'', label(r), r.order_no||'', r.supplier_order_no||r.supplierOrderNo||'', r.invoice_no||'', r.project||'', r.description||'', money(r.net_amount||0), money(r.vat_amount||0), money(r.total||r.amount||0), money(r.deposit_applied||0), money(r.amount_due||0), r.status||''
    ]);
  }

  window.vardoReportSystem = {openReport, docHtml, headerHtml, table, cards, section, money, logo:LOGO};

  async function monthly(){
    const rows = await getRows(); const s=sumRows(rows);
    openReport('Monthly Report','Complete supplier entries and accounting movement', cards([
      ['Orders', money(s.orders)], ['Delivered', money(s.delivered)], ['Invoices Net', money(s.invoices)], ['Credit Applied', money(-s.credit)], ['Outstanding', money(s.due)], ['Entries', s.count]
    ]) + section('Detailed Entries') + table(['Date','Supplier','Process','Order No','Supplier Order No','Invoice No','Project','Description','Net','VAT','Total','Credit Applied','Amount Due','Status'], rowList(rows)) );
  }
  async function projectReport(){
    const rows=await getRows(); const gs=grouped(rows,'project');
    openReport('Project Report','Project financial summary', cards([['Projects', gs.length], ['Period', period()]]) + section('Project Summary') + table(['Project','Orders','Delivered','Invoices Net','Credit Applied','Outstanding','Entries'], gs.map(x=>[x[0],money(x[1].orders),money(x[1].delivered),money(x[1].invoices),money(-x[1].credit),money(x[1].due),x[1].count])) );
  }
  async function supplierCredit(){
    let rows=await getRows(); const supplier=(window.uiState&&window.uiState.supplier)||''; if(supplier) rows=rows.filter(r=>String(r.supplier||'')===String(supplier));
    const gs=grouped(rows,'supplier'); const s=sumRows(rows);
    let body=cards([['Suppliers',gs.length],['Invoices Net',money(s.invoices)],['Credit Applied',money(-s.credit)],['Outstanding',money(s.due)],['Entries',s.count],['Basis','After VAT / Total']]) + section('Supplier Credit Statement') + table(['Supplier','Orders','Delivered','Invoices Net','Credit Applied','Outstanding','Entries'], gs.map(x=>[x[0],money(x[1].orders),money(x[1].delivered),money(x[1].invoices),money(-x[1].credit),money(x[1].due),x[1].count]));
    if(supplier) body += section('Transactions') + table(['Date','Type','Reference','Project','Amount','Balance'], rows.map(r=>[date(r.created_at), label(r), r.invoice_no||r.order_no||'', r.project||'', money(r.total||r.amount||0), money(r.amount_due||0)]));
    openReport('Supplier Credit Statement','Supplier ledger and credit movement', body);
  }
  async function supplierSummary(){
    const rows=await getRows(); const gs=grouped(rows,'supplier');
    openReport('Supplier Summary','Summary by supplier', cards([['Suppliers',gs.length],['Period',period()]]) + section('Supplier Summary') + table(['Supplier','Orders','Invoices Net','Outstanding','Entries'], gs.map(x=>[x[0],money(x[1].orders),money(x[1].invoices),money(x[1].due),x[1].count])) );
  }
  async function supplierReport(){
    const selected=(document.getElementById('reportSupplierSelect')?.value||'').trim();
    const typed=(document.getElementById('reportSupplierInput')?.value||'').trim();
    let names=[]; if(selected) names.push(selected); if(typed) names.push(...typed.split(',').map(s=>s.trim()).filter(Boolean)); names=[...new Set(names)];
    if(!names.length){ alert('Choose or type at least one supplier.'); return; }
    const rows=(await getRows()).filter(r=>names.includes(r.supplier||'')); const s=sumRows(rows);
    const body=cards([['Suppliers',names.join(', ')],['Net',money(s.net)],['VAT',money(s.vat)],['Total',money(s.total)],['Outstanding',money(s.due)],['Rows',rows.length]]) + section('Supplier Entries') + table(['Date','Supplier','Process','Order No','Supplier Order No','Invoice No','Project','Description','Net','VAT','Total','Status'], rows.map(r=>[date(r.created_at),r.supplier||'',label(r),r.order_no||'',r.supplier_order_no||r.supplierOrderNo||'',r.invoice_no||'',r.project||'',r.description||'',money(r.net_amount||0),money(r.vat_amount||0),money(r.total||r.amount||0),r.status||'']));
    try{ if(typeof window.closeSupplierReportModal==='function') window.closeSupplierReportModal(); }catch(e){}
    openReport('Supplier Report', names.join(', '), body);
  }
  async function openOrders(){
    const rows=(await getRows()).filter(r=>kind(r)==='order' || /order/i.test(label(r))).sort((a,b)=>String(a.supplier||'').localeCompare(String(b.supplier||'')));
    openReport('Open Orders Report','Outstanding open purchase orders', cards([['Open Orders',rows.length],['Period',period()]]) + section('Open Orders') + table(['Date','Supplier','Order No','Supplier Order No','Project','Amount','Days Open','Status'], rows.map(r=>[date(r.created_at),r.supplier||'',r.order_no||'',r.supplier_order_no||r.supplierOrderNo||'',r.project||'',money(r.total||r.amount||0),String(typeof window.daysOld==='function'?window.daysOld(r.created_at):''),r.status||'Open'])) );
  }
  async function transparency(){
    const rows=await getRows();
    openReport('Transparency Report','Full audit view of supplier entries', cards([['Records',rows.length],['Period',period()]]) + section('Transparency Detail') + table(['Date','Supplier','Process','Order','Invoice','Project','Status','Created By','Notes'], rows.map(r=>[date(r.created_at),r.supplier||'',label(r),r.order_no||'',r.invoice_no||'',r.project||'',r.status||'',r.created_by||'',cleanNotes(r.notes).slice(0,140)])) );
  }
  async function projectTransparency(){
    const rows=await getRows(); const gs=grouped(rows,'project');
    const body=gs.map(x=>section(x[0]) + table(['Date','Supplier','Process','Order','Invoice','Amount','Status'], x[1].rows.map(r=>[date(r.created_at),r.supplier||'',label(r),r.order_no||'',r.invoice_no||'',money(r.total||r.amount||0),r.status||'']))).join('');
    openReport('Project Transparency','Project-by-project audit view', body || '<p>No data</p>');
  }
  function parseGL(notes){
    const m=String(notes||'').match(/\[\[GL_ALLOCATIONS:([\s\S]*?)\]\]/);
    if(!m) return [];
    try{return JSON.parse(atob(m[1])) || [];}catch(e){try{return JSON.parse(m[1]) || [];}catch(_){return [];}}
  }
  function glDescription(code){
    try{ const list=window.VARDO_GL_CODES||[]; const f=list.find(x=>String(x.code)===String(code)); return f ? f.description : ''; }catch(e){return '';}
  }
  async function glAccounting(){
    const rows=await getRows(); const groupedGL={}; let allocated=0, without=0;
    rows.forEach(r=>{
      const gls=parseGL(r.notes); const amt=num(r.total||r.amount||r.net_amount||0);
      if(!gls.length){ without += amt; return; }
      gls.forEach(g=>{ const code=String(g.code||''); if(!code) return; if(!groupedGL[code]) groupedGL[code]={code,description:g.description||glDescription(code),total:0,count:0,refs:[]}; const a=num(g.amount); groupedGL[code].total+=a; groupedGL[code].count++; groupedGL[code].refs.push([date(r.created_at),r.supplier||'',r.order_no||'',r.invoice_no||'',r.project||'',r.description||'',money(a)]); allocated+=a; });
    });
    const list=Object.values(groupedGL).sort((a,b)=>String(a.code).localeCompare(String(b.code)));
    const detail=list.flatMap(g=>g.refs.map(x=>[g.code,g.description,...x]));
    openReport('GL Accounting Report','Orders / invoices grouped by GL code', cards([['GL Codes',list.length],['Allocated Total',money(allocated)],['Rows Without GL',money(without)]]) + section('Summary by GL Code') + table(['GL Code','Description','Lines','Total'], list.map(g=>[g.code,g.description,g.count,money(g.total)])) + section('Detailed Breakdown') + table(['GL Code','Description','Date','Supplier','Order No','Invoice No','Project','Entry Description','Amount'], detail));
  }

  function currentOrderData(){
    const val=id=>String(document.getElementById(id)?.value ?? '').trim();
    const field=(tr,n)=>String(tr.querySelector('[data-field="'+n+'"]')?.value ?? '').trim();
    const items=Array.from(document.querySelectorAll('#v309OrderItemsBody tr')).map((tr,i)=>{
      const qty = num(field(tr,'qty'));
      const price = num(field(tr,'price'));
      const discount = num(field(tr,'discount'));
      const discountAmount = Math.max(0, qty * price * (Math.max(0, Math.min(100, discount)) / 100));
      return {no:i+1,item:'',manual:field(tr,'manualDescription'),desc:field(tr,'description'),code:field(tr,'codeDisplay')||field(tr,'glCode'),qty:field(tr,'qty'),price:field(tr,'price'),discount:field(tr,'discount'),discountAmount:money(discountAmount),total:field(tr,'total')};
    }).filter(r=>r.item||r.manual||r.desc||r.code||r.qty||r.price||r.discount||r.total);
    return {orderNo:val('entryOrderNo'), supplierOrderNo:val('entrySupplierOrderNo'), supplier:val('entrySupplier'), project:val('entryProject'), net:val('entryNetAmount'), vat:val('entryVatAmount'), total:val('entryTotal'), notes:cleanNotes(val('entryNotes')), items};
  }
  function supplierDetails(name){
    name = String(name || '').trim();
    try{
      if(typeof window.getSupplierDetails === 'function') return window.getSupplierDetails(name) || {};
    }catch(e){}
    try{
      const map = JSON.parse(localStorage.getItem('vp_supplier_details_v325') || '{}') || {};
      return map[name] || {};
    }catch(e){ return {}; }
  }
  function supplierDetailsBlock(name){
    const d = supplierDetails(name);
    const rows = [
      ['Supplier', name],
      ['Contact Person', d.contactPerson],
      ['Phone', d.phone],
      ['Email', d.email],
      ['Contractor Name', d.contractorName],
      ['Address', d.address]
    ].filter(x => String(x[1] || '').trim());
    if(!rows.length) return '';
    return `<div class="vp-supplier-card"><div class="vp-supplier-title">Supplier Details</div><div class="vp-meta vp-supplier-meta">${rows.map(x=>`<div class="vp-meta-label">${esc(x[0])}</div><div class="vp-meta-value">${esc(x[1])}</div>`).join('')}</div></div>`;
  }
  function orderBody(d){
    const supplierBlock = supplierDetailsBlock(d.supplier);
    return `<div class="vp-meta"><div class="vp-meta-label">Order No</div><div class="vp-meta-value">${esc(d.orderNo)}</div><div class="vp-meta-label">Supplier Order No</div><div class="vp-meta-value">${esc(d.supplierOrderNo)}</div><div class="vp-meta-label">Project</div><div class="vp-meta-value">${esc(d.project)}</div></div>` + supplierBlock + section('Items') + table(['#','Manual Description','Description','GL Code','Qty','Price','Disc. %','Disc. Amount','Total'], d.items.map(r=>[r.no,r.manual||'',r.desc,r.code,r.qty,r.price,(r.discount?String(r.discount)+'%':''),r.discountAmount||'0.00',r.total||'0.00'])) + `<div class="vp-order-totals">${table(['Total','Amount'],[['Net Before VAT',money(d.net)],['VAT Amount',money(d.vat)],['Total After VAT',money(d.total)]])}</div>` + (d.notes?`<div class="vp-note"><b>Notes</b><br>${esc(d.notes)}</div>`:'');
  }
  function printOrder(){ const d=currentOrderData(); openReport('Purchase Order','Official supplier purchase order', orderBody(d), {right:new Date().toLocaleDateString(), footer:false}); }
  async function shareOrder(target){
    // Browser PDF sharing from pure HTML is inconsistent. We open the branded print page and use native Save/Share PDF.
    printOrder();
    setTimeout(()=>{
      if(target==='whatsapp') alert('The branded PDF/print page is open. Use Share / Save PDF and send it in WhatsApp.');
      if(target==='email') alert('The branded PDF/print page is open. Use Share / Save PDF and attach it to Email.');
    },600);
  }


  function installSupplierReportDetailsStyle(){
    if(document.getElementById('v333SupplierReportDetailsStyle')) return;
    const st=document.createElement('style');
    st.id='v333SupplierReportDetailsStyle';
    st.textContent='.vp-supplier-card{margin:18px 0 22px;padding:12px 14px;border:1px solid rgba(216,163,127,.35);border-radius:10px;background:#fffdfb}.vp-supplier-title{font-weight:800;margin-bottom:8px;color:#111}.vp-supplier-meta{margin:0;grid-template-columns:150px 1fr}.vp-supplier-meta .vp-meta-value{white-space:pre-wrap}';
    document.head.appendChild(st);
  }

  function install(){
    installSupplierReportDetailsStyle();
    window.printMonthlyReport = monthly;
    window.printProjectSummary = projectReport;
    window.printSupplierDepositReport = supplierCredit;
    window.printSupplierSummary = supplierSummary;
    window.runSupplierReport = supplierReport;
    window.printOpenOrdersReport = openOrders;
    window.printTransparencyReport = transparency;
    window.printProjectTransparencyReport = projectTransparency;
    window.printGLAccountingReport = glAccounting;
    window.printEntryOrder = printOrder;
    window.emailEntryOrder = function(){ shareOrder('email'); };
    window.whatsappEntryOrder = function(){ shareOrder('whatsapp'); };
  }

  install();
  window.addEventListener('load', ()=>setTimeout(install,1000));
  setTimeout(install,2000);
})();
