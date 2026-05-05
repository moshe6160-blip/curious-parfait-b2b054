/* V405 Workspace Engine - real dock/minimize/drag for Vardophase entry windows.
   Safe overlay: does not change login, realtime, push, save, or database logic. */
(function(){
  if (window.__V405_WORKSPACE_ENGINE__) return;
  window.__V405_WORKSPACE_ENGINE__ = true;

  const DRAFT_KEY = 'vardophase_v405_docked_windows';
  const FIELD_IDS = [
    'entryMode','entrySupplier','entryProject','entryOrderNo','entryInvoiceNo','entryType',
    'entryDescriptionSelect','entryDescription','entryNetAmount','entryVatAmount','entryTotal',
    'entryStatus','entryNotes'
  ];
  let docked = [];
  let zTop = 10050;

  function safeJson(v, fallback){ try { return JSON.parse(v); } catch(e){ return fallback; } }
  function loadDocked(){ docked = safeJson(localStorage.getItem(DRAFT_KEY) || '[]', []); if(!Array.isArray(docked)) docked=[]; }
  function saveDocked(){ try { localStorage.setItem(DRAFT_KEY, JSON.stringify(docked)); } catch(e){} }
  function byId(id){ return document.getElementById(id); }
  function toast(msg){
    if (typeof window.showToast === 'function') { try{ window.showToast(msg); return; }catch(e){} }
    let t = byId('vp405Toast');
    if(!t){ t=document.createElement('div'); t.id='vp405Toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.className = 'vp405-toast show';
    setTimeout(()=>{ t.className='vp405-toast'; }, 1800);
  }

  function currentTitle(){
    const mode = (byId('entryMode')?.value || '').toLowerCase();
    const po = (byId('entryOrderNo')?.value || '').trim();
    const supplier = (byId('entrySupplier')?.value || '').trim();
    if(mode === 'delivery_note') return 'DN ' + (po || supplier || 'Draft');
    if(mode === 'invoice') return 'Invoice ' + (po || supplier || 'Draft');
    if(mode === 'deposit') return 'Deposit ' + (supplier || 'Draft');
    return 'Order ' + (po || supplier || 'Draft');
  }
  function modeIcon(mode){
    mode = String(mode||'').toLowerCase();
    if(mode === 'delivery_note') return '🚚';
    if(mode === 'invoice') return '🧾';
    if(mode === 'deposit') return '💰';
    if(mode === 'credit_note') return '💳';
    return '📦';
  }
  function captureEntryState(){
    const values = {};
    FIELD_IDS.forEach(id=>{ const el=byId(id); if(el) values[id]=el.value; });
    const mode = values.entryMode || 'order';
    const box = document.querySelector('#entryModal .modal-box');
    return {
      id: 'w' + Date.now() + Math.random().toString(16).slice(2),
      kind: 'entry',
      mode,
      icon: modeIcon(mode),
      title: currentTitle(),
      values,
      pos: box ? { left: box.style.left || '', top: box.style.top || '' } : {},
      savedAt: new Date().toISOString()
    };
  }
  function applyEntryState(state){
    if(!state || !state.values) return;
    FIELD_IDS.forEach(id=>{ const el=byId(id); if(el && Object.prototype.hasOwnProperty.call(state.values,id)) el.value = state.values[id] || ''; });
    try{ if(typeof window.applyEntryModeUI === 'function') window.applyEntryModeUI(); }catch(e){}
    try{ if(typeof window.handleEntryTypeChange === 'function') window.handleEntryTypeChange(); }catch(e){}
    try{ if(typeof window.applyEntryModePermissions === 'function') window.applyEntryModePermissions(); }catch(e){}
    try{ if(typeof window.refreshCustomSelects === 'function') window.refreshCustomSelects(document); }catch(e){}
    const box = document.querySelector('#entryModal .modal-box');
    if(box){
      if(state.pos && state.pos.left) box.style.left = state.pos.left;
      if(state.pos && state.pos.top) box.style.top = state.pos.top;
    }
  }

  function ensureDock(){
    if(byId('vpWorkspaceDock')) return byId('vpWorkspaceDock');
    const dock = document.createElement('div');
    dock.id = 'vpWorkspaceDock';
    dock.innerHTML = `
      <button class="vp-dock-core" title="Home" data-action="home">🏠<span>Home</span></button>
      <button class="vp-dock-core" title="Order" data-action="order">📦<span>Order</span></button>
      <button class="vp-dock-core" title="Delivery Note" data-action="dn">🚚<span>DN</span></button>
      <button class="vp-dock-core" title="Invoice" data-action="invoice">🧾<span>Invoice</span></button>
      <button class="vp-dock-core" title="Credit Note" data-action="credit">💳<span>Credit</span></button>
      <button class="vp-dock-core" title="Approvals" data-action="approvals">🔔<span>Approvals</span></button>
      <button class="vp-dock-core" title="Monthly Report" data-action="monthly">📊<span>Monthly</span></button>
      <button class="vp-dock-core" title="AI Search" data-action="ai">🔍<span>AI</span></button>
      <span class="vp-dock-sep"></span>
      <div id="vpDockedWindows"></div>
    `;
    const toggle = document.createElement('button');
    toggle.id = 'vpDockToggle';
    toggle.title = 'Hide / show dock';
    toggle.textContent = '⌄';
    document.body.appendChild(dock);
    document.body.appendChild(toggle);
    toggle.addEventListener('click', ()=>{
      dock.classList.toggle('hidden');
      toggle.classList.toggle('dock-hidden');
      toggle.textContent = dock.classList.contains('hidden') ? '⌃' : '⌄';
    });
    dock.addEventListener('click', handleDockClick);
    return dock;
  }

  function handleDockClick(e){
    const b = e.target.closest('button[data-action]');
    if(!b) return;
    const action = b.getAttribute('data-action');
    if(action === 'home') { try{ window.scrollTo({top:0,behavior:'smooth'}); }catch(e){ window.scrollTo(0,0); } return; }
    if(action === 'order') { if(typeof window.openOrderModal === 'function') window.openOrderModal(); return; }
    if(action === 'dn') { if(typeof window.openDeliveryNoteModal === 'function') window.openDeliveryNoteModal(); else if(typeof window.convertOrderToDN === 'function') window.convertOrderToDN(); return; }
    if(action === 'invoice') { if(typeof window.openInvoiceModal === 'function') window.openInvoiceModal(); return; }
    if(action === 'credit') { if(typeof window.openCreditNoteModal === 'function') window.openCreditNoteModal(); else if(typeof window.openCreditNote === 'function') window.openCreditNote(); return; }
    if(action === 'approvals') { if(typeof window.openApprovals === 'function') window.openApprovals(); else document.querySelector('[onclick*="Approval"]')?.click(); return; }
    if(action === 'monthly') { if(typeof window.printMonthlyReport === 'function') window.printMonthlyReport(); else if(typeof window.openMonthlyReport === 'function') window.openMonthlyReport(); else if(typeof window.openReports === 'function') window.openReports(); return; }
    if(action === 'ai') { const el = byId('assistantInput') || document.querySelector('input[placeholder*="Search"], input[type="search"]'); if(el){ el.focus(); el.scrollIntoView({behavior:'smooth', block:'center'}); } return; }
  }

  function renderDocked(){
    ensureDock();
    const host = byId('vpDockedWindows');
    if(!host) return;
    host.innerHTML = '';
    docked.forEach(w=>{
      const item = document.createElement('button');
      item.className = 'vp-docked-item';
      item.draggable = true;
      item.title = w.title || 'Draft window';
      item.innerHTML = `<span class="vp-docked-icon">${w.icon || '📄'}</span><span class="vp-docked-title">${escapeHtml(w.title || 'Draft')}</span><span class="vp-docked-close" title="Remove from dock">×</span>`;
      item.addEventListener('click', (ev)=>{
        if(ev.target.closest('.vp-docked-close')){
          ev.stopPropagation();
          docked = docked.filter(x=>x.id !== w.id); saveDocked(); renderDocked(); return;
        }
        restoreDockedWindow(w.id);
      });
      item.addEventListener('dragstart', (ev)=>{
        ev.dataTransfer.setData('text/plain', (w.title || 'Vardophase draft'));
      });
      host.appendChild(item);
    });
  }
  function escapeHtml(s){ return String(s||'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  function minimizeEntryWindow(){
    const modal = byId('entryModal');
    if(!modal || !modal.classList.contains('show')) return;
    const state = captureEntryState();
    docked.push(state); saveDocked(); renderDocked();
    modal.classList.add('vp-minimizing');
    setTimeout(()=>{ modal.classList.remove('show','vp-minimizing'); }, 180);
    toast('Window moved to Dock');
  }
  window.vp405MinimizeEntryWindow = minimizeEntryWindow;

  function restoreDockedWindow(id){
    const state = docked.find(w=>w.id === id);
    if(!state) return;
    const modal = byId('entryModal');
    if(modal && modal.classList.contains('show')) minimizeEntryWindow();
    setTimeout(()=>{
      applyEntryState(state);
      enhanceEntryModal('restore');
      byId('entryModal')?.classList.add('show','vp-floating-modal','vp-magic-open');
      docked = docked.filter(w=>w.id !== id); saveDocked(); renderDocked();
      setTimeout(()=>byId('entryModal')?.classList.remove('vp-magic-open'), 450);
    }, 60);
  }

  function enhanceEntryModal(reason){
    const modal = byId('entryModal');
    const box = document.querySelector('#entryModal .modal-box');
    if(!modal || !box) return;
    modal.classList.add('vp-floating-modal');
    box.classList.add('vp-app-window');
    box.style.zIndex = String(++zTop);
    if(!box.style.left) box.style.left = Math.max(18, Math.round((window.innerWidth - Math.min(920, window.innerWidth*0.92))/2)) + 'px';
    if(!box.style.top) box.style.top = '74px';
    ensureWindowControls(box);
    makeDraggable(box);
    if(reason !== 'restore'){
      modal.classList.add('vp-magic-open');
      setTimeout(()=>modal.classList.remove('vp-magic-open'), 450);
    }
  }

  function ensureWindowControls(box){
    let bar = box.querySelector('.window-bar') || box.querySelector('.modal-head');
    if(!bar) return;
    if(!box.querySelector('.vp-dock-minimize')){
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'vp-dock-minimize';
      btn.innerHTML = '— Dock';
      btn.title = 'Minimize this window to Dock';
      btn.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); minimizeEntryWindow(); });
      bar.appendChild(btn);
    }
    // Make old yellow compact dot minimize to dock instead of doing nothing.
    const yellow = box.querySelector('.window-btn.yellow');
    if(yellow && !yellow.__vp405Bound){
      yellow.__vp405Bound = true;
      yellow.onclick = function(e){ e.preventDefault(); e.stopPropagation(); minimizeEntryWindow(); };
      yellow.title = 'Dock';
    }
  }

  function makeDraggable(box){
    if(box.__vp405DragBound) return;
    box.__vp405DragBound = true;
    const header = box.querySelector('.window-bar') || box.querySelector('.modal-head') || box;
    let down=false, sx=0, sy=0, startLeft=0, startTop=0;
    function pointerDown(e){
      if(e.target.closest('button,input,select,textarea,a')) return;
      down=true;
      box.style.zIndex = String(++zTop);
      const p = e.touches ? e.touches[0] : e;
      sx=p.clientX; sy=p.clientY;
      const rect=box.getBoundingClientRect();
      startLeft=rect.left; startTop=rect.top;
      document.body.classList.add('vp-dragging');
    }
    function pointerMove(e){
      if(!down) return;
      const p = e.touches ? e.touches[0] : e;
      let left = startLeft + (p.clientX - sx);
      let top = startTop + (p.clientY - sy);
      left = Math.max(0, Math.min(left, window.innerWidth - 80));
      top = Math.max(0, Math.min(top, window.innerHeight - 70));
      box.style.left = left + 'px';
      box.style.top = top + 'px';
      box.style.right = 'auto';
      box.style.bottom = 'auto';
    }
    function pointerUp(){ down=false; document.body.classList.remove('vp-dragging'); }
    header.addEventListener('mousedown', pointerDown);
    header.addEventListener('touchstart', pointerDown, {passive:true});
    document.addEventListener('mousemove', pointerMove);
    document.addEventListener('touchmove', pointerMove, {passive:true});
    document.addEventListener('mouseup', pointerUp);
    document.addEventListener('touchend', pointerUp);
  }

  function wrapOpeners(){
    const names = ['openOrderModal','openInvoiceModal','openDeliveryNoteModal','openDepositModal'];
    names.forEach(name=>{
      const old = window[name];
      if(typeof old !== 'function' || old.__vp405Wrapped) return;
      const wrapped = async function(){
        const modal = byId('entryModal');
        if(modal && modal.classList.contains('show')){
          // keep current work instead of overwriting it
          minimizeEntryWindow();
          await new Promise(r=>setTimeout(r, 80));
        }
        const res = await old.apply(this, arguments);
        setTimeout(()=>enhanceEntryModal(), 60);
        return res;
      };
      wrapped.__vp405Wrapped = true;
      window[name] = wrapped;
    });
    // windowAction compatibility
    const oldAction = window.windowAction;
    window.windowAction = function(ev, action){
      if(action === 'compact') { try{ ev && ev.preventDefault && ev.preventDefault(); }catch(e){} minimizeEntryWindow(); return; }
      if(action === 'close') { if(typeof window.closeEntryModal === 'function') return window.closeEntryModal(); }
      if(typeof oldAction === 'function') return oldAction.apply(this, arguments);
    };
  }

  function injectCss(){
    if(byId('vp405WorkspaceStyle')) return;
    const st = document.createElement('style');
    st.id = 'vp405WorkspaceStyle';
    st.textContent = `
      #entryModal.vp-floating-modal{background:transparent!important;pointer-events:none!important;align-items:flex-start!important;justify-content:flex-start!important;}
      #entryModal.vp-floating-modal .modal-box.vp-app-window{pointer-events:auto!important;position:fixed!important;width:min(1040px,94vw)!important;max-height:calc(100vh - 118px)!important;overflow:auto!important;margin:0!important;transform:none!important;border:1px solid rgba(239,198,145,.35)!important;box-shadow:0 28px 80px rgba(0,0,0,.65),0 0 0 1px rgba(255,214,160,.10)!important;backdrop-filter:blur(18px)!important;}
      #entryModal.vp-magic-open .modal-box{animation:vp405MagicOpen .42s cubic-bezier(.18,.8,.22,1) both;}
      #entryModal.vp-minimizing .modal-box{animation:vp405Minimize .18s ease-in both;}
      @keyframes vp405MagicOpen{0%{opacity:0;transform:translateY(28px) scale(.965);filter:blur(10px)}65%{opacity:1;transform:translateY(-4px) scale(1.006);filter:blur(0)}100%{opacity:1;transform:translateY(0) scale(1)}}
      @keyframes vp405Minimize{to{opacity:0;transform:translateY(70px) scale(.86);filter:blur(6px)}}
      .vp-dock-minimize{margin-left:auto!important;border:1px solid rgba(239,198,145,.42)!important;border-radius:999px!important;padding:7px 12px!important;background:rgba(20,20,20,.72)!important;color:#f6d5a6!important;font-weight:800!important;box-shadow:inset 0 1px rgba(255,255,255,.08)!important;}
      .window-bar,.modal-head{cursor:move!important;user-select:none!important;}
      body.vp-dragging{user-select:none!important;}
      #vpWorkspaceDock{position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:100000;display:flex;align-items:center;gap:10px;max-width:min(96vw,980px);padding:10px 14px;border-radius:24px;background:rgba(13,13,16,.72);border:1px solid rgba(239,198,145,.32);box-shadow:0 18px 55px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.08);backdrop-filter:blur(24px);transition:transform .28s ease,opacity .25s ease;overflow-x:auto;}
      #vpWorkspaceDock.hidden{transform:translateX(-50%) translateY(105%);opacity:.15;pointer-events:none;}
      #vpDockToggle{position:fixed;right:14px;bottom:18px;z-index:100001;width:42px;height:42px;border-radius:50%;border:1px solid rgba(239,198,145,.42);background:rgba(13,13,16,.84);color:#f6d5a6;font-size:22px;font-weight:900;box-shadow:0 10px 28px rgba(0,0,0,.45);}
      #vpDockToggle.dock-hidden{bottom:8px;}
      .vp-dock-core,.vp-docked-item{border:0;background:rgba(255,255,255,.075);color:#fff;border-radius:16px;padding:8px 10px;min-width:54px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font:800 11px -apple-system,BlinkMacSystemFont,Segoe UI,Arial;white-space:nowrap;transition:transform .18s ease,background .18s ease;}
      .vp-dock-core:hover,.vp-docked-item:hover{transform:translateY(-7px) scale(1.08);background:rgba(239,198,145,.18);}
      .vp-dock-core{font-size:22px}.vp-dock-core span{font-size:10px;color:#f6d5a6}.vp-dock-sep{width:1px;height:38px;background:rgba(239,198,145,.28);margin:0 2px}#vpDockedWindows{display:flex;gap:8px}.vp-docked-item{position:relative;flex-direction:row;max-width:180px;padding-right:22px}.vp-docked-icon{font-size:18px}.vp-docked-title{font-size:11px;max-width:112px;overflow:hidden;text-overflow:ellipsis}.vp-docked-close{position:absolute;right:6px;top:3px;font-size:14px;color:#f6d5a6}.vp405-toast{position:fixed;left:50%;bottom:88px;transform:translateX(-50%) translateY(12px);z-index:100002;background:rgba(15,15,17,.92);color:#f6d5a6;border:1px solid rgba(239,198,145,.35);border-radius:16px;padding:10px 14px;font:800 13px -apple-system,BlinkMacSystemFont,Segoe UI,Arial;opacity:0;transition:opacity .2s, transform .2s}.vp405-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
      @media(max-width:760px){#entryModal.vp-floating-modal .modal-box.vp-app-window{width:96vw!important;left:2vw!important;top:60px!important;max-height:calc(100vh - 128px)!important}#vpWorkspaceDock{gap:7px;padding:8px 10px}.vp-dock-core{min-width:48px;font-size:19px}.vp-dock-core span{font-size:9px}.vp-docked-title{max-width:78px}}
    `;
    document.head.appendChild(st);
  }

  function init(){
    injectCss();
    loadDocked();
    ensureDock();
    renderDocked();
    wrapOpeners();
    // Keep wrapping because older scripts sometimes redefine functions after load.
    setInterval(wrapOpeners, 1200);
    const modal = byId('entryModal');
    if(modal && modal.classList.contains('show')) enhanceEntryModal();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.addEventListener('load', ()=>setTimeout(init, 300));
})();
