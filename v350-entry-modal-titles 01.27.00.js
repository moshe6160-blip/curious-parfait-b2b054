/* V350 - Entry modal title fix only.
   Purpose: show the correct window title for Order / Invoice / Delivery Note / Deposit.
   Safe: does not change login, saving, calculations, print templates, or data logic. */
(function(){
  if(window.__v350EntryTitlesInstalled) return;
  window.__v350EntryTitlesInstalled = true;

  function modalTitleEl(){
    return document.getElementById('entryModalTitle') || document.querySelector('#entryModal h3') || document.querySelector('#entryModal .modal-head h3');
  }

  function modalSubEl(){
    return document.getElementById('entryModalSub');
  }

  function getModeFromUI(){
    const rawMode = String(document.getElementById('entryMode')?.value || '').trim().toLowerCase();
    const type = String(document.getElementById('entryType')?.value || '').trim().toLowerCase();
    const invoiceLabel = String((document.getElementById('entryInvoiceLabel') || document.querySelector('#entryInvoiceWrap span'))?.textContent || '').toLowerCase();
    const invoiceNo = String(document.getElementById('entryInvoiceNo')?.value || '').trim();
    const orderNo = String(document.getElementById('entryOrderNo')?.value || '').trim();

    if(rawMode === 'delivery_note' || invoiceLabel.includes('delivery note')) return 'delivery_note';
    if(rawMode === 'deposit' || type === 'deposit') return 'deposit';
    if(rawMode === 'order') return 'order';
    if(rawMode === 'invoice') return 'invoice';
    if(invoiceNo) return 'invoice';
    if(orderNo) return 'order';
    return 'invoice';
  }

  function isEditMode(){
    try{
      if(typeof editingId !== 'undefined' && editingId) return true;
    }catch(e){}
    return !!document.querySelector('#entryModal.show [data-editing-id], #entryModal.show .editing');
  }

  function titleFor(mode, edit){
    if(mode === 'order') return edit ? 'Edit Order' : 'New Order';
    if(mode === 'invoice') return edit ? 'Edit Invoice' : 'New Invoice';
    if(mode === 'delivery_note') return edit ? 'Edit Delivery Note' : 'New Delivery Note';
    if(mode === 'deposit') return edit ? 'Edit Deposit / Advance' : 'New Deposit / Advance';
    return edit ? 'Edit Entry' : 'New Entry';
  }

  function subFor(mode){
    if(mode === 'order') return 'Supplier purchase order.';
    if(mode === 'invoice') return 'Supplier invoice.';
    if(mode === 'delivery_note') return 'Delivery note for received goods or services.';
    if(mode === 'deposit') return 'Supplier deposit / advance payment. Not an invoice.';
    return '';
  }

  window.v350SetEntryModalTitle = function(mode, edit){
    const realMode = mode || getModeFromUI();
    const realEdit = (typeof edit === 'boolean') ? edit : isEditMode();
    const ttl = modalTitleEl();
    if(ttl) ttl.textContent = titleFor(realMode, realEdit);
    const sub = modalSubEl();
    if(sub) sub.textContent = subFor(realMode);
  };

  function afterFrame(fn){
    setTimeout(function(){ requestAnimationFrame(fn); }, 0);
  }

  function wrapAsync(name, mode){
    const original = window[name];
    if(typeof original !== 'function') return;
    window[name] = async function(){
      const result = await original.apply(this, arguments);
      afterFrame(function(){ window.v350SetEntryModalTitle(mode, false); });
      return result;
    };
  }

  // Patch main buttons without changing their internal logic.
  wrapAsync('openOrderModal', 'order');
  wrapAsync('openInvoiceModal', 'invoice');
  wrapAsync('openDepositModal', 'deposit');
  wrapAsync('openDeliveryNoteModal', 'delivery_note');

  // Patch generic modal open for edit/reopen cases.
  const originalOpenEntryModal = window.openEntryModal;
  if(typeof originalOpenEntryModal === 'function'){
    window.openEntryModal = async function(id, forcedMode){
      const result = await originalOpenEntryModal.apply(this, arguments);
      afterFrame(function(){ window.v350SetEntryModalTitle(forcedMode || null, !!id); });
      return result;
    };
  }

  // Patch DN preparation because older code updates a missing title id.
  const originalPrepareDN = window.prepareDeliveryNoteMode;
  if(typeof originalPrepareDN === 'function'){
    window.prepareDeliveryNoteMode = function(){
      const result = originalPrepareDN.apply(this, arguments);
      afterFrame(function(){ window.v350SetEntryModalTitle('delivery_note', false); });
      return result;
    };
  }

  // Safety observer: if the modal is opened by older code, correct the title.
  document.addEventListener('click', function(){
    afterFrame(function(){
      const modal = document.getElementById('entryModal');
      if(modal && modal.classList.contains('show')) window.v350SetEntryModalTitle();
    });
  }, true);
})();
