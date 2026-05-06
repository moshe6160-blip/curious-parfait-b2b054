/* V456 Safe Dock Real-Key Fix + Approved Stamp Restore
   Base: V454. Does NOT change save/items/VAT/numbering logic.
   Fixes: duplicate Dock icons after restore -> open second document, slow stuck toggles caused by stale ghost icons,
   and keeps green APPROVED stamp on App order / Approved / Order Sent documents. */
(function(){
  'use strict';
  if(window.__V456_DOCK_REAL_KEY_APPROVED_STAMP_FIX__) return;
  window.__V456_DOCK_REAL_KEY_APPROVED_STAMP_FIX__ = true;

  var q=function(s,r){return (r||document).querySelector(s);};
  var qa=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
  var clean=function(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();};
  var low=function(v){return clean(v).toLowerCase();};
  var slug=function(v){return low(v).replace(/[^a-z0-9א-ת_-]+/gi,'_').replace(/^_+|_+$/g,'');};
  var cssEsc=function(v){try{return CSS.escape(v);}catch(e){return String(v).replace(/"/g,'\\"');}};
  function dock(){ return document.getElementById('v420MacDock'); }
  function modal(){ return document.getElementById('entryModal'); }
  function visible(){ var m=modal(); return !!(m && m.classList.contains('show') && !m.classList.contains('v420-modal-minimized')); }
  function val(id){ var el=document.getElementById(id); return clean(el && el.value); }
  function currentId(){ var m=modal(); return clean((m && (m.dataset.v422EditingId || m.dataset.v453EditingId || m.dataset.v451EntryId || m.dataset.v375EntryId)) || window.editingId || ''); }
  function currentMode(){ var m=modal(); return val('entryMode') || val('entryType') || clean(m && m.dataset.v422Mode) || 'order'; }
  function currentNo(){ return val('entryOrderNo') || val('entryInvoiceNo') || val('entrySupplier') || 'Draft'; }
  function realKeyFromParts(id, mode, no){
    id=clean(id); mode=clean(mode)||'order'; no=clean(no);
    if(id) return 'id_'+slug(id);
    if(no && low(no)!=='draft') return 'doc_'+slug(mode)+'_'+slug(no);
    return '';
  }
  function currentRealKey(){ return realKeyFromParts(currentId(), currentMode(), currentNo()); }
  function itemText(item){
    if(!item) return '';
    var label=q('.v425-dock-label,.v428-dock-name',item);
    return clean(item.getAttribute('title') || (label && label.textContent) || item.textContent || '');
  }
  function keyFromItem(item){
    if(!item) return '';
    var explicit = clean(item.dataset.v456Key || '');
    if(explicit) return explicit;
    var sid = clean(item.dataset.v454Sid || item.dataset.v453SessionId || item.dataset.v422SessionId || item.dataset.v420WindowId || '');
    var txt = itemText(item);
    var t = low(txt);
    // Remove icon/badge noise and use the real visible document title/number as fallback.
    var normalized = txt.replace(/[📦🧾🚚💰↩️•·]/g,' ').replace(/\b(new|draft|window)\b/ig,' ').replace(/\s+/g,' ').trim();
    // Prefer real document number from title: "Order · PO-123" / "Invoice · INV-123" etc.
    var m = normalized.match(/(?:order|invoice|delivery note|deposit|credit note)\s*[·:-]?\s*([A-Z]{0,5}[-_\/]?\d{1,}|\d{2,}[A-Z0-9\/_-]*)/i);
    if(m && m[1]) return 'title_'+slug(m[0]);
    if(normalized && !/invoice\s*draft/i.test(normalized)) return 'title_'+slug(normalized);
    if(sid) return 'sid_'+slug(sid);
    if(t) return 'txt_'+slug(t);
    return '';
  }
  function markDockItem(item){
    var k=keyFromItem(item); if(!k) return '';
    item.dataset.v456Key=k;
    return k;
  }
  function removeDockItemsByKey(key, except){
    var d=dock(); if(!d || !key) return 0;
    var removed=0;
    qa('.v420-window,[data-v422-session-id],[data-v453-session-id],[data-v454-sid],[data-v456-key]',d).forEach(function(item){
      var k=markDockItem(item);
      if(k===key && item!==except){ try{ item.remove(); removed++; }catch(e){ item.style.display='none'; removed++; } }
    });
    return removed;
  }
  function cleanupDock(activeKey){
    var d=dock(); if(!d) return;
    var seen=Object.create(null);
    qa('.v420-window,[data-v422-session-id],[data-v453-session-id],[data-v454-sid],[data-v456-key]',d).forEach(function(item){
      var txt=low(itemText(item));
      if(txt.indexOf('invoice draft')>=0 || txt==='draft' || txt==='invoice · draft'){
        try{ item.remove(); }catch(e){ item.style.display='none'; }
        return;
      }
      var k=markDockItem(item); if(!k) return;
      if(activeKey && k===activeKey){ try{ item.remove(); }catch(e){ item.style.display='none'; } return; }
      if(seen[k] && seen[k]!==item){ try{ item.remove(); }catch(e){ item.style.display='none'; } return; }
      seen[k]=item;
    });
    var sep=q('.v420-dock-separator',d);
    var has=!!q('.v420-window,[data-v422-session-id],[data-v453-session-id],[data-v454-sid],[data-v456-key]',d);
    if(!has && sep) sep.remove();
  }

  function statusText(){ return low(val('entryStatus')+' '+val('entryNotes')); }
  function isOrderMode(){ return low(currentMode())==='order' || !!val('entryOrderNo'); }
  function isApprovedLike(){ var s=statusText(); return isOrderMode() && (s.indexOf('approved')>=0 || s.indexOf('app order')>=0 || s.indexOf('order sent')>=0 || s.indexOf('sent')>=0); }
  function ensureApprovedStamp(){
    var m=modal(); if(!m || !m.classList.contains('show')) return;
    var box=q('.modal-box',m); if(!box) return;
    var stamp=q('.v425-approved-stamp',box);
    if(isApprovedLike()){
      if(!stamp){ stamp=document.createElement('div'); stamp.className='v425-approved-stamp'; stamp.textContent='APPROVED'; box.appendChild(stamp); }
    } else if(stamp){ stamp.remove(); }
  }
  function injectCss(){
    if(q('#v456DockFixStyle')) return;
    var st=document.createElement('style'); st.id='v456DockFixStyle'; st.textContent =
      '.v456-gemini-open #entryModal .modal-box{animation:v456GeminiOpen .62s cubic-bezier(.16,1,.3,1) both!important;}\n'+
      '@keyframes v456GeminiOpen{0%{opacity:0;transform:translateY(28px) scale(.965);filter:blur(10px) brightness(1.18)}55%{opacity:1;transform:translateY(-4px) scale(1.006);filter:blur(0) brightness(1.05)}100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0) brightness(1)}}\n'+
      '#v420MacDock .v456-close{position:absolute;right:-5px;top:-7px;width:18px;height:18px;border-radius:50%;border:1px solid rgba(255,255,255,.35);background:#b94b43;color:white;font:900 12px/16px Arial;text-align:center;display:none;z-index:5;box-shadow:0 4px 12px rgba(0,0,0,.35)}\n'+
      '#v420MacDock .v420-window:hover .v456-close{display:block}\n'+
      '@media(max-width:680px){#v420MacDock .v456-close{display:block;width:16px;height:16px;font-size:11px;line-height:14px}}';
    document.head.appendChild(st);
  }
  function addDockCloseButtons(){
    var d=dock(); if(!d) return;
    qa('.v420-window,[data-v422-session-id],[data-v453-session-id],[data-v454-sid],[data-v456-key]',d).forEach(function(item){
      if(q('.v456-close',item)) return;
      var x=document.createElement('span'); x.className='v456-close'; x.textContent='×'; x.title='Close from Dock';
      x.addEventListener('click',function(e){
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        var k=markDockItem(item); removeDockItemsByKey(k); cleanupDock('');
      }, true);
      item.appendChild(x);
    });
  }

  function installOpenPatch(){
    if(window.__V456_OPEN_PATCH__ || typeof window.openEntryModal!=='function') return;
    window.__V456_OPEN_PATCH__=true;
    var old=window.openEntryModal;
    window.openEntryModal=async function(){
      var oldKey = visible() ? currentRealKey() : '';
      // If a stale Dock icon already exists for the open document, remove it before older code minimizes.
      // Older V422/V454 will then create exactly one fresh snapshot icon.
      if(oldKey) removeDockItemsByKey(oldKey);
      document.documentElement.classList.add('v456-gemini-open');
      var res;
      try{ res = await old.apply(this, arguments); }
      finally{ setTimeout(function(){document.documentElement.classList.remove('v456-gemini-open');},760); }
      setTimeout(function(){ cleanupDock(currentRealKey()); ensureApprovedStamp(); addDockCloseButtons(); },40);
      setTimeout(function(){ cleanupDock(currentRealKey()); ensureApprovedStamp(); addDockCloseButtons(); },260);
      setTimeout(function(){ cleanupDock(currentRealKey()); ensureApprovedStamp(); addDockCloseButtons(); },900);
      return res;
    };
  }
  function installWindowActionPatch(){
    if(window.__V456_WINDOW_ACTION_PATCH__ || typeof window.windowAction!=='function') return;
    window.__V456_WINDOW_ACTION_PATCH__=true;
    var old=window.windowAction;
    window.windowAction=function(ev,action){
      var isEntry=ev && ev.target && ev.target.closest && ev.target.closest('#entryModal');
      if(isEntry && action==='compact'){
        var k=currentRealKey(); if(k) removeDockItemsByKey(k);
        var r=old.apply(this, arguments);
        setTimeout(function(){ cleanupDock(''); addDockCloseButtons(); ensureApprovedStamp(); },60);
        setTimeout(function(){ cleanupDock(''); addDockCloseButtons(); },300);
        return r;
      }
      return old.apply(this, arguments);
    };
  }
  function installDockClickPatch(){
    if(window.__V456_DOCK_CLICK_PATCH__) return;
    window.__V456_DOCK_CLICK_PATCH__=true;
    document.addEventListener('click',function(e){
      var item=e.target && e.target.closest && e.target.closest('#v420MacDock .v420-window,#v420MacDock [data-v422-session-id],#v420MacDock [data-v453-session-id],#v420MacDock [data-v454-sid],#v420MacDock [data-v456-key]');
      if(!item || (e.target && e.target.closest && e.target.closest('.v456-close'))) return;
      var itemKey=markDockItem(item);
      // If the same document is already visible, Dock click means minimize it back to Dock, not create another icon.
      if(itemKey && visible() && currentRealKey()===itemKey){
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        if(typeof window.windowAction==='function') window.windowAction({target:modal(),preventDefault:function(){},stopPropagation:function(){}},'compact');
        setTimeout(function(){ cleanupDock(''); addDockCloseButtons(); },80);
      }
    }, true);
  }
  function boot(){ injectCss(); installOpenPatch(); installWindowActionPatch(); installDockClickPatch(); cleanupDock(visible()?currentRealKey():''); ensureApprovedStamp(); addDockCloseButtons(); }
  document.addEventListener('DOMContentLoaded',boot);
  window.addEventListener('load',boot);
  document.addEventListener('click',function(){ setTimeout(boot,80); },true);
  document.addEventListener('change',function(){ setTimeout(function(){ ensureApprovedStamp(); cleanupDock(visible()?currentRealKey():''); addDockCloseButtons(); },100); },true);
  setInterval(boot,700);
})();
