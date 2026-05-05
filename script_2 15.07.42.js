/* === V117 FINANCIAL STATUS FROM REAL TABLE AMOUNT DUE + CREDIT ===
   Passive display only. Login/auth untouched.
   Source of truth for financial money:
   - Outstanding = SUM(Amount Due)
   - Credit Balance = Deposit/Credit - Deposit Applied, using After VAT / Total
   - Deposit / Credit = SUM(Deposit rows Total/Order Amount)
   - Invoiced = SUM(invoice rows Total (Invoice), DN amount where visible)
   - Open Supply = Orders - Delivered
*/
(function(){
  if(window.__v117FinancialStatusLoaded) return;
  window.__v117FinancialStatusLoaded = true;

  let timer = null;
  let lastSignature = "";

  function parseMoney(txt){
    const s = String(txt || "")
      .replace(/R/g,"")
      .replace(/\s/g,"")
      .replace(/,/g,".")
      .replace(/[^\d.-]/g,"");
    return Number(s || 0);
  }

  function moneyFmt(n){
    try{
      if(typeof money === "function") return money(Number(n || 0));
    }catch(e){}
    return "R " + Number(n || 0).toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function norm(v){
    return String(v || "").trim().toLowerCase();
  }

  function findMainTable(){
    const tables = Array.from(document.querySelectorAll("table"));
    return tables.find(t => {
      const headers = Array.from(t.querySelectorAll("thead th")).map(th => norm(th.textContent)).join("|");
      return headers.includes("supplier") &&
             headers.includes("process") &&
             headers.includes("amount due") &&
             headers.includes("supplier credit balance");
    }) || null;
  }

  function colIndex(headers, keys){
    return headers.findIndex(h => keys.some(k => h.includes(k)));
  }

  function getVisibleRows(){
    const table = findMainTable();
    if(!table) return [];

    const headers = Array.from(table.querySelectorAll("thead th")).map(th => norm(th.textContent));

    const supplierI = colIndex(headers, ["supplier"]);
    const projectI = colIndex(headers, ["project"]);
    const processI = colIndex(headers, ["process", "type"]);
    const orderAmountI = colIndex(headers, ["order amount", "order total"]);
    const totalInvoiceI = colIndex(headers, ["total (invoice)", "total invoice", "invoice amount", "total"]);
    const deliveredI = colIndex(headers, ["delivered"]);
    const balanceI = colIndex(headers, ["balance"]);
    const invoiceI = colIndex(headers, ["invoice no"]);
    const dnI = colIndex(headers, ["delivery note", "dn", "dm"]);
    const statusI = colIndex(headers, ["status"]);
    const depositAppliedI = colIndex(headers, ["deposit applied"]);
    const amountDueI = colIndex(headers, ["amount due"]);
    const supplierCreditI = colIndex(headers, ["supplier credit balance"]);

    return Array.from(table.querySelectorAll("tbody tr")).map(tr => {
      const cells = Array.from(tr.querySelectorAll("td")).map(td => (td.textContent || "").trim());

      const process = processI >= 0 ? cells[processI] : "";
      const statusText = statusI >= 0 ? cells[statusI] : "";
      const invoiceNo = invoiceI >= 0 ? cells[invoiceI] : "";
      const dnNo = dnI >= 0 ? cells[dnI] : "";

      const isDeposit = /deposit|advance payment/i.test(process + " " + statusText);

      const rawOrderAmount = orderAmountI >= 0 ? parseMoney(cells[orderAmountI]) : 0;
      const rawTotalInvoice = totalInvoiceI >= 0 ? parseMoney(cells[totalInvoiceI]) : 0;
      const delivered = deliveredI >= 0 ? parseMoney(cells[deliveredI]) : 0;
      const tableBalance = balanceI >= 0 ? parseMoney(cells[balanceI]) : 0;
      const depositApplied = depositAppliedI >= 0 ? parseMoney(cells[depositAppliedI]) : 0;
      const amountDue = amountDueI >= 0 ? parseMoney(cells[amountDueI]) : 0;
      const supplierCreditBalance = supplierCreditI >= 0 ? parseMoney(cells[supplierCreditI]) : 0;

      let order = 0;
      let invoiced = 0;
      let openSupply = 0;
      let depositCredit = 0;
      let outstanding = 0;
      let creditBalance = 0;

      if(isDeposit){
        // Deposit is only credit/payment.
        // Use Total After VAT / Total basis, not supplier_credit_balance if it was calculated before VAT.
        depositCredit = rawTotalInvoice || rawOrderAmount;
        creditBalance = 0;
      } else {
        const hasInvoice = !!invoiceNo || /invoice/i.test(process);
        const hasDN = !!dnNo || delivered > 0 || /delivery note/i.test(process);

        order = rawOrderAmount;

        // Invoice rows: use visible invoice total, but if delivered exists and invoice total was polluted by order,
        // use delivered when it is lower and positive.
        if(hasInvoice){
          if(delivered > 0 && rawTotalInvoice > delivered){
            invoiced = delivered;
          } else {
            invoiced = rawTotalInvoice || delivered;
          }
        }

        // Supply open is not a financial debt.
        if(order > 0){
          openSupply = Math.max(0, order - delivered);
        } else if(tableBalance > 0 && !hasInvoice){
          openSupply = tableBalance;
        }

        // REAL source of truth for money outstanding:
        // use the visible Amount Due column.
        outstanding = amountDue;

        // Avoid false credit duplication on invoice rows; credit balance belongs to deposit carry-forward.
        creditBalance = 0;
      }

      return {
        supplier: supplierI >= 0 ? cells[supplierI] : "No Supplier",
        project: projectI >= 0 ? cells[projectI] : "No Project",
        process,
        statusText,
        isDeposit,
        order,
        delivered: isDeposit ? 0 : delivered,
        invoiced,
        openSupply,
        depositCredit,
        depositApplied,
        outstanding,
        creditBalance
      };
    }).filter(r =>
      r.supplier || r.project || r.order || r.delivered || r.invoiced ||
      r.openSupply || r.depositCredit || r.outstanding || r.creditBalance
    );
  }

  function build(){
    try{
      const rows = getVisibleRows();
      if(!rows.length) return;

      const signature = JSON.stringify(rows);
      if(signature === lastSignature && document.getElementById("safeFinancialStatus")) return;
      lastSignature = signature;

      document.getElementById("safeFinancialStatus")?.remove();

      const totals = rows.reduce((a,r) => {
        a.order += r.order || 0;
        a.delivered += r.delivered || 0;
        a.invoiced += r.invoiced || 0;
        a.openSupply += r.openSupply || 0;
        a.depositCredit += r.depositCredit || 0;
        a.depositApplied += r.depositApplied || 0;
        a.outstanding += r.outstanding || 0;
        // Credit Balance is recalculated below from Deposit/Credit - Deposit Applied on After VAT / Total basis.
        a.creditBalance += 0;
        return a;
      }, {
        order:0,
        delivered:0,
        invoiced:0,
        openSupply:0,
        depositCredit:0,
        depositApplied:0,
        outstanding:0,
        creditBalance:0
      });

      // Final credit logic:
      // Credit Balance must be based on Total After VAT deposits minus applied deposits.
      totals.creditBalance = Math.max(0, totals.depositCredit - totals.depositApplied);

      const box = document.createElement("div");
      box.id = "safeFinancialStatus";
      box.className = "card safe-financial-status";
      box.innerHTML = `
<h2 style="margin-bottom:15px;">Financial Status</h2>

<div style="display:flex;gap:15px;margin-bottom:15px;flex-wrap:wrap;">
  <div class="card"><div>Orders</div><b style="color:#6ea8ff">${moneyFmt(totals.order)}</b></div>
  <div class="card"><div>Delivered</div><b style="color:#4cd964">${moneyFmt(totals.delivered)}</b></div>
  <div class="card"><div>Invoiced</div><b style="color:#f5c542">${moneyFmt(totals.invoiced)}</b></div>
  <div class="card"><div>Open Supply</div><b style="color:${totals.openSupply>0?'#ff6b6b':'#4cd964'}">${moneyFmt(totals.openSupply)}</b></div>
  <div class="card"><div>Deposit / Credit</div><b style="color:#e6c79c">${moneyFmt(totals.depositCredit)}</b></div>
  <div class="card"><div>Deposit Applied</div><b style="color:#f0cfa0">${moneyFmt(totals.depositApplied)}</b></div>
  <div class="card"><div>Outstanding</div><b style="color:${totals.outstanding>0?'#ff9b9b':'#4cd964'}">${moneyFmt(totals.outstanding)}</b></div>
  <div class="card"><div>Credit Balance</div><b style="color:#d9b991">${moneyFmt(totals.creditBalance)}</b></div>
</div>

<div class="card fs-project-bubble"></div>
`;

      const transparency = document.querySelector("#transparencyDashboard");
      const panel = document.querySelector(".panel");
      if(transparency) transparency.insertAdjacentElement("afterend", box);
      else if(panel) panel.prepend(box);
    }catch(e){
      console.warn("V117 Financial Status skipped", e);
    }
  }

  function schedule(){
    clearTimeout(timer);
    timer = setTimeout(build, 600);
  }

  window.addEventListener("load", () => {
    setTimeout(schedule, 1200);
    setTimeout(schedule, 2500);
  });
  document.addEventListener("click", () => setTimeout(schedule, 700), true);
  document.addEventListener("change", schedule, true);
})();