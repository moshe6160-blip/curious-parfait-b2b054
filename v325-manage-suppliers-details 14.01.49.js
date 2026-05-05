(function(){
  'use strict';
  const KEY = 'vp_supplier_details_v325';
  const FIELDS = ['contactPerson','phone','email','address','contractorName'];
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])); }
  function readMap(){ try{ return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }catch(e){ return {}; } }
  function writeMap(map){ localStorage.setItem(KEY, JSON.stringify(map || {})); }
  function getSupplierList(){
    try{
      if(typeof window.getStoredList === 'function') return window.getStoredList('supplier') || [];
    }catch(e){}
    return Array.from(document.querySelectorAll('#removeSupplierSelect option')).map(o=>o.value).filter(Boolean);
  }
  function detail(name){ return readMap()[String(name||'').trim()] || {}; }
  function saveDetail(name, d){
    name = String(name || '').trim();
    if(!name) return;
    const map = readMap();
    map[name] = {
      contactPerson: String(d.contactPerson || '').trim(),
      phone: String(d.phone || '').trim(),
      email: String(d.email || '').trim(),
      address: String(d.address || '').trim(),
      contractorName: String(d.contractorName || '').trim()
    };
    writeMap(map);
  }
  function removeDetail(name){
    name = String(name || '').trim();
    if(!name) return;
    const map = readMap();
    delete map[name];
    writeMap(map);
  }
  window.getSupplierDetails = function(name){ return detail(name); };
  window.setSupplierDetails = function(name, data){ saveDetail(name, data || {}); };

  function val(id){ return String($(id)?.value || '').trim(); }
  function setVal(id, v){ const el=$(id); if(el) el.value = v || ''; }
  function supplierOptions(selected){
    return '<option value="">Select supplier</option>' + getSupplierList().map(s => '<option value="'+esc(s)+'" '+(String(s)===String(selected||'')?'selected':'')+'>'+esc(s)+'</option>').join('');
  }
  function injectPanel(){
    const modal = $('listsModal');
    if(!modal || !modal.classList.contains('show')) return;
    const boxes = Array.from(modal.querySelectorAll('.mini-box'));
    const box = boxes.find(b => /Suppliers/i.test(b.querySelector('.mini-title')?.textContent || ''));
    if(!box || $('v325SupplierDetailsPanel')) return;
    const panel = document.createElement('div');
    panel.id = 'v325SupplierDetailsPanel';
    panel.innerHTML = `
      <div class="v325-sup-title">Supplier Full Details</div>
      <div class="v325-sup-grid">
        <input class="dark" id="v325NewContactPerson" placeholder="Contact Person">
        <input class="dark" id="v325NewPhone" placeholder="Phone">
        <input class="dark" id="v325NewEmail" placeholder="Email">
        <input class="dark" id="v325NewContractorName" placeholder="Contractor Name">
        <textarea class="dark" id="v325NewAddress" placeholder="Address"></textarea>
      </div>
      <div class="helper v325-help">Fill these before pressing Add to save full supplier details.</div>
      <div class="v325-edit-box">
        <select class="dark" id="v325SupplierDetailSelect" onchange="window.v325LoadSupplierDetails()">${supplierOptions('')}</select>
        <div class="v325-sup-grid">
          <input class="dark" id="v325EditContactPerson" placeholder="Contact Person">
          <input class="dark" id="v325EditPhone" placeholder="Phone">
          <input class="dark" id="v325EditEmail" placeholder="Email">
          <input class="dark" id="v325EditContractorName" placeholder="Contractor Name">
          <textarea class="dark" id="v325EditAddress" placeholder="Address"></textarea>
        </div>
        <button class="ghost" type="button" onclick="window.v325SaveSupplierDetails()">Save Supplier Details</button>
      </div>
    `;
    const vatRow = $('supplierVatSelect')?.closest('.remove-row');
    if(vatRow && vatRow.parentNode === box) vatRow.insertAdjacentElement('afterend', panel);
    else box.appendChild(panel);
  }
  function refreshSelect(){ const sel=$('v325SupplierDetailSelect'); if(sel){ const cur=sel.value; sel.innerHTML=supplierOptions(cur); } }
  window.v325LoadSupplierDetails = function(){
    const name = val('v325SupplierDetailSelect');
    const d = detail(name);
    setVal('v325EditContactPerson', d.contactPerson);
    setVal('v325EditPhone', d.phone);
    setVal('v325EditEmail', d.email);
    setVal('v325EditAddress', d.address);
    setVal('v325EditContractorName', d.contractorName);
  };
  window.v325SaveSupplierDetails = function(){
    const name = val('v325SupplierDetailSelect');
    if(!name) return alert('Select supplier first.');
    saveDetail(name, {
      contactPerson: val('v325EditContactPerson'),
      phone: val('v325EditPhone'),
      email: val('v325EditEmail'),
      address: val('v325EditAddress'),
      contractorName: val('v325EditContractorName')
    });
    alert('Supplier details saved.');
  };
  function wrapListFunctions(){
    if(typeof window.addQuickListItem === 'function' && !window.addQuickListItem.__v325Wrapped){
      const oldAdd = window.addQuickListItem;
      const wrapped = async function(type){
        if(type === 'supplier'){
          const supplierName = val('newSupplierInput');
          const data = {
            contactPerson: val('v325NewContactPerson'),
            phone: val('v325NewPhone'),
            email: val('v325NewEmail'),
            address: val('v325NewAddress'),
            contractorName: val('v325NewContractorName')
          };
          if(supplierName && Object.values(data).some(Boolean)) saveDetail(supplierName, data);
        }
        const res = await oldAdd.apply(this, arguments);
        setTimeout(()=>{ injectPanel(); refreshSelect(); }, 120);
        return res;
      };
      wrapped.__v325Wrapped = true;
      window.addQuickListItem = wrapped;
    }
    if(typeof window.removeSelectedListItem === 'function' && !window.removeSelectedListItem.__v325Wrapped){
      const oldRemove = window.removeSelectedListItem;
      const wrappedRemove = async function(type, selectId){
        const supplierName = type === 'supplier' ? String(document.getElementById(selectId)?.value || '').trim() : '';
        const res = await oldRemove.apply(this, arguments);
        if(type === 'supplier' && supplierName) removeDetail(supplierName);
        setTimeout(()=>{ injectPanel(); refreshSelect(); }, 120);
        return res;
      };
      wrappedRemove.__v325Wrapped = true;
      window.removeSelectedListItem = wrappedRemove;
    }
  }
  function wrapShareButtons(){
    if(typeof window.emailEntryOrder === 'function' && !window.emailEntryOrder.__v325Wrapped){
      const oldEmail = window.emailEntryOrder;
      const wrappedEmail = function(){
        const supplier = String($('entrySupplier')?.value || '').trim();
        const email = detail(supplier).email || '';
        if(!email) return oldEmail.apply(this, arguments);
        const oldHref = window.location.href;
        oldEmail.apply(this, arguments);
        setTimeout(()=>{
          const href = String(window.location.href || '');
          if(href.startsWith('mailto:?')) window.location.href = href.replace('mailto:?', 'mailto:' + encodeURIComponent(email) + '?');
          else if(oldHref !== href && href.startsWith('mailto:')) window.location.href = href;
        }, 0);
      };
      wrappedEmail.__v325Wrapped = true;
      window.emailEntryOrder = wrappedEmail;
    }
    if(typeof window.whatsappEntryOrder === 'function' && !window.whatsappEntryOrder.__v325Wrapped){
      const oldWa = window.whatsappEntryOrder;
      const wrappedWa = function(){
        const supplier = String($('entrySupplier')?.value || '').trim();
        const phoneRaw = detail(supplier).phone || '';
        const phone = String(phoneRaw).replace(/[^0-9]/g,'');
        if(!phone) return oldWa.apply(this, arguments);
        const oldOpen = window.open;
        window.open = function(url, target){
          try{
            if(String(url).startsWith('https://wa.me/?text=')){
              url = String(url).replace('https://wa.me/?text=', 'https://wa.me/' + phone + '?text=');
            }
          }catch(e){}
          window.open = oldOpen;
          return oldOpen.call(window, url, target);
        };
        try{ return oldWa.apply(this, arguments); } finally { setTimeout(()=>{ window.open = oldOpen; }, 50); }
      };
      wrappedWa.__v325Wrapped = true;
      window.whatsappEntryOrder = wrappedWa;
    }
  }
  function injectStyle(){
    if($('v325SupplierDetailsStyle')) return;
    const st = document.createElement('style');
    st.id = 'v325SupplierDetailsStyle';
    st.textContent = `
      #v325SupplierDetailsPanel{margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.12)}
      .v325-sup-title{font-size:13px;font-weight:800;color:#f0d2a3;margin-bottom:8px;letter-spacing:.2px}
      .v325-sup-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
      .v325-sup-grid textarea{grid-column:1/-1;min-height:62px;resize:vertical}
      .v325-edit-box{margin-top:12px;padding:10px;border:1px solid rgba(255,255,255,.10);border-radius:14px;background:rgba(255,255,255,.025)}
      .v325-edit-box button{margin-top:8px;width:100%}
      .v325-help{font-size:11px;margin-top:6px;opacity:.78}
      @media(max-width:760px){.v325-sup-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(st);
  }
  function install(){ injectStyle(); wrapListFunctions(); wrapShareButtons(); injectPanel(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
  setInterval(install, 650);
})();
