
(function(){
  'use strict';
  if(window.__V420_MODAL_MINIMIZE_FIX__) return;
  window.__V420_MODAL_MINIMIZE_FIX__ = true;

  const DOCK_ID = 'v420MacDock';
  let zTop = 1000000;
  const minimized = new Map();

  const q = (s,r=document)=>r.querySelector(s);
  const qa = (s,r=document)=>Array.from(r.querySelectorAll(s));

  function injectStyle(){
    if(document.getElementById('v420Style')) return;
    const style = document.createElement('style');
    style.id = 'v420Style';
    style.textContent = `
body{padding-bottom:calc(96px + env(safe-area-inset-bottom,0px))!important;}
#windowDock,#v401MacDock,#v415Dock,#v418MacDock,#v419MacDock,#v416DockToggle,#v415DockToggle,#dockFloatingButton,.workspace-floating-dock,.floating-dock,.live-floating,.floating-live,#liveFloatingButton,#v395NotifButton{display:none!important;}
.v420-modal-minimized{display:none!important;opacity:0!important;pointer-events:none!important;background:transparent!important;}
#${DOCK_ID}{position:fixed!important;left:50%!important;bottom:calc(14px + env(safe-area-inset-bottom,0px))!important;transform:translateX(-50%)!important;z-index:2147483000!important;display:flex!important;align-items:flex-end!important;justify-content:center!important;gap:10px!important;padding:10px 14px!important;min-height:62px!important;max-width:calc(100vw - 24px)!important;border-radius:30px!important;background:rgba(13,14,18,.78)!important;border:1px solid rgba(246,219,173,.34)!important;box-shadow:0 26px 76px rgba(0,0,0,.58),inset 0 1px 0 rgba(255,255,255,.12)!important;backdrop-filter:blur(30px)!important;-webkit-backdrop-filter:blur(30px)!important;overflow-x:auto!important;overflow-y:visible!important;direction:ltr!important;}
.v420-dock-item{position:relative!important;min-width:50px!important;width:50px!important;height:50px!important;border-radius:18px!important;border:1px solid rgba(255,255,255,.10)!important;background:linear-gradient(180deg,rgba(255,255,255,.15),rgba(255,255,255,.045))!important;color:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;font-size:23px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 8px 24px rgba(0,0,0,.30)!important;transition:transform .15s cubic-bezier(.2,.8,.2,1),filter .15s ease,background .15s ease!important;padding:0!important;}
.v420-dock-item:hover,.v420-dock-item:active{transform:translateY(-10px) scale(1.17)!important;filter:brightness(1.18)!important;background:linear-gradient(180deg,rgba(246,219,173,.25),rgba(255,255,255,.055))!important;}
.v420-dock-item.v420-primary{background:linear-gradient(135deg,#f8dfb5,#c28b4b)!important;color:#111!important;}
.v420-dock-item.v420-window::after{content:"";position:absolute;bottom:-6px;left:50%;width:5px;height:5px;transform:translateX(-50%);border-radius:50%;background:#f5d9a6;}
.v420-dock-separator{align-self:center!important;width:1px!important;min-width:1px!important;height:42px!important;margin:0 4px!important;border-radius:999px!important;background:linear-gradient(180deg,transparent,rgba(246,219,173,.55),transparent)!important;box-shadow:0 0 10px rgba(246,219,173,.22)!important;flex:0 0 1px!important;}
.v420-badge{position:absolute!important;right:-6px!important;top:-7px!important;min-width:21px!important;height:21px!important;padding:0 6px!important;border-radius:999px!important;background:#9b661b!important;color:#fff!important;font:900 11px -apple-system,BlinkMacSystemFont,Segoe UI,Arial!important;display:none;align-items:center!important;justify-content:center!important;box-shadow:0 0 0 3px rgba(0,0,0,.42)!important;}
@media(min-width:900px){.v420-dock-item:hover::before{content:attr(title);position:absolute;bottom:62px;left:50%;transform:translateX(-50%);white-space:nowrap;background:rgba(15,16,20,.96);border:1px solid rgba(246,219,173,.25);color:#f8dcae;border-radius:10px;padding:5px 8px;font:800 11px -apple-system,BlinkMacSystemFont,Segoe UI,Arial;pointer-events:none;}}
.window-bar{display:flex!important;align-items:center!important;gap:8px!important;cursor:grab!important;user-select:none!important;touch-action:none!important;}
.window-btn{width:13px!important;height:13px!important;min-width:13px!important;min-height:13px!important;border-radius:50%!important;padding:0!important;margin:0!important;border:0!important;font-size:0!important;line-height:0!important;color:transparent!important;box-shadow:0 1px 3px rgba(0,0,0,.36),inset 0 1px 1px rgba(255,255,255,.45)!important;}
.window-btn.red{background:#ff5f57!important}.window-btn.yellow{background:#ffbd2e!important}.window-btn.green{background:#28c840!important}
.modal.show .modal-box,.modal-box.v420-pop,.panel.v420-pop,.card.v420-pop{animation:v420Open .18s cubic-bezier(.2,.8,.2,1) both!important;will-change:transform,opacity,filter!important;}
@keyframes v420Open{0%{opacity:0;transform:translateY(16px) scale(.972);filter:blur(8px)}100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}}
.v420-minimizing{animation:v420GenieOut .18s cubic-bezier(.22,.75,.18,1) forwards!important;transform-origin:bottom center!important;}
@keyframes v420GenieOut{0%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}100%{opacity:0;transform:translateY(70px) scale(.72);filter:blur(8px)}}
.v420-floating{position:fixed!important;margin:0!important;z-index:2147481000!important;}
.modal-box.maximized,.panel.maximized,.card.maximized{position:fixed!important;inset:10px!important;width:calc(100vw - 20px)!important;max-width:none!important;max-height:calc(100vh - 96px)!important;height:calc(100vh - 96px)!important;z-index:2147481500!important;}
#v266CreditNoteMainBtn,#v264CreditNoteMainBtn,.floating-credit,.top-credit-btn{display:none!important;}
@media(max-width:680px){#${DOCK_ID}{gap:7px!important;padding:8px 10px!important;border-radius:24px!important;min-height:55px!important}.v420-dock-item{min-width:43px!important;width:43px!important;height:43px!important;border-radius:15px!important;font-size:21px!important}}
`;
    document.head.appendChild(style);
  }

  function ensureDock(){
    injectStyle();
    let dock = document.getElementById(DOCK_ID);
    if(!dock){
      dock = document.createElement('div');
      dock.id = DOCK_ID;
      dock.setAttribute('aria-label','Mac Dock');
      document.body.appendChild(dock);
    }
    return dock;
  }

  function byText(words){
    const arr = Array.isArray(words) ? words : [words];
    return qa('button,a,[role="button"],.btn').find(el=>{
      const t=(el.textContent||'').toLowerCase();
      return arr.every(w=>t.includes(String(w).toLowerCase()));
    });
  }

  function clickText(words){
    const el=byText(words);
    if(el){ el.click(); updateBadgesSoon(); return true; }
    return false;
  }

  function safeCall(name,args=[]){
    if(typeof window[name]==='function'){
      window[name].apply(window,args);
      updateBadgesSoon();
      return true;
    }
    return false;
  }

  function closeAllModals(){
    qa('.modal.show').forEach(m=>{
      m.classList.remove('show');
      m.classList.remove('v420-modal-minimized');
      m.style.pointerEvents='';
      m.style.background='';
    });
  }

  function openHome(){
    closeAllModals();
    if(safeCall('showDashboard')) return;
    if(clickText(['back','dashboard'])) return;
    const dash = q('#dashboard, .dashboard, main, body');
    try{ (dash || window).scrollTo ? (dash || window).scrollTo({top:0,behavior:'smooth'}) : window.scrollTo({top:0,behavior:'smooth'}); }catch(_e){ window.scrollTo(0,0); }
  }

  function openOrder(){ if(safeCall('openOrderModal')) return; if(typeof window.openEntryModal==='function') return window.openEntryModal(null,'order'); clickText(['order']); }
  function openDN(){ if(safeCall('openDeliveryNoteModal')) return; if(typeof window.openEntryModal==='function') return window.openEntryModal(null,'delivery_note'); clickText(['delivery','note']); }
  function openInvoice(){ if(safeCall('openInvoiceModal')) return; if(typeof window.openEntryModal==='function') return window.openEntryModal(null,'invoice'); clickText(['invoice']); }
  function openCredit(){ if(safeCall('openCreditNoteModal')) return; clickText(['credit','note']); }
  function openApprovals(){ if(safeCall('showPendingApprovalOrdersV375',[true])) return; if(safeCall('showPendingApprovalOrdersV372',[true])) return; clickText(['approvals']); }
  function openLive(){ if(safeCall('v401ToggleLiveNotifications')) return; const b=document.getElementById('v395NotifButton'); if(b) b.click(); }
  function syncNow(){ if(safeCall('syncFromCloud')) return; if(safeCall('v391RealSyncFromCloud')) return; safeCall('manualRefresh'); }
  function focusSearch(){ const input=q('input[placeholder*="Search"],input[id*="search" i],input[type="search"]'); if(input){ try{input.scrollIntoView({block:'center',behavior:'smooth'});}catch(_e){} input.focus(); } }
  function reports(){ if(clickText(['monthly','report'])) return; if(clickText(['project','report'])) return; clickText(['supplier','report']); }
  function settings(){ if(clickText(['manage','lists'])) return; clickText(['settings']); }

  function approvalCount(){ try{ const el=qa('*').find(x=>{const t=(x.textContent||'').trim(); return /^.*Approvals\s*\d+.*$/i.test(t)&&t.length<80;}); const m=el&&(el.textContent||'').match(/Approvals\s*(\d+)/i); return m?m[1]:'';}catch(_e){return '';} }
  function unreadLive(){ try{return JSON.parse(localStorage.getItem('v395_notification_feed')||'[]').filter(x=>!x.read).length||'';}catch(_e){return '';} }
  function setBadge(id,val){ const badge=q('#dock_'+id+' .v420-badge'); if(!badge)return; if(val&&String(val)!=='0'){badge.textContent=String(val); badge.style.display='inline-flex';} else badge.style.display='none'; }
  let badgeTimer=null;
  function updateBadgesSoon(){ clearTimeout(badgeTimer); badgeTimer=setTimeout(()=>{setBadge('approvals',approvalCount()); setBadge('live',unreadLive());},120); }
  window.v401UpdateDockBadges=updateBadgesSoon; window.v420UpdateDockBadges=updateBadgesSoon;

  function buildDock(){
    const dock=ensureDock();
    if(q('#dock_home',dock)){ updateBadgesSoon(); return; }
    dock.innerHTML='';
    const items=[
      ['home','🏠','Home',openHome,''],
      ['order','📦','New Order',openOrder,'v420-primary'],
      ['dn','🚚','New Delivery Note',openDN,'v420-primary'],
      ['invoice','🧾','New Invoice',openInvoice,'v420-primary'],
      ['credit','💳','Credit Note',openCredit,''],
      ['approvals','🔔','Approvals',openApprovals,''],
      ['live','🟢','Live Notifications',openLive,''],
      ['sync','🔄','Sync',syncNow,''],
      ['search','🔍','Search',focusSearch,''],
      ['reports','📊','Reports',reports,''],
      ['settings','⚙️','Manage Lists',settings,'']
    ];
    items.forEach(([id,icon,title,fn,cls])=>{
      const b=document.createElement('button');
      b.type='button'; b.className='v420-dock-item '+cls; b.id='dock_'+id; b.title=title;
      b.innerHTML=icon+'<span class="v420-badge"></span>';
      b.addEventListener('click',fn);
      dock.appendChild(b);
    });
    updateBadgesSoon();
  }

  function iconFor(title){
    const t=String(title||'').toLowerCase();
    if(t.includes('invoice'))return'🧾';
    if(t.includes('delivery')||t.includes('dn'))return'🚚';
    if(t.includes('credit'))return'💳';
    if(t.includes('approval'))return'🔔';
    if(t.includes('report'))return'📊';
    if(t.includes('supplier'))return'🏗️';
    if(t.includes('order'))return'📦';
    return'🪟';
  }

  function titleFor(host){
    return (q('.section-title,.title,h1,h2,h3,.modal-head h3',host)?.textContent || host.dataset.title || 'Window').trim();
  }

  function getId(host){
    if(!host.dataset.v420WindowId) host.dataset.v420WindowId='w_'+Math.random().toString(36).slice(2,9);
    return host.dataset.v420WindowId;
  }

  function addWindowItem(host,modal){
    const dock=ensureDock();
    const id=getId(host);
    let item=q('[data-v420-window-id="'+id+'"]',dock);
    if(item) return item;
    const title=titleFor(host);
    item=document.createElement('button');
    item.type='button';
    item.className='v420-dock-item v420-window';
    item.dataset.v420WindowId=id;
    item.title=title;
    item.innerHTML=iconFor(title)+'<span class="v420-badge"></span>';
    item.addEventListener('click',()=>restoreWindow(host,modal,item));
    dock.appendChild(item);
    minimized.set(id,{host,modal,item});
    return item;
  }

  function minimizeWindow(host,modal){
    const item=addWindowItem(host,modal);
    host.classList.add('v420-minimizing');
    setTimeout(()=>{
      host.classList.remove('v420-minimizing');
      host.style.display='none';
      if(modal){
        modal.classList.add('v420-modal-minimized');
        modal.classList.remove('show');
        modal.style.pointerEvents='none';
        modal.style.background='transparent';
      }
      try{item.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'});}catch(_e){}
    },185);
  }

  function restoreWindow(host,modal,item){
    if(modal){
      modal.classList.remove('v420-modal-minimized');
      modal.classList.add('show');
      modal.style.pointerEvents='';
      modal.style.background='';
    }
    host.style.display='';
    host.classList.add('v420-pop');
    host.style.zIndex=++zTop;
    setTimeout(()=>host.classList.remove('v420-pop'),240);
    if(item) item.remove();
    minimized.delete(host.dataset.v420WindowId);
  }

  function closeWindow(host,modal){
    const id=host.dataset.v420WindowId;
    if(id){
      const item=q('[data-v420-window-id="'+id+'"]');
      if(item)item.remove();
      minimized.delete(id);
    }
    if(modal){
      modal.classList.remove('show','v420-modal-minimized');
      modal.style.pointerEvents='';
      modal.style.background='';
    } else host.style.display='none';
  }

  function maximizeWindow(host){
    host.classList.toggle('maximized');
    host.classList.remove('compact');
    host.style.zIndex=++zTop;
  }

  window.windowAction=function(ev,action){
    if(typeof ev==='string' && !action){ action=ev; ev=null; }
    if(ev && ev.preventDefault){ ev.preventDefault(); ev.stopPropagation(); }
    const target=ev&&ev.target;
    const host=target?.closest?.('.modal-box,.card,.panel,.login-card');
    if(!host) return;
    const modal=target?.closest?.('.modal');
    if(action==='close') return closeWindow(host,modal);
    if(action==='compact') return minimizeWindow(host,modal);
    if(action==='maximize') return maximizeWindow(host);
  };

  function makeDraggable(){
    qa('.modal-box,.panel,.card').forEach(host=>{
      if(host.dataset.v420DragReady) return;
      const handle=q('.window-bar,.modal-head',host);
      if(!handle) return;
      host.dataset.v420DragReady='1';

      let dragging=false,startX=0,startY=0,baseX=0,baseY=0,raf=0;
      function down(e){
        if(e.target.closest('button,input,select,textarea,a')) return;
        const p=e.touches?e.touches[0]:e;
        const rect=host.getBoundingClientRect();
        dragging=true;
        host.classList.add('v420-floating');
        host.style.left=rect.left+'px';
        host.style.top=rect.top+'px';
        host.style.width=rect.width+'px';
        host.style.zIndex=++zTop;
        startX=p.clientX; startY=p.clientY; baseX=rect.left; baseY=rect.top;
        document.addEventListener('mousemove',move,{passive:true});
        document.addEventListener('mouseup',up,{passive:true});
        document.addEventListener('touchmove',move,{passive:true});
        document.addEventListener('touchend',up,{passive:true});
      }
      function move(e){
        if(!dragging)return;
        const p=e.touches?e.touches[0]:e;
        const nx=baseX+(p.clientX-startX);
        const ny=baseY+(p.clientY-startY);
        if(raf)cancelAnimationFrame(raf);
        raf=requestAnimationFrame(()=>{
          host.style.left=Math.max(8,Math.min(window.innerWidth-120,nx))+'px';
          host.style.top=Math.max(8,Math.min(window.innerHeight-92,ny))+'px';
        });
      }
      function up(){
        dragging=false;
        document.removeEventListener('mousemove',move);
        document.removeEventListener('mouseup',up);
        document.removeEventListener('touchmove',move);
        document.removeEventListener('touchend',up);
      }
      handle.addEventListener('mousedown',down);
      handle.addEventListener('touchstart',down,{passive:true});
    });
  }

  function animateOpen(){
    qa('.modal.show .modal-box').forEach(box=>{
      if(box.dataset.v420Open==='1')return;
      box.dataset.v420Open='1';
      box.classList.add('v420-pop');
      box.style.zIndex=++zTop;
      setTimeout(()=>box.classList.remove('v420-pop'),240);
    });
    qa('.modal:not(.show) .modal-box').forEach(box=>box.dataset.v420Open='0');
  }

  function scan(){ buildDock(); makeDraggable(); animateOpen(); updateBadgesSoon(); }

  function start(){
    scan();
    const mo=new MutationObserver(()=>requestAnimationFrame(scan));
    mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start);
  else start();
})();

/* V422 Mac-style multi-window sessions for Entry Modal (Order / Invoice / DN)
   Keeps each minimized document as an independent dock session so opening a new
   invoice/order does not overwrite the minimized one. */
(function(){
  'use strict';
  if(window.__V422_ENTRY_MULTI_WINDOW_DOCK__) return;
  window.__V422_ENTRY_MULTI_WINDOW_DOCK__ = true;

  const DOCK_ID = 'v420MacDock';
  const sessions = new Map();
  let activeSessionId = null;
  let restoring = false;

  const q = (s,r=document)=>r.querySelector(s);
  const qa = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const entryIds = [
    'entrySupplier','entrySupplierVatType','entryOrderNo','entryInvoiceNo','entryProject',
    'entryType','entryMode','entryDescription','entryDescriptionSelect','entryNetAmount',
    'entryVatAmount','entryTotal','entryStatus','entryNotes'
  ];

  function dock(){ return document.getElementById(DOCK_ID); }
  function uid(){ return 'v422_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7); }
  function val(id){ const el=document.getElementById(id); return el ? (el.type==='checkbox'?el.checked:el.value) : ''; }
  function set(id,value){
    const el=document.getElementById(id); if(!el) return;
    const v = value ?? '';
    if(el.tagName === 'SELECT' && v !== '' && !Array.from(el.options || []).some(o=>o.value===String(v))){
      const opt = document.createElement('option'); opt.value = String(v); opt.textContent = String(v); el.appendChild(opt);
    }
    if(el.type==='checkbox') el.checked=!!value; else el.value=v;
    try{ el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); }catch(_e){}
    try{ if(typeof el._customRefresh === 'function') el._customRefresh(); }catch(_e){}
  }
  function money(n){ const x = Number(n||0); return isFinite(x) ? x.toFixed(2) : '0.00'; }
  function captureEntryItems(){
    const rows = qa('#v309OrderItemsBody tr');
    if(!rows.length) return [];
    return rows.map((tr,i)=>({
      item: String(i+1), itemNo: String(i+1),
      manualDescription: tr.querySelector('[data-field="manualDescription"]')?.value || '',
      glCode: tr.querySelector('[data-field="glCode"]')?.value || '',
      description: tr.querySelector('[data-field="description"]')?.value || '',
      qty: tr.querySelector('[data-field="qty"]')?.value || '',
      price: tr.querySelector('[data-field="price"]')?.value || '',
      discount: tr.querySelector('[data-field="discount"]')?.value || '',
      total: tr.querySelector('[data-field="total"]')?.value || ''
    }));
  }
  function snapshotAllEntryFields(){
    const modal = document.getElementById('entryModal');
    const out = {};
    if(!modal) return out;
    qa('input,select,textarea', modal).forEach((el,idx)=>{
      const key = el.id || el.name || (el.dataset.field ? 'field:'+el.dataset.field+':'+idx : 'idx:'+idx);
      out[key] = el.type === 'checkbox' ? el.checked : el.value;
    });
    return out;
  }
  function restoreAllEntryFields(all){
    if(!all) return;
    const modal = document.getElementById('entryModal');
    if(!modal) return;
    qa('input,select,textarea', modal).forEach((el,idx)=>{
      const key = el.id || el.name || (el.dataset.field ? 'field:'+el.dataset.field+':'+idx : 'idx:'+idx);
      if(!(key in all)) return;
      const v = all[key] ?? '';
      if(el.tagName === 'SELECT' && v !== '' && !Array.from(el.options || []).some(o=>o.value===String(v))){
        const opt = document.createElement('option'); opt.value = String(v); opt.textContent = String(v); el.appendChild(opt);
      }
      if(el.type === 'checkbox') el.checked = !!all[key]; else el.value = v;
      try{ el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); if(typeof el._customRefresh === 'function') el._customRefresh(); }catch(_e){}
    });
  }
  function lineTotal(x){
    const qty = Number(x.qty||0), price = Number(x.price||0), discount = Math.max(0, Math.min(100, Number(x.discount||0)));
    const subtotal = qty * price;
    return Math.max(0, subtotal - (subtotal * discount / 100));
  }
  function restoreEntryItems(items){
    if(!items || !items.length) return;
    window.__v309PendingItems = items;
    const body = document.getElementById('v309OrderItemsBody');
    if(!body) return;
    const first = body.querySelector('tr');
    if(!first) return;
    while(body.children.length < items.length){ body.appendChild(first.cloneNode(true)); }
    while(body.children.length > items.length){ body.lastElementChild.remove(); }
    qa('tr', body).forEach((tr,i)=>{
      const x = items[i] || {};
      const setField = (field,val)=>{ const el=tr.querySelector('[data-field="'+field+'"]'); if(el) el.value = val ?? ''; };
      setField('item', String(i+1));
      setField('manualDescription', x.manualDescription || '');
      const gl = tr.querySelector('[data-field="glCode"]');
      if(gl){
        if(x.glCode && !Array.from(gl.options).some(o=>o.value===String(x.glCode))){ const o=document.createElement('option'); o.value=x.glCode; o.textContent=x.glCode+' - '+(x.description||''); gl.appendChild(o); }
        gl.value = x.glCode || '';
      }
      setField('description', x.description || '');
      setField('codeDisplay', x.glCode || '');
      setField('qty', x.qty === '' ? '' : (x.qty ?? ''));
      setField('price', x.price === '' ? '' : (x.price ?? ''));
      setField('discount', x.discount === '' ? '' : (x.discount ?? ''));
      setField('total', x.total || money(lineTotal(x)));
      const disc = tr.querySelector('[data-field="discountAmount"]');
      if(disc){ const subtotal=Number(x.qty||0)*Number(x.price||0); const da=subtotal*Math.max(0,Math.min(100,Number(x.discount||0)))/100; disc.textContent='-'+money(da); }
    });
    qa('input,select,textarea', body).forEach(el=>{ try{ el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); }catch(_e){} });
  }
  function modeLabel(mode){
    if(mode==='delivery_note') return 'Delivery Note';
    if(mode==='order') return 'Order';
    if(mode==='deposit') return 'Deposit';
    return 'Invoice';
  }
  function iconFor(mode){
    if(mode==='delivery_note') return '🚚';
    if(mode==='order') return '📦';
    if(mode==='deposit') return '💰';
    return '🧾';
  }
  function titleFromData(data){
    const mode = data.mode || data.values.entryMode || data.values.entryType || 'invoice';
    const no = data.values.entryInvoiceNo || data.values.entryOrderNo || data.values.entrySupplier || 'Draft';
    return modeLabel(mode)+' · '+no;
  }

  function snapshotExisting(sessionId){
    const modal = document.getElementById('entryModal');
    if(!modal || !modal.classList.contains('show')) return null;
    const values = {};
    entryIds.forEach(id=>values[id]=val(id));
    const mode = values.entryMode || values.entryType || modal.dataset.v422Mode || 'invoice';
    const data = {
      id: sessionId || activeSessionId || uid(),
      editingId: modal.dataset.v422EditingId || '',
      mode,
      values,
      allFields: snapshotAllEntryFields(),
      items: captureEntryItems(),
      title: '',
      scrollY: 0
    };
    data.title = titleFromData(data);
    sessions.set(data.id,data);
    return data;
  }

  function syncDockSeparator(){
    const d = dock(); if(!d) return null;
    let sep = q('.v420-dock-separator', d);
    const hasWindows = !!q('.v420-window,[data-v422-session-id],[data-v420-window-id]', d);
    if(!hasWindows){ if(sep) sep.remove(); return null; }
    if(!sep){ sep = document.createElement('div'); sep.className = 'v420-dock-separator'; sep.setAttribute('aria-hidden','true'); }
    const firstWindow = q('.v420-window,[data-v422-session-id],[data-v420-window-id]', d);
    if(firstWindow && sep.nextElementSibling !== firstWindow) d.insertBefore(sep, firstWindow);
    return sep;
  }

  function createDockItem(data){
    const d = dock(); if(!d) return;
    let item = q('[data-v422-session-id="'+data.id+'"]', d);
    if(!item){
      item = document.createElement('button');
      item.type = 'button';
      item.className = 'v420-dock-item v420-window';
      item.dataset.v422SessionId = data.id;
      item.addEventListener('click',()=>restoreSession(data.id));
      const sep = syncDockSeparator();
      d.insertBefore(item, sep ? sep.nextSibling : null);
    }
    syncDockSeparator();
    item.title = data.title;
    item.innerHTML = iconFor(data.mode)+'<span class="v420-badge"></span>';
    try{ item.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'}); }catch(_e){}
  }

  function hideEntryModal(){
    const modal = document.getElementById('entryModal');
    if(!modal) return;
    modal.classList.remove('show');
    modal.classList.add('v420-modal-minimized');
    modal.style.pointerEvents='none';
    modal.style.background='transparent';
    const box = modal.querySelector('.modal-box');
    if(box) box.style.display='none';
  }

  function minimizeCurrentEntry(sessionId){
    const data = snapshotExisting(sessionId);
    if(!data) return false;
    createDockItem(data);
    activeSessionId = null;
    hideEntryModal();
    return true;
  }

  async function restoreSession(id){
    const data = sessions.get(id); if(!data) return;
    const visible = document.getElementById('entryModal')?.classList.contains('show');
    if(visible && activeSessionId !== id) minimizeCurrentEntry(activeSessionId || undefined);
    restoring = true;
    try{
      if(typeof window.openEntryModal === 'function'){
        await window.openEntryModal(data.editingId || null, data.mode || data.values.entryMode || 'invoice');
      }
      entryIds.forEach(fieldId=>set(fieldId,data.values[fieldId]));
      restoreAllEntryFields(data.allFields);
      restoreEntryItems(data.items);
      setTimeout(()=>{ restoreAllEntryFields(data.allFields); restoreEntryItems(data.items); }, 80);
      setTimeout(()=>{ restoreAllEntryFields(data.allFields); restoreEntryItems(data.items); }, 260);
      if(typeof window.handleEntryTypeChange === 'function') window.handleEntryTypeChange();
      if(typeof window.handleSupplierVatTypeChange === 'function') window.handleSupplierVatTypeChange();
      if(typeof window.applyEntryModePermissions === 'function') window.applyEntryModePermissions();
      if(typeof window.refreshCustomSelects === 'function') window.refreshCustomSelects(document);
      const modal = document.getElementById('entryModal');
      if(modal){
        modal.classList.remove('v420-modal-minimized');
        modal.classList.add('show');
        modal.style.pointerEvents='';
        modal.style.background='';
        modal.dataset.v422EditingId = data.editingId || '';
        modal.dataset.v422Mode = data.mode || '';
        const box = modal.querySelector('.modal-box');
        if(box){ box.style.display=''; box.style.zIndex=2147481800; }
      }
      activeSessionId = id;
      q('[data-v422-session-id="'+id+'"]', dock() || document)?.remove();
      syncDockSeparator();
    } finally { restoring = false; }
  }

  function removeSession(id){
    if(!id) return;
    sessions.delete(id);
    q('[data-v422-session-id="'+id+'"]', dock() || document)?.remove();
    if(activeSessionId===id) activeSessionId=null;
    syncDockSeparator();
  }

  function install(){
    if(window.__V422_ENTRY_MULTI_WINDOW_INSTALLED__) return;
    if(typeof window.openEntryModal !== 'function') return;
    window.__V422_ENTRY_MULTI_WINDOW_INSTALLED__ = true;

    const oldOpen = window.openEntryModal;
    window.openEntryModal = async function(id=null, forcedMode=''){
      const modal = document.getElementById('entryModal');
      if(!restoring && modal && modal.classList.contains('show')){
        minimizeCurrentEntry(activeSessionId || undefined);
      }
      activeSessionId = null;
      const res = await oldOpen.apply(this, arguments);
      const m = document.getElementById('entryModal');
      if(m){
        m.classList.remove('v420-modal-minimized');
        m.style.pointerEvents='';
        m.style.background='';
        const box=m.querySelector('.modal-box'); if(box) box.style.display='';
        m.dataset.v422EditingId = id || '';
        m.dataset.v422Mode = document.getElementById('entryMode')?.value || forcedMode || '';
      }
      return res;
    };

    const oldAction = window.windowAction;
    window.windowAction = function(ev,action){
      const target = ev && ev.target;
      const modal = target?.closest?.('#entryModal');
      if(modal && action === 'compact'){
        if(ev && ev.preventDefault){ ev.preventDefault(); ev.stopPropagation(); }
        minimizeCurrentEntry(activeSessionId || undefined);
        return;
      }
      if(modal && action === 'close'){
        if(ev && ev.preventDefault){ ev.preventDefault(); ev.stopPropagation(); }
        removeSession(activeSessionId);
        activeSessionId = null;
        modal.classList.remove('show','v420-modal-minimized');
        modal.style.pointerEvents=''; modal.style.background='';
        const box=modal.querySelector('.modal-box'); if(box) box.style.display='';
        if(typeof window.closeEntryModal === 'function') window.closeEntryModal();
        return;
      }
      return oldAction ? oldAction.apply(this, arguments) : undefined;
    };

    if(typeof window.saveEntry === 'function'){
      const oldSave = window.saveEntry;
      window.saveEntry = async function(){
        const sid = activeSessionId;
        const res = await oldSave.apply(this, arguments);
        removeSession(sid);
        const modal=document.getElementById('entryModal');
        if(modal){ modal.classList.remove('v420-modal-minimized'); const box=modal.querySelector('.modal-box'); if(box) box.style.display=''; }
        return res;
      };
    }

    if(typeof window.closeEntryModal === 'function'){
      const oldClose = window.closeEntryModal;
      window.closeEntryModal = function(){
        removeSession(activeSessionId);
        activeSessionId = null;
        const res = oldClose.apply(this, arguments);
        const modal=document.getElementById('entryModal');
        if(modal){ modal.classList.remove('v420-modal-minimized'); modal.style.pointerEvents=''; modal.style.background=''; const box=modal.querySelector('.modal-box'); if(box) box.style.display=''; }
        return res;
      };
    }

    window.v423EntryDockSessions = window.v422EntryDockSessions = { minimizeCurrentEntry, restoreSession, sessions, syncDockSeparator };
  }

  const timer = setInterval(()=>{ install(); if(window.__V422_ENTRY_MULTI_WINDOW_INSTALLED__) clearInterval(timer); }, 250);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', install); else install();
})();

