<script id="v284-connect-unified-print-template">
(function(){
  if (window.__v284UnifiedTemplateConnected) return;
  window.__v284UnifiedTemplateConnected = true;

  function safeMoney(n){ try { return money(Number(n || 0)); } catch(e){ return 'R ' + Number(n||0).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2}); } }
  function safeDate(v){ try { return localDateFromAnyV97(v); } catch(e){ return String(v || '').slice(0,10); } }
  function kindOf(r){ try { return displayEntryKind(r); } catch(e){ return String(r.entry_type || r.process || r.status || '').toLowerCase().replace(/\s+/g,'_'); } }
  function labelOf(r){ try { return processStatusLabel(r); } catch(e){ return r.status || r.entry_type || ''; } }
  function baseAmount(r){ try { return depositBaseAmount(r); } catch(e){ return Number(r.total || r.amount || r.net_amount || 0); } }
  function reportPeriod(){ try { return reportMonthLabel(); } catch(e){ return 'Current Period'; } }
  async function entries(){ try { return await getEntries(); } catch(e){ alert('Report data is not ready. Refresh and try again.'); return []; } }
  function openDoc(opts){
    if(!window.VardophasePrintTemplate){ alert('Print template is still loading. Refresh and try again.'); return; }
    return window.VardophasePrintTemplate.open(opts);
  }
  function bySupplierProjectSummary(rows){
    var supplier = {}, project = {};
    rows.forEach(function(r){
      var k = kindOf(r);
      var s = r.supplier || 'Unassigned';
      var p = r.project || 'Unassigned';
      if(!supplier[s]) supplier[s] = {supplier:s, orders:0, invoices:0, credits:0, net:0};
      if(!project[p]) project[p] = {project:p, orders:0, invoices:0, credits:0, net:0};
      var val = Math.abs(Number(r.total || r.amount || r.net_amount || 0));
      if(k === 'credit_note') { supplier[s].credits += val; project[p].credits += val; }
      else if(k === 'invoice') { supplier[s].invoices += val; project[p].invoices += val; }
      else if(k === 'order') { supplier[s].orders += val; project[p].orders += val; }
    });
    Object.values(supplier).forEach(function(x){ x.net = x.invoices - x.credits; });
    Object.values(project).forEach(function(x){ x.net = x.invoices - x.credits; });
    return {supplier:Object.values(supplier), project:Object.values(project)};
  }

  window.printMonthlyReport = async function(){
    var rows = await entries();
    var sum = (typeof totals === 'function') ? totals(rows) : {invoiceTotal:0, orderTotal:0, depositTotal:0, depositApplied:0, outstanding:0, carryForward:0, suppliers:0};
    var detail = rows.map(function(r){
      return {
        date: safeDate(r.created_at),
        supplier: r.supplier || '',
        type: labelOf(r),
        order: r.order_no || '',
        invoice: r.invoice_no || '',
        project: r.project || '',
        total: safeMoney(r.total || r.amount || 0),
        applied: safeMoney(r.deposit_applied || 0),
        due: safeMoney(r.amount_due || r.unpaid_after_deposit || 0)
      };
    });
    openDoc({
      type:'MONTHLY REPORT',
      documentNo:'MONTHLY',
      period:reportPeriod(),
      meta:[
        {label:'PERIOD', value:reportPeriod()},
        {label:'ENTRIES', value:String(rows.length)},
        {label:'SUPPLIERS', value:String(sum.suppliers || new Set(rows.map(function(r){return r.supplier;})).size)},
        {label:'BASIS', value:'After VAT / Total'}
      ],
      sectionTitle:'Detailed Entries',
      columns:[
        {key:'date', label:'Date'}, {key:'supplier', label:'Supplier'}, {key:'type', label:'Type'},
        {key:'order', label:'Order'}, {key:'invoice', label:'Invoice'}, {key:'project', label:'Project'},
        {key:'total', label:'Total', num:true}, {key:'applied', label:'Applied', num:true}, {key:'due', label:'Amount Due', num:true}
      ],
      rows:detail,
      totals:[
        {label:'Orders', value:safeMoney(sum.orderTotal || 0)},
        {label:'Invoices Net', value:safeMoney(sum.invoiceTotal || 0), major:true},
        {label:'Deposit / Credit', value:safeMoney(sum.depositTotal || 0)},
        {label:'Credit Applied', value:safeMoney(sum.depositApplied || 0)},
        {label:'Outstanding', value:safeMoney(sum.outstanding || 0), major:true},
        {label:'Carry Forward Credit', value:safeMoney(sum.carryForward || 0)}
      ],
      note:'This report uses the unified Vardophase print template. Credit notes reduce the linked invoice net amount and do not create free supplier credit unless recorded as a separate supplier credit.'
    });
  };

  window.printProjectSummary = async function(){
    var rows = await entries();
    var grouped = bySupplierProjectSummary(rows).project.map(function(x){
      return {project:x.project, orders:safeMoney(x.orders), invoices:safeMoney(x.invoices), credits:safeMoney(-x.credits), net:safeMoney(x.net)};
    });
    openDoc({
      type:'PROJECT REPORT', documentNo:'PROJECT', period:reportPeriod(),
      meta:[{label:'PERIOD', value:reportPeriod()}, {label:'PROJECTS', value:String(grouped.length)}],
      sectionTitle:'Project Summary',
      columns:[{key:'project',label:'Project'}, {key:'orders',label:'Orders',num:true}, {key:'invoices',label:'Invoices',num:true}, {key:'credits',label:'Credits',num:true}, {key:'net',label:'Net',num:true}],
      rows:grouped,
      totals:[{label:'Net Total', value:safeMoney(grouped.reduce(function(s,r){ return s + Number(String(r.net).replace(/[^0-9.-]/g,'')); },0)), major:true}]
    });
  };

  window.printSupplierDepositReport = async function(){
    var rows = await entries();
    var selectedSupplier = (window.uiState && uiState.supplier) ? uiState.supplier : '';
    if(selectedSupplier){ rows = rows.filter(function(r){ return (r.supplier || '') === selectedSupplier; }); }
    var running = 0;
    var ledger = rows.slice().sort(function(a,b){ return String(a.created_at||'').localeCompare(String(b.created_at||'')); }).map(function(r){
      var k = kindOf(r), debit = 0, credit = 0;
      var val = Math.abs(Number(r.total || r.amount || r.net_amount || 0));
      if(k === 'invoice'){ debit = val; running += debit; }
      else if(k === 'credit_note' || k === 'deposit'){ credit = val; running -= credit; }
      return {date:safeDate(r.created_at), supplier:r.supplier||'', type:labelOf(r), ref:r.invoice_no || r.order_no || '', debit:safeMoney(debit), credit:safeMoney(credit ? -credit : 0), balance:safeMoney(Math.max(running,0))};
    });
    openDoc({
      type:'SUPPLIER STATEMENT', documentNo:'STATEMENT', period:reportPeriod(),
      meta:[{label:'SUPPLIER', value:selectedSupplier || 'All Suppliers'}, {label:'PERIOD', value:reportPeriod()}, {label:'ENTRIES', value:String(ledger.length)}, {label:'BASIS', value:'Invoice / Credit Ledger'}],
      sectionTitle:'Supplier Ledger',
      columns:[{key:'date',label:'Date'}, {key:'supplier',label:'Supplier'}, {key:'type',label:'Type'}, {key:'ref',label:'Ref'}, {key:'debit',label:'Debit',num:true}, {key:'credit',label:'Credit',num:true}, {key:'balance',label:'Balance',num:true}],
      rows:ledger,
      totals:[{label:'Closing Balance', value:safeMoney(Math.max(running,0)), major:true}],
      note:'Credit notes are shown as accounting credits linked to their original invoices.'
    });
  };

  window.printOpenOrdersReport = async function(){
    var rows = (await entries()).filter(function(r){ return kindOf(r) === 'order' && String(r.status||'').toLowerCase() !== 'closed'; });
    var detail = rows.map(function(r){ return {date:safeDate(r.created_at), supplier:r.supplier||'', project:r.project||'', order:r.order_no||'', description:r.description||'', total:safeMoney(r.total || r.amount || 0), balance:safeMoney(r.balance || r.amount_due || r.total || 0), status:r.status||''}; });
    openDoc({
      type:'OPEN ORDERS REPORT', documentNo:'OPEN ORDERS', period:reportPeriod(),
      meta:[{label:'PERIOD', value:reportPeriod()}, {label:'OPEN ORDERS', value:String(detail.length)}],
      sectionTitle:'Open Orders',
      columns:[{key:'date',label:'Date'}, {key:'supplier',label:'Supplier'}, {key:'project',label:'Project'}, {key:'order',label:'Order'}, {key:'description',label:'Description'}, {key:'total',label:'Total',num:true}, {key:'balance',label:'Balance',num:true}, {key:'status',label:'Status'}],
      rows:detail,
      totals:[{label:'Open Orders Value', value:safeMoney(rows.reduce(function(s,r){ return s + Number(r.balance || r.amount_due || r.total || 0); },0)), major:true}]
    });
  };

  window.runSupplierReport = async function(){
    var selected = (document.getElementById('reportSupplierSelect')?.value || '').trim();
    var typed = (document.getElementById('reportSupplierInput')?.value || '').trim();
    var supplier = selected || typed.split(',')[0] || (window.uiState && uiState.supplier) || '';
    var rows = await entries();
    if(supplier) rows = rows.filter(function(r){ return (r.supplier || '') === supplier; });
    var sum = (typeof totals === 'function') ? totals(rows) : {};
    var detail = rows.map(function(r){ return {date:safeDate(r.created_at), type:labelOf(r), order:r.order_no||'', invoice:r.invoice_no||'', project:r.project||'', total:safeMoney(r.total||r.amount||0), due:safeMoney(r.amount_due||0), status:r.status||''}; });
    try{ if(window.closeSupplierReportModal) window.closeSupplierReportModal(); }catch(e){}
    openDoc({
      type:'SUPPLIER REPORT', documentNo:'SUPPLIER', period:reportPeriod(),
      meta:[{label:'SUPPLIER', value:supplier || 'All Suppliers'}, {label:'PERIOD', value:reportPeriod()}, {label:'ENTRIES', value:String(rows.length)}],
      sectionTitle:'Supplier Entries',
      columns:[{key:'date',label:'Date'}, {key:'type',label:'Type'}, {key:'order',label:'Order'}, {key:'invoice',label:'Invoice'}, {key:'project',label:'Project'}, {key:'total',label:'Total',num:true}, {key:'due',label:'Due',num:true}, {key:'status',label:'Status'}],
      rows:detail,
      totals:[{label:'Invoices Net', value:safeMoney(sum.invoiceTotal || 0), major:true}, {label:'Outstanding', value:safeMoney(sum.outstanding || 0), major:true}]
    });
  };
})();
</script>
