(function(){
  'use strict';
  const VERSION='V383_SAFE_APPROVAL_NOTIFY_USER';
  function supa(){return window.vpSupabase || window.supabase || null;}
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function money(v){const n=Number(v||0);return 'R '+n.toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2});}
  function toast(msg){
    let t=document.getElementById('v383Toast'); if(t) t.remove();
    t=document.createElement('div'); t.id='v383Toast'; t.innerHTML=msg;
    t.style.cssText='position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 64px);transform:translateX(-50%);z-index:1000004;background:#111;color:#f2d09a;border:1px solid #d7b06c;border-radius:16px;padding:12px 16px;box-shadow:0 18px 55px rgba(0,0,0,.52);font-weight:900;max-width:92vw;text-align:center;font-family:Arial,Helvetica,sans-serif';
    document.body.appendChild(t); setTimeout(()=>t.remove(),4200);
  }
  async function getRowsByIds(ids){
    ids=(ids||[]).filter(Boolean); if(!ids.length) return [];
    const db=supa(); if(!db) return [];
    try{
      const {data,error}=await db.from('suppliers').select('id,supplier,order_no,project,total,amount,status,created_by').in('id',ids);
      if(error){console.warn(VERSION,error); return [];}
      return data||[];
    }catch(e){console.warn(VERSION,e); return [];}
  }
  function getLocalSubscription(){
    try{return JSON.parse(localStorage.getItem('v381_push_subscription')||'null');}catch(_e){return null;}
  }
  async function sendApprovedPush(row){
    const sub=getLocalSubscription();
    if(!sub || !sub.endpoint){
      toast('אושר ✅ כדי לקבל התראה אחרי אישור לחץ Enable Notifications.');
      return false;
    }
    const orderNo=row.order_no || row.id || 'Order';
    const res=await fetch('/.netlify/functions/push-approved-user',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        subscription:sub,
        order_no:orderNo,
        supplier:row.supplier || '',
        project:row.project || '',
        total:money(row.total || row.amount || 0),
        url:'/?approved=1&order=' + encodeURIComponent(orderNo)
      })
    });
    if(!res.ok) throw new Error(await res.text());
    return true;
  }
  async function notifyApprovedRows(rows){
    rows=(rows||[]).filter(r=>r && (r.order_no || r.id));
    if(!rows.length) return;
    for(const row of rows){
      try{ await sendApprovedPush(row); }
      catch(e){ console.warn(VERSION,'approved push failed',e); toast('אושר, אבל ההתראה נכשלה: '+esc(e.message||e)); }
    }
    if(rows.length===1) toast('אושר ✅ נשלחה התראה ל־User: '+esc(rows[0].order_no||'Order'));
    else toast('אושרו '+rows.length+' הזמנות ✅ נשלחו התראות.');
  }
  function patchApproveIds(){
    if(!window.v375ApproveOrderIds || window.v375ApproveOrderIds.__v383safeNotify) return;
    const old=window.v375ApproveOrderIds;
    window.v375ApproveOrderIds=async function(ids){
      ids=(ids||[]).filter(Boolean);
      const before=await getRowsByIds(ids);
      const res=await old.apply(this,arguments);
      setTimeout(()=>notifyApprovedRows(before),1000);
      return res;
    };
    window.v375ApproveOrderIds.__v383safeNotify=true;
  }
  function patchApproveCurrent(){
    if(!window.v375ApproveCurrentOrder || window.v375ApproveCurrentOrder.__v383safeNotify) return;
    const old=window.v375ApproveCurrentOrder;
    window.v375ApproveCurrentOrder=async function(){
      const modal=document.getElementById('entryModal');
      const id=modal?.dataset?.v375EntryId || modal?.getAttribute('data-v375-entry-id') || '';
      const before=id ? await getRowsByIds([id]) : [];
      const res=await old.apply(this,arguments);
      if(before.length) setTimeout(()=>notifyApprovedRows(before),1000);
      return res;
    };
    window.v375ApproveCurrentOrder.__v383safeNotify=true;
  }
  function init(){ patchApproveIds(); patchApproveCurrent(); }
  window.v383NotifyApprovedRows=notifyApprovedRows;
  window.addEventListener('load',()=>setTimeout(init,900));
  document.addEventListener('DOMContentLoaded',()=>setTimeout(init,700));
  setInterval(init,4000);
  console.log(VERSION,'loaded - status workflow untouched');
})();
