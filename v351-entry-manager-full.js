/* V351 Entry Manager Full - central source of truth for entry type, modal title and field labels.
   Additive only: does not change save/login/order/DN/invoice logic. */
(function(){
  if(window.__V351_ENTRY_MANAGER_FULL__) return;
  window.__V351_ENTRY_MANAGER_FULL__ = true;

  const TYPE = {
    ORDER: 'order',
    INVOICE: 'invoice',
    DN: 'delivery_note',
    DEPOSIT: 'deposit'
  };

  const TITLES = {
    order: { n:'New Order', e:'Edit Order', sub:'Create or edit supplier purchase order.' },
    invoice: { n:'New Invoice', e:'Edit Invoice', sub:'Create or edit supplier invoice.' },
    delivery_note: { n:'New Delivery Note', e:'Edit Delivery Note', sub:'Record delivery note against an order.' },
    deposit: { n:'New Deposit / Advance', e:'Edit Deposit / Advance', sub:'Record supplier advance / deposit. This is not an invoice.' }
  };

  function norm(t){
    const s = String(t || '').toLowerCase().trim();
    if(['dn','delivery','delivery_note','deliverynote','delivery note'].includes(s)) return TYPE.DN;
    if(['dep','deposit','advance','payment_advance'].includes(s)) return TYPE.DEPOSIT;
    if(['po','purchase','purchase_order','purchase order','order'].includes(s)) return TYPE.ORDER;
    if(['inv','invoice'].includes(s)) return TYPE.INVOICE;
    return '';
  }

  function rowType(row){
    const entryType = norm(row?.entry_type || row?.type || '');
    const orderNo = String(row?.order_no || row?.reference || '').trim();
    const invoiceNo = String(row?.invoice_no || '').trim();
    const notes = String(row?.notes || '');
    if(entryType === TYPE.DEPOSIT || /^DEP-/i.test(orderNo) || /deposit|advance/i.test(String(row?.description||''))) return TYPE.DEPOSIT;
    if(/^DN-/i.test(invoiceNo) || /\[\[DN:/i.test(notes) || /delivery note/i.test(String(row?.process||''))) return TYPE.DN;
    if(invoiceNo) return TYPE.INVOICE;
    if(orderNo) return TYPE.ORDER;
    return TYPE.INVOICE;
  }

  function setText(id, txt){ const el=document.getElementById(id); if(el) el.textContent = txt; }
  function setValue(id, val){ const el=document.getElementById(id); if(el) el.value = val; }
  function showWrap(id, show){ const el=document.getElementById(id); if(el) el.classList.toggle('field-hidden', !show); }
  function setLabel(wrapId, labelId, text){
    const direct = document.getElementById(labelId);
    if(direct) { direct.textContent = text; return; }
    const wrap = document.getElementById(wrapId);
    const span = wrap?.querySelector('span, label, .field-label');
    if(span) span.textContent = text;
  }

  function patch(type, isEdit){
    type = norm(type) || TYPE.INVOICE;
    const modal = document.getElementById('entryModal');
    if(modal) modal.dataset.entryType = type;
    window.currentEntryType = type;
    window.__currentEntryType = type;

    const m = document.getElementById('entryMode');
    if(m) m.value = type;

    const ttl = document.getElementById('entryModalTitle');
    const cfg = TITLES[type] || TITLES.invoice;
    if(ttl) ttl.textContent = isEdit ? cfg.e : cfg.n;
    setText('entryModalSub', cfg.sub);

    if(type === TYPE.ORDER){
      setLabel('entryOrderWrap','entryOrderLabel','Order No');
      setLabel('entryInvoiceWrap','entryInvoiceLabel','Invoice No');
      showWrap('entryOrderWrap', true);
      showWrap('entryInvoiceWrap', false);
      const inv = document.getElementById('entryInvoiceNo'); if(inv){ inv.readOnly=false; inv.value=''; }
      if(!isEdit){ setValue('entryStatus','Unpaid'); setValue('entryType','invoice'); }
    } else if(type === TYPE.INVOICE){
      setLabel('entryOrderWrap','entryOrderLabel','Order No');
      setLabel('entryInvoiceWrap','entryInvoiceLabel','Invoice No');
      showWrap('entryOrderWrap', true);
      showWrap('entryInvoiceWrap', true);
      const inv = document.getElementById('entryInvoiceNo'); if(inv){ inv.readOnly=false; inv.placeholder='Invoice No'; }
      if(!isEdit){ setValue('entryType','invoice'); }
    } else if(type === TYPE.DN){
      setLabel('entryOrderWrap','entryOrderLabel','Order No');
      setLabel('entryInvoiceWrap','entryInvoiceLabel','Delivery Note No');
      showWrap('entryOrderWrap', true);
      showWrap('entryInvoiceWrap', true);
      const inv = document.getElementById('entryInvoiceNo'); if(inv){ inv.placeholder='DN-001'; }
      if(!isEdit){ setValue('entryStatus','Pending'); setValue('entryType','invoice'); }
    } else if(type === TYPE.DEPOSIT){
      setLabel('entryOrderWrap','entryOrderLabel','Deposit No');
      setLabel('entryInvoiceWrap','entryInvoiceLabel','Invoice No');
      showWrap('entryOrderWrap', true);
      showWrap('entryInvoiceWrap', false);
      const inv = document.getElementById('entryInvoiceNo'); if(inv){ inv.readOnly=false; inv.value=''; }
      if(!isEdit){ setValue('entryType','deposit'); setValue('entryStatus','Paid'); }
    }
  }

  const manager = window.VardoEntryManager = {
    TYPE, norm, rowType,
    getType(){ return norm(document.getElementById('entryMode')?.value) || window.__currentEntryType || TYPE.INVOICE; },
    patch,
    async open(type, id=null){
      type = norm(type) || TYPE.INVOICE;
      if(typeof window.__v351BaseOpenEntryModal === 'function'){
        await window.__v351BaseOpenEntryModal(id, type === TYPE.DN ? TYPE.INVOICE : type);
      }
      if(type === TYPE.DN && typeof window.prepareDeliveryNoteMode === 'function'){
        try{ window.prepareDeliveryNoteMode(); }catch(e){ console.warn('DN prepare skipped', e); }
      }
      patch(type, !!id);
      return type;
    }
  };

  function install(){
    if(typeof window.openEntryModal !== 'function') return false;
    if(!window.__v351BaseOpenEntryModal){
      window.__v351BaseOpenEntryModal = window.openEntryModal;
    }
    if(!window.__v351WrappedOpenEntryModal){
      window.__v351WrappedOpenEntryModal = true;
      window.openEntryModal = async function(id=null, forcedMode=''){
        let type = norm(forcedMode);
        if(!type && id){
          try{
            const res = await supabase.from('suppliers').select('*').eq('id', id).single();
            if(res && res.data) type = rowType(res.data);
          }catch(e){}
        }
        if(!type) type = TYPE.INVOICE;
        await window.__v351BaseOpenEntryModal(id, type === TYPE.DN ? TYPE.INVOICE : type);
        if(type === TYPE.DN && typeof window.prepareDeliveryNoteMode === 'function'){
          try{ window.prepareDeliveryNoteMode(); }catch(e){}
        }
        patch(type, !!id);
      };
    }

    window.openOrderModal = function(){ return manager.open(TYPE.ORDER); };
    window.openInvoiceModal = function(){ return manager.open(TYPE.INVOICE); };
    window.openDepositModal = function(){
      if(typeof canAccountant === 'function' && !canAccountant()) return alert('Only accountant or admin can add deposit.');
      return manager.open(TYPE.DEPOSIT);
    };
    window.openDeliveryNoteModal = function(){ return manager.open(TYPE.DN); };
    return true;
  }

  const timer = setInterval(()=>{ if(install()) clearInterval(timer); }, 150);
  install();

  // Guard: if an older patch changes title after opening, restore the source-of-truth title.
  const obs = new MutationObserver(()=>{
    const modal = document.getElementById('entryModal');
    if(!modal || !modal.classList.contains('show')) return;
    const type = norm(modal.dataset.entryType || document.getElementById('entryMode')?.value || window.__currentEntryType);
    if(!type) return;
    const ttl = document.getElementById('entryModalTitle');
    if(!ttl) return;
    const isEdit = /^Edit/i.test(ttl.textContent || '');
    const wanted = isEdit ? TITLES[type].e : TITLES[type].n;
    if(ttl.textContent !== wanted) patch(type, isEdit);
  });
  document.addEventListener('DOMContentLoaded', ()=>obs.observe(document.body, { childList:true, subtree:true, characterData:true }));
})();
