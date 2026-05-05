(function(){
  'use strict';
  const SUPPLIER_KEY='vp_supplier_details_v325';
  const OLD_CHOICE_KEYS=['emailPreference','emailMethod','v367EmailMethod','vardoEmailMethod','vp_email_method','vpEmailMethod','selectedEmailMethod'];
  function clearOldEmailChoice(){ try{ OLD_CHOICE_KEYS.forEach(k=>localStorage.removeItem(k)); }catch(e){} }
  clearOldEmailChoice();
  function $(id){ return document.getElementById(id); }
  function val(id){ return ($(id)?.value || '').trim(); }
  function enc(s){ return encodeURIComponent(String(s||'')); }
  function supplierEmail(name){
    try{ const m=JSON.parse(localStorage.getItem(SUPPLIER_KEY)||'{}')||{}; return (m[String(name||'').trim()]?.email||'').trim(); }catch(e){ return ''; }
  }
  function ctx(){
    const supplier=val('entrySupplier');
    const orderNo=val('entryOrderNo') || val('entryInvoiceNo') || val('entrySupplierOrderNo') || 'document';
    const to=supplierEmail(supplier) || val('entryEmail') || val('supplierEmail');
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
  function btn(label, fn){ const b=document.createElement('button'); b.type='button'; b.textContent=label; b.onclick=fn; return b; }
  function showChooser(){
    clearOldEmailChoice();
    const old=$('v368EmailChooser'); if(old) old.remove();
    const c=ctx();
    const overlay=document.createElement('div'); overlay.id='v368EmailChooser'; overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.58);z-index:999999;display:flex;align-items:center;justify-content:center;padding:18px';
    const card=document.createElement('div'); card.style.cssText='width:min(540px,96vw);border-radius:22px;background:#15171d;color:#fff;border:1px solid rgba(211,174,112,.48);box-shadow:0 24px 80px rgba(0,0,0,.6);padding:22px;font-family:Arial,Helvetica,sans-serif';
    card.innerHTML='<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><h2 style="margin:0 0 6px;font-size:22px">Email / PDF</h2><div style="opacity:.78;font-size:13px">כל לחיצה מציגה בחירה מחדש — לא ננעל על PDF ולא על Outlook.</div></div><button id="v368Close" style="border:0;background:transparent;color:#fff;font-size:24px;cursor:pointer">×</button></div><div style="margin:16px 0;padding:12px;border-radius:14px;background:rgba(255,255,255,.06);font-size:13px;line-height:1.5"><b>To:</b> '+(c.to||'לא נמצא מייל ספק — אפשר למלא ידנית')+'<br><b>Subject:</b> '+c.subject+'</div><div id="v368Btns" style="display:grid;grid-template-columns:1fr;gap:10px"></div><div style="margin-top:14px;opacity:.72;font-size:12px;line-height:1.45">הערה: דפדפנים לא מאפשרים לצרף PDF אוטומטית ל-Gmail/Outlook דרך לינק רגיל. לכן המערכת פותחת מייל מוכן + את המסמך לשמירה/צירוף ידני.</div>';
    const box=card.querySelector('#v368Btns');
    function style(b, gold){ b.style.cssText='padding:13px 14px;border-radius:14px;border:1px solid '+(gold?'#d7b06c':'rgba(255,255,255,.18)')+';background:'+(gold?'linear-gradient(135deg,#f2d09a,#b98745)':'rgba(255,255,255,.08)')+';color:'+(gold?'#111':'#fff')+';font-weight:700;cursor:pointer;text-align:left'; return b; }
    box.appendChild(style(btn('Default email app / Apple Mail / Gmail app', function(){ openDefaultMail(); openPrintable(); notifyAttach(); overlay.remove(); }), true));
    box.appendChild(style(btn('Gmail Web', function(){ openGmail(); openPrintable(); notifyAttach(); overlay.remove(); }), false));
    box.appendChild(style(btn('Outlook Web / Microsoft 365', function(){ openOutlookWeb(); openPrintable(); notifyAttach(); overlay.remove(); }), false));
    box.appendChild(style(btn('Only open / save PDF', function(){ openPrintable(); overlay.remove(); }), false));
    box.appendChild(style(btn('Reset / Change Email Method', function(){ clearOldEmailChoice(); alert('הבחירה אופסה. לחץ שוב Email ובחר שיטה אחרת.'); }), false));
    overlay.appendChild(card); document.body.appendChild(overlay);
    card.querySelector('#v368Close').onclick=function(){ overlay.remove(); };
    overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.remove(); });
  }
  function enhanceButtons(){
    document.querySelectorAll('button').forEach(function(b){
      const t=(b.textContent||'').trim();
      const oc=String(b.getAttribute('onclick')||'');
      if(/^Email$/i.test(t) && oc.includes('emailEntryOrder')) b.textContent='Email / Choose';
    });
  }
  window.emailEntryOrder=showChooser;
  window.v367UniversalEmailChooser=showChooser;
  window.v368EmailChooser=showChooser;
  window.resetEmailChoice=function(){ clearOldEmailChoice(); showChooser(); };
  document.addEventListener('click', function(e){
    const b=e.target && e.target.closest && e.target.closest('button');
    if(!b) return;
    const txt=(b.textContent||'').trim();
    const oc=String(b.getAttribute('onclick')||'');
    if((/^Email(\s*\/\s*Choose)?$/i.test(txt) || /emailEntryOrder/.test(oc)) && /emailEntryOrder/.test(oc)){
      e.preventDefault(); e.stopPropagation(); showChooser();
    }
  }, true);
  document.addEventListener('DOMContentLoaded', enhanceButtons);
  setInterval(enhanceButtons, 1200);
})();
