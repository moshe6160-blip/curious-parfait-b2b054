(function(){
  'use strict';
  const VERSION = 'V403_MAC_WORKSPACE_DOCK';
  const state = { windows:{}, minimized:[], active:null };

  function qs(sel){ return document.querySelector(sel); }
  function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }
  function esc(s){ return String(s||'').replace(/[&<>'"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c])); }
  function byText(sel, words){
    const w = Array.isArray(words) ? words : [words];
    return qsa(sel || 'button,a,[role="button"]').find(el=>{
      const t=(el.textContent||'').trim().toLowerCase();
      return w.every(x=>t.includes(String(x).toLowerCase()));
    });
  }
  function clickText(words){ const el=byText('button,a,[role="button"]', words); if(el){ el.click(); return true; } return false; }
  function toast(msg){
    try{ if(typeof window.showToast==='function') return window.showToast(msg); }catch(_e){}
    let el=qs('#v403Toast');
    if(!el){ el=document.createElement('div'); el.id='v403Toast'; document.body.appendChild(el); }
    el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2200);
  }

  function injectStyle(){
    if(qs('#v403WorkspaceStyle')) return;
    const s=document.createElement('style');
    s.id='v403WorkspaceStyle';
    s.textContent = `
body{padding-bottom:calc(104px + env(safe-area-inset-bottom,0px))!important}
#v401MacDock{display:none!important}
#v403Dock{position:fixed;left:50%;bottom:calc(10px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2147482500;display:flex;align-items:end;gap:9px;padding:10px 12px;border-radius:26px;background:rgba(10,11,14,.74);border:1px solid rgba(246,219,173,.26);box-shadow:0 22px 60px rgba(0,0,0,.58),inset 0 1px 0 rgba(255,255,255,.08);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);max-width:calc(100vw - 18px);overflow-x:auto;direction:ltr;scrollbar-width:none}
#v403Dock::-webkit-scrollbar{display:none}.v403-dock-sep{width:1px;height:42px;background:rgba(255,255,255,.15);margin:0 2px;flex:0 0 1px}.v403-dock-item{position:relative;min-width:48px;height:48px;border:0;border-radius:17px;background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.045));color:#fff;font-size:23px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:inset 0 0 0 1px rgba(255,255,255,.085);transition:transform .16s ease,filter .16s ease,background .16s ease;flex:0 0 auto}.v403-dock-item.gold{background:linear-gradient(135deg,#f7dfb7,#c18a4a);color:#111}.v403-dock-item.active{box-shadow:0 0 0 2px rgba(246,219,173,.45),0 0 24px rgba(246,219,173,.18)}.v403-dock-item:hover,.v403-dock-item:active{transform:translateY(-7px) scale(1.13);filter:brightness(1.22)}
.v403-badge{position:absolute;right:-5px;top:-7px;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#a56b1c;color:#fff;font:900 11px -apple-system,BlinkMacSystemFont,Segoe UI,Arial;display:none;align-items:center;justify-content:center;box-shadow:0 0 0 3px rgba(0,0,0,.38)}.v403-window-chip{font-size:18px;background:linear-gradient(180deg,rgba(246,219,173,.18),rgba(255,255,255,.06));border:1px solid rgba(246,219,173,.22)}
.v403-workspace-window{position:fixed;z-index:2147482000;left:50%;top:74px;transform:translateX(-50%);width:min(720px,calc(100vw - 24px));max-height:calc(100vh - 150px);border-radius:22px;background:rgba(14,15,18,.92);border:1px solid rgba(246,219,173,.22);box-shadow:0 28px 90px rgba(0,0,0,.64),inset 0 1px 0 rgba(255,255,255,.08);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);overflow:hidden;color:#fff}.v403-workspace-window.dragging{opacity:.93;user-select:none}.v403-window-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.035));border-bottom:1px solid rgba(255,255,255,.08);cursor:grab}.v403-title{font:900 14px -apple-system,BlinkMacSystemFont,Segoe UI,Arial;color:#f7dcaf;letter-spacing:.02em;display:flex;gap:8px;align-items:center}.v403-actions{display:flex;gap:7px}.v403-action{width:28px;height:28px;border:0;border-radius:999px;background:rgba(255,255,255,.11);color:#fff;cursor:pointer;font-weight:900}.v403-action.min{background:#d6a351;color:#151515}.v403-action.close{background:#7d2d2d}.v403-window-body{padding:14px;overflow:auto;max-height:calc(100vh - 205px)}.v403-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.v403-card{border:1px solid rgba(246,219,173,.18);background:rgba(255,255,255,.055);border-radius:16px;padding:12px;cursor:pointer;min-height:76px}.v403-card strong{display:block;color:#f7dcaf;margin-bottom:5px}.v403-card small{color:#d5d7de}.v403-doc{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid rgba(246,219,173,.18);background:rgba(255,255,255,.055);border-radius:14px;padding:10px;margin:8px 0}.v403-doc[draggable="true"]{cursor:grab}.v403-pill{border:1px solid rgba(246,219,173,.25);background:rgba(246,219,173,.12);color:#f7dcaf;border-radius:999px;padding:6px 9px;font-weight:800;font-size:12px}.v403-muted{color:#cfd1d7;font-size:12px;line-height:1.45}.v403-row{display:flex;gap:9px;flex-wrap:wrap;align-items:center}.v403-btn{border:0;border-radius:12px;padding:9px 12px;font-weight:900;cursor:pointer;background:linear-gradient(135deg,#f7dfb7,#c18a4a);color:#111}.v403-btn.dark{background:rgba(255,255,255,.10);color:#fff;border:1px solid rgba(255,255,255,.10)}#v403Toast{position:fixed;left:50%;bottom:calc(92px + env(safe-area-inset-bottom,0px));transform:translateX(-50%) translateY(20px);opacity:0;pointer-events:none;z-index:2147482600;background:rgba(20,21,25,.94);border:1px solid rgba(246,219,173,.28);color:#f7dcaf;padding:10px 13px;border-radius:14px;box-shadow:0 16px 40px rgba(0,0,0,.45);transition:.22s ease;font:800 13px -apple-system,BlinkMacSystemFont,Segoe UI,Arial}#v403Toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
#v395NotifButton,#v266CreditNoteMainBtn,#v264CreditNoteMainBtn,.floating-credit,.top-credit-btn{display:none!important}
@media(max-width:680px){#v403Dock{gap:7px;padding:8px 10px;border-radius:23px}.v403-dock-item{min-width:43px;height:43px;font-size:21px;border-radius:15px}.v403-workspace-window{top:58px;width:calc(100vw - 16px);max-height:calc(100vh - 138px)}.v403-window-body{max-height:calc(100vh - 193px)}}
@media(min-width:900px){.v403-dock-item:hover::after{content:attr(title);position:absolute;bottom:58px;left:50%;transform:translateX(-50%);white-space:nowrap;background:rgba(15,16,20,.96);border:1px solid rgba(246,219,173,.25);color:#f8dcae;border-radius:10px;padding:5px 8px;font:800 11px -apple-system,BlinkMacSystemFont,Segoe UI,Arial}}
`;
    document.head.appendChild(s);
  }

  function ensureDock(){
    injectStyle();
    let dock=qs('#v403Dock');
    if(dock) return dock;
    dock=document.createElement('div'); dock.id='v403Dock'; dock.setAttribute('aria-label','Vardophase Mac Workspace Dock');
    const apps=[
      ['home','🏠','Home',openHome,''],['orders','📦','Order',openOrders,'gold'],['dn','🚚','Delivery Note',openDN,'gold'],['invoice','🧾','Invoice',openInvoice,'gold'],['credit','💳','Credit Note',openCredit,''],['approvals','🔔','Approvals',openApprovals,''],['live','🟢','Live Notifications',openLive,''],['reports','📊','Monthly Report',openReports,'gold'],['docs','📄','Open Documents',openDocuments,''],['sync','🔄','Sync',sync,''],['search','🔍','Search',search,''],['settings','⚙️','Manage Lists',settings,'']
    ];
    apps.forEach((it,idx)=>{ if(idx===8) dock.appendChild(sep()); dock.appendChild(dockButton(...it)); });
    document.body.appendChild(dock);
    updateBadges(); setInterval(updateBadges,2200);
    return dock;
  }
  function sep(){ const d=document.createElement('div'); d.className='v403-dock-sep'; return d; }
  function dockButton(id,icon,title,fn,cls){ const b=document.createElement('button'); b.type='button'; b.className='v403-dock-item '+(cls||''); b.id='v403Dock_'+id; b.title=title; b.innerHTML=icon+'<span class="v403-badge"></span>'; b.onclick=fn; return b; }
  function setBadge(id,val){ const el=qs('#v403Dock_'+id+' .v403-badge'); if(!el) return; if(val && String(val)!=='0'){ el.textContent=String(val); el.style.display='inline-flex'; } else el.style.display='none'; }
  function approvalCount(){ const el=qsa('*').find(x=>(x.textContent||'').includes('Approvals')); const m=el && (el.textContent||'').match(/Approvals\s*(\d+)/i); return m?m[1]:''; }
  function unreadLive(){ try{return (JSON.parse(localStorage.getItem('v395_notification_feed')||'[]').filter(x=>!x.read).length)||'';}catch(_e){return '';} }
  function updateBadges(){ setBadge('approvals',approvalCount()); setBadge('live',unreadLive()); setBadge('docs',state.minimized.length); }

  function createWindow(id,title,bodyHtml,opts={}){
    ensureDock();
    let w=qs('#'+id);
    if(w){ w.style.display='block'; bringFront(w); return w; }
    w=document.createElement('div'); w.id=id; w.className='v403-workspace-window'; w.dataset.title=title; w.style.left=opts.left||'50%'; w.style.top=opts.top||'74px';
    w.innerHTML=`<div class="v403-window-head"><div class="v403-title"><span>${esc(opts.icon||'🪟')}</span><span>${esc(title)}</span></div><div class="v403-actions"><button class="v403-action min" title="Minimize">—</button><button class="v403-action" title="Maximize">□</button><button class="v403-action close" title="Close">×</button></div></div><div class="v403-window-body">${bodyHtml||''}</div>`;
    document.body.appendChild(w); state.windows[id]=w; wireWindow(w); bringFront(w); return w;
  }
  function wireWindow(w){
    const head=w.querySelector('.v403-window-head'); const min=w.querySelector('.v403-action.min'); const max=w.querySelector('.v403-action:not(.min):not(.close)'); const close=w.querySelector('.v403-action.close');
    min.onclick=()=>minimizeWindow(w.id); max.onclick=()=>toggleMax(w); close.onclick=()=>{ w.remove(); removeDockWindow(w.id); delete state.windows[w.id]; };
    let dragging=false, sx=0, sy=0, ox=0, oy=0;
    head.addEventListener('pointerdown',e=>{ if(e.target.closest('button')) return; dragging=true; w.classList.add('dragging'); bringFront(w); const r=w.getBoundingClientRect(); sx=e.clientX; sy=e.clientY; ox=r.left; oy=r.top; head.setPointerCapture?.(e.pointerId); });
    head.addEventListener('pointermove',e=>{ if(!dragging) return; const nx=ox+(e.clientX-sx); const ny=oy+(e.clientY-sy); w.style.left=Math.max(6,Math.min(window.innerWidth-60,nx))+'px'; w.style.top=Math.max(6,Math.min(window.innerHeight-80,ny))+'px'; w.style.transform='none'; });
    head.addEventListener('pointerup',e=>{ dragging=false; w.classList.remove('dragging'); try{head.releasePointerCapture(e.pointerId)}catch(_e){} });
  }
  function bringFront(w){ qsa('.v403-workspace-window').forEach(x=>x.style.zIndex=2147482000); w.style.zIndex=2147482100; state.active=w.id; }
  function toggleMax(w){ if(w.dataset.max==='1'){ w.dataset.max='0'; w.style.left=w.dataset.prevLeft||'50%'; w.style.top=w.dataset.prevTop||'74px'; w.style.width='min(720px,calc(100vw - 24px))'; w.style.height=''; w.style.transform=w.dataset.prevTransform||'translateX(-50%)'; } else { w.dataset.max='1'; w.dataset.prevLeft=w.style.left; w.dataset.prevTop=w.style.top; w.dataset.prevTransform=w.style.transform; w.style.left='8px'; w.style.top='8px'; w.style.transform='none'; w.style.width='calc(100vw - 16px)'; w.style.height='calc(100vh - 118px)'; } }
  function minimizeWindow(id){ const w=qs('#'+id); if(!w) return; w.style.display='none'; if(!state.minimized.includes(id)) state.minimized.push(id); addWindowChip(id,w.dataset.title||'Window'); updateBadges(); toast('Minimized to Dock'); }
  function restoreWindow(id){ const w=qs('#'+id); if(!w) return; w.style.display='block'; removeDockWindow(id); state.minimized=state.minimized.filter(x=>x!==id); bringFront(w); updateBadges(); }
  function addWindowChip(id,title){ const dock=ensureDock(); if(qs('#v403Chip_'+id)) return; const b=dockButton('chip_'+id,'📄',title,()=>restoreWindow(id),'v403-window-chip active'); b.id='v403Chip_'+id; b.dataset.windowId=id; b.draggable=true; b.addEventListener('dragstart',e=>{ e.dataTransfer.setData('text/plain', title); e.dataTransfer.setData('text/html', '<b>'+esc(title)+'</b>'); }); dock.appendChild(b); }
  function removeDockWindow(id){ const chip=qs('#v403Chip_'+id); if(chip) chip.remove(); }

  function openHome(){ if(clickText(['back','dashboard'])) return; if(typeof window.showDashboard==='function') return window.showDashboard(); window.scrollTo({top:0,behavior:'smooth'}); }
  function openOrders(){ if(typeof window.openEntryModal==='function') return window.openEntryModal('order'); if(clickText(['new','order'])) return; clickText(['order']); }
  function openDN(){ if(typeof window.openEntryModal==='function') return window.openEntryModal('delivery_note'); if(clickText(['delivery','note'])) return; }
  function openInvoice(){ if(typeof window.openEntryModal==='function') return window.openEntryModal('invoice'); if(clickText(['invoice'])) return; }
  function openCredit(){ if(typeof window.openCreditNoteModal==='function') return window.openCreditNoteModal(); clickText(['credit','note']); }
  function openApprovals(){ if(typeof window.showPendingApprovalOrdersV375==='function') return window.showPendingApprovalOrdersV375(true); if(typeof window.showPendingApprovalOrdersV372==='function') return window.showPendingApprovalOrdersV372(true); clickText(['approvals']); }
  function openLive(){ if(typeof window.v401ToggleLiveNotifications==='function') return window.v401ToggleLiveNotifications(); const b=qs('#v395NotifButton'); if(b) b.click(); else createWindow('v403LiveWindow','Live Notifications', '<div class="v403-muted">No new notifications.</div>', {icon:'🟢'}); }
  function sync(){ if(typeof window.syncFromCloud==='function') return window.syncFromCloud(); if(typeof window.v391RealSyncFromCloud==='function') return window.v391RealSyncFromCloud(); if(typeof window.manualRefresh==='function') return window.manualRefresh(); location.reload(); }
  function search(){ const input=qs('input[placeholder*="Search"],input[id*="search" i],input[type="search"]'); if(input){ input.scrollIntoView({block:'center',behavior:'smooth'}); input.focus(); } else createWindow('v403SearchWindow','Search','<div class="v403-row"><input style="flex:1;padding:12px;border-radius:12px;background:#111;color:#fff;border:1px solid rgba(246,219,173,.25)" placeholder="Search..." autofocus></div>',{icon:'🔍'}); }
  function settings(){ if(clickText(['manage','lists'])) return; if(clickText(['settings'])) return; createWindow('v403SettingsWindow','Settings','<div class="v403-muted">Use existing Manage Lists / Settings from the system.</div>',{icon:'⚙️'}); }

  function openReports(){
    const html=`<div class="v403-grid"><div class="v403-card" data-action="monthly"><strong>📊 Monthly Report</strong><small>Open monthly dashboard / report first.</small></div><div class="v403-card" data-action="supplier"><strong>🏢 Supplier Report</strong><small>Supplier card and aging.</small></div><div class="v403-card" data-action="project"><strong>🏗️ Project Report</strong><small>Project totals and activity.</small></div><div class="v403-card" data-action="export"><strong>📄 Active Document</strong><small>Create draggable report item in Dock.</small></div></div><hr style="border-color:rgba(255,255,255,.1)"><div class="v403-muted">Default is Monthly Report, not Supplier Report. You can minimize this window to the dock and restore it later.</div>`;
    const w=createWindow('v403ReportsWindow','Reports Workspace',html,{icon:'📊'});
    w.querySelector('[data-action="monthly"]').onclick=()=>{ if(clickText(['monthly','report'])) return; if(clickText(['this','month'])) return; toast('Monthly Report opened'); };
    w.querySelector('[data-action="supplier"]').onclick=()=>{ if(clickText(['supplier','report'])) return; toast('Supplier Report opened'); };
    w.querySelector('[data-action="project"]').onclick=()=>{ if(clickText(['project','report'])) return; toast('Project Report opened'); };
    w.querySelector('[data-action="export"]').onclick=()=>createActiveDocument('Monthly Report','📊');
  }
  function createActiveDocument(title,icon){
    const id='v403Doc_'+Date.now();
    const html=`<div class="v403-doc" draggable="true"><div><strong>${esc(icon||'📄')} ${esc(title)}</strong><div class="v403-muted">Drag this item to mail/body fields or restore it from Dock.</div></div><span class="v403-pill">Drag ready</span></div><div class="v403-row"><button class="v403-btn" data-min>Minimize to Dock</button><button class="v403-btn dark" data-copy>Copy title</button></div>`;
    const w=createWindow(id,title,html,{icon:icon||'📄', top:'92px'});
    const doc=w.querySelector('.v403-doc');
    doc.addEventListener('dragstart',e=>{ e.dataTransfer.setData('text/plain', title); e.dataTransfer.setData('text/html','<b>'+esc(title)+'</b>'); });
    w.querySelector('[data-min]').onclick=()=>minimizeWindow(id);
    w.querySelector('[data-copy]').onclick=()=>{ navigator.clipboard?.writeText(title); toast('Copied'); };
    minimizeWindow(id);
  }
  function openDocuments(){
    const active=state.minimized.map(id=>`<div class="v403-doc" draggable="true" data-id="${esc(id)}"><span>📄 ${esc(qs('#'+id)?.dataset.title||id)}</span><button class="v403-btn dark" data-restore="${esc(id)}">Restore</button></div>`).join('') || '<div class="v403-muted">No minimized windows or active documents yet.</div>';
    const w=createWindow('v403DocumentsWindow','Active Workspace Documents',active+'<div class="v403-row" style="margin-top:10px"><button class="v403-btn" id="v403NewMonthlyDoc">Create Monthly Report Item</button></div>',{icon:'📄'});
    w.querySelectorAll('[data-restore]').forEach(b=>b.onclick=()=>restoreWindow(b.dataset.restore));
    w.querySelectorAll('.v403-doc[draggable="true"]').forEach(el=>el.addEventListener('dragstart',e=>{ e.dataTransfer.setData('text/plain',el.textContent.trim()); }));
    const btn=w.querySelector('#v403NewMonthlyDoc'); if(btn) btn.onclick=()=>createActiveDocument('Monthly Report','📊');
  }

  window.v403OpenWorkspaceWindow=createWindow;
  window.v403MinimizeWindow=minimizeWindow;
  window.v403RestoreWindow=restoreWindow;
  window.v403CreateActiveDocument=createActiveDocument;
  window.v403UpdateDockBadges=updateBadges;
  function boot(){ ensureDock(); console.log(VERSION,'loaded'); }
  window.addEventListener('load',()=>setTimeout(boot,900));
  document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,700));
  setTimeout(boot,2200);
})();
