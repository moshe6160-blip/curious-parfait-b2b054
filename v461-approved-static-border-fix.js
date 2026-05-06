/* V461 APPROVED stamp static border fix
   Safe visual-only patch on top of V460/V459.
   Goal: keep APPROVED text exactly as is, but stop the green border from flashing.
   Does not touch login, DB, numbering, items, approval workflow, print logic, or dock logic. */
(function(){
  'use strict';
  if(window.__V461_APPROVED_STATIC_BORDER_FIX__) return;
  window.__V461_APPROVED_STATIC_BORDER_FIX__ = true;

  function q(s,r){return (r||document).querySelector(s);}
  function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}

  function injectCss(){
    if(q('#v461ApprovedStaticBorderCss')) return;
    var st=document.createElement('style');
    st.id='v461ApprovedStaticBorderCss';
    st.textContent =
      '/* Hide older duplicate stamp layers completely. They were the source of the border flash. */\n'+
      '.v425-approved-stamp:not(.v459-approved-stamp),.v457-approved-stamp:not(.v459-approved-stamp){display:none!important;opacity:0!important;visibility:hidden!important;border:0!important;box-shadow:none!important;animation:none!important;transition:none!important;}\n'+
      '/* The active APPROVED stamp: one static paint layer, no glow/repaint/animation. */\n'+
      '.v459-approved-stamp{display:block!important;visibility:visible!important;opacity:1!important;position:absolute!important;right:24px!important;top:86px!important;z-index:2147483000!important;transform:rotate(-12deg)!important;border:3px solid #189150!important;outline:0!important;border-radius:10px!important;padding:8px 13px!important;color:#26c66e!important;background:transparent!important;box-shadow:none!important;text-shadow:none!important;filter:none!important;mix-blend-mode:normal!important;animation:none!important;transition:none!important;will-change:auto!important;backface-visibility:hidden!important;contain:paint!important;font:1000 24px/1 Arial,Helvetica,sans-serif!important;letter-spacing:2px!important;text-transform:uppercase!important;pointer-events:none!important;}\n'+
      '.modal-box .v459-approved-stamp *{animation:none!important;transition:none!important;}\n'+
      '@media(max-width:680px){.v459-approved-stamp{right:16px!important;top:76px!important;font-size:18px!important;padding:7px 10px!important;}}\n'+
      '@media print{.v459-approved-stamp{display:block!important;position:fixed!important;right:28mm!important;top:34mm!important;color:#198f50!important;border-color:#198f50!important;background:transparent!important;box-shadow:none!important;mix-blend-mode:normal!important;opacity:1!important;visibility:visible!important;}}';
    document.head.appendChild(st);
  }

  function cleanupDuplicateStamps(){
    var modal=document.getElementById('entryModal');
    var root=modal || document;
    qa('.v425-approved-stamp:not(.v459-approved-stamp),.v457-approved-stamp:not(.v459-approved-stamp)', root).forEach(function(el){
      try{ el.remove(); }catch(e){ try{ el.style.display='none'; }catch(_e){} }
    });
    var stamp=q('.v459-approved-stamp', root);
    if(stamp){
      stamp.style.border='3px solid #189150';
      stamp.style.boxShadow='none';
      stamp.style.filter='none';
      stamp.style.mixBlendMode='normal';
      stamp.style.animation='none';
      stamp.style.transition='none';
    }
  }

  function boot(){ injectCss(); cleanupDuplicateStamps(); }
  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('load', boot);
  document.addEventListener('click', function(){ setTimeout(boot,60); }, true);
  document.addEventListener('change', function(){ setTimeout(boot,60); }, true);
  try{
    var mo=new MutationObserver(function(muts){
      for(var i=0;i<muts.length;i++){
        if(muts[i].addedNodes && muts[i].addedNodes.length){ setTimeout(boot,20); break; }
      }
    });
    mo.observe(document.documentElement,{childList:true,subtree:true});
  }catch(e){}
  boot();
})();
