/* V416 Mac Feel Safe Layer — UI only, no login/db/push changes */
(function(){
  'use strict';
  if(window.__V416_MAC_FEEL_SAFE__) return;
  window.__V416_MAC_FEEL_SAFE__ = true;

  const minimized = new Map();
  let zTop = 5000;

  function qs(sel, root=document){ return root.querySelector(sel); }
  function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

  function ensureDock(){
    let dock = document.getElementById('v401MacDock');
    if(!dock){
      dock = document.createElement('div');
      dock.id = 'v401MacDock';
      document.body.appendChild(dock);
    }
    dock.classList.add('v416-mac-dock');

    let toggle = document.getElementById('v416DockToggle');
    if(!toggle){
      toggle = document.createElement('button');
      toggle.id = 'v416DockToggle';
      toggle.type = 'button';
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

  function iconFor(title){
    const t = String(title || '').toLowerCase();
    if(t.includes('invoice')) return '🧾';
    if(t.includes('delivery') || t.includes('dn')) return '🚚';
    if(t.includes('credit')) return '💳';
    if(t.includes('approval')) return '🔔';
    if(t.includes('report')) return '📊';
    if(t.includes('supplier')) return '🏗️';
    if(t.includes('list') || t.includes('setting')) return '⚙️';
    if(t.includes('search')) return '🔍';
    if(t.includes('order')) return '📦';
    return '🪟';
  }

  function getTitle(host){
    return host?.querySelector?.('.modal-head h3,.section-title,.title,h1,h2,h3')?.textContent?.trim() || host?.dataset?.title || 'Window';
  }

  function getHostFromEvent(ev){
    return ev?.target?.closest?.('.modal-box,.card,.panel');
  }

  function getModal(host){ return host?.closest?.('.modal'); }

  function bringFront(host){
    if(!host) return;
    zTop += 1;
    host.style.zIndex = zTop;
    const modal = getModal(host);
    if(modal) modal.style.zIndex = zTop;
  }

  function addDockWindow(host, title){
    const dock = ensureDock();
    if(!host.dataset.v416WindowId) host.dataset.v416WindowId = 'v416w_' + Math.random().toString(36).slice(2,10);
    const id = host.dataset.v416WindowId;
    if(document.getElementById('v416DockWin_' + id)) return;

    minimized.set(id, host);
    const item = document.createElement('button');
    item.type = 'button';
    item.id = 'v416DockWin_' + id;
    item.className = 'v401-dock-item v416-window-dock-item';
    item.title = title || getTitle(host);
    item.innerHTML = iconFor(item.title) + '<span class="v416-dock-dot"></span>';
    item.addEventListener('click', function(){ restoreWindow(id); });
    dock.appendChild(item);
  }

  function restoreWindow(id){
    const host = minimized.get(id) || document.querySelector('[data-v416-window-id="' + id + '"]');
    if(!host) return;
    const modal = getModal(host);
    if(modal){ modal.classList.add('show'); modal.style.display = 'flex'; }
    host.style.display = '';
    host.classList.remove('v416-minimizing');
    bringFront(host);
    const item = document.getElementById('v416DockWin_' + id);
    if(item) item.remove();
    minimized.delete(id);
  }

  function closeWindow(host){
    if(!host) return;
    const id = host.dataset.v416WindowId;
    if(id){
      const item = document.getElementById('v416DockWin_' + id);
      if(item) item.remove();
      minimized.delete(id);
    }
    const modal = getModal(host);
    if(modal){ modal.classList.remove('show'); modal.style.display = 'none'; }
    else host.style.display = 'none';
  }

  function minimizeWindow(host){
    if(!host) return;
    const title = getTitle(host);
    host.classList.add('v416-minimizing');
    addDockWindow(host, title);
    setTimeout(function(){
      const modal = getModal(host);
      if(modal){ modal.classList.remove('show'); modal.style.display = 'none'; }
      else host.style.display = 'none';
      host.classList.remove('v416-minimizing');
    }, 155);
  }

  function toggleFull(host){
    if(!host) return;
    bringFront(host);
    host.classList.toggle('maximized');
    host.classList.toggle('v416-fullscreen');
  }

  // Override existing buttons safely. Existing HTML already calls window.windowAction(event, action)
  const oldWindowAction = window.windowAction;
  window.windowAction = function(ev, action){
    try{
      if(ev){ ev.preventDefault(); ev.stopPropagation(); }
      const host = getHostFromEvent(ev);
      if(!host){ if(typeof oldWindowAction === 'function') return oldWindowAction(ev, action); return; }
      prepareWindow(host);
      if(action === 'close') return closeWindow(host);
      if(action === 'compact') return minimizeWindow(host);
      if(action === 'maximize') return toggleFull(host);
    }catch(e){
      console.warn('V416 windowAction fallback', e);
      if(typeof oldWindowAction === 'function') return oldWindowAction(ev, action);
    }
  };

  function makeDraggable(host){
    if(!host || host.dataset.v416DragReady === '1') return;
    const bar = qs('.window-bar,.modal-head', host);
    if(!bar) return;
    host.dataset.v416DragReady = '1';
    host.classList.add('v416-mac-window');
    let drag = false, startX = 0, startY = 0, baseX = 0, baseY = 0, frame = null;

    function ensurePosition(){
      if(getComputedStyle(host).position === 'static') host.style.position = 'relative';
      if(!host.style.left) host.style.left = '0px';
      if(!host.style.top) host.style.top = '0px';
    }

    function move(clientX, clientY){
      if(!drag || host.classList.contains('v416-fullscreen')) return;
      const x = baseX + (clientX - startX);
      const y = baseY + (clientY - startY);
      if(frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(function(){
        host.style.transform = 'none';
        host.style.left = Math.round(x) + 'px';
        host.style.top = Math.round(y) + 'px';
      });
    }
    function up(){
      drag = false;
      document.removeEventListener('mousemove', mouseMove);
      document.removeEventListener('mouseup', up);
      document.removeEventListener('touchmove', touchMove);
      document.removeEventListener('touchend', up);
    }
    function mouseMove(e){ move(e.clientX, e.clientY); }
    function touchMove(e){ if(e.touches && e.touches[0]) move(e.touches[0].clientX, e.touches[0].clientY); }

    bar.addEventListener('mousedown', function(e){
      if(e.target.closest('button,input,select,textarea,a')) return;
      ensurePosition(); bringFront(host);
      drag = true; startX = e.clientX; startY = e.clientY;
      baseX = parseFloat(host.style.left || '0') || 0;
      baseY = parseFloat(host.style.top || '0') || 0;
      document.addEventListener('mousemove', mouseMove, {passive:true});
      document.addEventListener('mouseup', up, {passive:true});
    });
    bar.addEventListener('touchstart', function(e){
      if(e.target.closest('button,input,select,textarea,a') || !e.touches || !e.touches[0]) return;
      ensurePosition(); bringFront(host);
      const t = e.touches[0]; drag = true; startX = t.clientX; startY = t.clientY;
      baseX = parseFloat(host.style.left || '0') || 0;
      baseY = parseFloat(host.style.top || '0') || 0;
      document.addEventListener('touchmove', touchMove, {passive:true});
      document.addEventListener('touchend', up, {passive:true});
    }, {passive:true});
  }

  function prepareWindow(host){
    if(!host) return;
    host.classList.add('v416-mac-window');
    bringFront(host);
    makeDraggable(host);
  }

  function prepareExisting(){
    ensureDock();
    qsa('.modal-box,.card,.panel').forEach(function(host){
      if(host.closest('.login-card')) return;
      makeDraggable(host);
    });
    // Kill old separate windowDock if previous code created it
    const oldDock = document.getElementById('windowDock');
    if(oldDock) oldDock.style.display = 'none';
  }

  const mo = new MutationObserver(function(mutations){
    for(const m of mutations){
      if(m.type === 'attributes' && m.target.classList && m.target.classList.contains('modal') && m.target.classList.contains('show')){
        const box = qs('.modal-box', m.target); if(box) prepareWindow(box);
      }
      if(m.addedNodes && m.addedNodes.length){
        m.addedNodes.forEach(function(n){
          if(n.nodeType !== 1) return;
          if(n.matches && n.matches('.modal-box,.card,.panel')) makeDraggable(n);
          qsa && qsa('.modal-box,.card,.panel', n).forEach(makeDraggable);
        });
      }
    }
  });

  function init(){
    prepareExisting();
    try{ mo.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class','style'] }); }catch(_e){}
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
