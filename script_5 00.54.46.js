(function(){
  window.getLocalDateV97 = function(value){
    if(!value){
      var d0 = new Date();
      return d0.getFullYear() + '-' + String(d0.getMonth()+1).padStart(2,'0') + '-' + String(d0.getDate()).padStart(2,'0');
    }
    try{
      if(typeof localDateFromAnyV97 === 'function') return localDateFromAnyV97(value);
      var d = new Date(value);
      if(isNaN(d.getTime())) return String(value).slice(0,10);
      return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    }catch(e){ return String(value||'').slice(0,10); }
  };
  function updateDailyDateOnly(){
    var today = window.getLocalDateV97();
    var el = document.querySelector('.daily-header-bar .daily-title .daily-value, #daily-date');
    if(el) el.textContent = today;
    var bar = document.querySelector('.daily-header-bar');
    if(bar) bar.setAttribute('data-daily-date', today);
  }
  updateDailyDateOnly();
  setInterval(updateDailyDateOnly, 60000);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) updateDailyDateOnly(); });
  window.addEventListener('focus', updateDailyDateOnly);
})();


/* === V148 SAFE INLINE REPORTS - NO LOGIN TOUCH === */
(function(){
  if(window.__v148InlineReportsSafe) return;
  window.__v148InlineReportsSafe = true;

  function ensureInlineReportModal(){
    let modal = document.getElementById("inlineReportModal");
    if(modal) return modal;

    modal = document.createElement("div");
    modal.id = "inlineReportModal";
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-box inline-report-box">
        <div class="inline-report-toolbar">
          <div>
            <h2 id="inlineReportTitle" style="margin:0">Report</h2>
            <p class="muted" style="margin:4px 0 0">Opened inside Vardophase</p>
          </div>
          <div class="inline-report-actions">
            <button class="warning" type="button" onclick="window.printInlineReport()">Print</button>
            <button class="ghost" type="button" onclick="window.closeInlineReport()">Back</button>
          </div>
        </div>
        <iframe id="inlineReportFrame" title="Report"></iframe>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
  }

  window.closeInlineReport = function(){
    const modal = document.getElementById("inlineReportModal");
    const frame = document.getElementById("inlineReportFrame");
    if(frame) frame.srcdoc = "";
    if(modal) modal.classList.remove("show");
  };

  window.printInlineReport = function(){
    const frame = document.getElementById("inlineReportFrame");
    if(frame && frame.contentWindow){
      frame.contentWindow.focus();
      frame.contentWindow.print();
    }
  };

  function cleanReportHtml(reportHtml){
    let h = String(reportHtml || "");
    h = h.replace(/window\.onload\s*=\s*\(\)\s*=>\s*window\.print\(\)/g, "");
    h = h.replace(/<script>[\s\S]*?window\.print\(\)[\s\S]*?<\/script>/g, "");

    const reportCss = `
      <style>
        html,body{background:#fff!important;color:#111!important;font-family:Arial,Helvetica,sans-serif!important;margin:0!important;padding:16px!important;-webkit-text-size-adjust:100%;}
        h1,h2,h3,p,div,span,td,th{color:#111!important;}
        h1{font-size:28px!important;margin:0 0 14px!important;}
        .card{display:inline-block!important;background:#f7f8fb!important;border:1px solid #d9dee8!important;border-radius:12px!important;padding:10px 12px!important;margin:5px!important;color:#111!important;}
        table{width:100%!important;border-collapse:collapse!important;background:#fff!important;color:#111!important;}
        th{background:#edf2ff!important;color:#111!important;font-weight:800!important;}
        td{background:#fff!important;color:#111!important;}
        th,td{border:1px solid #cfd6e4!important;padding:7px!important;font-size:12px!important;vertical-align:top!important;}
        @media(max-width:820px){body{padding:10px!important;overflow-x:auto!important;}h1{font-size:22px!important;}table{min-width:980px!important;}th,td{font-size:11px!important;padding:6px!important;}}
        @media print{body{padding:0!important;}}
      </style>
    `;
    if(h.includes("</head>")) return h.replace("</head>", reportCss + "</head>");
    return "<!doctype html><html><head>" + reportCss + "</head><body>" + h + "</body></html>";
  }

  window.openReportInlineV148 = function(title, url){
    const modal = ensureInlineReportModal();
    const frame = modal.querySelector("#inlineReportFrame");
    const titleEl = modal.querySelector("#inlineReportTitle");
    if(titleEl) titleEl.textContent = title || "Report";

    function showUrl(u){
      if(!frame) return;
      frame.removeAttribute("srcdoc");
      frame.src = String(u || "about:blank");
      modal.classList.add("show");
    }
    if(url && url !== "about:blank") showUrl(url);

    const doc = {
      _html: "",
      open: function(){ this._html = ""; },
      write: function(s){ this._html += String(s || ""); },
      writeln: function(s){ this._html += String(s || "") + "\n"; },
      close: function(){
        if(frame){
          frame.removeAttribute("src");
          frame.srcdoc = cleanReportHtml(this._html);
        }
        modal.classList.add("show");
      }
    };
    return {
      document: doc,
      location: { href: url || "about:blank" },
      close: function(){ window.closeInlineReport(); },
      focus: function(){},
      print: function(){ window.printInlineReport(); }
    };
  };

  function wrapReport(name, title){
    const original = window[name];
    if(typeof original !== "function" || original.__v148Wrapped) return;
    const wrapped = async function(){
      const oldOpen = window.open;
      window.open = function(url, target, features){
        if(!url || url === "" || target === "_blank"){
          return window.openReportInlineV148(title || "Report", url || "");
        }
        return oldOpen ? oldOpen.call(window, url, target, features) : null;
      };
      try{
        return await original.apply(this, arguments);
      } finally {
        window.open = oldOpen;
      }
    };
    wrapped.__v148Wrapped = true;
    window[name] = wrapped;
  }

  function wrapReportsNow(){
    wrapReport("runSupplierReport", "Supplier Report");
    wrapReport("printSupplierSummary", "Supplier Report");
    wrapReport("printSupplierDepositReport", "Supplier Credit Statement");
    wrapReport("printSupplierCreditStatement", "Supplier Credit Statement");
    wrapReport("printProjectSummary", "Project Report");
    wrapReport("printMonthlyReport", "Monthly Report");
    wrapReport("printOpenOrdersReport", "Open Orders Report");
    wrapReport("openAuditLog", "Audit Log");
    wrapReport("printTransparencyReport", "Transparency Report");
    wrapReport("printProjectTransparencyReport", "Project Transparency");
    wrapReport("shareMonthlyToWhatsApp", "Monthly PDF");
  }

  wrapReportsNow();
  setTimeout(wrapReportsNow, 700);
  setTimeout(wrapReportsNow, 2000);
})();

