(function(){
  'use strict';
  const MARK_START='[[V316_SUPPLIER_ORDER_NO:';
  const MARK_END=']]';
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function unpackSupplierOrder(notes){
    notes = String(notes || '');
    const i = notes.indexOf(MARK_START);
    if(i < 0) return {clean: notes, supplierOrderNo:''};
    const j = notes.indexOf(MARK_END, i + MARK_START.length);
    if(j < 0) return {clean: notes, supplierOrderNo:''};
    const val = notes.slice(i + MARK_START.length, j);
    const clean = (notes.slice(0,i) + notes.slice(j + MARK_END.length)).trim();
    return {clean, supplierOrderNo: decodeURIComponent(val || '')};
  }
  function packSupplierOrder(notes, supplierOrderNo){
    const u = unpackSupplierOrder(notes).clean;
    const v = String(supplierOrderNo || '').trim();
    if(!v) return u;
    return (u + (u ? '\n' : '') + MARK_START + encodeURIComponent(v) + MARK_END).trim();
  }
  function findDescriptionLabel(){
    const input = $('entryDescription');
    return input ? input.closest('label') : null;
  }
  function applyCleanHeaderLayout(){
    const descLabel = findDescriptionLabel();
    if(descLabel){
      descLabel.style.display = 'none';
      descLabel.classList.add('v316-hidden-description-block');
    }
    const orderWrap = $('entryOrderWrap');
    if(orderWrap && !$('entrySupplierOrderNo')){
      const label = document.createElement('label');
      label.id = 'entrySupplierOrderWrap';
      label.innerHTML = '<span>Supplier Order No</span><input class="dark" id="entrySupplierOrderNo" type="text" placeholder="Supplier order number">';
      orderWrap.insertAdjacentElement('afterend', label);
    }
    const descSelect = $('entryDescriptionSelect');
    const descInput = $('entryDescription');
    if(descSelect) descSelect.value = '';
    if(descInput && !String(descInput.value || '').trim()) descInput.value = getFirstItemDescription() || 'Order items';
  }
  function getFirstItemDescription(){
    const tr = document.querySelector('#v309OrderItemsBody tr');
    if(!tr) return '';
    const manual = tr.querySelector('[data-field="manualDescription"]')?.value || '';
    const item = tr.querySelector('[data-field="item"]')?.value || '';
    const desc = tr.querySelector('[data-field="description"]')?.value || '';
    return String(manual || item || desc || '').trim();
  }
  function syncHiddenDescription(){
    const descInput = $('entryDescription');
    if(!descInput) return;
    const first = getFirstItemDescription();
    descInput.value = first || 'Order items';
  }
  function parsePONumber(v){
    const m = String(v || '').match(/\bPO\s*-?\s*(\d+)\b/i);
    return m ? Number(m[1]) || 0 : 0;
  }
  function formatPO(n){ return 'PO-' + String(Math.max(1, Number(n)||1)).padStart(3,'0'); }
  async function getNextPONumber(){
    let max = Number(localStorage.getItem('v316_last_po_number') || 0) || 0;
    try{
      const rows = (typeof getEntries === 'function') ? await getEntries() : [];
      (rows || []).forEach(r => { max = Math.max(max, parsePONumber(r.order_no)); });
    }catch(e){ console.warn('V316 could not scan existing PO numbers', e); }
    return formatPO(max + 1);
  }
  async function ensureAutoOrderNo(){
    const orderEl = $('entryOrderNo');
    if(!orderEl) return;
    const title = document.querySelector('#entryModal .modal-head h3')?.textContent || '';
    const isNew = /New/i.test(title);
    const existing = String(orderEl.value || '').trim();
    if(!isNew) return;
    if(existing && existing !== 'PO-001') return;
    orderEl.value = await getNextPONumber();
  }
  function cleanSupplierOrderFromNotesField(){
    const notesEl = $('entryNotes');
    if(!notesEl) return '';
    const parsed = unpackSupplierOrder(notesEl.value);
    notesEl.value = parsed.clean;
    const supplierEl = $('entrySupplierOrderNo');
    if(supplierEl) supplierEl.value = parsed.supplierOrderNo || '';
    return parsed.supplierOrderNo || '';
  }
  function injectStyle(){
    if($('v316SupplierPOStyle')) return;
    const st = document.createElement('style');
    st.id = 'v316SupplierPOStyle';
    st.textContent = '#entrySupplierOrderWrap{grid-column:auto}.v316-hidden-description-block{display:none!important}#entrySupplierOrderNo{letter-spacing:.2px}@media(max-width:760px){#entrySupplierOrderWrap{grid-column:1/-1}}';
    document.head.appendChild(st);
  }
  function install(){
    if(window.__v316SupplierPOInstalled) return;
    if(typeof window.openEntryModal !== 'function' || typeof window.saveEntry !== 'function') return;
    window.__v316SupplierPOInstalled = true;
    injectStyle();
    const oldOpen = window.openEntryModal;
    window.openEntryModal = async function(){
      const result = await oldOpen.apply(this, arguments);
      applyCleanHeaderLayout();
      cleanSupplierOrderFromNotesField();
      await ensureAutoOrderNo();
      syncHiddenDescription();
      return result;
    };
    ['openOrderModal','openInvoiceModal','openDepositModal'].forEach(name => {
      if(typeof window[name] === 'function'){
        const old = window[name];
        window[name] = async function(){
          const result = await old.apply(this, arguments);
          applyCleanHeaderLayout();
          cleanSupplierOrderFromNotesField();
          await ensureAutoOrderNo();
          syncHiddenDescription();
          return result;
        };
      }
    });
    const oldSave = window.saveEntry;
    window.saveEntry = async function(){
      applyCleanHeaderLayout();
      syncHiddenDescription();
      const notesEl = $('entryNotes');
      if(notesEl) notesEl.value = packSupplierOrder(notesEl.value, $('entrySupplierOrderNo')?.value || '');
      const orderNo = $('entryOrderNo')?.value || '';
      const n = parsePONumber(orderNo);
      if(n) localStorage.setItem('v316_last_po_number', String(Math.max(Number(localStorage.getItem('v316_last_po_number')||0)||0, n)));
      return await oldSave.apply(this, arguments);
    };
    setInterval(function(){
      if($('entryModal')?.classList.contains('show')){
        applyCleanHeaderLayout();
        syncHiddenDescription();
      }
    }, 600);
  }
  const timer = setInterval(function(){ install(); if(window.__v316SupplierPOInstalled) clearInterval(timer); }, 200);
})();
