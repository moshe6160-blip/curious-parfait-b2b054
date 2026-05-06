(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }
  function val(id){ return String($(id)?.value ?? '').trim(); }
  function field(tr, name){ return String(tr.querySelector('[data-field="'+name+'"]')?.value ?? '').trim(); }
  function cleanNotes(s){ return String(s||'').replace(/\[\[V\d+_[^\]]+\]\][A-Za-z0-9+/=]*/g,'').trim(); }
  function money(v){ const n = Number(String(v??'').replace(',', '.')) || 0; return n.toLocaleString('en-ZA',{minimumFractionDigits:2, maximumFractionDigits:2}); }
  function escHtml(s){ return String(s??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function data(){
    const items = Array.from(document.querySelectorAll('#v309OrderItemsBody tr')).map((tr,i)=>({
      no: i+1,
      item: '',
      manual: field(tr,'manualDescription'),
      desc: field(tr,'description'),
      code: field(tr,'codeDisplay') || field(tr,'glCode'),
      qty: field(tr,'qty'),
      price: field(tr,'price'),
      discount: field(tr,'discount'),
      total: field(tr,'total')
    })).filter(r => r.item || r.manual || r.desc || r.code || r.qty || r.price || r.discount || r.total);
    return {
      orderNo: val('entryOrderNo'),
      supplierOrderNo: val('entrySupplierOrderNo'),
      supplier: val('entrySupplier'),
      project: val('entryProject'),
      net: val('entryNetAmount'),
      vat: val('entryVatAmount'),
      total: val('entryTotal'),
      notes: cleanNotes(val('entryNotes')),
      status: val('entryStatus'),
      items
    };
  }
  function brandedHtml(){
    const d = data();
    const rows = d.items.map(r => '<tr><td>'+r.no+'</td><td>'+escHtml(r.manual || '')+'</td><td>'+escHtml(r.desc)+'</td><td>'+escHtml(r.code)+'</td><td>'+escHtml(r.qty)+'</td><td>'+escHtml(r.price)+'</td><td>'+escHtml(r.discount)+'</td><td>'+escHtml(r.total||'0.00')+'</td></tr>').join('');
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Purchase Order '+escHtml(d.orderNo)+'</title><style>'+ 
    '@page{size:A4;margin:14mm}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif}.page{width:100%;max-width:760px;margin:0 auto;padding:18px 22px 24px;background:#fff;overflow:hidden}.brand{display:flex;align-items:center;gap:14px;border-bottom:2px solid #d8a37f;padding-bottom:10px;margin-bottom:18px;max-width:100%;overflow:hidden}.logoImg{width:58px;height:58px;object-fit:contain;flex:0 0 58px}.brandText{min-width:0;overflow:hidden}.brand h1{margin:0;font-size:26px;line-height:1.05;letter-spacing:1.8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.brand .sub{color:#555;font-size:13px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.title{margin:14px 0 18px}.title h2{margin:0 0 4px;font-size:25px;line-height:1.1}.date{font-size:13px;color:#555}.meta{display:grid;grid-template-columns:155px minmax(0,1fr);gap:6px 16px;margin:12px 0 22px;font-size:14px}.label{font-weight:700;color:#222}.meta div{min-width:0;overflow-wrap:anywhere}h3{margin:0 0 10px;font-size:18px}.tableWrap{width:100%;overflow-x:auto}table{width:100%;border-collapse:collapse;table-layout:fixed;margin-top:8px}th,td{border:1px solid #cfcfcf;padding:7px 6px;font-size:10.5px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#f2f2f2;font-weight:800}th:nth-child(1),td:nth-child(1){width:32px;text-align:center}th:nth-child(2),td:nth-child(2){width:28%}th:nth-child(3),td:nth-child(3){width:22%}th:nth-child(4),td:nth-child(4){width:16%}th:nth-child(5),td:nth-child(5){width:8%}th:nth-child(6),td:nth-child(6),th:nth-child(7),td:nth-child(7),th:nth-child(8),td:nth-child(8){width:9%}.totals{margin-top:16px;margin-left:auto;width:300px;max-width:100%;font-size:13px}.totals div{display:flex;justify-content:space-between;gap:20px;border-bottom:1px solid #ddd;padding:7px 0}.total{font-weight:800;font-size:15px}.notes{margin-top:22px;white-space:pre-wrap;font-size:12px}.printBtn{float:right;padding:8px 14px;border:0;border-radius:18px;background:#eee;font-weight:700}.approvedStamp{position:absolute;right:38px;top:118px;transform:rotate(-12deg);border:3px solid #198f50;color:#198f50;border-radius:10px;padding:8px 14px;font-weight:900;font-size:26px;letter-spacing:2px;opacity:.9}.page{position:relative}@media(max-width:620px){.page{padding:14px 16px}.brand{gap:10px}.logoImg{width:46px;height:46px;flex-basis:46px}.brand h1{font-size:20px;letter-spacing:1px}.brand .sub{font-size:11px}.title h2{font-size:22px}.meta{grid-template-columns:135px minmax(0,1fr);font-size:13px}th,td{font-size:10px;padding:6px 5px}}@media print{.printBtn{display:none}.page{max-width:none;padding:0}.brand h1{font-size:24px}.logoImg{width:54px;height:54px;flex-basis:54px}}'+
    '</style></head><body><div class="page">'+(/approved|sent|order/i.test(d.status||'')?'<div class="approvedStamp">APPROVED</div>':'')+'<button class="printBtn" onclick="window.print()">Print</button><div class="brand"><img class="logoImg" src="assets/logo.png" alt="Vardophase logo"><div class="brandText"><h1>VARDOPHASE</h1><div class="sub">Suppliers Cloud Pro</div></div></div><div class="title"><h2>Purchase Order</h2><div class="date">'+escHtml(new Date().toLocaleDateString())+'</div></div><div class="meta"><div class="label">Order No</div><div>'+escHtml(d.orderNo)+'</div><div class="label">Supplier Order No</div><div>'+escHtml(d.supplierOrderNo)+'</div><div class="label">Supplier</div><div>'+escHtml(d.supplier)+'</div><div class="label">Project</div><div>'+escHtml(d.project)+'</div></div><h3>Items</h3><div class="tableWrap"><table><thead><tr><th>#</th><th>Manual Description</th><th>Description</th><th>GL Code</th><th>Qty</th><th>Price</th><th>Disc.</th><th>Total</th></tr></thead><tbody>'+rows+'</tbody></table></div><div class="totals"><div><span>Net Before VAT</span><b>'+escHtml(money(d.net))+'</b></div><div><span>VAT Amount</span><b>'+escHtml(money(d.vat))+'</b></div><div class="total"><span>Total After VAT</span><b>'+escHtml(money(d.total))+'</b></div></div>'+(d.notes?'<div class="notes"><b>Notes</b><br>'+escHtml(d.notes)+'</div>':'')+'</div></body></html>';
  }
  function pdfEscape(s){ return String(s??'').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[\r\n]+/g,' '); }
  function makePdfBlob(){
    const d = data();
    const W=595, H=842;
    let stream='';
    function txt(x,y,size,s,bold){ stream += 'BT /F'+(bold?'2':'1')+' '+size+' Tf '+x+' '+y+' Td ('+pdfEscape(s)+') Tj ET\n'; }
    function line(x1,y1,x2,y2){ stream += x1+' '+y1+' m '+x2+' '+y2+' l S\n'; }
    function rect(x,y,w,h){ stream += x+' '+y+' '+w+' '+h+' re S\n'; }
    stream += '0 0 0 rg 44 774 34 34 re f 0.86 0.63 0.48 RG 1.5 w 44 774 34 34 re S 0.86 0.63 0.48 rg\n';
    txt(56,783,20,'V',true); stream += '0 0 0 rg\n'; txt(92,795,18,'VARDOPHASE',true); txt(93,781,9,'Suppliers Cloud Pro',false);
    line(44,764,552,764);
    txt(44,740,20,'Purchase Order',true); txt(44,721,10,new Date().toLocaleDateString(),false); if(/approved|sent|order/i.test(d.status||'')){ stream += '0.1 0.56 0.31 RG 2.5 w 410 710 112 34 re S 0.1 0.56 0.31 rg\n'; txt(423,721,18,'APPROVED',true); stream += '0 0 0 rg 0 0 0 RG\n'; }
    let y=692; const meta=[['Order No',d.orderNo],['Supplier Order No',d.supplierOrderNo],['Supplier',d.supplier],['Project',d.project]];
    meta.forEach(m=>{ txt(44,y,11,m[0],true); txt(170,y,12,m[1],false); y-=18; });
    y-=12; txt(44,y,14,'Items',true); y-=20;
    const cols=[44,64,205,305,378,425,470,518]; const headers=['#','Manual Description','Description','GL Code','Qty','Price','Disc.','Total'];
    stream += '0.94 0.94 0.94 rg 44 '+(y-5)+' 508 20 re f 0 0 0 rg\n';
    headers.forEach((h,i)=>txt(cols[i]+3,y,8,h,true)); line(44,y-8,552,y-8); y-=24;
    d.items.forEach((r,i)=>{ if(y<145) return; txt(cols[0]+3,y,8,String(i+1),false); txt(cols[1]+3,y,8,(r.manual||'').slice(0,24),false); txt(cols[2]+3,y,8,(r.desc||'').slice(0,18),false); txt(cols[3]+3,y,8,(r.code||'').slice(0,12),false); txt(cols[4]+3,y,8,r.qty,false); txt(cols[5]+3,y,8,r.price,false); txt(cols[6]+3,y,8,r.discount,false); txt(cols[7]+3,y,8,r.total||'0.00',false); line(44,y-8,552,y-8); y-=20; });
    y-=18; const tx=350; txt(tx,y,11,'Net Before VAT',false); txt(510,y,11,money(d.net),true); y-=18; txt(tx,y,11,'VAT Amount',false); txt(510,y,11,money(d.vat),true); y-=22; txt(tx,y,13,'Total After VAT',true); txt(510,y,13,money(d.total),true);
    if(d.notes){ y-=38; txt(44,y,12,'Notes',true); y-=16; txt(44,y,9,d.notes.slice(0,120),false); }
    const objects=[];
    objects.push('<< /Type /Catalog /Pages 2 0 R >>');
    objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+W+' '+H+'] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>');
    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
    objects.push('<< /Length '+stream.length+' >>\nstream\n'+stream+'endstream');
    let pdf='%PDF-1.4\n'; const xref=[0]; objects.forEach((o,i)=>{ xref.push(pdf.length); pdf += (i+1)+' 0 obj\n'+o+'\nendobj\n'; });
    const start=pdf.length; pdf+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n'; xref.slice(1).forEach(n=>{ pdf += String(n).padStart(10,'0')+' 00000 n \n'; });
    pdf+='trailer << /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+start+'\n%%EOF';
    return new Blob([pdf], {type:'application/pdf'});
  }
  function filename(){ return 'Vardophase_PO_'+(data().orderNo||'Order').replace(/[^A-Za-z0-9_-]+/g,'_')+'.pdf'; }
  function downloadPdf(){ const blob=makePdfBlob(); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename(); document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},1500); return blob; }
  async function sharePdf(target){
    const blob=makePdfBlob(); const file=new File([blob], filename(), {type:'application/pdf'});
    const shareData={title:'Purchase Order '+(data().orderNo||''), text:'Vardophase Purchase Order '+(data().orderNo||''), files:[file]};
    if(navigator.canShare && navigator.canShare({files:[file]}) && navigator.share){
      try{ await navigator.share(shareData); return; }catch(e){ if(e && e.name==='AbortError') return; }
    }
    downloadPdf();
    if(target==='whatsapp') window.open('https://wa.me/?text='+encodeURIComponent('Purchase Order '+(data().orderNo||'')+' PDF downloaded. Please attach/send it.'),'_blank');
    if(target==='email') window.location.href='mailto:?subject='+encodeURIComponent('Purchase Order '+(data().orderNo||''))+'&body='+encodeURIComponent('PDF downloaded. Please attach the Vardophase purchase order PDF.');
  }
  window.printEntryOrder = function(){ const w=window.open('', '_blank'); if(!w){ alert('Popup blocked. Please allow popups to print.'); return; } w.document.open(); w.document.write(brandedHtml()); w.document.close(); setTimeout(()=>{ try{ w.focus(); w.print(); }catch(e){} }, 350); };
  window.emailEntryOrder = function(){ sharePdf('email'); };
  window.whatsappEntryOrder = function(){ sharePdf('whatsapp'); };
  window.downloadEntryOrderPdf = downloadPdf;
})();
