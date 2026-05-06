
(function(){
  'use strict';
  if(window.__V428_CLEAN_BUTTONS_WINDOW_FIX__) return;
  window.__V428_CLEAN_BUTTONS_WINDOW_FIX__=true;
  var z=50000;
  function q(s,r){return (r||document).querySelector(s)}
  function qa(s,r){return Array.from((r||document).querySelectorAll(s))}
  function txt(el){return String(el&&el.textContent||'').replace(/\s+/g,' ').trim()}
  function setStatus(v){
    var sel=q('#entryStatus');
    if(sel){
      if(!qa('option',sel).some(function(o){return o.value===v})){var o=document.createElement('option');o.value=v;o.textContent=v;sel.appendChild(o)}
      sel.value=v; sel.dispatchEvent(new Event('input',{bubbles:true})); sel.dispatchEvent(new Event('change',{bubbles:true}));
    }
  }
  window.v428ReturnToPreOrder=function(){
    setStatus('Pending Pre-Order');
    var stamp=q('.v425-approved-stamp'); if(stamp) stamp.remove();
    if(typeof window.toast==='function') window.toast('Returned to Pre-Order');
  };
  function cleanOrderButtons(){
    var modal=q('#entryModal'); if(!modal || !modal.classList.contains('show')) return;
    var actions=q('.modal-actions',modal)||q('.modal-footer',modal)||q('.window-actions',modal); if(!actions) return;
    var buttons=qa('button',actions);
    var approveBtns=buttons.filter(function(b){return /approve\s*\/?\s*app\s*order|approve\s*order/i.test(txt(b))});
    if(approveBtns.length>1){
      // keep the right/gold approve button, convert the left/first duplicate to Return To Pre-Order
      var left=approveBtns[0];
      left.textContent='Return To Pre-Order';
      left.classList.remove('v425-approve-btn');
      left.classList.add('soft','v428-return-preorder-btn');
      left.onclick=window.v428ReturnToPreOrder;
      approveBtns.slice(1,-1).forEach(function(b){b.remove()});
    } else if(approveBtns.length===1 && /approve\s*\/?\s*app\s*order/i.test(txt(approveBtns[0])) && q('.v425-approve-btn',actions)){
      // if the injected left button is the only visible duplicate candidate, make it return action
      var b=approveBtns[0]; b.textContent='Return To Pre-Order'; b.onclick=window.v428ReturnToPreOrder; b.classList.add('v428-return-preorder-btn');
    }
    var convert=buttons.find(function(b){return /change\s+to\s+order/i.test(txt(b))});
    if(convert) convert.title='Change approved/pre-order document to Order status';
  }
  function enableWindowLayers(){
    qa('#entryModal.show,.modal.show,[data-window].show,.vard-window.show,.app-window.show').forEach(function(w){
      if(w.__v428LayerReady) return; w.__v428LayerReady=true;
      w.style.zIndex=String(++z);
      w.addEventListener('mousedown',function(){w.style.zIndex=String(++z)},true);
      w.addEventListener('touchstart',function(){w.style.zIndex=String(++z)},true);
    });
  }
  function dockLabels(){
    qa('#v420MacDock .v420-window,#v420MacDock button').forEach(function(b){
      if(!/v420-window/.test(b.className||'') && !b.getAttribute('data-window-id')) return;
      var title=b.getAttribute('title')||b.getAttribute('aria-label')||txt(b)||'Window';
      title=title.replace(/^(new|draft)\s+/i,'').trim();
      var sp=q('.v428-dock-name',b); if(!sp){sp=document.createElement('span');sp.className='v428-dock-name';b.appendChild(sp)}
      sp.textContent=title.length>14?title.slice(0,13)+'…':title;
    });
  }
  function css(){
    if(q('#v428Style')) return;
    var st=document.createElement('style'); st.id='v428Style'; st.textContent='\
      .v428-return-preorder-btn{background:rgba(20,20,20,.55)!important;color:#f7d8a6!important;border:1px solid rgba(247,216,166,.35)!important;font-weight:900!important}\
      .v428-dock-name{position:absolute!important;left:50%!important;bottom:2px!important;transform:translateX(-50%)!important;max-width:70px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font:800 8px -apple-system,BlinkMacSystemFont,Segoe UI,Arial!important;color:#f7d8a6!important;text-shadow:0 1px 5px #000!important;pointer-events:none!important}\
      #v420MacDock .v420-window{position:relative!important;padding-bottom:12px!important}\
      #v420MacDock .v420-separator,.v428-dock-separator{width:1px!important;height:38px!important;background:rgba(247,216,166,.38)!important;margin:0 8px!important;border-radius:999px!important}\
    ';
    document.head.appendChild(st);
  }
  function boot(){css(); cleanOrderButtons(); enableWindowLayers(); dockLabels();}
  document.addEventListener('DOMContentLoaded',boot);
  window.addEventListener('load',boot);
  document.addEventListener('click',function(){setTimeout(boot,80)},true);
  document.addEventListener('input',function(){setTimeout(boot,80)},true);
  document.addEventListener('change',function(){setTimeout(boot,80)},true);
  setInterval(boot,700);
})();
