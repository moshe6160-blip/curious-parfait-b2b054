(function(){
  'use strict';
  const VERSION='V406_GEMINI_WINDOW_POLISH_FROM_V404';
  let zTop=2147482400;

  function qs(s,root){return (root||document).querySelector(s)}
  function qsa(s,root){return Array.from((root||document).querySelectorAll(s))}
  function titleOf(box){return (qs('h3,.section-title,.title',box)?.textContent||'Window').trim()||'Window'}
  function toast(msg){try{ if(typeof window.showToast==='function') return window.showToast(msg); }catch(e){} console.log('[V406]',msg)}

  function inject(){
    if(qs('#v406GeminiWindowStyle')) return;
    const st=document.createElement('style'); st.id='v406GeminiWindowStyle';
    st.textContent=`
/* V406 Gemini/Mac window polish - UI only */
:root{--v406-gold:#f4d19c;--v406-gold2:#b98548;--v406-bg:rgba(12,13,16,.88)}
.modal.show .modal-box,.modal-box.v406-window-ready{animation:v406GeminiOpen .24s cubic-bezier(.16,.9,.22,1.08);will-change:transform,opacity,filter}
@keyframes v406GeminiOpen{0%{opacity:0;transform:translateY(22px) scale(.975);filter:blur(12px) saturate(.8)}62%{opacity:1;transform:translateY(-2px) scale(1.006);filter:blur(1px) saturate(1.08)}100%{opacity:1;filter:blur(0)}}
.modal.show{background:rgba(0,0,0,.16)!important;backdrop-filter:blur(5px)!important;-webkit-backdrop-filter:blur(5px)!important}
.modal.show .modal-box{position:fixed!important;left:50%;top:64px;transform:translateX(-50%);max-height:calc(100vh - 118px)!important;overflow:auto!important;border-radius:25px!important;box-shadow:0 26px 80px rgba(0,0,0,.58),0 0 0 1px rgba(244,209,156,.18),inset 0 1px 0 rgba(255,255,255,.08)!important;backdrop-filter:blur(24px)!important;-webkit-backdrop-filter:blur(24px)!important}
.modal.show .modal-box.v406-dragging{opacity:.96;user-select:none;transition:none!important}
.window-bar,.modal-box .window-bar{display:flex!important;gap:9px!important;align-items:center!important;margin-bottom:14px!important;height:18px!important;cursor:grab!important;user-select:none!important}
.window-bar:active{cursor:grabbing!important}
.window-btn,.modal-box .window-btn{width:13px!important;height:13px!important;min-width:13px!important;min-height:13px!important;border-radius:999px!important;padding:0!important;border:0!important;font-size:0!important;line-height:0!important;box-shadow:inset 0 0 0 1px rgba(0,0,0,.22),0 1px 5px rgba(0,0,0,.28)!important;opacity:.96!important;cursor:pointer!important;transition:transform .13s ease,filter .13s ease!important}
.window-btn:hover{transform:scale(1.18)!important;filter:brightness(1.15)!important}.window-btn.red{background:#ff5f57!important}.window-btn.yellow{background:#febc2e!important}.window-btn.green{background:#28c840!important}
.v406-fullscreen{left:8px!important;top:8px!important;transform:none!important;width:calc(100vw - 16px)!important;max-width:calc(100vw - 16px)!important;height:calc(100vh - 24px)!important;max-height:calc(100vh - 24px)!important}
.v406-fullscreen .modal-head{position:sticky;top:0;z-index:3;background:rgba(12,13,16,.82);backdrop-filter:blur(14px)}
#v403Dock{background:rgba(10,10,12,.72)!important;border:1px solid rgba(244,209,156,.24)!important;box-shadow:0 22px 70px rgba(0,0,0,.52),inset 0 1px 0 rgba(255,255,255,.08)!important;backdrop-filter:blur(28px)!important;-webkit-backdrop-filter:blur(28px)!important;transition:transform .24s ease,opacity .2s ease!important}
#v403Dock .v403-dock-item,.v406-dock-chip{transition:transform .16s ease,filter .16s ease!important}
#v403Dock .v403-dock-item:hover,.v406-dock-chip:hover{transform:translateY(-8px) scale(1.14)!important;filter:brightness(1.18)!important}
.v406-dock-chip{position:relative;min-width:48px;height:48px;border:0;border-radius:17px;background:linear-gradient(180deg,rgba(244,209,156,.18),rgba(255,255,255,.06));color:#fff;font-size:13px;display:flex;align-items:center;justify-content:center;padding:0 10px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);cursor:pointer}.v406-dock-chip:before{content:'🪟';margin-right:5px}
#v406DockHide{position:fixed;right:12px;bottom:calc(78px + env(safe-area-inset-bottom,0px));z-index:2147482800;border:1px solid rgba(244,209,156,.25);background:rgba(10,10,12,.76);color:#f4d19c;border-radius:999px;padding:7px 10px;font:900 12px -apple-system,BlinkMacSystemFont,Segoe UI,Arial;box-shadow:0 10px 28px rgba(0,0,0,.38);backdrop-filter:blur(18px)}
body.v406-dock-hidden #v403Dock{transform:translateX(-50%) translateY(calc(100% + 24px))!important;opacity:.08!important;pointer-events:none!important}body.v406-dock-hidden{padding-bottom:12px!important}body.v406-dock-hidden #v406DockHide{bottom:calc(12px + env(safe-area-inset-bottom,0px))}
@media(max-width:680px){.modal.show .modal-box{left:8px!important;right:8px!important;top:54px!important;transform:none!important;width:auto!important;max-width:calc(100vw - 16px)!important}.window-btn{width:14px!important;height:14px!important}}
    `;
    document.head.appendChild(st);
  }

  function ensureDock(){
    let dock=qs('#v403Dock');
    if(!dock){
      dock=document.createElement('div'); dock.id='v403Dock'; dock.setAttribute('aria-label','Workspace Dock');
      document.body.appendChild(dock);
    }
    ensureDockHide();
    return dock;
  }
  function ensureDockHide(){
    if(qs('#v406DockHide')) return;
    const b=document.createElement('button'); b.id='v406DockHide'; b.type='button';
    const set=()=>{ b.textContent=document.body.classList.contains('v406-dock-hidden')?'⌃ Dock':'⌄ Dock'; };
    b.onclick=()=>{ document.body.classList.toggle('v406-dock-hidden'); localStorage.setItem('v406_dock_hidden',document.body.classList.contains('v406-dock-hidden')?'1':'0'); set(); };
    document.body.appendChild(b);
    if(localStorage.getItem('v406_dock_hidden')==='1') document.body.classList.add('v406-dock-hidden');
    set();
  }

  function minimizeBox(box,modal){
    const id=box.dataset.v406Id || ('v406win_'+Math.random().toString(36).slice(2,9));
    box.dataset.v406Id=id;
    const title=titleOf(box);
    if(modal){ modal.classList.remove('show'); modal.style.display='none'; }
    else box.style.display='none';
    const dock=ensureDock();
    let chip=qs('#dock_'+id);
    if(!chip){
      chip=document.createElement('button'); chip.type='button'; chip.id='dock_'+id; chip.className='v406-dock-chip'; chip.textContent=title; chip.title='Restore '+title;
      chip.onclick=()=>{ if(modal){ modal.style.display=''; modal.classList.add('show'); } box.style.display=''; box.classList.add('v406-window-ready'); bringFront(box); chip.remove(); setTimeout(()=>box.classList.remove('v406-window-ready'),320); };
      chip.draggable=true;
      chip.addEventListener('dragstart',e=>{ e.dataTransfer.setData('text/plain',title); });
      dock.appendChild(chip);
    }
    toast('Window moved to Dock');
  }
  function closeBox(box,modal){ if(modal){ modal.classList.remove('show'); modal.style.display=''; } else box.style.display='none'; }
  function toggleFull(box){
    if(!box.dataset.v406Prev){ box.dataset.v406Prev=JSON.stringify({left:box.style.left,top:box.style.top,transform:box.style.transform,width:box.style.width,height:box.style.height,maxWidth:box.style.maxWidth}); box.classList.add('v406-fullscreen'); }
    else { try{ const p=JSON.parse(box.dataset.v406Prev); Object.assign(box.style,p); }catch(e){} box.classList.remove('v406-fullscreen'); delete box.dataset.v406Prev; }
    bringFront(box);
  }
  function bringFront(box){ box.style.zIndex=String(++zTop); }

  function makeDraggable(box){
    if(box.dataset.v406Drag==='1') return; box.dataset.v406Drag='1';
    const bar=qs('.window-bar',box)||qs('.modal-head',box)||box;
    let dragging=false,sx=0,sy=0,ox=0,oy=0;
    bar.addEventListener('pointerdown',e=>{ if(e.target.closest('button,input,select,textarea')) return; dragging=true; bringFront(box); box.classList.add('v406-dragging'); const r=box.getBoundingClientRect(); sx=e.clientX; sy=e.clientY; ox=r.left; oy=r.top; box.style.transform='none'; box.style.left=ox+'px'; box.style.top=oy+'px'; try{bar.setPointerCapture(e.pointerId)}catch(_e){} });
    bar.addEventListener('pointermove',e=>{ if(!dragging) return; const nx=Math.max(4,Math.min(window.innerWidth-70,ox+(e.clientX-sx))); const ny=Math.max(4,Math.min(window.innerHeight-80,oy+(e.clientY-sy))); box.style.left=nx+'px'; box.style.top=ny+'px'; });
    bar.addEventListener('pointerup',e=>{ dragging=false; box.classList.remove('v406-dragging'); try{bar.releasePointerCapture(e.pointerId)}catch(_e){} });
  }

  function enhanceBox(box){
    if(!box || box.dataset.v406Enhanced==='1') return;
    box.dataset.v406Enhanced='1'; box.classList.add('v406-window-ready'); makeDraggable(box);
    const bar=qs('.window-bar',box);
    if(bar){
      const red=qs('.window-btn.red',bar), yellow=qs('.window-btn.yellow',bar), green=qs('.window-btn.green',bar);
      const modal=box.closest('.modal');
      if(red) red.onclick=(e)=>{e.preventDefault();e.stopPropagation();closeBox(box,modal)};
      if(yellow) yellow.onclick=(e)=>{e.preventDefault();e.stopPropagation();minimizeBox(box,modal)};
      if(green) green.onclick=(e)=>{e.preventDefault();e.stopPropagation();toggleFull(box)};
    }
    setTimeout(()=>box.classList.remove('v406-window-ready'),360);
  }
  function enhanceAll(){ inject(); ensureDock(); qsa('.modal-box,.v403-workspace-window').forEach(enhanceBox); }

  // Override old compact action to use the real Dock, not missing windowDock.
  window.windowAction=function(ev,action){
    if(ev){ev.preventDefault();ev.stopPropagation();}
    const box=ev?.target?.closest?.('.modal-box,.card,.panel,.login-card,.v403-workspace-window'); if(!box) return;
    const modal=ev?.target?.closest?.('.modal');
    if(action==='close') return closeBox(box,modal);
    if(action==='compact') return minimizeBox(box,modal);
    if(action==='maximize') return toggleFull(box);
  };

  function boot(){ enhanceAll(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.addEventListener('load',()=>setTimeout(boot,60));
  const mo=new MutationObserver(()=>{ requestAnimationFrame(enhanceAll); });
  mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
  console.log(VERSION,'loaded');
})();
