(function(){
  'use strict';
  if(window.__v344SupplierReportSearchFinal) return;
  window.__v344SupplierReportSearchFinal = true;

  const ROSE = '#d8a37f';
  const LOGO = 'assets/logo.png';
  function esc(v){ return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function rawNum(v){ if(v===null || v===undefined || v==='') return 0; const n=Number(String(v).replace(/\s/g,'').replace(/'/g,'').replace(/,/g,'.')); return Number.isFinite(n)?n:0; }
  function money(v){ const n=rawNum(v); try{ if(typeof window.money==='function') return window.money(n); }catch(e){} return n.toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function date(v){ try{ if(typeof window.localDateFromAnyV97==='function') return window.localDateFromAnyV97(v); }catch(e){} return v ? String(v).slice(0,10) : ''; }
  function daysOld(v){ const t=v ? new Date(v).getTime() : Date.now(); if(!Number.isFinite(t)) return 0; return Math.max(0, Math.floor((Date.now()-t)/86400000)); }
  function lc(v){ return String(v ?? '').toLowerCase(); }

  async function allRows(){
    try{
      if(window.vpSupabase && window.vpSupabase.from){
        const res = await window.vpSupabase.from('suppliers').select('*').order('created_at',{ascending:false}).limit(5000);
        if(!res.error) return res.data || [];
      }
    }catch(e){ console.warn('V344 Supabase read failed', e); }
    try{ if(typeof window.getAllRows === 'function') return await window.getAllRows(); }catch(e){}
    try{ if(typeof window.getEntries === 'function') return await window.getEntries(); }catch(e){}
    return [];
  }

  function entryKind(r){
    try{ if(typeof window.displayEntryKind==='function') return String(window.displayEntryKind(r)||'').toLowerCase(); }catch(e){}
    const s=lc([r.entry_type,r.type,r.process,r.status,r.kind,r.order_status].join(' '));
    if(s.includes('deposit') || String(r.deposit_no||r.number||'').toUpperCase().startsWith('DEP-')) return 'deposit';
    if(s.includes('invoice') || r.invoice_no) return 'invoice';
    if(s.includes('delivery') || r.delivery_no || r.delivery_note_no) return 'delivery';
    if(s.includes('order') || r.order_no) return 'order';
    return s.trim() || 'entry';
  }
  function entryLabel(r){ const k=entryKind(r); return k ? k.charAt(0).toUpperCase()+k.slice(1) : 'Entry'; }
  function amount(r){ return rawNum(r.total_after_vat ?? r.total ?? r.amount ?? r.net_amount ?? r.net ?? 0); }
  function net(r){ return rawNum(r.net_before_vat ?? r.net_amount ?? r.net ?? r.amount ?? 0); }
  function vat(r){ return rawNum(r.vat_amount ?? r.vat ?? 0); }
  function isDeposit(r){ return entryKind(r)==='deposit'; }
  function isPaid(r){ return lc(r.status).includes('paid') && !lc(r.status).includes('unpaid'); }
  function due(r){
    if(isDeposit(r) || isPaid(r)) return 0;
    if(r.amount_due !== undefined && r.amount_due !== null && r.amount_due !== '') return Math.max(0, rawNum(r.amount_due));
    const a=amount(r); if(a>0) return Math.max(0, a - rawNum(r.deposit_applied || r.credit_applied || 0));
    return 0;
  }
  function statusHtml(r){
    const d=due(r); const st=String(r.status||'').trim() || (d>0 ? 'Unpaid' : (amount(r)>0 ? 'Paid' : 'Pending'));
    const cls = (lc(st).includes('paid') && !lc(st).includes('unpaid')) ? 'paid' : (d>0 || lc(st).includes('unpaid') ? 'unpaid' : 'pending');
    return '<span class="v344-status '+cls+'">'+esc(st)+'</span>';
  }
  function supplierName(r){
    if(typeof r.supplier === 'object' && r.supplier) return r.supplier.name || r.supplier.supplier || '';
    return r.supplier || r.supplier_name || '';
  }
  function parseJSONLoose(s){
    if(!s) return null;
    try{return JSON.parse(s);}catch(e){}
    try{return JSON.parse(decodeURIComponent(s));}catch(e){}
    try{return JSON.parse(atob(s));}catch(e){}
    return null;
  }
  function parseItems(r){
    const out=[];
    ['items','order_items','orderItems','gl_items','glItems','items_json'].forEach(k=>{
      const v=r[k];
      if(Array.isArray(v)) out.push(...v);
      else if(typeof v==='string'){
        const p=parseJSONLoose(v);
        if(Array.isArray(p)) out.push(...p);
      }
    });
    const notes=String(r.notes||'');
    const m=notes.match(/\[V\d+_ORDER_ITEMS_JSON:([^\]]+)\]/) || notes.match(/ORDER_ITEMS_JSON:([^\n\]]+)/);
    if(m){ const p=parseJSONLoose(m[1].trim()); if(Array.isArray(p)) out.push(...p); }
    return out;
  }
  function itemField(it, keys){
    for(const k of keys){ if(it && it[k] !== undefined && it[k] !== null && String(it[k]).trim() !== '') return it[k]; }
    return '';
  }
  function rowDescription(r){
    const items=parseItems(r);
    const vals=[];
    items.forEach(it=>{
      const d=itemField(it,['manualDescription','manual_description','description','glDescription','gl_description','item','name']);
      if(d) vals.push(String(d));
    });
    return vals.join(', ') || r.description || r.manual_description || '';
  }
  function rowGL(r){
    const items=parseItems(r);
    const vals=[];
    items.forEach(it=>{
      const c=itemField(it,['code','glCode','gl_code','gl','glcode']);
      const d=itemField(it,['glDescription','gl_description','description']);
      if(c || d) vals.push(String(c||'') + ' ' + String(d||''));
    });
    const notes=String(r.notes||'');
    const gls=[];
    const m=notes.match(/\[\[GL_ALLOCATIONS:([\s\S]*?)\]\]/);
    if(m){ const p=parseJSONLoose(m[1]); if(Array.isArray(p)) p.forEach(g=>gls.push((g.code||'')+' '+(g.description||''))); }
    return vals.concat(gls).join(' ');
  }
  function searchText(r){
    const items=parseItems(r).map(it=>Object.values(it||{}).join(' ')).join(' ');
    return [
      supplierName(r), r.order_no, r.orderNo, r.number, r.supplier_order_no, r.supplierOrderNo,
      r.invoice_no, r.invoiceNo, r.delivery_no, r.deliveryNoteNo, r.delivery_note_no, r.deposit_no,
      r.project, r.description, r.manual_description, rowDescription(r), rowGL(r), r.notes, r.status, r.process, r.entry_type, r.type,
      items
    ].join(' ').toLowerCase();
  }
  function ref(r){ return r.order_no || r.orderNo || r.invoice_no || r.invoiceNo || r.delivery_no || r.deliveryNoteNo || r.delivery_note_no || r.deposit_no || r.number || ''; }
  function summarize(list){
    const s={orders:0,invoices:0,deposits:0,net:0,vat:0,total:0,paid:0,unpaid:0,outstanding:0,count:list.length};
    list.forEach(r=>{
      const k=entryKind(r), a=amount(r), n=net(r), v=vat(r), d=due(r);
      s.net+=n; s.vat+=v; s.total+=a; s.outstanding+=d;
      if(isDeposit(r)) s.deposits+=a;
      else if(k==='invoice') s.invoices+=a;
      else if(k==='order') s.orders+=a;
      if(isPaid(r)) s.paid+=a; else if(d>0) s.unpaid+=d;
    });
    return s;
  }
  function aging(list){
    const b=[{name:'0–30',total:0,count:0},{name:'30–60',total:0,count:0},{name:'60–90',total:0,count:0},{name:'90+',total:0,count:0}];
    list.forEach(r=>{ const d=due(r); if(d<=0) return; const age=daysOld(r.created_at || r.date); const i=age<=30?0:age<=60?1:age<=90?2:3; b[i].total+=d; b[i].count++; });
    return b;
  }
  function selectedSuppliers(){
    const selected=(document.getElementById('reportSupplierSelect')?.value || '').trim();
    const typed=(document.getElementById('reportSupplierInput')?.value || '').trim();
    let names=[]; if(selected) names.push(selected); if(typed) names.push(...typed.split(',').map(x=>x.trim()).filter(Boolean));
    return [...new Set(names)];
  }
  function supplierDetails(name){
    try{ if(typeof window.getSupplierDetails==='function') return window.getSupplierDetails(name) || {}; }catch(e){}
    try{ const map=JSON.parse(localStorage.getItem('vp_supplier_details_v325') || '{}') || {}; return map[name] || {}; }catch(e){ return {}; }
  }
  function css(){ return `
    *{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;margin:0;background:#fff;color:#111;padding:30px;font-size:14px}.page{max-width:1120px;margin:0 auto}.hdr{display:flex;align-items:center;gap:14px}.logo{width:58px;height:58px;object-fit:contain}.brand{font-size:28px;font-weight:800;letter-spacing:4px;line-height:1}.sub{font-size:13px;color:#555;margin-top:5px}.print{margin-left:auto;border:0;border-radius:18px;padding:10px 18px;background:#eee;font-weight:800;cursor:pointer}.line{height:2px;background:${ROSE};opacity:.85;margin:16px 0 24px}h1{font-size:32px;margin:0 0 6px}.cap{font-size:14px;color:#666;margin:0 0 16px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:12px 0}.card{border:1px solid #e4c5b0;border-radius:15px;background:#fffaf7;padding:13px 14px}.lbl{text-transform:uppercase;color:#9b7358;letter-spacing:2.2px;font-weight:800;font-size:11px;margin-bottom:8px}.val{font-size:20px;font-weight:800}.split{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:14px 0}.box{border:1px solid #e4c5b0;border-radius:16px;padding:14px;background:#fffdfb}.detail-row{display:grid;grid-template-columns:150px 1fr;gap:12px;padding:4px 0;border-bottom:1px solid rgba(216,163,127,.17)}.detail-row:last-child{border-bottom:0}.aging{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:10px 0 20px}.age{border:1px solid #e4c5b0;border-radius:14px;background:#fff;padding:11px 12px}.age b{display:block;color:#9b7358;letter-spacing:1.8px;margin-bottom:6px}.age span{font-size:18px;font-weight:800}.age small{display:block;color:#666;margin-top:3px}h2{font-size:21px;margin:24px 0 9px}.table-wrap{overflow:auto}.tbl{width:100%;min-width:980px;border-collapse:collapse}.tbl th{background:#f3efec;text-transform:uppercase;letter-spacing:.8px;font-size:11px;text-align:left;padding:8px;border-bottom:2px solid ${ROSE};white-space:nowrap}.tbl td{padding:7px 8px;border-bottom:1px solid #eadbd2}.num{text-align:right}.v344-status{font-weight:800;border-radius:999px;padding:3px 8px;display:inline-block;font-size:11px}.v344-status.paid{color:#197a3a;background:#eaf7ee}.v344-status.unpaid{color:#b15d24;background:#fff2e8}.v344-status.pending{color:#666;background:#f2f2f2}.note{margin-top:24px;color:#666;border-top:1px solid #eadbd2;padding-top:12px}.sign{display:grid;grid-template-columns:1fr 1fr;gap:90px;margin-top:48px;color:#9b7358}.sigline{border-top:1px solid ${ROSE};padding-top:9px}@media print{body{padding:18px}.print{display:none}.page{max-width:none}.tbl{min-width:0}.table-wrap{overflow:visible}}@media(max-width:760px){body{padding:18px}.grid{grid-template-columns:1fr 1fr}.split{grid-template-columns:1fr}.aging{grid-template-columns:1fr 1fr}.brand{font-size:22px}.logo{width:52px;height:52px}h1{font-size:29px}}
  `; }
  function cards(arr){ return '<div class="grid">'+arr.map(x=>'<div class="card"><div class="lbl">'+esc(x[0])+'</div><div class="val">'+esc(x[1])+'</div></div>').join('')+'</div>'; }
  function table(headers, rows){ return '<div class="table-wrap"><table class="tbl"><thead><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+(rows.length?rows.map(r=>'<tr>'+r.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join(''):'<tr><td colspan="'+headers.length+'" style="text-align:center;color:#777;padding:18px">No entries found</td></tr>')+'</tbody></table></div>'; }
  function openSupplierReport(names, list){
    const s=summarize(list); const ag=aging(list); const one=names.length===1; const d=one?supplierDetails(names[0]):{};
    const supplierCard = one ? '<div class="split"><div class="box"><h2>Supplier Card</h2>'+[
      ['Supplier',names[0]], ['Contact Person',d.contactPerson||d.contact||''], ['Phone',d.phone||''], ['Email',d.email||''], ['Contractor Name',d.contractorName||d.contractor||''], ['Address',d.address||'']
    ].filter(x=>String(x[1]||'').trim()).map(x=>'<div class="detail-row"><b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></div>').join('')+'</div><div class="box"><h2>Balance Summary</h2>'+[
      ['Orders',money(s.orders)], ['Invoices',money(s.invoices)], ['Deposits',money(s.deposits)], ['Paid',money(s.paid)], ['Outstanding',money(s.outstanding)], ['Entries',s.count]
    ].map(x=>'<div class="detail-row"><b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></div>').join('')+'</div></div>' : '';
    const agingHtml='<div class="aging">'+ag.map(b=>'<div class="age"><b>'+esc(b.name)+'</b><span>'+esc(money(b.total))+'</span><small>'+b.count+' entries</small></div>').join('')+'</div>';
    const rows=list.map(r=>[
      esc(date(r.created_at||r.date)), esc(supplierName(r)), esc(entryLabel(r)), '<b>'+esc(ref(r))+'</b>', esc(r.supplier_order_no||r.supplierOrderNo||''), esc(r.invoice_no||r.invoiceNo||''), esc(r.project||''), esc(rowDescription(r)), '<span class="num">'+esc(money(net(r)))+'</span>', '<span class="num">'+esc(money(vat(r)))+'</span>', '<span class="num"><b>'+esc(money(amount(r)))+'</b></span>', '<span class="num">'+esc(money(due(r)))+'</span>', statusHtml(r)
    ]);
    const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Supplier Report</title><style>'+css()+'</style></head><body><div class="page">'+
      '<div class="hdr"><img class="logo" src="'+LOGO+'"><div><div class="brand">VARDOPHASE</div><div class="sub">Suppliers Cloud Pro</div></div><button class="print" onclick="window.print()">Print</button></div><div class="line"></div>'+ 
      '<h1>Supplier Report</h1><div class="cap">'+esc(names.join(', '))+' · '+esc(new Date().toLocaleDateString())+'</div>'+supplierCard+
      cards([['NET',money(s.net)],['VAT',money(s.vat)],['TOTAL',money(s.total)],['OUTSTANDING',money(s.outstanding)],['PAID',money(s.paid)],['UNPAID',money(s.unpaid)],['ROWS',s.count]])+
      '<h2>Aging Breakdown</h2>'+agingHtml+'<h2>Supplier Entries</h2>'+table(['Date','Supplier','Process','Reference','Supplier Order No','Invoice No','Project','Description','Net','VAT','Total','Outstanding','Status'], rows)+
      '<div class="note"><b>Accounting note:</b> Generated from Vardophase Suppliers Cloud Pro.</div><div class="sign"><div class="sigline">Prepared by</div><div class="sigline">Approved by</div></div></div></body></html>';
    const w=window.open('','_blank'); if(!w){ alert('Please allow pop-ups for Supplier Report.'); return; }
    w.document.open(); w.document.write(html); w.document.close();
  }

  window.runSupplierReport = async function(){
    const names=selectedSuppliers();
    if(!names.length){ alert('Choose or type at least one supplier.'); return; }
    const set=new Set(names.map(x=>lc(x.trim())));
    const all=await allRows();
    const list=all.filter(r=>set.has(lc(supplierName(r).trim())));
    openSupplierReport(names,list);
    try{ window.closeSupplierReportModal?.(); }catch(e){}
  };

  function installSearch(){
    const old=document.getElementById('v340GlobalSearch');
    if(old) old.remove();
    if(document.getElementById('v344GlobalSearchStyle')) return;
    const st=document.createElement('style'); st.id='v344GlobalSearchStyle'; st.textContent=`
      .v344-global-search{position:fixed;right:18px;top:74px;z-index:99999;width:min(380px,calc(100vw - 36px));font-family:inherit}.v344-global-search input{width:100%;border:1px solid rgba(216,163,127,.28);background:rgba(24,24,26,.9);color:#fff;border-radius:14px;padding:10px 13px;font-size:13px;outline:none;box-shadow:0 10px 26px rgba(0,0,0,.22)}.v344-results{display:none;margin-top:7px;max-height:330px;overflow:auto;border:1px solid rgba(216,163,127,.28);border-radius:14px;background:#151517;color:#fff;box-shadow:0 18px 38px rgba(0,0,0,.35)}.v344-results.show{display:block}.v344-result{padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.07);cursor:pointer}.v344-result:hover{background:rgba(216,163,127,.12)}.v344-result b{color:#fff}.v344-result small{display:block;color:rgba(255,255,255,.68);margin-top:3px}@media(max-width:760px){.v344-global-search{position:static;width:auto;margin:10px 14px}.v344-global-search input{background:rgba(255,255,255,.05)}}`;
    document.head.appendChild(st);
    const box=document.createElement('div'); box.id='v344GlobalSearch'; box.className='v344-global-search';
    box.innerHTML='<input id="v344GlobalSearchInput" placeholder="Search supplier / PO / GL / description..." autocomplete="off"><div id="v344GlobalSearchResults" class="v344-results"></div>';
    document.body.appendChild(box);
    const input=box.querySelector('input'); const out=box.querySelector('#v344GlobalSearchResults'); let t=null;
    input.addEventListener('input',()=>{ clearTimeout(t); t=setTimeout(async()=>{
      const q=lc(input.value.trim()); if(q.length<2){ out.classList.remove('show'); out.innerHTML=''; return; }
      const all=await allRows(); const matches=all.filter(r=>searchText(r).includes(q)).slice(0,16);
      out.innerHTML=matches.length?matches.map((r,i)=>{
        const desc=rowDescription(r); const gl=rowGL(r); const line=[date(r.created_at), r.project, desc || r.description, gl].filter(Boolean).join(' · ');
        return '<div class="v344-result" data-i="'+i+'"><b>'+esc(supplierName(r)||'Unknown')+'</b> · '+esc(ref(r)||entryLabel(r))+'<small>'+esc(line).slice(0,190)+'</small></div>';
      }).join(''):'<div class="v344-result"><small>No results</small></div>';
      out.classList.add('show');
      Array.from(out.querySelectorAll('[data-i]')).forEach(el=>{ el.onclick=()=>{ const r=matches[Number(el.dataset.i)]; if(r){ openSupplierReport([supplierName(r)||'Search Result'], [r]); out.classList.remove('show'); } }; });
    },160); });
    document.addEventListener('click',e=>{ if(!box.contains(e.target)) out.classList.remove('show'); });
  }

  function boot(){
    installSearch();
    window.runSupplierReport = window.runSupplierReport; // keep override explicit
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.addEventListener('load',()=>setTimeout(boot,800));
  setTimeout(()=>{ window.runSupplierReport = window.runSupplierReport; }, 2000);
})();
