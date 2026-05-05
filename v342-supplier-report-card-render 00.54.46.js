(function(){
  'use strict';
  if(window.__v342SupplierReportCardRender) return;
  window.__v342SupplierReportCardRender = true;

  const ROSE = '#d8a37f';
  function esc(v){ return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function num(v){
    if(v === null || v === undefined || v === '') return 0;
    const s = String(v).replace(/\s/g,'').replace(/'/g,'').replace(/,/g,'.');
    return Number(s) || 0;
  }
  function money(v){
    const n = num(v);
    try{ if(typeof window.money === 'function') return window.money(n); }catch(e){}
    return n.toLocaleString('en-ZA',{minimumFractionDigits:2, maximumFractionDigits:2});
  }
  function date(v){
    try{ if(typeof window.localDateFromAnyV97 === 'function') return window.localDateFromAnyV97(v); }catch(e){}
    return v ? String(v).slice(0,10) : '';
  }
  function daysOld(v){
    const t = v ? new Date(v).getTime() : Date.now();
    if(!isFinite(t)) return 0;
    return Math.max(0, Math.floor((Date.now() - t) / 86400000));
  }
  function kind(r){
    try{ if(typeof window.displayEntryKind === 'function') return window.displayEntryKind(r); }catch(e){}
    const s = String(r.entry_type || r.type || r.process || r.status || '').toLowerCase();
    if(s.includes('deposit')) return 'deposit';
    if(s.includes('invoice') || r.invoice_no) return 'invoice';
    if(s.includes('delivery')) return 'delivery';
    if(s.includes('order') || r.order_no) return 'order';
    return s || 'entry';
  }
  function label(r){
    try{ if(typeof window.processStatusLabel === 'function') return window.processStatusLabel(r); }catch(e){}
    const k = kind(r); return k ? k.charAt(0).toUpperCase()+k.slice(1) : 'Entry';
  }
  function amount(r){ return num(r.total || r.amount || r.net_amount || 0); }
  function isDeposit(r){ return kind(r) === 'deposit' || String(r.deposit_no || r.number || '').toUpperCase().startsWith('DEP-'); }
  function isInvoice(r){ return kind(r) === 'invoice' || !!r.invoice_no; }
  function isOrder(r){ return kind(r) === 'order' || !!r.order_no; }
  function due(r){
    if(isDeposit(r)) return 0;
    if(r.amount_due !== undefined && r.amount_due !== null && r.amount_due !== '') return num(r.amount_due);
    return Math.max(0, amount(r) - num(r.deposit_applied || 0));
  }
  async function allRows(){
    try{
      if(window.vpSupabase && window.vpSupabase.from){
        const res = await window.vpSupabase.from('suppliers').select('*').order('created_at',{ascending:false}).limit(5000);
        if(!res.error) return res.data || [];
      }
    }catch(e){ console.warn('V342 supplier report Supabase read failed', e); }
    try{ if(typeof window.getAllRows === 'function') return await window.getAllRows(); }catch(e){}
    try{ if(typeof window.getEntries === 'function') return await window.getEntries(); }catch(e){}
    return [];
  }
  function supplierDetails(name){
    try{ if(typeof window.getSupplierDetails === 'function') return window.getSupplierDetails(name) || {}; }catch(e){}
    try{ const map = JSON.parse(localStorage.getItem('vp_supplier_details_v325') || '{}') || {}; return map[name] || {}; }catch(e){ return {}; }
  }
  function summarize(list){
    const s={orders:0,invoices:0,deposits:0,outstanding:0,count:list.length};
    list.forEach(r=>{
      const a=amount(r);
      if(isDeposit(r)) s.deposits += a;
      else if(isInvoice(r)) s.invoices += a;
      else if(isOrder(r)) s.orders += a;
      s.outstanding += due(r);
    });
    return s;
  }
  function aging(list){
    const b=[{name:'0-30',total:0,count:0},{name:'30-60',total:0,count:0},{name:'60-90',total:0,count:0},{name:'90+',total:0,count:0}];
    list.forEach(r=>{
      const d=due(r); if(d<=0) return;
      const age=daysOld(r.created_at);
      const idx = age<=30 ? 0 : age<=60 ? 1 : age<=90 ? 2 : 3;
      b[idx].total += d; b[idx].count += 1;
    });
    return b;
  }
  function pickSupplierNames(){
    const selected = (document.getElementById('reportSupplierSelect')?.value || '').trim();
    const typed = (document.getElementById('reportSupplierInput')?.value || '').trim();
    let names=[];
    if(selected) names.push(selected);
    if(typed) names.push(...typed.split(',').map(s=>s.trim()).filter(Boolean));
    return [...new Set(names)];
  }
  function cardHtml(items){
    return '<div class="v342-cards">' + items.map(x=>'<div class="v342-card"><div class="v342-card-label">'+esc(x[0])+'</div><div class="v342-card-value">'+esc(x[1])+'</div></div>').join('') + '</div>';
  }
  function tableHtml(headers, rows){
    return '<div class="v342-table-wrap"><table class="v342-table"><thead><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+
      (rows.length ? rows.map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('') : '<tr><td colspan="'+headers.length+'" class="v342-empty">No entries found</td></tr>')+
      '</tbody></table></div>';
  }
  function detailsRowsFor(name){
    const d=supplierDetails(name);
    return [
      ['Supplier', name],
      ['Contact Person', d.contactPerson || d.contact || ''],
      ['Phone', d.phone || ''],
      ['Email', d.email || ''],
      ['Contractor Name', d.contractorName || d.contractor || ''],
      ['Address', d.address || '']
    ].filter(r=>String(r[1]||'').trim());
  }
  function reportCss(){ return `
    :root{--rose:${ROSE};--text:#111;--muted:#666;--line:#e3c2ab;--soft:#fbf7f4;}
    *{box-sizing:border-box} body{font-family:Arial,Helvetica,sans-serif;margin:0;background:#fff;color:var(--text);padding:28px;font-size:14px;}
    .v342-page{max-width:1120px;margin:0 auto;}
    .v342-header{display:flex;align-items:center;gap:14px;margin-bottom:18px;}
    .v342-logo{width:64px;height:64px;object-fit:contain;}
    .v342-brand{font-size:28px;font-weight:800;letter-spacing:4px;line-height:1.05;}
    .v342-sub{font-size:14px;color:#555;margin-top:5px;letter-spacing:0;}
    .v342-print{margin-left:auto;border:0;border-radius:18px;padding:10px 18px;font-weight:700;cursor:pointer;background:#eee;color:#111;}
    .v342-rose-line{height:3px;background:var(--rose);opacity:.82;margin:10px 0 26px;}
    h1{font-size:36px;margin:0 0 6px;font-weight:800;} .v342-caption{color:var(--muted);font-size:16px;margin-bottom:18px;}
    h2{font-size:22px;margin:28px 0 10px;font-weight:800;} h3{font-size:18px;margin:20px 0 8px;font-weight:800;}
    .v342-supplier-block{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0 8px;}
    .v342-detail{border:1px solid var(--line);border-radius:18px;background:#fffdfb;padding:16px;}
    .v342-detail-row{display:grid;grid-template-columns:160px 1fr;gap:12px;padding:4px 0;border-bottom:1px solid rgba(216,163,127,.18);} .v342-detail-row:last-child{border-bottom:0}
    .v342-detail-row b{font-weight:800;color:#111}.v342-detail-row span{color:#222;}
    .v342-cards{display:grid;grid-template-columns:repeat(5,minmax(130px,1fr));gap:12px;margin:16px 0 16px;}
    .v342-card{border:1px solid var(--line);border-radius:16px;padding:14px 14px;background:#fffdfb;}
    .v342-card-label{text-transform:uppercase;letter-spacing:3px;color:#9b7358;font-size:12px;font-weight:800;margin-bottom:10px;}
    .v342-card-value{font-size:22px;font-weight:800;}
    .v342-aging{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:10px 0 18px;}
    .v342-aging-item{border:1px solid var(--line);border-radius:14px;padding:12px;background:#fff;}
    .v342-aging-item b{display:block;color:#9b7358;letter-spacing:2px;margin-bottom:6px;}.v342-aging-item span{font-size:18px;font-weight:800;}.v342-aging-item small{display:block;color:#666;margin-top:4px;}
    .v342-table-wrap{width:100%;overflow:auto;margin-top:8px;} .v342-table{width:100%;border-collapse:collapse;min-width:860px;}
    .v342-table th{background:#f3efec;color:#111;font-size:12px;letter-spacing:1px;text-transform:uppercase;text-align:left;padding:10px 8px;border-bottom:2px solid var(--rose);white-space:nowrap;}
    .v342-table td{padding:9px 8px;border-bottom:1px solid #eadbd2;vertical-align:top;} .v342-table td:nth-last-child(-n+2), .v342-table th:nth-last-child(-n+2){text-align:right;}
    .v342-empty{text-align:center!important;color:#777;padding:20px!important;}
    .v342-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:18px}.v342-btn{border:1px solid var(--line);border-radius:14px;background:#fff;padding:10px 14px;font-weight:800;cursor:pointer}.v342-primary{background:linear-gradient(90deg,#fff7d7,#e4a25e);border:0;}
    @media print{body{padding:18px}.v342-print,.v342-actions{display:none!important}.v342-page{max-width:none}.v342-table-wrap{overflow:visible}.v342-table{min-width:0}.v342-cards{grid-template-columns:repeat(5,1fr)}}
    @media(max-width:760px){body{padding:18px}.v342-supplier-block{grid-template-columns:1fr}.v342-cards{grid-template-columns:1fr 1fr}.v342-aging{grid-template-columns:1fr 1fr}.v342-brand{font-size:22px}.v342-logo{width:54px;height:54px}h1{font-size:30px}}
  `; }
  function openSupplierReport(names, rows){
    const selectedTitle = names.join(', ');
    const multi = names.length > 1;
    const totalSummary = summarize(rows);
    const ag = aging(rows);
    let supplierDetailsHtml = '';
    if(!multi){
      supplierDetailsHtml = '<div class="v342-supplier-block"><div class="v342-detail"><h3>Supplier Card</h3>' + detailsRowsFor(names[0]).map(r=>'<div class="v342-detail-row"><b>'+esc(r[0])+'</b><span>'+esc(r[1])+'</span></div>').join('') + '</div><div class="v342-detail"><h3>Balance Summary</h3>' + [
        ['Orders', money(totalSummary.orders)], ['Invoices', money(totalSummary.invoices)], ['Deposits', money(totalSummary.deposits)], ['Outstanding', money(totalSummary.outstanding)], ['Entries', totalSummary.count]
      ].map(r=>'<div class="v342-detail-row"><b>'+esc(r[0])+'</b><span>'+esc(r[1])+'</span></div>').join('') + '</div></div>';
    }
    const agingHtml = '<div class="v342-aging">' + ag.map(b=>'<div class="v342-aging-item"><b>'+esc(b.name)+'</b><span>'+esc(money(b.total))+'</span><small>'+esc(b.count)+' entries</small></div>').join('') + '</div>';
    const detailRows = rows.map(r=>[
      date(r.created_at), r.supplier || '', label(r), r.order_no || r.invoice_no || r.deposit_no || r.number || '', r.supplier_order_no || r.supplierOrderNo || '', r.project || '', r.description || '', money(amount(r)), money(due(r)), r.status || ''
    ]);
    const body = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Supplier Report</title><style>${reportCss()}</style></head><body><div class="v342-page">
      <div class="v342-header"><img class="v342-logo" src="assets/logo.png"><div><div class="v342-brand">VARDOPHASE</div><div class="v342-sub">Suppliers Cloud Pro</div></div><button class="v342-print" onclick="window.print()">Print</button></div>
      <div class="v342-rose-line"></div>
      <h1>Supplier Report</h1><div class="v342-caption">${esc(selectedTitle)} · ${esc(new Date().toLocaleDateString())}</div>
      ${supplierDetailsHtml}
      ${cardHtml([['Orders',money(totalSummary.orders)],['Invoices',money(totalSummary.invoices)],['Deposits',money(totalSummary.deposits)],['Outstanding',money(totalSummary.outstanding)],['Entries',totalSummary.count]])}
      <h2>Aging Breakdown</h2>${agingHtml}
      <h2>Detailed Entries</h2>${tableHtml(['Date','Supplier','Process','Reference','Supplier Order No','Project','Description','Amount','Outstanding','Status'], detailRows)}
      <div class="v342-actions"><button class="v342-btn" onclick="window.close()">Close</button><button class="v342-btn v342-primary" onclick="window.print()">Print / Save PDF</button></div>
    </div></body></html>`;
    const w = window.open('', '_blank');
    if(!w){ alert('Please allow pop-ups for Supplier Report.'); return; }
    w.document.open(); w.document.write(body); w.document.close();
  }

  window.runSupplierReport = async function(){
    const names = pickSupplierNames();
    if(!names.length){ alert('Choose or type at least one supplier.'); return; }
    const all = await allRows();
    const set = new Set(names.map(x=>String(x).trim().toLowerCase()));
    const filtered = all.filter(r => set.has(String(r.supplier || '').trim().toLowerCase()));
    openSupplierReport(names, filtered);
    try{ window.closeSupplierReportModal?.(); }catch(e){}
  };

  // Clear the old wrapper flag so this override remains the final behavior after all older add-ons load.
  window.__v341SupplierReportAgingIntegrated = true;
})();
