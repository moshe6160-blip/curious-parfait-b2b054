
(function(){
  'use strict';
  if(window.__V448_CLEAN_APPROVAL_BUTTONS_FINAL__) return;
  window.__V448_CLEAN_APPROVAL_BUTTONS_FINAL__=true;
  function qa(s,r=document){ return Array.from(r.querySelectorAll(s)); }
  function clean(){
    const modal=document.getElementById('entryModal');
    if(!modal) return;
    qa('button', modal).forEach(btn=>{
      const t=String(btn.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      if(t==='approve / app order' || t==='pending pre-orders' || t==='pending pre order') btn.remove();
      if(t==='change to order'){
        btn.classList.add('gold','v448-change-to-order-gold');
        btn.style.setProperty('background','linear-gradient(135deg,#f2d09a,#b98745)','important');
        btn.style.setProperty('color','#101010','important');
        btn.style.setProperty('border','1px solid rgba(255,229,190,.75)','important');
        btn.style.setProperty('font-weight','900','important');
      }
    });
  }
  function css(){
    if(document.getElementById('v448CleanApprovalButtonsStyle')) return;
    const st=document.createElement('style');
    st.id='v448CleanApprovalButtonsStyle';
    st.textContent=`
      #entryModal button.v425-approve-btn,#entryModal button.v375-open-pending{display:none!important;}
      #entryModal button.v425-convert-btn,#entryModal button.v448-change-to-order-gold{
        background:linear-gradient(135deg,#f2d09a,#b98745)!important;
        color:#101010!important;
        border:1px solid rgba(255,229,190,.75)!important;
        font-weight:900!important;
      }
    `;
    document.head.appendChild(st);
  }
  function boot(){ css(); clean(); }
  document.addEventListener('DOMContentLoaded',boot);
  window.addEventListener('load',boot);
  document.addEventListener('click',()=>setTimeout(boot,20),true);
  document.addEventListener('input',()=>setTimeout(boot,20),true);
  document.addEventListener('change',()=>setTimeout(boot,20),true);
  setInterval(boot,300);
})();
