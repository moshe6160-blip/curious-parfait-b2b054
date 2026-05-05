(function(){
  function localKey(d){
    d = d ? new Date(d) : new Date();
    if(isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  function rowDay(r){
    var vals = [r && r.created_at, r && r.date, r && r.invoice_date, r && r.order_date];
    for(var i=0;i<vals.length;i++){
      if(!vals[i]) continue;
      var str = String(vals[i]);
      if(/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
      var k = localKey(str);
      if(k) return k;
    }
    return '';
  }
  function amt(r){ return Number((r && (r.total || r.amount || r.totalAfterVAT || r.total_after_vat)) || 0); }
  function dnAmt(r){
    try{ var d = Number(extractDeliveredAmount(r) || 0); if(d > 0) return d; }catch(e){}
    return amt(r);
  }
  function invAmt(r){
    try{ if(typeof invoiceDisplayAmount === 'function') return Number(invoiceDisplayAmount(r) || 0); }catch(e){}
    return amt(r);
  }
  window.dailyHeaderSummary = function(rows){
    var today = localKey();
    var selectedProjectDaily = String((typeof uiState !== "undefined" && uiState.project) ? uiState.project : "").trim();
    var orders = 0, delivered = 0, invoiced = 0, count = 0;
    (rows || []).forEach(function(r){
      if(rowDay(r) !== today) return;
      if(selectedProjectDaily && String((r && r.project) || "").trim() !== selectedProjectDaily) return;
      count++;
      var type = String((r && r.entry_type) || '').toLowerCase();
      if(type === 'deposit') return;
      var hasOrder = !!String((r && r.order_no) || '').trim() || type === 'order';
      var hasDN = type === 'delivery_note' || type === 'dn';
      var hasInv = type === 'invoice' || !!String((r && r.invoice_no) || '').trim();
      try{ hasDN = hasDN || !!extractDeliveryNoteNo(r); }catch(e){}
      if(hasOrder) orders += amt(r);
      if(hasDN) delivered += dnAmt(r);
      if(hasInv) invoiced += invAmt(r);
    });
    return {date: today, orders: orders, delivered: delivered, invoiced: invoiced, count: count};
  };
})();