(function(){
  'use strict';
  const VERSION='V401_MAC_DOCK';
  function byText(sel, words){
    const w = Array.isArray(words) ? words : [words];
    const nodes = Array.from(document.querySelectorAll(sel || 'button,a,[role="button"]'));
    return nodes.find(el => {
      const t = (el.textContent || '').trim().toLowerCase();
      return w.every(x => t.includes(String(x).toLowerCase()));
    });
  }
  function clickText(words){ const el = byText('button,a,[role="button"]', words); if(el){ el.click(); return true; } return false; }
  function openHome(){
    if(clickText(['back','dashboard'])) return;
    if(typeof window.showDashboard === 'function') return window.showDashboard();
    try{ window.scrollTo({top:0,behavior:'smooth'}); }catch(_e){ window.scrollTo(0,0); }
  }
  function openOrders(){ if(clickText(['order'])) return; if(typeof window.openEntryModal==='function') return window.openEntryModal('order'); }
  function openDN(){ if(clickText(['delivery','note'])) return; if(typeof window.openEntryModal==='function') return window.openEntryModal('delivery_note'); }
  function openInvoice(){ if(clickText(['invoice'])) return; if(typeof window.openEntryModal==='function') return window.openEntryModal('invoice'); }
  function openCredit(){ if(typeof window.openCreditNoteModal==='function') return window.openCreditNoteModal(); clickText(['credit','note']); }
  function openApprovals(){
    if(typeof window.showPendingApprovalOrdersV375 === 'function') return window.showPendingApprovalOrdersV375(true);
    if(typeof window.showPendingApprovalOrdersV372 === 'function') return window.showPendingApprovalOrdersV372(true);
    clickText(['approvals']);
  }
  function openLive(){
    if(typeof window.v401ToggleLiveNotifications === 'function') return window.v401ToggleLiveNotifications();
    const b=document.getElementById('v395NotifButton'); if(b) b.click();
  }
  function sync(){
    if(typeof window.syncFromCloud === 'function') return window.syncFromCloud();
    if(typeof window.v391RealSyncFromCloud === 'function') return window.v391RealSyncFromCloud();
    if(typeof window.manualRefresh === 'function') return window.manualRefresh();
    location.reload();
  }
  function search(){
    const input = document.querySelector('input[placeholder*="Search"],input[id*="search" i],input[type="search"]');
    if(input){ input.scrollIntoView({block:'center',behavior:'smooth'}); input.focus(); }
  }
  function reports(){ if(clickText(['supplier','report'])) return; if(clickText(['project','report'])) return; }
  function settings(){ if(clickText(['manage','lists'])) return; if(clickText(['settings'])) return; }
  function approvalCount(){
    const el = Array.from(document.querySelectorAll('*')).find(x => (x.textContent||'').includes('Approvals'));
    const m = el && (el.textContent||'').match(/Approvals\s*(\d+)/i);
    return m ? m[1] : '';
  }
  function unreadLive(){
    try{ return (JSON.parse(localStorage.getItem('v395_notification_feed')||'[]').filter(x=>!x.read).length)||''; }catch(_e){ return ''; }
  }
  function inject(){
    if(document.getElementById('v401MacDock')) return;
    const style=document.createElement('style');
    style.id='v401MacDockStyle';
    style.textContent=`
body{padding-bottom:calc(86px + env(safe-area-inset-bottom,0px))!important}
#v401MacDock{position:fixed;left:50%;bottom:calc(10px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:1000020;display:flex;align-items:end;gap:10px;padding:10px 14px;border-radius:26px;background:rgba(12,13,16,.72);border:1px solid rgba(246,219,173,.24);box-shadow:0 18px 55px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.08);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);max-width:calc(100vw - 24px);overflow-x:auto;direction:ltr}
.v401-dock-item{position:relative;min-width:48px;height:48px;border:0;border-radius:17px;background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.04));color:#fff;font-size:23px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);transition:transform .16s ease,filter .16s ease,background .16s ease}.v401-dock-item:active,.v401-dock-item:hover{transform:translateY(-6px) scale(1.12);filter:brightness(1.25)}
.v401-dock-item.gold{background:linear-gradient(135deg,#f6dbad,#c18a4a);color:#111}.v401-dock-badge{position:absolute;right:-4px;top:-6px;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#9b661b;color:#fff;font:900 11px -apple-system,BlinkMacSystemFont,Segoe UI,Arial;display:none;align-items:center;justify-content:center;box-shadow:0 0 0 3px rgba(0,0,0,.36)}
@media(max-width:680px){#v401MacDock{gap:7px;padding:8px 10px;border-radius:22px}.v401-dock-item{min-width:43px;height:43px;font-size:21px;border-radius:15px}}
@media(min-width:900px){.v401-dock-item:hover::after{content:attr(title);position:absolute;bottom:58px;left:50%;transform:translateX(-50%);white-space:nowrap;background:rgba(15,16,20,.95);border:1px solid rgba(246,219,173,.25);color:#f8dcae;border-radius:10px;padding:5px 8px;font:800 11px -apple-system,BlinkMacSystemFont,Segoe UI,Arial}}
/* hide old floating controls moved into dock */
#v395NotifButton{display:none!important}
#v266CreditNoteMainBtn,#v264CreditNoteMainBtn,.floating-credit,.top-credit-btn{display:none!important}
`;
    document.head.appendChild(style);
    const dock=document.createElement('div'); dock.id='v401MacDock';
    const items=[
      ['home','🏠','Home',openHome,''],['orders','📦','Order',openOrders,'gold'],['dn','🚚','Delivery Note',openDN,'gold'],['invoice','🧾','Invoice',openInvoice,'gold'],['credit','💳','Credit Note',openCredit,''],['approvals','🔔','Approvals',openApprovals,''],['live','🟢','Live Notifications',openLive,''],['sync','🔄','Sync',sync,''],['search','🔍','Search',search,''],['reports','📊','Reports',reports,''],['settings','⚙️','Manage Lists',settings,'']
    ];
    items.forEach(([id,icon,title,fn,cls])=>{ const b=document.createElement('button'); b.type='button'; b.className='v401-dock-item '+cls; b.id='v401Dock_'+id; b.title=title; b.innerHTML=icon+'<span class="v401-dock-badge"></span>'; b.onclick=fn; dock.appendChild(b); });
    document.body.appendChild(dock); updateBadges(); setInterval(updateBadges,2500);
  }
  function setBadge(id,val){ const el=document.querySelector('#v401Dock_'+id+' .v401-dock-badge'); if(!el) return; if(val && String(val)!=='0'){ el.textContent=String(val); el.style.display='inline-flex'; } else el.style.display='none'; }
  function updateBadges(){ setBadge('live', unreadLive()); setBadge('approvals', approvalCount()); }
  window.v401UpdateDockBadges=updateBadges;
  window.addEventListener('load',()=>setTimeout(inject,1400));
  document.addEventListener('DOMContentLoaded',()=>setTimeout(inject,1100));
  setTimeout(inject,3000);
  console.log(VERSION,'loaded');
})();
