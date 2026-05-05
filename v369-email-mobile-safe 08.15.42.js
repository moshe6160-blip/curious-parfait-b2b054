
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
    const body='Good day\n\nPlease send a quote for the RFQ.\n\nI will attach / send the PDF document.\n\nWarm regards\nCam\n\nVardophase | Cell: 063 508 4346\nEmail: cam@vardophase.co.za';
    return {supplier,orderNo,to,subject,body};
  }
  function openPrintable(){
    if(typeof window.vardoPrintCurrentDocument==='function') return window.vardoPrintCurrentDocument();
    if(typeof window.printEntryOrder==='function') return window.printEntryOrder();
    window.print();
  }
  function openDefaultMail(){ const c=ctx(); window.location.href='mailto:'+enc(c.to)+'?subject='+enc(c.subject)+'&body='+enc(c.body); }
  function openGmail(){ const c=ctx(); window.location.href='https://mail.google.com/mail/?view=cm&fs=1&to='+enc(c.to)+'&su='+enc(c.subject)+'&body='+enc(c.body); }
  function openOutlookWeb(){ const c=ctx(); window.location.href='https://outlook.office.com/mail/deeplink/compose?to='+enc(c.to)+'&subject='+enc(c.subject)+'&body='+enc(c.body); }
  function btn(label, sub, fn){
    const b=document.createElement('button'); b.type='button';
    b.innerHTML='<div style="font-weight:800;font-size:14px">'+label+'</div>'+(sub?'<div style="font-weight:500;opacity:.78;font-size:12px;margin-top:3px;line-height:1.35">'+sub+'</div>':'');
    b.onclick=fn; return b;
  }
  function showChooser(){
    clearOldEmailChoice();
    const old=$('v369EmailChooser'); if(old) old.remove();
    const c=ctx();
    const overlay=document.createElement('div'); overlay.id='v369EmailChooser'; overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.58);z-index:999999;display:flex;align-items:center;justify-content:center;padding:18px';
    const card=document.createElement('div'); card.style.cssText='width:min(560px,96vw);border-radius:22px;background:#15171d;color:#fff;border:1px solid rgba(211,174,112,.48);box-shadow:0 24px 80px rgba(0,0,0,.6);padding:22px;font-family:Arial,Helvetica,sans-serif';
    card.innerHTML='<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><h2 style="margin:0 0 6px;font-size:22px">Email / PDF</h2><div style="opacity:.78;font-size:13px">גרסה בטוחה לטלפון: בחירה במייל לא פותחת את מסך ה-PDF לבד.</div></div><button id="v369Close" style="border:0;background:transparent;color:#fff;font-size:24px;cursor:pointer">×</button></div><div style="margin:16px 0;padding:12px;border-radius:14px;background:rgba(255,255,255,.06);font-size:13px;line-height:1.5"><b>To:</b> '+(c.to||'לא נמצא מייל ספק — אפשר למלא ידנית')+'<br><b>Subject:</b> '+c.subject+'</div><div id="v369Btns" style="display:grid;grid-template-columns:1fr;gap:10px"></div><div style="margin-top:14px;opacity:.75;font-size:12px;line-height:1.45">חשוב: Gmail/Outlook בדפדפן לא מאפשרים צירוף PDF אוטומטי דרך כפתור באתר. קודם שמור/שתף PDF, ואז פתח Gmail/Outlook ושלח.</div>';
    const box=card.querySelector('#v369Btns');
    function style(b, gold){ b.style.cssText='padding:13px 14px;border-radius:14px;border:1px solid '+(gold?'#d7b06c':'rgba(255,255,255,.18)')+';background:'+(gold?'linear-gradient(135deg,#f2d09a,#b98745)':'rgba(255,255,255,.08)')+';color:'+(gold?'#111':'#fff')+';cursor:pointer;text-align:left'; return b; }
    box.appendChild(style(btn('Gmail Web', 'פותח Gmail בלבד. לא פותח PDF ולא נתקע במסך הדפסה.', function(){ overlay.remove(); openGmail(); }), true));
    box.appendChild(style(btn('Default Email App', 'פותח את אפליקציית המייל שמוגדרת במכשיר.', function(){ overlay.remove(); openDefaultMail(); }), false));
    box.appendChild(style(btn('Outlook Web / Microsoft 365', 'פותח Outlook בדפדפן בלבד.', function(){ overlay.remove(); openOutlookWeb(); }), false));
    box.appendChild(style(btn('Open / Save PDF', 'פתח את מסמך ההזמנה לשמירה, הדפסה או שיתוף ידני.', function(){ overlay.remove(); openPrintable(); }), false));
    box.appendChild(style(btn('Reset / Change Email Method', 'מאפס בחירה ישנה ומציג שוב את החלון.', function(){ clearOldEmailChoice(); alert('הבחירה אופסה. לחץ שוב Email ובחר שיטה אחרת.'); }), false));
    overlay.appendChild(card); document.body.appendChild(overlay);
    card.querySelector('#v369Close').onclick=function(){ overlay.remove(); };
    overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.remove(); });
  }
  function enhanceButtons(){
    document.querySelectorAll('button').forEach(function(b){
      const t=(b.textContent||'').trim(); const oc=String(b.getAttribute('onclick')||'');
      if(/^Email$/i.test(t) && oc.includes('emailEntryOrder')) b.textContent='Email / Choose';
    });
  }
  window.emailEntryOrder=showChooser;
  window.v367UniversalEmailChooser=showChooser;
  window.v368EmailChooser=showChooser;
  window.v369EmailChooser=showChooser;
  window.resetEmailChoice=function(){ clearOldEmailChoice(); showChooser(); };
  document.addEventListener('click', function(e){
    const b=e.target && e.target.closest && e.target.closest('button'); if(!b) return;
    const txt=(b.textContent||'').trim(); const oc=String(b.getAttribute('onclick')||'');
    if((/^Email(\s*\/\s*Choose)?$/i.test(txt) || /emailEntryOrder/.test(oc)) && /emailEntryOrder/.test(oc)){
      e.preventDefault(); e.stopPropagation(); showChooser();
    }
  }, true);
  document.addEventListener('DOMContentLoaded', enhanceButtons);
  setInterval(enhanceButtons, 1200);
})();