/* === V160 FINAL REPORT SAFETY - INTERNAL ONLY, LOGIN UNTOUCHED === */
(function(){
  if(window.__v160FinalReportSafety) return;
  window.__v160FinalReportSafety = true;
  const titles = {
    runSupplierReport:"Supplier Report",
    printSupplierSummary:"Supplier Report",
    printSupplierDepositReport:"Supplier Credit Statement",
    printSupplierCreditStatement:"Supplier Credit Statement",
    printProjectSummary:"Project Report",
    printMonthlyReport:"Monthly Report",
    printOpenOrdersReport:"Open Orders Report",
    openAuditLog:"Audit Log",
    printTransparencyReport:"Transparency Report",
    printProjectTransparencyReport:"Project Transparency",
    shareMonthlyToWhatsApp:"Monthly PDF"
  };
  function showInline(title, url){
    if(typeof window.openReportInlineV148 === "function") return window.openReportInlineV148(title || "Report", url || "");
    return null;
  }
  function wrap(name){
    const fn = window[name];
    if(typeof fn !== "function" || fn.__v160Wrapped) return;
    const wrapped = async function(){
      const previousOpen = window.open;
      window.open = function(url, target, features){
        const u = String(url || "");
        if(!u || target === "_blank" || u.startsWith("blob:") || u.startsWith("data:application/pdf")){
          return showInline(titles[name] || "Report", u);
        }
        return previousOpen ? previousOpen.call(window, url, target, features) : null;
      };
      try{ return await fn.apply(this, arguments); }
      finally { window.open = previousOpen; }
    };
    wrapped.__v160Wrapped = true;
    window[name] = wrapped;
  }
  function apply(){ Object.keys(titles).forEach(wrap); }
  apply();
  setTimeout(apply, 300);
  setTimeout(apply, 1200);
  setTimeout(apply, 3000);
})();




