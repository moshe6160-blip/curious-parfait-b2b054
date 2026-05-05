(function(){
  'use strict';
  const VERSION='V374_SENDGRID_SMART_EMAIL';
  const SUPPLIER_KEY='vp_supplier_details_v325';
  const OLD_KEYS=['emailPreference','emailMethod','v367EmailMethod','vardoEmailMethod','vp_email_method','vpEmailMethod','selectedEmailMethod'];
  function clearChoices(){ try{ OLD_KEYS.forEach(k=>localStorage.removeItem(k)); localStorage.removeItem('v370EmailMethod'); }catch(e){} }
  function $(id){ return document.getElementById(id); }
  function val(id){ return ($(id)?.value || '').trim(); }
  function enc(s){ return encodeURIComponent(String(s||'')); }
  function esc(s){ return String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function supplierEmail(name){
    try{ const m=JSON.parse(localStorage.getItem(SUPPLIER_KEY)||'{}')||{}; return (m[String(name||'').trim()]?.email||'').trim(); }catch(e){ return ''; }
  }
  function lineField(tr,name){ return String(tr.querySelector('[data-field="'+name+'"]')?.value ?? '').trim(); }
  function items(){
    return Array.from(document.querySelectorAll('#v309OrderItemsBody tr')).map((tr,i)=>({
      no:i+1, manual:lineField(tr,'manualDescription'), desc:lineField(tr,'description'), code:lineField(tr,'codeDisplay')||lineField(tr,'glCode'), qty:lineField(tr,'qty'), price:lineField(tr,'price'), disc:lineField(tr,'discount'), discAmount:lineField(tr,'discountAmount'), total:lineField(tr,'total')
    })).filter(r=>r.manual||r.desc||r.code||r.qty||r.price||r.disc||r.discAmount||r.total);
  }
  function ctx(){
    const supplier=val('entrySupplier');
    const orderNo=val('entryOrderNo') || val('entryInvoiceNo') || val('entrySupplierOrderNo') || 'document';
    const to=supplierEmail(supplier) || val('entryEmail') || val('supplierEmail');
    const subject='RFQ: '+orderNo;
    const body='Good day\n\nPlease send a quote for the attached RFQ / Purchase Order.\n\nWarm regards\nCam\n\nVardophase | Cell: 063 508 4346\nEmail: cam@vardophase.co.za';
    return {supplier,orderNo,to,subject,body,project:val('entryProject'), net:val('entryNetAmount'), vat:val('entryVatAmount'), total:val('entryTotal'), supplierOrderNo:val('entrySupplierOrderNo'), notes:val('entryNotes'), items:items()};
  }
  function money(v){ const n=Number(String(v??'').replace(',','.'))||0; return n.toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function pdfEscape(s){ return String(s??'').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[\r\n]+/g,' '); }
  function makePdfBlob(){
    const d=ctx(), W=595, H=842; let stream='';
    function txt(x,y,size,s,bold){ stream+='BT /F'+(bold?'2':'1')+' '+size+' Tf '+x+' '+y+' Td ('+pdfEscape(s)+') Tj ET\n'; }
    function line(x1,y1,x2,y2){ stream+=x1+' '+y1+' m '+x2+' '+y2+' l S\n'; }
    stream+='0 0 0 rg 44 774 34 34 re f 0.75 0.48 0.34 RG 1.5 w 44 774 34 34 re S 0.75 0.48 0.34 rg\n';
    txt(56,783,20,'V',true); stream+='0 0 0 rg\n'; txt(92,795,18,'VARDOPHASE',true); txt(93,781,9,'Suppliers Cloud Pro',false); line(44,764,552,764);
    txt(44,740,20,'PURCHASE ORDER',true); txt(440,740,10,new Date().toLocaleDateString(),false);
    let y=705; [['Order No',d.orderNo],['Supplier Order No',d.supplierOrderNo],['Project',d.project],['Supplier',d.supplier]].forEach(m=>{ if(m[1]){txt(44,y,11,m[0],true); txt(170,y,12,m[1],false); y-=18;} });
    y-=14; txt(44,y,14,'Items',true); y-=22;
    const heads=['#','Manual Description','Description','GL Code','Qty','Price','Disc %','Total']; const xs=[44,64,205,310,390,430,475,520];
    heads.forEach((h,i)=>txt(xs[i],y,8,h,true)); line(44,y-8,552,y-8); y-=24;
    (d.items.length?d.items:[{no:1,manual:'',desc:'',code:'',qty:'',price:'',disc:'',total:''}]).forEach((r,i)=>{ if(y<145) return; txt(xs[0],y,8,String(i+1),false); txt(xs[1],y,8,String(r.manual||'').slice(0,26),false); txt(xs[2],y,8,String(r.desc||'').slice(0,20),false); txt(xs[3],y,8,String(r.code||'').slice(0,12),false); txt(xs[4],y,8,String(r.qty||''),false); txt(xs[5],y,8,String(r.price||''),false); txt(xs[6],y,8,String(r.disc||''),false); txt(xs[7],y,8,String(r.total||'0.00'),false); line(44,y-8,552,y-8); y-=20; });
    y-=20; txt(350,y,11,'Net Before VAT',false); txt(505,y,11,money(d.net),true); y-=18; txt(350,y,11,'VAT Amount',false); txt(505,y,11,money(d.vat),true); y-=22; txt(350,y,13,'Total After VAT',true); txt(505,y,13,money(d.total),true);
    if(d.notes){ y-=40; txt(44,y,11,'Notes',true); y-=16; txt(44,y,9,String(d.notes).slice(0,145),false); }
    txt(44,55,9,'Prepared by ____________________',false); txt(330,55,9,'Approved by ____________________',false);
    const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+W+' '+H+'] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>','<< /Length '+stream.length+' >>\nstream\n'+stream+'endstream'];
    let pdf='%PDF-1.4\n'; const xref=[0]; objects.forEach((o,i)=>{xref.push(pdf.length); pdf+=(i+1)+' 0 obj\n'+o+'\nendobj\n';}); const start=pdf.length; pdf+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n'; xref.slice(1).forEach(n=>pdf+=String(n).padStart(10,'0')+' 00000 n \n'); pdf+='trailer << /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+start+'\n%%EOF';
    return new Blob([pdf],{type:'application/pdf'});
  }
  function filename(){ return 'Vardophase_RFQ_'+(ctx().orderNo||'Document').replace(/[^A-Za-z0-9_-]+/g,'_')+'.pdf'; }
  function downloadPdf(){ const blob=makePdfBlob(); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename(); document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},1800); return blob; }
  async function sharePdf(){
    const blob=makePdfBlob(); const file=new File([blob], filename(), {type:'application/pdf'}); const c=ctx();
    if(navigator.canShare && navigator.canShare({files:[file]}) && navigator.share){
      try{ await navigator.share({title:c.subject, text:c.body, files:[file]}); return; }catch(e){ if(e && e.name==='AbortError') return; }
    }
    downloadPdf(); alert('PDF downloaded. Open Gmail/Apple Mail and attach the PDF.');
  }
  function openPrintable(){ if(typeof window.vardoPrintCurrentDocument==='function') return window.vardoPrintCurrentDocument(); if(typeof window.printEntryOrder==='function') return window.printEntryOrder(); window.print(); }
  function openGmail(){ const c=ctx(); window.open('https://mail.google.com/mail/?view=cm&fs=1&to='+enc(c.to)+'&su='+enc(c.subject)+'&body='+enc(c.body), '_blank'); }
  function openDefaultMail(){ const c=ctx(); window.location.href='mailto:'+enc(c.to)+'?subject='+enc(c.subject)+'&body='+enc(c.body); }
  function openOutlookWeb(){ const c=ctx(); window.open('https://outlook.office.com/mail/deeplink/compose?to='+enc(c.to)+'&subject='+enc(c.subject)+'&body='+enc(c.body), '_blank'); }
  function blobToBase64(blob){
    return new Promise((resolve,reject)=>{
      const r=new FileReader();
      r.onload=()=>resolve(String(r.result||'').split(',')[1]||'');
      r.onerror=reject;
      r.readAsDataURL(blob);
    });
  }
  async function autoEmailReady(){
    const c=ctx();
    let to=(c.to||'').trim();
    if(!to){
      to=prompt('Supplier email is missing. Enter supplier email address:','')||'';
      to=to.trim();
    }
    if(!to) return alert('No supplier email. Email was not sent.');
    const ok=confirm('Send RFQ now to '+to+'?\n\nSubject: '+c.subject+'\nPDF will be attached automatically.');
    if(!ok) return;
    const blob=makePdfBlob();
    const pdfBase64=await blobToBase64(blob);
    const btns=document.querySelectorAll('#v370Btns button');
    btns.forEach(b=>b.disabled=true);
    try{
      const res=await fetch('/.netlify/functions/send-rfq',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          to,
          subject:c.subject,
          text:c.body,
          html:'<p>Good day</p><p>Please send a quote for the attached RFQ / Purchase Order.</p><p>Warm regards,<br><b>Vardophase</b><br>Cell: 063 508 4346<br>Email: info@vardophase.co.za</p>',
          filename:filename(),
          pdfBase64,
          orderNo:c.orderNo,
          supplier:c.supplier
        })
      });
      const data=await res.json().catch(()=>({}));
      if(!res.ok || !data.success) throw new Error(data.error || ('HTTP '+res.status));
      alert('RFQ sent successfully to '+to);
      const sel=document.getElementById('entryStatus');
      if(sel){ sel.value='Sent'; }
      if(typeof window.saveEntry==='function'){ try{ await window.saveEntry(); }catch(e){} }
    }catch(err){
      console.error('V374 SendGrid send failed',err);
      alert('Email failed: '+(err.message||err)+'\n\nCheck Netlify Environment Variables: SENDGRID_API_KEY, FROM_EMAIL, FROM_NAME.');
    }finally{
      btns.forEach(b=>b.disabled=false);
    }
  }
  function btn(label,sub,fn,gold){ const b=document.createElement('button'); b.type='button'; b.innerHTML='<div style="font-weight:900;font-size:14px">'+label+'</div>'+(sub?'<div style="font-weight:500;opacity:.78;font-size:12px;margin-top:4px;line-height:1.35">'+sub+'</div>':''); b.onclick=fn; b.style.cssText='padding:14px;border-radius:15px;border:1px solid '+(gold?'#d7b06c':'rgba(255,255,255,.18)')+';background:'+(gold?'linear-gradient(135deg,#f2d09a,#b98745)':'rgba(255,255,255,.08)')+';color:'+(gold?'#111':'#fff')+';cursor:pointer;text-align:left'; return b; }
  function showChooser(){
    clearChoices(); const old=$('v370EmailChooser'); if(old) old.remove(); const c=ctx();
    const overlay=document.createElement('div'); overlay.id='v370EmailChooser'; overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.62);z-index:999999;display:flex;align-items:center;justify-content:center;padding:18px';
    const card=document.createElement('div'); card.style.cssText='width:min(590px,96vw);border-radius:22px;background:#15171d;color:#fff;border:1px solid rgba(211,174,112,.50);box-shadow:0 24px 80px rgba(0,0,0,.62);padding:22px;font-family:Arial,Helvetica,sans-serif';
    card.innerHTML='<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><h2 style="margin:0 0 6px;font-size:22px">V374 Smart Email System</h2><div style="opacity:.78;font-size:13px">בחר שליחה / שיתוף PDF / Gmail / Outlook / הדפסה.</div></div><button id="v370Close" style="border:0;background:transparent;color:#fff;font-size:25px;cursor:pointer">×</button></div><div style="margin:16px 0;padding:12px;border-radius:14px;background:rgba(255,255,255,.06);font-size:13px;line-height:1.5"><b>To:</b> '+esc(c.to||'לא נמצא מייל ספק — תמלא ידנית')+'<br><b>Subject:</b> '+esc(c.subject)+'</div><div id="v370Btns" style="display:grid;grid-template-columns:1fr;gap:10px"></div><div style="margin-top:13px;opacity:.75;font-size:12px;line-height:1.45">במובייל הכי טוב: Share PDF → בוחר Gmail/Apple Mail → הקובץ מצורף. Gmail Web לא מאפשר צירוף אוטומטי דרך דפדפן.</div>';
    const box=card.querySelector('#v370Btns');
    box.appendChild(btn('Send RFQ (Auto Email)', 'שולח אמיתי דרך SendGrid / Netlify עם PDF מצורף.', autoEmailReady, true));
    box.appendChild(btn('Share PDF (Mobile)', 'פותח Share של iPhone / Android עם PDF מצורף.', function(){ overlay.remove(); sharePdf(); }, true));
    box.appendChild(btn('Open Gmail Draft', 'פותח Gmail עם To / Subject / Body. צירוף PDF ידני בלבד.', function(){ overlay.remove(); openGmail(); }, false));
    box.appendChild(btn('Default Email App', 'פותח Apple Mail / Gmail App / Outlook לפי ברירת המחדל במכשיר.', function(){ overlay.remove(); openDefaultMail(); }, false));
    box.appendChild(btn('Outlook Web / Microsoft 365', 'פותח Outlook בדפדפן עם הטקסט מוכן.', function(){ overlay.remove(); openOutlookWeb(); }, false));
    box.appendChild(btn('Open / Save / Print PDF', 'פותח את המסמך הרגיל לשמירה או הדפסה.', function(){ overlay.remove(); openPrintable(); }, false));
    box.appendChild(btn('Reset / Change Email Method', 'מאפס בחירה ישנה ומציג שוב את החלון.', function(){ clearChoices(); alert('הבחירה אופסה. לחץ שוב Email ובחר שיטה.'); }, false));
    overlay.appendChild(card); document.body.appendChild(overlay); card.querySelector('#v370Close').onclick=()=>overlay.remove(); overlay.addEventListener('click', e=>{ if(e.target===overlay) overlay.remove(); });
  }
  function enhanceButtons(){ document.querySelectorAll('button').forEach(b=>{ const t=(b.textContent||'').trim(); const oc=String(b.getAttribute('onclick')||''); if(/^Email(\s*\/\s*Choose)?$/i.test(t) && /emailEntryOrder/.test(oc)) b.textContent='Email / Send / Share'; }); }
  window.emailEntryOrder=showChooser; window.v367UniversalEmailChooser=showChooser; window.v368EmailChooser=showChooser; window.v369EmailChooser=showChooser; window.v370EmailChooser=showChooser; window.resetEmailChoice=function(){clearChoices(); showChooser();}; window.v370SharePdf=sharePdf; window.v370DownloadPdf=downloadPdf;
  document.addEventListener('click', function(e){ const b=e.target && e.target.closest && e.target.closest('button'); if(!b) return; const txt=(b.textContent||'').trim(); const oc=String(b.getAttribute('onclick')||''); if((/^Email(\s*\/\s*(Choose|Send|Share))?$/i.test(txt) || /emailEntryOrder/.test(oc)) && /emailEntryOrder/.test(oc)){ e.preventDefault(); e.stopPropagation(); showChooser(); } }, true);
  document.addEventListener('DOMContentLoaded', enhanceButtons); setInterval(enhanceButtons, 1200);
})();
