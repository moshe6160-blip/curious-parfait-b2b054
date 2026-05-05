/* V352 Entry Manager Real Fix
   Fixes the actual modal title source issue: the legacy modal renders a raw H3 without id.
   This patch finds that H3, gives it an id, and forces the correct title after every modal render.
   Additive only: no login/save/calculation changes. */
(function(){
  if(window.__V352_ENTRY_MANAGER_REAL_FIX__) return;
  window.__V352_ENTRY_MANAGER_REAL_FIX__ = true;

  const TYPE_MAP = {
    order: { newTitle:'New Order', editTitle:'Edit Order', orderLabel:'Order No', invoiceLabel:'Invoice No' },
    invoice: { newTitle:'New Invoice', editTitle:'Edit Invoice', orderLabel:'Order No', invoiceLabel:'Invoice No' },
    delivery_note: { newTitle:'New Delivery Note', editTitle:'Edit Delivery Note', orderLabel:'Order No', invoiceLabel:'Delivery Note No' },
    deposit: { newTitle:'New Deposit / Advance', editTitle:'Edit Deposit / Advance', orderLabel:'Deposit No', invoiceLabel:'Invoice No' }
  };

  function norm(v){
    const s = String(v || '').toLowerCase().trim();
    if(['order','po','purchase','purchase_order','purchase order'].includes(s)) return 'order';
    if(['invoice','inv'].includes(s)) return 'invoice';
    if(['dn','delivery','delivery_note','deliverynote','delivery note'].includes(s)) return 'delivery_note';
    if(['deposit','dep','advance','payment_advance'].includes(s)) return 'deposit';
    return '';
  }

  function modal(){ return document.getElementById('entryModal'); }
  function titleEl(){
    let el = document.getElementById('entryModalTitle');
    if(el) return el;
    const m = modal();
    el = m && (m.querySelector('.modal-head h3') || m.querySelector('h3'));
    if(el) el.id = 'entryModalTitle';
    return el;
  }
  function setLabel(wrapId, labelId, text){
    const direct = document.getElementById(labelId);
    if(direct){ direct.textContent = text; return; }
    const wrap = document.getElementById(wrapId);
    const span = wrap && wrap.querySelector('span');
    if(span) span.textContent = text;
  }
  function show(id, yes){
    const el = document.getElementById(id);
    if(!el) return;
    el.classList.toggle('field-hidden', !yes);
    el.style.display = yes ? '' : 'none';
  }
  function detectFromRow(row){
    if(!row) return '';
    const entryType = norm(row.entry_type || row.type || '');
    if(entryType) return entryType;
    const orderNo = String(row.order_no || '').trim();
    const invoiceNo = String(row.invoice_no || '').trim();
    const notes = String(row.notes || '');
    if(/^DEP-/i.test(orderNo) || /deposit|advance/i.test(String(row.description || ''))) return 'deposit';
    if(/^DN-/i.test(invoiceNo) || /\[\[DN:/i.test(notes) || /delivery note/i.test(String(row.process || ''))) return 'delivery_note';
    if(invoiceNo) return 'invoice';
    if(orderNo) return 'order';
    return '';
  }
  async function typeFromId(id){
    if(!id || !window.supabase) return '';
    try{
      const res = await window.supabase.from('suppliers').select('*').eq('id', id).single();
      return detectFromRow(res && res.data);
    }catch(e){ return ''; }
  }

  function apply(type, isEdit){
    type = norm(type) || 'invoice';
    const cfg = TYPE_MAP[type] || TYPE_MAP.invoice;
    const m = modal();
    if(m) m.dataset.entryType = type;
    window.__currentEntryType = type;
    window.currentEntryType = type;
    const mode = document.getElementById('entryMode');
    if(mode) mode.value = type;

    const t = titleEl();
    if(t) t.textContent = isEdit ? cfg.editTitle : cfg.newTitle;

    setLabel('entryOrderWrap','entryOrderLabel', cfg.orderLabel);
    setLabel('entryInvoiceWrap','entryInvoiceLabel', cfg.invoiceLabel);

    if(type === 'order'){
      show('entryOrderWrap', true); show('entryInvoiceWrap', false);
      const inv = document.getElementById('entryInvoiceNo'); if(inv) inv.value = '';
    } else if(type === 'invoice'){
      show('entryOrderWrap', true); show('entryInvoiceWrap', true);
    } else if(type === 'delivery_note'){
      show('entryOrderWrap', true); show('entryInvoiceWrap', true);
      const inv = document.getElementById('entryInvoiceNo'); if(inv) inv.placeholder = 'DN-001';
    } else if(type === 'deposit'){
      show('entryOrderWrap', true); show('entryInvoiceWrap', false);
      const inv = document.getElementById('entryInvoiceNo'); if(inv) inv.value = '';
      const entryType = document.getElementById('entryType'); if(entryType) entryType.value = 'deposit';
    }
  }

  function forceSeveralTimes(type, isEdit){
    [0, 30, 120, 350, 800].forEach(ms => setTimeout(() => apply(type, isEdit), ms));
    if(window.requestAnimationFrame) requestAnimationFrame(() => apply(type, isEdit));
  }

  function install(){
    if(typeof window.openEntryModal !== 'function' || window.__v352_open_wrapped__) return;
    window.__v352_open_wrapped__ = true;
    const baseOpen = window.openEntryModal;
    window.openEntryModal = async function(id=null, forcedMode=''){
      let type = norm(forcedMode);
      if(!type && id) type = await typeFromId(id);
      if(!type) type = 'invoice';
      const result = await baseOpen.apply(this, arguments);
      forceSeveralTimes(type, !!id);
      return result;
    };
  }

  // Override action buttons AFTER all older scripts so they send a real type.
  function installButtons(){
    window.openOrderModal = async function(){ return window.openEntryModal(null, 'order'); };
    window.openInvoiceModal = async function(){ return window.openEntryModal(null, 'invoice'); };
    window.openDeliveryNoteModal = async function(){ return window.openEntryModal(null, 'delivery_note'); };
    window.openDepositModal = async function(){
      if(typeof window.canAccountant === 'function' && !window.canAccountant()) return alert('Only accountant or admin can add deposit.');
      return window.openEntryModal(null, 'deposit');
    };
  }

  function boot(){ install(); installButtons(); }
  boot();
  setTimeout(boot, 200);
  setTimeout(boot, 1000);

  // Last line of defense: if modal is visible and title falls back, restore it.
  setInterval(function(){
    const m = modal();
    if(!m || !m.classList.contains('show')) return;
    const type = norm(m.dataset.entryType || document.getElementById('entryMode')?.value || window.__currentEntryType);
    if(!type) return;
    const txt = titleEl()?.textContent || '';
    if(/New Entry\s*\/\s*Invoice|Edit Entry\s*\/\s*Invoice/i.test(txt)) apply(type, /^Edit/i.test(txt));
  }, 150);
})();