/* V424 DN numbering guard
   DN number is NOT reserved on open/minimize/restore. It is allocated only on final save.
   This prevents dock sessions and parallel DN drafts from consuming or duplicating DN numbers. */
(function(){
  'use strict';
  if(window.__V424_DN_NUMBER_SAVE_LOCK__) return;
  window.__V424_DN_NUMBER_SAVE_LOCK__ = true;

  const DN_RE = /\bDN-(\d+)\b/gi;

  function mode(){ return String(document.getElementById('entryMode')?.value || '').trim(); }
  function invoiceInput(){ return document.getElementById('entryInvoiceNo'); }
  function editingId(){ return window.editingId || ''; }
  function isDNMode(){ return mode() === 'delivery_note'; }
  function setMsg(text, cls){
    try{
      const msg = document.getElementById('entryStatusMsg');
      if(msg){ msg.className = 'status ' + (cls || 'ok'); msg.textContent = text || ''; }
      else if(typeof window.setEntryStatus === 'function') window.setEntryStatus(text || '', cls || 'ok');
    }catch(_e){}
  }
  function extractDNsFromRow(row){
    const txt = [row?.invoice_no, row?.delivery_note_no, row?.dn_no, row?.notes].map(x=>String(x||'')).join('\n');
    const out = [];
    let m;
    DN_RE.lastIndex = 0;
    while((m = DN_RE.exec(txt))){ out.push({ raw:'DN-' + String(Number(m[1])).padStart(4,'0'), num:Number(m[1]||0) }); }
    return out;
  }
  async function fetchDNRows(){
    if(!window.supabase) return [];
    const { data, error } = await window.supabase.from('suppliers').select('id, invoice_no, delivery_note_no, dn_no, notes, entry_type');
    if(error) throw error;
    return data || [];
  }
  async function dnExists(dn, excludeId){
    const target = String(dn || '').trim().toUpperCase();
    if(!target) return false;
    const rows = await fetchDNRows();
    return rows.some(row=>{
      if(excludeId && String(row.id) === String(excludeId)) return false;
      return extractDNsFromRow(row).some(x=>String(x.raw).toUpperCase() === target);
    });
  }

  window.nextDeliveryNoteNo = async function(){
    const rows = await fetchDNRows();
    let max = 0;
    rows.forEach(row=>extractDNsFromRow(row).forEach(x=>{ if(x.num > max) max = x.num; }));
    return 'DN-' + String(max + 1).padStart(4, '0');
  };

  window.setAutoDeliveryNoteNo = async function(){
    if(!isDNMode()) return;
    const input = invoiceInput();
    if(!input) return;
    input.readOnly = true;
    input.style.opacity = '0.85';
    input.placeholder = 'DN auto on Save';
    input.title = 'Delivery Note number is created only when you press Save, so dock drafts do not take numbers.';
    // Important: do not put a new DN number here. Open/minimize/restore must not consume numbering.
    if(!/^DN-\d+/i.test(String(input.value || '').trim())) input.value = '';
  };

  async function assignDeliveryNoteNumberForSave(){
    if(!isDNMode()) return true;
    const input = invoiceInput();
    if(!input) return true;

    let current = String(input.value || '').trim().toUpperCase();
    const exclude = editingId();

    if(current && /^DN-\d+$/i.test(current) && !(await dnExists(current, exclude))){
      input.value = current.replace(/^DN-(\d+)$/i, (_m,n)=>'DN-' + String(Number(n)).padStart(4,'0'));
      return true;
    }

    for(let i=0; i<25; i++){
      const next = await window.nextDeliveryNoteNo();
      if(!(await dnExists(next, exclude))){
        input.value = next;
        input.dispatchEvent(new Event('input', { bubbles:true }));
        input.dispatchEvent(new Event('change', { bubbles:true }));
        setMsg('Delivery Note number locked on save: ' + next, 'ok');
        return true;
      }
      // Very unlikely race: mark the current max as taken locally by continuing the loop after a re-scan.
    }

    setMsg('Could not lock a unique Delivery Note number. Please save again.', 'error');
    return false;
  }

  function install(){
    if(window.__V424_DN_SAVE_WRAPPED__) return;
    if(typeof window.saveEntry !== 'function') return;
    window.__V424_DN_SAVE_WRAPPED__ = true;

    const oldSave = window.saveEntry;
    window.saveEntry = async function(){
      if(isDNMode()){
        const ok = await assignDeliveryNoteNumberForSave();
        if(!ok) return;
      }
      return oldSave.apply(this, arguments);
    };

    const oldOpen = window.openEntryModal;
    if(typeof oldOpen === 'function' && !window.__V424_OPEN_ENTRY_DN_NO_RESERVE__){
      window.__V424_OPEN_ENTRY_DN_NO_RESERVE__ = true;
      window.openEntryModal = async function(){
        const res = await oldOpen.apply(this, arguments);
        if(isDNMode()) setTimeout(()=>window.setAutoDeliveryNoteNo(), 0);
        return res;
      };
    }
  }

  const timer = setInterval(()=>{ install(); if(window.__V424_DN_SAVE_WRAPPED__) clearInterval(timer); }, 250);
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();
