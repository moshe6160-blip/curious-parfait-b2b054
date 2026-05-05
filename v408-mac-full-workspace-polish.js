(function(){
  'use strict';
  const VERSION='V408_MAC_FULL_WORKSPACE_POLISH_FROM_V406';
  let zTop=2147483000;
  const minimized = new Map();
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));

  function toast(msg){ try{ if(typeof window.showToast==='function') return window.showToast(msg); }catch(e){} }

  function injectStyle(){
    if(qs('#v408WorkspaceStyle')) return;
    const st=document.createElement('style'); st.id='v408WorkspaceStyle';
    st.textContent=`
/* V408 Mac Full Workspace polish - safe UI only */
:root{--v408-gold:#f6d8a8;--v408-gold2:#c08b4f;--v408-glass:rgba(11,12,15,.78)}
/* One Dock only */
#v401MacDock,#windowDock,.windowDock,.dock-old,.floating-dock{display:none!important;visibility:hidden!important;pointer-events:none!important}
#v403Dock{position:fixed!important;left:50%!important;right:auto!important;bottom:calc(10px + env(safe-area-inset-bottom,0px))!important;transform:translateX(-50%)!important;z-index:2147483600!important;display:flex!important;align-items:flex-end!important;gap:10px!important;padding:10px 13px!important;border-radius:26px!important;background:linear-gradient(180deg,rgba(25,26,30,.72),rgba(7,8,10,.82))!important;border:1px solid rgba(246,216,168,.28)!important;box-shadow:0 22px 70px rgba(0,0,0,.58),inset 0 1px 0 rgba(255,255,255,.10)!important;backdrop-filter:blur(30px) saturate(1.18)!important;-webkit-backdrop-filter:blur(30px) saturate(1.18)!important;max-width:calc(100vw - 20px)!important;overflow-x:auto!important;direction:ltr!important;scrollbar-width:none!important;transition:transform .28s cubic-bezier(.2,.9,.15,1),opacity .22s ease!important}
#v403Dock::-webkit-scrollbar{display:none!important}
#v403Dock .v403-dock-item,#v403Dock .v408-window-chip,#v403Dock .v406-dock-chip{position:relative!important;min-width:50px!important;height:50px!important;border:0!important;border-radius:18px!important;background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.045))!important;color:#fff!important;font-size:22px!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.09),0 8px 20px rgba(0,0,0,.18)!important;transition:transform .16s cubic-bezier(.2,.9,.2,1.35),filter .16s ease,background .16s ease!important;flex:0 0 auto!important;padding:0 10px!important;white-space:nowrap!important;max-width:132px!important;overflow:hidden!important;text-overflow:ellipsis!important}
#v403Dock .v403-dock-item:hover,#v403Dock .v403-dock-item:active,#v403Dock .v408-window-chip:hover,#v403Dock .v406-dock-chip:hover{transform:translateY(-10px) scale(1.18)!important;filter:brightness(1.25)!important}
#v403Dock .v403-dock-item.gold{background:linear-gradient(135deg,#ffe5b8,#c08b4f)!important;color:#111!important}
#v403Dock .v403-dock-sep{width:1px!important;height:44px!important;background:rgba(255,255,255,.16)!important;margin:0 2px!important;flex:0 0 1px!important}
.v408-window-chip:before{content:'🪟';margin-inline-end:6px}.v408-window-chip[data-kind="order"]:before{content:'📦'}.v408-window-chip[data-kind="dn"]:before{content:'🚚'}.v408-window-chip[data-kind="invoice"]:before{content:'🧾'}.v408-window-chip[data-kind="approvals"]:before{content:'🔔'}
#v408DockToggle{position:fixed;right:12px;bottom:calc(78px + env(safe-area-inset-bottom,0px));z-index:2147483700;width:42px;height:42px;border-radius:999px;border:1px solid rgba(246,216,168,.28);background:rgba(10,11,14,.78);color:var(--v408-gold);font:900 18px -apple-system,BlinkMacSystemFont,Segoe UI,Arial;box-shadow:0 12px 34px rgba(0,0,0,.42);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
body.v408-dock-hidden #v403Dock{transform:translateX(-50%) translateY(calc(100% + 26px))!important;opacity:.07!important;pointer-events:none!important}body.v408-dock-hidden #v408DockToggle{bottom:calc(12px + env(safe-area-inset-bottom,0px))!important}
/* Gemini/Mac window animation */
.modal.show .modal-box,.v408-window-ready{animation:v408GeminiMagic .22s cubic-bezier(.17,.95,.23,1.10)!important;will-change:transform,opacity,filter!important}
@keyframes v408GeminiMagic{0%{opacity:0;transform:translateY(28px) scale(.965);filter:blur(18px) saturate(.75)}55%{opacity:1;transform:translateY(-4px) scale(1.01);filter:blur(2px) saturate(1.15)}100%{opacity:1;filter:blur(0)}}
.modal.show{background:rgba(0,0,0,.13)!important;backdrop-filter:blur(5px)!important;-webkit-backdrop-filter:blur(5px)!important}
.modal.show .modal-box{position:fixed!important;left:50%;top:62px;transform:translateX(-50%);max-height:calc(100vh - 118px)!important;overflow:auto!important;border-radius:26px!important;box-shadow:0 30px 90px rgba(0,0,0,.62),0 0 0 1px rgba(246,216,168,.22),inset 0 1px 0 rgba(255,255,255,.08)!important;backdrop-filter:blur(26px) saturate(1.10)!important;-webkit-backdrop-filter:blur(26px) saturate(1.10)!important}
.modal-box.v408-dragging,.v403-workspace-window.v408-dragging{opacity:.965!important;user-select:none!important;transition:none!important}
/* Mac traffic-light buttons only */
.window-bar,.v408-window-bar{display:flex!important;gap:9px!important;align-items:center!important;margin:0 0 13px 0!important;height:18px!important;cursor:grab!important;user-select:none!important}.window-bar:active,.v408-window-bar:active{cursor:grabbing!important}
.window-btn,.v408-window-btn{width:13px!important;height:13px!important;min-width:13px!important;min-height:13px!important;border-radius:999px!important;padding:0!important;border:0!important;font-size:0!important;line-height:0!important;color:transparent!important;overflow:hidden!important;box-shadow:inset 0 0 0 1px rgba(0,0,0,.25),0 1px 5px rgba(0,0,0,.30)!important;opacity:.98!important;cursor:pointer!important;transition:transform .13s ease,filter .13s ease!important}
.window-btn:hover,.v408-window-btn:hover{transform:scale(1.18)!important;filter:brightness(1.15)!important}.window-btn.red,.v408-window-btn.red{background:#ff5f57!important}.window-btn.yellow,.v408-window-btn.yellow{background:#febc2e!important}.window-btn.green,.v408-window-btn.green{background:#28c840!important}
/* Hide old textual window controls in headers only */
.v408-hide-old-control{display:none!important;visibility:hidden!important;pointer-events:none!important}
.v408-fullscreen{left:8px!important;top:8px!important;transform:none!important;width:calc(100vw - 16px)!important;max-width:calc(100vw - 16px)!important;height:calc(100vh - 24px)!important;max-height:calc(100vh - 24px)!important}
.v408-fullscreen .modal-head{position:sticky!important;top:0!important;z-index:3!important;background:rgba(12,13,16,.84)!important;backdrop-filter:blur(14px)!important}
@media(max-width:680px){#v403Dock{gap:7px!important;padding:8px 10px!important;border-radius:23px!important}.v403-dock-item,.v408-window-chip{min-width:44px!important;height:44px!important;font-size:20px!important;border-radius:16px!important}.modal.show .modal-box{left:8px!important;right:8px!important;top:54px!important;transform:none!important;width:auto!important;max-width:calc(100vw - 16px)!important}.window-btn,.v408-window-btn{width:14px!important;height:14px!important}}
    `;
    document.head.appendChild(st);
  }

  function ensureDock(){
    // kill duplicate V401 dock if it appears after load
    qsa('#v401MacDock,#windowDock').forEach(el=>{ try{ el.remove(); }catch(e){ el.style.display='none'; } });
    let dock=qs('#v403Dock');
    if(!dock){ dock=document.createElement('div'); dock.id='v403Dock'; dock.setAttribute('aria-label','Vardophase Mac Dock'); document.body.appendChild(dock); }
    ensureDockToggle();
    return dock;
  }
  function ensureDockToggle(){
    if(qs('#v408DockToggle')) return;
    const b=document.createElement('button'); b.id='v408DockToggle'; b.type='button'; b.title='Hide / show Dock';
    const set=()=>{ b.textContent=document.body.classList.contains('v408-dock-hidden')?'⌃':'⌄'; };
    b.onclick=()=>{ document.body.classList.toggle('v408-dock-hidden'); localStorage.setItem('v408_dock_hidden',document.body.classList.contains('v408-dock-hidden')?'1':'0'); set(); };
    document.body.appendChild(b); if(localStorage.getItem('v408_dock_hidden')==='1') document.body.classList.add('v408-dock-hidden'); set();
  }
  function titleOf(box){
    const t=(qs('h1,h2,h3,.section-title,.title,.modal-title',box)?.textContent||box.getAttribute('data-title')||'Window').trim();
    if(/new order/i.test(t)) return 'Order';
    if(/delivery/i.test(t)) return 'DN';
    if(/invoice/i.test(t)) return 'Invoice';
    if(/approval/i.test(t)) return 'Approvals';
    return t || 'Window';
  }
  function kindOf(box){ const t=titleOf(box).toLowerCase(); if(t.includes('order')) return 'order'; if(t.includes('dn')||t.includes('delivery')) return 'dn'; if(t.includes('invoice')) return 'invoice'; if(t.includes('approval')) return 'approvals'; return 'window'; }
  function bringFront(box){ box.style.zIndex=String(++zTop); }

  function addControls(box){
    if(qs('.v408-window-bar',box)) return qs('.v408-window-bar',box);
    let bar=qs('.window-bar',box);
    if(!bar){
      bar=document.createElement('div'); bar.className='v408-window-bar';
      bar.innerHTML='<button class="v408-window-btn red" data-v408-action="close" title="Close"></button><button class="v408-window-btn yellow" data-v408-action="minimize" title="Minimize to Dock"></button><button class="v408-window-btn green" data-v408-action="fullscreen" title="Full screen"></button>';
      const head=qs('.modal-head,.window-header,.v403-window-header',box);
      if(head) head.prepend(bar); else box.prepend(bar);
    } else {
      bar.classList.add('v408-window-bar');
      // ensure exactly three circle buttons and no text
      const buttons=qsa('button',bar);
      if(buttons.length<3){
        bar.innerHTML='<button class="v408-window-btn red" data-v408-action="close" title="Close"></button><button class="v408-window-btn yellow" data-v408-action="minimize" title="Minimize to Dock"></button><button class="v408-window-btn green" data-v408-action="fullscreen" title="Full screen"></button>';
      } else {
        buttons[0].classList.add('v408-window-btn','red'); buttons[0].dataset.v408Action='close';
        buttons[1].classList.add('v408-window-btn','yellow'); buttons[1].dataset.v408Action='minimize';
        buttons[2].classList.add('v408-window-btn','green'); buttons[2].dataset.v408Action='fullscreen';
        buttons.slice(3).forEach(b=>b.classList.add('v408-hide-old-control'));
      }
    }
    // hide old text controls near the window header (Close / Dock only)
    qsa('button', box).forEach(btn=>{
      if(btn.closest('.v408-window-bar,.window-bar')) return;
      const txt=(btn.textContent||'').trim().toLowerCase();
      const inHead=!!btn.closest('.modal-head,.window-header,.v403-window-header') || box.firstElementChild?.contains(btn);
      if(inHead && (txt==='close' || txt==='—dock' || txt==='-dock' || txt==='dock' || txt==='–dock')) btn.classList.add('v408-hide-old-control');
    });
    return bar;
  }

  function closeBox(box,modal){
    const id=box.dataset.v408Id; if(id) { const ch=qs('#v408Chip_'+id); if(ch) ch.remove(); minimized.delete(id); }
    if(modal){ modal.classList.remove('show'); modal.style.display='none'; }
    else box.style.display='none';
  }
  function minimizeBox(box,modal){
    const id=box.dataset.v408Id || ('v408win_'+Math.random().toString(36).slice(2,9)); box.dataset.v408Id=id;
    const title=titleOf(box); const kind=kindOf(box); ensureDock();
    minimized.set(id,{box,modal,title,kind});
    if(modal){ modal.classList.remove('show'); modal.style.display='none'; } else box.style.display='none';
    let chip=qs('#v408Chip_'+id);
    if(!chip){
      chip=document.createElement('button'); chip.type='button'; chip.id='v408Chip_'+id; chip.className='v408-window-chip'; chip.dataset.kind=kind; chip.title='Restore '+title; chip.textContent=title;
      chip.onclick=()=>restoreBox(id);
      chip.draggable=true; chip.addEventListener('dragstart',e=>{ e.dataTransfer.setData('text/plain',title); e.dataTransfer.setData('text/html','<b>'+title.replace(/[<>&]/g,'')+'</b>'); });
      ensureDock().appendChild(chip);
    }
    toast(title+' moved to Dock');
  }
  function restoreBox(id){
    const rec=minimized.get(id); if(!rec) return; const {box,modal}=rec;
    if(modal){ modal.style.display=''; modal.classList.add('show'); }
    box.style.display=''; box.classList.add('v408-window-ready'); bringFront(box); const chip=qs('#v408Chip_'+id); if(chip) chip.remove(); minimized.delete(id); setTimeout(()=>box.classList.remove('v408-window-ready'),300);
  }
  function toggleFull(box){
    if(!box.dataset.v408Prev){
      box.dataset.v408Prev=JSON.stringify({left:box.style.left,top:box.style.top,transform:box.style.transform,width:box.style.width,height:box.style.height,maxWidth:box.style.maxWidth,maxHeight:box.style.maxHeight});
      box.classList.add('v408-fullscreen');
    } else {
      try{ Object.assign(box.style,JSON.parse(box.dataset.v408Prev)); }catch(e){}
      box.classList.remove('v408-fullscreen'); delete box.dataset.v408Prev;
    }
    bringFront(box);
  }

  function makeDraggable(box){
    if(box.dataset.v408Drag==='1') return; box.dataset.v408Drag='1';
    const handle=qs('.v408-window-bar,.window-bar,.modal-head,.window-header,.v403-window-header',box)||box;
    let dragging=false,sx=0,sy=0,ox=0,oy=0;
    handle.addEventListener('pointerdown',e=>{
      if(e.target.closest('button,input,select,textarea,a')) return;
      dragging=true; bringFront(box); box.classList.add('v408-dragging');
      const r=box.getBoundingClientRect(); sx=e.clientX; sy=e.clientY; ox=r.left; oy=r.top;
      box.style.transform='none'; box.style.left=ox+'px'; box.style.top=oy+'px'; box.style.right='auto';
      try{ handle.setPointerCapture(e.pointerId); }catch(_e){}
    });
    handle.addEventListener('pointermove',e=>{
      if(!dragging) return;
      const nx=Math.max(4, Math.min(window.innerWidth-80, ox+(e.clientX-sx)));
      const ny=Math.max(4, Math.min(window.innerHeight-80, oy+(e.clientY-sy)));
      box.style.left=nx+'px'; box.style.top=ny+'px';
    });
    handle.addEventListener('pointerup',e=>{ dragging=false; box.classList.remove('v408-dragging'); try{handle.releasePointerCapture(e.pointerId)}catch(_e){} });
  }

  function enhanceBox(box){
    if(!box || box.closest('.login-card,.login-form,#loginScreen')) return;
    if(box.dataset.v408Enhanced==='1') return;
    box.dataset.v408Enhanced='1'; box.classList.add('v408-window-ready');
    addControls(box); makeDraggable(box); bringFront(box);
    box.addEventListener('click',e=>{
      const b=e.target.closest('[data-v408-action],.window-btn,.v408-window-btn'); if(!b) return;
      e.preventDefault(); e.stopPropagation();
      const modal=box.closest('.modal'); const action=b.dataset.v408Action || (b.classList.contains('red')?'close':b.classList.contains('yellow')?'minimize':'fullscreen');
      if(action==='close') closeBox(box,modal); else if(action==='minimize') minimizeBox(box,modal); else toggleFull(box);
    }, true);
    setTimeout(()=>box.classList.remove('v408-window-ready'),320);
  }

  function enhanceAll(){
    injectStyle(); ensureDock();
    qsa('#v401MacDock,#windowDock').forEach(el=>{ try{el.remove()}catch(e){el.style.display='none'} });
    qsa('.modal-box,.v403-workspace-window').forEach(enhanceBox);
  }

  // Make existing windowAction route to the good implementation.
  window.windowAction=function(ev,action){
    if(ev){ev.preventDefault();ev.stopPropagation();}
    const box=ev?.target?.closest?.('.modal-box,.v403-workspace-window,.panel,.card'); if(!box) return;
    if(box.closest('.login-card,.login-form,#loginScreen')) return;
    const modal=ev?.target?.closest?.('.modal');
    if(action==='close') closeBox(box,modal);
    else if(action==='compact' || action==='minimize') minimizeBox(box,modal);
    else if(action==='maximize' || action==='fullscreen') toggleFull(box);
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',enhanceAll); else enhanceAll();
  window.addEventListener('load',()=>setTimeout(enhanceAll,80));
  new MutationObserver(()=>requestAnimationFrame(enhanceAll)).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
  console.log(VERSION,'loaded');
})();
