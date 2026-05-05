(function(){
  'use strict';
  const VERSION='V376_PREORDER_ONLY_POPUP_FIX';
  const APPROVED='Approved';
  const PENDING='Pending Approval';
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function db(){return window.vpSupabase || window.supabase || null;}
  function money(v){const n=Number(v||0); return 'R '+n.toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2});}
  function kind(row){
    try{ return window.displayEntryKind ? window.displayEntryKind(row) : ''; }catch(e){ return ''; }
  }
  function hasInvoice(row){ return !!String(row && row.invoice_no || '').trim(); }
  function isOrder(row){ return !!String(row && row.order_no || '').trim() && !hasInvoice(row) && kind(row)!=='delivery_note' && kind(row)!=='credit_note' && kind(row)!=='deposit'; }
  function st(row){return String((row && row.status) || '').toLowerCase();}
  function isApproved(row){const s=st(row); return s.includes('approved') || s.includes('sent') || s.includes('מאושר') || s === 'app order' || s === 'approved order';}
  function isSent(row){const s=st(row); return s.includes('sent') || s.includes('נשלח') || s.includes('sent to supplier') || s === 'order sent';}
  function isPending(row){ if(!isOrder(row)) return false; return !isApproved(row); }
  function toast(msg){
    let t=document.getElementById('v375Toast'); if(t) t.remove();
    t=document.createElement('div'); t.id='v375Toast'; t.textContent=msg;
    t.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:1000000;background:#111;color:#f2d09a;border:1px solid #d7b06c;border-radius:14px;padding:12px 16px;box-shadow:0 14px 44px rgba(0,0,0,.45);font-weight:900;max-width:92vw;text-align:center';
    document.body.appendChild(t); setTimeout(()=>t.remove(),2600);
  }
  async function fetchPending(){
    const sup=db(); if(!sup) return [];
    const {data,error}=await sup.from('suppliers').select('id,supplier,order_no,project,total,amount,status,invoice_no,entry_type,description,notes,created_at').not('order_no','is',null).order('created_at',{ascending:false}).limit(80);
    if(error){ console.warn(VERSION,error); return []; }
    return (data||[]).filter(isPending);
  }
  async function approveIds(ids, keepOpen){
    ids=(ids||[]).filter(Boolean);
    if(!ids.length) return alert('Choose an order first.');
    const sup=db(); if(!sup) return alert('Database connection not ready.');
    const {error}=await sup.from('suppliers').update({status:APPROVED}).in('id',ids);
    if(error) return alert(error.message || 'Approval failed');
    toast('Approved. Status changed from Pre-Order to App order.');
    const sel=document.getElementById('entryStatus'); if(sel) sel.value=APPROVED;
    try{ if(typeof window.render==='function') await window.render(); }catch(e){}
    if(!keepOpen){ setTimeout(()=>window.showPendingApprovalOrdersV375(true),500); }
  }
  window.v375ApproveOrderIds=approveIds;
  window.v375OpenOrderForApproval=async function(id){
    const old=document.getElementById('v375ApprovalPopup'); if(old) old.remove();
    if(typeof window.openEntryModal==='function'){
      await window.openEntryModal(id);
      setTimeout(enhanceModalApprove,250);
    }
  };
  window.v375ApproveCurrentOrder=async function(){
    const modal=document.getElementById('entryModal');
    const id=modal?.dataset?.v375EntryId || modal?.getAttribute('data-v375-entry-id') || '';
    if(id) return approveIds([id], true);
    const sel=document.getElementById('entryStatus');
    if(sel) sel.value=APPROVED;
    toast('Marked Approved in the form. Press Save Entry to keep it.');
  };
  async function showPopup(force){
    const rows=await fetchPending();
    if(!rows.length){ if(force) toast('No Pre-Orders waiting for approval.'); return; }
    document.getElementById('v372ApprovalPopup')?.remove();
    document.getElementById('v375ApprovalPopup')?.remove();
    const overlay=document.createElement('div'); overlay.id='v375ApprovalPopup';
    overlay.style.cssText='position:fixed;inset:0;z-index:999998;background:rgba(0,0,0,.66);display:flex;align-items:center;justify-content:center;padding:16px';
    const card=document.createElement('div');
    card.style.cssText='width:min(760px,96vw);max-height:88vh;overflow:auto;border-radius:22px;background:#14161d;color:white;border:1px solid rgba(215,176,108,.82);box-shadow:0 25px 90px rgba(0,0,0,.65);padding:20px;font-family:Arial,Helvetica,sans-serif';
    card.innerHTML='<div class="v375-pop-head"><div><h2>Pre-Orders Waiting Approval</h2><div class="v375-sub">רשימת כל ההזמנות שעדיין לא אושרו. לחץ Open כדי להיכנס להזמנה, או Approve לאישור מיידי.</div></div><button id="v375ClosePop" class="v375-x">×</button></div><div id="v375Rows" class="v375-rows"></div><div class="v375-foot">לפני אישור: Pre-Order. אחרי אישור: App order. לאחר שליחה לספק: Order.</div>';
    const box=card.querySelector('#v375Rows');
    rows.forEach(r=>{
      const row=document.createElement('div'); row.className='v375-pop-row';
      row.innerHTML='<div class="v375-info"><b>'+esc(r.order_no||'Pre-Order')+'</b><div>'+esc(r.supplier||'')+' · '+esc(r.project||'')+' · '+money(r.total||r.amount||0)+'</div><span>Pre-Order / Waiting approval</span></div><div class="v375-row-actions"></div>';
      row.addEventListener('click',e=>{ if(e.target.closest('button')) return; window.v375OpenOrderForApproval(r.id); });
      const acts=row.querySelector('.v375-row-actions');
      const open=document.createElement('button'); open.className='v375-open'; open.textContent='Open'; open.onclick=()=>window.v375OpenOrderForApproval(r.id);
      const approve=document.createElement('button'); approve.className='v375-approve'; approve.textContent='Approve'; approve.onclick=()=>approveIds([r.id]);
      acts.appendChild(open); acts.appendChild(approve); box.appendChild(row);
    });
    overlay.appendChild(card); document.body.appendChild(overlay);
    card.querySelector('#v375ClosePop').onclick=()=>overlay.remove(); overlay.addEventListener('click',e=>{if(e.target===overlay) overlay.remove();});
  }
  window.showPendingApprovalOrdersV375=showPopup;
  // Keep old button names working, but show the new full list (not only fresh unseen rows).
  window.showPendingApprovalOrdersV372=function(){ showPopup(true); };

  function patchProcessLabels(){
    const oldLabel=window.processStatusLabel;
    if(oldLabel && oldLabel.__v375) return;
    window.processStatusLabel=function(row){
      try{
        if(isOrder(row)) return isSent(row) ? 'Order' : (isApproved(row) ? 'App order' : 'Pre-Order');
      }catch(e){}
      return oldLabel ? oldLabel(row) : 'Order';
    };
    window.processStatusLabel.__v375=true;
    const oldClass=window.processStatusClass;
    window.processStatusClass=function(row){
      try{
        if(isOrder(row)) return isSent(row) ? 'unpaid v375-order-badge' : (isApproved(row) ? 'unpaid v399-app-order-badge' : 'unpaid v375-preorder-badge');
      }catch(e){}
      return oldClass ? oldClass(row) : 'unpaid';
    };
  }
  function enhanceModalApprove(){
    const modal=document.getElementById('entryModal');
    if(!modal) return;
    const mode=(document.getElementById('entryMode')?.value||'').trim();
    const sel=document.getElementById('entryStatus');
    if(sel){
      const vals=[...sel.options].map(o=>o.value);
      [PENDING,APPROVED].forEach(v=>{ if(!vals.includes(v)){ const o=document.createElement('option'); o.value=v; o.textContent=v; sel.appendChild(o); }});
      if(mode==='order' && (!sel.value || sel.value==='Unpaid' || sel.value==='Pending')) sel.value=PENDING;
    }
    const btn=modal.querySelector('.v372-approve-current,.v375-approve-current');
    if(btn){ btn.textContent='Approve Order'; btn.classList.add('v375-approve-current'); btn.onclick=window.v375ApproveCurrentOrder; }
    const actions=modal.querySelector('.modal-actions');
    if(actions && !actions.querySelector('.v375-open-pending')){
      const b=document.createElement('button'); b.type='button'; b.className='soft v375-open-pending'; b.textContent='Pending Pre-Orders'; b.onclick=()=>showPopup(true);
      actions.insertBefore(b, actions.firstChild);
    }
  }
  function patchOpenModal(){
    if(!window.openEntryModal || window.openEntryModal.__v375) return;
    const old=window.openEntryModal;
    window.openEntryModal=async function(id=null, forcedMode=''){
      const res=await old.apply(this, arguments);
      const modal=document.getElementById('entryModal'); if(modal) modal.dataset.v375EntryId=id||'';
      setTimeout(enhanceModalApprove,80);
      return res;
    };
    window.openEntryModal.__v375=true;
  }
  function patchSave(){
    if(!window.saveEntry || window.saveEntry.__v375) return;
    const old=window.saveEntry;
    window.saveEntry=async function(){
      const mode=(document.getElementById('entryMode')?.value||'').trim();
      const sel=document.getElementById('entryStatus');
      if(mode==='order' && sel && (!sel.value || sel.value==='Unpaid' || sel.value==='Pending')) sel.value=PENDING;
      return await old.apply(this, arguments);
    };
    window.saveEntry.__v375=true;
  }

  async function relabelDomFromDb(){
    const sup=db(); if(!sup) return;
    const trs=[...document.querySelectorAll('tbody tr')];
    const ids=[];
    const idByTr=new Map();
    trs.forEach(tr=>{
      const m=(tr.getAttribute('onclick')||'').match(/openEntryModal\('([^']+)'\)/);
      if(m&&m[1]){ ids.push(m[1]); idByTr.set(tr,m[1]); }
    });
    if(!ids.length) return;
    const {data,error}=await sup.from('suppliers').select('id,order_no,status,invoice_no,entry_type,notes,total,amount,net_amount').in('id',ids.slice(0,200));
    if(error||!data) return;
    const map=new Map(data.map(r=>[String(r.id),r]));
    trs.forEach(tr=>{
      const r=map.get(String(idByTr.get(tr)||'')); if(!r) return;
      if(!isOrder(r)) return;
      const badge=tr.querySelector('td:nth-child(5) .badge, .badge'); if(!badge) return;
      if(isSent(r)){ badge.textContent='Order'; badge.classList.remove('v375-preorder-badge','v399-app-order-badge'); badge.classList.add('v375-order-badge'); }
      else if(isApproved(r)){ badge.textContent='App order'; badge.classList.remove('v375-preorder-badge','v375-order-badge'); badge.classList.add('v399-app-order-badge'); }
      else { badge.textContent='Pre-Order'; badge.classList.remove('v375-order-badge','v399-app-order-badge'); badge.classList.add('v375-preorder-badge'); }
    });
  }
  function relabelDom(){
    document.querySelectorAll('td .badge').forEach(b=>{
      const t=(b.textContent||'').trim();
      if(t==='Process' || t==='Pending Approval'){ b.textContent='Pre-Order'; b.classList.add('v375-preorder-badge'); }
      if(t==='Approved' || t==='App Order'){ b.textContent='App order'; b.classList.remove('v375-order-badge'); b.classList.add('v399-app-order-badge'); }
      if(t==='Sent'){ b.textContent='Order'; b.classList.add('v375-order-badge'); }
    });
  }
  const css=document.createElement('style'); css.id='v375-approval-style'; css.textContent=`
    .v375-preorder-badge{background:#5a3909!important;color:#ffd994!important;border:1px solid #d7b06c!important}
    .v375-order-badge{background:#123d26!important;color:#9de0b8!important;border:1px solid rgba(157,224,184,.75)!important}
    .v399-app-order-badge{background:#1e3558!important;color:#b9d8ff!important;border:1px solid rgba(185,216,255,.75)!important}
    .v375-pop-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.v375-pop-head h2{margin:0 0 6px;font-size:23px;color:#f2d09a}.v375-sub{font-size:13px;opacity:.82;line-height:1.45}.v375-x{border:0;background:rgba(255,255,255,.06);color:#fff;font-size:30px;cursor:pointer;border-radius:16px;width:54px;height:54px}.v375-rows{display:grid;gap:10px;margin-top:16px}.v375-pop-row{padding:13px;border-radius:16px;background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.14);display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;cursor:pointer}.v375-info b{font-size:18px}.v375-info div{font-size:13px;opacity:.84;margin-top:5px}.v375-info span{display:inline-block;font-size:12px;color:#f2d09a;margin-top:5px}.v375-row-actions{display:flex;gap:8px;align-items:center}.v375-row-actions button{padding:10px 13px;border-radius:12px;font-weight:900;cursor:pointer}.v375-open{border:1px solid rgba(255,255,255,.18);background:#20232b;color:#fff}.v375-approve{border:1px solid #d7b06c;background:linear-gradient(135deg,#f2d09a,#b98745);color:#111}.v375-foot{margin-top:14px;font-size:12px;opacity:.76;line-height:1.45}
    @media(max-width:680px){.v375-pop-row{grid-template-columns:1fr}.v375-row-actions{width:100%;display:grid;grid-template-columns:1fr 1fr}.v375-pop-head h2{font-size:20px}.v375-x{width:50px;height:50px}}
  `; document.head.appendChild(css);
  function boot(){patchProcessLabels(); patchOpenModal(); patchSave(); enhanceModalApprove(); relabelDom(); relabelDomFromDb();}
  document.addEventListener('DOMContentLoaded',()=>{boot(); setTimeout(()=>showPopup(false),1900);});
  window.addEventListener('load',()=>{boot(); setTimeout(()=>{document.getElementById('v372ApprovalPopup')?.remove(); showPopup(false);},2400);});
  document.addEventListener('click',()=>setTimeout(boot,220),true);
  setInterval(boot,1100);
  console.log(VERSION,'loaded');
})();
