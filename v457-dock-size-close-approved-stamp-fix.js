/* V457 Dock size/close + robust APPROVED stamp
   Base: V456. UI-only patch: does not change save/items/VAT/numbering/approval logic.
   Fixes:
   1) Dock icons were too large for the dock window.
   2) Close X on dock window items was too small / hard to click.
   3) Green APPROVED stamp was not appearing on App order documents opened from the list/dock. */
(function(){
  'use strict';
  if(window.__V457_DOCK_SIZE_CLOSE_APPROVED_STAMP_FIX__) return;
  window.__V457_DOCK_SIZE_CLOSE_APPROVED_STAMP_FIX__ = true;

  var q=function(s,r){return (r||document).querySelector(s);};
  var qa=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
  var clean=function(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();};
  var low=function(v){return clean(v).toLowerCase();};
  var esc=function(v){
    v=String(v||'');
    try{return CSS.escape(v);}catch(e){return v.replace(/["\\]/g,'\\$&');}
  };
  function modal(){return document.getElementById('entryModal');}
  function dock(){return document.getElementById('v420MacDock');}
  function val(id){var el=document.getElementById(id); return clean(el && el.value);}
  function visible(){var m=modal(); return !!(m && m.classList.contains('show') && !m.classList.contains('v420-modal-minimized'));}
  function orderNo(){return val('entryOrderNo') || clean(q('#entryModal [name="order_no"]') && q('#entryModal [name="order_no"]').value);}
  function currentId(){var m=modal(); return clean((m && (m.dataset.v422EditingId || m.dataset.v453EditingId || m.dataset.v451EntryId || m.dataset.v375EntryId)) || window.editingId || '');}
  function textOf(el){return clean(el && (el.innerText || el.textContent || ''));}

  function injectCss(){
    if(q('#v457DockApprovedStyle')) return;
    var st=document.createElement('style');
    st.id='v457DockApprovedStyle';
    st.textContent =
      /* smaller dock + smaller icons */
      '#v420MacDock{min-height:54px!important;padding:7px 11px!important;gap:7px!important;border-radius:25px!important;align-items:center!important;overflow-y:visible!important;}\n'+
      '#v420MacDock .v420-dock-item{min-width:42px!important;width:42px!important;height:42px!important;border-radius:15px!important;font-size:20px!important;flex:0 0 42px!important;padding:0!important;}\n'+
      '#v420MacDock .v420-window{padding-bottom:9px!important;}\n'+
      '#v420MacDock .v425-dock-label,#v420MacDock .v428-dock-name{font-size:7px!important;max-width:52px!important;bottom:1px!important;}\n'+
      '#v420MacDock .v420-badge{min-width:17px!important;height:17px!important;font-size:9px!important;right:-5px!important;top:-6px!important;padding:0 4px!important;}\n'+
      '#v420MacDock .v420-dock-separator{height:34px!important;margin:0 3px!important;}\n'+
      '#v420MacDock .v420-dock-item:hover,#v420MacDock .v420-dock-item:active{transform:translateY(-7px) scale(1.10)!important;}\n'+
      /* larger clickable X; visible on hover/focus and always visible on touch */
      '#v420MacDock .v456-close,#v420MacDock .v457-close{position:absolute!important;right:-7px!important;top:-9px!important;width:24px!important;height:24px!important;min-width:24px!important;min-height:24px!important;border-radius:50%!important;border:1px solid rgba(255,255,255,.45)!important;background:#c14b43!important;color:#fff!important;font:900 15px/22px Arial,Helvetica,sans-serif!important;text-align:center!important;display:none;z-index:2147483600!important;box-shadow:0 5px 14px rgba(0,0,0,.45)!important;cursor:pointer!important;pointer-events:auto!important;user-select:none!important;}\n'+
      '#v420MacDock .v420-window:hover .v456-close,#v420MacDock .v420-window:hover .v457-close,#v420MacDock .v420-window:focus .v456-close,#v420MacDock .v420-window:focus .v457-close{display:block!important;}\n'+
      '#v420MacDock .v456-close:active,#v420MacDock .v457-close:active{transform:scale(.92)!important;}\n'+
      '.v425-approved-stamp,.v457-approved-stamp{position:absolute!important;right:24px!important;top:86px!important;z-index:60!important;transform:rotate(-12deg)!important;border:3px solid rgba(24,145,80,.88)!important;color:rgba(38,198,110,.96)!important;border-radius:10px!important;padding:8px 13px!important;font:1000 24px/1 Arial,Helvetica,sans-serif!important;letter-spacing:2px!important;text-transform:uppercase!important;pointer-events:none!important;mix-blend-mode:screen!important;box-shadow:0 0 0 1px rgba(255,255,255,.12) inset,0 0 18px rgba(24,145,80,.20)!important;}\n'+
      '@media(max-width:680px){#v420MacDock{min-height:50px!important;padding:6px 9px!important;gap:6px!important;border-radius:22px!important;}#v420MacDock .v420-dock-item{min-width:38px!important;width:38px!important;height:38px!important;flex-basis:38px!important;border-radius:14px!important;font-size:18px!important;}#v420MacDock .v456-close,#v420MacDock .v457-close{display:block!important;width:22px!important;height:22px!important;line-height:20px!important;font-size:14px!important;right:-7px!important;top:-9px!important}.v425-approved-stamp,.v457-approved-stamp{right:16px!important;top:76px!important;font-size:18px!important;padding:7px 10px!important;}}\n'+
      '@media print{.v425-approved-stamp,.v457-approved-stamp{display:block!important;position:fixed!important;right:28mm!important;top:34mm!important;color:#198f50!important;border-color:#198f50!important;mix-blend-mode:normal!important;}}';
    document.head.appendChild(st);
  }

  function labelFromText(t){
    t=low(t);
    if(!t) return '';
    if(t.indexOf('app order')>=0 || t.indexOf('approved')>=0 || t.indexOf('מאושר')>=0) return 'App order';
    if(t.indexOf('order sent')>=0 || t.indexOf('sent to supplier')>=0) return 'Order';
    if(t.indexOf('pre-order')>=0 || t.indexOf('pre order')>=0 || t.indexOf('pending approval')>=0) return 'Pre-Order';
    return '';
  }

  function inferStatusFromList(){
    var no=orderNo(), id=currentId();
    if(!no && !id) return '';
    var candidates=qa('tr,.order-row,.list-row,.table-row,.card,.dashboard-row,[onclick*="openEntryModal"]');
    var found='';
    candidates.some(function(el){
      if(el.closest && el.closest('#entryModal')) return false;
      var tx=textOf(el);
      if(!tx) return false;
      var oc=clean(el.getAttribute && el.getAttribute('onclick'));
      var matchNo = no && tx.indexOf(no)>=0;
      var matchId = id && oc.indexOf(id)>=0;
      if(!matchNo && !matchId) return false;
      var lab=labelFromText(tx);
      if(lab){ found=lab; return true; }
      return false;
    });
    return found;
  }

  function currentStatusLabel(){
    var med=q('#entryModal .v432-status-medal');
    var medalText=clean(med && med.textContent);
    var fromMedal=labelFromText(medalText);
    if(fromMedal && fromMedal!=='Pre-Order') return fromMedal;

    var fromForm=labelFromText(val('entryStatus')+' '+val('entryNotes'));
    if(fromForm && fromForm!=='Pre-Order') return fromForm;

    var fromList=inferStatusFromList();
    if(fromList) return fromList;

    return fromMedal || fromForm || '';
  }

  function ensureApprovedStamp(){
    var m=modal(); if(!m || !m.classList.contains('show')) return;
    var box=q('.modal-box',m) || m;
    var label=currentStatusLabel();
    var approved = low(label).indexOf('app order')>=0 || low(label).indexOf('approved')>=0 || low(label)==='order';
    var stamp=q('.v425-approved-stamp,.v457-approved-stamp',box);
    if(approved){
      if(!stamp){ stamp=document.createElement('div'); stamp.className='v425-approved-stamp v457-approved-stamp'; stamp.textContent='APPROVED'; box.appendChild(stamp); }
      stamp.style.display='block';
    }else if(stamp){
      stamp.remove();
    }
  }

  function dockItemKey(item){
    if(!item) return '';
    return clean(item.dataset.v456Key || item.dataset.v454Sid || item.dataset.v453SessionId || item.dataset.v422SessionId || item.dataset.v420WindowId || item.title || item.textContent);
  }
  function closeDockItem(item){
    if(!item) return;
    var key=dockItemKey(item);
    var d=dock();
    if(d && key){
      qa('.v420-window,[data-v456-key],[data-v454-sid],[data-v453-session-id],[data-v422-session-id]',d).forEach(function(x){
        if(dockItemKey(x)===key){ try{x.remove();}catch(e){x.style.display='none';} }
      });
    }else{
      try{item.remove();}catch(e){item.style.display='none';}
    }
    var sep=d && q('.v420-dock-separator',d);
    if(d && sep && !q('.v420-window,[data-v456-key],[data-v454-sid],[data-v453-session-id],[data-v422-session-id]',d)) sep.remove();
  }
  function addCloseButtons(){
    var d=dock(); if(!d) return;
    qa('.v420-window,[data-v456-key],[data-v454-sid],[data-v453-session-id],[data-v422-session-id]',d).forEach(function(item){
      if(!item.classList.contains('v420-window')) item.classList.add('v420-window');
      if(q('.v457-close',item)) return;
      var old=q('.v456-close',item); if(old) old.remove();
      var x=document.createElement('span');
      x.className='v457-close';
      x.textContent='×';
      x.title='Close';
      item.appendChild(x);
    });
  }

  function installCloseCapture(){
    if(window.__V457_CLOSE_CAPTURE__) return;
    window.__V457_CLOSE_CAPTURE__=true;
    document.addEventListener('pointerdown',function(e){
      var x=e.target && e.target.closest && e.target.closest('#v420MacDock .v457-close,#v420MacDock .v456-close');
      if(!x) return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      closeDockItem(x.closest('.v420-window,[data-v456-key],[data-v454-sid],[data-v453-session-id],[data-v422-session-id]'));
    },true);
    document.addEventListener('click',function(e){
      var x=e.target && e.target.closest && e.target.closest('#v420MacDock .v457-close,#v420MacDock .v456-close');
      if(!x) return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      closeDockItem(x.closest('.v420-window,[data-v456-key],[data-v454-sid],[data-v453-session-id],[data-v422-session-id]'));
    },true);
  }

  function boot(){
    injectCss();
    installCloseCapture();
    addCloseButtons();
    ensureApprovedStamp();
  }

  document.addEventListener('DOMContentLoaded',boot);
  window.addEventListener('load',boot);
  document.addEventListener('click',function(){setTimeout(boot,60); setTimeout(boot,260);},true);
  document.addEventListener('change',function(){setTimeout(ensureApprovedStamp,60);},true);
  document.addEventListener('input',function(){setTimeout(ensureApprovedStamp,80);},true);
  setInterval(boot,650);
})();
