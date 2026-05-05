(function(){
  'use strict';
  const VERSION='V407_WORKSPACE_FINAL_FIX';
  let zTop=2147483000;
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  function toast(msg){ try{ if(typeof window.showToast==='function') return window.showToast(msg); }catch(e){} console.log('[V407]',msg); }
  function titleOf(box){
    return (qs('h3,.section-title,.title,.modal-head h3,.window-title',box)?.textContent || box?.dataset?.title || 'Window').trim() || 'Window';
  }
  function clickByText(words){
    const arr=Array.isArray(words)?words:[words];
    const el=qsa('button,a,[role="button"]').find(x=>{
      const t=(x.textContent||'').toLowerCase();
      return arr.every(w=>t.includes(String(w).toLowerCase()));
    });
    if(el){ el.click(); return true; }
    return false;
  }
  function openOrder(){ if(typeof window.openEntryModal==='function') return window.openEntryModal(null,'order'); clickByText(['order']); }
  function openDN(){ if(typeof window.openEntryModal==='function') return window.openEntryModal(null,'delivery_note'); clickByText(['delivery','note']); }
  function openInvoice(){ if(typeof window.openEntryModal==='function') return window.openEntryModal(null,'invoice'); clickByText(['invoice']); }
  function openCredit(){ if(typeof window.openCreditNoteModal==='function') return window.openCreditNoteModal(); clickByText(['credit','note']); }
  function openApprovals(){ if(typeof window.showPendingApprovalOrdersV375==='function') return window.showPendingApprovalOrdersV375(true); if(typeof window.showPendingApprovalOrdersV372==='function') return window.showPendingApprovalOrdersV372(true); clickByText(['approvals']); }
  function openLive(){ const b=qs('#v395NotifButton'); if(b) return b.click(); if(typeof window.v401ToggleLiveNotifications==='function') return window.v401ToggleLiveNotifications(); }
  function syncNow(){ if(typeof window.syncFromCloud==='function') return window.syncFromCloud(); if(typeof window.manualRefresh==='function') return window.manualRefresh(); location.reload(); }
  function monthlyReport(){ if(clickByText(['monthly','report'])) return; if(clickByText(['report'])) return; }
  function searchFocus(){ const input=qs('input[placeholder*="Search"],input[type="search"],input[id*="search" i]'); if(input){ input.scrollIntoView({block:'center',behavior:'smooth'}); input.focus(); } }

  function injectStyle(){
    if(qs('#v407WorkspaceStyle')) return;
    const st=document.createElement('style'); st.id='v407WorkspaceStyle';
    st.textContent=`
/* V407 final workspace fix */
#v401MacDock,#windowDock,#v404DockToggle,#v406DockHide,.v404-minimize-entry{display:none!important}
body{padding-bottom:calc(92px + env(safe-area-inset-bottom,0px))!important}
#v403Dock{position:fixed!important;left:50%!important;bottom:calc(12px + env(safe-area-inset-bottom,0px))!important;transform:translateX(-50%)!important;z-index:2147483200!important;display:flex!important;align-items:end!important;gap:9px!important;padding:10px 13px!important;border-radius:28px!important;background:rgba(9,10,13,.72)!important;border:1px solid rgba(246,219,173,.28)!important;box-shadow:0 24px 74px rgba(0,0,0,.58),inset 0 1px 0 rgba(255,255,255,.10)!important;backdrop-filter:blur(28px)!important;-webkit-backdrop-filter:blur(28px)!important;max-width:calc(100vw - 22px)!important;overflow-x:auto!important;scrollbar-width:none!important;direction:ltr!important;transition:transform .26s cubic-bezier(.2,.85,.2,1),opacity .18s ease!important}
#v403Dock::-webkit-scrollbar{display:none!important}
.v403-dock-item,.v407-dock-item,.v407-dock-chip{position:relative!important;min-width:48px!important;height:48px!important;border:0!important;border-radius:17px!important;background:linear-gradient(180deg,rgba(255,255,255,.15),rgba(255,255,255,.045))!important;color:#fff!important;font-size:23px!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.09)!important;transition:transform .16s ease,filter .16s ease,background .16s ease!important;flex:0 0 auto!important}
.v403-dock-item.gold,.v407-dock-item.gold{background:linear-gradient(135deg,#f8e2bc,#c18a4a)!important;color:#111!important}.v403-dock-item:hover,.v407-dock-item:hover,.v407-dock-chip:hover{transform:translateY(-8px) scale(1.14)!important;filter:brightness(1.22)!important}.v407-dock-sep{width:1px;height:42px;background:rgba(255,255,255,.16);margin:0 2px;flex:0 0 1px}.v407-dock-chip{font-size:12px!important;max-width:126px!important;padding:0 10px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;background:linear-gradient(180deg,rgba(246,219,173,.20),rgba(255,255,255,.055))!important}.v407-dock-chip:before{content:'🪟';margin-right:5px}.v407-badge,.v403-badge{position:absolute!important;right:-5px!important;top:-7px!important;min-width:20px!important;height:20px!important;padding:0 5px!important;border-radius:999px!important;background:#9b661b!important;color:#fff!important;font:900 11px -apple-system,BlinkMacSystemFont,Segoe UI,Arial!important;display:none;align-items:center!important;justify-content:center!important;box-shadow:0 0 0 3px rgba(0,0,0,.36)!important}
#v407DockToggle{position:fixed!important;right:12px!important;bottom:calc(82px + env(safe-area-inset-bottom,0px))!important;z-index:2147483300!important;border:1px solid rgba(246,219,173,.27)!important;background:rgba(10,11,14,.82)!important;color:#f7dcaf!important;border-radius:999px!important;padding:8px 11px!important;font:900 12px -apple-system,BlinkMacSystemFont,Segoe UI,Arial!important;box-shadow:0 12px 32px rgba(0,0,0,.45)!important;backdrop-filter:blur(18px)!important;-webkit-backdrop-filter:blur(18px)!important}
body.v407-dock-hidden #v403Dock{transform:translateX(-50%) translateY(calc(100% + 26px))!important;opacity:.08!important;pointer-events:none!important}body.v407-dock-hidden{padding-bottom:14px!important}body.v407-dock-hidden #v407DockToggle{bottom:calc(12px + env(safe-area-inset-bottom,0px))!important}
.modal.show{background:rgba(0,0,0,.14)!important;backdrop-filter:blur(5px)!important;-webkit-backdrop-filter:blur(5px)!important;align-items:initial!important;justify-content:initial!important;overflow:visible!important;padding:0!important}.modal.show .modal-box{position:fixed!important;left:50%;top:58px;transform:translateX(-50%);max-height:calc(100vh - 142px)!important;overflow:auto!important;border-radius:26px!important;box-shadow:0 34px 96px rgba(0,0,0,.68),0 0 0 1px rgba(246,219,173,.22),inset 0 1px 0 rgba(255,255,255,.10)!important;backdrop-filter:blur(26px)!important;-webkit-backdrop-filter:blur(26px)!important;pointer-events:auto!important}.modal.show .modal-box.v407-magic{animation:v407GeminiOpen .42s cubic-bezier(.16,.95,.18,1.08)!important;will-change:transform,opacity,filter!important}@keyframes v407GeminiOpen{0%{opacity:0;transform:translateX(-50%) translateY(46px) scale(.92);filter:blur(18px) saturate(.78)}54%{opacity:1;transform:translateX(-50%) translateY(-5px) scale(1.018);filter:blur(2px) saturate(1.12)}100%{opacity:1;transform:translateX(-50%) translateY(0) scale(1);filter:blur(0) saturate(1)}}
.v407-window-bar{display:flex!important;gap:9px!important;align-items:center!important;margin:0 0 14px 0!important;height:18px!important;cursor:grab!important;user-select:none!important;direction:ltr!important}.v407-window-bar:active{cursor:grabbing!important}.window-bar{cursor:grab!important}.window-btn,.v407-window-btn{width:13px!important;height:13px!important;min-width:13px!important;min-height:13px!important;border-radius:999px!important;padding:0!important;border:0!important;font-size:0!important;line-height:0!important;color:transparent!important;text-indent:-9999px!important;overflow:hidden!important;box-shadow:inset 0 0 0 1px rgba(0,0,0,.24),0 1px 5px rgba(0,0,0,.30)!important;opacity:.96!important;cursor:pointer!important;transition:transform .13s ease,filter .13s ease!important}.window-btn:hover,.v407-window-btn:hover{transform:scale(1.18)!important;filter:brightness(1.15)!important}.window-btn.red,.v407-window-btn.red{background:#ff5f57!important}.window-btn.yellow,.v407-window-btn.yellow{background:#febc2e!important}.window-btn.green,.v407-window-btn.green{background:#28c840!important}
.modal.show .modal-box.v407-dragging{opacity:.96!important;user-select:none!important;transition:none!important}.v407-fullscreen{left:8px!important;top:8px!important;transform:none!important;width:calc(100vw - 16px)!important;max-width:calc(100vw - 16px)!important;height:calc(100vh - 24px)!important;max-height:calc(100vh - 24px)!important}.v407-fullscreen .modal-head{position:sticky!important;top:0!important;z-index:3!important;background:rgba(12,13,16,.82)!important;backdrop-filter:blur(14px)!important}
@media(max-width:680px){#v403Dock{gap:7px!important;padding:8px 10px!important;border-radius:23px!important}.v403-dock-item,.v407-dock-item,.v407-dock-chip{min-width:43px!important;height:43px!important;font-size:21px!important;border-radius:15px!important}.modal.show .modal-box{left:8px!important;right:8px!important;top:54px!important;transform:none!important;width:auto!important;max-width:calc(100vw - 16px)!important}@keyframes v407GeminiOpen{0%{opacity:0;transform:translateY(32px) scale(.94);filter:blur(16px)}62%{opacity:1;transform:translateY(-3px) scale(1.012);filter:blur(1px)}100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}}#v407DockToggle{right:8px;bottom:calc(76px + env(safe-area-inset-bottom,0px))}}
`;
    document.head.appendChild(st);
  }

  function ensureDock(){
    let dock=qs('#v403Dock');
    if(!dock){ dock=document.createElement('div'); dock.id='v403Dock'; dock.setAttribute('aria-label','Vardophase Dock'); document.body.appendChild(dock); }
    // remove accidental old dock containers/items only, not the real dock
    qsa('#windowDock,#v401MacDock').forEach(x=>x.remove());
    ensureDockShortcuts(dock);
    ensureDockToggle();
    return dock;
  }
  function dockBtn(id,icon,title,fn,cls){
    let b=qs('#v407Dock_'+id);
    if(b) return b;
    b=document.createElement('button'); b.type='button'; b.id='v407Dock_'+id; b.className='v407-dock-item '+(cls||''); b.title=title; b.innerHTML=icon+'<span class="v407-badge"></span>'; b.onclick=fn; return b;
  }
  function ensureDockShortcuts(dock){
    if(qs('#v407Dock_home',dock)) return;
    const items=[
      ['home','🏠','Home',()=>{ if(clickByText(['back','dashboard'])) return; window.scrollTo({top:0,behavior:'smooth'}); },''],
      ['order','📦','New Order',openOrder,'gold'],['dn','🚚','Delivery Note',openDN,'gold'],['invoice','🧾','Invoice',openInvoice,'gold'],['credit','💳','Credit Note',openCredit,''],['approvals','🔔','Approvals',openApprovals,''],['live','🟢','Live Notifications',openLive,''],['sync','🔄','Sync',syncNow,''],['search','🔍','Search',searchFocus,''],['reports','📊','Monthly Report',monthlyReport,''],['settings','⚙️','Manage Lists',()=>clickByText(['manage','lists']),'']
    ];
    const frag=document.createDocumentFragment();
    items.forEach((it,i)=>{ if(i===5){ const sep=document.createElement('div'); sep.className='v407-dock-sep'; frag.appendChild(sep); } frag.appendChild(dockBtn(...it)); });
    dock.prepend(frag);
  }
  function ensureDockToggle(){
    qsa('#v404DockToggle,#v406DockHide').forEach(x=>x.remove());
    let b=qs('#v407DockToggle');
    if(!b){ b=document.createElement('button'); b.type='button'; b.id='v407DockToggle'; document.body.appendChild(b); }
    const set=()=>{ b.textContent=document.body.classList.contains('v407-dock-hidden')?'⌃ Dock':'⌄ Dock'; };
    b.onclick=()=>{ document.body.classList.toggle('v407-dock-hidden'); localStorage.setItem('v407_dock_hidden',document.body.classList.contains('v407-dock-hidden')?'1':'0'); set(); };
    if(!localStorage.getItem('v407_initialized')){ localStorage.setItem('v407_initialized','1'); localStorage.removeItem('v404_dock_hidden'); localStorage.removeItem('v406_dock_hidden'); document.body.classList.remove('v404-dock-hidden','v406-dock-hidden','v407-dock-hidden'); }
    if(localStorage.getItem('v407_dock_hidden')==='1') document.body.classList.add('v407-dock-hidden');
    set();
  }
  function setBadge(id,val){ const el=qs('#v407Dock_'+id+' .v407-badge'); if(!el) return; if(val && String(val)!=='0'){ el.textContent=String(val); el.style.display='inline-flex'; } else el.style.display='none'; }
  function approvalCount(){ const el=qsa('*').find(x=>/^\s*🔔?\s*Approvals\s*\d+\s*$/.test(x.textContent||'')); const m=el&&(el.textContent||'').match(/Approvals\s*(\d+)/i); return m?m[1]:''; }
  function unreadLive(){ try{return JSON.parse(localStorage.getItem('v395_notification_feed')||'[]').filter(x=>!x.read).length||'';}catch(e){return '';}}
  function updateBadges(){ setBadge('approvals',approvalCount()); setBadge('live',unreadLive()); }

  function ensureControls(box){
    let bar=qs('.window-bar,.v407-window-bar',box);
    if(!bar){
      bar=document.createElement('div'); bar.className='v407-window-bar';
      bar.innerHTML='<button type="button" class="v407-window-btn red" aria-label="Close"></button><button type="button" class="v407-window-btn yellow" aria-label="Minimize"></button><button type="button" class="v407-window-btn green" aria-label="Fullscreen"></button>';
      box.insertBefore(bar, box.firstChild);
    }
    const modal=box.closest('.modal');
    const red=qs('.red',bar), yellow=qs('.yellow',bar), green=qs('.green',bar);
    if(red) red.onclick=(e)=>{e.preventDefault();e.stopPropagation();closeBox(box,modal);};
    if(yellow) yellow.onclick=(e)=>{e.preventDefault();e.stopPropagation();minimizeBox(box,modal);};
    if(green) green.onclick=(e)=>{e.preventDefault();e.stopPropagation();toggleFull(box);};
    return bar;
  }
  function bringFront(box){ box.style.zIndex=String(++zTop); }
  function closeBox(box,modal){
    const id=box.dataset.v407Id; if(id) removeDockChip(id);
    if(modal){ modal.classList.remove('show'); modal.style.display=''; }
    else box.style.display='none';
  }
  function minimizeBox(box,modal){
    const id=box.dataset.v407Id || box.dataset.v406Id || ('v407win_'+Math.random().toString(36).slice(2,9));
    box.dataset.v407Id=id; box.dataset.v406Id=id;
    const title=titleOf(box);
    if(modal){ modal.classList.remove('show'); modal.style.display='none'; }
    else box.style.display='none';
    addDockChip(id,title,box,modal);
    toast('Window moved to Dock');
  }
  function addDockChip(id,title,box,modal){
    const dock=ensureDock(); let chip=qs('#v407Chip_'+id); if(chip) return;
    chip=document.createElement('button'); chip.type='button'; chip.id='v407Chip_'+id; chip.className='v407-dock-chip'; chip.textContent=title; chip.title='Restore '+title; chip.draggable=true;
    chip.addEventListener('dragstart',e=>{ e.dataTransfer.setData('text/plain',title); });
    chip.onclick=()=>{ if(modal){ modal.style.display=''; modal.classList.add('show'); } box.style.display=''; box.classList.add('v407-magic'); bringFront(box); chip.remove(); setTimeout(()=>box.classList.remove('v407-magic'),450); };
    dock.appendChild(chip);
  }
  function removeDockChip(id){ const chip=qs('#v407Chip_'+id)||qs('#dock_'+id)||qs('#v403Chip_'+id); if(chip) chip.remove(); }
  function toggleFull(box){
    if(!box.dataset.v407Prev){ box.dataset.v407Prev=JSON.stringify({left:box.style.left,top:box.style.top,transform:box.style.transform,width:box.style.width,height:box.style.height,maxWidth:box.style.maxWidth}); box.classList.add('v407-fullscreen'); }
    else{ try{Object.assign(box.style,JSON.parse(box.dataset.v407Prev));}catch(e){} box.classList.remove('v407-fullscreen'); delete box.dataset.v407Prev; }
    bringFront(box);
  }
  function makeDraggable(box){
    if(box.dataset.v407Drag==='1') return; box.dataset.v407Drag='1';
    let bar=qs('.window-bar,.v407-window-bar,.modal-head',box); if(!bar) bar=box;
    let dragging=false,sx=0,sy=0,ox=0,oy=0;
    bar.addEventListener('pointerdown',e=>{ if(e.target.closest('button,input,select,textarea,a')) return; dragging=true; bringFront(box); box.classList.add('v407-dragging'); const r=box.getBoundingClientRect(); sx=e.clientX; sy=e.clientY; ox=r.left; oy=r.top; box.style.position='fixed'; box.style.transform='none'; box.style.left=ox+'px'; box.style.top=oy+'px'; try{bar.setPointerCapture(e.pointerId)}catch(_e){} });
    bar.addEventListener('pointermove',e=>{ if(!dragging) return; const nx=Math.max(2,Math.min(window.innerWidth-80,ox+(e.clientX-sx))); const ny=Math.max(2,Math.min(window.innerHeight-80,oy+(e.clientY-sy))); box.style.left=nx+'px'; box.style.top=ny+'px'; });
    bar.addEventListener('pointerup',e=>{ dragging=false; box.classList.remove('v407-dragging'); try{bar.releasePointerCapture(e.pointerId)}catch(_e){} });
    bar.addEventListener('pointercancel',()=>{ dragging=false; box.classList.remove('v407-dragging'); });
  }
  function enhanceBox(box){
    if(!box || box.classList.contains('login-card')) return;
    ensureControls(box);
    makeDraggable(box);
    if(!box.dataset.v407Seen){ box.dataset.v407Seen='1'; box.classList.add('v407-magic'); setTimeout(()=>box.classList.remove('v407-magic'),460); }
  }
  function enhanceAll(){
    injectStyle(); ensureDock(); updateBadges();
    qsa('.modal.show .modal-box,.modal .modal-box,.v403-workspace-window').forEach(enhanceBox);
  }
  window.windowAction=function(ev,action){
    if(ev){ ev.preventDefault(); ev.stopPropagation(); }
    const box=ev?.target?.closest?.('.modal-box,.card,.panel,.v403-workspace-window'); if(!box) return;
    const modal=box.closest('.modal');
    if(action==='close') return closeBox(box,modal);
    if(action==='compact') return minimizeBox(box,modal);
    if(action==='maximize') return toggleFull(box);
  };
  window.v407MinimizeActiveWindow=function(){ const box=qs('.modal.show .modal-box'); if(box) minimizeBox(box,box.closest('.modal')); };
  window.v407UpdateDockBadges=updateBadges;
  function boot(){ enhanceAll(); setInterval(updateBadges,2500); console.log(VERSION,'loaded'); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.addEventListener('load',()=>setTimeout(boot,80));
  const mo=new MutationObserver(()=>requestAnimationFrame(enhanceAll));
  mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
})();
