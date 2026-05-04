(function(){
  'use strict';
  const VERSION='V386_TRUE_PUSH_BLOBS';
  const COOLDOWN_MS=30*60*1000;
  const PENDING='Pending Approval';
  const APPROVED='Approved';
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function supa(){return window.vpSupabase || window.supabase || null;}
  function kind(row){try{return window.displayEntryKind ? window.displayEntryKind(row) : '';}catch(e){return '';}}
  function hasInvoice(row){return !!String(row && row.invoice_no || '').trim();}
  function isOrder(row){return !!String(row && row.order_no || '').trim() && !hasInvoice(row) && kind(row)!=='delivery_note' && kind(row)!=='credit_note' && kind(row)!=='deposit';}
  function status(row){return String((row && row.status) || '').toLowerCase();}
  function isApproved(row){const s=status(row); return s.includes('approved') || s.includes('sent') || s.includes('מאושר');}
  function isPending(row){return isOrder(row) && !isApproved(row);}
  async function pendingRows(){
    const db=supa(); if(!db) return [];
    const {data,error}=await db.from('suppliers').select('id,supplier,order_no,project,total,amount,status,invoice_no,entry_type,description,notes,created_at').not('order_no','is',null).order('created_at',{ascending:false}).limit(100);
    if(error){console.warn(VERSION,error); return [];} return (data||[]).filter(isPending);
  }
  function money(v){const n=Number(v||0);return 'R '+n.toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2});}
  function isStandalone(){return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true;}
  function isIOS(){return /iphone|ipad|ipod/i.test(navigator.userAgent||'');}
  function toast(msg){
    let t=document.getElementById('v379Toast'); if(t) t.remove();
    t=document.createElement('div'); t.id='v379Toast'; t.innerHTML=msg;
    t.style.cssText='position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:1000002;background:#111;color:#f2d09a;border:1px solid #d7b06c;border-radius:16px;padding:12px 16px;box-shadow:0 18px 55px rgba(0,0,0,.52);font-weight:900;max-width:92vw;text-align:center;font-family:Arial,Helvetica,sans-serif';
    document.body.appendChild(t); setTimeout(()=>t.remove(),5200);
  }
  function urlBase64ToUint8Array(base64String){
    const padding='='.repeat((4-base64String.length%4)%4);
    const base64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/');
    const raw=window.atob(base64); const output=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;++i) output[i]=raw.charCodeAt(i); return output;
  }
  async function registerSW(){
    if(!('serviceWorker' in navigator)) throw new Error('Service Worker not supported');
    return await navigator.serviceWorker.register('/sw.js');
  }
  async function getPublicKey(){
    const r=await fetch('/.netlify/functions/push-public-key',{cache:'no-store'});
    if(!r.ok) throw new Error('Missing VAPID_PUBLIC_KEY in Netlify');
    const j=await r.json(); if(!j.publicKey) throw new Error('No VAPID public key'); return j.publicKey;
  }
  async function subscribePush(){
    if(!('Notification' in window)) throw new Error('Notifications not supported');
    if(!('PushManager' in window)) throw new Error('Push not supported here');
    if(isIOS() && !isStandalone()){
      toast('באייפון צריך קודם: Share → Add to Home Screen, ואז לפתוח מהאייקון כדי לקבל התראות כשהמערכת סגורה.');
      return false;
    }
    const perm=await Notification.requestPermission();
    if(perm!=='granted'){toast('לא אושרו התראות בדפדפן.'); return false;}
    const reg=await registerSW();
    const publicKey=await getPublicKey();
    let sub=await reg.pushManager.getSubscription();
    if(!sub){sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(publicKey)});}
    const res=await fetch('/.netlify/functions/push-save-subscription',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subscription:sub,device:navigator.userAgent||'',createdAt:new Date().toISOString()})});
    if(!res.ok) throw new Error(await res.text());
    localStorage.setItem('v379_push_enabled','1');
    try{ localStorage.setItem('v381_push_subscription', JSON.stringify(sub)); }catch(_e){}
    toast('התראות הופעלו בהצלחה ✅ Push אמיתי פעיל.');
    updateBadge();
    return true;
  }
  async function triggerPush(force){
    const rows=await pendingRows(); updateButton(rows.length);
    if(!rows.length) return;
    // V386 TRUE PUSH: subscriptions are saved centrally on Netlify Blobs.
    // Any computer/phone that creates a Pre-Order can trigger push to all registered devices.
    if(!force){
      const last=Number(localStorage.getItem('v379_last_push')||0);
      if(Date.now()-last<COOLDOWN_MS) return;
    }
    localStorage.setItem('v379_last_push',String(Date.now()));
    try{
      const res = await fetch('/.netlify/functions/push-notify-approvals',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({count:rows.length,orders:rows.slice(0,5).map(r=>({id:r.id,order_no:r.order_no,supplier:r.supplier,project:r.project,total:r.total||r.amount||0})),url:'/?approvals=1'})});
      if(!res.ok) console.warn(VERSION,'notify failed',await res.text());
    }catch(e){console.warn(VERSION,'notify failed',e);}
  }
  function openApprovals(){
    if(typeof window.showPendingApprovalOrdersV375==='function') return window.showPendingApprovalOrdersV375(true);
    if(typeof window.showPendingApprovalOrdersV372==='function') return window.showPendingApprovalOrdersV372(true);
    toast('לא נמצאה רשימת Approvals.');
  }
  function updateButton(count){
    const b=document.getElementById('v379PushButton'); if(!b) return;
    const n=b.querySelector('.v379-count'); if(n) n.textContent=String(count??0);
    b.classList.toggle('has-pending',Number(count||0)>0);
  }
  async function updateBadge(){const rows=await pendingRows(); updateButton(rows.length); return rows;}
  function injectButton(){
    if(document.getElementById('v379PushButton')) return;
    const wrap=document.createElement('div'); wrap.id='v379PushButton';
    wrap.innerHTML='<button type="button" class="v379-main"><span class="v379-bell">🔔</span><span class="v379-title">Approvals</span><span class="v379-count">0</span></button><button type="button" class="v379-enable">Enable</button>';
    document.body.appendChild(wrap);
    wrap.querySelector('.v379-main').onclick=openApprovals;
    wrap.querySelector('.v379-enable').onclick=async()=>{try{await subscribePush();}catch(e){console.error(e);toast('Push error: '+esc(e && e.message ? e.message : e));}};
  }
  function injectStyle(){
    if(document.getElementById('v379PushStyle')) return;
    const css=document.createElement('style'); css.id='v379PushStyle'; css.textContent=`
#v379PushButton{position:fixed;top:calc(env(safe-area-inset-top,0px) + 10px);right:14px;z-index:1000001;display:flex;gap:8px;align-items:center;font-family:Arial,Helvetica,sans-serif}
#v379PushButton button{border:1px solid rgba(215,176,108,.55);background:rgba(17,18,22,.92);color:#fff;border-radius:999px;box-shadow:0 12px 35px rgba(0,0,0,.35);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);font-weight:900;cursor:pointer}
#v379PushButton .v379-main{height:44px;padding:0 12px;display:flex;align-items:center;gap:8px}.v379-count{min-width:22px;height:22px;border-radius:999px;background:#333;display:inline-flex;align-items:center;justify-content:center;color:#f2d09a}.has-pending .v379-count{background:#8a560e;color:#fff;box-shadow:0 0 0 3px rgba(242,208,154,.16)}
#v379PushButton .v379-enable{height:44px;padding:0 12px;color:#111;background:linear-gradient(135deg,#f6dbad,#c18a4a);display:none}#v379PushButton:not(.enabled) .v379-enable{display:inline-block}
@media(max-width:680px){#v379PushButton{left:50%;right:auto;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 8px)}#v379PushButton .v379-title{display:inline}#v379PushButton .v379-main{height:40px}#v379PushButton .v379-enable{height:40px}}
`;
    document.head.appendChild(css);
  }
  function markEnabled(){const el=document.getElementById('v379PushButton'); if(el && localStorage.getItem('v379_push_enabled')==='1') el.classList.add('enabled');}
  function patchSaveAndApprove(){
    if(window.saveEntry && !window.saveEntry.__v379push){
      const old=window.saveEntry;
      window.saveEntry=async function(){const res=await old.apply(this,arguments); setTimeout(()=>triggerPush(true),1300); return res;};
      window.saveEntry.__v379push=true;
    }
    if(window.v375ApproveOrderIds && !window.v375ApproveOrderIds.__v379push){
      const old=window.v375ApproveOrderIds;
      window.v375ApproveOrderIds=async function(){const res=await old.apply(this,arguments); setTimeout(()=>triggerPush(true),1200); return res;};
      window.v375ApproveOrderIds.__v379push=true;
    }
  }
  async function init(){
    injectStyle(); injectButton(); markEnabled(); patchSaveAndApprove(); updateBadge();
    if(location.search.includes('approvals=1')) setTimeout(openApprovals,1000);
    if(localStorage.getItem('v379_push_enabled')==='1') setTimeout(()=>triggerPush(false),2200);
    setInterval(()=>{patchSaveAndApprove(); updateBadge();},10000);
  }
  window.v379EnablePushNotifications=subscribePush;
  window.v379TriggerApprovalPush=triggerPush;
  window.addEventListener('load',()=>setTimeout(init,700));
  document.addEventListener('DOMContentLoaded',()=>setTimeout(init,500));
  console.log(VERSION,'loaded');
})();
