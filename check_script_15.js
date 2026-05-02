
(function(){
  if(window.__v312EditableDnInvoicePatch) return; window.__v312EditableDnInvoicePatch=true;
  const GL_TAG='GL_ITEMS', SUP_TAG='SUPPLIER_ORDER';
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function norm(v){return String(v||'').trim();}
  function num(v){const n=Number(v||0);return Number.isFinite(n)?n:0;}
  function money(v){try{ if(typeof window.money==='function') return window.money(v); }catch(e){} return 'R '+num(v).toFixed(2);}
  function tagRe(name){return new RegExp('\\n?\\[\\['+name+':([\\s\\S]*?)\\]\\]','i');}
  function readTag(notes,name){const m=String(notes||'').match(tagRe(name));return m?String(m[1]||'').trim():'';}
  function stripOurTags(notes){return String(notes||'').replace(tagRe(GL_TAG),'').replace(tagRe(SUP_TAG),'').trim();}
  function enc(obj){try{return btoa(unescape(encodeURIComponent(JSON.stringify(obj||[]))));}catch(e){return '';}}
  function dec(str){try{return JSON.parse(decodeURIComponent(escape(atob(String(str||'')))));}catch(e){return [];}}
  async function getNextOrderNo(){
    try{const db=window.supabase||window.vpSupabase||window.__vpDb;if(!db)return 'PO-001';const res=await db.from('suppliers').select('order_no').not('order_no','is',null);let max=0;(res.data||[]).forEach(r=>{const m=String(r.order_no||'').match(/^PO-(\d+)$/i);if(m)max=Math.max(max,Number(m[1]||0));});return 'PO-'+String(max+1).padStart(3,'0');}catch(e){return 'PO-001';}
  }
  function setStatus(txt,cls){try{ if(typeof window.setEntryStatus==='function') return window.setEntryStatus(txt,cls||''); }catch(e){} const el=document.getElementById('entryStatusMsg'); if(el){el.textContent=txt||''; el.className='status '+(cls||'');}}
  function cleanItems(items){return (items||[]).filter(it=> norm(it.productCode)||norm(it.description)||num(it.qty)||num(it.unitPrice)||num(it.discountPercent)||norm(it.glCode)||norm(it.glDescription)).map(it=>{
    const qty=num(it.qty), unit=num(it.unitPrice), disc=num(it.discountPercent); const net=unit-(unit*disc/100); const total=qty*net;
    return {productCode:norm(it.productCode),description:norm(it.description),qty:qty||'',unitPrice:unit||'',discountPercent:disc||'',netPrice:net||'',totalExVat:total||'',glCode:norm(it.glCode),glDescription:norm(it.glDescription)};
  });}
  function collectItems(){try{ if(typeof window.vardoGlCollectItems==='function') return cleanItems(window.vardoGlCollectItems()); }catch(e){} return [];}
  function itemsSubtotal(items){return (items||[]).reduce((a,it)=>a+num(it.totalExVat),0);}
  function supplierVatType(supplier){try{return supplier ? getSupplierVatType(supplier) : 'registered';}catch(e){return 'registered';}}
  function calcAmounts(totalNet, existingTotal){
    const net=num(totalNet); const totalField=num(existingTotal);
    const vatType=supplierVatType(norm(document.getElementById('entrySupplier')&&document.getElementById('entrySupplier').value));
    if(vatType==='not_registered') return {net: net||totalField, vat:0, total: net||totalField};
    if(net>0){const vat=(typeof calcVatFromNet==='function')?calcVatFromNet(net):(net*0.15);return {net,vat,total:net+vat};}
    if(totalField>0){const n=(typeof calcNetFromGross==='function')?calcNetFromGross(totalField):(totalField/1.15);return {net:n,vat:totalField-n,total:totalField};}
    return {net:0,vat:0,total:0};
  }
  function firstDescription(items){const it=(items||[]).find(x=>norm(x.description))||(items||[])[0];return it&&it.description?it.description:((items||[]).length?'Order items':'');}
  function rowItems(row){return cleanItems(dec(readTag(row&&row.notes, GL_TAG)));}
  window.vardoRowItems = rowItems;

  // Relaxed save: every order can be saved and edited at any stage, including rows with no prices or incomplete GL.
  window.saveEntry = async function(){
    try{
      if(window.currentRole==='viewer'){ setStatus('Viewer role cannot create or edit entries.','error'); return; }
      if(typeof window.vardoGlRecalcItems==='function') window.vardoGlRecalcItems();
      const db=window.supabase||window.vpSupabase||window.__vpDb; if(!db){ setStatus('Database connection is not ready.','error'); return; }
      const mode=norm(document.getElementById('entryMode')&&document.getElementById('entryMode').value)||'invoice';
      const supplier=norm(document.getElementById('entrySupplier')&&document.getElementById('entrySupplier').value);
      const project=norm(document.getElementById('entryProject')&&document.getElementById('entryProject').value);
      let orderNo=norm(document.getElementById('entryOrderNo')&&document.getElementById('entryOrderNo').value);
      const invoiceNo=norm(document.getElementById('entryInvoiceNo')&&document.getElementById('entryInvoiceNo').value);
      let entryType=norm(document.getElementById('entryType')&&document.getElementById('entryType').value)||'invoice';
      if(mode==='deposit') entryType='deposit';
      const status= entryType==='deposit' ? 'Paid' : (norm(document.getElementById('entryStatus')&&document.getElementById('entryStatus').value)|| (mode==='order'?'Unpaid':'Paid'));
      const supplierOrder=norm(document.getElementById('entrySupplierOrderNo')&&document.getElementById('entrySupplierOrderNo').value);
      if(!supplier || !project){ setStatus('Fill supplier and project. Amount/prices can stay empty.','error'); return; }
      if(mode==='order' && !orderNo){ orderNo=await getNextOrderNo(); const el=document.getElementById('entryOrderNo'); if(el) el.value=orderNo; }
      if(invoiceNo){
        const dup=await db.from('suppliers').select('id, invoice_no, supplier, entry_type').eq('invoice_no', invoiceNo).eq('supplier', supplier);
        if(dup.error){ setStatus(dup.error.message,'error'); return; }
        const exists=(dup.data||[]).some(r=>String(r.id)!==String(window.editingId||editingId||'') && (r.entry_type||'invoice')==='invoice');
        if(exists){ setStatus('This supplier already has the same invoice number.','error'); return; }
      }
      let items=collectItems();
      const subtotal=itemsSubtotal(items);
      const existingTotal=num(document.getElementById('entryTotal')&&document.getElementById('entryTotal').value);
      const a=calcAmounts(subtotal, existingTotal);
      ['entryNetAmount','entryVatAmount','entryTotal'].forEach(id=>{const el=document.getElementById(id); if(!el) return; if(id==='entryNetAmount') el.value=a.net?a.net.toFixed(2):''; if(id==='entryVatAmount') el.value=a.vat?a.vat.toFixed(2):'0.00'; if(id==='entryTotal') el.value=a.total?a.total.toFixed(2):'';});
      let description=norm(document.getElementById('entryDescription')&&document.getElementById('entryDescription').value)||firstDescription(items);
      if(!description) description = mode==='order' ? 'Order items' : (entryType==='deposit'?'Deposit / Advance Payment':'Invoice items');
      const notesEl=document.getElementById('entryNotes');
      const clean=stripOurTags(notesEl?notesEl.value:'');
      const notes=clean+(supplierOrder?'\n[['+SUP_TAG+':'+supplierOrder+']]':'')+(items.length?'\n[['+GL_TAG+':'+enc(items)+']]':'');
      const effectiveType = mode==='delivery_note' ? 'delivery_note' : (mode==='order' ? 'order' : (entryType==='deposit'?'deposit':(invoiceNo?'invoice':'order')));
      const payload={supplier,order_no:orderNo||null,invoice_no:(effectiveType==='order'||effectiveType==='deposit')?null:(invoiceNo||null),project,description,net_amount:a.net,vat_amount:a.vat,total:a.total,status,notes,entry_type:effectiveType,created_by:(window.currentUser&&currentUser.email)||'',amount:a.total};
      if(window.editingId||editingId){ const res=await db.from('suppliers').update(payload).eq('id', window.editingId||editingId); if(res.error){ setStatus(res.error.message,'error'); return; } }
      else { const res=await db.from('suppliers').insert([payload]); if(res.error){ setStatus(res.error.message,'error'); return; } }
      try{ if(typeof logAudit==='function') await logAudit((window.editingId||editingId)?'update_entry':'create_entry', supplier+' | '+project+' | '+(orderNo||'-')+' | '+(invoiceNo||'-')); }catch(e){}
      setStatus('Saved','ok'); if(typeof window.closeEntryModal==='function') window.closeEntryModal(); if(typeof render==='function') await render();
    }catch(err){ setStatus((err&&err.message)||'Save error','error'); }
  };

  function buildRows(items){return (items||[]).map(i=>'<tr><td>'+esc(i.productCode)+'</td><td>'+esc(i.description)+'</td><td>'+esc(i.qty)+'</td><td>'+money(i.unitPrice)+'</td><td>'+esc(i.discountPercent)+'</td><td>'+money(i.netPrice)+'</td><td>'+money(i.totalExVat)+'</td><td>'+esc(i.glCode)+'</td><td>'+esc(i.glDescription)+'</td></tr>').join('');}
  function printDoc(title,row,items,extra){
    items=items&&items.length?items:rowItems(row); const supplierOrder=readTag(row.notes,SUP_TAG); const sub=itemsSubtotal(items)||num(row.net_amount); const vat=num(row.vat_amount); const total=num(row.total||row.amount);
    const w=window.open('','_blank'); if(!w){alert('Please allow pop-ups to print.');return;}
    w.document.write('<!doctype html><html><head><title>'+esc(title)+' '+esc(row.order_no||row.invoice_no||'')+'</title><style>body{font-family:Arial,Helvetica,sans-serif;color:#111;padding:24px}.top{display:flex;justify-content:space-between;gap:18px;border-bottom:2px solid #c69b6d;padding-bottom:14px;margin-bottom:18px}.brand{font-size:23px;font-weight:900}.meta div{margin:4px 0}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #cfcfcf;padding:7px;text-align:left}th{background:#ead0b1}.totals{margin-left:auto;width:340px;margin-top:18px}.totals td:first-child{font-weight:700}.note{margin-top:18px}.sign{display:flex;gap:80px;margin-top:45px}.line{border-top:1px solid #333;padding-top:8px;width:220px}.no-print{margin-top:18px}@media print{.no-print{display:none}}</style></head><body><div class="top"><div><div class="brand">VARDOPHASE</div><div>Suppliers Cloud Pro</div></div><div class="meta"><div><b>Document:</b> '+esc(title)+'</div><div><b>Our Order No:</b> '+esc(row.order_no||'')+'</div><div><b>Supplier Order No:</b> '+esc(supplierOrder)+'</div><div><b>Invoice No:</b> '+esc(row.invoice_no||'')+'</div><div><b>DN No:</b> '+esc((typeof extractDeliveryNoteNo==='function'?extractDeliveryNoteNo(row):''))+'</div><div><b>Date:</b> '+new Date().toLocaleDateString()+'</div></div></div><div class="meta"><div><b>Supplier:</b> '+esc(row.supplier||'')+'</div><div><b>Project:</b> '+esc(row.project||'')+'</div><div><b>Status:</b> '+esc(row.status||'')+'</div></div>'+(extra||'')+'<h2>Items</h2><table><thead><tr><th>Product Code</th><th>Description</th><th>Qty</th><th>Unit Price</th><th>Discount %</th><th>Net Price</th><th>Total Excl VAT</th><th>GL Code</th><th>GL Description</th></tr></thead><tbody>'+buildRows(items)+'</tbody></table><table class="totals"><tr><td>Subtotal Excl VAT</td><td>'+money(sub)+'</td></tr><tr><td>VAT</td><td>'+money(vat)+'</td></tr><tr><td>Total</td><td>'+money(total)+'</td></tr></table><div class="note"><b>Notes:</b><br>'+esc(stripOurTags(row.notes||'')).replace(/\n/g,'<br>')+'</div><div class="sign"><div class="line">Prepared by</div><div class="line">Approved by</div></div><p class="no-print"><button onclick="window.print()">Print / Save PDF</button></p><script>setTimeout(function(){window.print()},450)<\/script></body></html>');
    w.document.close();
  }
  async function selectedRow(){ if(!window.selectedIds&&typeof selectedIds==='undefined') return null; const ids=window.selectedIds||selectedIds; if(!ids||ids.length!==1){alert('Select exactly one row.');return null;} const db=window.supabase||window.vpSupabase||window.__vpDb; const res=await db.from('suppliers').select('*').eq('id',ids[0]).single(); if(res.error||!res.data){alert((res.error&&res.error.message)||'Could not load row.'); return null;} return res.data; }
  window.vardoPrintSelectedOrder=async function(){const r=await selectedRow(); if(r) printDoc('Purchase Order',r,rowItems(r));};
  window.vardoPrintSelectedDN=async function(){const r=await selectedRow(); if(!r)return; const dn=typeof extractDeliveryNoteNo==='function'?extractDeliveryNoteNo(r):''; printDoc('Delivery Note',r,rowItems(r),'<div class="meta"><b>Delivery Note:</b> '+esc(dn||'Not created yet')+' &nbsp; <b>Delivered Amount:</b> '+money(typeof extractDeliveredAmount==='function'?extractDeliveredAmount(r):0)+'</div>');};
  window.vardoPrintSelectedInvoice=async function(){const r=await selectedRow(); if(r) printDoc('Invoice',r,rowItems(r));};

  async function injectButtons(){
    try{const area=document.querySelector('.actions,.toolbar,.top-actions,.panel .actions')||document.querySelector('.panel'); if(!area||document.getElementById('v312DocButtons'))return; const box=document.createElement('div'); box.id='v312DocButtons'; box.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin:10px 0'; box.innerHTML='<button class="soft main-action" onclick="window.vardoPrintSelectedOrder()">Print Selected Order</button><button class="soft main-action" onclick="window.vardoPrintSelectedDN()">Print Selected DN</button><button class="soft main-action" onclick="window.vardoPrintSelectedInvoice()">Print Selected Invoice</button><button class="soft main-action" onclick="window.vardoPrintAccountingReport()">GL Accounting Report</button>'; area.appendChild(box);}catch(e){}
  }
  const oldRender=window.render||render; if(typeof oldRender==='function'&&!oldRender.__v312){ const fn=async function(){const r=await oldRender.apply(this,arguments); setTimeout(injectButtons,120); return r;}; fn.__v312=true; try{window.render=fn; render=fn;}catch(e){window.render=fn;} }
  setTimeout(injectButtons,900);

  window.vardoPrintAccountingReport=async function(){
    const db=window.supabase||window.vpSupabase||window.__vpDb; if(!db)return alert('Database not ready.'); const res=await db.from('suppliers').select('*'); if(res.error)return alert(res.error.message); const rows=res.data||[]; const map={}; rows.forEach(r=>{rowItems(r).forEach(it=>{const code=it.glCode||'No GL'; if(!map[code])map[code]={desc:it.glDescription||'',total:0,count:0}; map[code].total+=num(it.totalExVat); map[code].count++;});}); const trs=Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0])).map(([c,v])=>'<tr><td>'+esc(c)+'</td><td>'+esc(v.desc)+'</td><td>'+v.count+'</td><td>'+money(v.total)+'</td></tr>').join(''); const w=window.open('','_blank'); if(!w){alert('Please allow pop-ups.');return;} w.document.write('<html><head><title>GL Accounting Report</title><style>body{font-family:Arial;padding:24px;color:#111}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#ead0b1}@media print{button{display:none}}</style></head><body><h1>GL Accounting Report</h1><table><thead><tr><th>GL Code</th><th>GL Description</th><th>Lines</th><th>Total Excl VAT</th></tr></thead><tbody>'+trs+'</tbody></table><p><button onclick="window.print()">Print / Save PDF</button></p><script>setTimeout(function(){window.print()},450)<\/script></body></html>'); w.document.close();
  };
})();
