
(function(){
  'use strict';

  const VERSION = 'V417_REAL_MAC_DOCK_STABLE';
  const DOCK_ID = 'v401MacDock';

  function $(sel){ return document.querySelector(sel); }
  function $all(sel){ return Array.from(document.querySelectorAll(sel)); }

  function byText(sel, words){
    const w = Array.isArray(words) ? words : [words];
    return $all(sel || 'button,a,[role="button"]').find(el => {
      const t = (el.textContent || '').trim().toLowerCase();
      return w.every(x => t.includes(String(x).toLowerCase()));
    });
  }

  function clickText(words){
    const el = byText('button,a,[role="button"]', words);
    if(el){ el.click(); updateBadgesSoon(); return true; }
    return false;
  }

  function openHome(){
    if(clickText(['back','dashboard'])) return;
    if(typeof window.showDashboard === 'function') return window.showDashboard();
    try{ window.scrollTo({top:0,behavior:'smooth'}); }catch(_e){ window.scrollTo(0,0); }
  }

  function openOrders(){
    if(typeof window.openEntryModal === 'function') return window.openEntryModal('order');
    if(clickText(['order'])) return;
  }

  function openDN(){
    if(typeof window.openEntryModal === 'function') return window.openEntryModal('delivery_note');
    if(clickText(['delivery','note'])) return;
  }

  function openInvoice(){
    if(typeof window.openEntryModal === 'function') return window.openEntryModal('invoice');
    if(clickText(['invoice'])) return;
  }

  function openCredit(){
    if(typeof window.openCreditNoteModal === 'function') return window.openCreditNoteModal();
    clickText(['credit','note']);
  }

  function openApprovals(){
    if(typeof window.showPendingApprovalOrdersV375 === 'function') return window.showPendingApprovalOrdersV375(true);
    if(typeof window.showPendingApprovalOrdersV372 === 'function') return window.showPendingApprovalOrdersV372(true);
    clickText(['approvals']);
  }

  function openLive(){
    if(typeof window.v401ToggleLiveNotifications === 'function') return window.v401ToggleLiveNotifications();
    const b = document.getElementById('v395NotifButton');
    if(b) b.click();
  }

  function sync(){
    if(typeof window.syncFromCloud === 'function') return window.syncFromCloud();
    if(typeof window.v391RealSyncFromCloud === 'function') return window.v391RealSyncFromCloud();
    if(typeof window.manualRefresh === 'function') return window.manualRefresh();
    // no location.reload here; keep app smooth
  }

  function search(){
    const input = document.querySelector('input[placeholder*="Search"],input[id*="search" i],input[type="search"]');
    if(input){
      try{ input.scrollIntoView({block:'center',behavior:'smooth'}); }catch(_e){}
      input.focus();
    }
  }

  function reports(){
    if(clickText(['monthly','report'])) return;
    if(clickText(['project','report'])) return;
    if(clickText(['supplier','report'])) return;
  }

  function settings(){
    if(clickText(['manage','lists'])) return;
    if(clickText(['settings'])) return;
  }

  function approvalCount(){
    try{
      const btn = $all('*').find(x => {
        const t = (x.textContent || '').trim();
        return /^.*Approvals\s*\d+.*$/i.test(t) && t.length < 80;
      });
      const m = btn && (btn.textContent || '').match(/Approvals\s*(\d+)/i);
      return m ? m[1] : '';
    }catch(_e){ return ''; }
  }

  function unreadLive(){
    try{
      return (JSON.parse(localStorage.getItem('v395_notification_feed') || '[]').filter(x => !x.read).length) || '';
    }catch(_e){ return ''; }
  }

  function iconFor(title){
    const t = String(title || '').toLowerCase();
    if(t.includes('invoice')) return '🧾';
    if(t.includes('delivery') || t.includes('dn')) return '🚚';
    if(t.includes('credit')) return '💳';
    if(t.includes('approval')) return '🔔';
    if(t.includes('report')) return '📊';
    if(t.includes('supplier')) return '🏗️';
    if(t.includes('order')) return '📦';
    if(t.includes('search')) return '🔍';
    return '🪟';
  }

  function injectStyle(){
    if(document.getElementById('v417MacDockStyle')) return;

    const style = document.createElement('style');
    style.id = 'v417MacDockStyle';
    style.textContent = `
/* V417 real stable Mac dock */
body{
  padding-bottom:calc(96px + env(safe-area-inset-bottom,0px))!important;
}

/* one real dock only */
#${DOCK_ID}{
  position:fixed!important;
  left:50%!important;
  bottom:calc(12px + env(safe-area-inset-bottom,0px))!important;
  transform:translateX(-50%)!important;
  z-index:2147483000!important;
  display:flex!important;
  align-items:flex-end!important;
  gap:10px!important;
  padding:10px 14px!important;
  border-radius:28px!important;
  background:rgba(12,13,16,.74)!important;
  border:1px solid rgba(246,219,173,.30)!important;
  box-shadow:
    0 24px 70px rgba(0,0,0,.58),
    inset 0 1px 0 rgba(255,255,255,.12)!important;
  backdrop-filter:blur(28px)!important;
  -webkit-backdrop-filter:blur(28px)!important;
  max-width:calc(100vw - 24px)!important;
  min-height:58px!important;
  overflow-x:auto!important;
  overflow-y:visible!important;
  direction:ltr!important;
  opacity:1!important;
  visibility:visible!important;
}

.v401-dock-item{
  position:relative!important;
  min-width:48px!important;
  width:48px!important;
  height:48px!important;
  border:0!important;
  border-radius:17px!important;
  background:linear-gradient(180deg,rgba(255,255,255,.13),rgba(255,255,255,.045))!important;
  color:#fff!important;
  font-size:23px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  cursor:pointer!important;
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,.09),
    0 7px 20px rgba(0,0,0,.25)!important;
  transition:transform .15s cubic-bezier(.2,.8,.2,1), filter .15s ease, background .15s ease!important;
  will-change:transform!important;
}

.v401-dock-item:hover,
.v401-dock-item:active{
  transform:translateY(-9px) scale(1.15)!important;
  filter:brightness(1.22)!important;
  background:linear-gradient(180deg,rgba(246,219,173,.22),rgba(255,255,255,.055))!important;
}

.v401-dock-item.gold{
  background:linear-gradient(135deg,#f8dfb5,#c28b4b)!important;
  color:#111!important;
}

.v401-dock-badge{
  position:absolute!important;
  right:-5px!important;
  top:-7px!important;
  min-width:21px!important;
  height:21px!important;
  padding:0 6px!important;
  border-radius:999px!important;
  background:#9b661b!important;
  color:#fff!important;
  font:900 11px -apple-system,BlinkMacSystemFont,Segoe UI,Arial!important;
  display:none;
  align-items:center!important;
  justify-content:center!important;
  box-shadow:0 0 0 3px rgba(0,0,0,.40)!important;
}

.v417-window-dock-item{
  background:linear-gradient(180deg,rgba(246,219,173,.24),rgba(246,219,173,.08))!important;
  border:1px solid rgba(246,219,173,.18)!important;
}

.v417-window-dock-item::before{
  content:"";
  position:absolute;
  bottom:-6px;
  left:50%;
  width:5px;
  height:5px;
  transform:translateX(-50%);
  border-radius:50%;
  background:#f5d9a6;
}

/* Mac traffic lights */
.window-bar{
  display:flex!important;
  align-items:center!important;
  gap:8px!important;
  cursor:grab!important;
  user-select:none!important;
  touch-action:none!important;
}

.window-bar:active{cursor:grabbing!important}

.window-btn{
  width:13px!important;
  height:13px!important;
  min-width:13px!important;
  min-height:13px!important;
  border-radius:50%!important;
  padding:0!important;
  margin:0!important;
  border:0!important;
  font-size:0!important;
  line-height:0!important;
  color:transparent!important;
  box-shadow:0 1px 3px rgba(0,0,0,.36), inset 0 1px 1px rgba(255,255,255,.45)!important;
}

.window-btn.red{background:#ff5f57!important}
.window-btn.yellow{background:#ffbd2e!important}
.window-btn.green{background:#28c840!important}

/* Gemini feeling */
.modal.show .modal-box,
.modal-box.v417-pop,
.card.v417-pop,
.panel.v417-pop{
  animation:v417Open .18s cubic-bezier(.2,.8,.2,1) both!important;
  will-change:transform,opacity,filter!important;
}

@keyframes v417Open{
  0%{opacity:0;transform:translateY(15px) scale(.972);filter:blur(8px)}
  100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}
}

.v417-floating{
  position:fixed!important;
  margin:0!important;
  z-index:2147482000!important;
}

/* hide duplicates only, not the real dock */
#windowDock,
#dockFloatingButton,
.workspace-floating-dock,
.floating-dock,
#v416DockToggle,
#v415DockToggle,
.live-floating,
.floating-live,
#liveFloatingButton,
#v395NotifButton{
  display:none!important;
}

#v266CreditNoteMainBtn,
#v264CreditNoteMainBtn,
.floating-credit,
.top-credit-btn{
  display:none!important;
}

@media(max-width:680px){
  #${DOCK_ID}{
    gap:7px!important;
    padding:8px 10px!important;
    border-radius:23px!important;
    min-height:54px!important;
  }
  .v401-dock-item{
    min-width:43px!important;
    width:43px!important;
    height:43px!important;
    font-size:21px!important;
    border-radius:15px!important;
  }
}

@media(min-width:900px){
  .v401-dock-item:hover::after{
    content:attr(title);
    position:absolute;
    bottom:59px;
    left:50%;
    transform:translateX(-50%);
    white-space:nowrap;
    background:rgba(15,16,20,.96);
    border:1px solid rgba(246,219,173,.25);
    color:#f8dcae;
    border-radius:10px;
    padding:5px 8px;
    font:800 11px -apple-system,BlinkMacSystemFont,Segoe UI,Arial;
    pointer-events:none;
  }
}
`;
    document.head.appendChild(style);
  }

  function ensureDock(){
    injectStyle();

    let dock = document.getElementById(DOCK_ID);
    if(!dock){
      dock = document.createElement('div');
      dock.id = DOCK_ID;
      document.body.appendChild(dock);
    }

    dock.style.display = 'flex';
    dock.style.opacity = '1';
    dock.style.visibility = 'visible';
    return dock;
  }

  function inject(){
    const dock = ensureDock();

    // If dock already has core buttons, only refresh style/badges.
    if(dock.querySelector('#v401Dock_home')){
      updateBadgesSoon();
      return;
    }

    dock.innerHTML = '';

    const items = [
      ['home','🏠','Home',openHome,''],
      ['orders','📦','Order',openOrders,'gold'],
      ['dn','🚚','Delivery Note',openDN,'gold'],
      ['invoice','🧾','Invoice',openInvoice,'gold'],
      ['credit','💳','Credit Note',openCredit,''],
      ['approvals','🔔','Approvals',openApprovals,''],
      ['live','🟢','Live Notifications',openLive,''],
      ['sync','🔄','Sync',sync,''],
      ['search','🔍','Search',search,''],
      ['reports','📊','Reports',reports,''],
      ['settings','⚙️','Manage Lists',settings,'']
    ];

    items.forEach(([id,icon,title,fn,cls]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'v401-dock-item ' + cls;
      b.id = 'v401Dock_' + id;
      b.title = title;
      b.innerHTML = icon + '<span class="v401-dock-badge"></span>';
      b.addEventListener('click', fn);
      dock.appendChild(b);
    });

    updateBadgesSoon();
  }

  function setBadge(id,val){
    const el = document.querySelector('#v401Dock_' + id + ' .v401-dock-badge');
    if(!el) return;
    if(val && String(val) !== '0'){
      el.textContent = String(val);
      el.style.display = 'inline-flex';
    } else {
      el.style.display = 'none';
    }
  }

  let badgeTimer = null;
  function updateBadgesSoon(){
    if(badgeTimer) clearTimeout(badgeTimer);
    badgeTimer = setTimeout(updateBadges, 120);
  }

  function updateBadges(){
    setBadge('live', unreadLive());
    setBadge('approvals', approvalCount());
  }

  window.v401UpdateDockBadges = updateBadgesSoon;

  function titleFor(host){
    return (
      host.querySelector('.section-title,.title,h1,h2,h3,.modal-head h3')?.textContent ||
      host.dataset.title ||
      'Window'
    ).trim();
  }

  function minimizedWindowId(host){
    if(!host.dataset.windowId){
      host.dataset.windowId = 'w_' + Math.random().toString(36).slice(2,9);
    }
    return host.dataset.windowId;
  }

  function addWindowDockItem(host, modal){
    const dock = ensureDock();
    const id = minimizedWindowId(host);
    let item = dock.querySelector('[data-v417-window-id="' + id + '"]');
    if(item) return item;

    const title = titleFor(host);
    item = document.createElement('button');
    item.type = 'button';
    item.className = 'v401-dock-item v417-window-dock-item';
    item.dataset.v417WindowId = id;
    item.title = title;
    item.innerHTML = iconFor(title) + '<span class="v401-dock-badge"></span>';

    item.addEventListener('click', () => {
      if(modal) modal.classList.add('show');
      host.style.display = '';
      host.classList.add('v417-pop');
      setTimeout(() => host.classList.remove('v417-pop'), 230);
      item.remove();
    });

    dock.appendChild(item);
    return item;
  }

  function minimizeHost(host, modal){
    addWindowDockItem(host, modal);
    host.style.display = 'none';
    if(modal) modal.classList.remove('show');
  }

  function closeHost(host, modal){
    const id = host.dataset.windowId;
    if(id){
      const item = document.querySelector('[data-v417-window-id="' + id + '"]');
      if(item) item.remove();
    }
    if(modal) modal.classList.remove('show');
    else host.style.display = 'none';
  }

  function maximizeHost(host){
    host.classList.toggle('maximized');
    host.classList.remove('compact');
  }

  // Fix existing yellow button: old code used missing #windowDock.
  window.windowAction = function(ev, action){
    if(ev){
      ev.preventDefault();
      ev.stopPropagation();
    }
    const target = ev && ev.target;
    const host = target?.closest?.('.modal-box,.card,.panel,.login-card');
    if(!host) return;
    const modal = target?.closest?.('.modal');

    if(action === 'close') return closeHost(host, modal);
    if(action === 'compact') return minimizeHost(host, modal);
    if(action === 'maximize') return maximizeHost(host);
  };

  function makeDraggable(){
    $all('.modal-box,.panel,.card').forEach(host => {
      if(host.dataset.v417DragReady) return;
      const handle = host.querySelector('.window-bar,.modal-head');
      if(!handle) return;

      host.dataset.v417DragReady = '1';

      let dragging = false, startX = 0, startY = 0, baseX = 0, baseY = 0, raf = 0;

      function down(e){
        if(e.target.closest('button,input,select,textarea,a')) return;
        const p = e.touches ? e.touches[0] : e;
        const rect = host.getBoundingClientRect();
        dragging = true;

        host.classList.add('v417-floating');
        host.style.left = rect.left + 'px';
        host.style.top = rect.top + 'px';
        host.style.width = rect.width + 'px';

        startX = p.clientX;
        startY = p.clientY;
        baseX = rect.left;
        baseY = rect.top;

        document.addEventListener('mousemove', move, {passive:true});
        document.addEventListener('mouseup', up, {passive:true});
        document.addEventListener('touchmove', move, {passive:true});
        document.addEventListener('touchend', up, {passive:true});
      }

      function move(e){
        if(!dragging) return;
        const p = e.touches ? e.touches[0] : e;
        const nx = baseX + (p.clientX - startX);
        const ny = baseY + (p.clientY - startY);

        if(raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          host.style.left = Math.max(8, Math.min(window.innerWidth - 120, nx)) + 'px';
          host.style.top = Math.max(8, Math.min(window.innerHeight - 90, ny)) + 'px';
        });
      }

      function up(){
        dragging = false;
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
        document.removeEventListener('touchmove', move);
        document.removeEventListener('touchend', up);
      }

      handle.addEventListener('mousedown', down);
      handle.addEventListener('touchstart', down, {passive:true});
    });
  }

  function animateOpen(){
    $all('.modal.show .modal-box').forEach(box => {
      if(box.dataset.v417LastOpen === '1') return;
      box.dataset.v417LastOpen = '1';
      box.classList.add('v417-pop');
      setTimeout(() => box.classList.remove('v417-pop'), 240);
    });

    $all('.modal:not(.show) .modal-box').forEach(box => {
      box.dataset.v417LastOpen = '0';
    });
  }

  function scan(){
    ensureDock();
    makeDraggable();
    animateOpen();
  }

  function start(){
    inject();
    scan();

    const mo = new MutationObserver(() => {
      requestAnimationFrame(scan);
      updateBadgesSoon();
    });

    if(document.body){
      mo.observe(document.body, {
        childList:true,
        subtree:true,
        attributes:true,
        attributeFilter:['class','style']
      });
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // Safety: if app renders late, create dock after it too.
  setTimeout(inject, 500);
  setTimeout(inject, 1500);

  console.log(VERSION, 'loaded');
})();
