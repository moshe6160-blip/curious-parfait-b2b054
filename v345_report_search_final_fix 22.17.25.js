(function(){
  'use strict';
  if(window.__v345ReportSearchFinalFix) return;
  window.__v345ReportSearchFinalFix = true;

  const ROSE = '#d8a37f';
  const LOGO = 'assets/logo.png';
  const FLAG = 'v345';
  function esc(v){ return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function lc(v){ return String(v ?? '').toLowerCase(); }
  function rawNum(v){
    if(v===null || v===undefined || v==='') return 0;
    let s=String(v).trim().replace(/\s/g,'').replace(/'/g,'');
    if(s.includes(',') && s.includes('.')) s=s.replace(/,/g,'');
    else s=s.replace(/,/g,'.');
    const n=Number(s); return Number.isFinite(n)?n:0;
  }
  function money(v){ const n=rawNum(v); try{ if(typeof window.money==='function') return window.money(n); }catch(e){} return n.toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function dt(v){ try{ if(typeof window.localDateFromAnyV97==='function') return window.localDateFromAnyV97(v); }catch(e){} return v ? String(v).slice(0,10) : ''; }
  function ageDays(v){ const t=v ? new Date(v).getTime() : Date.now(); return Number.isFinite(t) ? Math.max(0,Math.floor((Date.now()-t)/86400000)) : 0; }

  async function allRows(){
    try{
      if(window.vpSupabase && window.vpSupabase.from){
        const res=await window.vpSupabase.from('suppliers').select('*').order('created_at',{ascending:false}).limit(10000);
        if(!res.error) return res.data || [];
      }
    }catch(e){ console.warn('V345 Supabase read failed', e); }
    try{ if(typeof window.getAllRows==='function') return await window.getAllRows(); }catch(e){}
    try{ if(typeof window.getEntries==='function') return await window.getEntries(); }catch(e){}
    return [];
  }
  function parseLoose(s){
    if(!s) return null;
    if(typeof s!=='string') return s;
    const tries=[s];
    try{ tries.push(decodeURIComponent(s)); }catch(e){}
    try{ tries.push(atob(s)); }catch(e){}
    for(const t of tries){ try{ return JSON.parse(t); }catch(e){} }
    return null;
  }
  function parseItems(r){
    const out=[];
    ['items','order_items','orderItems','gl_items','glItems','items_json','order_items_json'].forEach(k=>{
      const v=r && r[k];
      if(Array.isArray(v)) out.push(...v);
      else if(v && typeof v==='object') out.push(v);
      else if(typeof v==='string'){
        const p=parseLoose(v); if(Array.isArray(p)) out.push(...p); else if(p && typeof p==='object') out.push(p);
      }
    });
    const notes=String((r&&r.notes)||'');
    const patterns=[/\[V\d+_ORDER_ITEMS_JSON:([^\]]+)\]/g,/ORDER_ITEMS_JSON:([^\n\]]+)/g,/\[ORDER_ITEMS:([^\]]+)\]/g];
    for(const re of patterns){ let m; while((m=re.exec(notes))){ const p=parseLoose(String(m[1]).trim()); if(Array.isArray(p)) out.push(...p); }}
    return out;
  }
  function f(obj, keys){ for(const k of keys){ if(obj && obj[k]!==undefined && obj[k]!==null && String(obj[k]).trim()!=='') return obj[k]; } return ''; }
  function supplierName(r){
    const s=r?.supplier;
    if(s && typeof s==='object') return s.name || s.supplier || s.supplierName || '';
    return r?.supplier_name || r?.supplierName || s || '';
  }
  function kind(r){
    try{ if(typeof window.displayEntryKind==='function') return String(window.displayEntryKind(r)||'Entry'); }catch(e){}
    const s=lc([r?.entry_type,r?.type,r?.process,r?.status,r?.kind,r?.order_status,r?.number].join(' '));
    if(s.includes('deposit') || String(r?.deposit_no||r?.number||'').toUpperCase().startsWith('DEP-')) return 'Deposit';
    if(s.includes('delivery') || r?.delivery_no || r?.delivery_note_no || r?.deliveryNoteNo) return 'Delivery';
    if(s.includes('invoice') || r?.invoice_no || r?.invoiceNo) return 'Invoice';
    if(s.includes('order') || r?.order_no || r?.orderNo) return 'Order';
    return 'Entry';
  }
  function ref(r){ return r?.order_no || r?.orderNo || r?.invoice_no || r?.invoiceNo || r?.delivery_no || r?.deliveryNoteNo || r?.delivery_note_no || r?.deposit_no || r?.number || ''; }
  function net(r){ return rawNum(r?.net_before_vat ?? r?.net_amount ?? r?.net ?? r?.amount ?? 0); }
  function vat(r){ return rawNum(r?.vat_amount ?? r?.vat ?? 0); }
  function total(r){ return rawNum(r?.total_after_vat ?? r?.total ?? r?.amount ?? r?.net_amount ?? r?.net ?? 0); }
  function isPaid(r){ const st=lc(r?.status); return st.includes('paid') && !st.includes('unpaid'); }
  function isDeposit(r){ return kind(r)==='Deposit'; }
  function due(r){
    if(isDeposit(r) || isPaid(r)) return 0;
    if(r?.amount_due!==undefined && r?.amount_due!==null && String(r.amount_due)!=='') return Math.max(0,rawNum(r.amount_due));
    const a=total(r); if(a>0) return Math.max(0, a - rawNum(r?.deposit_applied || r?.credit_applied || 0));
    return 0;
  }
  function itemDesc(it){ return f(it,['manualDescription','manual_description','manualDesc','description','glDescription','gl_description','item','name','title']); }
  function itemCode(it){ return f(it,['code','glCode','gl_code','gl','glcode','accountCode']); }
  function itemAll(it){ return Object.values(it||{}).map(v=> typeof v==='object'? JSON.stringify(v): String(v)).join(' '); }
  function rowDesc(r){
    const items=parseItems(r); const vals=[];
    items.forEach(it=>{ const d=itemDesc(it); if(d) vals.push(String(d)); });
    return vals.join(', ') || r?.description || r?.manual_description || '';
  }
  function rowGL(r){
    const items=parseItems(r); const vals=[];
    items.forEach(it=>{ const c=itemCode(it); const d=f(it,['glDescription','gl_description','description']); if(c || d) vals.push(String(c||'')+' '+String(d||'')); });
    const notes=String(r?.notes||'');
    const m=notes.match(/\[\[GL_ALLOCATIONS:([\s\S]*?)\]\]/);
    if(m){ const p=parseLoose(m[1]); if(Array.isArray(p)) p.forEach(g=>vals.push(String(g.code||'')+' '+String(g.description||''))); }
    return vals.join(' ');
  }
  function deepValues(x, depth=0){
    if(depth>3 || x==null) return '';
    if(typeof x!=='object') return String(x);
    if(Array.isArray(x)) return x.map(v=>deepValues(v,depth+1)).join(' ');
    return Object.keys(x).map(k=>k+' '+deepValues(x[k],depth+1)).join(' ');
  }
  function searchText(r){
    const items=parseItems(r);
    return lc([
      deepValues(r), supplierName(r), ref(r), kind(r), r?.supplier_order_no, r?.supplierOrderNo, r?.project,
      r?.description, r?.manual_description, rowDesc(r), rowGL(r), items.map(itemAll).join(' '), r?.notes, r?.status, r?.process
    ].join(' '));
  }
  function supplierDetails(name){
    try{ if(typeof window.getSupplierDetails==='function') return window.getSupplierDetails(name) || {}; }catch(e){}
    try{ const map=JSON.parse(localStorage.getItem('vp_supplier_details_v325') || '{}') || {}; return map[name] || map[String(name).toLowerCase()] || {}; }catch(e){ return {}; }
  }
  function selectedSuppliers(){
    const selected=(document.getElementById('reportSupplierSelect')?.value || '').trim();
    const typed=(document.getElementById('reportSupplierInput')?.value || '').trim();
    const names=[]; if(selected) names.push(selected); if(typed) names.push(...typed.split(',').map(s=>s.trim()).filter(Boolean));
    return [...new Set(names)];
  }
  function summary(rows){
    const s={net:0,vat:0,total:0,orders:0,invoices:0,deposits:0,paid:0,unpaid:0,outstanding:0,count:rows.length};
    rows.forEach(r=>{ const k=kind(r), a=total(r), n=net(r), v=vat(r), d=due(r); s.net+=n; s.vat+=v; s.total+=a; s.outstanding+=d; if(k==='Deposit') s.deposits+=a; else if(k==='Invoice') s.invoices+=a; else if(k==='Order') s.orders+=a; if(isPaid(r)) s.paid+=a; if(d>0) s.unpaid+=d; });
    return s;
  }
  function aging(rows){
    const b=[{name:'0–30',total:0,count:0},{name:'30–60',total:0,count:0},{name:'60–90',total:0,count:0},{name:'90+',total:0,count:0}];
    rows.forEach(r=>{ const d=due(r); if(d<=0) return; const a=ageDays(r.created_at||r.date); const i=a<=30?0:a<=60?1:a<=90?2:3; b[i].total+=d; b[i].count++; }); return b;
  }
  function status(r){
    const d=due(r); const st=String(r.status || (d>0?'Unpaid':(total(r)>0?'Paid':'Pending'))).trim();
    const cls=(lc(st).includes('paid')&&!lc(st).includes('unpaid'))?'paid':(d>0||lc(st).includes('unpaid')?'unpaid':'pending');
    return '<span class="v345-status '+cls+'">'+esc(st)+'</span>';
  }
  function css(){ return `
    *{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;background:#fff;color:#111;margin:0;padding:30px;font-size:14px}.page{max-width:1120px;margin:0 auto}.hdr{display:flex;align-items:center;gap:14px}.logo{width:58px;height:58px;object-fit:contain}.brand{font-size:28px;font-weight:800;letter-spacing:4px;line-height:1}.sub{font-size:13px;color:#555;margin-top:5px}.print{margin-left:auto;border:0;border-radius:18px;padding:10px 18px;background:#eee;font-weight:800;cursor:pointer}.line{height:2px;background:${ROSE};opacity:.85;margin:16px 0 24px}h1{font-size:32px;margin:0 0 6px}.cap{font-size:14px;color:#666;margin:0 0 16px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:12px 0}.card{border:1px solid #e4c5b0;border-radius:15px;background:#fffaf7;padding:13px 14px}.lbl{text-transform:uppercase;color:#9b7358;letter-spacing:2.2px;font-weight:800;font-size:11px;margin-bottom:8px}.val{font-size:20px;font-weight:800}.split{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:14px 0}.box{border:1px solid #e4c5b0;border-radius:16px;padding:14px;background:#fffdfb}.detail-row{display:grid;grid-template-columns:150px 1fr;gap:12px;padding:4px 0;border-bottom:1px solid rgba(216,163,127,.17)}.detail-row:last-child{border-bottom:0}.aging{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:10px 0 20px}.age{border:1px solid #e4c5b0;border-radius:14px;background:#fff;padding:11px 12px}.age b{display:block;color:#9b7358;letter-spacing:1.8px;margin-bottom:6px}.age span{font-size:18px;font-weight:800}.age small{display:block;color:#666;margin-top:3px}h2{font-size:21px;margin:24px 0 9px}.table-wrap{overflow:auto}.tbl{width:100%;min-width:980px;border-collapse:collapse}.tbl th{background:#f3efec;text-transform:uppercase;letter-spacing:.8px;font-size:11px;text-align:left;padding:8px;border-bottom:2px solid ${ROSE};white-space:nowrap}.tbl td{padding:7px 8px;border-bottom:1px solid #eadbd2}.num{text-align:right}.v345-status{font-weight:800;border-radius:999px;padding:3px 8px;display:inline-block;font-size:11px}.v345-status.paid{color:#197a3a;background:#eaf7ee}.v345-status.unpaid{color:#b15d24;background:#fff2e8}.v345-status.pending{color:#666;background:#f2f2f2}.note{margin-top:24px;color:#666;border-top:1px solid #eadbd2;padding-top:12px}.sign{display:grid;grid-template-columns:1fr 1fr;gap:90px;margin-top:48px;color:#9b7358}.sigline{border-top:1px solid ${ROSE};padding-top:9px}@media print{body{padding:18px}.print{display:none}.page{max-width:none}.tbl{min-width:0}.table-wrap{overflow:visible}}@media(max-width:760px){body{padding:18px}.grid{grid-template-columns:1fr 1fr}.split{grid-template-columns:1fr}.aging{grid-template-columns:1fr 1fr}.brand{font-size:22px}.logo{width:52px;height:52px}h1{font-size:29px}}
  `; }
  function cards(arr){ return '<div class="grid">'+arr.map(x=>'<div class="card"><div class="lbl">'+esc(x[0])+'</div><div class="val">'+esc(x[1])+'</div></div>').join('')+'</div>'; }
  function table(headers, rows){ return '<div class="table-wrap"><table class="tbl"><thead><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+(rows.length?rows.map(r=>'<tr>'+r.map((c,i)=>'<td class="'+(i>=headers.length-5?'num':'')+'">'+c+'</td>').join('')+'</tr>').join(''):'<tr><td colspan="'+headers.length+'" style="text-align:center;color:#777;padding:18px">No entries found</td></tr>')+'</tbody></table></div>'; }
  function openSupplierReport(names, rows){
    const s=summary(rows), ag=aging(rows), one=names.length===1, d=one?supplierDetails(names[0]):{};
    const supplierCard=one?'<div class="split"><div class="box"><h2 style="margin-top:0">Supplier Card</h2>'+[
      ['Supplier',names[0]],['Contact Person',d.contactPerson||d.contact||''],['Phone',d.phone||''],['Email',d.email||''],['Contractor Name',d.contractorName||d.contractor||''],['Address',d.address||'']
    ].filter(x=>String(x[1]||'').trim()).map(x=>'<div class="detail-row"><b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></div>').join('')+'</div><div class="box"><h2 style="margin-top:0">Balance Summary</h2>'+[
      ['Orders',money(s.orders)],['Invoices',money(s.invoices)],['Deposits',money(s.deposits)],['Paid',money(s.paid)],['Unpaid',money(s.unpaid)],['Outstanding',money(s.outstanding)],['Entries',s.count]
    ].map(x=>'<div class="detail-row"><b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></div>').join('')+'</div></div>':'';
    const agingHtml='<div class="aging">'+ag.map(b=>'<div class="age"><b>'+esc(b.name)+'</b><span>'+esc(money(b.total))+'</span><small>'+b.count+' entries</small></div>').join('')+'</div>';
    const trs=rows.map(r=>[
      esc(dt(r.created_at||r.date)), esc(supplierName(r)), esc(kind(r)), '<b>'+esc(ref(r))+'</b>', esc(r.supplier_order_no||r.supplierOrderNo||''), esc(r.invoice_no||r.invoiceNo||''), esc(r.project||''), esc(rowDesc(r)), esc(money(net(r))), esc(money(vat(r))), '<b>'+esc(money(total(r)))+'</b>', esc(money(due(r))), status(r)
    ]);
    const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Supplier Report</title><style>'+css()+'</style></head><body><div class="page"><div class="hdr"><img class="logo" src="'+LOGO+'"><div><div class="brand">VARDOPHASE</div><div class="sub">Suppliers Cloud Pro</div></div><button class="print" onclick="window.print()">Print</button></div><div class="line"></div><h1>Supplier Report</h1><div class="cap">'+esc(names.join(', '))+' · '+esc(new Date().toLocaleDateString())+'</div>'+supplierCard+cards([['NET',money(s.net)],['VAT',money(s.vat)],['TOTAL',money(s.total)],['OUTSTANDING',money(s.outstanding)],['PAID',money(s.paid)],['UNPAID',money(s.unpaid)],['ROWS',s.count]])+'<h2>Aging Breakdown</h2>'+agingHtml+'<h2>Supplier Entries</h2>'+table(['Date','Supplier','Process','Reference','Supplier Order No','Invoice No','Project','Description','Net','VAT','Total','Outstanding','Status'],trs)+'<div class="note"><b>Accounting note:</b> Outstanding and Aging use unpaid/open balances only. Zero-value process rows remain visible as pending entries.</div><div class="sign"><div class="sigline">Prepared by</div><div class="sigline">Approved by</div></div></div></body></html>';
    const w=window.open('','_blank'); if(!w){ alert('Please allow pop-ups for Supplier Report.'); return; }
    w.document.open(); w.document.write(html); w.document.close();
  }
  async function v345RunSupplierReport(){
    const names=selectedSuppliers(); if(!names.length){ alert('Choose or type at least one supplier.'); return; }
    const all=await allRows(); const wanted=names.map(x=>lc(x.trim()));
    const rows=all.filter(r=>wanted.includes(lc(supplierName(r).trim())));
    openSupplierReport(names, rows);
    try{ window.closeSupplierReportModal?.(); }catch(e){}
  }

  function installSearch(){
    // remove previous search widgets so there is one reliable search only
    ['v340GlobalSearch','v344GlobalSearch','v345GlobalSearch'].forEach(id=>{ const el=document.getElementById(id); if(el) el.remove(); });
    if(!document.getElementById('v345SearchStyle')){
      const st=document.createElement('style'); st.id='v345SearchStyle'; st.textContent=`
        .v345-global-search{position:fixed;right:18px;top:74px;z-index:99999;width:min(410px,calc(100vw - 36px));font-family:inherit}.v345-global-search input{width:100%;border:1px solid rgba(216,163,127,.28);background:rgba(24,24,26,.92);color:#fff;border-radius:14px;padding:10px 13px;font-size:13px;outline:none;box-shadow:0 10px 26px rgba(0,0,0,.22)}.v345-results{display:none;margin-top:7px;max-height:360px;overflow:auto;border:1px solid rgba(216,163,127,.28);border-radius:14px;background:#151517;color:#fff;box-shadow:0 18px 38px rgba(0,0,0,.35)}.v345-results.show{display:block}.v345-result{padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.07);cursor:pointer}.v345-result:hover{background:rgba(216,163,127,.12)}.v345-result b{color:#fff}.v345-result small{display:block;color:rgba(255,255,255,.70);margin-top:4px}.v345-chip{display:inline-block;margin-left:6px;padding:2px 6px;border-radius:999px;background:rgba(216,163,127,.16);color:#e5b48c;font-size:11px}@media(max-width:760px){.v345-global-search{position:static;width:auto;margin:10px 14px}.v345-global-search input{background:rgba(255,255,255,.05)}}`;
      document.head.appendChild(st);
    }
    const box=document.createElement('div'); box.id='v345GlobalSearch'; box.className='v345-global-search';
    box.innerHTML='<input id="v345GlobalSearchInput" placeholder="Search supplier / PO / supplier order / GL / description..." autocomplete="off"><div id="v345GlobalSearchResults" class="v345-results"></div>';
    document.body.appendChild(box);
    const input=box.querySelector('input'), out=box.querySelector('#v345GlobalSearchResults'); let timer=null, cache=null;
    input.addEventListener('input',()=>{ clearTimeout(timer); timer=setTimeout(async()=>{
      const q=lc(input.value.trim()); if(q.length<2){ out.innerHTML=''; out.classList.remove('show'); return; }
      const words=q.split(/\s+/).filter(Boolean);
      const all=cache || (cache=await allRows());
      const matches=all.map(r=>({r,hay:searchText(r)})).filter(x=>words.every(w=>x.hay.includes(w))).slice(0,24);
      out.innerHTML=matches.length?matches.map((x,i)=>{
        const r=x.r, desc=rowDesc(r), gl=rowGL(r);
        const line=[dt(r.created_at||r.date), r.project, r.supplier_order_no||r.supplierOrderNo, desc, gl].filter(Boolean).join(' · ');
        return '<div class="v345-result" data-i="'+i+'"><b>'+esc(supplierName(r)||'Unknown')+'</b> · '+esc(ref(r)||kind(r))+' <span class="v345-chip">'+esc(kind(r))+'</span><small>'+esc(line).slice(0,260)+'</small></div>';
      }).join(''):'<div class="v345-result"><small>No results</small></div>';
      out.classList.add('show');
      Array.from(out.querySelectorAll('[data-i]')).forEach(el=>{ el.onclick=()=>{ const r=matches[Number(el.dataset.i)].r; input.value=[supplierName(r),ref(r),rowDesc(r)].filter(Boolean).join(' / '); out.classList.remove('show'); openSupplierReport([supplierName(r)||'Search Result'], [r]); }; });
    },120); });
    document.addEventListener('click',e=>{ if(!box.contains(e.target)) out.classList.remove('show'); });
  }
  function boot(){
    window.runSupplierReport = v345RunSupplierReport;
    window.v345OpenSupplierReport = openSupplierReport;
    installSearch();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.addEventListener('load',()=>setTimeout(boot,600));
  // keep last override without touching login/order logic
  setInterval(()=>{ window.runSupplierReport = v345RunSupplierReport; if(!document.getElementById('v345GlobalSearch')) installSearch(); },1500);
})();
