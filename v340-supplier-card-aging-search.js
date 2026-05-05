(function(){
  'use strict';
  if(window.__v340SupplierCardAgingSearch) return;
  window.__v340SupplierCardAgingSearch = true;

  const ROSE = '#d8a37f';
  const KEY_STYLE = 'v340SupplierCardAgingSearchStyle';
  function esc(v){ return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function num(v){ return Number(String(v ?? '').replace(/,/g,'.')) || 0; }
  function money(v){ try{ if(typeof window.money==='function') return window.money(num(v)); }catch(e){} return num(v).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function date(v){ try{ if(typeof window.localDateFromAnyV97==='function') return window.localDateFromAnyV97(v); }catch(e){} return v ? String(v).slice(0,10) : ''; }
  function daysOld(v){ const t = v ? new Date(v).getTime() : Date.now(); if(!isFinite(t)) return 0; return Math.max(0, Math.floor((Date.now()-t)/86400000)); }
  function kind(r){ try{ if(typeof window.displayEntryKind==='function') return window.displayEntryKind(r); }catch(e){} return String(r.entry_type || r.process || r.status || '').toLowerCase(); }
  function label(r){ try{ if(typeof window.processStatusLabel==='function') return window.processStatusLabel(r); }catch(e){} const k=kind(r); return k ? k.charAt(0).toUpperCase()+k.slice(1) : ''; }
  function amount(r){ return num(r.total || r.amount || r.net_amount || 0); }
  function isDeposit(r){ return String(r.entry_type||r.type||r.process||r.status||'').toLowerCase().includes('deposit'); }
  function isInvoice(r){ const s=String(r.entry_type||r.type||r.process||r.status||r.invoice_no||'').toLowerCase(); return s.includes('invoice') || !!r.invoice_no; }
  function isOrder(r){ const s=String(r.entry_type||r.type||r.process||r.status||'').toLowerCase(); return s.includes('order') || !!r.order_no; }
  function due(r){ if(isDeposit(r)) return 0; if(r.amount_due !== undefined && r.amount_due !== null && r.amount_due !== '') return num(r.amount_due); const a=amount(r); const applied=num(r.deposit_applied||0); return Math.max(0,a-applied); }
  async function rows(){
    try{ if(window.vpSupabase && window.vpSupabase.from){ const res=await window.vpSupabase.from('suppliers').select('*').order('created_at',{ascending:false}).limit(5000); if(!res.error) return res.data||[]; } }catch(e){ console.warn('V340 Supabase rows failed', e); }
    try{ if(typeof window.getAllRows==='function') return await window.getAllRows(); }catch(e){}
    try{ if(typeof window.getEntries==='function') return await window.getEntries(); }catch(e){}
    return [];
  }
  function parseGL(notes){
    const m=String(notes||'').match(/\[\[GL_ALLOCATIONS:([\s\S]*?)\]\]/);
    if(!m) return [];
    try{return JSON.parse(atob(m[1]))||[];}catch(e){try{return JSON.parse(m[1])||[];}catch(_){return[];}}
  }
  function supplierDetails(name){
    try{ if(typeof window.getSupplierDetails==='function') return window.getSupplierDetails(name)||{}; }catch(e){}
    try{ const map=JSON.parse(localStorage.getItem('vp_supplier_details_v325')||'{}')||{}; return map[name]||{}; }catch(e){ return {}; }
  }
  function reportOpen(title, subtitle, body){
    if(window.vardoReportSystem && typeof window.vardoReportSystem.openReport==='function') return window.vardoReportSystem.openReport(title, subtitle, body);
    const w=window.open('','_blank'); if(!w) return alert('Popup blocked. Allow popups for reports.');
    w.document.write('<!doctype html><html><head><title>'+esc(title)+'</title><style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left}.card{display:inline-block;border:1px solid #d8a37f;border-radius:12px;padding:12px;margin:6px}</style></head><body><h1>'+esc(title)+'</h1><p>'+esc(subtitle||'')+'</p>'+body+'</body></html>'); w.document.close();
  }
  function table(headers, body){
    if(window.vardoReportSystem && typeof window.vardoReportSystem.table==='function') return window.vardoReportSystem.table(headers, body);
    return '<table><thead><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+body.map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
  }
  function cards(items){
    if(window.vardoReportSystem && typeof window.vardoReportSystem.cards==='function') return window.vardoReportSystem.cards(items);
    return items.map(x=>'<div class="card"><b>'+esc(x[0])+'</b><br>'+esc(x[1])+'</div>').join('');
  }
  function section(t){
    if(window.vardoReportSystem && typeof window.vardoReportSystem.section==='function') return window.vardoReportSystem.section(t);
    return '<h2>'+esc(t)+'</h2>';
  }
  function summarize(list){
    const s={orders:0,invoices:0,deposits:0,outstanding:0,count:list.length};
    list.forEach(r=>{ const a=amount(r); if(isDeposit(r)) s.deposits+=a; else if(isInvoice(r)) s.invoices+=a; else if(isOrder(r)) s.orders+=a; s.outstanding+=due(r); });
    return s;
  }
  window.v340OpenSupplierCard = async function(name){
    const all=await rows();
    name=String(name || document.getElementById('entrySupplier')?.value || document.getElementById('reportSupplierSelect')?.value || '').trim();
    if(!name) return alert('Choose a supplier first.');
    const list=all.filter(r=>String(r.supplier||'').trim()===name);
    const s=summarize(list), d=supplierDetails(name);
    const detailRows=[['Supplier',name],['Contact Person',d.contactPerson],['Phone',d.phone],['Email',d.email],['Contractor Name',d.contractorName],['Address',d.address]].filter(x=>String(x[1]||'').trim());
    const body=cards([['Orders',money(s.orders)],['Invoices',money(s.invoices)],['Deposits',money(s.deposits)],['Outstanding',money(s.outstanding)],['Entries',s.count]])+
      section('Supplier Details')+table(['Field','Value'], detailRows)+
      section('Supplier Transactions')+table(['Date','Type','PO / Ref','Supplier Order No','Project','Description','Amount','Outstanding','Status'], list.map(r=>[date(r.created_at),label(r)||kind(r),r.order_no||r.invoice_no||r.deposit_no||r.number||'',r.supplier_order_no||r.supplierOrderNo||'',r.project||'',r.description||'',money(amount(r)),money(due(r)),r.status||'']));
    reportOpen('Supplier Card', name, body);
  };
  window.v340PrintAgingReport = async function(){
    const all=await rows(); const buckets={b0:{label:'0-30',total:0,rows:[]},b1:{label:'30-60',total:0,rows:[]},b2:{label:'60-90',total:0,rows:[]},b3:{label:'90+',total:0,rows:[]}};
    all.forEach(r=>{ const d=due(r); if(d<=0) return; const age=daysOld(r.created_at); const key=age<=30?'b0':age<=60?'b1':age<=90?'b2':'b3'; buckets[key].total+=d; buckets[key].rows.push(r); });
    const total=Object.values(buckets).reduce((a,b)=>a+b.total,0);
    const rowsOut=[]; Object.values(buckets).forEach(b=>b.rows.forEach(r=>rowsOut.push([b.label,date(r.created_at),r.supplier||'',r.order_no||r.invoice_no||'',r.project||'',money(due(r)),daysOld(r.created_at),r.status||''])));
    const body=cards([['0-30',money(buckets.b0.total)],['30-60',money(buckets.b1.total)],['60-90',money(buckets.b2.total)],['90+',money(buckets.b3.total)],['Total Outstanding',money(total)]])+section('Aging Detail')+table(['Bucket','Date','Supplier','Reference','Project','Outstanding','Days','Status'],rowsOut);
    reportOpen('Aging Report','Outstanding supplier balances by age',body);
  };

  function installStyle(){
    if(document.getElementById(KEY_STYLE)) return;
    const st=document.createElement('style'); st.id=KEY_STYLE; st.textContent=`
      .v340-global-search{position:fixed;right:18px;top:74px;z-index:9998;width:min(360px,calc(100vw - 36px));font-family:inherit}
      .v340-global-search input{width:100%;border:1px solid rgba(216,163,127,.28);background:rgba(24,24,26,.88);color:#fff;border-radius:14px;padding:10px 13px;font-size:13px;outline:none;box-shadow:0 10px 26px rgba(0,0,0,.22)}
      .v340-global-search input:focus{border-color:rgba(216,163,127,.55)}
      .v340-results{display:none;margin-top:7px;max-height:310px;overflow:auto;border:1px solid rgba(216,163,127,.28);border-radius:14px;background:#151517;color:#fff;box-shadow:0 18px 38px rgba(0,0,0,.35)}
      .v340-results.show{display:block}.v340-result{padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.07);cursor:pointer}.v340-result:last-child{border-bottom:0}.v340-result:hover{background:rgba(216,163,127,.12)}.v340-result b{color:#fff}.v340-result small{display:block;color:rgba(255,255,255,.66);margin-top:3px}.v340-action-btn{border:1px solid rgba(216,163,127,.42)!important;background:rgba(216,163,127,.10)!important;color:#fff!important;border-radius:14px!important;padding:9px 13px!important;font-weight:700!important;cursor:pointer!important;margin:4px!important}
      @media(max-width:760px){.v340-global-search{position:static;width:auto;margin:10px 14px}.v340-global-search input{background:rgba(255,255,255,.05)}}`;
    document.head.appendChild(st);
  }
  function installSearch(){
    if(document.getElementById('v340GlobalSearch')) return;
    const box=document.createElement('div'); box.className='v340-global-search'; box.id='v340GlobalSearch';
    box.innerHTML='<input id="v340GlobalSearchInput" placeholder="Search supplier / PO / GL / description..." autocomplete="off"><div class="v340-results" id="v340GlobalSearchResults"></div>';
    document.body.appendChild(box);
    const input=box.querySelector('input'), out=box.querySelector('#v340GlobalSearchResults'); let timer=null;
    input.addEventListener('input',()=>{ clearTimeout(timer); timer=setTimeout(async()=>{ const q=input.value.trim().toLowerCase(); if(q.length<2){out.classList.remove('show'); out.innerHTML=''; return;} const all=await rows(); const matches=[];
      all.forEach(r=>{ const gl=parseGL(r.notes).map(g=>(g.code||'')+' '+(g.description||'')).join(' '); const hay=[r.supplier,r.order_no,r.supplier_order_no,r.supplierOrderNo,r.invoice_no,r.project,r.description,r.notes,gl].join(' ').toLowerCase(); if(hay.includes(q)) matches.push(r); });
      out.innerHTML=matches.slice(0,12).map((r,i)=>'<div class="v340-result" data-i="'+i+'"><b>'+esc(r.supplier||'Unknown')+'</b> · '+esc(r.order_no||r.invoice_no||r.deposit_no||'')+'<small>'+esc(date(r.created_at)+' · '+(r.project||'')+' · '+(r.description||'')).slice(0,160)+'</small></div>').join('') || '<div class="v340-result"><small>No results</small></div>';
      out.classList.add('show'); Array.from(out.querySelectorAll('[data-i]')).forEach(el=>el.onclick=()=>{ const r=matches[Number(el.dataset.i)]; if(r?.supplier) window.v340OpenSupplierCard(r.supplier); });
    },180); });
    document.addEventListener('click',e=>{ if(!box.contains(e.target)) out.classList.remove('show'); });
  }
  function agingBucketsFor(list){
    const buckets={b0:{label:'0-30',total:0,count:0},b1:{label:'30-60',total:0,count:0},b2:{label:'60-90',total:0,count:0},b3:{label:'90+',total:0,count:0}};
    list.forEach(r=>{
      const d=due(r);
      if(d<=0) return;
      const age=daysOld(r.created_at);
      const key=age<=30?'b0':age<=60?'b1':age<=90?'b2':'b3';
      buckets[key].total+=d;
      buckets[key].count+=1;
    });
    return buckets;
  }
  function installSupplierReportAging(){
    if(window.__v341SupplierReportAgingIntegrated) return;
    if(typeof window.runSupplierReport !== 'function') return;
    window.__v341SupplierReportAgingIntegrated = true;
    window.runSupplierReport = async function(){
      const selected = (document.getElementById('reportSupplierSelect')?.value || '').trim();
      const typed = (document.getElementById('reportSupplierInput')?.value || '').trim();
      let supplierNames = [];
      if(selected) supplierNames.push(selected);
      if(typed) supplierNames.push(...typed.split(',').map(s => s.trim()).filter(Boolean));
      supplierNames = [...new Set(supplierNames)];
      if(!supplierNames.length){
        alert('Choose or type at least one supplier.');
        return;
      }
      const all = await rows();
      const filtered = all.filter(r => supplierNames.includes(String(r.supplier || '').trim()));
      const sum = (typeof window.totals === 'function') ? window.totals(filtered) : {net:0,vat:0,total:filtered.reduce((a,r)=>a+amount(r),0),paid:0,unpaid:0};
      const ag = agingBucketsFor(filtered);
      const agingTotal = Object.values(ag).reduce((a,b)=>a+b.total,0);
      const summaryLines = [
        `Suppliers: ${supplierNames.join(', ')}`,
        `Net: ${money(sum.net || 0)}`,
        `VAT: ${money(sum.vat || 0)}`,
        `Total: ${money(sum.total || 0)}`,
        `Paid: ${money(sum.paid || 0)}`,
        `Unpaid: ${money(sum.unpaid || 0)}`,
        `Rows: ${filtered.length}`,
        `Aging 0-30: ${money(ag.b0.total)} (${ag.b0.count})`,
        `Aging 30-60: ${money(ag.b1.total)} (${ag.b1.count})`,
        `Aging 60-90: ${money(ag.b2.total)} (${ag.b2.count})`,
        `Aging 90+: ${money(ag.b3.total)} (${ag.b3.count})`,
        `Aging Total Outstanding: ${money(agingTotal)}`
      ];
      if(typeof window.buildPdfReport === 'function'){
        const doc = await window.buildPdfReport('VARDOPHASE Supplier Report', supplierNames.join(', '), filtered, summaryLines);
        const blob = doc.output('blob');
        const file = new File([blob], 'Vardophase_Supplier_Report.pdf', {type:'application/pdf'});
        if(navigator.canShare && navigator.canShare({files:[file]})){
          try{
            await navigator.share({ files:[file], title:'Vardophase Supplier Report' });
            window.closeSupplierReportModal?.();
            return;
          }catch(e){}
        }
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        window.closeSupplierReportModal?.();
        return;
      }
      const body = cards([['0-30',money(ag.b0.total)],['30-60',money(ag.b1.total)],['60-90',money(ag.b2.total)],['90+',money(ag.b3.total)],['Total Outstanding',money(agingTotal)]]) +
        section('Supplier Transactions') + table(['Date','Supplier','Reference','Project','Amount','Outstanding','Status'], filtered.map(r=>[date(r.created_at),r.supplier||'',r.order_no||r.invoice_no||r.deposit_no||'',r.project||'',money(amount(r)),money(due(r)),r.status||'']));
      reportOpen('Supplier Report', supplierNames.join(', '), body);
    };
  }
  function install(){ installStyle(); installSearch(); installSupplierReportAging(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
  window.addEventListener('load',()=>setTimeout(install,600));
  setInterval(installSupplierReportAging,1800);
})();
