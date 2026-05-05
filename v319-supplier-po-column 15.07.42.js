(function(){
  'use strict';
  function extractFromNotes(notes){
    notes = String(notes || '');
    const start = '[[V316_SUPPLIER_ORDER_NO:';
    const end = ']]';
    const i = notes.indexOf(start);
    if(i < 0) return '';
    const j = notes.indexOf(end, i + start.length);
    if(j < 0) return '';
    const raw = notes.slice(i + start.length, j);
    try { return decodeURIComponent(raw || ''); } catch(e){ return raw || ''; }
  }
  window.extractSupplierOrderNoV319 = function(row){ return extractFromNotes(row && row.notes); };
  if(!window.extractSupplierOrderNo){
    window.extractSupplierOrderNo = window.extractSupplierOrderNoV319;
  }
  function applyStyle(){
    if(document.getElementById('v319SupplierPOColumnStyle')) return;
    const st=document.createElement('style');
    st.id='v319SupplierPOColumnStyle';
    st.textContent='th:nth-child(7),td:nth-child(7){min-width:150px;white-space:nowrap}';
    document.head.appendChild(st);
  }
  applyStyle();
})();
