/* V451 Gemini open + single Dock session + stable DB status medal
   Safe patch: UI/Dock/status layer only. Does not change save, numbering, items, VAT or approvals. */
(function(){
  'use strict';
  if(window.__V451_GEMINI_DOCK_STATUS_FIX__) return;
  window.__V451_GEMINI_DOCK_STATUS_FIX__ = true;

  var statusCache = Object.create(null);
  var clickedLabelById = Object.create(null);
  var activeId = '';
  var activeLabel = '';
  var installTimer = null;

  function q(s,r){ return (r||document).querySelector(s); }
  function qa(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }
  function norm(v){ return String(v||'').trim().toLowerCase(); }
  function txt(el){ return String(el && (el.textContent || el.innerText) || '').replace(/\s+/g,' ').trim(); }
  function val(id){ var el=document.getElementById(id); return el ? String(el.value||'') : ''; }

  function injectCss(){
    if(q('#v451GeminiDockStatusStyle')) return;
    var st=document.createElement('style'); st.id='v451GeminiDockStatusStyle';
    st.textContent = '\n'+
      '/* V451 smoother Gemini-style open: no harsh jump */\n'+
      '#entryModal.show .modal-box{animation:v451GeminiOpen .44s cubic-bezier(.16,1,.3,1) both!important;transform-origin:50% 92%!important;will-change:transform,opacity,filter!important;}\n'+
      '@keyframes v451GeminiOpen{0%{opacity:0;transform:translateY(26px) scale(.955);filter:blur(12px) saturate(1.18)}48%{opacity:.96;transform:translateY(-3px) scale(1.006);filter:blur(1.5px) saturate(1.08)}100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0) saturate(1)}}\n'+
      '#entryModal.v451-restoring .modal-box{animation:v451GeminiRestore .36s cubic-bezier(.16,1,.3,1) both!important;}\n'+
      '@keyframes v451GeminiRestore{0%{opacity:.2;transform:translateY(54px) scale(.88);filter:blur(10px)}70%{opacity:1;transform:translateY(-2px) scale(1.01);filter:blur(1px)}100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}}\n'+
      '.v451-dock-duplicate{display:none!important;}\n';
    document.head.appendChild(st);
  }

  function idFromOnclick(row){
    var oc = row && row.getAttribute && (row.getAttribute('onclick') || '');
    var m = oc.match(/openEntryModal\(['\"]([^'\"]+)['\"]/);
    return m && m[1] ? m[1] : '';
  }

  function labelFromText(t){
    t = norm(t);
    if(t.indexOf('credit note') >= 0) return 'Credit Note';
    if(t.indexOf('delivery note') >= 0 || t.indexOf('dn-') >= 0) return 'Delivery Note';
    if(t.indexOf('invoice') >= 0 || t.indexOf('done') >= 0) return 'Invoice';
    if(t.indexOf('deposit') >= 0) return 'Deposit';
    if(t.indexOf('app order') >= 0 || t.indexOf('approved') >= 0) return 'App order';
    if(t.indexOf('order sent') >= 0 || t.indexOf('sent to supplier') >= 0) return 'Order';
    if(t.indexOf('pre-order') >= 0 || t.indexOf('pre order') >= 0 || t.indexOf('pending approval') >= 0) return 'Pre-Order';
    return '';
  }

  function labelFromVisibleRow(row){
    if(!row) return '';
    return labelFromText(qa('.badge,.chip,span,b,td,div', row).map(txt).filter(Boolean).join(' | '));
  }

  document.addEventListener('click', function(e){
    var row = e.target && e.target.closest && e.target.closest('tr,[onclick*="openEntryModal"]');
    if(!row) return;
    var id = idFromOnclick(row);
    var lab = labelFromVisibleRow(row);
    if(id && lab) clickedLabelById[id] = lab;
  }, true);

  function classifyRow(row){
    row = row || {};
    var mode = norm(row.entry_type || row.type || row.kind || val('entryMode') || val('entryType'));
    var s = norm(row.status || val('entryStatus'));
    var notes = norm(row.notes || val('entryNotes'));
    var orderNo = String(row.order_no || val('entryOrderNo') || '').trim();
    var invNo = String(row.invoice_no || val('entryInvoiceNo') || '').trim();

    if(mode.indexOf('delivery') >= 0 || mode === 'dn') return 'Delivery Note';
    if(mode.indexOf('deposit') >= 0) return 'Deposit';
    if(mode.indexOf('credit') >= 0) return 'Credit Note';
    if(invNo && mode.indexOf('order') < 0) return 'Invoice';

    var isSent = s.indexOf('order sent') >= 0 || s === 'sent' || s.indexOf('sent to supplier') >= 0 || notes.indexOf('order sent') >= 0;
    var isApproved = s.indexOf('app order') >= 0 || s.indexOf('approved') >= 0 || notes.indexOf('app order') >= 0 || notes.indexOf('approved') >= 0;
    if(orderNo || mode.indexOf('order') >= 0){
      if(isSent) return 'Order';
      if(isApproved) return 'App order';
      return 'Pre-Order';
    }
    return labelFromText(s + ' ' + notes) || 'Pre-Order';
  }

  async function fetchRow(id){
    if(!id || !(window.vpSupabase || window.supabase)) return null;
    try{
      var sup = window.vpSupabase || window.supabase;
      var res = await sup.from('suppliers').select('*').eq('id', id).single();
      if(res && !res.error && res.data){
        statusCache[id] = { row:res.data, label:classifyRow(res.data), at:Date.now() };
        return res.data;
      }
    }catch(e){}
    return null;
  }

  function classFor(label){
    var l = norm(label);
    if(l.indexOf('pre') >= 0) return 'v432-preorder';
    if(l.indexOf('app') >= 0) return 'v432-apporder';
    if(l === 'order') return 'v432-order';
    if(l.indexOf('delivery') >= 0) return 'v432-dn';
    if(l.indexOf('invoice') >= 0) return 'v432-invoice';
    if(l.indexOf('deposit') >= 0) return 'v432-deposit';
    if(l.indexOf('credit') >= 0) return 'v432-credit';
    return 'v432-default';
  }

  function ensureMedal(){
    var modal = q('#entryModal');
    if(!modal || !modal.classList.contains('show')) return null;
    var actions = q('.modal-actions', modal) || q('.modal-footer', modal) || q('.window-actions', modal);
    if(!actions) return null;
    var wrap = q('.v432-status-wrap', modal);
    if(!wrap){
      wrap = document.createElement('div');
      wrap.className = 'v432-status-wrap';
      var med = document.createElement('div');
      med.className = 'v432-status-medal v432-default';
      med.textContent = 'Status';
      wrap.appendChild(med);
      actions.insertAdjacentElement('afterend', wrap);
    }
    return q('.v432-status-medal', wrap);
  }

  function currentId(){
    var modal = q('#entryModal');
    return String((modal && (modal.dataset.v451EntryId || modal.dataset.v422EditingId || modal.dataset.v375EntryId)) || window.editingId || activeId || '').trim();
  }

  function stableLabel(){
    var id = currentId();
    if(id && statusCache[id] && statusCache[id].label) return statusCache[id].label;
    if(id && clickedLabelById[id]) return clickedLabelById[id];
    if(activeLabel) return activeLabel;
    return classifyRow({});
  }

  function paintMedal(){
    injectCss();
    var medal = ensureMedal();
    if(!medal) return;
    var label = stableLabel();
    medal.textContent = label;
    medal.className = 'v432-status-medal ' + classFor(label);
  }

  function activeDocKey(){
    var id = currentId();
    var order = val('entryOrderNo');
    var inv = val('entryInvoiceNo');
    var supplier = val('entrySupplier');
    if(id) return 'id:' + id;
    if(order) return 'order:' + order;
    if(inv) return 'doc:' + inv;
    return 'draft:' + (val('entryMode') || val('entryType') || 'entry') + ':' + supplier;
  }

  function dockKeyFromButton(btn){
    var explicit = btn.dataset.v451DocKey;
    if(explicit) return explicit;
    var title = btn.getAttribute('title') || btn.textContent || '';
    title = title.replace(/\s+/g,' ').trim().toLowerCase();
    var m = title.match(/(?:order|invoice|delivery note|deposit)\s*[·:#-]*\s*([^\s]+)/i);
    if(m && m[1]) return 'title:' + m[1].toLowerCase();
    return 'title:' + title;
  }

  function dedupeDock(){
    var d = q('#v420MacDock');
    if(!d) return;
    var seen = Object.create(null);
    qa('.v420-window,[data-v422-session-id],[data-v420-window-id]', d).forEach(function(btn){
      var key = dockKeyFromButton(btn);
      if(!key) return;
      if(seen[key]){
        // keep the newest/live item and hide/remove the older duplicate
        try{ seen[key].remove(); }catch(e){ seen[key].classList.add('v451-dock-duplicate'); }
      }
      seen[key] = btn;
    });
  }

  function markLatestDockItem(){
    var d = q('#v420MacDock');
    if(!d) return;
    var key = activeDocKey();
    var items = qa('.v420-window,[data-v422-session-id],[data-v420-window-id]', d);
    if(!items.length) return;
    var last = items[items.length-1];
    last.dataset.v451DocKey = key;
    var order = val('entryOrderNo') || val('entryInvoiceNo') || 'Draft';
    var mode = val('entryMode') || val('entryType') || 'Document';
    var title = (mode === 'delivery_note' ? 'Delivery Note' : (mode === 'order' ? 'Order' : (mode === 'deposit' ? 'Deposit' : 'Invoice'))) + ' · ' + order;
    last.title = title;
    var lab = q('.v425-dock-label', last);
    if(lab) lab.textContent = title.length > 16 ? title.slice(0,15)+'…' : title;
    dedupeDock();
  }

  function minimizeEntryViaV422(){
    var api = window.v423EntryDockSessions || window.v422EntryDockSessions;
    if(api && typeof api.minimizeCurrentEntry === 'function'){
      var id = currentId();
      var key = id ? ('doc_' + id) : activeDocKey().replace(/[^a-z0-9_-]+/gi,'_');
      api.minimizeCurrentEntry(key);
      setTimeout(markLatestDockItem, 30);
      setTimeout(markLatestDockItem, 160);
      return true;
    }
    return false;
  }

  function installWindowActionOverride(){
    if(window.__V451_WINDOW_ACTION_INSTALLED__) return;
    if(typeof window.windowAction !== 'function') return;
    window.__V451_WINDOW_ACTION_INSTALLED__ = true;
    var oldAction = window.windowAction;
    window.windowAction = function(ev, action){
      var target = ev && ev.target;
      var modal = target && target.closest && target.closest('#entryModal');
      if(modal && action === 'compact'){
        if(ev && ev.preventDefault){ ev.preventDefault(); ev.stopPropagation(); }
        activeId = currentId();
        activeLabel = stableLabel();
        if(minimizeEntryViaV422()) return;
      }
      if(modal && action === 'close'){
        activeId = ''; activeLabel = '';
      }
      return oldAction.apply(this, arguments);
    };
  }

  function installOpenWrapper(){
    if(typeof window.openEntryModal !== 'function') return;
    if(window.openEntryModal.__V451_WRAPPED__) return;
    var oldOpen = window.openEntryModal;
    var wrapped = async function(id, forcedMode){
      activeId = id || '';
      activeLabel = id && clickedLabelById[id] ? clickedLabelById[id] : '';
      var modal = q('#entryModal');
      if(modal) modal.classList.add('v451-restoring');
      var preRow = id ? await fetchRow(id) : null;
      if(preRow) activeLabel = classifyRow(preRow);
      var res = await oldOpen.apply(this, arguments);
      modal = q('#entryModal');
      if(modal){
        modal.dataset.v451EntryId = id || '';
        if(preRow){ modal.dataset.v451StatusLabel = classifyRow(preRow); }
        setTimeout(function(){ modal.classList.remove('v451-restoring'); }, 520);
      }
      if(id){
        var row = preRow || await fetchRow(id);
        activeLabel = row ? classifyRow(row) : (clickedLabelById[id] || activeLabel);
        var statusEl = q('#entryStatus');
        if(row && statusEl){
          var v = row.status || '';
          if(v && !qa('option', statusEl).some(function(o){ return o.value === String(v); })){
            var opt = document.createElement('option'); opt.value = String(v); opt.textContent = String(v); statusEl.appendChild(opt);
          }
          if(v) statusEl.value = v;
        }
      } else {
        activeLabel = '';
      }
      paintMedal();
      setTimeout(paintMedal, 60);
      setTimeout(paintMedal, 220);
      setTimeout(dedupeDock, 260);
      return res;
    };
    wrapped.__V451_WRAPPED__ = true;
    window.openEntryModal = wrapped;
  }

  function boot(){
    injectCss();
    installWindowActionOverride();
    installOpenWrapper();
    paintMedal();
    dedupeDock();
  }

  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('load', boot);
  document.addEventListener('click', function(){ setTimeout(function(){ paintMedal(); dedupeDock(); }, 120); }, true);
  document.addEventListener('change', function(e){
    if(e.target && e.target.closest && e.target.closest('#entryModal')){
      if(!currentId()) activeLabel = '';
      setTimeout(paintMedal, 40);
    }
  }, true);

  installTimer = setInterval(function(){
    boot();
    var id = currentId();
    if(id && (!statusCache[id] || Date.now() - statusCache[id].at > 12000)) fetchRow(id).then(paintMedal);
  }, 700);
})();
