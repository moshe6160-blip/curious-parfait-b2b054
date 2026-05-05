(function(){
  'use strict';
  const $ = id => document.getElementById(id);
  function parseDEP(v){ const m=String(v||'').match(/\bDEP\s*-?\s*(\d+)\b/i); return m ? (Number(m[1])||0) : 0; }
  function formatDEP(n){ return 'DEP-' + String(Math.max(1, Number(n)||1)).padStart(3,'0'); }
  async function getNextDEP(){
    let max = Number(localStorage.getItem('v334_last_dep_number') || 0) || 0;
    try{
      const rows = (typeof window.getEntries === 'function') ? await window.getEntries() : [];
      (rows || []).forEach(r => { max = Math.max(max, parseDEP(r.order_no), parseDEP(r.invoice_no), parseDEP(r.notes)); });
    }catch(e){ console.warn('V334 DEP scan failed', e); }
    return formatDEP(max + 1);
  }
  function mode(){ return String($('entryMode')?.value || '').toLowerCase(); }
  function type(){ return String($('entryType')?.value || '').toLowerCase(); }
  function isDepositMode(){ return mode() === 'deposit' || type() === 'deposit'; }
  async function applyDepositNumberUI(){
    const orderWrap = $('entryOrderWrap');
    const orderEl = $('entryOrderNo');
    const label = $('entryOrderLabel');
    if(!orderEl || !orderWrap) return;
    if(isDepositMode()){
      if(label) label.textContent = 'Deposit No';
      orderEl.placeholder = 'DEP-001';
      const title = document.querySelector('#entryModal .modal-head h3')?.textContent || '';
      const isNew = /New/i.test(title);
      const current = String(orderEl.value || '').trim();
      if(isNew && (!current || /^PO-/i.test(current))) orderEl.value = await getNextDEP();
      orderWrap.classList.add('field-highlight');
      const invoice = $('entryInvoiceNo');
      if(invoice) invoice.value = '';
    } else {
      if(label) label.textContent = 'Order No';
      orderEl.placeholder = 'PO-001';
      if(/^DEP-/i.test(String(orderEl.value||''))) orderEl.value = '';
    }
  }
  function installDiscountPercentGuard(){
    document.addEventListener('input', function(e){
      const el = e.target;
      if(!el || !el.matches || !el.matches('#v309OrderItemsBody [data-field="discount"]')) return;
      const n = Number(el.value || 0);
      if(n > 100) el.value = '100';
      if(n < 0) el.value = '0';
    }, true);
  }
  function injectStyle(){
    if($('v334FixStyle')) return;
    const st=document.createElement('style');
    st.id='v334FixStyle';
    st.textContent = '#v309OrderItemsBody [data-field="discount"]{padding-right:6px!important} #v309OrderItemsBody [data-field="discount"]::placeholder{opacity:.65}';
    document.head.appendChild(st);
  }
  function install(){
    if(window.__v334DepositDiscountFixInstalled) return;
    if(typeof window.openEntryModal !== 'function' || typeof window.saveEntry !== 'function') return;
    window.__v334DepositDiscountFixInstalled = true;
    injectStyle();
    installDiscountPercentGuard();
    const oldOpen = window.openEntryModal;
    window.openEntryModal = async function(){
      const r = await oldOpen.apply(this, arguments);
      await applyDepositNumberUI();
      return r;
    };
    ['openDepositModal','openOrderModal','openInvoiceModal'].forEach(name=>{
      if(typeof window[name] === 'function'){
        const old = window[name];
        window[name] = async function(){
          const r = await old.apply(this, arguments);
          await applyDepositNumberUI();
          return r;
        };
      }
    });
    document.addEventListener('change', function(e){
      if(e.target && (e.target.id === 'entryType' || e.target.id === 'entryMode')) applyDepositNumberUI();
    }, true);
    const oldSave = window.saveEntry;
    window.saveEntry = async function(){
      await applyDepositNumberUI();
      if(isDepositMode()){
        const orderEl = $('entryOrderNo');
        if(orderEl && !/^DEP-/i.test(String(orderEl.value||''))) orderEl.value = await getNextDEP();
      }
      const depNo = $('entryOrderNo')?.value || '';
      const r = await oldSave.apply(this, arguments);
      const depNum = parseDEP(depNo);
      if(depNum) localStorage.setItem('v334_last_dep_number', String(Math.max(Number(localStorage.getItem('v334_last_dep_number')||0)||0, depNum)));
      return r;
    };
    setInterval(function(){ if($('entryModal')?.classList.contains('show')) applyDepositNumberUI(); }, 700);
  }
  const timer=setInterval(function(){ install(); if(window.__v334DepositDiscountFixInstalled) clearInterval(timer); }, 200);
})();
