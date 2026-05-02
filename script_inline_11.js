
/* V308_FORCE_GL_VISIBLE - guarantees GL item rows are visible in the New Entry modal */
(function(){
  function bootGl(){
    const sec=document.getElementById('glItemsSection');
    const body=document.getElementById('glItemsBody');
    if(!sec || !body) return;
    sec.style.display='';
    ['entryNetAmount','entryVatAmount','entryTotal'].forEach(id=>{ const el=document.getElementById(id); if(el){ el.readOnly=true; el.classList.add('gl-calculated-total'); }});
    if(!body.children.length && typeof window.vardoGlAddItem==='function') window.vardoGlAddItem({});
    if(typeof window.vardoGlRecalcItems==='function') window.vardoGlRecalcItems();
  }
  const oldOpen=window.openEntryModal;
  if(typeof oldOpen==='function' && !oldOpen.__v308GlForced){
    const wrapped=async function(){ const r=await oldOpen.apply(this, arguments); setTimeout(bootGl,0); setTimeout(bootGl,150); return r; };
    wrapped.__v308GlForced=true;
    window.openEntryModal=wrapped;
  }
  document.addEventListener('click', function(){ setTimeout(bootGl,100); }, true);
  window.v308BootGlItems=bootGl;
})();
