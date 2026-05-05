
/* V416 SAFE REAL MAC FEEL
   Fixes existing windowAction + connects minimized windows to the existing V401 dock.
   No login / Supabase / Push / Realtime changes.
   No setInterval. No reload.
*/
(function(){
  'use strict';
  if(window.__V416_SAFE_MAC_FEEL__) return;
  window.__V416_SAFE_MAC_FEEL__ = true;

  function ensureStyle(){
    if(document.getElementById('v416SafeMacStyle')) return;
    const style = document.createElement('style');
    style.id = 'v416SafeMacStyle';
    style.textContent = `
/* ---- V416 safe Mac polish ---- */
body{scroll-behavior:smooth}

/* keep exactly one main dock visible */
#v401MacDock{
  display:flex!important;
  opacity:1!important;
  visibility:visible!important;
  transform:translateX(-50%) translateY(0)!important;
  background:rgba(14,15,18,.70)!important;
  border:1px solid rgba(246,219,173,.26)!important;
  box-shadow:0 20px 60px rgba(0,0,0,.48), inset 0 1px 0 rgba(255,255,255,.10)!important;
  backdrop-filter:blur(24px)!important;
  -webkit-backdrop-filter:blur(24px)!important;
}

#v401MacDock.v416-dock-hidden{
  transform:translateX(-50%) translateY(86px)!important;
  opacity:.18!important;
}

.v401-dock-item{
  transition:transform .14s cubic-bezier(.2,.8,.2,1), filter .14s ease, background .14s ease!important;
  will-change:transform;
}
.v401-dock-item:hover,
.v401-dock-item:active{
  transform:translateY(-8px) scale(1.14)!important;
  filter:brightness(1.18)!important;
}

/* hide older duplicate floating indicators only */
#windowDock,
#dockFloatingButton,
.workspace-floating-dock,
.floating-dock,
.live-floating,
.floating-live,
#liveFloatingButton{
  display:none!important;
}

#v416DockToggle{
  position:fixed;
  right:14px;
  bottom:calc(18px + env(safe-area-inset-bottom,0px));
  z-index:1000030;
  width:34px;
  height:34px;
  border-radius:999px;
  border:1px solid rgba(246,219,173,.32);
  background:rgba(14,15,18,.76);
  color:#f6dbad;
  box-shadow:0 10px 30px rgba(0,0,0,.35);
  backdrop-filter:blur(18px);
  -webkit-backdrop-filter:blur(18px);
  font-weight:900;
}

/* Gemini-like modal open. Lightweight. */
.modal.show .modal-box,
.modal-box.v416-focus-pop,
.panel.v416-focus-pop,
.card.v416-focus-pop{
  animation:v416GeminiOpen .18s cubic-bezier(.2,.8,.2,1) both;
  will-change:transform,opacity,filter;
}
@keyframes v416GeminiOpen{
  0%{opacity:0;transform:translateY(16px) scale(.972);filter:blur(8px)}
  100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}
}

.modal-box,.panel,.card{
  transition:box-shadow .16s ease, transform .16s ease;
}

.modal-box.v416-drag-ready,
.panel.v416-drag-ready,
.card.v416-drag-ready{
  position:relative;
}

.modal-box.v416-floating,
.panel.v416-floating,
.card.v416-floating{
  position:fixed!important;
  margin:0!important;
  z-index:1000010!important;
}

/* Mac traffic light buttons */
.window-bar{
  display:flex!important;
  gap:8px!important;
  align-items:center!important;
  cursor:grab;
  user-select:none;
  touch-action:none;
}
.window-bar:active{cursor:grabbing}

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
  box-shadow:0 1px 3px rgba(0,0,0,.38), inset 0 1px 1px rgba(255,255,255,.45)!important;
}
.window-btn.red{background:#ff5f57!important}
.window-btn.yellow{background:#ffbd2e!important}
.window-btn.green{background:#28c840!important}

.v416-window-dock-item{
  min-width:48px!important;
  height:48px!important;
  border-radius:17px!important;
  background:linear-gradient(180deg,rgba(246,219,173,.20),rgba(246,219,173,.07))!important;
  border:1px solid rgba(246,219,173,.24)!important;
  color:#fff!important;
  font-size:20px!important;
}

.v416-window-dock-item .v416-title{
  display:none;
}

/* small title on desktop hover */
@media(min-width:900px){
  .v416-window-dock-item:hover::after{
    content:attr(title);
    position:absolute;
    bottom:58px;
    left:50%;
    transform:translateX(-50%);
    white-space:nowrap;
    background:rgba(15,16,20,.96);
    border:1px solid rgba(246,219,173,.25);
    color:#f8dcae;
    border-radius:10px;
    padding:5px 8px;
    font:800 11px -apple-system,BlinkMacSystemFont,Segoe UI,Arial;
  }
}
`;
    document.head.appendChild(style);
  }

  function ensureDock(){
    ensureStyle();

    let dock = document.getElementById('v401MacDock');
    if(!dock){
      dock = document.createElement('div');
      dock.id = 'v401MacDock';
      document.body.appendChild(dock);
    }

    if(!document.getElementById('v416DockToggle')){
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.id = 'v416DockToggle';
      toggle.title = 'Hide / show Dock';
      toggle.textContent = '⌄';
      toggle.addEventListener('click', function(){
        dock.classList.toggle('v416-dock-hidden');
        toggle.textContent = dock.classList.contains('v416-dock-hidden') ? '⌃' : '⌄';
      });
      document.body.appendChild(toggle);
    }

    return dock;
  }

  function titleFor(host){
    return (host.querySelector('.section-title,.title,h1,h2,h3,.modal-head h3')?.textContent || host.dataset.title || 'Window').trim();
  }

  function iconFor(title){
    const t = String(title||'').toLowerCase();
    if(t.includes('invoice')) return '🧾';
    if(t.includes('delivery') || t.includes('dn')) return '🚚';
    if(t.includes('credit')) return '💳';
    if(t.includes('approval')) return '🔔';
    if(t.includes('report')) return '📊';
    if(t.includes('order')) return '📦';
    if(t.includes('search')) return '🔍';
    return '🪟';
  }

  function addWindowToDock(host, modal){
    const dock = ensureDock();
    const title = titleFor(host);
    const id = host.dataset.windowId || ('w_' + Math.random().toString(36).slice(2,10));
    host.dataset.windowId = id;

    let item = dock.querySelector('[data-v416-window-id="'+id+'"]');
    if(item) return item;

    item = document.createElement('button');
    item.type = 'button';
    item.className = 'v401-dock-item v416-window-dock-item';
    item.dataset.v416WindowId = id;
    item.title = title;
    item.innerHTML = iconFor(title) + '<span class="v416-title">'+title+'</span>';
    item.addEventListener('click', function(){
      if(modal) modal.classList.add('show');
      host.style.display = '';
      host.classList.remove('v416-floating');
      host.classList.add('v416-focus-pop');
      setTimeout(()=>host.classList.remove('v416-focus-pop'), 220);
      item.remove();
    });
    dock.appendChild(item);
    return item;
  }

  function minimizeHost(host, modal){
    addWindowToDock(host, modal);
    host.style.display = 'none';
    if(modal) modal.classList.remove('show');
  }

  function closeHost(host, modal){
    const id = host.dataset.windowId;
    if(id){
      const item = document.querySelector('[data-v416-window-id="'+id+'"]');
      if(item) item.remove();
    }
    if(modal) modal.classList.remove('show');
    else host.style.display = 'none';
  }

  function maximizeHost(host){
    host.classList.toggle('maximized');
    host.classList.remove('compact');
  }

  // Override existing windowAction safely. This fixes the missing windowDock issue.
  window.windowAction = function(ev, action){
    if(ev){
      ev.preventDefault();
      ev.stopPropagation();
    }
    const target = ev?.target;
    const host = target?.closest?.('.modal-box, .card, .panel, .login-card');
    if(!host) return;
    const modal = target?.closest?.('.modal');

    if(action === 'close') return closeHost(host, modal);
    if(action === 'compact') return minimizeHost(host, modal);
    if(action === 'maximize') return maximizeHost(host);
  };

  function enhanceModalButtons(){
    document.querySelectorAll('.window-bar').forEach(bar=>{
      if(bar.dataset.v416Ready) return;
      bar.dataset.v416Ready = '1';

      const buttons = bar.querySelectorAll('.window-btn');
      if(buttons[0] && !buttons[0].dataset.v416Role){
        buttons[0].dataset.v416Role='close';
        buttons[0].title = 'Close';
      }
      if(buttons[1] && !buttons[1].dataset.v416Role){
        buttons[1].dataset.v416Role='dock';
        buttons[1].title = 'Minimize to Dock';
      }
      if(buttons[2] && !buttons[2].dataset.v416Role){
        buttons[2].dataset.v416Role='fullscreen';
        buttons[2].title = 'Full screen';
      }
    });
  }

  function makeExistingDraggable(){
    document.querySelectorAll('.modal-box,.panel,.card').forEach(host=>{
      if(host.dataset.v416DragReady) return;
      const handle = host.querySelector('.window-bar,.modal-head');
      if(!handle) return;

      host.dataset.v416DragReady = '1';
      host.classList.add('v416-drag-ready');

      let dragging=false, startX=0, startY=0, baseX=0, baseY=0, raf=0;

      function down(e){
        if(e.target.closest('button,input,select,textarea,a')) return;
        const point = e.touches ? e.touches[0] : e;
        dragging=true;
        const rect = host.getBoundingClientRect();

        host.classList.add('v416-floating');
        host.style.left = rect.left + 'px';
        host.style.top = rect.top + 'px';
        host.style.width = rect.width + 'px';

        startX = point.clientX;
        startY = point.clientY;
        baseX = rect.left;
        baseY = rect.top;

        document.addEventListener('mousemove', move, {passive:true});
        document.addEventListener('mouseup', up, {passive:true});
        document.addEventListener('touchmove', move, {passive:true});
        document.addEventListener('touchend', up, {passive:true});
      }

      function move(e){
        if(!dragging) return;
        const point = e.touches ? e.touches[0] : e;
        const nx = baseX + (point.clientX - startX);
        const ny = baseY + (point.clientY - startY);
        if(raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(()=>{
          host.style.left = Math.max(8, Math.min(window.innerWidth - 120, nx)) + 'px';
          host.style.top = Math.max(8, Math.min(window.innerHeight - 80, ny)) + 'px';
        });
      }

      function up(){
        dragging=false;
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
        document.removeEventListener('touchmove', move);
        document.removeEventListener('touchend', up);
      }

      handle.addEventListener('mousedown', down);
      handle.addEventListener('touchstart', down, {passive:true});
    });
  }

  function enhanceOpenAnimation(){
    document.querySelectorAll('.modal.show .modal-box').forEach(box=>{
      if(box.dataset.v416Animated) return;
      box.dataset.v416Animated = '1';
      box.classList.add('v416-focus-pop');
      setTimeout(()=>box.classList.remove('v416-focus-pop'), 240);
    });
  }

  function scan(){
    ensureDock();
    enhanceModalButtons();
    makeExistingDraggable();
    enhanceOpenAnimation();
  }

  function start(){
    scan();
    const mo = new MutationObserver(()=>scan());
    mo.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class','style'] });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
