(function(){
  'use strict';
  if(window.__v343ReportSearchPolish) return;
  window.__v343ReportSearchPolish = true;

  const ROSE = '#d8a37f';
  function esc(v){ return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function num(v){ if(v===null || v===undefined || v==='') return 0; const n=Number(String(v).replace(/\s/g,'').replace(/'/g,'').replace(/,/g,'.')); return Number.isFinite(n)?n:0; }
  function money(v){ const n=num(v); try{ if(typeof window.money==='function') return window.money(n); }catch(e){} return n.toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function date(v){ try{ if(typeof window.localDateFromAnyV97==='function') return window.localDateFromAnyV97(v); }catch(e){} return v ? String(v).slice(0,10) : ''; }
  function daysOld(v){ const t=v ? new Date(v).getTime() : Date.now(); if(!Number.isFinite(t)) return 0; return Math.max(0, Math.floor((Date.now()-t)/86400000)); }
  function lc(v){ return String(v ?? '').toLowerCase(); }
  async function allRows(){
    try{ if(window.vpSupabase?.from){ const res=await window.vpSupabase.from('suppliers').select('*').order('created_at',{ascending:false}).limit(5000); if(!res.error) return res.data || []; } }catch(e){ console.warn('V343 Supabase read failed', e); }
    try{ if(typeof window.getAllRows==='function') return await window.getAllRows(); }catch(e){}
    try{ if(typeof window.getEntries==='function') return await window.getEntries(); }catch(e){}
    return [];
  }
  function kind(r){
    try{ if(typeof window.displayEntryKind==='function') return String(window.displayEntryKind(r)||'').toLowerCase(); }catch(e){}
    const s=lc(r.entry_type || r.type || r.process || r.status || '');
    if(s.includes('deposit') || String(r.deposit_no||r.number||'').toUpperCase().startsWith('DEP-')) return 'deposit';
    if(s.includes('invoice') || r.invoice_no) return 'invoice';
    if(s.includes('delivery') || r.delivery_no) return 'delivery';
    if(s.includes('order') || r.order_no) return 'order';
    return s || 'entry';
  }
  function label(r){ const k=kind(r); return k ? k.charAt(0).toUpperCase()+k.slice(1) : 'Entry'; }
  function amount(r){ return num(r.total_after_vat ?? r.total ?? r.amount ?? r.net_amount ?? r.net ?? 0); }
  function netAmount(r){ return num(r.net_before_vat ?? r.net_amount ?? r.net ?? r.amount ?? 0); }
  function vatAmount(r){ return num(r.vat_amount ?? r.vat ?? 0); }
  function isDeposit(r){ return kind(r)==='deposit'; }
  function isInvoice(r){ return kind(r)==='invoice'; }
  function isOrder(r){ return kind(r)==='order'; }
  function isPaid(r){ return lc(r.status).includes('paid') && !lc(r.status).includes('unpaid'); }
  function due(r){
    if(isDeposit(r)) return 0;
    if(isPaid(r)) return 0;
    if(r.amount_due !== undefined && r.amount_due !== null && r.amount_due !== '') return Math.max(0,num(r.amount_due));
    const a=amount(r); if(a>0) return Math.max(0, a - num(r.deposit_applied||0));
    return 0;
  }
  function supplierDetails(name){
    try{ if(typeof window.getSupplierDetails==='function') return window.getSupplierDetails(name) || {}; }catch(e){}
    try{ const map=JSON.parse(localStorage.getItem('vp_supplier_details_v325') || '{}') || {}; return map[name] || {}; }catch(e){ return {}; }
  }
  function parseJSONLoose(s){ try{return JSON.parse(s);}catch(e){} try{return JSON.parse(decodeURIComponent(s));}catch(e){} return null; }
  function parseItems(r){
    const out=[];
    ['items','order_items','orderItems','gl_items','glItems'].forEach(k=>{
      const v=r[k];
      if(Array.isArray(v)) out.push(...v);
      else if(typeof v==='string'){ const parsed=parseJSONLoose(v); if(Array.isArray(parsed)) out.push(...parsed); }
    });
    const notes=String(r.notes||'');
    const m=notes.match(/\[V\d+_ORDER_ITEMS_JSON:([^\]]+)\]/) || notes.match(/ORDER_ITEMS_JSON:([^\n]+)/);
    if(m){
      const raw=m[1].trim();
      const parsed=parseJSONLoose(raw) || parseJSONLoose(atobSafe(raw));
      if(Array.isArray(parsed)) out.push(...parsed);
    }
    return out;
  }
  function atobSafe(s){ try{return atob(s);}catch(e){return '';} }
  function itemText(it){ return [it.item,it.itemNo,it.itemNumber,it.manualDescription,it.manual_description,it.description,it.glDescription,it.gl_description,it.code,it.glCode,it.gl_code,it.qty,it.price,it.discount].filter(Boolean).join(' '); }
  function rowSearchText(r){
    const supplierObj = (typeof r.supplier === 'object' && r.supplier) ? r.supplier : {};
    const detail = supplierDetails(String(r.supplier || supplierObj.name || ''));
    const items = parseItems(r).map(itemText).join(' ');
    return [
      r.supplier, supplierObj.name, supplierObj.phone, supplierObj.email, supplierObj.contactPerson, supplierObj.contractorName, supplierObj.address,
      detail.contactPerson, detail.contact, detail.phone, detail.email, detail.address, detail.contractorName, detail.contractor,
      r.order_no, r.orderNo, r.number, r.supplier_order_no, r.supplierOrderNo, r.delivery_no, r.deliveryNoteNo, r.invoice_no, r.invoiceNo, r.deposit_no,
      r.project, r.description, r.manual_description, r.notes, r.status, r.process, r.type, r.entry_type, items
    ].join(' ').toLowerCase();
  }
  function reference(r){ return r.order_no || r.orderNo || r.invoice_no || r.invoiceNo || r.delivery_no || r.deliveryNoteNo || r.deposit_no || r.number || ''; }
  function summarize(list){
    const s={orders:0,invoices:0,deposits:0,net:0,vat:0,total:0,paid:0,unpaid:0,outstanding:0,count:list.length};
    list.forEach(r=>{
      const a=amount(r), n=netAmount(r), v=vatAmount(r), d=due(r);
      s.net+=n; s.vat+=v; s.total+=a; s.outstanding+=d;
      if(isPaid(r)) s.paid+=a; else if(d>0) s.unpaid+=d;
      if(isDeposit(r)) s.deposits+=a; else if(isInvoice(r)) s.invoices+=a; else if(isOrder(r)) s.orders+=a;
    });
    return s;
  }
  function aging(list){
    const b=[{name:'0-30',total:0,count:0},{name:'30-60',total:0,count:0},{name:'60-90',total:0,count:0},{name:'90+',total:0,count:0}];
    list.forEach(r=>{ const d=due(r); if(d<=0) return; const age=daysOld(r.created_at || r.date); const idx=age<=30?0:age<=60?1:age<=90?2:3; b[idx].total+=d; b[idx].count++; });
    return b;
  }
  function selectedSuppliers(){
    const selected=(document.getElementById('reportSupplierSelect')?.value || '').trim();
    const typed=(document.getElementById('reportSupplierInput')?.value || '').trim();
    let names=[]; if(selected) names.push(selected); if(typed) names.push(...typed.split(',').map(x=>x.trim()).filter(Boolean));
    return [...new Set(names)];
  }
  function css(){return `
    :root{--rose:${ROSE};--text:#111;--muted:#666;--line:#e4c5b0;--soft:#fffaf7;--paid:#197a3a;--unpaid:#b15d24;}
    *{box-sizing:border-box} body{font-family:Arial,Helvetica,sans-serif;margin:0;background:#fff;color:var(--text);padding:28px;font-size:14px}.page{max-width:1120px;margin:0 auto}.hdr{display:flex;align-items:center;gap:14px}.logo{width:62px;height:62px;object-fit:contain}.brand{font-size:28px;font-weight:800;letter-spacing:4px}.sub{font-size:14px;color:#555;margin-top:4px;letter-spacing:0}.print{margin-left:auto;border:0;border-radius:18px;padding:10px 18px;background:#eee;font-weight:800;cursor:pointer}.line{height:3px;background:var(--rose);opacity:.8;margin:16px 0 24px}h1{font-size:34px;margin:0 0 6px}.cap{font-size:15px;color:var(--muted);margin-bottom:16px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:14px 0}.card{border:1px solid var(--line);border-radius:16px;background:var(--soft);padding:13px 14px}.lbl{text-transform:uppercase;color:#9b7358;letter-spacing:2.4px;font-weight:800;font-size:11px;margin-bottom:8px}.val{font-size:21px;font-weight:800}.split{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:16px 0}.box{border:1px solid var(--line);border-radius:18px;padding:14px;background:#fffdfb}.row{display:grid;grid-template-columns:150px 1fr;gap:12px;padding:4px 0;border-bottom:1px solid rgba(216,163,127,.18)}.row:last-child{border-bottom:0}.row b{font-weight:800}.aging{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:10px 0 20px}.age{border:1px solid var(--line);border-radius:14px;padding:12px;background:#fff}.age b{display:block;color:#9b7358;letter-spacing:2px;margin-bottom:6px}.age span{font-size:18px;font-weight:800}.age small{display:block;color:#666;margin-top:3px}h2{font-size:22px;margin:26px 0 9px}.table-wrap{overflow:auto}.tbl{width:100%;min-width:920px;border-collapse:collapse}.tbl th{background:#f3efec;text-transform:uppercase;letter-spacing:1px;font-size:12px;text-align:left;padding:9px 8px;border-bottom:2px solid var(--rose);white-space:nowrap}.tbl td{padding:8px;border-bottom:1px solid #eadbd2}.num{text-align:right}.status{font-weight:800;border-radius:999px;padding:3px 8px;display:inline-block;font-size:12px}.paid{color:var(--paid);background:#eaf7ee}.unpaid{color:var(--unpaid);background:#fff2e8}.muted{color:#777}.actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}.btn{border:1px solid var(--line);border-radius:14px;background:#fff;padding:10px 14px;font-weight:800;cursor:pointer}.primary{background:linear-gradient(90deg,#fff7d7,#e4a25e);border:0}.note{margin-top:24px;color:#666;border-top:1px solid #eadbd2;padding-top:12px}.sign{display:grid;grid-template-columns:1fr 1fr;gap:90px;margin-top:55px;color:#9b7358}.sigline{border-top:1px solid var(--rose);padding-top:10px}@media print{body{padding:18px}.print,.actions{display:none!important}.page{max-width:none}.tbl{min-width:0}.table-wrap{overflow:visible}}@media(max-width:760px){body{padding:18px}.grid{grid-template-columns:1fr 1fr}.split{grid-template-columns:1fr}.aging{grid-template-columns:1fr 1fr}.brand{font-size:22px}.logo{width:54px;height:54px}h1{font-size:30px}}
  `;}
  function cards(items){ return '<div class="grid">'+items.map(x=>'<div class="card"><div class="lbl">'+esc(x[0])+'</div><div class="val">'+esc(x[1])+'</div></div>').join('')+'</div>'; }
  function table(headers, rows){ return '<div class="table-wrap"><table class="tbl"><thead><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+(rows.length?rows.map(r=>'<tr>'+r.map((c,i)=>'<td class="'+(i>=headers.length-3?'num':'')+'">'+c+'</td>').join('')+'</tr>').join(''):'<tr><td colspan="'+headers.length+'" class="muted" style="text-align:center;padding:18px">No entries found</td></tr>')+'</tbody></table></div>'; }
  function supplierDetailsHtml(name){
    const d=supplierDetails(name); const rows=[['Supplier',name],['Contact Person',d.contactPerson||d.contact],['Phone',d.phone],['Email',d.email],['Contractor Name',d.contractorName||d.contractor],['Address',d.address]].filter(x=>String(x[1]||'').trim());
    return '<div class="box"><h2 style="margin-top:0">Supplier Card</h2>'+rows.map(x=>'<div class="row"><b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></div>').join('')+'</div>';
  }
  function statusHtml(s){ const t=String(s||'').trim()||'Unpaid'; const paid=lc(t).includes('paid')&&!lc(t).includes('unpaid'); return '<span class="status '+(paid?'paid':'unpaid')+'">'+esc(t)+'</span>'; }
  function openSupplierReport(names, rows){
    const title=names.join(', '); const multi=names.length>1; const s=summarize(rows); const ag=aging(rows);
    const detailRows=rows.map(r=>[esc(date(r.created_at||r.date)),esc(r.supplier||''),esc(label(r)),esc(reference(r)),esc(r.supplier_order_no||r.supplierOrderNo||''),esc(r.project||''),esc(r.description||''),esc(money(netAmount(r))),esc(money(vatAmount(r))),esc(money(amount(r))),statusHtml(r.status|| (due(r)>0?'Unpaid':'Paid'))]);
    const supplierBox = !multi ? '<div class="split">'+supplierDetailsHtml(names[0])+'<div class="box"><h2 style="margin-top:0">Balance Summary</h2>'+[['Orders',money(s.orders)],['Invoices',money(s.invoices)],['Deposits',money(s.deposits)],['Paid',money(s.paid)],['Outstanding',money(s.outstanding)],['Entries',s.count]].map(x=>'<div class="row"><b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></div>').join('')+'</div></div>' : '';
    const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Supplier Report</title><style>'+css()+'</style></head><body><div class="page"><div class="hdr"><img class="logo" src="assets/logo.png"><div><div class="brand">VARDOPHASE</div><div class="sub">Suppliers Cloud Pro</div></div><button class="print" onclick="window.print()">Print</button></div><div class="line"></div><h1>Supplier Report</h1><div class="cap">'+esc(title)+' · '+esc(new Date().toLocaleDateString())+'</div>'+supplierBox+cards([['Net',money(s.net)],['VAT',money(s.vat)],['Total',money(s.total)],['Outstanding',money(s.outstanding)],['Rows',s.count]])+'<h2>Aging Breakdown</h2><div class="aging">'+ag.map(b=>'<div class="age"><b>'+esc(b.name)+'</b><span>'+esc(money(b.total))+'</span><small>'+esc(b.count)+' entries</small></div>').join('')+'</div><h2>Supplier Entries</h2>'+table(['Date','Supplier','Process','Reference','Supplier Order No','Project','Description','Net','VAT','Total','Status'], detailRows)+'<div class="note"><b>Accounting note:</b> Outstanding is calculated from unpaid/open balances only. Zero-value draft/process rows remain visible as pending entries.</div><div class="sign"><div class="sigline">Prepared by</div><div class="sigline">Approved by</div></div><div class="actions"><button class="btn" onclick="window.close()">Close</button><button class="btn primary" onclick="window.print()">Print / Save PDF</button></div></div></body></html>';
    const w=window.open('', '_blank'); if(!w){ alert('Please allow pop-ups for Supplier Report.'); return; } w.document.open(); w.document.write(html); w.document.close();
  }
  window.runSupplierReport = async function(){
    const names=selectedSuppliers(); if(!names.length){ alert('Choose or type at least one supplier.'); return; }
    const all=await allRows(); const set=new Set(names.map(x=>lc(x.trim()))); const filtered=all.filter(r=>set.has(lc(r.supplier || (typeof r.supplier==='object'?r.supplier.name:''))));
    openSupplierReport(names, filtered); try{ window.closeSupplierReportModal?.(); }catch(e){}
  };

  function installSearchCss(){
    if(document.getElementById('v343SearchCss')) return;
    const st=document.createElement('style'); st.id='v343SearchCss'; st.textContent=`.v340-results .v343-chip{display:inline-block;margin-left:6px;padding:2px 6px;border-radius:999px;background:rgba(216,163,127,.16);color:#e5b48c;font-size:11px}.v340-result mark{background:rgba(216,163,127,.22);color:#fff;padding:0 2px;border-radius:3px}`; document.head.appendChild(st);
  }
  function installImprovedSearch(){
    const old=document.getElementById('v340GlobalSearchInput'); const out=document.getElementById('v340GlobalSearchResults'); if(!old || !out || old.dataset.v343Installed==='1') return;
    const input=old.cloneNode(true); input.dataset.v343Installed='1'; input.placeholder='Search supplier / PO / supplier order / GL / description...'; old.parentNode.replaceChild(input, old);
    let timer=null, cache=[];
    input.addEventListener('input',()=>{ clearTimeout(timer); timer=setTimeout(async()=>{
      const q=input.value.trim().toLowerCase(); if(q.length<2){ out.classList.remove('show'); out.innerHTML=''; return; }
      const all=cache.length?cache:(cache=await allRows());
      const words=q.split(/\s+/).filter(Boolean);
      const matches=all.map(r=>({r,hay:rowSearchText(r)})).filter(x=>words.every(w=>x.hay.includes(w))).slice(0,20);
      out.innerHTML = matches.length ? matches.map((x,i)=>{
        const r=x.r; const items=parseItems(r); const itemPreview=items.slice(0,2).map(itemText).filter(Boolean).join(' · ');
        const ref=reference(r); const type=label(r); const line=[date(r.created_at||r.date), r.project, r.supplier_order_no||r.supplierOrderNo, r.description, itemPreview].filter(Boolean).join(' · ');
        return '<div class="v340-result" data-i="'+i+'"><b>'+esc(r.supplier||'Unknown')+'</b> '+(ref?'· '+esc(ref):'')+' <span class="v343-chip">'+esc(type)+'</span><small>'+esc(line).slice(0,220)+'</small></div>';
      }).join('') : '<div class="v340-result"><small>No results</small></div>';
      out.classList.add('show'); Array.from(out.querySelectorAll('[data-i]')).forEach(el=>el.onclick=()=>{ const r=matches[Number(el.dataset.i)].r; if(r?.supplier) { input.value=r.supplier; out.classList.remove('show'); try{ window.v340OpenSupplierCard?.(r.supplier); }catch(e){} } });
    },140); });
  }
  function install(){ installSearchCss(); installImprovedSearch(); window.__v341SupplierReportAgingIntegrated=true; }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
  window.addEventListener('load',()=>setTimeout(install,700));
  setInterval(()=>{ install(); window.runSupplierReport = window.runSupplierReport; },1800);
})();
