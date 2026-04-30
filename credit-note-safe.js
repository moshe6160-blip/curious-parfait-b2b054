
/* ===== V258 SAFE CREDIT NOTE ===== */

function getSelectedSupplierRowForCredit(){
  const checked = document.querySelector('input[type="checkbox"]:checked, .row-select:checked, [data-selected="true"]');
  if(!checked){
    alert("Select an invoice/order row first");
    return null;
  }
  const row = checked.closest("tr, .record, .supplier-row, .entry-row");
  return row;
}

function openCreditNote(){
  const row = getSelectedSupplierRowForCredit();
  if(!row) return;

  const creditNo = prompt("Credit Note Number");
  if(!creditNo) return;

  const rawAmount = prompt("Credit Note Amount");
  const amount = Number(String(rawAmount || "").replace(/[^0-9.-]/g,""));
  if(!amount || amount <= 0){
    alert("Invalid Credit Note amount");
    return;
  }

  const reason = prompt("Reason / Note","Credit note") || "Credit note";

  const credit = {
    id: "CN-" + Date.now(),
    creditNo,
    amount,
    reason,
    date: new Date().toISOString().slice(0,10)
  };

  const rowId = row.dataset.id || row.getAttribute("data-row-id") || row.getAttribute("data-invoice-id");

  let credits = JSON.parse(localStorage.getItem("supplier_credit_notes") || "[]");
  credits.push({
    ...credit,
    sourceRowId: rowId || null
  });
  localStorage.setItem("supplier_credit_notes", JSON.stringify(credits));

  row.classList.add("has-credit-note");
  row.dataset.creditAmount = String((Number(row.dataset.creditAmount || 0) + amount));

  alert("Credit Note saved and linked to selected invoice/order.");

  if(typeof renderSuppliers === "function") renderSuppliers();
  if(typeof renderAll === "function") renderAll();
  if(typeof refreshDashboard === "function") refreshDashboard();
}

/* Helper for calculations:
   Outstanding = Invoice - Paid - Credit Notes
*/
function calcOutstandingWithCredit(invoiceAmount, paidAmount, sourceRowId){
  const credits = JSON.parse(localStorage.getItem("supplier_credit_notes") || "[]");
  const creditTotal = credits
    .filter(c => !sourceRowId || c.sourceRowId === sourceRowId)
    .reduce((s,c)=>s+Number(c.amount||0),0);

  return Number(invoiceAmount||0) - Number(paidAmount||0) - creditTotal;
}
