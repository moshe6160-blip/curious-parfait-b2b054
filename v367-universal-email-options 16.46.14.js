(function(){
  'use strict';
  const SUPPLIER_KEY='vp_supplier_details_v325';
  function $(id){ return document.getElementById(id); }
  function val(id){ return ($(id)?.value || '').trim(); }
  function enc(s){ return encodeURIComponent(String(s||'')); }
  function supplierEmail(name){
    try{ const m=JSON.parse(localStorage.getItem(SUPPLIER_KEY)||'{}')||{}; return (m[String(name||'').trim()]?.email||'').trim(); }catch(e){ return ''; }
  }
  function ctx(){
    const supplier=val('entrySupplier');
    const orderNo=val('entryOrderNo') || val('entryInvoiceNo') || 'document';
    const to=supplierEmail(supplier);
    const subject='RFQ: '+orderNo;
    const body='Good day\n\nPlease send a quote for the attached RFQ.\n\nWarm regards\nCam\n\nVardophase | Cell: 063 508 4346\nEmail: cam@vardophase.co.za';
    return {supplier,orderNo,to,subject,body};
  }
  function openPrintable(){
    if(typeof window.vardoPrintCurrentDocument==='function') return window.vardoPrintCurrentDocument();
    if(typeof window.printEntryOrder==='function') return window.printEntryOrder();
    window.print();
  }
  function openDefaultMail(){ const c=ctx(); location.href='mailto:'+enc(c.to)+'?subject='+enc(c.subject)+'&body='+enc(c.body); }
  function openGmail(){ const c=ctx(); window.open('https://mail.google.com/mail/?view=cm&fs=1&to='+enc(c.to)+'&su='+enc(c.subject)+'&body='+enc(c.body), '_blank'); }
  function openOutlookWeb(){ const c=ctx(); window.open('https://outlook.office.com/mail/deeplink/compose?to='+enc(c.to)+'&subject='+enc(c.subject)+'&body='+enc(c.body), '_blank'); }
  function notifyAttach(){ setTimeout(function(){ alert('המסמך נפתח להדפסה / שמירה כ-PDF. שמור PDF וצרף אותו למייל שבחרת.'); }, 350); }
  function btn(label, fn, cls){ const b=document.createElement('button'); b.type='button'; b.className=cls||''; b.textContent=label; b.onclick=fn; return b; }
  function showChooser(){
    const old=$('v367EmailChooser'); if(old) old.remove();
    const c=ctx();
    const overlay=document.createElement('div'); overlay.id='v367EmailChooser'; overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:999999;display:flex;align-items:center;justify-content:center;padding:18px';
    const card=document.createElement('div'); card.style.cssText='width:min(520px,96vw);border-radius:22px;background:#15171d;color:#fff;border:1px solid rgba(211,174,112,.45);box-shadow:0 24px 80px rgba(0,0,0,.55);padding:22px;font-family:Arial,Helvetica,sans-serif';
    card.innerHTML='<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><h2 style="margin:0 0 6px;font-size:22px">Send document</h2><div style="opacity:.78;font-size:13px">בחר איך לשלוח. המערכת לא מכריחה Outlook ולא Apple Mail.</div></div><button id="v367Close" style="border:0;background:transparent;color:#fff;font-size:24px;cursor:pointer">×</button></div><div style="margin:16px 0;padding:12px;border-radius:14px;background:rgba(255,255,255,.06);font-size:13px;line-height:1.5"><b>To:</b> '+(c.to||'לא נמצא מייל ספק — אפשר למלא ידנית')+'<br><b>Subject:</b> '+c.subject+'</div><div id="v367Btns" style="display:grid;grid-template-columns:1fr;gap:10px"></div><div style="margin-top:14px;opacity:.7;font-size:12px;line-height:1.4">חשוב: דפדפנים לא מאפשרים לצרף PDF אוטומטית ל-Gmail/Outlook דרך לינק רגיל. לכן פותחים מייל מוכן + פותחים את המסמך לשמירה/צירוף.</div>';
    const box=card.querySelector('#v367Btns');
    function style(b, gold){ b.style.cssText='padding:13px 14px;border-radius:14px;border:1px solid '+(gold?'#d7b06c':'rgba(255,255,255,.18)')+';background:'+(gold?'linear-gradient(135deg,#f2d09a,#b98745)':'rgba(255,255,255,.08)')+';color:'+(gold?'#111':'#fff')+';font-weight:700;cursor:pointer;text-align:left'; return b; }
    box.appendChild(style(btn('Default email app / Apple Mail / Gmail app', function(){ openDefaultMail(); openPrintable(); notifyAttach(); overlay.remove(); }, 'v367'), true));
    box.appendChild(style(btn('Gmail Web', function(){ openGmail(); openPrintable(); notifyAttach(); overlay.remove(); }, 'v367'), false));
    box.appendChild(style(btn('Outlook Web / Microsoft 365', function(){ openOutlookWeb(); openPrintable(); notifyAttach(); overlay.remove(); }, 'v367'), false));
    box.appendChild(style(btn('Only open / save PDF', function(){ openPrintable(); overlay.remove(); }, 'v367'), false));
    overlay.appendChild(card); document.body.appendChild(overlay);
    card.querySelector('#v367Close').onclick=function(){ overlay.remove(); };
    overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.remove(); });
  }
  window.emailEntryOrder = showChooser;
  window.v367UniversalEmailChooser = showChooser;
  document.addEventListener('click', function(e){
    const b=e.target && e.target.closest && e.target.closest('button');
    if(!b) return;
    if(/^\s*Email\s*$/i.test(b.textContent||'') && String(b.getAttribute('onclick')||'').includes('emailEntryOrder')){
      e.preventDefault(); e.stopPropagation(); showChooser();
    }
  }, true);
})();
