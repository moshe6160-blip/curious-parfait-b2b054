
(function(){
  'use strict';
  if(window.__V418_MAC_WINDOW_MANAGER__) return;
  window.__V418_MAC_WINDOW_MANAGER__ = true;

  const DOCK_ID = 'v418MacDock';
  const minimized = new Map();
  let zTop = 1000000;

  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>Array.from(r.querySelectorAll(s));

  function injectStyle(){
    if(document.getElementById('v418MacStyle')) return;
    const style=document.createElement('style');
    style.id='v418MacStyle';
    style.textContent = `
body{padding-bottom:calc(96px + env(safe-area-inset-bottom,0px))!important;}
#windowDock,#v401MacDock,#v415Dock,#v416DockToggle,#v415DockToggle,#dockFloatingButton,.workspace-floating-dock,.floating-dock,.live-floating,.floating-live,#liveFloatingButton,#v395NotifButton{display:none!important;}
#${DOCK_ID}{position:fixed!important;left:50%!important;bottom:calc(14px + env(safe-area-inset-bottom,0px))!important;transform:translateX(-50%)!important;z-index:2147483000!important;min-height:62px!important;max-width:calc(100vw - 24px)!important;display:flex!important;align-items:flex-end!important;justify-content:center!important;gap:10px!important;padding:10px 14px!important;border-radius:30px!important;background:rgba(13,14,18,.72)!important;border:1px solid rgba(246,219,173,.32)!important;box-shadow:0 26px 76px rgba(0,0,0,.58), inset 0 1px 0 rgba(255,255,255,.12)!important;backdrop-filter:blur(30px)!important;-webkit-backdrop-filter:blur(30px)!important;overflow-x:auto!important;overflow-y:visible!important;opacity:1!important;visibility:visible!important;direction:ltr!important;}
.v418-dock-item{position:relative!important;min-width:50px!important;width:50px!important;height:50px!important;border-radius:18px!important;border:1px solid rgba(255,255,255,.10)!important;background:linear-gradient(180deg,rgba(255,255,255,.15),rgba(255,255,255,.045))!important;color:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;font-size:23px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 8px 24px rgba(0,0,0,.30)!important;transition:transform .15s cubic-bezier(.2,.8,.2,1), filter .15s ease, background .15s ease!important;will-change:transform!important;padding:0!important;}
.v418-dock-item:hover,.v418-dock-item:active{transform:translateY(-10px) scale(1.17)!important;filter:brightness(1.18)!important;background:linear-gradient(180deg,rgba(246,219,173,.25),rgba(255,255,255,.055))!important;}
.v418-dock-item.v418-primary{background:linear-gradient(135deg,#f8dfb5,#c28b4b)!important;color:#111!important;}
.v418-dock-item.v418-window::after{content:"";position:absolute;bottom:-6px;left:50%;width:5px;height:5px;transform:translateX(-50%);border-radius:50%;background:#f5d9a6;}
.v418-badge{position:absolute!important;right:-6px!important;top:-7px!important;min-width:21px!important;height:21px!important;padding:0 6px!important;border-radius:999px!important;background:#9b661b!important;color:#fff!important;font:900 11px -apple-system,BlinkMacSystemFont,Segoe UI,Arial!important;display:none;align-items:center!important;justify-content:center!important;box-shadow:0 0 0 3px rgba(0,0,0,.42)!important;}
@media(min-width:900px){.v418-dock-item:hover::before{content:attr(title);position:absolute;bottom:62px;left:50%;transform:translateX(-50%);white-space:nowrap;background:rgba(15,16,20,.96);border:1px solid rgba(246,219,173,.25);color:#f8dcae;border-radius:10px;padding:5px 8px;font:800 11px -apple-system,BlinkMacSystemFont,Segoe UI,Arial;pointer-events:none;}}
.window-bar{display:flex!important;align-items:center!important;gap:8px!important;cursor:grab!important;user-select:none!important;touch-action:none!important;}
.window-bar:active{cursor:grabbing!important;}
.window-btn{width:13px!important;height:13px!important;min-width:13px!important;min-height:13px!important;border-radius:50%!important;padding:0!important;margin:0!important;border:0!important;font-size:0!important;line-height:0!important;color:transparent!important;box-shadow:0 1px 3px rgba(0,0,0,.36), inset 0 1px 1px rgba(255,255,255,.45)!important;}
.window-btn.red{background:#ff5f57!important}.window-btn.yellow{background:#ffbd2e!important}.window-btn.green{background:#28c840!important}
.modal.show .modal-box,.modal-box.v418-pop,.panel.v418-pop,.card.v418-pop{animation:v418Open .18s cubic-bezier(.2,.8,.2,1) both!important;will-change:transform,opacity,filter!important;}
@keyframes v418Open{0%{opacity:0;transform:translateY(16px) scale(.972);filter:blur(8px)}100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}}
.v418-minimizing{animation:v418GenieOut .18s cubic-bezier(.22,.75,.18,1) forwards!important;transform-origin:bottom center!important;}
@keyframes v418GenieOut{0%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}100%{opacity:0;transform:translateY(70px) scale(.72);filter:blur(8px)}}
.v418-floating{position:fixed!important;margin:0!important;z-index:2147481000!important;}
.modal-box.maximized,.panel.maximized,.card.maximized{position:fixed!important;inset:10px!important;width:calc(100vw - 20px)!important;max-width:none!important;max-height:calc(100vh - 96px)!important;height:calc(100vh - 96px)!important;z-index:2147481500!important;}
#v266CreditNoteMainBtn,#v264CreditNoteMainBtn,.floating-credit,.top-credit-btn{display:none!important;}
@media(max-width:680px){#${DOCK_ID}{gap:7px!important;padding:8px 10px!important;border-radius:24px!important;min-height:55px!important;}.v418-dock-item{min-width:43px!important;width:43px!important;height:43px!important;border-radius:15px!important;font-size:21px!important;}}
`;
    document.head.appendChild(style);
  }

  function ensureDock(){
    injectStyle();
    let dock=document.getElementById(DOCK_ID);
    if(!dock){
      dock=document.createElement('div');
      dock.id=DOCK_ID;
      dock.setAttribute('aria-label','Mac Dock');
      document.body.appendChild(dock);
    }
    dock.style.display='flex';
    return dock;
  }

  function byText(words){
    const arr=Array.isArray(words)?words:[words];
    return qa('button,a,[role="button"],.btn').find(el=>{
      const t=(el.textContent||'').toLowerCase();
      return arr.every(w=>t.includes(String(w).toLowerCase()));
    });
  }
  function clickText(words){ const el=byText(words); if(el){el.click(); updateBadgesSoon(); return true;} return false; }

  function openHome(){ if(clickText(['back','dashboard'])) return; if(typeof window.showDashboard==='function') return window.showDashboard(); try{window.scrollTo({top:0,behavior:'smooth'});}catch(e){window.scrollTo(0,0);} }
  function openOrder(){ if(typeof window.openEntryModal==='function') return window.openEntryModal('order'); clickText(['order']); }
  function openDN(){ if(typeof window.openEntryModal==='function') return window.openEntryModal('delivery_note'); clickText(['delivery','note']); }
  function openInvoice(){ if(typeof window.openEntryModal==='function') return window.openEntryModal('invoice'); clickText(['invoice']); }
  function openCredit(){ if(typeof window.openCreditNoteModal==='function') return window.openCreditNoteModal(); clickText(['credit','note']); }
  function openApprovals(){ if(typeof window.showPendingApprovalOrdersV375==='function') return window.showPendingApprovalOrdersV375(true); if(typeof window.showPendingApprovalOrdersV372==='function') return window.showPendingApprovalOrdersV372(true); clickText(['approvals']); }
  function openLive(){ if(typeof window.v401ToggleLiveNotifications==='function') return window.v401ToggleLiveNotifications(); const b=document.getElementById('v395NotifButton'); if(b) b.click(); }
  function syncNow(){ if(typeof window.syncFromCloud==='function') return window.syncFromCloud(); if(typeof window.v391RealSyncFromCloud==='function') return window.v391RealSyncFromCloud(); if(typeof window.manualRefresh==='function') return window.manualRefresh(); }
  function focusSearch(){ const input=q('input[placeholder*="Search"],input[id*="search" i],input[type="search"]'); if(input){ try{input.scrollIntoView({block:'center',behavior:'smooth'});}catch(e){} input.focus(); } }
  function reports(){ if(clickText(['monthly','report'])) return; if(clickText(['project','report'])) return; clickText(['supplier','report']); }
  function settings(){ if(clickText(['manage','lists'])) return; clickText(['settings']); }

  function approvalCount(){ try{ const el=qa('*').find(x=>{const t=(x.textContent||'').trim(); return /^.*Approvals\s*\d+.*$/i.test(t)&&t.length<80;}); const m=el&&(el.textContent||'').match(/Approvals\s*(\d+)/i); return m?m[1]:'';}catch(e){return '';} }
  function unreadLive(){ try{return JSON.parse(localStorage.getItem('v395_notification_feed')||'[]').filter(x=>!x.read).length||'';}catch(e){return '';} }

  function setBadge(id,val){ const badge=q('#dock_'+id+' .v418-badge'); if(!badge)return; if(val&&String(val)!=='0'){badge.textContent=String(val);badge.style.display='inline-flex';}else{badge.style.display='none';} }
  let badgeTimer=null;
  function updateBadgesSoon(){ clearTimeout(badgeTimer); badgeTimer=setTimeout(()=>{setBadge('approvals',approvalCount());setBadge('live',unreadLive());},120); }
  window.v401UpdateDockBadges=updateBadgesSoon; window.v418UpdateDockBadges=updateBadgesSoon;

  function buildDock(){
    const dock=ensureDock();
    if(q('#dock_home',dock)){ updateBadgesSoon(); return; }
    dock.innerHTML='';
    const items=[
      ['home','🏠','Home',openHome,''],
      ['order','📦','Order',openOrder,'v418-primary'],
      ['dn','🚚','Delivery Note',openDN,'v418-primary'],
      ['invoice','🧾','Invoice',openInvoice,'v418-primary'],
      ['credit','💳','Credit Note',openCredit,''],
      ['approvals','🔔','Approvals',openApprovals,''],
      ['live','🟢','Live Notifications',openLive,''],
      ['sync','🔄','Sync',syncNow,''],
      ['search','🔍','Search',focusSearch,''],
      ['reports','📊','Reports',reports,''],
      ['settings','⚙️','Manage Lists',settings,'']
    ];
    for(const [id,icon,title,fn,cls] of items){
      const b=document.createElement('button');
      b.type='button'; b.className='v418-dock-item '+cls; b.id='dock_'+id; b.title=title;
      b.innerHTML=icon+'<span class="v418-badge"></span>';
      b.addEventListener('click',fn);
      dock.appendChild(b);
    }
    updateBadgesSoon();
  }

  function iconFor(title){ const t=String(title||'').toLowerCase(); if(t.includes('invoice'))return'🧾'; if(t.includes('delivery')||t.includes('dn'))return'🚚'; if(t.includes('credit'))return'💳'; if(t.includes('approval'))return'🔔'; if(t.includes('report'))return'📊'; if(t.includes('supplier'))return'🏗️'; if(t.includes('order'))return'📦'; if(t.includes('search'))return'🔍'; return'🪟'; }
  function titleFor(host){ return (q('.section-title,.title,h1,h2,h3,.modal-head h3',host)?.textContent || host.dataset.title || 'Window').trim(); }
  function getWindowId(host){ if(!host.dataset.v418WindowId) host.dataset.v418WindowId='w_'+Math.random().toString(36).slice(2,9); return host.dataset.v418WindowId; }

  function addWindowItem(host,modal){
    const dock=ensureDock(); const id=getWindowId(host);
    let item=q('[data-v418-window-id="'+id+'"]',dock); if(item) return item;
    const title=titleFor(host);
    item=document.createElement('button'); item.type='button'; item.className='v418-dock-item v418-window'; item.dataset.v418WindowId=id; item.title=title;
    item.innerHTML=iconFor(title)+'<span class="v418-badge"></span>';
    item.addEventListener('click',()=>restoreWindow(host,modal,item));
    dock.appendChild(item); minimized.set(id,{host,modal,item}); return item;
  }

  function clearModalOverlay(modal){ if(!modal)return; modal.classList.remove('show'); modal.style.pointerEvents='none'; modal.style.background='transparent'; }
  function restoreModalOverlay(modal){ if(!modal)return; modal.classList.add('show'); modal.style.pointerEvents=''; modal.style.background=''; }

  function minimizeWindow(host,modal){
    const item=addWindowItem(host,modal);
    host.classList.add('v418-minimizing');
    setTimeout(()=>{ host.classList.remove('v418-minimizing'); host.style.display='none'; clearModalOverlay(modal); item.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'}); },185);
  }
  function restoreWindow(host,modal,item){ restoreModalOverlay(modal); host.style.display=''; host.classList.add('v418-pop'); host.style.zIndex=++zTop; setTimeout(()=>host.classList.remove('v418-pop'),240); const id=host.dataset.v418WindowId; if(item)item.remove(); if(id) minimized.delete(id); }
  function closeWindow(host,modal){ const id=host.dataset.v418WindowId; if(id){ const item=q('[data-v418-window-id="'+id+'"]'); if(item)item.remove(); minimized.delete(id); } if(modal){ modal.classList.remove('show'); modal.style.pointerEvents=''; modal.style.background=''; } else { host.style.display='none'; } }
  function maximizeWindow(host){ host.classList.toggle('maximized'); host.classList.remove('compact'); host.style.zIndex=++zTop; }

  window.windowAction=function(ev,action){
    if(ev){ ev.preventDefault(); ev.stopPropagation(); }
    const target=ev&&ev.target; const host=target?.closest?.('.modal-box,.card,.panel,.login-card'); if(!host)return;
    const modal=target?.closest?.('.modal');
    if(action==='close') return closeWindow(host,modal);
    if(action==='compact') return minimizeWindow(host,modal);
    if(action==='maximize') return maximizeWindow(host);
  };

  function makeDraggable(){
    qa('.modal-box,.panel,.card').forEach(host=>{
      if(host.dataset.v418DragReady)return;
      const handle=q('.window-bar,.modal-head',host); if(!handle)return;
      host.dataset.v418DragReady='1';
      let dragging=false,startX=0,startY=0,baseX=0,baseY=0,raf=0;
      function down(e){
        if(e.target.closest('button,input,select,textarea,a'))return;
        const p=e.touches?e.touches[0]:e; const rect=host.getBoundingClientRect();
        dragging=true; host.classList.add('v418-floating'); host.style.left=rect.left+'px'; host.style.top=rect.top+'px'; host.style.width=rect.width+'px'; host.style.zIndex=++zTop;
        startX=p.clientX; startY=p.clientY; baseX=rect.left; baseY=rect.top;
        document.addEventListener('mousemove',move,{passive:true}); document.addEventListener('mouseup',up,{passive:true}); document.addEventListener('touchmove',move,{passive:true}); document.addEventListener('touchend',up,{passive:true});
      }
      function move(e){
        if(!dragging)return; const p=e.touches?e.touches[0]:e; const nx=baseX+(p.clientX-startX); const ny=baseY+(p.clientY-startY);
        if(raf)cancelAnimationFrame(raf); raf=requestAnimationFrame(()=>{ host.style.left=Math.max(8,Math.min(window.innerWidth-120,nx))+'px'; host.style.top=Math.max(8,Math.min(window.innerHeight-92,ny))+'px'; });
      }
      function up(){ dragging=false; document.removeEventListener('mousemove',move); document.removeEventListener('mouseup',up); document.removeEventListener('touchmove',move); document.removeEventListener('touchend',up); }
      handle.addEventListener('mousedown',down); handle.addEventListener('touchstart',down,{passive:true});
    });
  }

  function animateOpen(){
    qa('.modal.show .modal-box').forEach(box=>{ if(box.dataset.v418Open==='1')return; box.dataset.v418Open='1'; box.classList.add('v418-pop'); box.style.zIndex=++zTop; setTimeout(()=>box.classList.remove('v418-pop'),240); });
    qa('.modal:not(.show) .modal-box').forEach(box=>box.dataset.v418Open='0');
  }

  function scan(){ buildDock(); makeDraggable(); animateOpen(); updateBadgesSoon(); }
  function start(){ scan(); const mo=new MutationObserver(()=>requestAnimationFrame(scan)); mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']}); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
  console.log('V418 Mac Window Manager loaded');
})();
