(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function text(v){ return String(v ?? '').trim(); }
  function money(n){ const x = Number(String(n ?? '').replace(',', '.')) || 0; return x.toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function rows(){
    return Array.from(document.querySelectorAll('#v309OrderItemsBody tr')).map((tr, i) => {
      const get = f => text(tr.querySelector('[data-field="'+f+'"]')?.value);
      const item = get('item') || String(i+1);
      const manual = get('manualDescription');
      const desc = get('description');
      const code = get('codeDisplay') || get('glCode');
      const qty = get('qty');
      const price = get('price');
      const discount = get('discount');
      const total = get('total');
      return {item, manual, desc, code, qty, price, discount, total};
    }).filter(r => r.item || r.manual || r.desc || r.code || r.qty || r.price || r.discount || r.total);
  }
  function data(){
    return {
      supplier: text($('entrySupplier')?.value),
      project: text($('entryProject')?.value),
      orderNo: text($('entryOrderNo')?.value),
      supplierOrderNo: text($('entrySupplierOrderNo')?.value),
      net: text($('entryNetAmount')?.value),
      vat: text($('entryVatAmount')?.value),
      total: text($('entryTotal')?.value),
      notes: text($('entryNotes')?.value),
      items: rows()
    };
  }
  function plain(){
    const d = data();
    const lines = [];
    lines.push('Purchase Order');
    if(d.orderNo) lines.push('Order No: ' + d.orderNo);
    if(d.supplierOrderNo) lines.push('Supplier Order No: ' + d.supplierOrderNo);
    if(d.supplier) lines.push('Supplier: ' + d.supplier);
    if(d.project) lines.push('Project: ' + d.project);
    lines.push('');
    lines.push('Items:');
    (d.items || []).forEach((r, i) => {
      lines.push((i+1) + '. ' + [r.manual || r.item, r.desc, r.code ? 'GL: '+r.code : '', r.qty ? 'Qty: '+r.qty : '', r.price ? 'Price: '+r.price : '', r.discount ? 'Discount: '+r.discount : '', r.total ? 'Total: '+r.total : ''].filter(Boolean).join(' | '));
    });
    lines.push('');
    lines.push('Net Before VAT: ' + money(d.net));
    lines.push('VAT Amount: ' + money(d.vat));
    lines.push('Total After VAT: ' + money(d.total));
    if(d.notes) lines.push('\nNotes: ' + d.notes.replace(/\[\[V\d+_[^\]]+\]\]/g,'').trim());
    return lines.join('\n');
  }
  function htmlDoc(){
    const d = data();
    const trs = (d.items || []).map((r,i)=>'<tr><td>'+esc(i+1)+'</td><td>'+esc(r.manual || r.item)+'</td><td>'+esc(r.desc)+'</td><td>'+esc(r.code)+'</td><td>'+esc(r.qty)+'</td><td>'+esc(r.price)+'</td><td>'+esc(r.discount)+'</td><td>'+esc(r.total)+'</td></tr>').join('');
    return '<!doctype html><html><head><meta charset="utf-8"><title>'+esc(d.orderNo || 'Purchase Order')+'</title><style>body{font-family:Arial,sans-serif;margin:28px;color:#111}h1{margin:0 0 6px}.meta{display:grid;grid-template-columns:170px 1fr;gap:6px 14px;margin:18px 0 24px}.label{font-weight:700}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #bbb;padding:8px;font-size:13px;text-align:left}th{background:#f2f2f2}.totals{margin-top:18px;margin-left:auto;width:320px}.totals div{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:7px 0}.total{font-weight:800;font-size:18px}.notes{margin-top:24px;white-space:pre-wrap}@media print{button{display:none}}</style></head><body><button onclick="window.print()" style="float:right;padding:10px 16px">Print</button><h1>Purchase Order</h1><div>'+esc(new Date().toLocaleDateString())+'</div><div class="meta"><div class="label">Order No</div><div>'+esc(d.orderNo)+'</div><div class="label">Supplier Order No</div><div>'+esc(d.supplierOrderNo)+'</div><div class="label">Supplier</div><div>'+esc(d.supplier)+'</div><div class="label">Project</div><div>'+esc(d.project)+'</div></div><h3>Items</h3><table><thead><tr><th>#</th><th>Item / Manual Description</th><th>Description</th><th>GL Code</th><th>Qty</th><th>Price</th><th>Discount</th><th>Total</th></tr></thead><tbody>'+trs+'</tbody></table><div class="totals"><div><span>Net Before VAT</span><b>'+esc(money(d.net))+'</b></div><div><span>VAT Amount</span><b>'+esc(money(d.vat))+'</b></div><div class="total"><span>Total After VAT</span><b>'+esc(money(d.total))+'</b></div></div>'+(d.notes?'<div class="notes"><b>Notes</b><br>'+esc(d.notes.replace(/\[\[V\d+_[^\]]+\]\]/g,'').trim())+'</div>':'')+'</body></html>';
  }
  window.printEntryOrder = function(){
    const w = window.open('', '_blank');
    if(!w){ alert('Popup blocked. Please allow popups to print.'); return; }
    w.document.open();
    w.document.write(htmlDoc());
    w.document.close();
    setTimeout(()=>{ try{ w.focus(); w.print(); }catch(e){} }, 350);
  };
  window.emailEntryOrder = function(){
    const d = data();
    const subject = encodeURIComponent('Purchase Order ' + (d.orderNo || ''));
    const body = encodeURIComponent(plain());
    window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
  };
  window.whatsappEntryOrder = function(){
    const msg = encodeURIComponent(plain());
    window.open('https://wa.me/?text=' + msg, '_blank');
  };
  function mountButtons(){
    const actions = document.querySelector('#entryModal .modal-actions');
    if(!actions || $('v324PrintOrderBtn')) return;
    const wrap = document.createElement('div');
    wrap.id = 'v324SharePrintActions';
    wrap.innerHTML = '<button type="button" id="v324PrintOrderBtn" onclick="window.printEntryOrder()">Print</button><button type="button" onclick="window.emailEntryOrder()">Email</button><button type="button" onclick="window.whatsappEntryOrder()">WhatsApp</button>';
    actions.insertBefore(wrap, actions.querySelector('.spacer') || actions.firstChild);
  }
  function injectStyle(){
    if($('v324SharePrintStyle')) return;
    const st = document.createElement('style');
    st.id = 'v324SharePrintStyle';
    st.textContent = '#v324SharePrintActions{display:flex;gap:8px;flex-wrap:wrap;margin-right:10px}#v324SharePrintActions button{min-height:38px;padding:0 14px;border-radius:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.18);color:#fff;font-weight:700}#v324SharePrintActions button:hover{border-color:rgba(218,178,122,.45)}@media(max-width:760px){#entryModal .modal-actions{align-items:flex-start}#v324SharePrintActions{width:100%;margin:0 0 8px 0}#v324SharePrintActions button{flex:1}}';
    document.head.appendChild(st);
  }
  function install(){ injectStyle(); mountButtons(); }
  setInterval(install, 500);
  document.addEventListener('DOMContentLoaded', install);
})();
