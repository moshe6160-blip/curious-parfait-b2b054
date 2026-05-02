
/* === V274 PRO LOGIC UPGRADE - CREDIT NOTE LEDGER A: INVOICE ONLY / LOGIN SAFE ===
   Safe override only: no login/auth code changed.
   Credit Note is always linked to a selected Invoice and saved as a separate negative row.
   DN amount is never changed. Invoice/order notes are updated for traceability.
*/
(function(){
  if(window.__v274CreditLedgerLoaded) return;
  window.__v274CreditLedgerLoaded = true;

  function num(v){ return Number(String(v == null ? 0 : v).replace(/[^0-9.-]/g,"")) || 0; }
  function today(){ return new Date().toISOString().slice(0,10); }
  function moneySafe(n){ try{ return money(Number(n||0)); }catch(e){ return "R " + Number(n||0).toLocaleString("en-ZA",{minimumFractionDigits:2, maximumFractionDigits:2}); } }
  function clean(v){ return String(v == null ? "" : v).trim(); }
  function kindOf(row){ try{ return String(displayEntryKind(row)||"").toLowerCase(); }catch(e){ return String(row.entry_type || row.process || row.status || "").toLowerCase(); } }
  function getInvoiceValue(row){
    try{ var v = Number(invoiceDisplayAmount(row)||0); if(v) return Math.abs(v); }catch(e){}
    return Math.abs(num(row.total || row.amount || row.net_amount || row.delivered || row.order_amount));
  }
  function getExistingCreditFromNotes(row){
    try{ if(typeof extractCreditAmount === "function") return Math.abs(Number(extractCreditAmount(row)||0)); }catch(e){}
    var n = String(row.notes||"");
    var m = n.match(/\[\[CREDIT:([^\]]+)\]\]/i);
    return m ? Math.abs(num(m[1])) : 0;
  }
  function upsertTag(notes, tag, val){
    notes = String(notes||"");
    try{ if(typeof upsertNoteTag === "function") return upsertNoteTag(notes, tag, val); }catch(e){}
    var re = new RegExp("\\\\[\\\\[" + tag + ":([^\\\\]]*)\\\\]\\\\]", "i");
    var line = "[[" + tag + ":" + val + "]]";
    return re.test(notes) ? notes.replace(re, line) : (notes + (notes ? "\n" : "") + line);
  }
  async function getAutoCreditNo(){
    try{
      var r = await supabase.from("suppliers").select("invoice_no,created_at", { count:"exact" }).eq("entry_type","credit_note").order("created_at", { ascending:false }).limit(200);
      var max = 0;
      (r.data||[]).forEach(function(x){
        var m = String(x.invoice_no||"").match(/CN[- ]?(\d+)/i);
        if(m) max = Math.max(max, parseInt(m[1],10)||0);
      });
      return "CN-" + String(max + 1).padStart(4,"0");
    }catch(e){ return "CN-" + String(Date.now()).slice(-6); }
  }
  async function getLinkedCreditTotal(invoiceRow){
    var total = getExistingCreditFromNotes(invoiceRow);
    try{
      var inv = clean(invoiceRow.invoice_no);
      var id = clean(invoiceRow.id);
      var q = await supabase.from("suppliers").select("total,amount,net_amount,notes,entry_type,status,invoice_no").eq("entry_type","credit_note").limit(1000);
      if(!q.error && Array.isArray(q.data)){
        var byRows = 0;
        q.data.forEach(function(r){
          var notes = String(r.notes||"");
          var isLinked = (id && notes.indexOf("[[CREDITPARENT:" + id + "]]") >= 0) || (inv && notes.indexOf("[[PARENTINVOICE:" + inv + "]]") >= 0);
          if(isLinked) byRows += Math.abs(num(r.total || r.amount || r.net_amount));
        });
        if(byRows > total) total = byRows;
      }
    }catch(e){}
    return total;
  }
  async function safeUpdateSupplier(id, payload){
    var cleanPayload = {};
    Object.keys(payload||{}).forEach(function(k){ if(payload[k] !== undefined) cleanPayload[k] = payload[k]; });
    if(!Object.keys(cleanPayload).length) return { error:null };
    return await supabase.from("suppliers").update(cleanPayload).eq("id", id);
  }
  async function updateLinkedOrder(invoiceRow, creditNo, creditAmount, reason, date){
    try{
      var supplier = clean(invoiceRow.supplier), orderNo = clean(invoiceRow.order_no), project = clean(invoiceRow.project);
      if(!supplier || !orderNo) return;
      var q = await supabase.from("suppliers").select("*").eq("supplier", supplier).eq("order_no", orderNo).limit(20);
      if(q.error || !Array.isArray(q.data)) return;
      for(const r of q.data){
        var k = kindOf(r);
        var isOrder = k === "order" || /order/i.test(String(r.entry_type||r.status||r.process||""));
        if(!isOrder) continue;
        if(project && clean(r.project) && clean(r.project) !== project) continue;
        var notes = String(r.notes||"");
        var oldCredit = 0;
        var m = notes.match(/\[\[ORDERCREDIT:([^\]]+)\]\]/i);
        if(m) oldCredit = Math.abs(num(m[1]));
        notes = upsertTag(notes, "ORDERCREDIT", (oldCredit + creditAmount).toFixed(2));
        notes += "\n[[ORDERCREDITHISTORY:" + date + " | " + creditNo + " | " + creditAmount.toFixed(2) + " | Invoice " + clean(invoiceRow.invoice_no) + " | " + reason + "]]";
        await safeUpdateSupplier(r.id, { notes: notes });
      }
    }catch(e){}
  }

  window.openCreditNoteModal = async function(){
    try{
      if(typeof supabase === "undefined" || !supabase) return alert("System is still loading. Refresh and try again.");
      if(typeof canAccountant === "function" && !canAccountant()) return alert("Only accountant / manager / admin can add Credit Note.");
      if(!Array.isArray(selectedIds) || selectedIds.length !== 1) return alert("Select exactly one Invoice row first.");

      var id = selectedIds[0];
      var res = await supabase.from("suppliers").select("*").eq("id", id).single();
      if(res.error || !res.data) return alert(res.error && res.error.message ? res.error.message : "Could not load selected row.");
      var row = res.data;
      var k = kindOf(row);
      var invNo = clean(row.invoice_no);
      if(!invNo || k === "order" || k === "deposit" || k === "delivery_note" || k === "delivery" || k === "credit_note"){
        return alert("Credit Note works only on a selected Invoice row with Invoice No.");
      }

      var invoiceValue = getInvoiceValue(row);
      if(invoiceValue <= 0) return alert("Invoice amount is missing. Cannot create Credit Note.");
      var existingCredit = await getLinkedCreditTotal(row);
      var remainingInvoiceForCredit = Math.max(0, invoiceValue - existingCredit);
      if(remainingInvoiceForCredit <= 0.01) return alert("This invoice is already fully credited.");

      var autoNo = await getAutoCreditNo();
      var creditNoInput = prompt("Credit Note Number", autoNo);
      if(creditNoInput === null) return;
      var creditNo = clean(creditNoInput) || autoNo;

      var dateInput = prompt("Credit Note Date", today());
      if(dateInput === null) return;
      var creditDate = clean(dateInput) || today();

      var reasonInput = prompt("Reason / Note", "Material quality issue");
      if(reasonInput === null) return;
      var reason = clean(reasonInput) || "Supplier credit note";

      var rawAmount = prompt(
        "Credit Note Amount" +
        "\nInvoice: " + invNo +
        "\nInvoice value: " + moneySafe(invoiceValue) +
        "\nAlready credited: " + moneySafe(existingCredit) +
        "\nAvailable to credit: " + moneySafe(remainingInvoiceForCredit) +
        "\n\nCredit Note will be a separate row linked to this invoice.",
        remainingInvoiceForCredit.toFixed(2)
      );
      if(rawAmount === null) return;
      var creditAmount = Math.abs(num(rawAmount));
      if(creditAmount <= 0) return alert("Invalid Credit Note amount.");
      if(creditAmount > remainingInvoiceForCredit + 0.01){
        return alert("Credit Note cannot be greater than the remaining invoice value. Max: " + moneySafe(remainingInvoiceForCredit));
      }

      var newCreditTotal = existingCredit + creditAmount;
      var depositApplied = Math.max(0, num(row.deposit_applied));
      var netInvoiceAfterCredit = Math.max(0, invoiceValue - newCreditTotal);
      var invoiceDueAfterCredit = Math.max(0, invoiceValue - depositApplied - newCreditTotal);
      var newStatus = netInvoiceAfterCredit <= 0.01 ? "Credited (full)" : "Credited (partial)";

      var notes = String(row.notes || "");
      notes = upsertTag(notes, "CREDIT", newCreditTotal.toFixed(2));
      notes = upsertTag(notes, "LASTCREDITNO", creditNo);
      notes = upsertTag(notes, "LASTCREDITDATE", creditDate);
      notes = upsertTag(notes, "LASTCREDITREASON", reason);
      notes += "\n[[CREDITHISTORY:" + creditDate + " | " + creditNo + " | " + creditAmount.toFixed(2) + " | " + reason + "]]";

      var upd = await safeUpdateSupplier(id, { notes: notes, status: newStatus, amount_due: invoiceDueAfterCredit, unpaid_after_deposit: invoiceDueAfterCredit });
      if(upd.error && /column|schema cache/i.test(upd.error.message||"")){
        upd = await safeUpdateSupplier(id, { notes: notes, status: newStatus });
      }
      if(upd.error) return alert(upd.error.message);

      await updateLinkedOrder(row, creditNo, creditAmount, reason, creditDate);

      var creditNotes =
        "Credit Note linked to Invoice " + invNo + "\n" +
        "[[PARENTINVOICE:" + invNo + "]]\n" +
        "[[CREDITPARENT:" + clean(id) + "]]\n" +
        "[[CREDITNO:" + creditNo + "]]\n" +
        "[[CREDITDATE:" + creditDate + "]]\n" +
        "[[CREDITREASON:" + reason + "]]\n" +
        "[[CREDITAMOUNT:" + creditAmount.toFixed(2) + "]]";

      var payload = {
        supplier: row.supplier || null,
        order_no: row.order_no || null,
        invoice_no: creditNo,
        project: row.project || null,
        description: "Credit Note - " + reason,
        net_amount: -creditAmount,
        vat_amount: 0,
        total: -creditAmount,
        amount: -creditAmount,
        delivered: 0,
        balance: 0,
        amount_due: 0,
        unpaid_after_deposit: 0,
        status: "Credit Note",
        notes: creditNotes,
        entry_type: "credit_note",
        created_by: (window.currentUser && currentUser.email) ? currentUser.email : ""
      };
      var ins = await supabase.from("suppliers").insert([payload]);
      if(ins.error && /column|schema cache/i.test(ins.error.message||"")){
        delete payload.amount_due; delete payload.unpaid_after_deposit; delete payload.delivered; delete payload.balance;
        ins = await supabase.from("suppliers").insert([payload]);
      }
      if(ins.error) return alert("Invoice was updated, but Credit Note row could not be created: " + ins.error.message);

      try{ if(typeof logAudit === "function") await logAudit("credit_note_ledger", "invoice=" + invNo + " cn=" + creditNo + " amount=" + creditAmount); }catch(e){}
      selectedIds = [];
      alert("Credit Note created: " + creditNo + " / " + moneySafe(creditAmount) + "\nInvoice net after credit: " + moneySafe(netInvoiceAfterCredit));
      if(typeof render === "function") await render();
    }catch(err){ alert((err && err.message) ? err.message : "Credit Note error"); }
  };
})();