/* === V168 DN APPROVER ROLE PATCH === */
(function(){
  if(window.__v168DnApproverPatch) return;
  window.__v168DnApproverPatch = true;

  function isDNApproverLocal(){
    try { return String(currentRole || "").toLowerCase() === "dn_approver"; }
    catch(e){ return false; }
  }

  function applyDNApproverUI(){
    if(isDNApproverLocal()){
      document.body.classList.add("role-dn-approver");
    } else {
      document.body.classList.remove("role-dn-approver");
    }
  }

  function denyDNApprover(){
    alert("This user can only approve Convert Order to DN.");
    return false;
  }

  function blockDNApproverActions(){
    if(!isDNApproverLocal()) return;

    const blockedNames = [
      "openEntryModal",
      "openDepositModal",
      "openConvertOrderModal",
      "convertOrderToInvoice",
      "bulkMarkPaid",
      "bulkDelete",
      "duplicateEntry",
      "duplicateSelected",
      "openSettingsModal",
      "openRolesModal",
      "printMonthlyReport",
      "printProjectSummary",
      "printSupplierSummary",
      "printSupplierCreditStatement",
      "printOpenOrdersReport",
      "openAuditLog",
      "printTransparencyReport",
      "printProjectTransparencyReport"
    ];

    blockedNames.forEach(function(name){
      const fn = window[name];
      if(typeof fn === "function" && !fn.__v168BlockedForDnApprover){
        const blocked = function(){ return denyDNApprover(); };
        blocked.__v168BlockedForDnApprover = true;
        window[name] = blocked;
      }
    });
  }

  // Allow DN approver through accountant permission only for DN flow.
  try{
    if(typeof canAccountant === "function" && !canAccountant.__v168DnApproverWrapped){
      const oldCanAccountant = canAccountant;
      canAccountant = function(){
        if(isDNApproverLocal()) return true;
        return oldCanAccountant.apply(this, arguments);
      };
      canAccountant.__v168DnApproverWrapped = true;
    }
  }catch(e){}

  // Harden DN conversion: only this action remains allowed.
  try{
    if(typeof window.convertOrderToDN === "function" && !window.convertOrderToDN.__v168DnApproverAllowed){
      const oldConvertOrderToDN = window.convertOrderToDN;
      const wrappedConvertOrderToDN = async function(){
        return await oldConvertOrderToDN.apply(this, arguments);
      };
      wrappedConvertOrderToDN.__v168DnApproverAllowed = true;
      window.convertOrderToDN = wrappedConvertOrderToDN;
    }
  }catch(e){}

  // Re-apply after renders/logins
  try{
    if(typeof render === "function" && !render.__v168DnApproverRenderWrapped){
      const oldRender = render;
      render = async function(){
        const result = await oldRender.apply(this, arguments);
        setTimeout(function(){
          applyDNApproverUI();
          blockDNApproverActions();
        }, 80);
        return result;
      };
      render.__v168DnApproverRenderWrapped = true;
    }
  }catch(e){}

  window.addEventListener("load", function(){
    setTimeout(applyDNApproverUI, 500);
    setTimeout(blockDNApproverActions, 700);
    setTimeout(applyDNApproverUI, 1500);
    setTimeout(blockDNApproverActions, 1700);
  });

  document.addEventListener("click", function(){
    setTimeout(applyDNApproverUI, 40);
    setTimeout(blockDNApproverActions, 60);
  }, true);

  setInterval(function(){
    applyDNApproverUI();
    blockDNApproverActions();
  }, 2000);
})();
/* === END V168 DN APPROVER ROLE PATCH === */


/* === V251 expose supplier data engine for project dashboard === */
window.vpGetAllSupplierRows = async function(){
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("created_at", { ascending:false })
    .limit((typeof PERFORMANCE_CONFIG !== "undefined" && PERFORMANCE_CONFIG.hardLimit) ? PERFORMANCE_CONFIG.hardLimit : 5000);
  if(error) throw error;
  try{ return (typeof computeLedger === "function") ? computeLedger(data || []) : (data || []); }
  catch(e){ return data || []; }
};