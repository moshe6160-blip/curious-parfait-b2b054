/* V360 final guard: document kind titles/labels/print stabilized. UI only; no login/save calculations touched. */
(function(){
  if(window.__V360_ENTRY_TYPE_CORE_FIX__) return;
  window.__V360_ENTRY_TYPE_CORE_FIX__ = true;
  function $(id){ return document.getElementById(id); }
  function norm(v){
    var s=String(v||'').toLowerCase().replace(/[\s-]+/g,'_');
    if(['dn','delivery','deliverynote','delivery_note'].includes(s)) return 'delivery_note';
    if(['dep','deposit','advance','advance_payment'].includes(s)) return 'deposit';
    if(['po','order','purchase_order','purchaseorder'].includes(s)) return 'order';
    if(['inv','invoice'].includes(s)) return 'invoice';
    return '';
  }
  function tag(notes,k){ var m=String(notes||'').match(new RegExp('\\[\\['+k+':([\\s\\S]*?)\\]\\]','i')); return m?String(m[1]||'').trim():''; }
  function dnNo(r){
    r=r||{}; var inv=String(r.invoice_no||'').trim();
    return String(r.delivery_note_no||r.dn_no||'').trim() || (/^DN[-\s]?\d+/i.test(inv)?inv:'') || tag(r.notes,'DN') || tag(r.notes,'DNNO') || ((String(r.notes||'').match(/\bDN[-\s]?\d+\b/i)||[])[0]||'');
  }
  function kind(row, forced){
    var f=norm(forced); if(f) return f;
    row=row||{};
    var t=norm(row.entry_type||row.type||row.kind||row.mode||'');
    var desc=String(row.description||'').toLowerCase();
    var order=String(row.order_no||'').trim();
    if(t==='deposit' || /^DEP-/i.test(order) || desc.includes('deposit') || desc.includes('advance')) return 'deposit';
    if(t==='delivery_note' || dnNo(row)) return 'delivery_note';
    if(t==='invoice' || String(row.invoice_no||'').trim()) return 'invoice';
    if(t==='order' || order) return 'order';
    return 'order';
  }
  function title(t, edit){
    return ({
      order: edit?'Edit Order':'New Order',
      invoice: edit?'Edit Invoice':'New Invoice',
      delivery_note: edit?'Edit Delivery Note':'New Delivery Note',
      deposit: edit?'Edit Deposit / Advance':'New Deposit / Advance'
    })[t] || (edit?'Edit Entry':'New Entry');
  }
  function apply(t, edit, row){
    t=norm(t)||'order'; row=row||{};
    window.__VP_LOCKED_KIND=t;
    var modal=$('entryModal'); if(modal){ modal.dataset.entryKind=t; modal.dataset.entryType=t; }
    if($('entryMode')) $('entryMode').value=t;
    if($('entryModalTitle')) $('entryModalTitle').textContent=title(t,!!edit);
    var sub=$('entryModalSub'); if(sub){
      sub.textContent = t==='order'?'Supplier purchase order.':t==='invoice'?'Supplier invoice document.':t==='delivery_note'?'Delivery note / supplied goods record.':'Supplier deposit / advance payment.';
    }
    var orderWrap=$('entryOrderWrap'), invWrap=$('entryInvoiceWrap');
    var orderLabel=$('entryOrderLabel') || document.querySelector('#entryOrderWrap span');
    var invLabel=$('entryInvoiceLabel') || document.querySelector('#entryInvoiceWrap span');
    if(orderWrap) orderWrap.style.display='';
    if(invWrap) invWrap.style.display = (t==='order'||t==='deposit') ? 'none' : '';
    if(orderLabel) orderLabel.textContent = t==='deposit' ? 'Deposit No' : (t==='invoice'?'Order No / PO':'Order No');
    if(invLabel) invLabel.textContent = t==='delivery_note' ? 'Delivery Note No' : 'Invoice No';
    var inv=$('entryInvoiceNo'); if(inv){
      if(t==='delivery_note'){ inv.placeholder='DN-001'; var d=dnNo(row); if(d) inv.value=d; }
      if(t==='invoice') inv.placeholder='Invoice No';
      inv.readOnly=false;
    }
    var sel=$('entryType'); if(sel) sel.value = t;
  }
  var previousOpen=window.openEntryModal;
  if(typeof previousOpen==='function'){
    window.openEntryModal = async function(id, forced){
      var row=null;
      if(id && window.supabase){ try{ var r=await window.supabase.from('suppliers').select('*').eq('id',id).single(); if(r&&!r.error) row=r.data; }catch(e){} }
      var t=kind(row, forced);
      window.__VP_LOCKED_KIND=t;
      var res=await previousOpen.call(this,id, t);
      apply(t, !!id, row);
      [20,80,180,400,900,1600].forEach(function(ms){ setTimeout(function(){ apply(t,!!id,row); },ms); });
      return res;
    };
  }
  window.openOrderModal=function(){ return window.openEntryModal(null,'order'); };
  window.openInvoiceModal=function(){ return window.openEntryModal(null,'invoice'); };
  window.openDepositModal=function(){ return window.openEntryModal(null,'deposit'); };
  window.openDeliveryNoteModal=function(){ return window.openEntryModal(null,'delivery_note'); };
  document.addEventListener('click',function(e){
    var btn=e.target.closest&&e.target.closest('button'); if(!btn) return;
    var text=String(btn.textContent||'').trim().toLowerCase();
    if(text==='order'){ setTimeout(function(){ apply('order',false,{}); },50); }
    if(text==='invoice'){ setTimeout(function(){ apply('invoice',false,{}); },50); }
    if(text==='delivery note'){ setTimeout(function(){ apply('delivery_note',false,{}); },50); }
    if(text==='add deposit'){ setTimeout(function(){ apply('deposit',false,{}); },50); }
  },true);
})();
