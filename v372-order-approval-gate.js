(function(){
  'use strict';
  const VERSION='V372_ORDER_APPROVAL_GATE';
  const APPROVED='Approved';
  const PENDING='Pending Approval';
  const POP_KEY='v372_pending_approval_popup_seen_ids';
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function isOrderRow(r){return !!String(r?.order_no||'').trim() && !String(r?.invoice_no||'').trim();}
  function isPendingStatus(s){s=String(s||'').toLowerCase(); return s.includes('pending') || s.includes('wait') || s.includes('approval') || s.includes('ממתין');}
  function isApprovedStatus(s){s=String(s||'').toLowerCase(); return s.includes('approved') || s.includes('מאושר');}
  function supa(){return window.vpSupabase || window.supabase || null;}
  function money(v){const n=Number(v||0); return 'R '+n.toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2});}
  function getCheckedIds(){
    const ids=[];
    document.querySelectorAll('input.row-check:checked,input[type="checkbox"].premium-check:checked').forEach(cb=>{
      const holder=cb.closest('td')||cb.parentElement;
      const txt=(holder?.getAttribute('onclick')||cb.getAttribute('onclick')||'')+'';
      const m=txt.match(/toggleRowSelect\(['"]([^'"]+)['"]/);
      if(m && !ids.includes(m[1])) ids.push(m[1]);
    });
    return ids;
  }
  async function approveIds(ids){
    if(!ids.length) return alert('Select one or more order rows first.');
    const db=supa(); if(!db) return alert('Database connection not ready.');
    const {data,error}=await db.from('suppliers').select('*').in('id',ids);
    if(error) return alert(error.message);
    const orders=(data||[]).filter(isOrderRow);
    if(!orders.length) return alert('Select order rows only.');
    const {error:upErr}=await db.from('suppliers').update({status:APPROVED}).in('id',orders.map(r=>r.id));
    if(upErr) return alert(upErr.message);
    toast('Approved '+orders.length+' order(s). You can now send to supplier.');
    setTimeout(()=>{ try{ if(typeof window.render==='function') window.render(); }catch(_e){} },650);
  }
  window.approveSelectedOrdersV372=function(){ approveIds(getCheckedIds()); };
  async function approveCurrentForm(){
    const id=findOpenEntryId();
    const status=document.getElementById('entryStatus');
    if(status) status.value=APPROVED;
    if(!id){ toast('Order marked Approved in the form. Save Entry to keep it.'); return; }
    await approveIds([id]);
  }
  function findOpenEntryId(){
    const m=document.querySelector('#entryModal.show'); if(!m) return '';
    // Try to find selected/open id from checked row first. If not available, leave for form-save flow.
    return getCheckedIds()[0] || '';
  }
  function ensureStatusOptions(){
    const sel=document.getElementById('entryStatus');
    if(!sel || sel.dataset.v372Done==='1') return;
    const existing=[...sel.options].map(o=>o.value);
    [PENDING,APPROVED].forEach(v=>{ if(!existing.includes(v)){ const o=document.createElement('option'); o.value=v; o.textContent=v; sel.appendChild(o); }});
    sel.dataset.v372Done='1';
  }
  function enhanceEntryModal(){
    ensureStatusOptions();
    const mode=(document.getElementById('entryMode')?.value||'').trim();
    const sel=document.getElementById('entryStatus');
    if(sel && mode==='order' && (!sel.value || sel.value==='Unpaid')) sel.value=PENDING;
    const actions=document.querySelector('#entryModal .modal-actions');
    if(actions && !actions.querySelector('.v372-approve-current')){
      const b=document.createElement('button'); b.type='button'; b.className='primary v372-approve-current'; b.textContent='Approve Order'; b.onclick=approveCurrentForm;
      actions.insertBefore(b, actions.querySelector('.spacer') || actions.firstChild);
    }
    const msg=document.getElementById('entryStatusMsg');
    if(msg && mode==='order' && sel && isPendingStatus(sel.value) && !document.getElementById('v372OrderHint')){
      const hint=document.createElement('div'); hint.id='v372OrderHint'; hint.className='status error'; hint.textContent='Order is waiting for approval. Supplier sending is locked until Approved.'; msg.insertAdjacentElement('afterend', hint);
    }
  }
  function injectToolbarButton(){
    document.querySelectorAll('.supplier-selection-toolbar,.toolbar').forEach(tb=>{
      if(tb.querySelector('.v372-approve-selected')) return;
      if(!/Convert Order|Credit Note|Mark Selected|Delete Selected/i.test(tb.textContent||'')) return;
      const b=document.createElement('button'); b.type='button'; b.className='green v372-approve-selected main-action'; b.textContent='Approve Order'; b.onclick=window.approveSelectedOrdersV372;
      tb.insertBefore(b,tb.firstChild);
    });
  }
  function styleBadges(){
    document.querySelectorAll('td .badge').forEach(b=>{
      const t=(b.textContent||'').trim();
      if(isPendingStatus(t)){ b.classList.add('v372-pending-badge'); b.textContent='Pending Approval'; }
      if(isApprovedStatus(t)){ b.classList.add('v372-approved-badge'); b.textContent='Approved'; }
    });
  }
  async function pendingRows(){
    const db=supa(); if(!db) return [];
    const {data,error}=await db.from('suppliers').select('id,supplier,order_no,project,total,amount,status,invoice_no,created_at').not('order_no','is',null).is('invoice_no',null).order('created_at',{ascending:false}).limit(30);
    if(error) return [];
    return (data||[]).filter(r=>isOrderRow(r) && isPendingStatus(r.status));
  }
  function seenIds(){try{return JSON.parse(localStorage.getItem(POP_KEY)||'[]');}catch(e){return [];}}
  function setSeen(ids){try{localStorage.setItem(POP_KEY,JSON.stringify(ids.slice(-100)));}catch(e){}}
  async function showPendingPopup(force){
    const rows=await pendingRows(); if(!rows.length) return;
    const seen=seenIds();
    const fresh=force?rows:rows.filter(r=>!seen.includes(String(r.id)));
    if(!fresh.length) return;
    setSeen([...new Set(seen.concat(fresh.map(r=>String(r.id))))]);
    const old=document.getElementById('v372ApprovalPopup'); if(old) old.remove();
    const overlay=document.createElement('div'); overlay.id='v372ApprovalPopup'; overlay.style.cssText='position:fixed;inset:0;z-index:999998;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center;padding:16px';
    const card=document.createElement('div'); card.style.cssText='width:min(640px,96vw);max-height:88vh;overflow:auto;border-radius:22px;background:#14161d;color:white;border:1px solid rgba(215,176,108,.75);box-shadow:0 25px 90px rgba(0,0,0,.65);padding:20px;font-family:Arial,Helvetica,sans-serif';
    card.innerHTML='<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><h2 style="margin:0 0 6px;font-size:22px;color:#f2d09a">Orders Waiting Approval</h2><div style="font-size:13px;opacity:.8">יש הזמנות שצריך לאשר לפני שליחה לספק.</div></div><button id="v372ClosePop" style="border:0;background:transparent;color:#fff;font-size:28px;cursor:pointer">×</button></div><div id="v372Rows" style="display:grid;gap:10px;margin-top:16px"></div><div style="margin-top:14px;font-size:12px;opacity:.75">אחרי אישור הסטטוס משתנה ל-Approved ואז כפתור Email / Send / Share נפתח.</div>';
    const box=card.querySelector('#v372Rows');
    fresh.forEach(r=>{
      const row=document.createElement('div'); row.style.cssText='padding:13px;border-radius:15px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center';
      row.innerHTML='<div><b>'+esc(r.order_no||'Order')+'</b><div style="font-size:13px;opacity:.82;margin-top:4px">'+esc(r.supplier||'')+' · '+esc(r.project||'')+' · '+money(r.total||r.amount||0)+'</div><div style="font-size:12px;color:#f2d09a;margin-top:4px">Pending Approval</div></div>';
      const b=document.createElement('button'); b.textContent='Approve'; b.style.cssText='padding:10px 14px;border-radius:12px;border:1px solid #d7b06c;background:linear-gradient(135deg,#f2d09a,#b98745);color:#111;font-weight:900;cursor:pointer'; b.onclick=()=>approveIds([r.id]);
      row.appendChild(b); box.appendChild(row);
    });
    overlay.appendChild(card); document.body.appendChild(overlay); card.querySelector('#v372ClosePop').onclick=()=>overlay.remove(); overlay.addEventListener('click',e=>{if(e.target===overlay) overlay.remove();});
  }
  function toast(msg){
    let t=document.getElementById('v372Toast'); if(t) t.remove();
    t=document.createElement('div'); t.id='v372Toast'; t.textContent=msg; t.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:1000000;background:#111;color:#f2d09a;border:1px solid #d7b06c;border-radius:14px;padding:12px 16px;box-shadow:0 14px 44px rgba(0,0,0,.45);font-weight:800;max-width:92vw;text-align:center';
    document.body.appendChild(t); setTimeout(()=>t.remove(),2600);
  }
  const oldEmail=window.emailEntryOrder;
  window.emailEntryOrder=function(){
    const sel=document.getElementById('entryStatus');
    if(sel && isPendingStatus(sel.value)) return alert('Order is waiting for approval. Click Approve Order before sending to supplier.');
    return oldEmail ? oldEmail.apply(this,arguments) : (window.v370EmailChooser && window.v370EmailChooser());
  };
  const oldSave=window.saveEntry;
  window.saveEntry=async function(){
    const mode=(document.getElementById('entryMode')?.value||'').trim();
    ensureStatusOptions();
    const sel=document.getElementById('entryStatus');
    if(mode==='order' && sel && (!sel.value || sel.value==='Unpaid')) sel.value=PENDING;
    return oldSave ? await oldSave.apply(this,arguments) : undefined;
  };
  window.showPendingApprovalOrdersV372=function(){showPendingPopup(true);};
  const css=document.createElement('style'); css.id='v372-approval-style'; css.textContent='.v372-pending-badge{background:#6b3f00!important;color:#ffd994!important;border:1px solid #d7b06c!important}.v372-approved-badge{background:#123d26!important;color:#9de0b8!important;border:1px solid rgba(157,224,184,.7)!important}.v372-approve-selected{background:linear-gradient(135deg,#b7f0ce,#4ca06d)!important;color:#08150d!important;font-weight:900!important}@media(max-width:680px){#v372ApprovalPopup>div{padding:16px!important}#v372ApprovalPopup [style*="grid-template-columns:1fr auto"]{grid-template-columns:1fr!important}}'; document.head.appendChild(css);
  function tick(){injectToolbarButton(); enhanceEntryModal(); styleBadges();}
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(tick,500); setTimeout(()=>showPendingPopup(false),1700);});
  window.addEventListener('load',()=>{setTimeout(tick,700); setTimeout(()=>showPendingPopup(false),2200);});
  document.addEventListener('click',()=>setTimeout(tick,250),true);
  setTimeout(tick,1200); document.addEventListener('click',()=>setTimeout(tick,350),true);
  console.log(VERSION,'loaded');
})();
