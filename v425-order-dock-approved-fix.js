(function(){
  'use strict';
  if(window.__V425_ORDER_DOCK_APPROVED_FIX__) return;
  window.__V425_ORDER_DOCK_APPROVED_FIX__ = true;

  const APPROVED = 'Approved';
  const ORDER_SENT = 'Order Sent';
  function q(s,r=document){ return r.querySelector(s); }
  function qa(s,r=document){ return Array.from(r.querySelectorAll(s)); }
  function esc(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function mode(){ return String(q('#entryMode')?.value || '').trim(); }
  function status(){ return String(q('#entryStatus')?.value || '').trim(); }
  function isOrderMode(){ return mode()==='order' || !!String(q('#entryOrderNo')?.value||'').trim(); }
  function isApprovedLike(){ const s=status().toLowerCase(); return s.includes('approved') || s.includes('sent') || s.includes('order'); }
  function editingId(){ const m=q('#entryModal'); return m?.dataset?.v375EntryId || m?.dataset?.v422EditingId || window.editingId || ''; }
  function toast(msg){
    let t=q('#v425Toast'); if(t) t.remove();
    t=document.createElement('div'); t.id='v425Toast'; t.textContent=msg;
    t.style.cssText='position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:2147483600;background:#111;color:#f4d39a;border:1px solid #d7b06c;border-radius:14px;padding:11px 15px;box-shadow:0 18px 50px rgba(0,0,0,.55);font:900 13px -apple-system,BlinkMacSystemFont,Segoe UI,Arial;text-align:center;max-width:92vw';
    document.body.appendChild(t); setTimeout(()=>t.remove(),2600);
  }
  function setStatusValue(v){
    const sel=q('#entryStatus'); if(!sel) return;
    if(!qa('option',sel).some(o=>o.value===v)){ const o=document.createElement('option'); o.value=v; o.textContent=v; sel.appendChild(o); }
    sel.value=v; sel.dispatchEvent(new Event('change',{bubbles:true})); sel.dispatchEvent(new Event('input',{bubbles:true}));
  }
  async function updateDbStatus(v){
    const id=editingId();
    if(!id || !window.supabase) return false;
    const {error}=await window.supabase.from('suppliers').update({status:v}).eq('id',id);
    if(error){ alert(error.message || 'Status update failed'); return false; }
    return true;
  }
  window.v425ConvertCurrentAppOrderToOrder = async function(){
    if(!isOrderMode()) return alert('Open an order first.');
    setStatusValue(ORDER_SENT);
    const saved = await updateDbStatus(ORDER_SENT);
    applyApprovedStamp();
    if(saved){ try{ if(typeof window.render==='function') await window.render(); }catch(_e){} toast('Changed to Order. Approved stamp is active.'); }
    else toast('Changed in the form. Press Save Entry to keep it.');
  };
  window.v425ApproveCurrentOrderManual = async function(){
    if(!isOrderMode()) return alert('Open an order first.');
    setStatusValue(APPROVED);
    const saved = await updateDbStatus(APPROVED);
    applyApprovedStamp();
    if(saved){ try{ if(typeof window.render==='function') await window.render(); }catch(_e){} toast('Approved manually. Status is App order.'); }
    else toast('Approved in the form. Press Save Entry to keep it.');
  };
  function applyApprovedStamp(){
    const modal=q('#entryModal'); if(!modal) return;
    const box=q('.modal-box', modal); if(!box) return;
    let stamp=q('.v425-approved-stamp', box);
    if(isOrderMode() && isApprovedLike()){
      if(!stamp){ stamp=document.createElement('div'); stamp.className='v425-approved-stamp'; stamp.textContent='APPROVED'; box.appendChild(stamp); }
    } else if(stamp) stamp.remove();
  }
  function ensureButtons(){
    const modal=q('#entryModal'); if(!modal || !modal.classList.contains('show')) return;
    const actions=q('.modal-actions',modal) || q('.modal-footer',modal) || q('.window-actions',modal);
    if(actions && isOrderMode()){
      // V448: do not add the duplicate left approval button. The existing central "Approve Order" button remains the only approval action.
      qa('.v425-approve-btn', actions).forEach(el=>el.remove());
      if(!q('.v425-convert-btn',actions)){
        const b=document.createElement('button'); b.type='button'; b.className='soft gold v425-convert-btn'; b.textContent='Change to Order'; b.onclick=window.v425ConvertCurrentAppOrderToOrder;
        const approveOrderBtn = qa('button', actions).find(x=>String(x.textContent||'').trim().toLowerCase()==='approve order');
        actions.insertBefore(b, approveOrderBtn || actions.firstChild);
      }
    }
    applyApprovedStamp();
  }
  function labelTextForDockItem(btn){
    let t=btn.getAttribute('title') || '';
    t=t.replace(/^(New|Draft)\s+/i,'').replace(/\s+/g,' ').trim();
    if(!t) t='Window';
    return t.length>16 ? t.slice(0,15)+'…' : t;
  }
  function enhanceDockLabels(){
    qa('#v420MacDock .v420-window').forEach(btn=>{
      if(!q('.v425-dock-label',btn)){
        const span=document.createElement('span'); span.className='v425-dock-label'; span.textContent=labelTextForDockItem(btn); btn.appendChild(span);
      } else q('.v425-dock-label',btn).textContent=labelTextForDockItem(btn);
    });
  }
  function injectCss(){
    if(q('#v425Style')) return;
    const st=document.createElement('style'); st.id='v425Style'; st.textContent=`
      #v420MacDock{bottom:calc(0px + env(safe-area-inset-bottom,0px))!important;transform:translate(-50%,calc(100% - 16px))!important;transition:transform .24s cubic-bezier(.2,.8,.2,1), opacity .2s ease!important;opacity:.92!important;overflow-x:auto!important;overflow-y:visible!important;}
      #v420MacDock:hover,#v420MacDock:focus-within,#v420MacDock.v425-open{transform:translate(-50%,0)!important;opacity:1!important;}
      #v420MacDock:before{content:"";position:absolute;top:3px;left:50%;transform:translateX(-50%);width:56px;height:5px;border-radius:999px;background:rgba(246,219,173,.55);box-shadow:0 0 14px rgba(246,219,173,.32);pointer-events:none;}
      #v420MacDock .v420-dock-item{overflow:visible!important;}
      #v420MacDock .v420-window{padding-bottom:12px!important;}
      .v425-dock-label{position:absolute!important;left:50%!important;bottom:2px!important;transform:translateX(-50%)!important;max-width:68px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font:800 8px -apple-system,BlinkMacSystemFont,Segoe UI,Arial!important;color:#f7d8a6!important;text-shadow:0 1px 5px #000!important;pointer-events:none!important;letter-spacing:.1px!important;}
      .v425-approved-stamp{position:absolute;right:22px;top:96px;z-index:5;transform:rotate(-12deg);border:3px solid rgba(24,145,80,.82);color:rgba(38,178,98,.92);border-radius:10px;padding:8px 13px;font:1000 24px/1 Arial,Helvetica,sans-serif;letter-spacing:2px;text-transform:uppercase;pointer-events:none;mix-blend-mode:screen;box-shadow:0 0 0 1px rgba(255,255,255,.1) inset;}
      .v425-approve-btn,.v425-convert-btn{background:linear-gradient(135deg,#f2d09a,#b98745)!important;color:#101010!important;border:1px solid rgba(255,229,190,.75)!important;font-weight:900!important;}
      @media(max-width:680px){#v420MacDock{transform:translate(-50%,calc(100% - 18px))!important;}#v420MacDock:hover,#v420MacDock:focus-within,#v420MacDock.v425-open{transform:translate(-50%,0)!important}.v425-dock-label{font-size:7px!important;max-width:56px!important}.v425-approved-stamp{right:16px;top:84px;font-size:18px;padding:7px 10px}}
      @media print{.v425-approved-stamp{display:block!important;position:fixed!important;right:28mm!important;top:34mm!important;color:#198f50!important;border-color:#198f50!important;mix-blend-mode:normal!important}.v425-approve-btn,.v425-convert-btn{display:none!important}}
    `; document.head.appendChild(st);
  }
  function boot(){ injectCss(); ensureButtons(); enhanceDockLabels(); }
  document.addEventListener('DOMContentLoaded',boot);
  window.addEventListener('load',boot);
  document.addEventListener('click',()=>setTimeout(boot,120),true);
  document.addEventListener('input',()=>setTimeout(boot,120),true);
  document.addEventListener('change',()=>setTimeout(boot,120),true);
  setInterval(boot,800);
})();
