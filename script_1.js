window.onload=()=>window.print()<\/script>




</body></html>`);
  w.document.close();
};

window.exportCurrentCsv = async function(){
  if(!canAccountant()) return alert("Only accountant or admin can export CSV.");
  const rows = await getEntries();
  const headers = ["Date","Supplier","Invoice No","Project","Description","Net Before VAT","VAT","Total","Status","Created By","Notes"];
  const lines = [headers.join(",")];
  rows.forEach(r=>{
    const vals = [
      localDateFromAnyV97(r.created_at), r.supplier, r.invoice_no, r.project, r.description, r.net_amount, r.vat_amount, r.total||r.amount, r.status, r.created_by, r.notes
    ].map(v => `"${String(v ?? "").replaceAll('"','""')}"`);
    lines.push(vals.join(","));
  });
  const blob = new Blob([lines.join("\n")], {type:"text/csv;charset=utf-8;"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "Vardophase_Suppliers_Cloud.csv";
  a.click();
};

window.printSupplierSummary = async function(){
  return window.openSupplierReportModal();
};
window._legacyPrintSupplierSummary = async function(){
  const w = window.open("", "_blank");
  if(!w){ alert("Please allow pop-ups for reports."); return; }
  const rows = groupSummary(await getEntries(), "supplier");
  w.document.write(`<html><head><title>Supplier Summary</title><style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#dfeaff}</style>
<style>
/* SAFE UI ONLY - NO JS TOUCH */

body {
  background: #0f0f10;
}

/* cards polish */
.card {
  border-radius: 18px !important;
  border: 1px solid rgba(255,255,255,0.08) !important;
  background: rgba(255,255,255,0.03) !important;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

/* headings */
h2, .section-title {
  font-weight: 900 !important;
  color: #ffffff !important;
}

/* KPI colors */
.green { color: #4cd964 !important; }
.red { color: #ff6b6b !important; }
.blue { color: #6ea8ff !important; }
.yellow { color: #f5c542 !important; }

/* top header spacing */
header, .topbar, .app-header {
  padding: 12px 20px !important;
}

/* small daily inline (visual only placeholder) */
.logo::after {
  content: "  |  LIVE";
  color: #d9b991;
  font-size: 12px;
  margin-left: 10px;
}

</style>



<style id="v84-bubble-size-and-financial-card">
/* V84 UI-only: reduce app bubbles by 20% and polish Project BLU card. Login/auth untouched. */
#app .shell > header.card,
#app .shell > section.panel{
  border-radius: 26px !important;
  padding: 22px !important;
}
#app .shell .card,
#app .shell .panel,
#app .shell .stat,
#app .shell .alert-card,
#app .shell .fs-card,
#app #safeFinancialStatus .card{
  border-radius: 22px !important;
}
#app .shell .stat{
  min-height: 112px !important;
  padding: 19px !important;
}
#app .shell .stat::after{
  width: 56px !important;
  height: 56px !important;
  right: 18px !important;
  top: 18px !important;
}
#app .shell .alert-card{
  min-height: 76px !important;
  padding: 14px !important;
}
#app .shell .stats{
  gap: 17px !important;
  margin-bottom: 19px !important;
}
#app .shell .toolbar{
  gap: 10px !important;
}
#app .shell button,
#app .shell .main-action,
#app .shell .month-btn,
#app .shell select.dark,
#app .shell input.dark{
  border-radius: 15px !important;
}
#app .shell .main-action,
#app .shell button{
  min-height: 42px !important;
  padding: 10px 14px !important;
}
#app .shell .label,
#app .shell .stat .label{
  font-size: 14px !important;
  margin-bottom: 9px !important;
}
#app .shell .value,
#app .shell .stat .value{
  font-size: 22px !important;
}
#app #safeFinancialStatus,
#app .safe-financial-status,
#app #financialStatus,
#app .financial-status,
#app .fs-wrap{
  padding: 24px !important;
  border-radius: 27px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"]{
  gap: 12px !important;
  margin-bottom: 16px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"] > .card{
  padding: 14px !important;
  min-height: 78px !important;
  min-width: 160px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"] .card div{
  font-size: 12px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"] .card b{
  font-size: 19px !important;
}
#app .fs-project-bubble{
  margin-top: 10px !important;
  padding: 18px 20px !important;
  border-radius: 24px !important;
  background:
    radial-gradient(circle at 92% 22%, rgba(227,191,140,.15), transparent 26%),
    linear-gradient(180deg, rgba(255,255,255,.065), rgba(255,255,255,.018)) !important;
  border: 1px solid rgba(227,191,140,.22) !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 12px 30px rgba(0,0,0,.22) !important;
}
#app .fs-project-head{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:12px;
  padding-bottom: 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(255,255,255,.08);
}
#app .fs-project-label{
  color:#c9b18d;
  font-size:12px;
  font-weight:800;
  letter-spacing:.08em;
  text-transform:uppercase;
}
#app .fs-project-bubble h3{
  margin:0 !important;
  font-size:24px !important;
  color:#fff !important;
  line-height:1.05 !important;
}
#app .fs-project-bubble > div:not(.fs-project-head){
  display:flex;
  justify-content:space-between;
  gap:18px;
  align-items:center;
  padding: 5px 0;
  font-size:15px !important;
  color:#d8dce6;
}
#app .fs-project-bubble b{
  font-size:16px !important;
}
@media(max-width:720px){
  #app .shell > header.card,
  #app .shell > section.panel{padding:16px !important;border-radius:23px !important;}
  #app .shell .stats{grid-template-columns:repeat(2,minmax(0,1fr)) !important;gap:11px !important;}
  #app .shell .stat{min-height:94px !important;padding:14px !important;border-radius:19px !important;}
  #app .shell .value,#app .shell .stat .value{font-size:19px !important;}
  #app #safeFinancialStatus,.safe-financial-status,#financialStatus,.financial-status,.fs-wrap{padding:18px !important;border-radius:23px !important;}
  #app #safeFinancialStatus > div[style*="display:flex"] > .card{min-width:130px !important;}
  #app .fs-project-bubble{padding:15px !important;border-radius:20px !important;}
}
</style>





<style id="remove-project-dashboard-v105">
/* V105: fully hide Project dashboard/card block. Login/auth untouched. */
#project-status,
#project-financial-status,
#projectDashboard,
#project-dashboard,
#projectCard,
#project-card,
#projects,
#projects-dashboard,
.project-status,
.project-financial-status,
.project-dashboard,
.project-card,
.project-summary-card,
.project-financial-card,
.projects-card,
.projects-dashboard,
.card.project,
.panel.project,
section.project,
div[data-section="project"],
div[data-card="project"],
div[data-title="PROJECT"],
div[data-title="Project"] {
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
  min-height: 0 !important;
  max-height: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
}

/* Hide the specific legacy block by content structure when present */
.financial-project-card,
.financial-project-panel,
.project-breakdown,
.project-breakdown-card,
.project-kpi-card {
  display: none !important;
}
</style>



<style id="v111-deposit-paid-lock">
/* Deposit status locked as Paid; login/auth untouched. */
.deposit-paid-locked { pointer-events:none; opacity:.75; }
</style>


<style id="v112-deposit-hard-lock">
/* V112: Deposit status is hard-locked to Paid and hidden. Login/auth untouched. */
#entryStatusWrap[style*="display: none"] { display:none !important; }
#entryStatus:disabled { pointer-events:none !important; opacity:.7 !important; }
</style>


<style id="v113-deposit-display">
/* V113: Deposit displayed as separate type, not Order. Login/auth untouched. */
.table-wrap .status-deposit,
.table-wrap .kind-deposit,
.badge.deposit {
  color:#111 !important;
  border-color:rgba(217,185,145,.34) !important;
  background:linear-gradient(145deg, #e4c9a7 0%, #d2ad83 44%, #bb9061 100%) !important;
}
</style>


<style id="v119-cosmetic-buttons">
/* V119 cosmetic buttons only. Login/auth/logic untouched. */

/* Add Deposit: close to Invoice gold, but slightly more copper/rose-gold */
button.add-deposit-btn,
#app button.add-deposit-btn {
  background:
    radial-gradient(circle at 22% 15%, rgba(255,255,255,.34), transparent 24%),
    linear-gradient(135deg, #f2d0a2 0%, #d7a56f 46%, #b9814f 100%) !important;
  color: #121212 !important;
  border: 1px solid rgba(255,222,176,.75) !important;
  font-weight: 900 !important;
  letter-spacing: .01em !important;
  box-shadow:
    0 10px 24px rgba(217,165,111,.22),
    inset 0 1px 0 rgba(255,255,255,.38) !important;
}
button.add-deposit-btn:hover,
#app button.add-deposit-btn:hover {
  filter: brightness(1.08) saturate(1.05) !important;
  transform: translateY(-1px) !important;
}

/* Delete Selected: designed red button with black text */
button.delete-selected-btn,
#app button.delete-selected-btn {
  background:
    radial-gradient(circle at 20% 14%, rgba(255,255,255,.24), transparent 26%),
    linear-gradient(135deg, #ff7373 0%, #e13737 45%, #a90000 100%) !important;
  color: #050505 !important;
  border: 1px solid rgba(255,80,80,.85) !important;
  font-weight: 950 !important;
  letter-spacing: .01em !important;
  text-shadow: none !important;
  box-shadow:
    0 10px 24px rgba(255,0,0,.20),
    inset 0 1px 0 rgba(255,255,255,.30) !important;
}
button.delete-selected-btn:hover,
#app button.delete-selected-btn:hover {
  filter: brightness(1.08) saturate(1.08) !important;
  transform: translateY(-1px) !important;
}
</style>


<style id="v121-header-daily-premium-layout">
/* V121: Premium header / logo / daily spacing only. Login/auth/logic untouched. */

#app .brand {
  align-items: center !important;
  gap: 22px !important;
}

#app .brand-left {
  display: grid !important;
  grid-template-columns: auto 1fr !important;
  align-items: center !important;
  column-gap: 22px !important;
  row-gap: 12px !important;
  width: 100% !important;
}

#app .logo {
  width: 72px !important;
  height: 72px !important;
  min-width: 72px !important;
  border-radius: 22px !important;
  font-size: 34px !important;
  box-shadow:
    0 14px 32px rgba(217,185,145,.22),
    inset 0 1px 0 rgba(255,255,255,.38) !important;
}

#app .logo::after {
  content: "LIVE" !important;
  position: absolute !important;
  right: -12px !important;
  bottom: 10px !important;
  font-size: 11px !important;
  color: rgba(255,255,255,.38) !important;
  letter-spacing: .05em !important;
  margin: 0 !important;
}

#app .title {
  font-size: clamp(34px, 4.2vw, 56px) !important;
  line-height: .95 !important;
  letter-spacing: -.04em !important;
  margin-bottom: 6px !important;
}

#app .brand-subtitle {
  font-size: 18px !important;
  color: #e5c79e !important;
  margin-bottom: 18px !important;
}

#app .daily-header-bar {
  display: grid !important;
  grid-template-columns: minmax(190px, auto) repeat(3, minmax(170px, auto)) !important;
  gap: 14px !important;
  align-items: stretch !important;
  margin: 14px 0 16px !important;
  max-width: 920px !important;
}

#app .daily-chip {
  min-height: 74px !important;
  border-radius: 22px !important;
  padding: 14px 18px !important;
  background:
    radial-gradient(circle at 18% 16%, rgba(255,255,255,.13), transparent 30%),
    linear-gradient(145deg, rgba(255,255,255,.085), rgba(255,255,255,.025)) !important;
  border: 1px solid rgba(217,185,145,.22) !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.075),
    0 12px 28px rgba(0,0,0,.20) !important;
}

#app .daily-chip.daily-title {
  background:
    radial-gradient(circle at 18% 16%, rgba(255,255,255,.22), transparent 30%),
    linear-gradient(135deg, rgba(217,185,145,.32), rgba(86,66,44,.18)) !important;
}

#app .daily-label {
  display: block !important;
  font-size: 13px !important;
  line-height: 1 !important;
  font-weight: 950 !important;
  letter-spacing: .08em !important;
  color: #d9c2a1 !important;
  text-transform: uppercase !important;
  margin-bottom: 9px !important;
  white-space: nowrap !important;
}

#app .daily-value {
  display: block !important;
  font-size: 24px !important;
  line-height: 1.05 !important;
  font-weight: 950 !important;
  color: #ffffff !important;
  letter-spacing: -.02em !important;
  white-space: nowrap !important;
}

#app .userbar {
  margin-top: 10px !important;
  display: flex !important;
  gap: 12px !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  font-size: 22px !important;
}

#app .role-badge {
  padding: 7px 18px !important;
  border-radius: 999px !important;
  font-size: 17px !important;
  font-weight: 950 !important;
}

#app header.card {
  padding-top: 30px !important;
  padding-bottom: 28px !important;
}

#app header.card .toolbar {
  margin-top: 26px !important;
}

/* Tablet / laptop narrow */
@media (max-width: 1050px) {
  #app .daily-header-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    max-width: 760px !important;
  }
}

/* Mobile */
@media (max-width: 720px) {
  #app .brand-left {
    grid-template-columns: 1fr !important;
    justify-items: center !important;
    text-align: center !important;
    gap: 14px !important;
  }

  #app .logo {
    width: 64px !important;
    height: 64px !important;
    min-width: 64px !important;
    font-size: 30px !important;
  }

  #app .title {
    font-size: 38px !important;
  }

  #app .brand-subtitle {
    font-size: 15px !important;
    margin-bottom: 14px !important;
  }

  #app .daily-header-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 10px !important;
    margin: 12px auto 14px !important;
    width: 100% !important;
  }

  #app .daily-chip {
    min-height: 66px !important;
    padding: 12px 14px !important;
    border-radius: 18px !important;
  }

  #app .daily-label {
    font-size: 11px !important;
    margin-bottom: 7px !important;
  }

  #app .daily-value {
    font-size: 19px !important;
  }

  #app .userbar {
    justify-content: center !important;
    font-size: 17px !important;
  }
}
</style>


<style id="v122-header-scale-50">
/* Reduce header elements to ~50% without changing layout */

#app .logo {
  width: 48px !important;
  height: 48px !important;
  min-width: 48px !important;
  font-size: 22px !important;
}

#app .title {
  font-size: 28px !important;
}

#app .brand-subtitle {
  font-size: 13px !important;
  margin-bottom: 8px !important;
}

#app .daily-chip {
  min-height: 44px !important;
  padding: 8px 12px !important;
  border-radius: 14px !important;
}

#app .daily-label {
  font-size: 10px !important;
  margin-bottom: 4px !important;
}

#app .daily-value {
  font-size: 15px !important;
}

#app .daily-header-bar {
  gap: 8px !important;
  margin: 6px 0 8px !important;
}

#app .userbar {
  font-size: 14px !important;
}

#app .role-badge {
  font-size: 12px !important;
  padding: 4px 10px !important;
}

#app header.card {
  padding-top: 14px !important;
  padding-bottom: 12px !important;
}
</style>


<style id="v127-button-colors">
/* Gold buttons like Order */
button[onclick*="convertOrderToDN"],
button[onclick*="convertOrderToInvoice"] {
  background: linear-gradient(135deg, #f2d3a0, #d4a65a) !important;
  color: #000 !important;
  font-weight: 700;
  border: 1px solid rgba(255,215,150,0.6);
  box-shadow: 0 6px 16px rgba(212,166,90,0.25);
}

button[onclick*="convertOrderToDN"]:hover,
button[onclick*="convertOrderToInvoice"]:hover {
  filter: brightness(1.05);
}

/* Softer red for delete */
button.delete-selected-btn {
  background: linear-gradient(135deg, #e06666, #a83232) !important;
  color: #000 !important;
  border: 1px solid rgba(200,80,80,0.6);
  box-shadow: 0 4px 12px rgba(160,50,50,0.25);
}

button.delete-selected-btn:hover {
  filter: brightness(1.05);
}
</style>


<style id="v128-gold-match-animation">
/* Match exact system gold (same tone as Order badge) */
button[onclick*="convertOrderToDN"],
button[onclick*="convertOrderToInvoice"] {
  background: linear-gradient(145deg, #e4c9a7 0%, #d2ad83 44%, #bb9061 100%) !important;
  color: #000 !important;
  border: 1px solid rgba(217,185,145,.45) !important;
  font-weight: 800;
  box-shadow:
    0 6px 18px rgba(187,144,97,.25),
    inset 0 1px 0 rgba(255,255,255,.35);
  transition: all 0.18s ease;
}

/* Hover glow animation (keyboard + mouse focus) */
button[onclick*="convertOrderToDN"]:hover,
button[onclick*="convertOrderToInvoice"]:hover,
button[onclick*="convertOrderToDN"]:focus,
button[onclick*="convertOrderToInvoice"]:focus {
  filter: brightness(1.12);
  box-shadow:
    0 0 0 2px rgba(217,185,145,.35),
    0 8px 22px rgba(187,144,97,.35),
    inset 0 1px 0 rgba(255,255,255,.45);
  transform: translateY(-1px);
}

/* Softer delete (keep elegant) */
button.delete-selected-btn {
  background: linear-gradient(145deg, #d97a7a 0%, #b84a4a 50%, #7a1f1f 100%) !important;
  color: #000 !important;
  border: 1px solid rgba(200,120,120,.5);
  transition: all 0.18s ease;
}

button.delete-selected-btn:hover,
button.delete-selected-btn:focus {
  filter: brightness(1.08);
  box-shadow:
    0 0 0 2px rgba(200,100,100,.25),
    0 8px 20px rgba(120,30,30,.3);
  transform: translateY(-1px);
}
</style>


<style id="v129-global-button-ux">
button {
  transition: all 0.15s ease;
  position: relative;
}

button:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
}

button:focus {
  outline: none;
  box-shadow:
    0 0 0 2px rgba(217,185,145,.35),
    0 6px 16px rgba(0,0,0,.25);
}

button:active {
  transform: translateY(1px) scale(0.97);
  box-shadow:
    inset 0 3px 8px rgba(0,0,0,.35);
}

button::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.2s ease;
  background: radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 60%);
}

button:active::after {
  opacity: 1;
}
</style>


<meta name="theme-color" content="#080808">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Vardophase">


<style id="v131-iphone-css-only-login-safe">
/* V131 iPhone CSS-only. No JS, no service worker, login/auth untouched. */

html, body {
  -webkit-text-size-adjust: 100%;
}

button,
select,
input,
textarea,
.month-btn,
.nav-pill {
  min-height: 44px;
  touch-action: manipulation;
}

@media (max-width: 820px) {
  body {
    padding: 8px !important;
  }

  #app .shell {
    padding: 8px 8px calc(80px + env(safe-area-inset-bottom)) !important;
    max-width: 100% !important;
  }

  #app header.card,
  #app section.panel,
  #app .card,
  #app .panel {
    border-radius: 20px !important;
  }

  #app header.card {
    padding: 12px !important;
  }

  #app .brand-left {
    display: grid !important;
    grid-template-columns: auto 1fr !important;
    gap: 10px !important;
    text-align: left !important;
    align-items: center !important;
  }

  #app .logo {
    width: 44px !important;
    height: 44px !important;
    min-width: 44px !important;
    border-radius: 14px !important;
    font-size: 20px !important;
  }

  #app .title {
    font-size: 24px !important;
    line-height: 1 !important;
    margin: 0 !important;
  }

  #app .brand-subtitle {
    font-size: 12px !important;
    margin: 3px 0 8px !important;
  }

  #app .daily-header-bar {
    grid-column: 1 / -1 !important;
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
    margin: 8px 0 6px !important;
    width: 100% !important;
    max-width: none !important;
  }

  #app .daily-chip {
    min-height: 54px !important;
    padding: 9px 10px !important;
    border-radius: 16px !important;
  }

  #app .daily-label {
    font-size: 10px !important;
    margin-bottom: 5px !important;
  }

  #app .daily-value {
    font-size: 16px !important;
    white-space: nowrap !important;
  }

  #app .userbar {
    grid-column: 1 / -1 !important;
    font-size: 12px !important;
    gap: 6px !important;
    margin-top: 6px !important;
  }

  #app header.card .toolbar {
    display: flex !important;
    overflow-x: auto !important;
    gap: 8px !important;
    padding: 4px 2px 8px !important;
    margin-top: 10px !important;
    -webkit-overflow-scrolling: touch;
  }

  #app header.card .toolbar button {
    flex: 0 0 auto !important;
    min-width: 122px !important;
    padding: 10px 12px !important;
    border-radius: 14px !important;
    font-size: 13px !important;
  }

  #app .filters {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 8px !important;
  }

  #app .filters input,
  #app .filters select,
  #app .filters button {
    width: 100% !important;
    font-size: 16px !important;
  }

  #app .month-tools {
    display: flex !important;
    overflow-x: auto !important;
    gap: 7px !important;
    padding-bottom: 6px !important;
    -webkit-overflow-scrolling: touch;
  }

  #app .month-btn {
    flex: 0 0 auto !important;
    min-width: 58px !important;
  }

  #safeFinancialStatus > div[style*="display:flex"],
  .safe-financial-status > div[style*="display:flex"],
  #app .stats,
  #app .alert-strip {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
  }

  #safeFinancialStatus .card,
  .safe-financial-status .card,
  #app .stat,
  #app .alert-card {
    min-height: 76px !important;
    padding: 11px !important;
    border-radius: 16px !important;
  }

  #app section.panel .toolbar {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
  }

  #app section.panel .toolbar button {
    width: 100% !important;
    min-height: 48px !important;
    border-radius: 15px !important;
    font-size: 13px !important;
    padding: 10px 8px !important;
  }

  #app .table-wrap {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    border-radius: 18px !important;
    max-width: 100% !important;
  }

  #app table {
    min-width: 1180px !important;
    font-size: 12px !important;
  }

  #app th,
  #app td {
    padding: 9px 8px !important;
    white-space: nowrap !important;
  }

  #app .modal-box,
  .modal-box {
    width: 100% !important;
    max-width: 100% !important;
    max-height: 92vh !important;
    overflow-y: auto !important;
    border-radius: 22px !important;
    padding: 14px !important;
  }

  #app .form-grid {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 10px !important;
  }

  #app input.dark,
  #app select.dark,
  #app textarea.dark {
    font-size: 16px !important;
    min-height: 46px !important;
  }
}
</style>


<style id="v133-iphone-refine-only">
/* V133: based on V131. Only fixes Change Password / Logout and table scrolling. Login untouched. */

@media (max-width: 820px) {
  /* Put Change Password + Logout in a clean row instead of floating/cutting */
  #app .brand > div[style*="justify-content:flex-end"] {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
    width: 100% !important;
    margin-top: 10px !important;
  }

  #app .brand > div[style*="justify-content:flex-end"] button {
    width: 100% !important;
    min-height: 44px !important;
    border-radius: 15px !important;
    font-size: 13px !important;
    padding: 9px 10px !important;
  }

  #app .brand > div[style*="justify-content:flex-end"] button.red {
    color: #ff8b8b !important;
  }

  /* Keep header compact like V131, not huge like V132 */
  #app header.card .toolbar {
    display: flex !important;
    overflow-x: auto !important;
    gap: 8px !important;
    padding: 4px 2px 8px !important;
    margin-top: 10px !important;
    -webkit-overflow-scrolling: touch !important;
    scroll-behavior: auto !important;
  }

  #app header.card .toolbar button {
    flex: 0 0 auto !important;
    min-width: 122px !important;
  }

  /* Faster, smoother horizontal table scrolling */
  #app .table-wrap {
    overflow-x: scroll !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
    scroll-behavior: auto !important;
    overscroll-behavior-x: contain !important;
    touch-action: pan-x pan-y !important;
  }

  #app .table-wrap table {
    min-width: 1320px !important;
  }

  /* Make row touch/drag feel less heavy */
  #app .table-wrap th,
  #app .table-wrap td {
    padding: 8px 7px !important;
  }

  #app .table-wrap tbody tr {
    contain: layout paint !important;
  }
}
</style>


<style id="v134-report-mobile-dark-fix">
/* V134 report readability + mobile return fix. Login untouched. */

/* If a generated report opens in same app window, force readable report styling */
body:has(h1):has(table) {
  background: #ffffff !important;
  color: #111111 !important;
}

body:has(h1):has(table) h1,
body:has(h1):has(table) h2,
body:has(h1):has(table) div,
body:has(h1):has(table) span,
body:has(h1):has(table) td,
body:has(h1):has(table) th {
  color: #111111 !important;
}

body:has(h1):has(table) table {
  background: #ffffff !important;
  color: #111111 !important;
}

body:has(h1):has(table) th {
  background: #edf2ff !important;
  color: #111111 !important;
}

body:has(h1):has(table) td {
  background: #ffffff !important;
  color: #111111 !important;
}

@media (max-width: 820px) {
  body:has(h1):has(table) {
    padding: 12px !important;
    overflow-x: auto !important;
  }
  body:has(h1):has(table) table {
    min-width: 980px !important;
  }
}
</style>


<style id="v136-selection-fix-css">
/* V136 selection UX. Login/auth untouched. */
tr.selected {
  background: rgba(217,185,145,.16) !important;
  box-shadow: inset 4px 0 0 rgba(217,185,145,.75) !important;
}
.row-check,
.premium-check {
  width: 22px !important;
  height: 22px !important;
  accent-color: #d2ad83 !important;
  cursor: pointer !important;
}
td:has(.row-check),
td:has(.premium-check) {
  cursor: pointer !important;
}
</style>


<style id="v148-inline-reports-safe-css">
#inlineReportModal.modal.show{
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  padding:18px!important;
  z-index:99999!important;
}
.inline-report-box{
  width:min(1180px,96vw)!important;
  max-height:92vh!important;
  display:flex!important;
  flex-direction:column!important;
  overflow:hidden!important;
}
.inline-report-toolbar{
  display:flex!important;
  justify-content:space-between!important;
  align-items:center!important;
  gap:10px!important;
  padding:12px 14px!important;
  border-bottom:1px solid rgba(217,185,145,.18)!important;
}
.inline-report-actions{display:flex!important;gap:8px!important;}
#inlineReportFrame{
  width:100%!important;
  height:76vh!important;
  border:0!important;
  background:#fff!important;
  border-radius:0 0 18px 18px!important;
}
@media(max-width:820px){
  #inlineReportModal.modal.show{padding:0!important;align-items:stretch!important;}
  .inline-report-box{width:100vw!important;max-width:100vw!important;height:100vh!important;max-height:100vh!important;border-radius:0!important;}
  .inline-report-toolbar{padding:10px!important;flex-wrap:wrap!important;}
  .inline-report-actions{width:100%!important;display:grid!important;grid-template-columns:1fr 1fr!important;}
  .inline-report-actions button{width:100%!important;min-height:44px!important;}
  #inlineReportFrame{height:calc(100vh - 112px)!important;border-radius:0!important;}
}
</style>


<style id="v168-dn-approver-css">
/* V168 DN Approver limited role - no login changes */

/* Hide financial cells/columns from the table */
body.role-dn-approver table th:nth-child(8),
body.role-dn-approver table td:nth-child(8),
body.role-dn-approver table th:nth-child(9),
body.role-dn-approver table td:nth-child(9),
body.role-dn-approver table th:nth-child(14),
body.role-dn-approver table td:nth-child(14),
body.role-dn-approver table th:nth-child(15),
body.role-dn-approver table td:nth-child(15),
body.role-dn-approver table th:nth-child(16),
body.role-dn-approver table td:nth-child(16),
body.role-dn-approver table th:nth-child(17),
body.role-dn-approver table td:nth-child(17),
body.role-dn-approver table th:nth-child(18),
body.role-dn-approver table td:nth-child(18),
body.role-dn-approver table th:nth-child(19),
body.role-dn-approver table td:nth-child(19) {
  display: none !important;
}

/* Hide money/cards/status financial overview */
body.role-dn-approver .stat,
body.role-dn-approver .stats,
body.role-dn-approver .alert-strip,
body.role-dn-approver #safeFinancialStatus,
body.role-dn-approver .safe-financial-status,
body.role-dn-approver .financial-status,
body.role-dn-approver .credit-statement {
  display: none !important;
}

/* Hide all action/report/admin buttons except Convert Order -> DN and filters/search */
body.role-dn-approver button[onclick*="Invoice"],
body.role-dn-approver button[onclick*="invoice"],
body.role-dn-approver button[onclick*="Deposit"],
body.role-dn-approver button[onclick*="deposit"],
body.role-dn-approver button[onclick*="Report"],
body.role-dn-approver button[onclick*="report"],
body.role-dn-approver button[onclick*="Audit"],
body.role-dn-approver button[onclick*="Roles"],
body.role-dn-approver button[onclick*="Settings"],
body.role-dn-approver button[onclick*="bulkDelete"],
body.role-dn-approver button[onclick*="duplicate"],
body.role-dn-approver button[onclick*="bulkMarkPaid"],
body.role-dn-approver button[onclick*="markSelected"],
body.role-dn-approver button[onclick*="openEntryModal"],
body.role-dn-approver button[onclick*="openDepositModal"] {
  display: none !important;
}

body.role-dn-approver button[onclick*="convertOrderToDN"] {
  display: inline-flex !important;
  visibility: visible !important;
}

/* Keep filters/search visible */
body.role-dn-approver .filters,
body.role-dn-approver .filters *,
body.role-dn-approver .month-tools,
body.role-dn-approver .month-tools * {
  display: revert !important;
}

/* Hide selected financial summary text */
body.role-dn-approver .money-gold,
body.role-dn-approver .money-red,
body.role-dn-approver .money-blue,
body.role-dn-approver .money-green,
body.role-dn-approver .money-amber {
  display: none !important;
}
</style>


<style id="v169-dn-approver-dropdown-label">
/* V169: role dropdown includes DN Approver. Login untouched. */
</style>

</head><body><button class="report-back-btn" onclick="if(window.opener){window.close()}else{history.back()}">← Back to Dashboard</button><h1>Supplier Summary - ${reportMonthLabel()}</h1><div class="report-table-wrap"><table><thead><tr><th>Supplier</th><th>Total</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r[0])}</td><td>${money(r[1])}</td></tr>`).join("")}</tbody></table></div><script>window.onload=()=>window.print()<\/script>




</body></html>`);
  w.document.close();
};
window.printProjectSummary = async function(){
  const w = window.open("", "_blank");
  if(!w){ alert("Please allow pop-ups for reports."); return; }
  const rows = groupSummary(await getEntries(), "project");
  w.document.write(`<html><head><title>Project Summary</title>
<style>
  html, body {
    background: #ffffff !important;
    color: #111111 !important;
    -webkit-text-size-adjust: 100%;
  }
  body {
    font-family: Arial, Helvetica, sans-serif !important;
    padding: 18px !important;
    margin: 0 !important;
  }
  h1, h2, h3, p, div, span, td, th {
    color: #111111 !important;
  }
  table {
    width: 100% !important;
    border-collapse: collapse !important;
    background: #ffffff !important;
    color: #111111 !important;
  }
  th {
    background: #edf2ff !important;
    color: #111111 !important;
    font-weight: 800 !important;
  }
  td {
    background: #ffffff !important;
    color: #111111 !important;
  }
  th, td {
    border: 1px solid #cfd6e4 !important;
    padding: 7px !important;
    font-size: 12px !important;
  }
  .cards, .summary {
    color: #111111 !important;
  }
  .card {
    background: #f7f8fb !important;
    color: #111111 !important;
    border: 1px solid #d9dee8 !important;
    border-radius: 12px !important;
    padding: 10px !important;
    margin: 6px !important;
    display: inline-block !important;
  }
  .report-back-btn {
    position: sticky;
    top: 0;
    z-index: 99999;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    padding: 10px 16px;
    margin: 0 0 14px 0;
    border-radius: 14px;
    border: 1px solid #d2ad83;
    background: linear-gradient(145deg, #e4c9a7 0%, #d2ad83 44%, #bb9061 100%);
    color: #111 !important;
    font-weight: 900;
    text-decoration: none;
    cursor: pointer;
  }
  @media (max-width: 820px) {
    body { padding: 12px !important; }
    h1 { font-size: 22px !important; }
    table { min-width: 980px !important; }
    .report-table-wrap {
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
      width: 100% !important;
    }
    th, td { font-size: 11px !important; padding: 6px !important; }
  }
  @media print {
    .report-back-btn { display:none !important; }
    body { padding: 0 !important; }
  }
</style>
<style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#dfeaff}</style>
<style>
/* SAFE UI ONLY - NO JS TOUCH */

body {
  background: #0f0f10;
}

/* cards polish */
.card {
  border-radius: 18px !important;
  border: 1px solid rgba(255,255,255,0.08) !important;
  background: rgba(255,255,255,0.03) !important;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

/* headings */
h2, .section-title {
  font-weight: 900 !important;
  color: #ffffff !important;
}

/* KPI colors */
.green { color: #4cd964 !important; }
.red { color: #ff6b6b !important; }
.blue { color: #6ea8ff !important; }
.yellow { color: #f5c542 !important; }

/* top header spacing */
header, .topbar, .app-header {
  padding: 12px 20px !important;
}

/* small daily inline (visual only placeholder) */
.logo::after {
  content: "  |  LIVE";
  color: #d9b991;
  font-size: 12px;
  margin-left: 10px;
}

</style>



<style id="v84-bubble-size-and-financial-card">
/* V84 UI-only: reduce app bubbles by 20% and polish Project BLU card. Login/auth untouched. */
#app .shell > header.card,
#app .shell > section.panel{
  border-radius: 26px !important;
  padding: 22px !important;
}
#app .shell .card,
#app .shell .panel,
#app .shell .stat,
#app .shell .alert-card,
#app .shell .fs-card,
#app #safeFinancialStatus .card{
  border-radius: 22px !important;
}
#app .shell .stat{
  min-height: 112px !important;
  padding: 19px !important;
}
#app .shell .stat::after{
  width: 56px !important;
  height: 56px !important;
  right: 18px !important;
  top: 18px !important;
}
#app .shell .alert-card{
  min-height: 76px !important;
  padding: 14px !important;
}
#app .shell .stats{
  gap: 17px !important;
  margin-bottom: 19px !important;
}
#app .shell .toolbar{
  gap: 10px !important;
}
#app .shell button,
#app .shell .main-action,
#app .shell .month-btn,
#app .shell select.dark,
#app .shell input.dark{
  border-radius: 15px !important;
}
#app .shell .main-action,
#app .shell button{
  min-height: 42px !important;
  padding: 10px 14px !important;
}
#app .shell .label,
#app .shell .stat .label{
  font-size: 14px !important;
  margin-bottom: 9px !important;
}
#app .shell .value,
#app .shell .stat .value{
  font-size: 22px !important;
}
#app #safeFinancialStatus,
#app .safe-financial-status,
#app #financialStatus,
#app .financial-status,
#app .fs-wrap{
  padding: 24px !important;
  border-radius: 27px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"]{
  gap: 12px !important;
  margin-bottom: 16px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"] > .card{
  padding: 14px !important;
  min-height: 78px !important;
  min-width: 160px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"] .card div{
  font-size: 12px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"] .card b{
  font-size: 19px !important;
}
#app .fs-project-bubble{
  margin-top: 10px !important;
  padding: 18px 20px !important;
  border-radius: 24px !important;
  background:
    radial-gradient(circle at 92% 22%, rgba(227,191,140,.15), transparent 26%),
    linear-gradient(180deg, rgba(255,255,255,.065), rgba(255,255,255,.018)) !important;
  border: 1px solid rgba(227,191,140,.22) !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 12px 30px rgba(0,0,0,.22) !important;
}
#app .fs-project-head{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:12px;
  padding-bottom: 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(255,255,255,.08);
}
#app .fs-project-label{
  color:#c9b18d;
  font-size:12px;
  font-weight:800;
  letter-spacing:.08em;
  text-transform:uppercase;
}
#app .fs-project-bubble h3{
  margin:0 !important;
  font-size:24px !important;
  color:#fff !important;
  line-height:1.05 !important;
}
#app .fs-project-bubble > div:not(.fs-project-head){
  display:flex;
  justify-content:space-between;
  gap:18px;
  align-items:center;
  padding: 5px 0;
  font-size:15px !important;
  color:#d8dce6;
}
#app .fs-project-bubble b{
  font-size:16px !important;
}
@media(max-width:720px){
  #app .shell > header.card,
  #app .shell > section.panel{padding:16px !important;border-radius:23px !important;}
  #app .shell .stats{grid-template-columns:repeat(2,minmax(0,1fr)) !important;gap:11px !important;}
  #app .shell .stat{min-height:94px !important;padding:14px !important;border-radius:19px !important;}
  #app .shell .value,#app .shell .stat .value{font-size:19px !important;}
  #app #safeFinancialStatus,.safe-financial-status,#financialStatus,.financial-status,.fs-wrap{padding:18px !important;border-radius:23px !important;}
  #app #safeFinancialStatus > div[style*="display:flex"] > .card{min-width:130px !important;}
  #app .fs-project-bubble{padding:15px !important;border-radius:20px !important;}
}
</style>





<style id="remove-project-dashboard-v105">
/* V105: fully hide Project dashboard/card block. Login/auth untouched. */
#project-status,
#project-financial-status,
#projectDashboard,
#project-dashboard,
#projectCard,
#project-card,
#projects,
#projects-dashboard,
.project-status,
.project-financial-status,
.project-dashboard,
.project-card,
.project-summary-card,
.project-financial-card,
.projects-card,
.projects-dashboard,
.card.project,
.panel.project,
section.project,
div[data-section="project"],
div[data-card="project"],
div[data-title="PROJECT"],
div[data-title="Project"] {
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
  min-height: 0 !important;
  max-height: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
}

/* Hide the specific legacy block by content structure when present */
.financial-project-card,
.financial-project-panel,
.project-breakdown,
.project-breakdown-card,
.project-kpi-card {
  display: none !important;
}
</style>



<style id="v111-deposit-paid-lock">
/* Deposit status locked as Paid; login/auth untouched. */
.deposit-paid-locked { pointer-events:none; opacity:.75; }
</style>


<style id="v112-deposit-hard-lock">
/* V112: Deposit status is hard-locked to Paid and hidden. Login/auth untouched. */
#entryStatusWrap[style*="display: none"] { display:none !important; }
#entryStatus:disabled { pointer-events:none !important; opacity:.7 !important; }
</style>


<style id="v113-deposit-display">
/* V113: Deposit displayed as separate type, not Order. Login/auth untouched. */
.table-wrap .status-deposit,
.table-wrap .kind-deposit,
.badge.deposit {
  color:#111 !important;
  border-color:rgba(217,185,145,.34) !important;
  background:linear-gradient(145deg, #e4c9a7 0%, #d2ad83 44%, #bb9061 100%) !important;
}
</style>


<style id="v119-cosmetic-buttons">
/* V119 cosmetic buttons only. Login/auth/logic untouched. */

/* Add Deposit: close to Invoice gold, but slightly more copper/rose-gold */
button.add-deposit-btn,
#app button.add-deposit-btn {
  background:
    radial-gradient(circle at 22% 15%, rgba(255,255,255,.34), transparent 24%),
    linear-gradient(135deg, #f2d0a2 0%, #d7a56f 46%, #b9814f 100%) !important;
  color: #121212 !important;
  border: 1px solid rgba(255,222,176,.75) !important;
  font-weight: 900 !important;
  letter-spacing: .01em !important;
  box-shadow:
    0 10px 24px rgba(217,165,111,.22),
    inset 0 1px 0 rgba(255,255,255,.38) !important;
}
button.add-deposit-btn:hover,
#app button.add-deposit-btn:hover {
  filter: brightness(1.08) saturate(1.05) !important;
  transform: translateY(-1px) !important;
}

/* Delete Selected: designed red button with black text */
button.delete-selected-btn,
#app button.delete-selected-btn {
  background:
    radial-gradient(circle at 20% 14%, rgba(255,255,255,.24), transparent 26%),
    linear-gradient(135deg, #ff7373 0%, #e13737 45%, #a90000 100%) !important;
  color: #050505 !important;
  border: 1px solid rgba(255,80,80,.85) !important;
  font-weight: 950 !important;
  letter-spacing: .01em !important;
  text-shadow: none !important;
  box-shadow:
    0 10px 24px rgba(255,0,0,.20),
    inset 0 1px 0 rgba(255,255,255,.30) !important;
}
button.delete-selected-btn:hover,
#app button.delete-selected-btn:hover {
  filter: brightness(1.08) saturate(1.08) !important;
  transform: translateY(-1px) !important;
}
</style>


<style id="v121-header-daily-premium-layout">
/* V121: Premium header / logo / daily spacing only. Login/auth/logic untouched. */

#app .brand {
  align-items: center !important;
  gap: 22px !important;
}

#app .brand-left {
  display: grid !important;
  grid-template-columns: auto 1fr !important;
  align-items: center !important;
  column-gap: 22px !important;
  row-gap: 12px !important;
  width: 100% !important;
}

#app .logo {
  width: 72px !important;
  height: 72px !important;
  min-width: 72px !important;
  border-radius: 22px !important;
  font-size: 34px !important;
  box-shadow:
    0 14px 32px rgba(217,185,145,.22),
    inset 0 1px 0 rgba(255,255,255,.38) !important;
}

#app .logo::after {
  content: "LIVE" !important;
  position: absolute !important;
  right: -12px !important;
  bottom: 10px !important;
  font-size: 11px !important;
  color: rgba(255,255,255,.38) !important;
  letter-spacing: .05em !important;
  margin: 0 !important;
}

#app .title {
  font-size: clamp(34px, 4.2vw, 56px) !important;
  line-height: .95 !important;
  letter-spacing: -.04em !important;
  margin-bottom: 6px !important;
}

#app .brand-subtitle {
  font-size: 18px !important;
  color: #e5c79e !important;
  margin-bottom: 18px !important;
}

#app .daily-header-bar {
  display: grid !important;
  grid-template-columns: minmax(190px, auto) repeat(3, minmax(170px, auto)) !important;
  gap: 14px !important;
  align-items: stretch !important;
  margin: 14px 0 16px !important;
  max-width: 920px !important;
}

#app .daily-chip {
  min-height: 74px !important;
  border-radius: 22px !important;
  padding: 14px 18px !important;
  background:
    radial-gradient(circle at 18% 16%, rgba(255,255,255,.13), transparent 30%),
    linear-gradient(145deg, rgba(255,255,255,.085), rgba(255,255,255,.025)) !important;
  border: 1px solid rgba(217,185,145,.22) !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.075),
    0 12px 28px rgba(0,0,0,.20) !important;
}

#app .daily-chip.daily-title {
  background:
    radial-gradient(circle at 18% 16%, rgba(255,255,255,.22), transparent 30%),
    linear-gradient(135deg, rgba(217,185,145,.32), rgba(86,66,44,.18)) !important;
}

#app .daily-label {
  display: block !important;
  font-size: 13px !important;
  line-height: 1 !important;
  font-weight: 950 !important;
  letter-spacing: .08em !important;
  color: #d9c2a1 !important;
  text-transform: uppercase !important;
  margin-bottom: 9px !important;
  white-space: nowrap !important;
}

#app .daily-value {
  display: block !important;
  font-size: 24px !important;
  line-height: 1.05 !important;
  font-weight: 950 !important;
  color: #ffffff !important;
  letter-spacing: -.02em !important;
  white-space: nowrap !important;
}

#app .userbar {
  margin-top: 10px !important;
  display: flex !important;
  gap: 12px !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  font-size: 22px !important;
}

#app .role-badge {
  padding: 7px 18px !important;
  border-radius: 999px !important;
  font-size: 17px !important;
  font-weight: 950 !important;
}

#app header.card {
  padding-top: 30px !important;
  padding-bottom: 28px !important;
}

#app header.card .toolbar {
  margin-top: 26px !important;
}

/* Tablet / laptop narrow */
@media (max-width: 1050px) {
  #app .daily-header-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    max-width: 760px !important;
  }
}

/* Mobile */
@media (max-width: 720px) {
  #app .brand-left {
    grid-template-columns: 1fr !important;
    justify-items: center !important;
    text-align: center !important;
    gap: 14px !important;
  }

  #app .logo {
    width: 64px !important;
    height: 64px !important;
    min-width: 64px !important;
    font-size: 30px !important;
  }

  #app .title {
    font-size: 38px !important;
  }

  #app .brand-subtitle {
    font-size: 15px !important;
    margin-bottom: 14px !important;
  }

  #app .daily-header-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 10px !important;
    margin: 12px auto 14px !important;
    width: 100% !important;
  }

  #app .daily-chip {
    min-height: 66px !important;
    padding: 12px 14px !important;
    border-radius: 18px !important;
  }

  #app .daily-label {
    font-size: 11px !important;
    margin-bottom: 7px !important;
  }

  #app .daily-value {
    font-size: 19px !important;
  }

  #app .userbar {
    justify-content: center !important;
    font-size: 17px !important;
  }
}
</style>


<style id="v122-header-scale-50">
/* Reduce header elements to ~50% without changing layout */

#app .logo {
  width: 48px !important;
  height: 48px !important;
  min-width: 48px !important;
  font-size: 22px !important;
}

#app .title {
  font-size: 28px !important;
}

#app .brand-subtitle {
  font-size: 13px !important;
  margin-bottom: 8px !important;
}

#app .daily-chip {
  min-height: 44px !important;
  padding: 8px 12px !important;
  border-radius: 14px !important;
}

#app .daily-label {
  font-size: 10px !important;
  margin-bottom: 4px !important;
}

#app .daily-value {
  font-size: 15px !important;
}

#app .daily-header-bar {
  gap: 8px !important;
  margin: 6px 0 8px !important;
}

#app .userbar {
  font-size: 14px !important;
}

#app .role-badge {
  font-size: 12px !important;
  padding: 4px 10px !important;
}

#app header.card {
  padding-top: 14px !important;
  padding-bottom: 12px !important;
}
</style>


<style id="v127-button-colors">
/* Gold buttons like Order */
button[onclick*="convertOrderToDN"],
button[onclick*="convertOrderToInvoice"] {
  background: linear-gradient(135deg, #f2d3a0, #d4a65a) !important;
  color: #000 !important;
  font-weight: 700;
  border: 1px solid rgba(255,215,150,0.6);
  box-shadow: 0 6px 16px rgba(212,166,90,0.25);
}

button[onclick*="convertOrderToDN"]:hover,
button[onclick*="convertOrderToInvoice"]:hover {
  filter: brightness(1.05);
}

/* Softer red for delete */
button.delete-selected-btn {
  background: linear-gradient(135deg, #e06666, #a83232) !important;
  color: #000 !important;
  border: 1px solid rgba(200,80,80,0.6);
  box-shadow: 0 4px 12px rgba(160,50,50,0.25);
}

button.delete-selected-btn:hover {
  filter: brightness(1.05);
}
</style>


<style id="v128-gold-match-animation">
/* Match exact system gold (same tone as Order badge) */
button[onclick*="convertOrderToDN"],
button[onclick*="convertOrderToInvoice"] {
  background: linear-gradient(145deg, #e4c9a7 0%, #d2ad83 44%, #bb9061 100%) !important;
  color: #000 !important;
  border: 1px solid rgba(217,185,145,.45) !important;
  font-weight: 800;
  box-shadow:
    0 6px 18px rgba(187,144,97,.25),
    inset 0 1px 0 rgba(255,255,255,.35);
  transition: all 0.18s ease;
}

/* Hover glow animation (keyboard + mouse focus) */
button[onclick*="convertOrderToDN"]:hover,
button[onclick*="convertOrderToInvoice"]:hover,
button[onclick*="convertOrderToDN"]:focus,
button[onclick*="convertOrderToInvoice"]:focus {
  filter: brightness(1.12);
  box-shadow:
    0 0 0 2px rgba(217,185,145,.35),
    0 8px 22px rgba(187,144,97,.35),
    inset 0 1px 0 rgba(255,255,255,.45);
  transform: translateY(-1px);
}

/* Softer delete (keep elegant) */
button.delete-selected-btn {
  background: linear-gradient(145deg, #d97a7a 0%, #b84a4a 50%, #7a1f1f 100%) !important;
  color: #000 !important;
  border: 1px solid rgba(200,120,120,.5);
  transition: all 0.18s ease;
}

button.delete-selected-btn:hover,
button.delete-selected-btn:focus {
  filter: brightness(1.08);
  box-shadow:
    0 0 0 2px rgba(200,100,100,.25),
    0 8px 20px rgba(120,30,30,.3);
  transform: translateY(-1px);
}
</style>


<style id="v129-global-button-ux">
button {
  transition: all 0.15s ease;
  position: relative;
}

button:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
}

button:focus {
  outline: none;
  box-shadow:
    0 0 0 2px rgba(217,185,145,.35),
    0 6px 16px rgba(0,0,0,.25);
}

button:active {
  transform: translateY(1px) scale(0.97);
  box-shadow:
    inset 0 3px 8px rgba(0,0,0,.35);
}

button::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.2s ease;
  background: radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 60%);
}

button:active::after {
  opacity: 1;
}
</style>


<meta name="theme-color" content="#080808">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Vardophase">


<style id="v131-iphone-css-only-login-safe">
/* V131 iPhone CSS-only. No JS, no service worker, login/auth untouched. */

html, body {
  -webkit-text-size-adjust: 100%;
}

button,
select,
input,
textarea,
.month-btn,
.nav-pill {
  min-height: 44px;
  touch-action: manipulation;
}

@media (max-width: 820px) {
  body {
    padding: 8px !important;
  }

  #app .shell {
    padding: 8px 8px calc(80px + env(safe-area-inset-bottom)) !important;
    max-width: 100% !important;
  }

  #app header.card,
  #app section.panel,
  #app .card,
  #app .panel {
    border-radius: 20px !important;
  }

  #app header.card {
    padding: 12px !important;
  }

  #app .brand-left {
    display: grid !important;
    grid-template-columns: auto 1fr !important;
    gap: 10px !important;
    text-align: left !important;
    align-items: center !important;
  }

  #app .logo {
    width: 44px !important;
    height: 44px !important;
    min-width: 44px !important;
    border-radius: 14px !important;
    font-size: 20px !important;
  }

  #app .title {
    font-size: 24px !important;
    line-height: 1 !important;
    margin: 0 !important;
  }

  #app .brand-subtitle {
    font-size: 12px !important;
    margin: 3px 0 8px !important;
  }

  #app .daily-header-bar {
    grid-column: 1 / -1 !important;
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
    margin: 8px 0 6px !important;
    width: 100% !important;
    max-width: none !important;
  }

  #app .daily-chip {
    min-height: 54px !important;
    padding: 9px 10px !important;
    border-radius: 16px !important;
  }

  #app .daily-label {
    font-size: 10px !important;
    margin-bottom: 5px !important;
  }

  #app .daily-value {
    font-size: 16px !important;
    white-space: nowrap !important;
  }

  #app .userbar {
    grid-column: 1 / -1 !important;
    font-size: 12px !important;
    gap: 6px !important;
    margin-top: 6px !important;
  }

  #app header.card .toolbar {
    display: flex !important;
    overflow-x: auto !important;
    gap: 8px !important;
    padding: 4px 2px 8px !important;
    margin-top: 10px !important;
    -webkit-overflow-scrolling: touch;
  }

  #app header.card .toolbar button {
    flex: 0 0 auto !important;
    min-width: 122px !important;
    padding: 10px 12px !important;
    border-radius: 14px !important;
    font-size: 13px !important;
  }

  #app .filters {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 8px !important;
  }

  #app .filters input,
  #app .filters select,
  #app .filters button {
    width: 100% !important;
    font-size: 16px !important;
  }

  #app .month-tools {
    display: flex !important;
    overflow-x: auto !important;
    gap: 7px !important;
    padding-bottom: 6px !important;
    -webkit-overflow-scrolling: touch;
  }

  #app .month-btn {
    flex: 0 0 auto !important;
    min-width: 58px !important;
  }

  #safeFinancialStatus > div[style*="display:flex"],
  .safe-financial-status > div[style*="display:flex"],
  #app .stats,
  #app .alert-strip {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
  }

  #safeFinancialStatus .card,
  .safe-financial-status .card,
  #app .stat,
  #app .alert-card {
    min-height: 76px !important;
    padding: 11px !important;
    border-radius: 16px !important;
  }

  #app section.panel .toolbar {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
  }

  #app section.panel .toolbar button {
    width: 100% !important;
    min-height: 48px !important;
    border-radius: 15px !important;
    font-size: 13px !important;
    padding: 10px 8px !important;
  }

  #app .table-wrap {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    border-radius: 18px !important;
    max-width: 100% !important;
  }

  #app table {
    min-width: 1180px !important;
    font-size: 12px !important;
  }

  #app th,
  #app td {
    padding: 9px 8px !important;
    white-space: nowrap !important;
  }

  #app .modal-box,
  .modal-box {
    width: 100% !important;
    max-width: 100% !important;
    max-height: 92vh !important;
    overflow-y: auto !important;
    border-radius: 22px !important;
    padding: 14px !important;
  }

  #app .form-grid {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 10px !important;
  }

  #app input.dark,
  #app select.dark,
  #app textarea.dark {
    font-size: 16px !important;
    min-height: 46px !important;
  }
}
</style>


<style id="v133-iphone-refine-only">
/* V133: based on V131. Only fixes Change Password / Logout and table scrolling. Login untouched. */

@media (max-width: 820px) {
  /* Put Change Password + Logout in a clean row instead of floating/cutting */
  #app .brand > div[style*="justify-content:flex-end"] {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
    width: 100% !important;
    margin-top: 10px !important;
  }

  #app .brand > div[style*="justify-content:flex-end"] button {
    width: 100% !important;
    min-height: 44px !important;
    border-radius: 15px !important;
    font-size: 13px !important;
    padding: 9px 10px !important;
  }

  #app .brand > div[style*="justify-content:flex-end"] button.red {
    color: #ff8b8b !important;
  }

  /* Keep header compact like V131, not huge like V132 */
  #app header.card .toolbar {
    display: flex !important;
    overflow-x: auto !important;
    gap: 8px !important;
    padding: 4px 2px 8px !important;
    margin-top: 10px !important;
    -webkit-overflow-scrolling: touch !important;
    scroll-behavior: auto !important;
  }

  #app header.card .toolbar button {
    flex: 0 0 auto !important;
    min-width: 122px !important;
  }

  /* Faster, smoother horizontal table scrolling */
  #app .table-wrap {
    overflow-x: scroll !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
    scroll-behavior: auto !important;
    overscroll-behavior-x: contain !important;
    touch-action: pan-x pan-y !important;
  }

  #app .table-wrap table {
    min-width: 1320px !important;
  }

  /* Make row touch/drag feel less heavy */
  #app .table-wrap th,
  #app .table-wrap td {
    padding: 8px 7px !important;
  }

  #app .table-wrap tbody tr {
    contain: layout paint !important;
  }
}
</style>


<style id="v134-report-mobile-dark-fix">
/* V134 report readability + mobile return fix. Login untouched. */

/* If a generated report opens in same app window, force readable report styling */
body:has(h1):has(table) {
  background: #ffffff !important;
  color: #111111 !important;
}

body:has(h1):has(table) h1,
body:has(h1):has(table) h2,
body:has(h1):has(table) div,
body:has(h1):has(table) span,
body:has(h1):has(table) td,
body:has(h1):has(table) th {
  color: #111111 !important;
}

body:has(h1):has(table) table {
  background: #ffffff !important;
  color: #111111 !important;
}

body:has(h1):has(table) th {
  background: #edf2ff !important;
  color: #111111 !important;
}

body:has(h1):has(table) td {
  background: #ffffff !important;
  color: #111111 !important;
}

@media (max-width: 820px) {
  body:has(h1):has(table) {
    padding: 12px !important;
    overflow-x: auto !important;
  }
  body:has(h1):has(table) table {
    min-width: 980px !important;
  }
}
</style>


<style id="v136-selection-fix-css">
/* V136 selection UX. Login/auth untouched. */
tr.selected {
  background: rgba(217,185,145,.16) !important;
  box-shadow: inset 4px 0 0 rgba(217,185,145,.75) !important;
}
.row-check,
.premium-check {
  width: 22px !important;
  height: 22px !important;
  accent-color: #d2ad83 !important;
  cursor: pointer !important;
}
td:has(.row-check),
td:has(.premium-check) {
  cursor: pointer !important;
}
</style>


<style id="v148-inline-reports-safe-css">
#inlineReportModal.modal.show{
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  padding:18px!important;
  z-index:99999!important;
}
.inline-report-box{
  width:min(1180px,96vw)!important;
  max-height:92vh!important;
  display:flex!important;
  flex-direction:column!important;
  overflow:hidden!important;
}
.inline-report-toolbar{
  display:flex!important;
  justify-content:space-between!important;
  align-items:center!important;
  gap:10px!important;
  padding:12px 14px!important;
  border-bottom:1px solid rgba(217,185,145,.18)!important;
}
.inline-report-actions{display:flex!important;gap:8px!important;}
#inlineReportFrame{
  width:100%!important;
  height:76vh!important;
  border:0!important;
  background:#fff!important;
  border-radius:0 0 18px 18px!important;
}
@media(max-width:820px){
  #inlineReportModal.modal.show{padding:0!important;align-items:stretch!important;}
  .inline-report-box{width:100vw!important;max-width:100vw!important;height:100vh!important;max-height:100vh!important;border-radius:0!important;}
  .inline-report-toolbar{padding:10px!important;flex-wrap:wrap!important;}
  .inline-report-actions{width:100%!important;display:grid!important;grid-template-columns:1fr 1fr!important;}
  .inline-report-actions button{width:100%!important;min-height:44px!important;}
  #inlineReportFrame{height:calc(100vh - 112px)!important;border-radius:0!important;}
}
</style>


<style id="v168-dn-approver-css">
/* V168 DN Approver limited role - no login changes */

/* Hide financial cells/columns from the table */
body.role-dn-approver table th:nth-child(8),
body.role-dn-approver table td:nth-child(8),
body.role-dn-approver table th:nth-child(9),
body.role-dn-approver table td:nth-child(9),
body.role-dn-approver table th:nth-child(14),
body.role-dn-approver table td:nth-child(14),
body.role-dn-approver table th:nth-child(15),
body.role-dn-approver table td:nth-child(15),
body.role-dn-approver table th:nth-child(16),
body.role-dn-approver table td:nth-child(16),
body.role-dn-approver table th:nth-child(17),
body.role-dn-approver table td:nth-child(17),
body.role-dn-approver table th:nth-child(18),
body.role-dn-approver table td:nth-child(18),
body.role-dn-approver table th:nth-child(19),
body.role-dn-approver table td:nth-child(19) {
  display: none !important;
}

/* Hide money/cards/status financial overview */
body.role-dn-approver .stat,
body.role-dn-approver .stats,
body.role-dn-approver .alert-strip,
body.role-dn-approver #safeFinancialStatus,
body.role-dn-approver .safe-financial-status,
body.role-dn-approver .financial-status,
body.role-dn-approver .credit-statement {
  display: none !important;
}

/* Hide all action/report/admin buttons except Convert Order -> DN and filters/search */
body.role-dn-approver button[onclick*="Invoice"],
body.role-dn-approver button[onclick*="invoice"],
body.role-dn-approver button[onclick*="Deposit"],
body.role-dn-approver button[onclick*="deposit"],
body.role-dn-approver button[onclick*="Report"],
body.role-dn-approver button[onclick*="report"],
body.role-dn-approver button[onclick*="Audit"],
body.role-dn-approver button[onclick*="Roles"],
body.role-dn-approver button[onclick*="Settings"],
body.role-dn-approver button[onclick*="bulkDelete"],
body.role-dn-approver button[onclick*="duplicate"],
body.role-dn-approver button[onclick*="bulkMarkPaid"],
body.role-dn-approver button[onclick*="markSelected"],
body.role-dn-approver button[onclick*="openEntryModal"],
body.role-dn-approver button[onclick*="openDepositModal"] {
  display: none !important;
}

body.role-dn-approver button[onclick*="convertOrderToDN"] {
  display: inline-flex !important;
  visibility: visible !important;
}

/* Keep filters/search visible */
body.role-dn-approver .filters,
body.role-dn-approver .filters *,
body.role-dn-approver .month-tools,
body.role-dn-approver .month-tools * {
  display: revert !important;
}

/* Hide selected financial summary text */
body.role-dn-approver .money-gold,
body.role-dn-approver .money-red,
body.role-dn-approver .money-blue,
body.role-dn-approver .money-green,
body.role-dn-approver .money-amber {
  display: none !important;
}
</style>


<style id="v169-dn-approver-dropdown-label">
/* V169: role dropdown includes DN Approver. Login untouched. */
</style>

</head><body><button class="report-back-btn" onclick="if(window.opener){window.close()}else{history.back()}">← Back to Dashboard</button><h1>Project Summary - ${reportMonthLabel()}</h1><div class="report-table-wrap"><table><thead><tr><th>Project</th><th>Total</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r[0])}</td><td>${money(r[1])}</td></tr>`).join("")}</tbody></table></div><script>window.onload=()=>window.print()<\/script>




</body></html>`);
  w.document.close();
};
window.printMonthlyReport = async function(){
  const w = window.open("", "_blank");
  if(!w){ alert("Please allow pop-ups for reports."); return; }
  const rows = await getEntries();
  const sum = totals(rows);
  w.document.write(`<html><head><title>Monthly Report</title>
<style>
  html, body {
    background: #ffffff !important;
    color: #111111 !important;
    -webkit-text-size-adjust: 100%;
  }
  body {
    font-family: Arial, Helvetica, sans-serif !important;
    padding: 18px !important;
    margin: 0 !important;
  }
  h1, h2, h3, p, div, span, td, th {
    color: #111111 !important;
  }
  table {
    width: 100% !important;
    border-collapse: collapse !important;
    background: #ffffff !important;
    color: #111111 !important;
  }
  th {
    background: #edf2ff !important;
    color: #111111 !important;
    font-weight: 800 !important;
  }
  td {
    background: #ffffff !important;
    color: #111111 !important;
  }
  th, td {
    border: 1px solid #cfd6e4 !important;
    padding: 7px !important;
    font-size: 12px !important;
  }
  .cards, .summary {
    color: #111111 !important;
  }
  .card {
    background: #f7f8fb !important;
    color: #111111 !important;
    border: 1px solid #d9dee8 !important;
    border-radius: 12px !important;
    padding: 10px !important;
    margin: 6px !important;
    display: inline-block !important;
  }
  .report-back-btn {
    position: sticky;
    top: 0;
    z-index: 99999;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    padding: 10px 16px;
    margin: 0 0 14px 0;
    border-radius: 14px;
    border: 1px solid #d2ad83;
    background: linear-gradient(145deg, #e4c9a7 0%, #d2ad83 44%, #bb9061 100%);
    color: #111 !important;
    font-weight: 900;
    text-decoration: none;
    cursor: pointer;
  }
  @media (max-width: 820px) {
    body { padding: 12px !important; }
    h1 { font-size: 22px !important; }
    table { min-width: 980px !important; }
    .report-table-wrap {
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
      width: 100% !important;
    }
    th, td { font-size: 11px !important; padding: 6px !important; }
  }
  @media print {
    .report-back-btn { display:none !important; }
    body { padding: 0 !important; }
  }
</style>

<style>
  html, body {
    background: #ffffff !important;
    color: #111111 !important;
    -webkit-text-size-adjust: 100%;
  }
  body {
    font-family: Arial, Helvetica, sans-serif !important;
    padding: 18px !important;
    margin: 0 !important;
  }
  h1, h2, h3, p, div, span, td, th {
    color: #111111 !important;
  }
  table {
    width: 100% !important;
    border-collapse: collapse !important;
    background: #ffffff !important;
    color: #111111 !important;
  }
  th {
    background: #edf2ff !important;
    color: #111111 !important;
    font-weight: 800 !important;
  }
  td {
    background: #ffffff !important;
    color: #111111 !important;
  }
  th, td {
    border: 1px solid #cfd6e4 !important;
    padding: 7px !important;
    font-size: 12px !important;
  }
  .cards, .summary {
    color: #111111 !important;
  }
  .card {
    background: #f7f8fb !important;
    color: #111111 !important;
    border: 1px solid #d9dee8 !important;
    border-radius: 12px !important;
    padding: 10px !important;
    margin: 6px !important;
    display: inline-block !important;
  }
  .report-back-btn {
    position: sticky;
    top: 0;
    z-index: 99999;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    padding: 10px 16px;
    margin: 0 0 14px 0;
    border-radius: 14px;
    border: 1px solid #d2ad83;
    background: linear-gradient(145deg, #e4c9a7 0%, #d2ad83 44%, #bb9061 100%);
    color: #111 !important;
    font-weight: 900;
    text-decoration: none;
    cursor: pointer;
  }
  @media (max-width: 820px) {
    body { padding: 12px !important; }
    h1 { font-size: 22px !important; }
    table { min-width: 980px !important; }
    .report-table-wrap {
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
      width: 100% !important;
    }
    th, td { font-size: 11px !important; padding: 6px !important; }
  }
  @media print {
    .report-back-btn { display:none !important; }
    body { padding: 0 !important; }
  }
</style>
<style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#dfeaff}.cards{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px}.card{border:1px solid #ddd;border-radius:12px;padding:10px 12px}</style>
<style>
/* SAFE UI ONLY - NO JS TOUCH */

body {
  background: #0f0f10;
}

/* cards polish */
.card {
  border-radius: 18px !important;
  border: 1px solid rgba(255,255,255,0.08) !important;
  background: rgba(255,255,255,0.03) !important;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

/* headings */
h2, .section-title {
  font-weight: 900 !important;
  color: #ffffff !important;
}

/* KPI colors */
.green { color: #4cd964 !important; }
.red { color: #ff6b6b !important; }
.blue { color: #6ea8ff !important; }
.yellow { color: #f5c542 !important; }

/* top header spacing */
header, .topbar, .app-header {
  padding: 12px 20px !important;
}

/* small daily inline (visual only placeholder) */
.logo::after {
  content: "  |  LIVE";
  color: #d9b991;
  font-size: 12px;
  margin-left: 10px;
}

</style>



<style id="v84-bubble-size-and-financial-card">
/* V84 UI-only: reduce app bubbles by 20% and polish Project BLU card. Login/auth untouched. */
#app .shell > header.card,
#app .shell > section.panel{
  border-radius: 26px !important;
  padding: 22px !important;
}
#app .shell .card,
#app .shell .panel,
#app .shell .stat,
#app .shell .alert-card,
#app .shell .fs-card,
#app #safeFinancialStatus .card{
  border-radius: 22px !important;
}
#app .shell .stat{
  min-height: 112px !important;
  padding: 19px !important;
}
#app .shell .stat::after{
  width: 56px !important;
  height: 56px !important;
  right: 18px !important;
  top: 18px !important;
}
#app .shell .alert-card{
  min-height: 76px !important;
  padding: 14px !important;
}
#app .shell .stats{
  gap: 17px !important;
  margin-bottom: 19px !important;
}
#app .shell .toolbar{
  gap: 10px !important;
}
#app .shell button,
#app .shell .main-action,
#app .shell .month-btn,
#app .shell select.dark,
#app .shell input.dark{
  border-radius: 15px !important;
}
#app .shell .main-action,
#app .shell button{
  min-height: 42px !important;
  padding: 10px 14px !important;
}
#app .shell .label,
#app .shell .stat .label{
  font-size: 14px !important;
  margin-bottom: 9px !important;
}
#app .shell .value,
#app .shell .stat .value{
  font-size: 22px !important;
}
#app #safeFinancialStatus,
#app .safe-financial-status,
#app #financialStatus,
#app .financial-status,
#app .fs-wrap{
  padding: 24px !important;
  border-radius: 27px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"]{
  gap: 12px !important;
  margin-bottom: 16px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"] > .card{
  padding: 14px !important;
  min-height: 78px !important;
  min-width: 160px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"] .card div{
  font-size: 12px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"] .card b{
  font-size: 19px !important;
}
#app .fs-project-bubble{
  margin-top: 10px !important;
  padding: 18px 20px !important;
  border-radius: 24px !important;
  background:
    radial-gradient(circle at 92% 22%, rgba(227,191,140,.15), transparent 26%),
    linear-gradient(180deg, rgba(255,255,255,.065), rgba(255,255,255,.018)) !important;
  border: 1px solid rgba(227,191,140,.22) !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 12px 30px rgba(0,0,0,.22) !important;
}
#app .fs-project-head{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:12px;
  padding-bottom: 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(255,255,255,.08);
}
#app .fs-project-label{
  color:#c9b18d;
  font-size:12px;
  font-weight:800;
  letter-spacing:.08em;
  text-transform:uppercase;
}
#app .fs-project-bubble h3{
  margin:0 !important;
  font-size:24px !important;
  color:#fff !important;
  line-height:1.05 !important;
}
#app .fs-project-bubble > div:not(.fs-project-head){
  display:flex;
  justify-content:space-between;
  gap:18px;
  align-items:center;
  padding: 5px 0;
  font-size:15px !important;
  color:#d8dce6;
}
#app .fs-project-bubble b{
  font-size:16px !important;
}
@media(max-width:720px){
  #app .shell > header.card,
  #app .shell > section.panel{padding:16px !important;border-radius:23px !important;}
  #app .shell .stats{grid-template-columns:repeat(2,minmax(0,1fr)) !important;gap:11px !important;}
  #app .shell .stat{min-height:94px !important;padding:14px !important;border-radius:19px !important;}
  #app .shell .value,#app .shell .stat .value{font-size:19px !important;}
  #app #safeFinancialStatus,.safe-financial-status,#financialStatus,.financial-status,.fs-wrap{padding:18px !important;border-radius:23px !important;}
  #app #safeFinancialStatus > div[style*="display:flex"] > .card{min-width:130px !important;}
  #app .fs-project-bubble{padding:15px !important;border-radius:20px !important;}
}
</style>





<style id="remove-project-dashboard-v105">
/* V105: fully hide Project dashboard/card block. Login/auth untouched. */
#project-status,
#project-financial-status,
#projectDashboard,
#project-dashboard,
#projectCard,
#project-card,
#projects,
#projects-dashboard,
.project-status,
.project-financial-status,
.project-dashboard,
.project-card,
.project-summary-card,
.project-financial-card,
.projects-card,
.projects-dashboard,
.card.project,
.panel.project,
section.project,
div[data-section="project"],
div[data-card="project"],
div[data-title="PROJECT"],
div[data-title="Project"] {
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
  min-height: 0 !important;
  max-height: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
}

/* Hide the specific legacy block by content structure when present */
.financial-project-card,
.financial-project-panel,
.project-breakdown,
.project-breakdown-card,
.project-kpi-card {
  display: none !important;
}
</style>



<style id="v111-deposit-paid-lock">
/* Deposit status locked as Paid; login/auth untouched. */
.deposit-paid-locked { pointer-events:none; opacity:.75; }
</style>


<style id="v112-deposit-hard-lock">
/* V112: Deposit status is hard-locked to Paid and hidden. Login/auth untouched. */
#entryStatusWrap[style*="display: none"] { display:none !important; }
#entryStatus:disabled { pointer-events:none !important; opacity:.7 !important; }
</style>


<style id="v113-deposit-display">
/* V113: Deposit displayed as separate type, not Order. Login/auth untouched. */
.table-wrap .status-deposit,
.table-wrap .kind-deposit,
.badge.deposit {
  color:#111 !important;
  border-color:rgba(217,185,145,.34) !important;
  background:linear-gradient(145deg, #e4c9a7 0%, #d2ad83 44%, #bb9061 100%) !important;
}
</style>


<style id="v119-cosmetic-buttons">
/* V119 cosmetic buttons only. Login/auth/logic untouched. */

/* Add Deposit: close to Invoice gold, but slightly more copper/rose-gold */
button.add-deposit-btn,
#app button.add-deposit-btn {
  background:
    radial-gradient(circle at 22% 15%, rgba(255,255,255,.34), transparent 24%),
    linear-gradient(135deg, #f2d0a2 0%, #d7a56f 46%, #b9814f 100%) !important;
  color: #121212 !important;
  border: 1px solid rgba(255,222,176,.75) !important;
  font-weight: 900 !important;
  letter-spacing: .01em !important;
  box-shadow:
    0 10px 24px rgba(217,165,111,.22),
    inset 0 1px 0 rgba(255,255,255,.38) !important;
}
button.add-deposit-btn:hover,
#app button.add-deposit-btn:hover {
  filter: brightness(1.08) saturate(1.05) !important;
  transform: translateY(-1px) !important;
}

/* Delete Selected: designed red button with black text */
button.delete-selected-btn,
#app button.delete-selected-btn {
  background:
    radial-gradient(circle at 20% 14%, rgba(255,255,255,.24), transparent 26%),
    linear-gradient(135deg, #ff7373 0%, #e13737 45%, #a90000 100%) !important;
  color: #050505 !important;
  border: 1px solid rgba(255,80,80,.85) !important;
  font-weight: 950 !important;
  letter-spacing: .01em !important;
  text-shadow: none !important;
  box-shadow:
    0 10px 24px rgba(255,0,0,.20),
    inset 0 1px 0 rgba(255,255,255,.30) !important;
}
button.delete-selected-btn:hover,
#app button.delete-selected-btn:hover {
  filter: brightness(1.08) saturate(1.08) !important;
  transform: translateY(-1px) !important;
}
</style>


<style id="v121-header-daily-premium-layout">
/* V121: Premium header / logo / daily spacing only. Login/auth/logic untouched. */

#app .brand {
  align-items: center !important;
  gap: 22px !important;
}

#app .brand-left {
  display: grid !important;
  grid-template-columns: auto 1fr !important;
  align-items: center !important;
  column-gap: 22px !important;
  row-gap: 12px !important;
  width: 100% !important;
}

#app .logo {
  width: 72px !important;
  height: 72px !important;
  min-width: 72px !important;
  border-radius: 22px !important;
  font-size: 34px !important;
  box-shadow:
    0 14px 32px rgba(217,185,145,.22),
    inset 0 1px 0 rgba(255,255,255,.38) !important;
}

#app .logo::after {
  content: "LIVE" !important;
  position: absolute !important;
  right: -12px !important;
  bottom: 10px !important;
  font-size: 11px !important;
  color: rgba(255,255,255,.38) !important;
  letter-spacing: .05em !important;
  margin: 0 !important;
}

#app .title {
  font-size: clamp(34px, 4.2vw, 56px) !important;
  line-height: .95 !important;
  letter-spacing: -.04em !important;
  margin-bottom: 6px !important;
}

#app .brand-subtitle {
  font-size: 18px !important;
  color: #e5c79e !important;
  margin-bottom: 18px !important;
}

#app .daily-header-bar {
  display: grid !important;
  grid-template-columns: minmax(190px, auto) repeat(3, minmax(170px, auto)) !important;
  gap: 14px !important;
  align-items: stretch !important;
  margin: 14px 0 16px !important;
  max-width: 920px !important;
}

#app .daily-chip {
  min-height: 74px !important;
  border-radius: 22px !important;
  padding: 14px 18px !important;
  background:
    radial-gradient(circle at 18% 16%, rgba(255,255,255,.13), transparent 30%),
    linear-gradient(145deg, rgba(255,255,255,.085), rgba(255,255,255,.025)) !important;
  border: 1px solid rgba(217,185,145,.22) !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.075),
    0 12px 28px rgba(0,0,0,.20) !important;
}

#app .daily-chip.daily-title {
  background:
    radial-gradient(circle at 18% 16%, rgba(255,255,255,.22), transparent 30%),
    linear-gradient(135deg, rgba(217,185,145,.32), rgba(86,66,44,.18)) !important;
}

#app .daily-label {
  display: block !important;
  font-size: 13px !important;
  line-height: 1 !important;
  font-weight: 950 !important;
  letter-spacing: .08em !important;
  color: #d9c2a1 !important;
  text-transform: uppercase !important;
  margin-bottom: 9px !important;
  white-space: nowrap !important;
}

#app .daily-value {
  display: block !important;
  font-size: 24px !important;
  line-height: 1.05 !important;
  font-weight: 950 !important;
  color: #ffffff !important;
  letter-spacing: -.02em !important;
  white-space: nowrap !important;
}

#app .userbar {
  margin-top: 10px !important;
  display: flex !important;
  gap: 12px !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  font-size: 22px !important;
}

#app .role-badge {
  padding: 7px 18px !important;
  border-radius: 999px !important;
  font-size: 17px !important;
  font-weight: 950 !important;
}

#app header.card {
  padding-top: 30px !important;
  padding-bottom: 28px !important;
}

#app header.card .toolbar {
  margin-top: 26px !important;
}

/* Tablet / laptop narrow */
@media (max-width: 1050px) {
  #app .daily-header-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    max-width: 760px !important;
  }
}

/* Mobile */
@media (max-width: 720px) {
  #app .brand-left {
    grid-template-columns: 1fr !important;
    justify-items: center !important;
    text-align: center !important;
    gap: 14px !important;
  }

  #app .logo {
    width: 64px !important;
    height: 64px !important;
    min-width: 64px !important;
    font-size: 30px !important;
  }

  #app .title {
    font-size: 38px !important;
  }

  #app .brand-subtitle {
    font-size: 15px !important;
    margin-bottom: 14px !important;
  }

  #app .daily-header-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 10px !important;
    margin: 12px auto 14px !important;
    width: 100% !important;
  }

  #app .daily-chip {
    min-height: 66px !important;
    padding: 12px 14px !important;
    border-radius: 18px !important;
  }

  #app .daily-label {
    font-size: 11px !important;
    margin-bottom: 7px !important;
  }

  #app .daily-value {
    font-size: 19px !important;
  }

  #app .userbar {
    justify-content: center !important;
    font-size: 17px !important;
  }
}
</style>


<style id="v122-header-scale-50">
/* Reduce header elements to ~50% without changing layout */

#app .logo {
  width: 48px !important;
  height: 48px !important;
  min-width: 48px !important;
  font-size: 22px !important;
}

#app .title {
  font-size: 28px !important;
}

#app .brand-subtitle {
  font-size: 13px !important;
  margin-bottom: 8px !important;
}

#app .daily-chip {
  min-height: 44px !important;
  padding: 8px 12px !important;
  border-radius: 14px !important;
}

#app .daily-label {
  font-size: 10px !important;
  margin-bottom: 4px !important;
}

#app .daily-value {
  font-size: 15px !important;
}

#app .daily-header-bar {
  gap: 8px !important;
  margin: 6px 0 8px !important;
}

#app .userbar {
  font-size: 14px !important;
}

#app .role-badge {
  font-size: 12px !important;
  padding: 4px 10px !important;
}

#app header.card {
  padding-top: 14px !important;
  padding-bottom: 12px !important;
}
</style>


<style id="v127-button-colors">
/* Gold buttons like Order */
button[onclick*="convertOrderToDN"],
button[onclick*="convertOrderToInvoice"] {
  background: linear-gradient(135deg, #f2d3a0, #d4a65a) !important;
  color: #000 !important;
  font-weight: 700;
  border: 1px solid rgba(255,215,150,0.6);
  box-shadow: 0 6px 16px rgba(212,166,90,0.25);
}

button[onclick*="convertOrderToDN"]:hover,
button[onclick*="convertOrderToInvoice"]:hover {
  filter: brightness(1.05);
}

/* Softer red for delete */
button.delete-selected-btn {
  background: linear-gradient(135deg, #e06666, #a83232) !important;
  color: #000 !important;
  border: 1px solid rgba(200,80,80,0.6);
  box-shadow: 0 4px 12px rgba(160,50,50,0.25);
}

button.delete-selected-btn:hover {
  filter: brightness(1.05);
}
</style>


<style id="v128-gold-match-animation">
/* Match exact system gold (same tone as Order badge) */
button[onclick*="convertOrderToDN"],
button[onclick*="convertOrderToInvoice"] {
  background: linear-gradient(145deg, #e4c9a7 0%, #d2ad83 44%, #bb9061 100%) !important;
  color: #000 !important;
  border: 1px solid rgba(217,185,145,.45) !important;
  font-weight: 800;
  box-shadow:
    0 6px 18px rgba(187,144,97,.25),
    inset 0 1px 0 rgba(255,255,255,.35);
  transition: all 0.18s ease;
}

/* Hover glow animation (keyboard + mouse focus) */
button[onclick*="convertOrderToDN"]:hover,
button[onclick*="convertOrderToInvoice"]:hover,
button[onclick*="convertOrderToDN"]:focus,
button[onclick*="convertOrderToInvoice"]:focus {
  filter: brightness(1.12);
  box-shadow:
    0 0 0 2px rgba(217,185,145,.35),
    0 8px 22px rgba(187,144,97,.35),
    inset 0 1px 0 rgba(255,255,255,.45);
  transform: translateY(-1px);
}

/* Softer delete (keep elegant) */
button.delete-selected-btn {
  background: linear-gradient(145deg, #d97a7a 0%, #b84a4a 50%, #7a1f1f 100%) !important;
  color: #000 !important;
  border: 1px solid rgba(200,120,120,.5);
  transition: all 0.18s ease;
}

button.delete-selected-btn:hover,
button.delete-selected-btn:focus {
  filter: brightness(1.08);
  box-shadow:
    0 0 0 2px rgba(200,100,100,.25),
    0 8px 20px rgba(120,30,30,.3);
  transform: translateY(-1px);
}
</style>


<style id="v129-global-button-ux">
button {
  transition: all 0.15s ease;
  position: relative;
}

button:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
}

button:focus {
  outline: none;
  box-shadow:
    0 0 0 2px rgba(217,185,145,.35),
    0 6px 16px rgba(0,0,0,.25);
}

button:active {
  transform: translateY(1px) scale(0.97);
  box-shadow:
    inset 0 3px 8px rgba(0,0,0,.35);
}

button::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.2s ease;
  background: radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 60%);
}

button:active::after {
  opacity: 1;
}
</style>


<meta name="theme-color" content="#080808">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Vardophase">


<style id="v131-iphone-css-only-login-safe">
/* V131 iPhone CSS-only. No JS, no service worker, login/auth untouched. */

html, body {
  -webkit-text-size-adjust: 100%;
}

button,
select,
input,
textarea,
.month-btn,
.nav-pill {
  min-height: 44px;
  touch-action: manipulation;
}

@media (max-width: 820px) {
  body {
    padding: 8px !important;
  }

  #app .shell {
    padding: 8px 8px calc(80px + env(safe-area-inset-bottom)) !important;
    max-width: 100% !important;
  }

  #app header.card,
  #app section.panel,
  #app .card,
  #app .panel {
    border-radius: 20px !important;
  }

  #app header.card {
    padding: 12px !important;
  }

  #app .brand-left {
    display: grid !important;
    grid-template-columns: auto 1fr !important;
    gap: 10px !important;
    text-align: left !important;
    align-items: center !important;
  }

  #app .logo {
    width: 44px !important;
    height: 44px !important;
    min-width: 44px !important;
    border-radius: 14px !important;
    font-size: 20px !important;
  }

  #app .title {
    font-size: 24px !important;
    line-height: 1 !important;
    margin: 0 !important;
  }

  #app .brand-subtitle {
    font-size: 12px !important;
    margin: 3px 0 8px !important;
  }

  #app .daily-header-bar {
    grid-column: 1 / -1 !important;
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
    margin: 8px 0 6px !important;
    width: 100% !important;
    max-width: none !important;
  }

  #app .daily-chip {
    min-height: 54px !important;
    padding: 9px 10px !important;
    border-radius: 16px !important;
  }

  #app .daily-label {
    font-size: 10px !important;
    margin-bottom: 5px !important;
  }

  #app .daily-value {
    font-size: 16px !important;
    white-space: nowrap !important;
  }

  #app .userbar {
    grid-column: 1 / -1 !important;
    font-size: 12px !important;
    gap: 6px !important;
    margin-top: 6px !important;
  }

  #app header.card .toolbar {
    display: flex !important;
    overflow-x: auto !important;
    gap: 8px !important;
    padding: 4px 2px 8px !important;
    margin-top: 10px !important;
    -webkit-overflow-scrolling: touch;
  }

  #app header.card .toolbar button {
    flex: 0 0 auto !important;
    min-width: 122px !important;
    padding: 10px 12px !important;
    border-radius: 14px !important;
    font-size: 13px !important;
  }

  #app .filters {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 8px !important;
  }

  #app .filters input,
  #app .filters select,
  #app .filters button {
    width: 100% !important;
    font-size: 16px !important;
  }

  #app .month-tools {
    display: flex !important;
    overflow-x: auto !important;
    gap: 7px !important;
    padding-bottom: 6px !important;
    -webkit-overflow-scrolling: touch;
  }

  #app .month-btn {
    flex: 0 0 auto !important;
    min-width: 58px !important;
  }

  #safeFinancialStatus > div[style*="display:flex"],
  .safe-financial-status > div[style*="display:flex"],
  #app .stats,
  #app .alert-strip {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
  }

  #safeFinancialStatus .card,
  .safe-financial-status .card,
  #app .stat,
  #app .alert-card {
    min-height: 76px !important;
    padding: 11px !important;
    border-radius: 16px !important;
  }

  #app section.panel .toolbar {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
  }

  #app section.panel .toolbar button {
    width: 100% !important;
    min-height: 48px !important;
    border-radius: 15px !important;
    font-size: 13px !important;
    padding: 10px 8px !important;
  }

  #app .table-wrap {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    border-radius: 18px !important;
    max-width: 100% !important;
  }

  #app table {
    min-width: 1180px !important;
    font-size: 12px !important;
  }

  #app th,
  #app td {
    padding: 9px 8px !important;
    white-space: nowrap !important;
  }

  #app .modal-box,
  .modal-box {
    width: 100% !important;
    max-width: 100% !important;
    max-height: 92vh !important;
    overflow-y: auto !important;
    border-radius: 22px !important;
    padding: 14px !important;
  }

  #app .form-grid {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 10px !important;
  }

  #app input.dark,
  #app select.dark,
  #app textarea.dark {
    font-size: 16px !important;
    min-height: 46px !important;
  }
}
</style>


<style id="v133-iphone-refine-only">
/* V133: based on V131. Only fixes Change Password / Logout and table scrolling. Login untouched. */

@media (max-width: 820px) {
  /* Put Change Password + Logout in a clean row instead of floating/cutting */
  #app .brand > div[style*="justify-content:flex-end"] {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
    width: 100% !important;
    margin-top: 10px !important;
  }

  #app .brand > div[style*="justify-content:flex-end"] button {
    width: 100% !important;
    min-height: 44px !important;
    border-radius: 15px !important;
    font-size: 13px !important;
    padding: 9px 10px !important;
  }

  #app .brand > div[style*="justify-content:flex-end"] button.red {
    color: #ff8b8b !important;
  }

  /* Keep header compact like V131, not huge like V132 */
  #app header.card .toolbar {
    display: flex !important;
    overflow-x: auto !important;
    gap: 8px !important;
    padding: 4px 2px 8px !important;
    margin-top: 10px !important;
    -webkit-overflow-scrolling: touch !important;
    scroll-behavior: auto !important;
  }

  #app header.card .toolbar button {
    flex: 0 0 auto !important;
    min-width: 122px !important;
  }

  /* Faster, smoother horizontal table scrolling */
  #app .table-wrap {
    overflow-x: scroll !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
    scroll-behavior: auto !important;
    overscroll-behavior-x: contain !important;
    touch-action: pan-x pan-y !important;
  }

  #app .table-wrap table {
    min-width: 1320px !important;
  }

  /* Make row touch/drag feel less heavy */
  #app .table-wrap th,
  #app .table-wrap td {
    padding: 8px 7px !important;
  }

  #app .table-wrap tbody tr {
    contain: layout paint !important;
  }
}
</style>


<style id="v134-report-mobile-dark-fix">
/* V134 report readability + mobile return fix. Login untouched. */

/* If a generated report opens in same app window, force readable report styling */
body:has(h1):has(table) {
  background: #ffffff !important;
  color: #111111 !important;
}

body:has(h1):has(table) h1,
body:has(h1):has(table) h2,
body:has(h1):has(table) div,
body:has(h1):has(table) span,
body:has(h1):has(table) td,
body:has(h1):has(table) th {
  color: #111111 !important;
}

body:has(h1):has(table) table {
  background: #ffffff !important;
  color: #111111 !important;
}

body:has(h1):has(table) th {
  background: #edf2ff !important;
  color: #111111 !important;
}

body:has(h1):has(table) td {
  background: #ffffff !important;
  color: #111111 !important;
}

@media (max-width: 820px) {
  body:has(h1):has(table) {
    padding: 12px !important;
    overflow-x: auto !important;
  }
  body:has(h1):has(table) table {
    min-width: 980px !important;
  }
}
</style>


<style id="v136-selection-fix-css">
/* V136 selection UX. Login/auth untouched. */
tr.selected {
  background: rgba(217,185,145,.16) !important;
  box-shadow: inset 4px 0 0 rgba(217,185,145,.75) !important;
}
.row-check,
.premium-check {
  width: 22px !important;
  height: 22px !important;
  accent-color: #d2ad83 !important;
  cursor: pointer !important;
}
td:has(.row-check),
td:has(.premium-check) {
  cursor: pointer !important;
}
</style>


<style id="v148-inline-reports-safe-css">
#inlineReportModal.modal.show{
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  padding:18px!important;
  z-index:99999!important;
}
.inline-report-box{
  width:min(1180px,96vw)!important;
  max-height:92vh!important;
  display:flex!important;
  flex-direction:column!important;
  overflow:hidden!important;
}
.inline-report-toolbar{
  display:flex!important;
  justify-content:space-between!important;
  align-items:center!important;
  gap:10px!important;
  padding:12px 14px!important;
  border-bottom:1px solid rgba(217,185,145,.18)!important;
}
.inline-report-actions{display:flex!important;gap:8px!important;}
#inlineReportFrame{
  width:100%!important;
  height:76vh!important;
  border:0!important;
  background:#fff!important;
  border-radius:0 0 18px 18px!important;
}
@media(max-width:820px){
  #inlineReportModal.modal.show{padding:0!important;align-items:stretch!important;}
  .inline-report-box{width:100vw!important;max-width:100vw!important;height:100vh!important;max-height:100vh!important;border-radius:0!important;}
  .inline-report-toolbar{padding:10px!important;flex-wrap:wrap!important;}
  .inline-report-actions{width:100%!important;display:grid!important;grid-template-columns:1fr 1fr!important;}
  .inline-report-actions button{width:100%!important;min-height:44px!important;}
  #inlineReportFrame{height:calc(100vh - 112px)!important;border-radius:0!important;}
}
</style>


<style id="v168-dn-approver-css">
/* V168 DN Approver limited role - no login changes */

/* Hide financial cells/columns from the table */
body.role-dn-approver table th:nth-child(8),
body.role-dn-approver table td:nth-child(8),
body.role-dn-approver table th:nth-child(9),
body.role-dn-approver table td:nth-child(9),
body.role-dn-approver table th:nth-child(14),
body.role-dn-approver table td:nth-child(14),
body.role-dn-approver table th:nth-child(15),
body.role-dn-approver table td:nth-child(15),
body.role-dn-approver table th:nth-child(16),
body.role-dn-approver table td:nth-child(16),
body.role-dn-approver table th:nth-child(17),
body.role-dn-approver table td:nth-child(17),
body.role-dn-approver table th:nth-child(18),
body.role-dn-approver table td:nth-child(18),
body.role-dn-approver table th:nth-child(19),
body.role-dn-approver table td:nth-child(19) {
  display: none !important;
}

/* Hide money/cards/status financial overview */
body.role-dn-approver .stat,
body.role-dn-approver .stats,
body.role-dn-approver .alert-strip,
body.role-dn-approver #safeFinancialStatus,
body.role-dn-approver .safe-financial-status,
body.role-dn-approver .financial-status,
body.role-dn-approver .credit-statement {
  display: none !important;
}

/* Hide all action/report/admin buttons except Convert Order -> DN and filters/search */
body.role-dn-approver button[onclick*="Invoice"],
body.role-dn-approver button[onclick*="invoice"],
body.role-dn-approver button[onclick*="Deposit"],
body.role-dn-approver button[onclick*="deposit"],
body.role-dn-approver button[onclick*="Report"],
body.role-dn-approver button[onclick*="report"],
body.role-dn-approver button[onclick*="Audit"],
body.role-dn-approver button[onclick*="Roles"],
body.role-dn-approver button[onclick*="Settings"],
body.role-dn-approver button[onclick*="bulkDelete"],
body.role-dn-approver button[onclick*="duplicate"],
body.role-dn-approver button[onclick*="bulkMarkPaid"],
body.role-dn-approver button[onclick*="markSelected"],
body.role-dn-approver button[onclick*="openEntryModal"],
body.role-dn-approver button[onclick*="openDepositModal"] {
  display: none !important;
}

body.role-dn-approver button[onclick*="convertOrderToDN"] {
  display: inline-flex !important;
  visibility: visible !important;
}

/* Keep filters/search visible */
body.role-dn-approver .filters,
body.role-dn-approver .filters *,
body.role-dn-approver .month-tools,
body.role-dn-approver .month-tools * {
  display: revert !important;
}

/* Hide selected financial summary text */
body.role-dn-approver .money-gold,
body.role-dn-approver .money-red,
body.role-dn-approver .money-blue,
body.role-dn-approver .money-green,
body.role-dn-approver .money-amber {
  display: none !important;
}
</style>


<style id="v169-dn-approver-dropdown-label">
/* V169: role dropdown includes DN Approver. Login untouched. */
</style>

</head><body><button class="report-back-btn" onclick="if(window.opener){window.close()}else{history.back()}">← Back to Dashboard</button><h1>Monthly Report - ${reportMonthLabel()}</h1><div class="cards"><div class="card">Invoices Total: ${money(sum.invoiceTotal)}</div><div class="card">Deposits Added: ${money(sum.depositTotal)}</div><div class="card">Deposit Applied: ${money(sum.depositApplied)}</div><div class="card">Outstanding After Deposit: ${money(sum.outstanding)}</div><div class="card">Carry Forward Credit: ${money(sum.carryForward)}</div></div><div class="report-table-wrap"><table><thead><tr><th>Date</th><th>Supplier</th><th>Process</th><th>Order No</th><th>Invoice No</th><th>Project</th><th>Description</th><th>Net</th><th>VAT</th><th>Total</th><th>Deposit Applied</th><th>Amount Due</th><th>Status</th><th>Created By</th><th>Notes</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(localDateFromAnyV97(r.created_at))}</td><td>${esc(r.supplier||"")}</td><td>${esc(processStatusLabel(r))}</td><td>${esc(r.order_no||"")}</td><td>${esc(r.invoice_no||"")}</td><td>${esc(r.project||"")}</td><td>${esc(r.description||"")}</td><td>${money(r.net_amount||0)}</td><td>${money(r.vat_amount||0)}</td><td>${money(r.total||r.amount||0)}</td><td>${money(r.deposit_applied||0)}</td><td>${money(r.amount_due||0)}</td><td>${esc(r.status||"")}</td><td>${esc(r.created_by||"")}</td><td>${esc(r.notes||"")}</td></tr>`).join("")}</tbody></table></div><script>window.onload=()=>window.print()<\/script>




</body></html>`);
  w.document.close();
};

function groupSummary(entries, key){
  const grouped = {};
  entries.forEach(e=>{
    const k = e[key] || "Unassigned";
    grouped[k] = (grouped[k] || 0) + Number(e.total || e.amount || 0);
  });
  return Object.entries(grouped).sort((a,b)=>b[1]-a[1]);
}


window.openSupplierReportModal = async function(){
  if(!canAccountant()) return alert("Only accountant, manager or admin can open supplier reports.");
  await render();
  document.getElementById("supplierReportModal")?.classList.add("show");
};
window.closeSupplierReportModal = function(){
  document.getElementById("supplierReportModal")?.classList.remove("show");
};
window.runSupplierReport = async function(){
  const selected = (document.getElementById("reportSupplierSelect")?.value || "").trim();
  const typed = (document.getElementById("reportSupplierInput")?.value || "").trim();
  let supplierNames = [];
  if(selected) supplierNames.push(selected);
  if(typed){
    supplierNames.push(...typed.split(",").map(s => s.trim()).filter(Boolean));
  }
  supplierNames = [...new Set(supplierNames)];
  if(!supplierNames.length){
    alert("Choose or type at least one supplier.");
    return;
  }
  const rows = (await getEntries()).filter(r => supplierNames.includes(r.supplier || ""));
  const sum = totals(rows);
  const doc = await buildPdfReport(
    "VARDOPHASE Supplier Report",
    supplierNames.join(", "),
    rows,
    [
      `Suppliers: ${supplierNames.join(", ")}`,
      `Net: ${money(sum.net)}`,
      `VAT: ${money(sum.vat)}`,
      `Total: ${money(sum.total)}`,
      `Paid: ${money(sum.paid)}`,
      `Unpaid: ${money(sum.unpaid)}`,
      `Rows: ${rows.length}`
    ]
  );
  const blob = doc.output("blob");
  const file = new File([blob], `Vardophase_Supplier_Report.pdf`, {type:"application/pdf"});
  if(navigator.canShare && navigator.canShare({files:[file]})){
    try{
      await navigator.share({ files:[file], title:"Vardophase Supplier Report" });
      window.closeSupplierReportModal();
      return;
    }catch(e){}
  }
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  window.closeSupplierReportModal();
};





window.printOpenOrdersReport = async function(){
  const rows = await getEntries();
  const open = rows.filter(r => displayEntryKind(r) === "order")
    .sort((a,b)=>{
      const da = daysOld(b.created_at) - daysOld(a.created_at);
      if(da !== 0) return da;
      return (a.supplier||"").localeCompare(b.supplier||"");
    });
  const rowsHtml = open.map(r => `<tr>
      <td>${esc(localDateFromAnyV97(r.created_at))}</td>
      <td>${esc(r.supplier||"")}</td>
      <td>${esc(r.order_no||"")}</td>
      <td>${esc(r.project||"")}</td>
      <td>${money(depositBaseAmount(r))}</td>
      <td>${daysOld(r.created_at)}</td>
      <td>${daysOld(r.created_at) >= 60 ? "Critical" : (daysOld(r.created_at) >= 30 ? "Follow up" : "Open")}</td>
    </tr>`).join("");
  const w = window.open("", "_blank");
  if(!w){ alert("Please allow pop-ups for reports."); return; }
  w.document.write(`<html><head><title>Open Orders Report</title>
<style>
  html, body {
    background: #ffffff !important;
    color: #111111 !important;
    -webkit-text-size-adjust: 100%;
  }
  body {
    font-family: Arial, Helvetica, sans-serif !important;
    padding: 18px !important;
    margin: 0 !important;
  }
  h1, h2, h3, p, div, span, td, th {
    color: #111111 !important;
  }
  table {
    width: 100% !important;
    border-collapse: collapse !important;
    background: #ffffff !important;
    color: #111111 !important;
  }
  th {
    background: #edf2ff !important;
    color: #111111 !important;
    font-weight: 800 !important;
  }
  td {
    background: #ffffff !important;
    color: #111111 !important;
  }
  th, td {
    border: 1px solid #cfd6e4 !important;
    padding: 7px !important;
    font-size: 12px !important;
  }
  .cards, .summary {
    color: #111111 !important;
  }
  .card {
    background: #f7f8fb !important;
    color: #111111 !important;
    border: 1px solid #d9dee8 !important;
    border-radius: 12px !important;
    padding: 10px !important;
    margin: 6px !important;
    display: inline-block !important;
  }
  .report-back-btn {
    position: sticky;
    top: 0;
    z-index: 99999;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    padding: 10px 16px;
    margin: 0 0 14px 0;
    border-radius: 14px;
    border: 1px solid #d2ad83;
    background: linear-gradient(145deg, #e4c9a7 0%, #d2ad83 44%, #bb9061 100%);
    color: #111 !important;
    font-weight: 900;
    text-decoration: none;
    cursor: pointer;
  }
  @media (max-width: 820px) {
    body { padding: 12px !important; }
    h1 { font-size: 22px !important; }
    table { min-width: 980px !important; }
    .report-table-wrap {
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
      width: 100% !important;
    }
    th, td { font-size: 11px !important; padding: 6px !important; }
  }
  @media print {
    .report-back-btn { display:none !important; }
    body { padding: 0 !important; }
  }
</style>

<style>
  html, body {
    background: #ffffff !important;
    color: #111111 !important;
    -webkit-text-size-adjust: 100%;
  }
  body {
    font-family: Arial, Helvetica, sans-serif !important;
    padding: 18px !important;
    margin: 0 !important;
  }
  h1, h2, h3, p, div, span, td, th {
    color: #111111 !important;
  }
  table {
    width: 100% !important;
    border-collapse: collapse !important;
    background: #ffffff !important;
    color: #111111 !important;
  }
  th {
    background: #edf2ff !important;
    color: #111111 !important;
    font-weight: 800 !important;
  }
  td {
    background: #ffffff !important;
    color: #111111 !important;
  }
  th, td {
    border: 1px solid #cfd6e4 !important;
    padding: 7px !important;
    font-size: 12px !important;
  }
  .cards, .summary {
    color: #111111 !important;
  }
  .card {
    background: #f7f8fb !important;
    color: #111111 !important;
    border: 1px solid #d9dee8 !important;
    border-radius: 12px !important;
    padding: 10px !important;
    margin: 6px !important;
    display: inline-block !important;
  }
  .report-back-btn {
    position: sticky;
    top: 0;
    z-index: 99999;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    padding: 10px 16px;
    margin: 0 0 14px 0;
    border-radius: 14px;
    border: 1px solid #d2ad83;
    background: linear-gradient(145deg, #e4c9a7 0%, #d2ad83 44%, #bb9061 100%);
    color: #111 !important;
    font-weight: 900;
    text-decoration: none;
    cursor: pointer;
  }
  @media (max-width: 820px) {
    body { padding: 12px !important; }
    h1 { font-size: 22px !important; }
    table { min-width: 980px !important; }
    .report-table-wrap {
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
      width: 100% !important;
    }
    th, td { font-size: 11px !important; padding: 6px !important; }
  }
  @media print {
    .report-back-btn { display:none !important; }
    body { padding: 0 !important; }
  }
</style>
<style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#fff3cd}</style>
<style>
/* SAFE UI ONLY - NO JS TOUCH */

body {
  background: #0f0f10;
}

/* cards polish */
.card {
  border-radius: 18px !important;
  border: 1px solid rgba(255,255,255,0.08) !important;
  background: rgba(255,255,255,0.03) !important;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

/* headings */
h2, .section-title {
  font-weight: 900 !important;
  color: #ffffff !important;
}

/* KPI colors */
.green { color: #4cd964 !important; }
.red { color: #ff6b6b !important; }
.blue { color: #6ea8ff !important; }
.yellow { color: #f5c542 !important; }

/* top header spacing */
header, .topbar, .app-header {
  padding: 12px 20px !important;
}

/* small daily inline (visual only placeholder) */
.logo::after {
  content: "  |  LIVE";
  color: #d9b991;
  font-size: 12px;
  margin-left: 10px;
}

</style>



<style id="v84-bubble-size-and-financial-card">
/* V84 UI-only: reduce app bubbles by 20% and polish Project BLU card. Login/auth untouched. */
#app .shell > header.card,
#app .shell > section.panel{
  border-radius: 26px !important;
  padding: 22px !important;
}
#app .shell .card,
#app .shell .panel,
#app .shell .stat,
#app .shell .alert-card,
#app .shell .fs-card,
#app #safeFinancialStatus .card{
  border-radius: 22px !important;
}
#app .shell .stat{
  min-height: 112px !important;
  padding: 19px !important;
}
#app .shell .stat::after{
  width: 56px !important;
  height: 56px !important;
  right: 18px !important;
  top: 18px !important;
}
#app .shell .alert-card{
  min-height: 76px !important;
  padding: 14px !important;
}
#app .shell .stats{
  gap: 17px !important;
  margin-bottom: 19px !important;
}
#app .shell .toolbar{
  gap: 10px !important;
}
#app .shell button,
#app .shell .main-action,
#app .shell .month-btn,
#app .shell select.dark,
#app .shell input.dark{
  border-radius: 15px !important;
}
#app .shell .main-action,
#app .shell button{
  min-height: 42px !important;
  padding: 10px 14px !important;
}
#app .shell .label,
#app .shell .stat .label{
  font-size: 14px !important;
  margin-bottom: 9px !important;
}
#app .shell .value,
#app .shell .stat .value{
  font-size: 22px !important;
}
#app #safeFinancialStatus,
#app .safe-financial-status,
#app #financialStatus,
#app .financial-status,
#app .fs-wrap{
  padding: 24px !important;
  border-radius: 27px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"]{
  gap: 12px !important;
  margin-bottom: 16px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"] > .card{
  padding: 14px !important;
  min-height: 78px !important;
  min-width: 160px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"] .card div{
  font-size: 12px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"] .card b{
  font-size: 19px !important;
}
#app .fs-project-bubble{
  margin-top: 10px !important;
  padding: 18px 20px !important;
  border-radius: 24px !important;
  background:
    radial-gradient(circle at 92% 22%, rgba(227,191,140,.15), transparent 26%),
    linear-gradient(180deg, rgba(255,255,255,.065), rgba(255,255,255,.018)) !important;
  border: 1px solid rgba(227,191,140,.22) !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 12px 30px rgba(0,0,0,.22) !important;
}
#app .fs-project-head{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:12px;
  padding-bottom: 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(255,255,255,.08);
}
#app .fs-project-label{
  color:#c9b18d;
  font-size:12px;
  font-weight:800;
  letter-spacing:.08em;
  text-transform:uppercase;
}
#app .fs-project-bubble h3{
  margin:0 !important;
  font-size:24px !important;
  color:#fff !important;
  line-height:1.05 !important;
}
#app .fs-project-bubble > div:not(.fs-project-head){
  display:flex;
  justify-content:space-between;
  gap:18px;
  align-items:center;
  padding: 5px 0;
  font-size:15px !important;
  color:#d8dce6;
}
#app .fs-project-bubble b{
  font-size:16px !important;
}
@media(max-width:720px){
  #app .shell > header.card,
  #app .shell > section.panel{padding:16px !important;border-radius:23px !important;}
  #app .shell .stats{grid-template-columns:repeat(2,minmax(0,1fr)) !important;gap:11px !important;}
  #app .shell .stat{min-height:94px !important;padding:14px !important;border-radius:19px !important;}
  #app .shell .value,#app .shell .stat .value{font-size:19px !important;}
  #app #safeFinancialStatus,.safe-financial-status,#financialStatus,.financial-status,.fs-wrap{padding:18px !important;border-radius:23px !important;}
  #app #safeFinancialStatus > div[style*="display:flex"] > .card{min-width:130px !important;}
  #app .fs-project-bubble{padding:15px !important;border-radius:20px !important;}
}
</style>





<style id="remove-project-dashboard-v105">
/* V105: fully hide Project dashboard/card block. Login/auth untouched. */
#project-status,
#project-financial-status,
#projectDashboard,
#project-dashboard,
#projectCard,
#project-card,
#projects,
#projects-dashboard,
.project-status,
.project-financial-status,
.project-dashboard,
.project-card,
.project-summary-card,
.project-financial-card,
.projects-card,
.projects-dashboard,
.card.project,
.panel.project,
section.project,
div[data-section="project"],
div[data-card="project"],
div[data-title="PROJECT"],
div[data-title="Project"] {
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
  min-height: 0 !important;
  max-height: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
}

/* Hide the specific legacy block by content structure when present */
.financial-project-card,
.financial-project-panel,
.project-breakdown,
.project-breakdown-card,
.project-kpi-card {
  display: none !important;
}
</style>



<style id="v111-deposit-paid-lock">
/* Deposit status locked as Paid; login/auth untouched. */
.deposit-paid-locked { pointer-events:none; opacity:.75; }
</style>


<style id="v112-deposit-hard-lock">
/* V112: Deposit status is hard-locked to Paid and hidden. Login/auth untouched. */
#entryStatusWrap[style*="display: none"] { display:none !important; }
#entryStatus:disabled { pointer-events:none !important; opacity:.7 !important; }
</style>


<style id="v113-deposit-display">
/* V113: Deposit displayed as separate type, not Order. Login/auth untouched. */
.table-wrap .status-deposit,
.table-wrap .kind-deposit,
.badge.deposit {
  color:#111 !important;
  border-color:rgba(217,185,145,.34) !important;
  background:linear-gradient(145deg, #e4c9a7 0%, #d2ad83 44%, #bb9061 100%) !important;
}
</style>


<style id="v119-cosmetic-buttons">
/* V119 cosmetic buttons only. Login/auth/logic untouched. */

/* Add Deposit: close to Invoice gold, but slightly more copper/rose-gold */
button.add-deposit-btn,
#app button.add-deposit-btn {
  background:
    radial-gradient(circle at 22% 15%, rgba(255,255,255,.34), transparent 24%),
    linear-gradient(135deg, #f2d0a2 0%, #d7a56f 46%, #b9814f 100%) !important;
  color: #121212 !important;
  border: 1px solid rgba(255,222,176,.75) !important;
  font-weight: 900 !important;
  letter-spacing: .01em !important;
  box-shadow:
    0 10px 24px rgba(217,165,111,.22),
    inset 0 1px 0 rgba(255,255,255,.38) !important;
}
button.add-deposit-btn:hover,
#app button.add-deposit-btn:hover {
  filter: brightness(1.08) saturate(1.05) !important;
  transform: translateY(-1px) !important;
}

/* Delete Selected: designed red button with black text */
button.delete-selected-btn,
#app button.delete-selected-btn {
  background:
    radial-gradient(circle at 20% 14%, rgba(255,255,255,.24), transparent 26%),
    linear-gradient(135deg, #ff7373 0%, #e13737 45%, #a90000 100%) !important;
  color: #050505 !important;
  border: 1px solid rgba(255,80,80,.85) !important;
  font-weight: 950 !important;
  letter-spacing: .01em !important;
  text-shadow: none !important;
  box-shadow:
    0 10px 24px rgba(255,0,0,.20),
    inset 0 1px 0 rgba(255,255,255,.30) !important;
}
button.delete-selected-btn:hover,
#app button.delete-selected-btn:hover {
  filter: brightness(1.08) saturate(1.08) !important;
  transform: translateY(-1px) !important;
}
</style>


<style id="v121-header-daily-premium-layout">
/* V121: Premium header / logo / daily spacing only. Login/auth/logic untouched. */

#app .brand {
  align-items: center !important;
  gap: 22px !important;
}

#app .brand-left {
  display: grid !important;
  grid-template-columns: auto 1fr !important;
  align-items: center !important;
  column-gap: 22px !important;
  row-gap: 12px !important;
  width: 100% !important;
}

#app .logo {
  width: 72px !important;
  height: 72px !important;
  min-width: 72px !important;
  border-radius: 22px !important;
  font-size: 34px !important;
  box-shadow:
    0 14px 32px rgba(217,185,145,.22),
    inset 0 1px 0 rgba(255,255,255,.38) !important;
}

#app .logo::after {
  content: "LIVE" !important;
  position: absolute !important;
  right: -12px !important;
  bottom: 10px !important;
  font-size: 11px !important;
  color: rgba(255,255,255,.38) !important;
  letter-spacing: .05em !important;
  margin: 0 !important;
}

#app .title {
  font-size: clamp(34px, 4.2vw, 56px) !important;
  line-height: .95 !important;
  letter-spacing: -.04em !important;
  margin-bottom: 6px !important;
}

#app .brand-subtitle {
  font-size: 18px !important;
  color: #e5c79e !important;
  margin-bottom: 18px !important;
}

#app .daily-header-bar {
  display: grid !important;
  grid-template-columns: minmax(190px, auto) repeat(3, minmax(170px, auto)) !important;
  gap: 14px !important;
  align-items: stretch !important;
  margin: 14px 0 16px !important;
  max-width: 920px !important;
}

#app .daily-chip {
  min-height: 74px !important;
  border-radius: 22px !important;
  padding: 14px 18px !important;
  background:
    radial-gradient(circle at 18% 16%, rgba(255,255,255,.13), transparent 30%),
    linear-gradient(145deg, rgba(255,255,255,.085), rgba(255,255,255,.025)) !important;
  border: 1px solid rgba(217,185,145,.22) !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.075),
    0 12px 28px rgba(0,0,0,.20) !important;
}

#app .daily-chip.daily-title {
  background:
    radial-gradient(circle at 18% 16%, rgba(255,255,255,.22), transparent 30%),
    linear-gradient(135deg, rgba(217,185,145,.32), rgba(86,66,44,.18)) !important;
}

#app .daily-label {
  display: block !important;
  font-size: 13px !important;
  line-height: 1 !important;
  font-weight: 950 !important;
  letter-spacing: .08em !important;
  color: #d9c2a1 !important;
  text-transform: uppercase !important;
  margin-bottom: 9px !important;
  white-space: nowrap !important;
}

#app .daily-value {
  display: block !important;
  font-size: 24px !important;
  line-height: 1.05 !important;
  font-weight: 950 !important;
  color: #ffffff !important;
  letter-spacing: -.02em !important;
  white-space: nowrap !important;
}

#app .userbar {
  margin-top: 10px !important;
  display: flex !important;
  gap: 12px !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  font-size: 22px !important;
}

#app .role-badge {
  padding: 7px 18px !important;
  border-radius: 999px !important;
  font-size: 17px !important;
  font-weight: 950 !important;
}

#app header.card {
  padding-top: 30px !important;
  padding-bottom: 28px !important;
}

#app header.card .toolbar {
  margin-top: 26px !important;
}

/* Tablet / laptop narrow */
@media (max-width: 1050px) {
  #app .daily-header-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    max-width: 760px !important;
  }
}

/* Mobile */
@media (max-width: 720px) {
  #app .brand-left {
    grid-template-columns: 1fr !important;
    justify-items: center !important;
    text-align: center !important;
    gap: 14px !important;
  }

  #app .logo {
    width: 64px !important;
    height: 64px !important;
    min-width: 64px !important;
    font-size: 30px !important;
  }

  #app .title {
    font-size: 38px !important;
  }

  #app .brand-subtitle {
    font-size: 15px !important;
    margin-bottom: 14px !important;
  }

  #app .daily-header-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 10px !important;
    margin: 12px auto 14px !important;
    width: 100% !important;
  }

  #app .daily-chip {
    min-height: 66px !important;
    padding: 12px 14px !important;
    border-radius: 18px !important;
  }

  #app .daily-label {
    font-size: 11px !important;
    margin-bottom: 7px !important;
  }

  #app .daily-value {
    font-size: 19px !important;
  }

  #app .userbar {
    justify-content: center !important;
    font-size: 17px !important;
  }
}
</style>


<style id="v122-header-scale-50">
/* Reduce header elements to ~50% without changing layout */

#app .logo {
  width: 48px !important;
  height: 48px !important;
  min-width: 48px !important;
  font-size: 22px !important;
}

#app .title {
  font-size: 28px !important;
}

#app .brand-subtitle {
  font-size: 13px !important;
  margin-bottom: 8px !important;
}

#app .daily-chip {
  min-height: 44px !important;
  padding: 8px 12px !important;
  border-radius: 14px !important;
}

#app .daily-label {
  font-size: 10px !important;
  margin-bottom: 4px !important;
}

#app .daily-value {
  font-size: 15px !important;
}

#app .daily-header-bar {
  gap: 8px !important;
  margin: 6px 0 8px !important;
}

#app .userbar {
  font-size: 14px !important;
}

#app .role-badge {
  font-size: 12px !important;
  padding: 4px 10px !important;
}

#app header.card {
  padding-top: 14px !important;
  padding-bottom: 12px !important;
}
</style>


<style id="v127-button-colors">
/* Gold buttons like Order */
button[onclick*="convertOrderToDN"],
button[onclick*="convertOrderToInvoice"] {
  background: linear-gradient(135deg, #f2d3a0, #d4a65a) !important;
  color: #000 !important;
  font-weight: 700;
  border: 1px solid rgba(255,215,150,0.6);
  box-shadow: 0 6px 16px rgba(212,166,90,0.25);
}

button[onclick*="convertOrderToDN"]:hover,
button[onclick*="convertOrderToInvoice"]:hover {
  filter: brightness(1.05);
}

/* Softer red for delete */
button.delete-selected-btn {
  background: linear-gradient(135deg, #e06666, #a83232) !important;
  color: #000 !important;
  border: 1px solid rgba(200,80,80,0.6);
  box-shadow: 0 4px 12px rgba(160,50,50,0.25);
}

button.delete-selected-btn:hover {
  filter: brightness(1.05);
}
</style>


<style id="v128-gold-match-animation">
/* Match exact system gold (same tone as Order badge) */
button[onclick*="convertOrderToDN"],
button[onclick*="convertOrderToInvoice"] {
  background: linear-gradient(145deg, #e4c9a7 0%, #d2ad83 44%, #bb9061 100%) !important;
  color: #000 !important;
  border: 1px solid rgba(217,185,145,.45) !important;
  font-weight: 800;
  box-shadow:
    0 6px 18px rgba(187,144,97,.25),
    inset 0 1px 0 rgba(255,255,255,.35);
  transition: all 0.18s ease;
}

/* Hover glow animation (keyboard + mouse focus) */
button[onclick*="convertOrderToDN"]:hover,
button[onclick*="convertOrderToInvoice"]:hover,
button[onclick*="convertOrderToDN"]:focus,
button[onclick*="convertOrderToInvoice"]:focus {
  filter: brightness(1.12);
  box-shadow:
    0 0 0 2px rgba(217,185,145,.35),
    0 8px 22px rgba(187,144,97,.35),
    inset 0 1px 0 rgba(255,255,255,.45);
  transform: translateY(-1px);
}

/* Softer delete (keep elegant) */
button.delete-selected-btn {
  background: linear-gradient(145deg, #d97a7a 0%, #b84a4a 50%, #7a1f1f 100%) !important;
  color: #000 !important;
  border: 1px solid rgba(200,120,120,.5);
  transition: all 0.18s ease;
}

button.delete-selected-btn:hover,
button.delete-selected-btn:focus {
  filter: brightness(1.08);
  box-shadow:
    0 0 0 2px rgba(200,100,100,.25),
    0 8px 20px rgba(120,30,30,.3);
  transform: translateY(-1px);
}
</style>


<style id="v129-global-button-ux">
button {
  transition: all 0.15s ease;
  position: relative;
}

button:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
}

button:focus {
  outline: none;
  box-shadow:
    0 0 0 2px rgba(217,185,145,.35),
    0 6px 16px rgba(0,0,0,.25);
}

button:active {
  transform: translateY(1px) scale(0.97);
  box-shadow:
    inset 0 3px 8px rgba(0,0,0,.35);
}

button::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.2s ease;
  background: radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 60%);
}

button:active::after {
  opacity: 1;
}
</style>


<meta name="theme-color" content="#080808">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Vardophase">


<style id="v131-iphone-css-only-login-safe">
/* V131 iPhone CSS-only. No JS, no service worker, login/auth untouched. */

html, body {
  -webkit-text-size-adjust: 100%;
}

button,
select,
input,
textarea,
.month-btn,
.nav-pill {
  min-height: 44px;
  touch-action: manipulation;
}

@media (max-width: 820px) {
  body {
    padding: 8px !important;
  }

  #app .shell {
    padding: 8px 8px calc(80px + env(safe-area-inset-bottom)) !important;
    max-width: 100% !important;
  }

  #app header.card,
  #app section.panel,
  #app .card,
  #app .panel {
    border-radius: 20px !important;
  }

  #app header.card {
    padding: 12px !important;
  }

  #app .brand-left {
    display: grid !important;
    grid-template-columns: auto 1fr !important;
    gap: 10px !important;
    text-align: left !important;
    align-items: center !important;
  }

  #app .logo {
    width: 44px !important;
    height: 44px !important;
    min-width: 44px !important;
    border-radius: 14px !important;
    font-size: 20px !important;
  }

  #app .title {
    font-size: 24px !important;
    line-height: 1 !important;
    margin: 0 !important;
  }

  #app .brand-subtitle {
    font-size: 12px !important;
    margin: 3px 0 8px !important;
  }

  #app .daily-header-bar {
    grid-column: 1 / -1 !important;
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
    margin: 8px 0 6px !important;
    width: 100% !important;
    max-width: none !important;
  }

  #app .daily-chip {
    min-height: 54px !important;
    padding: 9px 10px !important;
    border-radius: 16px !important;
  }

  #app .daily-label {
    font-size: 10px !important;
    margin-bottom: 5px !important;
  }

  #app .daily-value {
    font-size: 16px !important;
    white-space: nowrap !important;
  }

  #app .userbar {
    grid-column: 1 / -1 !important;
    font-size: 12px !important;
    gap: 6px !important;
    margin-top: 6px !important;
  }

  #app header.card .toolbar {
    display: flex !important;
    overflow-x: auto !important;
    gap: 8px !important;
    padding: 4px 2px 8px !important;
    margin-top: 10px !important;
    -webkit-overflow-scrolling: touch;
  }

  #app header.card .toolbar button {
    flex: 0 0 auto !important;
    min-width: 122px !important;
    padding: 10px 12px !important;
    border-radius: 14px !important;
    font-size: 13px !important;
  }

  #app .filters {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 8px !important;
  }

  #app .filters input,
  #app .filters select,
  #app .filters button {
    width: 100% !important;
    font-size: 16px !important;
  }

  #app .month-tools {
    display: flex !important;
    overflow-x: auto !important;
    gap: 7px !important;
    padding-bottom: 6px !important;
    -webkit-overflow-scrolling: touch;
  }

  #app .month-btn {
    flex: 0 0 auto !important;
    min-width: 58px !important;
  }

  #safeFinancialStatus > div[style*="display:flex"],
  .safe-financial-status > div[style*="display:flex"],
  #app .stats,
  #app .alert-strip {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
  }

  #safeFinancialStatus .card,
  .safe-financial-status .card,
  #app .stat,
  #app .alert-card {
    min-height: 76px !important;
    padding: 11px !important;
    border-radius: 16px !important;
  }

  #app section.panel .toolbar {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
  }

  #app section.panel .toolbar button {
    width: 100% !important;
    min-height: 48px !important;
    border-radius: 15px !important;
    font-size: 13px !important;
    padding: 10px 8px !important;
  }

  #app .table-wrap {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    border-radius: 18px !important;
    max-width: 100% !important;
  }

  #app table {
    min-width: 1180px !important;
    font-size: 12px !important;
  }

  #app th,
  #app td {
    padding: 9px 8px !important;
    white-space: nowrap !important;
  }

  #app .modal-box,
  .modal-box {
    width: 100% !important;
    max-width: 100% !important;
    max-height: 92vh !important;
    overflow-y: auto !important;
    border-radius: 22px !important;
    padding: 14px !important;
  }

  #app .form-grid {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 10px !important;
  }

  #app input.dark,
  #app select.dark,
  #app textarea.dark {
    font-size: 16px !important;
    min-height: 46px !important;
  }
}
</style>


<style id="v133-iphone-refine-only">
/* V133: based on V131. Only fixes Change Password / Logout and table scrolling. Login untouched. */

@media (max-width: 820px) {
  /* Put Change Password + Logout in a clean row instead of floating/cutting */
  #app .brand > div[style*="justify-content:flex-end"] {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
    width: 100% !important;
    margin-top: 10px !important;
  }

  #app .brand > div[style*="justify-content:flex-end"] button {
    width: 100% !important;
    min-height: 44px !important;
    border-radius: 15px !important;
    font-size: 13px !important;
    padding: 9px 10px !important;
  }

  #app .brand > div[style*="justify-content:flex-end"] button.red {
    color: #ff8b8b !important;
  }

  /* Keep header compact like V131, not huge like V132 */
  #app header.card .toolbar {
    display: flex !important;
    overflow-x: auto !important;
    gap: 8px !important;
    padding: 4px 2px 8px !important;
    margin-top: 10px !important;
    -webkit-overflow-scrolling: touch !important;
    scroll-behavior: auto !important;
  }

  #app header.card .toolbar button {
    flex: 0 0 auto !important;
    min-width: 122px !important;
  }

  /* Faster, smoother horizontal table scrolling */
  #app .table-wrap {
    overflow-x: scroll !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
    scroll-behavior: auto !important;
    overscroll-behavior-x: contain !important;
    touch-action: pan-x pan-y !important;
  }

  #app .table-wrap table {
    min-width: 1320px !important;
  }

  /* Make row touch/drag feel less heavy */
  #app .table-wrap th,
  #app .table-wrap td {
    padding: 8px 7px !important;
  }

  #app .table-wrap tbody tr {
    contain: layout paint !important;
  }
}
</style>


<style id="v134-report-mobile-dark-fix">
/* V134 report readability + mobile return fix. Login untouched. */

/* If a generated report opens in same app window, force readable report styling */
body:has(h1):has(table) {
  background: #ffffff !important;
  color: #111111 !important;
}

body:has(h1):has(table) h1,
body:has(h1):has(table) h2,
body:has(h1):has(table) div,
body:has(h1):has(table) span,
body:has(h1):has(table) td,
body:has(h1):has(table) th {
  color: #111111 !important;
}

body:has(h1):has(table) table {
  background: #ffffff !important;
  color: #111111 !important;
}

body:has(h1):has(table) th {
  background: #edf2ff !important;
  color: #111111 !important;
}

body:has(h1):has(table) td {
  background: #ffffff !important;
  color: #111111 !important;
}

@media (max-width: 820px) {
  body:has(h1):has(table) {
    padding: 12px !important;
    overflow-x: auto !important;
  }
  body:has(h1):has(table) table {
    min-width: 980px !important;
  }
}
</style>


<style id="v136-selection-fix-css">
/* V136 selection UX. Login/auth untouched. */
tr.selected {
  background: rgba(217,185,145,.16) !important;
  box-shadow: inset 4px 0 0 rgba(217,185,145,.75) !important;
}
.row-check,
.premium-check {
  width: 22px !important;
  height: 22px !important;
  accent-color: #d2ad83 !important;
  cursor: pointer !important;
}
td:has(.row-check),
td:has(.premium-check) {
  cursor: pointer !important;
}
</style>


<style id="v148-inline-reports-safe-css">
#inlineReportModal.modal.show{
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  padding:18px!important;
  z-index:99999!important;
}
.inline-report-box{
  width:min(1180px,96vw)!important;
  max-height:92vh!important;
  display:flex!important;
  flex-direction:column!important;
  overflow:hidden!important;
}
.inline-report-toolbar{
  display:flex!important;
  justify-content:space-between!important;
  align-items:center!important;
  gap:10px!important;
  padding:12px 14px!important;
  border-bottom:1px solid rgba(217,185,145,.18)!important;
}
.inline-report-actions{display:flex!important;gap:8px!important;}
#inlineReportFrame{
  width:100%!important;
  height:76vh!important;
  border:0!important;
  background:#fff!important;
  border-radius:0 0 18px 18px!important;
}
@media(max-width:820px){
  #inlineReportModal.modal.show{padding:0!important;align-items:stretch!important;}
  .inline-report-box{width:100vw!important;max-width:100vw!important;height:100vh!important;max-height:100vh!important;border-radius:0!important;}
  .inline-report-toolbar{padding:10px!important;flex-wrap:wrap!important;}
  .inline-report-actions{width:100%!important;display:grid!important;grid-template-columns:1fr 1fr!important;}
  .inline-report-actions button{width:100%!important;min-height:44px!important;}
  #inlineReportFrame{height:calc(100vh - 112px)!important;border-radius:0!important;}
}
</style>


<style id="v168-dn-approver-css">
/* V168 DN Approver limited role - no login changes */

/* Hide financial cells/columns from the table */
body.role-dn-approver table th:nth-child(8),
body.role-dn-approver table td:nth-child(8),
body.role-dn-approver table th:nth-child(9),
body.role-dn-approver table td:nth-child(9),
body.role-dn-approver table th:nth-child(14),
body.role-dn-approver table td:nth-child(14),
body.role-dn-approver table th:nth-child(15),
body.role-dn-approver table td:nth-child(15),
body.role-dn-approver table th:nth-child(16),
body.role-dn-approver table td:nth-child(16),
body.role-dn-approver table th:nth-child(17),
body.role-dn-approver table td:nth-child(17),
body.role-dn-approver table th:nth-child(18),
body.role-dn-approver table td:nth-child(18),
body.role-dn-approver table th:nth-child(19),
body.role-dn-approver table td:nth-child(19) {
  display: none !important;
}

/* Hide money/cards/status financial overview */
body.role-dn-approver .stat,
body.role-dn-approver .stats,
body.role-dn-approver .alert-strip,
body.role-dn-approver #safeFinancialStatus,
body.role-dn-approver .safe-financial-status,
body.role-dn-approver .financial-status,
body.role-dn-approver .credit-statement {
  display: none !important;
}

/* Hide all action/report/admin buttons except Convert Order -> DN and filters/search */
body.role-dn-approver button[onclick*="Invoice"],
body.role-dn-approver button[onclick*="invoice"],
body.role-dn-approver button[onclick*="Deposit"],
body.role-dn-approver button[onclick*="deposit"],
body.role-dn-approver button[onclick*="Report"],
body.role-dn-approver button[onclick*="report"],
body.role-dn-approver button[onclick*="Audit"],
body.role-dn-approver button[onclick*="Roles"],
body.role-dn-approver button[onclick*="Settings"],
body.role-dn-approver button[onclick*="bulkDelete"],
body.role-dn-approver button[onclick*="duplicate"],
body.role-dn-approver button[onclick*="bulkMarkPaid"],
body.role-dn-approver button[onclick*="markSelected"],
body.role-dn-approver button[onclick*="openEntryModal"],
body.role-dn-approver button[onclick*="openDepositModal"] {
  display: none !important;
}

body.role-dn-approver button[onclick*="convertOrderToDN"] {
  display: inline-flex !important;
  visibility: visible !important;
}

/* Keep filters/search visible */
body.role-dn-approver .filters,
body.role-dn-approver .filters *,
body.role-dn-approver .month-tools,
body.role-dn-approver .month-tools * {
  display: revert !important;
}

/* Hide selected financial summary text */
body.role-dn-approver .money-gold,
body.role-dn-approver .money-red,
body.role-dn-approver .money-blue,
body.role-dn-approver .money-green,
body.role-dn-approver .money-amber {
  display: none !important;
}
</style>


<style id="v169-dn-approver-dropdown-label">
/* V169: role dropdown includes DN Approver. Login untouched. */
</style>

</head><body><button class="report-back-btn" onclick="if(window.opener){window.close()}else{history.back()}">← Back to Dashboard</button><h1>Open Orders Report - ${reportMonthLabel()}</h1><div class="report-table-wrap"><table><thead><tr><th>Date</th><th>Supplier</th><th>Order No</th><th>Project</th><th>Amount</th><th>Days Open</th><th>Status</th></tr></thead><tbody>${rowsHtml}</tbody></table></div><script>window.onload=()=>window.print()<\/script>




</body></html>`);
  w.document.close();
};

window.openAuditLog = async function(){
  if(!canViewAudit()) return alert("Only manager, accountant or admin can view audit log.");
  try{
    const { data, error } = await supabase.from("audit_logs").select("*").order("created_at", { ascending:false }).limit(200);
    if(error) return alert(error.message);
    const rows = data || [];
    const rowsHtml = rows.map(r => `<tr>
      <td>${esc((localDateFromAnyV97(r.created_at) + " " + String(r.created_at||"").split("T")[1]?.slice(0,5) || ""))}</td>
      <td>${esc(r.user_email||"")}</td>
      <td>${esc(r.role||"")}</td>
      <td>${esc(r.action||"")}</td>
      <td>${esc(r.details||"")}</td>
    </tr>`).join("");
    const w = window.open("", "_blank");
    if(!w){ alert("Please allow pop-ups for reports."); return; }
    w.document.write(`<html><head><title>Audit Log</title><style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#eef3ff}</style>
<style>
/* SAFE UI ONLY - NO JS TOUCH */

body {
  background: #0f0f10;
}

/* cards polish */
.card {
  border-radius: 18px !important;
  border: 1px solid rgba(255,255,255,0.08) !important;
  background: rgba(255,255,255,0.03) !important;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

/* headings */
h2, .section-title {
  font-weight: 900 !important;
  color: #ffffff !important;
}

/* KPI colors */
.green { color: #4cd964 !important; }
.red { color: #ff6b6b !important; }
.blue { color: #6ea8ff !important; }
.yellow { color: #f5c542 !important; }

/* top header spacing */
header, .topbar, .app-header {
  padding: 12px 20px !important;
}

/* small daily inline (visual only placeholder) */
.logo::after {
  content: "  |  LIVE";
  color: #d9b991;
  font-size: 12px;
  margin-left: 10px;
}

</style>



<style id="v84-bubble-size-and-financial-card">
/* V84 UI-only: reduce app bubbles by 20% and polish Project BLU card. Login/auth untouched. */
#app .shell > header.card,
#app .shell > section.panel{
  border-radius: 26px !important;
  padding: 22px !important;
}
#app .shell .card,
#app .shell .panel,
#app .shell .stat,
#app .shell .alert-card,
#app .shell .fs-card,
#app #safeFinancialStatus .card{
  border-radius: 22px !important;
}
#app .shell .stat{
  min-height: 112px !important;
  padding: 19px !important;
}
#app .shell .stat::after{
  width: 56px !important;
  height: 56px !important;
  right: 18px !important;
  top: 18px !important;
}
#app .shell .alert-card{
  min-height: 76px !important;
  padding: 14px !important;
}
#app .shell .stats{
  gap: 17px !important;
  margin-bottom: 19px !important;
}
#app .shell .toolbar{
  gap: 10px !important;
}
#app .shell button,
#app .shell .main-action,
#app .shell .month-btn,
#app .shell select.dark,
#app .shell input.dark{
  border-radius: 15px !important;
}
#app .shell .main-action,
#app .shell button{
  min-height: 42px !important;
  padding: 10px 14px !important;
}
#app .shell .label,
#app .shell .stat .label{
  font-size: 14px !important;
  margin-bottom: 9px !important;
}
#app .shell .value,
#app .shell .stat .value{
  font-size: 22px !important;
}
#app #safeFinancialStatus,
#app .safe-financial-status,
#app #financialStatus,
#app .financial-status,
#app .fs-wrap{
  padding: 24px !important;
  border-radius: 27px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"]{
  gap: 12px !important;
  margin-bottom: 16px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"] > .card{
  padding: 14px !important;
  min-height: 78px !important;
  min-width: 160px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"] .card div{
  font-size: 12px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"] .card b{
  font-size: 19px !important;
}
#app .fs-project-bubble{
  margin-top: 10px !important;
  padding: 18px 20px !important;
  border-radius: 24px !important;
  background:
    radial-gradient(circle at 92% 22%, rgba(227,191,140,.15), transparent 26%),
    linear-gradient(180deg, rgba(255,255,255,.065), rgba(255,255,255,.018)) !important;
  border: 1px solid rgba(227,191,140,.22) !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 12px 30px rgba(0,0,0,.22) !important;
}
#app .fs-project-head{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:12px;
  padding-bottom: 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(255,255,255,.08);
}
#app .fs-project-label{
  color:#c9b18d;
  font-size:12px;
  font-weight:800;
  letter-spacing:.08em;
  text-transform:uppercase;
}
#app .fs-project-bubble h3{
  margin:0 !important;
  font-size:24px !important;
  color:#fff !important;
  line-height:1.05 !important;
}
#app .fs-project-bubble > div:not(.fs-project-head){
  display:flex;
  justify-content:space-between;
  gap:18px;
  align-items:center;
  padding: 5px 0;
  font-size:15px !important;
  color:#d8dce6;
}
#app .fs-project-bubble b{
  font-size:16px !important;
}
@media(max-width:720px){
  #app .shell > header.card,
  #app .shell > section.panel{padding:16px !important;border-radius:23px !important;}
  #app .shell .stats{grid-template-columns:repeat(2,minmax(0,1fr)) !important;gap:11px !important;}
  #app .shell .stat{min-height:94px !important;padding:14px !important;border-radius:19px !important;}
  #app .shell .value,#app .shell .stat .value{font-size:19px !important;}
  #app #safeFinancialStatus,.safe-financial-status,#financialStatus,.financial-status,.fs-wrap{padding:18px !important;border-radius:23px !important;}
  #app #safeFinancialStatus > div[style*="display:flex"] > .card{min-width:130px !important;}
  #app .fs-project-bubble{padding:15px !important;border-radius:20px !important;}
}
</style>





<style id="remove-project-dashboard-v105">
/* V105: fully hide Project dashboard/card block. Login/auth untouched. */
#project-status,
#project-financial-status,
#projectDashboard,
#project-dashboard,
#projectCard,
#project-card,
#projects,
#projects-dashboard,
.project-status,
.project-financial-status,
.project-dashboard,
.project-card,
.project-summary-card,
.project-financial-card,
.projects-card,
.projects-dashboard,
.card.project,
.panel.project,
section.project,
div[data-section="project"],
div[data-card="project"],
div[data-title="PROJECT"],
div[data-title="Project"] {
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
  min-height: 0 !important;
  max-height: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
}

/* Hide the specific legacy block by content structure when present */
.financial-project-card,
.financial-project-panel,
.project-breakdown,
.project-breakdown-card,
.project-kpi-card {
  display: none !important;
}
</style>



<style id="v111-deposit-paid-lock">
/* Deposit status locked as Paid; login/auth untouched. */
.deposit-paid-locked { pointer-events:none; opacity:.75; }
</style>


<style id="v112-deposit-hard-lock">
/* V112: Deposit status is hard-locked to Paid and hidden. Login/auth untouched. */
#entryStatusWrap[style*="display: none"] { display:none !important; }
#entryStatus:disabled { pointer-events:none !important; opacity:.7 !important; }
</style>


<style id="v113-deposit-display">
/* V113: Deposit displayed as separate type, not Order. Login/auth untouched. */
.table-wrap .status-deposit,
.table-wrap .kind-deposit,
.badge.deposit {
  color:#111 !important;
  border-color:rgba(217,185,145,.34) !important;
  background:linear-gradient(145deg, #e4c9a7 0%, #d2ad83 44%, #bb9061 100%) !important;
}
</style>


<style id="v119-cosmetic-buttons">
/* V119 cosmetic buttons only. Login/auth/logic untouched. */

/* Add Deposit: close to Invoice gold, but slightly more copper/rose-gold */
button.add-deposit-btn,
#app button.add-deposit-btn {
  background:
    radial-gradient(circle at 22% 15%, rgba(255,255,255,.34), transparent 24%),
    linear-gradient(135deg, #f2d0a2 0%, #d7a56f 46%, #b9814f 100%) !important;
  color: #121212 !important;
  border: 1px solid rgba(255,222,176,.75) !important;
  font-weight: 900 !important;
  letter-spacing: .01em !important;
  box-shadow:
    0 10px 24px rgba(217,165,111,.22),
    inset 0 1px 0 rgba(255,255,255,.38) !important;
}
button.add-deposit-btn:hover,
#app button.add-deposit-btn:hover {
  filter: brightness(1.08) saturate(1.05) !important;
  transform: translateY(-1px) !important;
}

/* Delete Selected: designed red button with black text */
button.delete-selected-btn,
#app button.delete-selected-btn {
  background:
    radial-gradient(circle at 20% 14%, rgba(255,255,255,.24), transparent 26%),
    linear-gradient(135deg, #ff7373 0%, #e13737 45%, #a90000 100%) !important;
  color: #050505 !important;
  border: 1px solid rgba(255,80,80,.85) !important;
  font-weight: 950 !important;
  letter-spacing: .01em !important;
  text-shadow: none !important;
  box-shadow:
    0 10px 24px rgba(255,0,0,.20),
    inset 0 1px 0 rgba(255,255,255,.30) !important;
}
button.delete-selected-btn:hover,
#app button.delete-selected-btn:hover {
  filter: brightness(1.08) saturate(1.08) !important;
  transform: translateY(-1px) !important;
}
</style>


<style id="v121-header-daily-premium-layout">
/* V121: Premium header / logo / daily spacing only. Login/auth/logic untouched. */

#app .brand {
  align-items: center !important;
  gap: 22px !important;
}

#app .brand-left {
  display: grid !important;
  grid-template-columns: auto 1fr !important;
  align-items: center !important;
  column-gap: 22px !important;
  row-gap: 12px !important;
  width: 100% !important;
}

#app .logo {
  width: 72px !important;
  height: 72px !important;
  min-width: 72px !important;
  border-radius: 22px !important;
  font-size: 34px !important;
  box-shadow:
    0 14px 32px rgba(217,185,145,.22),
    inset 0 1px 0 rgba(255,255,255,.38) !important;
}

#app .logo::after {
  content: "LIVE" !important;
  position: absolute !important;
  right: -12px !important;
  bottom: 10px !important;
  font-size: 11px !important;
  color: rgba(255,255,255,.38) !important;
  letter-spacing: .05em !important;
  margin: 0 !important;
}

#app .title {
  font-size: clamp(34px, 4.2vw, 56px) !important;
  line-height: .95 !important;
  letter-spacing: -.04em !important;
  margin-bottom: 6px !important;
}

#app .brand-subtitle {
  font-size: 18px !important;
  color: #e5c79e !important;
  margin-bottom: 18px !important;
}

#app .daily-header-bar {
  display: grid !important;
  grid-template-columns: minmax(190px, auto) repeat(3, minmax(170px, auto)) !important;
  gap: 14px !important;
  align-items: stretch !important;
  margin: 14px 0 16px !important;
  max-width: 920px !important;
}

#app .daily-chip {
  min-height: 74px !important;
  border-radius: 22px !important;
  padding: 14px 18px !important;
  background:
    radial-gradient(circle at 18% 16%, rgba(255,255,255,.13), transparent 30%),
    linear-gradient(145deg, rgba(255,255,255,.085), rgba(255,255,255,.025)) !important;
  border: 1px solid rgba(217,185,145,.22) !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.075),
    0 12px 28px rgba(0,0,0,.20) !important;
}

#app .daily-chip.daily-title {
  background:
    radial-gradient(circle at 18% 16%, rgba(255,255,255,.22), transparent 30%),
    linear-gradient(135deg, rgba(217,185,145,.32), rgba(86,66,44,.18)) !important;
}

#app .daily-label {
  display: block !important;
  font-size: 13px !important;
  line-height: 1 !important;
  font-weight: 950 !important;
  letter-spacing: .08em !important;
  color: #d9c2a1 !important;
  text-transform: uppercase !important;
  margin-bottom: 9px !important;
  white-space: nowrap !important;
}

#app .daily-value {
  display: block !important;
  font-size: 24px !important;
  line-height: 1.05 !important;
  font-weight: 950 !important;
  color: #ffffff !important;
  letter-spacing: -.02em !important;
  white-space: nowrap !important;
}

#app .userbar {
  margin-top: 10px !important;
  display: flex !important;
  gap: 12px !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  font-size: 22px !important;
}

#app .role-badge {
  padding: 7px 18px !important;
  border-radius: 999px !important;
  font-size: 17px !important;
  font-weight: 950 !important;
}

#app header.card {
  padding-top: 30px !important;
  padding-bottom: 28px !important;
}

#app header.card .toolbar {
  margin-top: 26px !important;
}

/* Tablet / laptop narrow */
@media (max-width: 1050px) {
  #app .daily-header-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    max-width: 760px !important;
  }
}

/* Mobile */
@media (max-width: 720px) {
  #app .brand-left {
    grid-template-columns: 1fr !important;
    justify-items: center !important;
    text-align: center !important;
    gap: 14px !important;
  }

  #app .logo {
    width: 64px !important;
    height: 64px !important;
    min-width: 64px !important;
    font-size: 30px !important;
  }

  #app .title {
    font-size: 38px !important;
  }

  #app .brand-subtitle {
    font-size: 15px !important;
    margin-bottom: 14px !important;
  }

  #app .daily-header-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 10px !important;
    margin: 12px auto 14px !important;
    width: 100% !important;
  }

  #app .daily-chip {
    min-height: 66px !important;
    padding: 12px 14px !important;
    border-radius: 18px !important;
  }

  #app .daily-label {
    font-size: 11px !important;
    margin-bottom: 7px !important;
  }

  #app .daily-value {
    font-size: 19px !important;
  }

  #app .userbar {
    justify-content: center !important;
    font-size: 17px !important;
  }
}
</style>


<style id="v122-header-scale-50">
/* Reduce header elements to ~50% without changing layout */

#app .logo {
  width: 48px !important;
  height: 48px !important;
  min-width: 48px !important;
  font-size: 22px !important;
}

#app .title {
  font-size: 28px !important;
}

#app .brand-subtitle {
  font-size: 13px !important;
  margin-bottom: 8px !important;
}

#app .daily-chip {
  min-height: 44px !important;
  padding: 8px 12px !important;
  border-radius: 14px !important;
}

#app .daily-label {
  font-size: 10px !important;
  margin-bottom: 4px !important;
}

#app .daily-value {
  font-size: 15px !important;
}

#app .daily-header-bar {
  gap: 8px !important;
  margin: 6px 0 8px !important;
}

#app .userbar {
  font-size: 14px !important;
}

#app .role-badge {
  font-size: 12px !important;
  padding: 4px 10px !important;
}

#app header.card {
  padding-top: 14px !important;
  padding-bottom: 12px !important;
}
</style>


<style id="v127-button-colors">
/* Gold buttons like Order */
button[onclick*="convertOrderToDN"],
button[onclick*="convertOrderToInvoice"] {
  background: linear-gradient(135deg, #f2d3a0, #d4a65a) !important;
  color: #000 !important;
  font-weight: 700;
  border: 1px solid rgba(255,215,150,0.6);
  box-shadow: 0 6px 16px rgba(212,166,90,0.25);
}

button[onclick*="convertOrderToDN"]:hover,
button[onclick*="convertOrderToInvoice"]:hover {
  filter: brightness(1.05);
}

/* Softer red for delete */
button.delete-selected-btn {
  background: linear-gradient(135deg, #e06666, #a83232) !important;
  color: #000 !important;
  border: 1px solid rgba(200,80,80,0.6);
  box-shadow: 0 4px 12px rgba(160,50,50,0.25);
}

button.delete-selected-btn:hover {
  filter: brightness(1.05);
}
</style>


<style id="v128-gold-match-animation">
/* Match exact system gold (same tone as Order badge) */
button[onclick*="convertOrderToDN"],
button[onclick*="convertOrderToInvoice"] {
  background: linear-gradient(145deg, #e4c9a7 0%, #d2ad83 44%, #bb9061 100%) !important;
  color: #000 !important;
  border: 1px solid rgba(217,185,145,.45) !important;
  font-weight: 800;
  box-shadow:
    0 6px 18px rgba(187,144,97,.25),
    inset 0 1px 0 rgba(255,255,255,.35);
  transition: all 0.18s ease;
}

/* Hover glow animation (keyboard + mouse focus) */
button[onclick*="convertOrderToDN"]:hover,
button[onclick*="convertOrderToInvoice"]:hover,
button[onclick*="convertOrderToDN"]:focus,
button[onclick*="convertOrderToInvoice"]:focus {
  filter: brightness(1.12);
  box-shadow:
    0 0 0 2px rgba(217,185,145,.35),
    0 8px 22px rgba(187,144,97,.35),
    inset 0 1px 0 rgba(255,255,255,.45);
  transform: translateY(-1px);
}

/* Softer delete (keep elegant) */
button.delete-selected-btn {
  background: linear-gradient(145deg, #d97a7a 0%, #b84a4a 50%, #7a1f1f 100%) !important;
  color: #000 !important;
  border: 1px solid rgba(200,120,120,.5);
  transition: all 0.18s ease;
}

button.delete-selected-btn:hover,
button.delete-selected-btn:focus {
  filter: brightness(1.08);
  box-shadow:
    0 0 0 2px rgba(200,100,100,.25),
    0 8px 20px rgba(120,30,30,.3);
  transform: translateY(-1px);
}
</style>


<style id="v129-global-button-ux">
button {
  transition: all 0.15s ease;
  position: relative;
}

button:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
}

button:focus {
  outline: none;
  box-shadow:
    0 0 0 2px rgba(217,185,145,.35),
    0 6px 16px rgba(0,0,0,.25);
}

button:active {
  transform: translateY(1px) scale(0.97);
  box-shadow:
    inset 0 3px 8px rgba(0,0,0,.35);
}

button::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.2s ease;
  background: radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 60%);
}

button:active::after {
  opacity: 1;
}
</style>


<meta name="theme-color" content="#080808">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Vardophase">


<style id="v131-iphone-css-only-login-safe">
/* V131 iPhone CSS-only. No JS, no service worker, login/auth untouched. */

html, body {
  -webkit-text-size-adjust: 100%;
}

button,
select,
input,
textarea,
.month-btn,
.nav-pill {
  min-height: 44px;
  touch-action: manipulation;
}

@media (max-width: 820px) {
  body {
    padding: 8px !important;
  }

  #app .shell {
    padding: 8px 8px calc(80px + env(safe-area-inset-bottom)) !important;
    max-width: 100% !important;
  }

  #app header.card,
  #app section.panel,
  #app .card,
  #app .panel {
    border-radius: 20px !important;
  }

  #app header.card {
    padding: 12px !important;
  }

  #app .brand-left {
    display: grid !important;
    grid-template-columns: auto 1fr !important;
    gap: 10px !important;
    text-align: left !important;
    align-items: center !important;
  }

  #app .logo {
    width: 44px !important;
    height: 44px !important;
    min-width: 44px !important;
    border-radius: 14px !important;
    font-size: 20px !important;
  }

  #app .title {
    font-size: 24px !important;
    line-height: 1 !important;
    margin: 0 !important;
  }

  #app .brand-subtitle {
    font-size: 12px !important;
    margin: 3px 0 8px !important;
  }

  #app .daily-header-bar {
    grid-column: 1 / -1 !important;
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
    margin: 8px 0 6px !important;
    width: 100% !important;
    max-width: none !important;
  }

  #app .daily-chip {
    min-height: 54px !important;
    padding: 9px 10px !important;
    border-radius: 16px !important;
  }

  #app .daily-label {
    font-size: 10px !important;
    margin-bottom: 5px !important;
  }

  #app .daily-value {
    font-size: 16px !important;
    white-space: nowrap !important;
  }

  #app .userbar {
    grid-column: 1 / -1 !important;
    font-size: 12px !important;
    gap: 6px !important;
    margin-top: 6px !important;
  }

  #app header.card .toolbar {
    display: flex !important;
    overflow-x: auto !important;
    gap: 8px !important;
    padding: 4px 2px 8px !important;
    margin-top: 10px !important;
    -webkit-overflow-scrolling: touch;
  }

  #app header.card .toolbar button {
    flex: 0 0 auto !important;
    min-width: 122px !important;
    padding: 10px 12px !important;
    border-radius: 14px !important;
    font-size: 13px !important;
  }

  #app .filters {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 8px !important;
  }

  #app .filters input,
  #app .filters select,
  #app .filters button {
    width: 100% !important;
    font-size: 16px !important;
  }

  #app .month-tools {
    display: flex !important;
    overflow-x: auto !important;
    gap: 7px !important;
    padding-bottom: 6px !important;
    -webkit-overflow-scrolling: touch;
  }

  #app .month-btn {
    flex: 0 0 auto !important;
    min-width: 58px !important;
  }

  #safeFinancialStatus > div[style*="display:flex"],
  .safe-financial-status > div[style*="display:flex"],
  #app .stats,
  #app .alert-strip {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
  }

  #safeFinancialStatus .card,
  .safe-financial-status .card,
  #app .stat,
  #app .alert-card {
    min-height: 76px !important;
    padding: 11px !important;
    border-radius: 16px !important;
  }

  #app section.panel .toolbar {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
  }

  #app section.panel .toolbar button {
    width: 100% !important;
    min-height: 48px !important;
    border-radius: 15px !important;
    font-size: 13px !important;
    padding: 10px 8px !important;
  }

  #app .table-wrap {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    border-radius: 18px !important;
    max-width: 100% !important;
  }

  #app table {
    min-width: 1180px !important;
    font-size: 12px !important;
  }

  #app th,
  #app td {
    padding: 9px 8px !important;
    white-space: nowrap !important;
  }

  #app .modal-box,
  .modal-box {
    width: 100% !important;
    max-width: 100% !important;
    max-height: 92vh !important;
    overflow-y: auto !important;
    border-radius: 22px !important;
    padding: 14px !important;
  }

  #app .form-grid {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 10px !important;
  }

  #app input.dark,
  #app select.dark,
  #app textarea.dark {
    font-size: 16px !important;
    min-height: 46px !important;
  }
}
</style>


<style id="v133-iphone-refine-only">
/* V133: based on V131. Only fixes Change Password / Logout and table scrolling. Login untouched. */

@media (max-width: 820px) {
  /* Put Change Password + Logout in a clean row instead of floating/cutting */
  #app .brand > div[style*="justify-content:flex-end"] {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
    width: 100% !important;
    margin-top: 10px !important;
  }

  #app .brand > div[style*="justify-content:flex-end"] button {
    width: 100% !important;
    min-height: 44px !important;
    border-radius: 15px !important;
    font-size: 13px !important;
    padding: 9px 10px !important;
  }

  #app .brand > div[style*="justify-content:flex-end"] button.red {
    color: #ff8b8b !important;
  }

  /* Keep header compact like V131, not huge like V132 */
  #app header.card .toolbar {
    display: flex !important;
    overflow-x: auto !important;
    gap: 8px !important;
    padding: 4px 2px 8px !important;
    margin-top: 10px !important;
    -webkit-overflow-scrolling: touch !important;
    scroll-behavior: auto !important;
  }

  #app header.card .toolbar button {
    flex: 0 0 auto !important;
    min-width: 122px !important;
  }

  /* Faster, smoother horizontal table scrolling */
  #app .table-wrap {
    overflow-x: scroll !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
    scroll-behavior: auto !important;
    overscroll-behavior-x: contain !important;
    touch-action: pan-x pan-y !important;
  }

  #app .table-wrap table {
    min-width: 1320px !important;
  }

  /* Make row touch/drag feel less heavy */
  #app .table-wrap th,
  #app .table-wrap td {
    padding: 8px 7px !important;
  }

  #app .table-wrap tbody tr {
    contain: layout paint !important;
  }
}
</style>


<style id="v134-report-mobile-dark-fix">
/* V134 report readability + mobile return fix. Login untouched. */

/* If a generated report opens in same app window, force readable report styling */
body:has(h1):has(table) {
  background: #ffffff !important;
  color: #111111 !important;
}

body:has(h1):has(table) h1,
body:has(h1):has(table) h2,
body:has(h1):has(table) div,
body:has(h1):has(table) span,
body:has(h1):has(table) td,
body:has(h1):has(table) th {
  color: #111111 !important;
}

body:has(h1):has(table) table {
  background: #ffffff !important;
  color: #111111 !important;
}

body:has(h1):has(table) th {
  background: #edf2ff !important;
  color: #111111 !important;
}

body:has(h1):has(table) td {
  background: #ffffff !important;
  color: #111111 !important;
}

@media (max-width: 820px) {
  body:has(h1):has(table) {
    padding: 12px !important;
    overflow-x: auto !important;
  }
  body:has(h1):has(table) table {
    min-width: 980px !important;
  }
}
</style>


<style id="v136-selection-fix-css">
/* V136 selection UX. Login/auth untouched. */
tr.selected {
  background: rgba(217,185,145,.16) !important;
  box-shadow: inset 4px 0 0 rgba(217,185,145,.75) !important;
}
.row-check,
.premium-check {
  width: 22px !important;
  height: 22px !important;
  accent-color: #d2ad83 !important;
  cursor: pointer !important;
}
td:has(.row-check),
td:has(.premium-check) {
  cursor: pointer !important;
}
</style>


<style id="v148-inline-reports-safe-css">
#inlineReportModal.modal.show{
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  padding:18px!important;
  z-index:99999!important;
}
.inline-report-box{
  width:min(1180px,96vw)!important;
  max-height:92vh!important;
  display:flex!important;
  flex-direction:column!important;
  overflow:hidden!important;
}
.inline-report-toolbar{
  display:flex!important;
  justify-content:space-between!important;
  align-items:center!important;
  gap:10px!important;
  padding:12px 14px!important;
  border-bottom:1px solid rgba(217,185,145,.18)!important;
}
.inline-report-actions{display:flex!important;gap:8px!important;}
#inlineReportFrame{
  width:100%!important;
  height:76vh!important;
  border:0!important;
  background:#fff!important;
  border-radius:0 0 18px 18px!important;
}
@media(max-width:820px){
  #inlineReportModal.modal.show{padding:0!important;align-items:stretch!important;}
  .inline-report-box{width:100vw!important;max-width:100vw!important;height:100vh!important;max-height:100vh!important;border-radius:0!important;}
  .inline-report-toolbar{padding:10px!important;flex-wrap:wrap!important;}
  .inline-report-actions{width:100%!important;display:grid!important;grid-template-columns:1fr 1fr!important;}
  .inline-report-actions button{width:100%!important;min-height:44px!important;}
  #inlineReportFrame{height:calc(100vh - 112px)!important;border-radius:0!important;}
}
</style>


<style id="v168-dn-approver-css">
/* V168 DN Approver limited role - no login changes */

/* Hide financial cells/columns from the table */
body.role-dn-approver table th:nth-child(8),
body.role-dn-approver table td:nth-child(8),
body.role-dn-approver table th:nth-child(9),
body.role-dn-approver table td:nth-child(9),
body.role-dn-approver table th:nth-child(14),
body.role-dn-approver table td:nth-child(14),
body.role-dn-approver table th:nth-child(15),
body.role-dn-approver table td:nth-child(15),
body.role-dn-approver table th:nth-child(16),
body.role-dn-approver table td:nth-child(16),
body.role-dn-approver table th:nth-child(17),
body.role-dn-approver table td:nth-child(17),
body.role-dn-approver table th:nth-child(18),
body.role-dn-approver table td:nth-child(18),
body.role-dn-approver table th:nth-child(19),
body.role-dn-approver table td:nth-child(19) {
  display: none !important;
}

/* Hide money/cards/status financial overview */
body.role-dn-approver .stat,
body.role-dn-approver .stats,
body.role-dn-approver .alert-strip,
body.role-dn-approver #safeFinancialStatus,
body.role-dn-approver .safe-financial-status,
body.role-dn-approver .financial-status,
body.role-dn-approver .credit-statement {
  display: none !important;
}

/* Hide all action/report/admin buttons except Convert Order -> DN and filters/search */
body.role-dn-approver button[onclick*="Invoice"],
body.role-dn-approver button[onclick*="invoice"],
body.role-dn-approver button[onclick*="Deposit"],
body.role-dn-approver button[onclick*="deposit"],
body.role-dn-approver button[onclick*="Report"],
body.role-dn-approver button[onclick*="report"],
body.role-dn-approver button[onclick*="Audit"],
body.role-dn-approver button[onclick*="Roles"],
body.role-dn-approver button[onclick*="Settings"],
body.role-dn-approver button[onclick*="bulkDelete"],
body.role-dn-approver button[onclick*="duplicate"],
body.role-dn-approver button[onclick*="bulkMarkPaid"],
body.role-dn-approver button[onclick*="markSelected"],
body.role-dn-approver button[onclick*="openEntryModal"],
body.role-dn-approver button[onclick*="openDepositModal"] {
  display: none !important;
}

body.role-dn-approver button[onclick*="convertOrderToDN"] {
  display: inline-flex !important;
  visibility: visible !important;
}

/* Keep filters/search visible */
body.role-dn-approver .filters,
body.role-dn-approver .filters *,
body.role-dn-approver .month-tools,
body.role-dn-approver .month-tools * {
  display: revert !important;
}

/* Hide selected financial summary text */
body.role-dn-approver .money-gold,
body.role-dn-approver .money-red,
body.role-dn-approver .money-blue,
body.role-dn-approver .money-green,
body.role-dn-approver .money-amber {
  display: none !important;
}
</style>


<style id="v169-dn-approver-dropdown-label">
/* V169: role dropdown includes DN Approver. Login untouched. */
</style>

</head><body><button class="report-back-btn" onclick="if(window.opener){window.close()}else{history.back()}">← Back to Dashboard</button><h1>Audit Log</h1><div class="audit-badge">Showing last 200 actions</div><div class="report-table-wrap"><table><thead><tr><th>Date</th><th>User</th><th>Role</th><th>Action</th><th>Details</th></tr></thead><tbody>${rowsHtml}</tbody></table>




</body></html>`);
    w.document.close();
  }catch(e){
    alert("Could not load audit log.");
  }
};

window.openRolesModal = function(){
  if(!canManageRoles()) return alert("Only admin can manage user roles.");
  document.getElementById("rolesModal")?.classList.add("show");
  const st = document.getElementById("rolesStatus");
  if(st){ st.textContent = ""; st.className = "status"; }
};
window.closeRolesModal = function(){
  document.getElementById("rolesModal")?.classList.remove("show");
};
window.saveUserRole = async function(){
  if(!canManageRoles()) return alert("Only admin can manage roles.");
  const email = (document.getElementById("roleEmailInput")?.value || "").trim().toLowerCase();
  const role = (document.getElementById("roleValueInput")?.value || "user").trim().toLowerCase();
  const st = document.getElementById("rolesStatus");
  if(!email){
    st.className = "status error";
    st.textContent = "Enter email.";
    return;
  }
  const { error } = await supabase.from("user_roles").upsert([{ email, role }], { onConflict: "email" });
  if(error){
    st.className = "status error";
    st.textContent = error.message;
    return;
  }
  await logAudit("save_user_role", `${email} -> ${role}`);
  st.className = "status ok";
  st.textContent = "Role saved.";
};

window.openPasswordModal = function(){
  document.getElementById("passwordModal")?.classList.add("show");
  const s = document.getElementById("passwordStatus");
  if(s){ s.textContent = ""; s.className = "status"; }
};
window.closePasswordModal = function(){
  document.getElementById("passwordModal")?.classList.remove("show");
};
window.changePassword = async function(){
  const p1 = (document.getElementById("newPassword")?.value || "").trim();
  const p2 = (document.getElementById("confirmPassword")?.value || "").trim();
  const status = document.getElementById("passwordStatus");
  if(!p1 || p1.length < 6){
    status.className = "status error";
    status.textContent = "Password must be at least 6 characters.";
    return;
  }
  if(p1 !== p2){
    status.className = "status error";
    status.textContent = "Passwords do not match.";
    return;
  }
  const { error } = await supabase.auth.updateUser({ password: p1 });
  if(error){
    status.className = "status error";
    status.textContent = error.message;
    return;
  }
  status.className = "status ok";
  status.textContent = "Password updated successfully.";
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmPassword").value = "";
};


window.resetPasswordByEmail = async function(){
  const email = (document.getElementById("email")?.value || "").trim();
  if(!email){
    setLoginStatus("Enter your email first.", "error");
    return;
  }
  const redirectTo = window.location.origin + window.location.pathname;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if(error){
    setLoginStatus(error.message, "error");
    return;
  }
  setLoginStatus("Password reset email sent. Check your inbox.", "ok");
};

document.getElementById("loginBtn")?.addEventListener("click", window.safeLoginClick);
document.getElementById("forgotBtn")?.addEventListener("click", window.resetPasswordByEmail);
document.getElementById("password")?.addEventListener("keydown", e => { if(e.key==="Enter") window.safeLoginClick(); });
document.getElementById("email")?.addEventListener("keydown", e => { if(e.key==="Enter") window.safeLoginClick(); });

let sessionData = null;
try{
  ({ data: sessionData } = await supabase.auth.getSession());
}catch(e){
  setLoginStatus("Session check failed. Please login.", "error");
}
if(sessionData?.session?.user){
  currentUser = sessionData.session.user;
  currentRole = await fetchUserRole(currentUser?.email || "");
  showApp();
  await render();
  setupRealtime();
}

// V95: keep Daily header aligned with local date; refresh once when the day changes.
let __dailyHeaderLastDate = localTodayKeyV93();
setInterval(async () => {
  const nowKey = localTodayKeyV93();
  if(currentUser && nowKey !== __dailyHeaderLastDate){
    __dailyHeaderLastDate = nowKey;
    try { await render(); } catch(e) { console.warn("Daily header date refresh skipped", e); }
  }
}, 60000);

/* === V87.22 Delivery Note robust integration === */
window.prepareDeliveryNoteMode = function(){
  const mode = document.getElementById("entryMode");
  if(mode) mode.value = "delivery_note";

  const title = document.getElementById("entryModalTitle");
  if(title) title.textContent = "New Entry / Delivery Note";

  const sub = document.getElementById("entryModalSub");
  if(sub) sub.textContent = "Delivery Note is the middle step between Order and Invoice.";

  const orderWrap = document.getElementById("entryOrderWrap");
  const invoiceWrap = document.getElementById("entryInvoiceWrap");
  if(orderWrap) orderWrap.classList.remove("field-hidden");
  if(invoiceWrap) invoiceWrap.classList.remove("field-hidden");

  const orderLabel = document.getElementById("entryOrderLabel") || document.querySelector("#entryOrderWrap span");
  const invoiceLabel = document.getElementById("entryInvoiceLabel") || document.querySelector("#entryInvoiceWrap span");
  if(orderLabel) orderLabel.textContent = "Order No";
  if(invoiceLabel) invoiceLabel.textContent = "Delivery Note No";

  const invoiceInput = document.getElementById("entryInvoiceNo");
  if(invoiceInput){
    invoiceInput.placeholder = "DN-001";
    invoiceInput.value = "";
  }

  const status = document.getElementById("entryStatus");
  if(status) status.value = "Pending";

  const type = document.getElementById("entryType");
  if(type) type.value = "invoice";
};

window.openDeliveryNoteModal = async function(){
  if(typeof window.openEntryModal === "function"){
    await window.openEntryModal(null, "invoice");
    window.prepareDeliveryNoteMode();
  }
};

window.injectDeliveryNoteButton = function(){
  if(document.getElementById("deliveryNoteMainAction")) return;

  const buttons = Array.from(document.querySelectorAll("button"));
  const orderBtn = buttons.find(b => (b.textContent || "").trim() === "Order");
  const invoiceBtn = buttons.find(b => (b.textContent || "").trim() === "Invoice");

  if(!orderBtn && !invoiceBtn) return;

  const btn = document.createElement("button");
  btn.id = "deliveryNoteMainAction";
  btn.type = "button";
  btn.className = (orderBtn && orderBtn.className) ? orderBtn.className : "primary main-action";
  btn.textContent = "Delivery Note";
  btn.onclick = function(e){
    e.preventDefault();
    e.stopPropagation();
    window.openDeliveryNoteModal();
  };

  if(invoiceBtn && invoiceBtn.parentNode){
    invoiceBtn.parentNode.insertBefore(btn, invoiceBtn);
  } else if(orderBtn && orderBtn.parentNode){
    orderBtn.parentNode.insertBefore(btn, orderBtn.nextSibling);
  }
};

setInterval(window.injectDeliveryNoteButton, 600);
document.addEventListener("click", function(){
  setTimeout(window.injectDeliveryNoteButton, 100);
});


/* === V87.24 Delivery Note auto-fill from Order No === */
window.__deliveryAutoFillTimer = null;

window.setEntryFieldValue = function(id, value){
  const el = document.getElementById(id);
  if(!el) return;
  el.value = value ?? "";
  el.dispatchEvent(new Event("input", { bubbles:true }));
  el.dispatchEvent(new Event("change", { bubbles:true }));
  if(typeof el._customRefresh === "function") el._customRefresh();
};

window.isDeliveryNoteMode = function(){
  return (document.getElementById("entryMode")?.value || "") === "delivery_note";
};

window.autofillDeliveryFromOrder = async function(){
  if(!window.isDeliveryNoteMode()) return;

  const orderNo = (document.getElementById("entryOrderNo")?.value || "").trim();
  if(!orderNo) return;

  const msg = document.getElementById("entryStatusMsg");
  if(msg){
    msg.className = "status";
    msg.textContent = "Searching order details...";
  }

  try{
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("order_no", orderNo)
      .neq("entry_type", "delivery_note")
      .limit(10);

    if(error) throw error;

    const order = (data || []).find(r => {
      const type = String(r.entry_type || "").toLowerCase();
      const invoiceNo = String(r.invoice_no || "").trim();
      return type === "order" || (!invoiceNo && String(r.order_no || "").trim() === orderNo);
    }) || (data || [])[0];

    if(!order){
      if(msg){
        msg.className = "status error";
        msg.textContent = "Order not found. Delivery Note must be linked to an existing Order.";
      }
      return;
    }

    window.setEntryFieldValue("entrySupplier", order.supplier || "");
    window.setEntryFieldValue("entryProject", order.project || "");
    window.setEntryFieldValue("entryDescription", order.description || "");
    window.setEntryFieldValue("entryDescriptionSelect", order.description || "");
    window.setEntryFieldValue("entryNetAmount", order.net_amount || "");
    window.setEntryFieldValue("entryVatAmount", order.vat_amount || "");
    window.setEntryFieldValue("entryTotal", order.total || order.amount || "");
    window.setEntryFieldValue("entryStatus", "Pending");

    const notes = document.getElementById("entryNotes");
    if(notes && !notes.value){
      notes.value = "Auto-filled from Order " + orderNo + ". Edit delivery details as needed.";
    }

    if(typeof window.handleSupplierVatTypeChange === "function") window.handleSupplierVatTypeChange();
    if(typeof window.recalcFromTotal === "function" && document.getElementById("entryTotal")?.value) window.recalcFromTotal();
    if(typeof refreshCustomSelects === "function") refreshCustomSelects(document);

    if(msg){
      msg.className = "status ok";
      msg.textContent = "Order details loaded. Now enter Delivery Note No and edit if needed.";
    }
  }catch(err){
    if(msg){
      msg.className = "status error";
      msg.textContent = err?.message || "Could not load order details.";
    }
  }
};

window.bindDeliveryOrderAutoFill = function(){
  const orderInput = document.getElementById("entryOrderNo");
  if(!orderInput || orderInput.dataset.deliveryAutoFillBound === "1") return;
  orderInput.dataset.deliveryAutoFillBound = "1";

  orderInput.addEventListener("input", function(){
    if(!window.isDeliveryNoteMode()) return;
    clearTimeout(window.__deliveryAutoFillTimer);
    window.__deliveryAutoFillTimer = setTimeout(window.autofillDeliveryFromOrder, 650);
  });

  orderInput.addEventListener("change", function(){
    if(window.isDeliveryNoteMode()) window.autofillDeliveryFromOrder();
  });

  orderInput.addEventListener("blur", function(){
    if(window.isDeliveryNoteMode()) window.autofillDeliveryFromOrder();
  });
};

const __oldPrepareDeliveryNoteMode = window.prepareDeliveryNoteMode;
window.prepareDeliveryNoteMode = function(){
  if(typeof __oldPrepareDeliveryNoteMode === "function"){
    __oldPrepareDeliveryNoteMode();
  }
  window.bindDeliveryOrderAutoFill();
  const msg = document.getElementById("entryStatusMsg");
  if(msg){
    msg.className = "status ok";
    msg.textContent = "Enter Order No. The system will auto-fill supplier, project, description and amount from the order.";
  }
};

setInterval(function(){
  if(window.isDeliveryNoteMode()) window.bindDeliveryOrderAutoFill();
}, 800);


/* === V87.26 Safe Delivery Note Save Validation === */
window.orderExistsInDb = async function(orderNo){
  if(!orderNo) return false;
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, order_no, entry_type, invoice_no")
    .eq("order_no", orderNo)
    .limit(20);

  if(error) throw error;

  return (data || []).some(r => {
    const type = String(r.entry_type || "").toLowerCase();
    const invoiceNo = String(r.invoice_no || "").trim();
    return type === "order" || (!invoiceNo && String(r.order_no || "").trim() === orderNo);
  });
};

window.validateDeliveryNoteBeforeSave = async function(){
  const mode = document.getElementById("entryMode")?.value || "";
  if(mode !== "delivery_note") return true;

  const orderNo = (document.getElementById("entryOrderNo")?.value || "").trim();
  if(!orderNo){
    alert("Order No is required for Delivery Note");
    return false;
  }

  try{
    const exists = await window.orderExistsInDb(orderNo);
    if(!exists){
      alert("Order not found. Cannot create Delivery Note");
      return false;
    }
    return true;
  }catch(err){
    alert(err?.message || "Could not verify Order No");
    return false;
  }
};

if(typeof window.saveEntry === "function" && !window.__deliverySaveWrapped){
  window.__deliverySaveWrapped = true;
  const __originalSaveEntry = window.saveEntry;
  window.saveEntry = async function(){
    const ok = await window.validateDeliveryNoteBeforeSave();
    if(!ok) return;
    return __originalSaveEntry.apply(this, arguments);
  };
}


/* === V87.28 SINGLE ROW ORDER → DN → INVOICE FLOW === */
window.findExistingOrderRow = async function(orderNo){
  if(!orderNo) return null;
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("order_no", orderNo)
    .limit(50);

  if(error) throw error;

  return (data || []).find(r => {
    const type = String(r.entry_type || "").toLowerCase();
    const invoiceNo = String(r.invoice_no || "").trim();
    // The main Order row is either entry_type order OR an old order with no invoice number.
    // It must not be a standalone delivery_note row.
    return type === "order" || (!invoiceNo && type !== "delivery_note" && String(r.order_no || "").trim() === orderNo);
  }) || null;
};

window.updateOrderRowWithDeliveryNote = async function(){
  const orderNo = (document.getElementById("entryOrderNo")?.value || "").trim();
  const deliveryNo = (document.getElementById("entryInvoiceNo")?.value || "").trim();

  if(!orderNo){
    alert("Order No is required for Delivery Note");
    return true;
  }
  if(!deliveryNo){
    alert("Delivery Note No is required");
    return true;
  }

  let order = null;
  try{
    order = await window.findExistingOrderRow(orderNo);
  }catch(err){
    alert(err?.message || "Could not check Order No");
    return true;
  }

  if(!order){
    alert("Order not found. Cannot create Delivery Note");
    return true;
  }

  const payload = {
    // keep it as the original order row; do NOT convert entry_type and do NOT use invoice_no for DN
    entry_type: "order",
    status: "Partial",
    notes: upsertDeliveryNoteTag(order.notes || "", deliveryNo)
  };

  const { error } = await supabase.from("suppliers").update(payload).eq("id", order.id);
  if(error){
    alert(error.message);
    return true;
  }

  alert("Delivery Note saved on the existing Order row.");
  document.getElementById("entryModal")?.classList.remove("show");
  if(typeof render === "function") await render();
  return true; // stop normal insert
};

window.updateOrderRowWithInvoice = async function(){
  const mode = document.getElementById("entryMode")?.value || "";
  if(mode !== "invoice") return false;

  const orderNo = (document.getElementById("entryOrderNo")?.value || "").trim();
  const invoiceNo = (document.getElementById("entryInvoiceNo")?.value || "").trim();

  // If no order number, leave direct invoice behavior unchanged.
  if(!orderNo || !invoiceNo) return false;

  let order = null;
  try{
    order = await window.findExistingOrderRow(orderNo);
  }catch(err){
    // Do not block direct invoice behavior if lookup fails.
    return false;
  }

  if(!order) return false;

  const payload = {
    invoice_no: invoiceNo,
    status: "Closed",
    entry_type: "order"
  };

  // Also update editable fields if the user changed them in invoice window
  const supplier = (document.getElementById("entrySupplier")?.value || "").trim();
  const project = (document.getElementById("entryProject")?.value || "").trim();
  const description = (document.getElementById("entryDescription")?.value || document.getElementById("entryDescriptionSelect")?.value || "").trim();
  const net = document.getElementById("entryNetAmount")?.value;
  const vat = document.getElementById("entryVatAmount")?.value;
  const total = document.getElementById("entryTotal")?.value;
  const notes = document.getElementById("entryNotes")?.value;

  if(supplier) payload.supplier = supplier;
  if(project) payload.project = project;
  if(description) payload.description = description;
  if(net !== undefined && net !== "") payload.net_amount = Number(net);
  if(vat !== undefined && vat !== "") payload.vat_amount = Number(vat);
  if(total !== undefined && total !== "") {
    payload.total = Number(total);
    payload.amount = Number(total);
  }
  if(notes !== undefined && String(notes).trim()){
    const dn = extractDeliveryNoteNo(order);
    payload.notes = dn ? upsertDeliveryNoteTag(notes, dn) : notes;
  }

  const { error } = await supabase.from("suppliers").update(payload).eq("id", order.id);
  if(error){
    alert(error.message);
    return true;
  }

  alert("Invoice saved on the existing Order row.");
  document.getElementById("entryModal")?.classList.remove("show");
  if(typeof render === "function") await render();
  return true; // stop normal insert
};

if(typeof window.saveEntry === "function" && !window.__singleRowFlowWrapped){
  window.__singleRowFlowWrapped = true;
  const __singleRowOriginalSave = window.saveEntry;
  window.saveEntry = async function(){
    const mode = document.getElementById("entryMode")?.value || "";

    if(mode === "delivery_note"){
      const handledDN = await window.updateOrderRowWithDeliveryNote();
      if(handledDN) return;
    }

    if(mode === "invoice"){
      const handledInv = await window.updateOrderRowWithInvoice();
      if(handledInv) return;
    }

    return __singleRowOriginalSave.apply(this, arguments);
  };
}


/* === V87.29 DN delete + Invoice auto-fill from Order === */
window.clearDeliveryNoteFromSelected = async function(){
  if(!canAdmin()) return alert("Only admin can delete Delivery Note.");
  if(selectedIds.length !== 1) return alert("Select one Order row with Delivery Note.");

  const id = selectedIds[0];
  const { data, error } = await supabase.from("suppliers").select("*").eq("id", id).single();
  if(error || !data) return alert(error?.message || "Row not found.");

  const dn = extractDeliveryNoteNo(data);
  if(!dn) return alert("No Delivery Note found on this row.");

  if(!confirm("Delete Delivery Note " + dn + " from this Order?")) return;

  const cleanNotes = stripDeliveryNoteTags(data.notes || "");
  const payload = {
    notes: cleanNotes,
    status: data.invoice_no ? "Closed" : "Unpaid",
    entry_type: "order"
  };

  const { error: updError } = await supabase.from("suppliers").update(payload).eq("id", id);
  if(updError) return alert(updError.message);

  selectedIds = [];
  await logAudit("delete_delivery_note", `order=${data.order_no || ""}, dn=${dn}`);
  await render();
};

window.autofillInvoiceFromOrder = async function(){
  const mode = document.getElementById("entryMode")?.value || "";
  if(mode !== "invoice") return;

  const orderNo = (document.getElementById("entryOrderNo")?.value || "").trim();
  if(!orderNo) return;

  const msg = document.getElementById("entryStatusMsg");
  if(msg){
    msg.className = "status";
    msg.textContent = "Searching order details...";
  }

  try{
    const order = await window.findExistingOrderRow(orderNo);
    if(!order){
      if(msg){
        msg.className = "status error";
        msg.textContent = "Order not found.";
      }
      return;
    }

    const dn = extractDeliveryNoteNo(order);

    window.setEntryFieldValue("entrySupplier", order.supplier || "");
    window.setEntryFieldValue("entryProject", order.project || "");
    window.setEntryFieldValue("entryDescription", order.description || "");
    window.setEntryFieldValue("entryDescriptionSelect", order.description || "");
    window.setEntryFieldValue("entryNetAmount", order.net_amount || "");
    window.setEntryFieldValue("entryVatAmount", order.vat_amount || "");
    window.setEntryFieldValue("entryTotal", order.total || order.amount || "");
    window.setEntryFieldValue("entryStatus", "Unpaid");

    const notes = document.getElementById("entryNotes");
    if(notes && !notes.value){
      notes.value = (dn ? "Linked Delivery Note: " + dn + "\\n" : "") + "Auto-filled from Order " + orderNo + ". Edit invoice details as needed.";
    }

    let dnInfo = document.getElementById("invoiceDnInfo");
    const invoiceWrap = document.getElementById("entryInvoiceWrap");
    if(!dnInfo && invoiceWrap){
      dnInfo = document.createElement("div");
      dnInfo.id = "invoiceDnInfo";
      dnInfo.className = "status ok";
      dnInfo.style.marginTop = "8px";
      invoiceWrap.appendChild(dnInfo);
    }
    if(dnInfo){
      dnInfo.textContent = dn ? ("Delivery Note linked: " + dn) : "No Delivery Note recorded for this Order.";
    }

    if(typeof window.handleSupplierVatTypeChange === "function") window.handleSupplierVatTypeChange();
    if(typeof window.recalcFromTotal === "function" && document.getElementById("entryTotal")?.value) window.recalcFromTotal();
    if(typeof refreshCustomSelects === "function") refreshCustomSelects(document);

    if(msg){
      msg.className = "status ok";
      msg.textContent = dn
        ? "Order and Delivery Note loaded. Enter Invoice No and edit if needed."
        : "Order loaded. No Delivery Note exists yet.";
    }
  }catch(err){
    if(msg){
      msg.className = "status error";
      msg.textContent = err?.message || "Could not load order details.";
    }
  }
};

window.bindInvoiceOrderAutoFill = function(){
  const orderInput = document.getElementById("entryOrderNo");
  if(!orderInput || orderInput.dataset.invoiceAutoFillBound === "1") return;
  orderInput.dataset.invoiceAutoFillBound = "1";

  orderInput.addEventListener("input", function(){
    if((document.getElementById("entryMode")?.value || "") !== "invoice") return;
    clearTimeout(window.__invoiceAutoFillTimer);
    window.__invoiceAutoFillTimer = setTimeout(window.autofillInvoiceFromOrder, 650);
  });

  orderInput.addEventListener("change", function(){
    if((document.getElementById("entryMode")?.value || "") === "invoice") window.autofillInvoiceFromOrder();
  });

  orderInput.addEventListener("blur", function(){
    if((document.getElementById("entryMode")?.value || "") === "invoice") window.autofillInvoiceFromOrder();
  });
};

const __oldOpenEntryModalForInvoiceAutofill = window.openEntryModal;
window.openEntryModal = async function(id=null, forcedMode=""){
  await __oldOpenEntryModalForInvoiceAutofill(id, forcedMode);
  window.bindInvoiceOrderAutoFill();

  if((document.getElementById("entryMode")?.value || "") === "invoice"){
    const msg = document.getElementById("entryStatusMsg");
    if(msg && !id){
      msg.className = "status ok";
      msg.textContent = "Enter Order No. The system will auto-fill supplier, project, description, amount and Delivery Note if recorded.";
    }
  }
};

setInterval(function(){
  window.bindInvoiceOrderAutoFill();
}, 900);


/* === V87.31 Locks after Invoice + automatic DN numbering === */

window.nextDeliveryNoteNo = async function(){
  const { data, error } = await supabase.from("suppliers").select("notes");
  if(error) throw error;

  let max = 0;
  (data || []).forEach(row => {
    const notes = String(row.notes || "");
    const matches = [...notes.matchAll(/\[\[DN:DN-(\d+)\]\]/g)];
    matches.forEach(m => {
      const n = Number(m[1] || 0);
      if(n > max) max = n;
    });
  });

  return "DN-" + String(max + 1).padStart(4, "0");
};

window.setAutoDeliveryNoteNo = async function(force=false){
  const mode = document.getElementById("entryMode")?.value || "";
  if(mode !== "delivery_note") return;

  const input = document.getElementById("entryInvoiceNo");
  if(!input) return;

  input.readOnly = true;
  input.style.opacity = "0.85";
  input.title = "Delivery Note number is automatic and cannot be changed.";

  if(input.value && !force) return;

  try{
    const next = await window.nextDeliveryNoteNo();
    input.value = next;
    input.dispatchEvent(new Event("input", { bubbles:true }));
    input.dispatchEvent(new Event("change", { bubbles:true }));
  }catch(err){
    const msg = document.getElementById("entryStatusMsg");
    if(msg){
      msg.className = "status error";
      msg.textContent = err?.message || "Could not generate Delivery Note number.";
    }
  }
};

const __oldPrepareDeliveryNoteModeV31 = window.prepareDeliveryNoteMode;
window.prepareDeliveryNoteMode = function(){
  if(typeof __oldPrepareDeliveryNoteModeV31 === "function"){
    __oldPrepareDeliveryNoteModeV31();
  }
  window.setAutoDeliveryNoteNo();
  const label = document.getElementById("entryInvoiceLabel") || document.querySelector("#entryInvoiceWrap span");
  if(label) label.textContent = "Delivery Note No (Auto)";
};

const __oldOpenEntryModalV31 = window.openEntryModal;
window.openEntryModal = async function(id=null, forcedMode=""){
  await __oldOpenEntryModalV31(id, forcedMode);
  const mode = document.getElementById("entryMode")?.value || "";
  const input = document.getElementById("entryInvoiceNo");

  if(mode === "delivery_note"){
    await window.setAutoDeliveryNoteNo();
  } else if(input){
    input.readOnly = false;
    input.style.opacity = "";
    input.title = "";
  }

  // Lock editing when invoice already exists unless admin
  if(id){
    try{
      const { data } = await supabase.from("suppliers").select("*").eq("id", id).single();
      const hasInvoice = !!String(data?.invoice_no || "").trim();
      if(hasInvoice && currentRole !== "admin"){
        const ids = ["entrySupplier","entryOrderNo","entryInvoiceNo","entryProject","entryType","entryDescription","entryDescriptionSelect","entryNetAmount","entryVatAmount","entryTotal","entryStatus","entryNotes"];
        ids.forEach(fieldId => {
          const el = document.getElementById(fieldId);
          if(el) el.disabled = true;
        });
        const saveBtn = Array.from(document.querySelectorAll("#entryModal button")).find(b => /save/i.test(b.textContent || ""));
        if(saveBtn) saveBtn.disabled = true;
        const msg = document.getElementById("entryStatusMsg");
        if(msg){
          msg.className = "status error";
          msg.textContent = "Invoice already exists. Only admin can edit this Order / Delivery Note / Invoice chain.";
        }
      }
    }catch(e){}
  }
};

const __oldClearDeliveryNoteFromSelectedV31 = window.clearDeliveryNoteFromSelected;
window.clearDeliveryNoteFromSelected = async function(){
  if(!canAdmin()) return alert("Only admin can delete Delivery Note.");

  if(selectedIds.length !== 1) return alert("Select one Order row with Delivery Note.");
  const { data, error } = await supabase.from("suppliers").select("*").eq("id", selectedIds[0]).single();
  if(error || !data) return alert(error?.message || "Row not found.");

  if(String(data.invoice_no || "").trim() && currentRole !== "admin"){
    return alert("Invoice already exists. Only admin can delete DN or Order.");
  }

  if(typeof __oldClearDeliveryNoteFromSelectedV31 === "function"){
    return __oldClearDeliveryNoteFromSelectedV31();
  }
};

// Extra protection: non-admin cannot bulk delete invoiced rows
const __oldBulkDeleteV31 = window.bulkDelete;
window.bulkDelete = async function(){
  if(!canAdmin()) return alert("Only admin can delete rows.");
  if(!selectedIds.length) return alert("Select rows first.");

  const { data, error } = await supabase.from("suppliers").select("id, invoice_no, order_no").in("id", selectedIds);
  if(error) return alert(error.message);

  const invoiced = (data || []).filter(r => String(r.invoice_no || "").trim());
  if(invoiced.length && currentRole !== "admin"){
    return alert("Invoice already exists. Only admin can delete Order / DN / Invoice chain.");
  }

  if(typeof __oldBulkDeleteV31 === "function"){
    return __oldBulkDeleteV31();
  }
};

// Ensure Delivery Note save uses automatic DN number and cannot be empty
const __oldUpdateOrderRowWithDeliveryNoteV31 = window.updateOrderRowWithDeliveryNote;
window.updateOrderRowWithDeliveryNote = async function(){
  const mode = document.getElementById("entryMode")?.value || "";
  if(mode === "delivery_note"){
    await window.setAutoDeliveryNoteNo();
  }
  return __oldUpdateOrderRowWithDeliveryNoteV31.apply(this, arguments);
};


/* === V87.32 DAILY STATS === */

window.getTodayRange = function(){
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate()+1);
  return {start, end};
};

window.calculateDailyStats = async function(){
  const {start, end} = window.getTodayRange();

  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString());

  if(error) return;

  let orders = 0, dns = 0, invoices = 0;

  (data || []).forEach(r=>{
    if(String(r.entry_type || '').toLowerCase() === 'deposit') return;
    const hasOrder = !!String(r.order_no || '').trim() || String(r.entry_type || '').toLowerCase() === 'order';
    const hasDN = !!extractDeliveryNoteNo(r) || String(r.entry_type || '').toLowerCase() === 'delivery_note' || String(r.entry_type || '').toLowerCase() === 'dn';
    const hasInv = !!String(r.invoice_no || '').trim() || String(r.entry_type || '').toLowerCase() === 'invoice';

    const baseVal = Number(r.total || r.amount || 0);
    const deliveredVal = (typeof extractDeliveredAmount === 'function' && Number(extractDeliveredAmount(r) || 0) > 0) ? Number(extractDeliveredAmount(r) || 0) : baseVal;
    const invoiceVal = (typeof invoiceDisplayAmount === 'function') ? Number(invoiceDisplayAmount(r) || 0) : baseVal;

    if(hasOrder) orders += baseVal;
    if(hasDN) dns += deliveredVal;
    if(hasInv) invoices += invoiceVal;
  });

  const set = (id,val)=>{
    const el=document.getElementById(id);
    if(el) el.innerText = "R " + Number(val).toLocaleString("en-ZA");
  };

  set("statOrders", orders);
  set("statDN", dns);
  set("statInv", invoices);
};

window.injectDailyStatsUI = function(){
  if(document.getElementById("dailyStatsBox")) return;

  const container = document.querySelector(".dashboard-grid") || document.body;

  const box = document.createElement("div");
  box.id = "dailyStatsBox";
  box.className = "card";
  box.style.marginBottom = "12px";

  box.innerHTML = `
<h2 style="margin-bottom:15px;">Financial Status</h2>

<div style="display:flex;gap:15px;margin-bottom:15px;flex-wrap:wrap;">
  <div class="card"><div>Orders</div><b style="color:#6ea8ff">${moneyFmt(totals.order)}</b></div>
  <div class="card"><div>Delivered</div><b style="color:#4cd964">${moneyFmt(totals.delivered)}</b></div>
  <div class="card"><div>Invoiced</div><b style="color:#f5c542">${moneyFmt(totals.invoiced)}</b></div>
  <div class="card"><div>Open Supply</div><b style="color:${totals.balance>0?'#ff6b6b':'#4cd964'}">${moneyFmt(totals.balance)}</b></div>
  <div class="card"><div>Deposit / Credit</div><b style="color:#e6c79c">${moneyFmt(totals.credit)}</b></div>
  <div class="card"><div>Outstanding</div><b style="color:${totals.outstanding>0?'#ff9b9b':'#4cd964'}">${moneyFmt(totals.outstanding)}</b></div>
</div>

<div class="card fs-project-bubble project-kpi-card-v93">
  <div class="fs-project-head project-kpi-head-v93">
    <div>
      <div class="fs-project-label">Project Summary</div>
      <h3>Project BLU</h3>
    </div>
    <div class="project-kpi-open-v93 ${totals.balance>0?'bad':'good'}">
      <span>Open</span>
      <b>${moneyFmt(totals.balance)}</b>
    </div>
  </div>
  <div class="project-kpi-grid-v93">
    <div class="project-kpi-cell-v93"><span>Orders</span><b class="blue">${moneyFmt(totals.order)}</b></div>
    <div class="project-kpi-cell-v93"><span>Delivered</span><b class="green">${moneyFmt(totals.delivered)}</b></div>
    <div class="project-kpi-cell-v93"><span>Invoiced</span><b class="yellow">${moneyFmt(totals.invoiced)}</b></div>
    <div class="project-kpi-cell-v93"><span>Open Balance</span><b class="${totals.balance>0?'red':'green'}">${moneyFmt(totals.balance)}</b></div>
  </div>
</div>
`;

  container.prepend(box);
};

setTimeout(()=>{
  window.injectDailyStatsUI();
  window.calculateDailyStats();
},1000);

setInterval(window.calculateDailyStats, 60000);


/* === V87.33 PERFORMANCE READY === */
window.injectPerformanceBadge = function(){
  if(document.getElementById("performanceBadge")) return;
  const app = document.getElementById("app");
  if(!app) return;
  const target = app.querySelector(".toolbar") || app.querySelector(".card") || app.firstElementChild;
  if(!target) return;

  const badge = document.createElement("div");
  badge.id = "performanceBadge";
  badge.className = "note";
  badge.style.margin = "8px 0 12px";
  badge.innerHTML = "Performance mode: loading latest " + PERFORMANCE_CONFIG.defaultLimit + " records for fast daily work.";
  target.parentNode.insertBefore(badge, target.nextSibling);
};

const __oldRenderV33 = typeof render === "function" ? render : null;
if(__oldRenderV33 && !window.__renderPerformanceWrapped){
  window.__renderPerformanceWrapped = true;
  render = async function(){
    const result = await __oldRenderV33.apply(this, arguments);
    setTimeout(window.injectPerformanceBadge, 100);
    return result;
  };
}
setTimeout(window.injectPerformanceBadge, 1200);



/* === V87.34.1 SEARCH FOCUS FIX === */
window.bindSmartSearchInput = function(){
  const input = document.getElementById("searchInput");
  if(!input || input.dataset.smartSearchFocusBound === "1") return;
  input.dataset.smartSearchFocusBound = "1";

  input.addEventListener("input", function(e){
    const val = e.target.value || "";
    uiState.search = val;

    clearTimeout(window.__smartSearchTimer);
    window.__smartSearchTimer = setTimeout(async function(){
      const activeId = document.activeElement?.id || "";
      const cursorStart = e.target.selectionStart;
      const cursorEnd = e.target.selectionEnd;

      if(typeof render === "function") await render();

      setTimeout(function(){
        const nextInput = document.getElementById("searchInput");
        if(nextInput){
          nextInput.value = uiState.search || "";
          if(activeId === "searchInput"){
            nextInput.focus();
            try{
              nextInput.setSelectionRange(cursorStart, cursorEnd);
            }catch(err){}
          }
        }
      }, 30);
    }, 450);
  });
};

const __oldRenderV341 = typeof render === "function" ? render : null;
if(__oldRenderV341 && !window.__renderSearchFocusWrapped){
  window.__renderSearchFocusWrapped = true;
  render = async function(){
    const wasFocused = document.activeElement?.id === "searchInput";
    const prevValue = document.getElementById("searchInput")?.value || uiState.search || "";
    const prevStart = document.getElementById("searchInput")?.selectionStart || prevValue.length;
    const prevEnd = document.getElementById("searchInput")?.selectionEnd || prevValue.length;

    const result = await __oldRenderV341.apply(this, arguments);

    setTimeout(function(){
      window.bindSmartSearchInput();
      const input = document.getElementById("searchInput");
      if(input){
        input.value = uiState.search || prevValue || "";
        if(wasFocused){
          input.focus();
          try{ input.setSelectionRange(prevStart, prevEnd); }catch(err){}
        }
      }
    }, 50);

    return result;
  };
}

setTimeout(window.bindSmartSearchInput, 1000);


/* === V87.35 INVOICE REQUIRES DELIVERY NOTE === */
window.orderHasDeliveryNote = async function(orderNo){
  if(!orderNo) return false;
  const order = await window.findExistingOrderRow(orderNo);
  if(!order) return false;
  return !!extractDeliveryNoteNo(order);
};

window.requireDeliveryNoteForInvoice = async function(){
  const mode = document.getElementById("entryMode")?.value || "";
  if(mode !== "invoice") return true;

  const orderNo = (document.getElementById("entryOrderNo")?.value || "").trim();

  // Direct invoice with no Order No remains allowed only for standalone invoices.
  // But if Order No is entered, DN is mandatory.
  if(!orderNo) return true;

  try{
    const order = await window.findExistingOrderRow(orderNo);
    if(!order){
      alert("Order not found. Cannot create Invoice.");
      return false;
    }

    const dn = extractDeliveryNoteNo(order);
    if(!dn){
      alert("Cannot create Invoice. Delivery Note is required first.");
      return false;
    }

    return true;
  }catch(err){
    alert(err?.message || "Could not verify Delivery Note.");
    return false;
  }
};

if(typeof window.saveEntry === "function" && !window.__invoiceRequiresDNWrapped){
  window.__invoiceRequiresDNWrapped = true;
  const __saveEntryBeforeInvoiceDNRule = window.saveEntry;
  window.saveEntry = async function(){
    const ok = await window.requireDeliveryNoteForInvoice();
    if(!ok) return;
    return __saveEntryBeforeInvoiceDNRule.apply(this, arguments);
  };
}

// Protect Convert Order → Invoice as well.
if(typeof window.openConvertOrderModal === "function" && !window.__convertRequiresDNWrapped){
  window.__convertRequiresDNWrapped = true;
  const __oldOpenConvertOrderModal = window.openConvertOrderModal;

  window.openConvertOrderModal = async function(){
    if(selectedIds.length !== 1){
      alert("Select one Order row to convert.");
      return;
    }

    try{
      const { data, error } = await supabase.from("suppliers").select("*").eq("id", selectedIds[0]).single();
      if(error || !data){
        alert(error?.message || "Order not found.");
        return;
      }

      const dn = extractDeliveryNoteNo(data);
      if(!dn){
        alert("Cannot convert to Invoice. Delivery Note is required first.");
        return;
      }
    }catch(err){
      alert(err?.message || "Could not verify Delivery Note.");
      return;
    }

    return __oldOpenConvertOrderModal.apply(this, arguments);
  };
}

// If convert uses another save/confirm function, block at click level too.
document.addEventListener("click", async function(ev){
  const btn = ev.target.closest("button");
  if(!btn) return;
  const txt = (btn.textContent || "").trim().toLowerCase();
  if(!txt.includes("convert") || !txt.includes("invoice")) return;

  // Let wrapped openConvertOrderModal handle it if possible.
  // This guard is only for alternate convert buttons.
  if(typeof window.openConvertOrderModal === "function") return;
}, true);


/* === V87.35.2 SEARCH + SORT REAL FIX === */
window.bindFilterControls = function(){
  const search = document.getElementById("searchInput");
  if(search && search.dataset.filterBound !== "1"){
    search.dataset.filterBound = "1";
    search.addEventListener("input", function(e){
      uiState.search = e.target.value || "";
      clearTimeout(window.__filterTimer);
      window.__filterTimer = setTimeout(()=>window.applyFilters(), 350);
    });
    search.addEventListener("keydown", function(e){
      if(e.key === "Enter"){
        e.preventDefault();
        window.applyFilters();
      }
    });
  }

  ["supplierFilter","projectFilter","statusFilter","sortFilter"].forEach(id=>{
    const el = document.getElementById(id);
    if(el && el.dataset.filterBound !== "1"){
      el.dataset.filterBound = "1";
      el.addEventListener("change", ()=>window.applyFilters());
      el.addEventListener("input", ()=>window.applyFilters());
    }
  });
};

const __oldRenderV352 = typeof render === "function" ? render : null;
if(__oldRenderV352 && !window.__renderFilterWrapped){
  window.__renderFilterWrapped = true;
  render = async function(){
    const focused = document.activeElement?.id;
    const searchValue = document.getElementById("searchInput")?.value || uiState.search || "";
    const result = await __oldRenderV352.apply(this, arguments);

    setTimeout(()=>{
      window.bindFilterControls();
      const input = document.getElementById("searchInput");
      if(input){
        input.value = uiState.search || searchValue || "";
        if(focused === "searchInput"){
          input.focus();
          try{ input.setSelectionRange(input.value.length, input.value.length); }catch(e){}
        }
      }
    },50);

    return result;
  };
}

setTimeout(window.bindFilterControls, 1200);


/* === V87.35.3 FINAL FILTER FIX === */
window.readFiltersDirect = function(){
  uiState.search = document.getElementById("searchInput")?.value || uiState.search || "";
  uiState.supplier = document.getElementById("supplierFilter")?.value || uiState.supplier || "";
  uiState.project = document.getElementById("projectFilter")?.value || uiState.project || "";
  uiState.status = document.getElementById("statusFilter")?.value || uiState.status || "";
  uiState.sort = document.getElementById("sortFilter")?.value || uiState.sort || "date_desc";
};

const __oldRenderV353 = render;
render = async function(){
  window.readFiltersDirect();
  return await __oldRenderV353.apply(this, arguments);
};



/* === V87.37.1 CONVERT ORDER TO DELIVERY NOTE === */
window.convertOrderToDN = async function(){
  if(selectedIds.length !== 1){
    alert("Select one Order row.");
    return;
  }

  try{
    const { data, error } = await supabase.from("suppliers").select("*").eq("id", selectedIds[0]).single();
    if(error || !data){
      alert(error?.message || "Order not found.");
      return;
    }

    const hasDN = extractDeliveryNoteNo(data);
    if(hasDN){
      alert("Delivery Note already exists.");
      return;
    }

    if(String(data.invoice_no || "").trim()){
      alert("Invoice already exists. Cannot create Delivery Note after Invoice.");
      return;
    }

    const nextDN = await window.nextDeliveryNoteNo();
    const notes = upsertDeliveryNoteTag(data.notes || "", nextDN);

    const { error: updErr } = await supabase
      .from("suppliers")
      .update({
        notes: notes,
        status: "Partial",
        entry_type: "order"
      })
      .eq("id", data.id);

    if(updErr){
      alert(updErr.message);
      return;
    }

    selectedIds = [];
    alert("Delivery Note created: " + nextDN);
    await render();

  }catch(err){
    alert(err?.message || "Error creating Delivery Note.");
  }
};


/* === V87.37.1 OPENING BALANCE DISPLAY === */
window.calculateOpeningBalanceFromEntries = function(rows){
  if(!selectedMonth) return 0;
  const currentYear = new Date().getFullYear();
  const monthStart = `${currentYear}-${selectedMonth}-01`;

  return (rows || [])
    .filter(r => String(r.created_at || "") < monthStart)
    .reduce((sum, r) => sum + Number(r.amount_due || r.total || r.amount || 0), 0);
};

const __oldRenderOpeningV371 = render;
render = async function(){
  const result = await __oldRenderOpeningV371.apply(this, arguments);

  setTimeout(async ()=>{
    try{
      const entries = await getEntries();
      const opening = window.calculateOpeningBalanceFromEntries(entries);

      let box = document.getElementById("openingBalanceBox");
      if(box) box.remove();

      const stats = document.querySelector(".stats");
      if(stats && selectedMonth){
        box = document.createElement("div");
        box.id = "openingBalanceBox";
        box.className = "stat";
        box.innerHTML = `
<h2 style="margin-bottom:15px;">Financial Status</h2>

<div style="display:flex;gap:15px;margin-bottom:15px;flex-wrap:wrap;">
  <div class="card"><div>Orders</div><b style="color:#6ea8ff">${moneyFmt(totals.order)}</b></div>
  <div class="card"><div>Delivered</div><b style="color:#4cd964">${moneyFmt(totals.delivered)}</b></div>
  <div class="card"><div>Invoiced</div><b style="color:#f5c542">${moneyFmt(totals.invoiced)}</b></div>
  <div class="card"><div>Open</div><b style="color:${totals.balance>0?'#ff6b6b':'#4cd964'}">${moneyFmt(totals.balance)}</b></div>
</div>

<div class="fs-project-financial-clone">
  <h2>Project BLU</h2>
  <div class="fs-gold-line"></div>
  <div class="fs-kpi-grid project-kpi-grid">
    <div class="fs-kpi-card"><div>Orders</div><b style="color:#6ea8ff">${moneyFmt(totals.order)}</b></div>
    <div class="fs-kpi-card"><div>Delivered</div><b style="color:#4cd964">${moneyFmt(totals.delivered)}</b></div>
    <div class="fs-kpi-card"><div>Invoiced</div><b style="color:#f5c542">${moneyFmt(totals.invoiced)}</b></div>
    <div class="fs-kpi-card"><div>Open</div><b style="color:${totals.balance>0?'#ff6b6b':'#4cd964'}">${moneyFmt(totals.balance)}</b></div>
  </div>
</div>
`;
        stats.prepend(box);
      }
    }catch(e){}
  },120);

  return result;
};


/* === V87.38 ORDER CLOSURE + PARTIAL DELIVERY NOTE === */
window.setGrossAmountFields = function(gross){
  const total = Number(gross || 0);
  const net = typeof calcNetFromGross === "function" ? calcNetFromGross(total) : total;
  const vat = Math.max(0, total - net);
  window.setEntryFieldValue("entryTotal", total.toFixed(2));
  window.setEntryFieldValue("entryNetAmount", net.toFixed(2));
  window.setEntryFieldValue("entryVatAmount", vat.toFixed(2));
};

const __oldPrepareDeliveryNoteModeV38 = window.prepareDeliveryNoteMode;
window.prepareDeliveryNoteMode = function(){
  if(typeof __oldPrepareDeliveryNoteModeV38 === "function") __oldPrepareDeliveryNoteModeV38();
  const msg = document.getElementById("entryStatusMsg");
  if(msg){
    msg.className = "status ok";
    msg.textContent = "Enter Order No. If only part was supplied, edit Total to the delivered amount. The Order balance updates automatically.";
  }
};

window.updateOrderRowWithDeliveryNote = async function(){
  const orderNo = (document.getElementById("entryOrderNo")?.value || "").trim();
  const deliveryNo = (document.getElementById("entryInvoiceNo")?.value || "").trim();
  const deliveredGross = Number(document.getElementById("entryTotal")?.value || 0);

  if(!orderNo){ alert("Order No is required for Delivery Note"); return true; }
  if(!deliveryNo){ alert("Delivery Note No is required"); return true; }
  if(deliveredGross <= 0){ alert("Delivered amount is required. Use Total for the actual delivered amount."); return true; }

  let order = null;
  try{ order = await window.findExistingOrderRow(orderNo); }
  catch(err){ alert(err?.message || "Could not check Order No"); return true; }

  if(!order){ alert("Order not found. Cannot create Delivery Note"); return true; }
  if(String(order.invoice_no || "").trim()){ alert("Invoice already exists. Cannot change Delivery Note."); return true; }

  const orderTotal = orderGrossAmount(order);
  const balance = Math.max(0, orderTotal - deliveredGross);
  let notes = upsertDeliveryNoteTag(order.notes || "", deliveryNo);
  notes = upsertNoteTag(notes, "DNAMT", deliveredGross.toFixed(2));
  const status = balance > 0.01 ? "Partial Delivery" : "Delivered";

  const { error } = await supabase.from("suppliers").update({ entry_type:"order", status, notes }).eq("id", order.id);
  if(error){ alert(error.message); return true; }

  alert(balance > 0.01 ? ("Partial Delivery saved. Remaining balance: " + money(balance)) : "Delivery Note saved as fully delivered.");
  document.getElementById("entryModal")?.classList.remove("show");
  if(typeof render === "function") await render();
  return true;
};

const __oldAutofillInvoiceFromOrderV38 = window.autofillInvoiceFromOrder;
window.autofillInvoiceFromOrder = async function(){
  if(typeof __oldAutofillInvoiceFromOrderV38 === "function") await __oldAutofillInvoiceFromOrderV38();
  if((document.getElementById("entryMode")?.value || "") !== "invoice") return;
  try{
    const orderNo = (document.getElementById("entryOrderNo")?.value || "").trim();
    const order = orderNo ? await window.findExistingOrderRow(orderNo) : null;
    const delivered = extractDeliveredAmount(order);
    if(delivered > 0){
      window.setGrossAmountFields(delivered);
      const msg = document.getElementById("entryStatusMsg");
      if(msg){ msg.className = "status ok"; msg.textContent = "Invoice amount set from delivered amount: " + money(delivered); }
    }
  }catch(e){}
};

window.convertOrderToDN = async function(){
  if(selectedIds.length !== 1){ alert("Select one Order row."); return; }
  try{
    const { data, error } = await supabase.from("suppliers").select("*").eq("id", selectedIds[0]).single();
    if(error || !data){ alert(error?.message || "Order not found."); return; }
    if(extractDeliveryNoteNo(data)){ alert("Delivery Note already exists."); return; }
    if(String(data.invoice_no || "").trim()){ alert("Invoice already exists. Cannot create Delivery Note after Invoice."); return; }

    const nextDN = await window.nextDeliveryNoteNo();
    let notes = upsertDeliveryNoteTag(data.notes || "", nextDN);
    notes = upsertNoteTag(notes, "DNAMT", orderGrossAmount(data).toFixed(2));

    const { error: updErr } = await supabase.from("suppliers").update({ notes, status:"Delivered", entry_type:"order" }).eq("id", data.id);
    if(updErr){ alert(updErr.message); return; }

    selectedIds = [];
    alert("Delivery Note created: " + nextDN);
    await render();
  }catch(err){ alert(err?.message || "Error creating Delivery Note."); }
};

window.openOrderClosurePrompt = async function(){
  if(!canAccountant()) return alert("Only accountant / manager / admin can close or cancel balances.");
  if(selectedIds.length !== 1) return alert("Select one Order row.");

  const { data, error } = await supabase.from("suppliers").select("*").eq("id", selectedIds[0]).single();
  if(error || !data) return alert(error?.message || "Order not found.");
  if(String(data.invoice_no || "").trim() && currentRole !== "admin") return alert("Invoice already exists. Only admin can close or change this chain.");

  const choice = prompt("Choose close reason:\n1 = Fully Supplied\n2 = Partially Supplied\n3 = Balance Cancelled\n4 = Out of Stock\n5 = Credit Note\n6 = Cancelled Order", "3");
  if(!choice) return;
  const map = {"1":"Fully Supplied","2":"Partially Supplied","3":"Balance Cancelled","4":"Out of Stock","5":"Credit Note","6":"Cancelled Order"};
  const reason = map[String(choice).trim()];
  if(!reason) return alert("Invalid option.");

  const currentDelivered = extractDeliveredAmount(data);
  const currentBalance = Math.max(0, orderGrossAmount(data) - currentDelivered);
  let cancelAmount = 0, creditAmount = 0;

  if(["Balance Cancelled","Out of Stock","Cancelled Order"].includes(reason)){
    const val = prompt("Cancelled balance amount", currentBalance.toFixed(2));
    if(val === null) return;
    cancelAmount = Number(val || 0);
  }
  if(reason === "Credit Note"){
    const val = prompt("Credit note amount", currentBalance.toFixed(2));
    if(val === null) return;
    creditAmount = Number(val || 0);
  }

  let notes = data.notes || "";
  notes = upsertNoteTag(notes, "CLOSE", reason);
  if(cancelAmount > 0) notes = upsertNoteTag(notes, "CANCELAMT", cancelAmount.toFixed(2));
  if(creditAmount > 0) notes = upsertNoteTag(notes, "CREDIT", creditAmount.toFixed(2));

  const { error: updErr } = await supabase.from("suppliers").update({ notes, status:reason, entry_type:"order" }).eq("id", data.id);
  if(updErr) return alert(updErr.message);

  selectedIds = [];
  alert("Order updated: " + reason);
  await render();
};


/* === V87.39 SMART CONVERT ORDER TO DN === */

window.openSmartConvertDN = async function(){
  if(selectedIds.length !== 1){
    alert("Select one Order row.");
    return;
  }

  const { data, error } = await supabase.from("suppliers").select("*").eq("id", selectedIds[0]).single();
  if(error || !data){
    alert(error?.message || "Order not found.");
    return;
  }

  if(extractDeliveryNoteNo(data)){
    alert("Delivery Note already exists.");
    return;
  }

  if(String(data.invoice_no || "").trim()){
    alert("Invoice already exists. Cannot create Delivery Note.");
    return;
  }

  const orderAmount = orderGrossAmount(data);
  const deliveredText = prompt(
    "Delivered Amount\n\nOrder Amount: " + money(orderAmount) + "\nEnter actual delivered amount:",
    orderAmount.toFixed(2)
  );
  if(deliveredText === null) return;

  const deliveredAmount = Number(deliveredText || 0);
  if(deliveredAmount <= 0){
    alert("Delivered amount must be greater than 0.");
    return;
  }

  const balance = Math.max(0, orderAmount - deliveredAmount);

  let statusChoice = "1";
  if(balance > 0.01){
    statusChoice = prompt(
      "Balance: " + money(balance) + "\n\nChoose balance status:\n" +
      "1 = Keep Balance Open\n" +
      "2 = Close Balance\n" +
      "3 = Out of Stock\n" +
      "4 = Cancelled Balance\n" +
      "5 = Credit Note",
      "1"
    );
    if(statusChoice === null) return;
  }

  const statusMap = {
    "1": "Partial Delivery",
    "2": "Balance Closed",
    "3": "Out of Stock",
    "4": "Balance Cancelled",
    "5": "Credit Note"
  };

  const closeReasonMap = {
    "2": "Balance Closed",
    "3": "Out of Stock",
    "4": "Balance Cancelled",
    "5": "Credit Note"
  };

  const selectedStatus = balance > 0.01 ? (statusMap[String(statusChoice).trim()] || "Partial Delivery") : "Delivered";
  const closeReason = closeReasonMap[String(statusChoice).trim()] || "";

  const nextDN = await window.nextDeliveryNoteNo();

  let notes = upsertDeliveryNoteTag(data.notes || "", nextDN);
  notes = upsertNoteTag(notes, "DNAMT", deliveredAmount.toFixed(2));

  if(closeReason){
    notes = upsertNoteTag(notes, "CLOSE", closeReason);
    if(closeReason === "Credit Note"){
      notes = upsertNoteTag(notes, "CREDIT", balance.toFixed(2));
    } else {
      notes = upsertNoteTag(notes, "CANCELAMT", balance.toFixed(2));
    }
  }

  const { error: updError } = await supabase
    .from("suppliers")
    .update({
      notes,
      status: selectedStatus,
      entry_type: "order"
    })
    .eq("id", data.id);

  if(updError){
    alert(updError.message);
    return;
  }

  selectedIds = [];
  alert(
    "Delivery Note created: " + nextDN + "\n" +
    "Delivered: " + money(deliveredAmount) + "\n" +
    "Balance: " + money(balance) + "\n" +
    "Status: " + selectedStatus
  );

  if(typeof render === "function") await render();
};

// Override old Convert DN function to open the smart flow
window.convertOrderToDN = window.openSmartConvertDN;


/* === V87.39.1 INVOICE SYNC FIX === */

// Ensure Invoice always uses Delivered Amount if exists
const __oldAutofillInvoiceFromOrder_FIX = window.autofillInvoiceFromOrder;

window.autofillInvoiceFromOrder = async function(){
  if(typeof __oldAutofillInvoiceFromOrder_FIX === "function"){
    await __oldAutofillInvoiceFromOrder_FIX();
  }

  const mode = document.getElementById("entryMode")?.value || "";
  if(mode !== "invoice") return;

  try{
    const orderNo = (document.getElementById("entryOrderNo")?.value || "").trim();
    if(!orderNo) return;

    const order = await window.findExistingOrderRow(orderNo);
    if(!order) return;

    const delivered = typeof extractDeliveredAmount === "function" ? extractDeliveredAmount(order) : 0;
    const orderTotal = Number(order.total || order.amount || 0);

    const finalAmount = delivered > 0 ? delivered : orderTotal;

    // set fields
    if(typeof window.setGrossAmountFields === "function"){
      window.setGrossAmountFields(finalAmount);
    } else {
      document.getElementById("entryTotal").value = finalAmount.toFixed(2);
    }

    const msg = document.getElementById("entryStatusMsg");
    if(msg){
      msg.className = "status ok";
      msg.textContent = delivered > 0
        ? "Invoice set from Delivered Amount (DN)"
        : "Invoice set from Order Amount (no DN)";
    }

  }catch(e){}
};

// Also enforce during SAVE (safety net)
const __oldSaveEntry_FIX = window.saveEntry;

window.saveEntry = async function(){
  const mode = document.getElementById("entryMode")?.value || "";

  if(mode === "invoice"){
    const orderNo = (document.getElementById("entryOrderNo")?.value || "").trim();

    if(orderNo){
      const order = await window.findExistingOrderRow(orderNo);
      if(order){
        const delivered = typeof extractDeliveredAmount === "function" ? extractDeliveredAmount(order) : 0;
        if(delivered > 0){
          if(typeof window.setGrossAmountFields === "function"){
            window.setGrossAmountFields(delivered);
          } else {
            document.getElementById("entryTotal").value = delivered.toFixed(2);
          }
        }
      }
    }
  }

  return await __oldSaveEntry_FIX.apply(this, arguments);
};


/* === V87.39.2 CLOSE LOGIC FIX === */

// FIX: always apply close reason even if balance = 0
window.applySmartCloseLogic = function(orderAmount, deliveredAmount, userChoice){
  const balance = Math.max(0, orderAmount - deliveredAmount);

  let status = "Delivered";
  let closeReason = "";

  const map = {
    "1": "Partial Delivery",
    "2": "Balance Closed",
    "3": "Out of Stock",
    "4": "Balance Cancelled",
    "5": "Credit Note"
  };

  if(deliveredAmount < orderAmount){
    status = map[userChoice] || "Partial Delivery";
  } else {
    // FULL delivered
    if(userChoice === "2"){
      status = "Fully Supplied";
      closeReason = "Fully Supplied";
    } else {
      status = "Delivered";
    }
  }

  if(userChoice === "2") closeReason = "Balance Closed";
  if(userChoice === "3") closeReason = "Out of Stock";
  if(userChoice === "4") closeReason = "Balance Cancelled";
  if(userChoice === "5") closeReason = "Credit Note";

  return { status, closeReason, balance };
};

// override smart convert
window.openSmartConvertDN = async function(){
  if(selectedIds.length !== 1){
    alert("Select one Order row.");
    return;
  }

  const { data, error } = await supabase.from("suppliers").select("*").eq("id", selectedIds[0]).single();
  if(error || !data){
    alert(error?.message || "Order not found.");
    return;
  }

  const orderAmount = orderGrossAmount(data);

  const deliveredText = prompt(
    "Delivered Amount\nOrder: " + money(orderAmount),
    orderAmount.toFixed(2)
  );
  if(deliveredText === null) return;

  const deliveredAmount = Number(deliveredText || 0);
  if(deliveredAmount <= 0) return alert("Invalid amount");

  const choice = prompt(
    "Choose status:\n1 Open\n2 Close Balance\n3 Out of Stock\n4 Cancelled\n5 Credit",
    "1"
  );

  const { status, closeReason, balance } = window.applySmartCloseLogic(orderAmount, deliveredAmount, choice);

  const nextDN = await window.nextDeliveryNoteNo();

  let notes = upsertDeliveryNoteTag(data.notes || "", nextDN);
  notes = upsertNoteTag(notes, "DNAMT", deliveredAmount.toFixed(2));

  if(closeReason){
    notes = upsertNoteTag(notes, "CLOSE", closeReason);

    if(balance > 0){
      if(closeReason === "Credit Note"){
        notes = upsertNoteTag(notes, "CREDIT", balance.toFixed(2));
      } else {
        notes = upsertNoteTag(notes, "CANCELAMT", balance.toFixed(2));
      }
    }
  }

  await supabase.from("suppliers").update({
    notes,
    status,
    entry_type: "order"
  }).eq("id", data.id);

  alert("Updated:\nStatus: " + status + "\nBalance: " + money(balance));

  selectedIds = [];
  await render();
};

window.convertOrderToDN = window.openSmartConvertDN;


/* === V87.39.3 STRICT DN / INVOICE RULES === */

// RULE 1: If Invoice exists → block DN changes (except admin)
window.updateOrderRowWithDeliveryNote = async function(){
  const orderNo = (document.getElementById("entryOrderNo")?.value || "").trim();
  const deliveryNo = (document.getElementById("entryInvoiceNo")?.value || "").trim();
  const deliveredGross = Number(document.getElementById("entryTotal")?.value || 0);

  if(!orderNo) return alert("Order No required"), true;
  if(!deliveryNo) return alert("DN No required"), true;

  const order = await window.findExistingOrderRow(orderNo);
  if(!order) return alert("Order not found"), true;

  if(String(order.invoice_no || "").trim() && currentRole !== "admin"){
    alert("Invoice already exists. DN locked.");
    return true;
  }

  let notes = upsertDeliveryNoteTag(order.notes || "", deliveryNo);
  notes = upsertNoteTag(notes, "DNAMT", deliveredGross.toFixed(2));

  const { error } = await supabase.from("suppliers").update({
    notes,
    status: deliveredGross < orderGrossAmount(order) ? "Partial Delivery" : "Delivered",
    entry_type: "order"
  }).eq("id", order.id);

  if(error) return alert(error.message), true;

  alert("DN updated correctly");
  document.getElementById("entryModal")?.classList.remove("show");
  await render();
  return true;
};


// RULE 2: Invoice ALWAYS = Delivered Amount
window.forceInvoiceFromDN = async function(){
  const orderNo = (document.getElementById("entryOrderNo")?.value || "").trim();
  if(!orderNo) return;

  const order = await window.findExistingOrderRow(orderNo);
  if(!order) return;

  const delivered = extractDeliveredAmount(order);
  const finalAmount = delivered > 0 ? delivered : orderGrossAmount(order);

  if(typeof window.setGrossAmountFields === "function"){
    window.setGrossAmountFields(finalAmount);
  } else {
    document.getElementById("entryTotal").value = finalAmount.toFixed(2);
  }
};


// override autofill
const __oldAutoV393 = window.autofillInvoiceFromOrder;
window.autofillInvoiceFromOrder = async function(){
  if(__oldAutoV393) await __oldAutoV393();
  if((document.getElementById("entryMode")?.value || "") === "invoice"){
    await window.forceInvoiceFromDN();
  }
};


// RULE 3: also enforce on save (hard lock)
const __oldSaveV393 = window.saveEntry;
window.saveEntry = async function(){
  if((document.getElementById("entryMode")?.value || "") === "invoice"){
    await window.forceInvoiceFromDN();
  }
  return await __oldSaveV393.apply(this, arguments);
};


// RULE 4: Convert → Invoice must use DN
const __oldConvertInvoice = window.openConvertOrderModal;
window.openConvertOrderModal = async function(){
  if(selectedIds.length !== 1){
    alert("Select one Order");
    return;
  }

  const { data } = await supabase.from("suppliers").select("*").eq("id", selectedIds[0]).single();
  const delivered = extractDeliveredAmount(data);

  if(delivered <= 0){
    alert("Cannot create Invoice without Delivery Note");
    return;
  }

  return __oldConvertInvoice();
};


/* === V87.39.4 FINAL DN → INVOICE SYNC (NO FALLBACK) === */

// Strict rule: if DN exists → MUST use DN amount (no fallback to order)

window.getInvoiceAmountStrict = function(order){
  const delivered = typeof extractDeliveredAmount === "function" ? extractDeliveredAmount(order) : 0;

  if(delivered > 0){
    return delivered;
  }

  // if no DN at all → block instead of fallback
  return null;
};

// enforce everywhere

window.forceInvoiceFromDN = async function(){
  const orderNo = (document.getElementById("entryOrderNo")?.value || "").trim();
  if(!orderNo) return;

  const order = await window.findExistingOrderRow(orderNo);
  if(!order) return;

  const amount = window.getInvoiceAmountStrict(order);

  if(amount === null){
    alert("Cannot create Invoice without Delivery Note amount.");
    return;
  }

  if(typeof window.setGrossAmountFields === "function"){
    window.setGrossAmountFields(amount);
  } else {
    document.getElementById("entryTotal").value = amount.toFixed(2);
  }

  const msg = document.getElementById("entryStatusMsg");
  if(msg){
    msg.className = "status ok";
    msg.textContent = "Invoice locked to Delivered Amount (DN)";
  }
};


// override autofill
const __oldAutoV394 = window.autofillInvoiceFromOrder;
window.autofillInvoiceFromOrder = async function(){
  if(__oldAutoV394) await __oldAutoV394();

  if((document.getElementById("entryMode")?.value || "") === "invoice"){
    await window.forceInvoiceFromDN();
  }
};


// enforce on save (hard lock)
const __oldSaveV394 = window.saveEntry;
window.saveEntry = async function(){

  if((document.getElementById("entryMode")?.value || "") === "invoice"){
    const orderNo = (document.getElementById("entryOrderNo")?.value || "").trim();

    if(orderNo){
      const order = await window.findExistingOrderRow(orderNo);
      const amount = window.getInvoiceAmountStrict(order);

      if(amount === null){
        alert("Invoice blocked: No Delivery Note amount.");
        return;
      }

      if(typeof window.setGrossAmountFields === "function"){
        window.setGrossAmountFields(amount);
      } else {
        document.getElementById("entryTotal").value = amount.toFixed(2);
      }
    }
  }

  return await __oldSaveV394.apply(this, arguments);
};


// also fix Convert → Invoice
const __oldConvertV394 = window.openConvertOrderModal;
window.openConvertOrderModal = async function(){

  if(selectedIds.length !== 1){
    alert("Select one Order");
    return;
  }

  const { data } = await supabase.from("suppliers").select("*").eq("id", selectedIds[0]).single();

  const amount = window.getInvoiceAmountStrict(data);

  if(amount === null){
    alert("Cannot convert to Invoice without Delivery Note amount.");
    return;
  }

  // temporarily store for modal usage
  window.__forcedInvoiceAmount = amount;

  return __oldConvertV394();
};


// ensure modal also respects it
const __oldSetFieldsV394 = window.setGrossAmountFields;
window.setGrossAmountFields = function(amount){
  if(window.__forcedInvoiceAmount){
    amount = window.__forcedInvoiceAmount;
    window.__forcedInvoiceAmount = null;
  }
  return __oldSetFieldsV394 ? __oldSetFieldsV394(amount) : null;
};


/* === V87.39.5 DN SOURCE OF TRUTH FOR INVOICE ===
   Final rule:
   - DN is the source of truth.
   - Invoice never uses Balance Closed / Cancel / Credit amounts.
   - Invoice amount = DN delivered amount only.
   - Convert to Invoice copies the DN decision as-is.
*/

window.getDNDecisionForInvoice = function(order){
  if(!order) return null;

  const dnNo = typeof extractDeliveryNoteNo === "function" ? extractDeliveryNoteNo(order) : "";
  const delivered = typeof extractDeliveredAmount === "function" ? extractDeliveredAmount(order) : 0;
  const closure = typeof extractCloseReason === "function" ? extractCloseReason(order) : "";
  const cancelled = typeof extractCancelledAmount === "function" ? extractCancelledAmount(order) : 0;
  const credit = typeof extractCreditAmount === "function" ? extractCreditAmount(order) : 0;

  if(!dnNo || delivered <= 0){
    return null;
  }

  return {
    dnNo,
    delivered,
    closure,
    cancelled,
    credit,
    orderNo: order.order_no || "",
    supplier: order.supplier || "",
    project: order.project || "",
    description: order.description || ""
  };
};

window.applyDNDecisionToInvoiceForm = function(decision){
  if(!decision) return;

  // Invoice amount is ONLY delivered amount from DN.
  if(typeof window.setGrossAmountFields === "function"){
    window.setGrossAmountFields(decision.delivered);
  } else {
    const total = document.getElementById("entryTotal");
    if(total) total.value = Number(decision.delivered || 0).toFixed(2);
  }

  const notes = document.getElementById("entryNotes");
  if(notes && !notes.value){
    let txt = "Invoice created from Delivery Note: " + decision.dnNo;
    txt += "\nDelivered Amount: " + (typeof money === "function" ? money(decision.delivered) : decision.delivered);

    if(decision.closure){
      txt += "\nDN Closure: " + decision.closure;
    }
    if(decision.cancelled > 0){
      txt += "\nCancelled Balance: " + (typeof money === "function" ? money(decision.cancelled) : decision.cancelled);
    }
    if(decision.credit > 0){
      txt += "\nCredit Note Amount: " + (typeof money === "function" ? money(decision.credit) : decision.credit);
    }

    notes.value = txt;
  }

  const msg = document.getElementById("entryStatusMsg");
  if(msg){
    msg.className = "status ok";
    msg.textContent = "Invoice amount copied from DN delivered amount only: " + (typeof money === "function" ? money(decision.delivered) : decision.delivered);
  }
};

// Convert Order → Invoice: copy the DN decision, do not recalculate.
const __oldOpenConvertOrderModalV395 = window.openConvertOrderModal;
window.openConvertOrderModal = async function(){
  if(selectedIds.length !== 1){
    alert("Select one Order row.");
    return;
  }

  const { data, error } = await supabase.from("suppliers").select("*").eq("id", selectedIds[0]).single();
  if(error || !data){
    alert(error?.message || "Order not found.");
    return;
  }

  const decision = window.getDNDecisionForInvoice(data);
  if(!decision){
    alert("Cannot convert to Invoice. Delivery Note with delivered amount is required first.");
    return;
  }

  window.__dnInvoiceDecision = decision;

  const result = await __oldOpenConvertOrderModalV395.apply(this, arguments);

  // After modal opens, force the amount from DN.
  setTimeout(function(){
    window.applyDNDecisionToInvoiceForm(window.__dnInvoiceDecision);
  }, 250);

  return result;
};

// When opening Invoice manually and entering Order No, copy DN decision.
const __oldAutofillInvoiceFromOrderV395 = window.autofillInvoiceFromOrder;
window.autofillInvoiceFromOrder = async function(){
  if(typeof __oldAutofillInvoiceFromOrderV395 === "function"){
    await __oldAutofillInvoiceFromOrderV395();
  }

  if((document.getElementById("entryMode")?.value || "") !== "invoice") return;

  const orderNo = (document.getElementById("entryOrderNo")?.value || "").trim();
  if(!orderNo) return;

  try{
    const order = await window.findExistingOrderRow(orderNo);
    const decision = window.getDNDecisionForInvoice(order);

    if(!decision){
      const msg = document.getElementById("entryStatusMsg");
      if(msg){
        msg.className = "status error";
        msg.textContent = "Invoice blocked: DN with delivered amount is required.";
      }
      return;
    }

    window.__dnInvoiceDecision = decision;
    window.applyDNDecisionToInvoiceForm(decision);
  }catch(e){}
};

// On save: hard enforcement.
// It does NOT use balance closed / cancelled / credit as invoice amount.
// It ONLY uses DN delivered amount.
const __oldSaveEntryV395 = window.saveEntry;
window.saveEntry = async function(){
  if((document.getElementById("entryMode")?.value || "") === "invoice"){
    const orderNo = (document.getElementById("entryOrderNo")?.value || "").trim();

    if(orderNo){
      const order = await window.findExistingOrderRow(orderNo);
      const decision = window.getDNDecisionForInvoice(order);

      if(!decision){
        alert("Invoice blocked: Delivery Note with delivered amount is required.");
        return;
      }

      window.__dnInvoiceDecision = decision;
      window.applyDNDecisionToInvoiceForm(decision);
    }
  }

  return await __oldSaveEntryV395.apply(this, arguments);
};


/* === V87.40 SMART DN UI === */
window.closeDNConvertModal = function(){
  const m = document.getElementById("dnConvertModal");
  if(m) m.remove();
  window.__dnConvertRow = null;
};

window.dnStatusLabel = function(choice){
  const map = {
    open: "Partial Delivery",
    close: "Balance Closed",
    out_of_stock: "Out of Stock",
    cancelled: "Balance Cancelled",
    credit: "Credit Note",
    full: "Delivered"
  };
  return map[choice] || "Partial Delivery";
};

window.refreshDNConvertPreview = function(){
  const row = window.__dnConvertRow;
  if(!row) return;

  const orderAmount = orderGrossAmount(row);
  const delivered = Number(document.getElementById("dnDeliveredAmount")?.value || 0);
  const balance = Math.max(0, orderAmount - delivered);
  const statusChoice = document.getElementById("dnCloseStatus")?.value || "open";

  const balanceEl = document.getElementById("dnBalancePreview");
  const invoiceEl = document.getElementById("dnInvoicePreview");
  const statusEl = document.getElementById("dnStatusPreview");
  const warningEl = document.getElementById("dnWarningPreview");

  if(balanceEl) balanceEl.textContent = money(balance);
  if(invoiceEl) invoiceEl.textContent = money(delivered);
  if(statusEl) statusEl.textContent = window.dnStatusLabel(balance <= 0.01 ? "full" : statusChoice);

  if(warningEl){
    if(delivered <= 0){
      warningEl.textContent = "Delivered Amount must be greater than 0.";
      warningEl.className = "status error";
    } else if(delivered > orderAmount){
      warningEl.textContent = "Delivered Amount is higher than Order Amount. Check before saving.";
      warningEl.className = "status error";
    } else if(balance > 0.01 && statusChoice === "open"){
      warningEl.textContent = "Balance remains open for future supply.";
      warningEl.className = "status ok";
    } else if(balance > 0.01){
      warningEl.textContent = "Invoice will stay on Delivered Amount only. Balance action affects status/notes only.";
      warningEl.className = "status ok";
    } else {
      warningEl.textContent = "Full delivery. Invoice will match delivered amount.";
      warningEl.className = "status ok";
    }
  }
};

window.openDNConvertModal = async function(){
  if(selectedIds.length !== 1){
    alert("Select one Order row.");
    return;
  }

  const { data, error } = await supabase.from("suppliers").select("*").eq("id", selectedIds[0]).single();
  if(error || !data){
    alert(error?.message || "Order not found.");
    return;
  }

  if(extractDeliveryNoteNo(data)){
    alert("Delivery Note already exists.");
    return;
  }

  if(String(data.invoice_no || "").trim()){
    alert("Invoice already exists. Cannot create Delivery Note.");
    return;
  }

  window.__dnConvertRow = data;
  const orderAmount = orderGrossAmount(data);

  document.getElementById("dnConvertModal")?.remove();

  const modal = document.createElement("div");
  modal.id = "dnConvertModal";
  modal.className = "modal show";

  modal.innerHTML = `
    <div class="modal-box" style="max-width:820px">
      <div class="window-bar">
        <button class="window-btn red" onclick="window.closeDNConvertModal()"></button>
        <button class="window-btn yellow"></button>
        <button class="window-btn green"></button>
      </div>

      <div class="modal-head">
        <h3>Convert Order → Delivery Note</h3>
        <button class="close-plain" onclick="window.closeDNConvertModal()">Close</button>
      </div>

      <div class="form-grid">
        <label><span>Supplier</span><input class="dark" readonly value="${esc(data.supplier || "")}"></label>
        <label><span>Order No</span><input class="dark" readonly value="${esc(data.order_no || "")}"></label>
        <label><span>Project</span><input class="dark" readonly value="${esc(data.project || "")}"></label>

        <label><span>Order Amount</span><input class="dark" readonly value="${orderAmount.toFixed(2)}"></label>
        <label><span>Delivered Amount</span><input class="dark" id="dnDeliveredAmount" type="number" step="0.01" value="${orderAmount.toFixed(2)}" oninput="window.refreshDNConvertPreview()"></label>
        <label><span>Balance Action</span>
          <select class="dark" id="dnCloseStatus" onchange="window.refreshDNConvertPreview()">
            <option value="open">Open - keep balance open</option>
            <option value="close">Close Balance</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="cancelled">Cancelled Balance</option>
            <option value="credit">Credit Note</option>
          </select>
        </label>

        <label class="full"><span>Description</span><input class="dark" readonly value="${esc(data.description || "")}"></label>
      </div>

      <hr class="sep">

      <div class="stats" style="grid-template-columns:repeat(3,1fr)">
        <div class="stat"><div class="label">Balance After DN</div><div id="dnBalancePreview" class="value money-red">R 0.00</div></div>
        <div class="stat"><div class="label">Future Invoice</div><div id="dnInvoicePreview" class="value money-blue">R 0.00</div></div>
        <div class="stat"><div class="label">Status</div><div id="dnStatusPreview" class="value money-gold">Delivered</div></div>
      </div>

      <div id="dnWarningPreview" class="status ok"></div>

      <div class="helper">
        Rule: Invoice is copied from Delivered Amount only. Balance Closed / Credit / Cancelled / Out of Stock affect only status and notes.
      </div>

      <div class="modal-actions">
        <button onclick="window.closeDNConvertModal()">Cancel</button>
        <button class="primary" onclick="window.saveSmartDNConvert()">Create Delivery Note</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  window.refreshDNConvertPreview();
};

window.saveSmartDNConvert = async function(){
  const row = window.__dnConvertRow;
  if(!row) return alert("No Order selected.");

  const orderAmount = orderGrossAmount(row);
  const delivered = Number(document.getElementById("dnDeliveredAmount")?.value || 0);
  const action = document.getElementById("dnCloseStatus")?.value || "open";
  const balance = Math.max(0, orderAmount - delivered);

  if(delivered <= 0){
    alert("Delivered Amount must be greater than 0.");
    return;
  }

  if(delivered > orderAmount && !confirm("Delivered Amount is higher than Order Amount. Continue?")){
    return;
  }

  const nextDN = await window.nextDeliveryNoteNo();

  let notes = upsertDeliveryNoteTag(row.notes || "", nextDN);
  notes = upsertNoteTag(notes, "DNAMT", delivered.toFixed(2));

  let status = "Delivered";
  let closeReason = "";

  if(balance > 0.01){
    status = window.dnStatusLabel(action);
    if(action !== "open"){
      closeReason = window.dnStatusLabel(action);
    }
  }

  if(closeReason){
    notes = upsertNoteTag(notes, "CLOSE", closeReason);
    if(action === "credit"){
      notes = upsertNoteTag(notes, "CREDIT", balance.toFixed(2));
    } else {
      notes = upsertNoteTag(notes, "CANCELAMT", balance.toFixed(2));
    }
  }

  const { error } = await supabase.from("suppliers").update({
    notes,
    status,
    entry_type: "order"
  }).eq("id", row.id);

  if(error){
    alert(error.message);
    return;
  }

  selectedIds = [];
  window.closeDNConvertModal();

  alert(
    "Delivery Note created: " + nextDN + "\n" +
    "Delivered: " + money(delivered) + "\n" +
    "Balance: " + money(balance) + "\n" +
    "Status: " + status
  );

  if(typeof render === "function") await render();
};

window.convertOrderToDN = window.openDNConvertModal;


/* === V87.41 TRANSPARENCY REPORTS === */
window.transparencyMetrics = function(rows){
  let order=0, delivered=0, invoiced=0, openBalance=0, credit=0, cancelled=0, issues=0;
  (rows||[]).forEach(r=>{
    const orderAmt = orderGrossAmount(r);
    const del = extractDeliveredAmount(r);
    const inv = String(r.invoice_no||"").trim() ? invoiceDisplayAmount(r) : 0;
    const bal = orderRemainingBalance(r);
    const cred = extractCreditAmount(r);
    const cancel = extractCancelledAmount(r);
    const hasDN = !!extractDeliveryNoteNo(r);
    const hasInv = !!String(r.invoice_no||"").trim();

    order += orderAmt;
    delivered += del || 0;
    invoiced += inv;
    openBalance += bal;
    credit += cred;
    cancelled += cancel;

    if(hasInv && !hasDN) issues++;
    if(hasDN && hasInv && del > 0 && Math.abs(inv - del) > 0.01) issues++;
  });
  return {order, delivered, invoiced, openBalance, credit, cancelled, issues};
};

window.rowAuditStatus = function(r){
  const hasDN = !!extractDeliveryNoteNo(r);
  const hasInv = !!String(r.invoice_no||"").trim();
  const del = extractDeliveredAmount(r);
  const inv = invoiceDisplayAmount(r);
  const bal = orderRemainingBalance(r);
  const closure = extractCloseReason(r);

  if(hasInv && !hasDN) return "CRITICAL: Invoice without DN";
  if(hasDN && hasInv && del > 0 && Math.abs(inv-del) > 0.01) return "Mismatch Invoice/DN";
  if(hasDN && bal > 0.01 && !closure) return "Open Balance";
  if(closure) return closure;
  if(hasDN && !hasInv) return "Awaiting Invoice";
  if(!hasDN && !hasInv) return "Order Open";
  return "OK";
};

window.injectTransparencyDashboard = async function(){
  document.getElementById("transparencyDashboard")?.remove();
  let rows = [];
  try{ rows = await getEntries(); }catch(e){ rows = window.lastEntries || []; }
  const m = window.transparencyMetrics(rows);
  const panel = document.querySelector(".panel");
  if(!panel) return;

  const box = document.createElement("div");
  box.id = "transparencyDashboard";
  box.className = "card";
  box.style.margin = "0 0 14px 0";
  box.innerHTML = `
<h2 style="margin-bottom:15px;">Financial Status</h2>

<div style="display:flex;gap:15px;margin-bottom:15px;flex-wrap:wrap;">
  <div class="card"><div>Orders</div><b style="color:#6ea8ff">${moneyFmt(totals.order)}</b></div>
  <div class="card"><div>Delivered</div><b style="color:#4cd964">${moneyFmt(totals.delivered)}</b></div>
  <div class="card"><div>Invoiced</div><b style="color:#f5c542">${moneyFmt(totals.invoiced)}</b></div>
  <div class="card"><div>Open</div><b style="color:${totals.balance>0?'#ff6b6b':'#4cd964'}">${moneyFmt(totals.balance)}</b></div>
</div>

<div class="card fs-project-bubble">
  
</div>
`;
  panel.prepend(box);
};

const __oldRenderV41 = render;
render = async function(){
  const result = await __oldRenderV41.apply(this, arguments);
  setTimeout(window.injectTransparencyDashboard, 180);
  return result;
};

window.printTransparencyReport = async function(){
  const rows = await getEntries();
  const m = window.transparencyMetrics(rows);
  const w = window.open("", "_blank");
  if(!w){ alert("Please allow pop-ups."); return; }

  const body = rows.map(r=>`
    <tr>
      <td>${esc(localDateFromAnyV97(r.created_at))}</td>
      <td>${esc(r.supplier||"")}</td>
      <td>${esc(r.project||"")}</td>
      <td>${esc(r.order_no||"")}</td>
      <td>${esc(extractDeliveryNoteNo(r)||"")}</td>
      <td>${esc(r.invoice_no||"")}</td>
      <td>${money(orderGrossAmount(r))}</td>
      <td>${money(extractDeliveredAmount(r))}</td>
      <td>${money(String(r.invoice_no||"").trim() ? invoiceDisplayAmount(r) : 0)}</td>
      <td>${money(orderRemainingBalance(r))}</td>
      <td>${money(extractCreditAmount(r))}</td>
      <td>${money(extractCancelledAmount(r))}</td>
      <td>${esc(extractCloseReason(r)||"")}</td>
      <td>${esc(window.rowAuditStatus(r))}</td>
    </tr>`).join("");

  w.document.write(`<html><head><title>Transparency Report</title>
<style>
  html, body {
    background: #ffffff !important;
    color: #111111 !important;
    -webkit-text-size-adjust: 100%;
  }
  body {
    font-family: Arial, Helvetica, sans-serif !important;
    padding: 18px !important;
    margin: 0 !important;
  }
  h1, h2, h3, p, div, span, td, th {
    color: #111111 !important;
  }
  table {
    width: 100% !important;
    border-collapse: collapse !important;
    background: #ffffff !important;
    color: #111111 !important;
  }
  th {
    background: #edf2ff !important;
    color: #111111 !important;
    font-weight: 800 !important;
  }
  td {
    background: #ffffff !important;
    color: #111111 !important;
  }
  th, td {
    border: 1px solid #cfd6e4 !important;
    padding: 7px !important;
    font-size: 12px !important;
  }
  .cards, .summary {
    color: #111111 !important;
  }
  .card {
    background: #f7f8fb !important;
    color: #111111 !important;
    border: 1px solid #d9dee8 !important;
    border-radius: 12px !important;
    padding: 10px !important;
    margin: 6px !important;
    display: inline-block !important;
  }
  .report-back-btn {
    position: sticky;
    top: 0;
    z-index: 99999;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    padding: 10px 16px;
    margin: 0 0 14px 0;
    border-radius: 14px;
    border: 1px solid #d2ad83;
    background: linear-gradient(145deg, #e4c9a7 0%, #d2ad83 44%, #bb9061 100%);
    color: #111 !important;
    font-weight: 900;
    text-decoration: none;
    cursor: pointer;
  }
  @media (max-width: 820px) {
    body { padding: 12px !important; }
    h1 { font-size: 22px !important; }
    table { min-width: 980px !important; }
    .report-table-wrap {
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
      width: 100% !important;
    }
    th, td { font-size: 11px !important; padding: 6px !important; }
  }
  @media print {
    .report-back-btn { display:none !important; }
    body { padding: 0 !important; }
  }
</style>

<style>
  html, body {
    background: #ffffff !important;
    color: #111111 !important;
    -webkit-text-size-adjust: 100%;
  }
  body {
    font-family: Arial, Helvetica, sans-serif !important;
    padding: 18px !important;
    margin: 0 !important;
  }
  h1, h2, h3, p, div, span, td, th {
    color: #111111 !important;
  }
  table {
    width: 100% !important;
    border-collapse: collapse !important;
    background: #ffffff !important;
    color: #111111 !important;
  }
  th {
    background: #edf2ff !important;
    color: #111111 !important;
    font-weight: 800 !important;
  }
  td {
    background: #ffffff !important;
    color: #111111 !important;
  }
  th, td {
    border: 1px solid #cfd6e4 !important;
    padding: 7px !important;
    font-size: 12px !important;
  }
  .cards, .summary {
    color: #111111 !important;
  }
  .card {
    background: #f7f8fb !important;
    color: #111111 !important;
    border: 1px solid #d9dee8 !important;
    border-radius: 12px !important;
    padding: 10px !important;
    margin: 6px !important;
    display: inline-block !important;
  }
  .report-back-btn {
    position: sticky;
    top: 0;
    z-index: 99999;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    padding: 10px 16px;
    margin: 0 0 14px 0;
    border-radius: 14px;
    border: 1px solid #d2ad83;
    background: linear-gradient(145deg, #e4c9a7 0%, #d2ad83 44%, #bb9061 100%);
    color: #111 !important;
    font-weight: 900;
    text-decoration: none;
    cursor: pointer;
  }
  @media (max-width: 820px) {
    body { padding: 12px !important; }
    h1 { font-size: 22px !important; }
    table { min-width: 980px !important; }
    .report-table-wrap {
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
      width: 100% !important;
    }
    th, td { font-size: 11px !important; padding: 6px !important; }
  }
  @media print {
    .report-back-btn { display:none !important; }
    body { padding: 0 !important; }
  }
</style>

    <style>body{font-family:Arial;padding:24px;color:#111}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0}.card{border:1px solid #ddd;border-radius:12px;padding:10px}.k{font-size:12px;color:#666}.v{font-size:18px;font-weight:bold}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #ddd;padding:6px;text-align:left}th{background:#f1f1f1}</style>
    
<style>
/* SAFE UI ONLY - NO JS TOUCH */

body {
  background: #0f0f10;
}

/* cards polish */
.card {
  border-radius: 18px !important;
  border: 1px solid rgba(255,255,255,0.08) !important;
  background: rgba(255,255,255,0.03) !important;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

/* headings */
h2, .section-title {
  font-weight: 900 !important;
  color: #ffffff !important;
}

/* KPI colors */
.green { color: #4cd964 !important; }
.red { color: #ff6b6b !important; }
.blue { color: #6ea8ff !important; }
.yellow { color: #f5c542 !important; }

/* top header spacing */
header, .topbar, .app-header {
  padding: 12px 20px !important;
}

/* small daily inline (visual only placeholder) */
.logo::after {
  content: "  |  LIVE";
  color: #d9b991;
  font-size: 12px;
  margin-left: 10px;
}

</style>



<style id="v84-bubble-size-and-financial-card">
/* V84 UI-only: reduce app bubbles by 20% and polish Project BLU card. Login/auth untouched. */
#app .shell > header.card,
#app .shell > section.panel{
  border-radius: 26px !important;
  padding: 22px !important;
}
#app .shell .card,
#app .shell .panel,
#app .shell .stat,
#app .shell .alert-card,
#app .shell .fs-card,
#app #safeFinancialStatus .card{
  border-radius: 22px !important;
}
#app .shell .stat{
  min-height: 112px !important;
  padding: 19px !important;
}
#app .shell .stat::after{
  width: 56px !important;
  height: 56px !important;
  right: 18px !important;
  top: 18px !important;
}
#app .shell .alert-card{
  min-height: 76px !important;
  padding: 14px !important;
}
#app .shell .stats{
  gap: 17px !important;
  margin-bottom: 19px !important;
}
#app .shell .toolbar{
  gap: 10px !important;
}
#app .shell button,
#app .shell .main-action,
#app .shell .month-btn,
#app .shell select.dark,
#app .shell input.dark{
  border-radius: 15px !important;
}
#app .shell .main-action,
#app .shell button{
  min-height: 42px !important;
  padding: 10px 14px !important;
}
#app .shell .label,
#app .shell .stat .label{
  font-size: 14px !important;
  margin-bottom: 9px !important;
}
#app .shell .value,
#app .shell .stat .value{
  font-size: 22px !important;
}
#app #safeFinancialStatus,
#app .safe-financial-status,
#app #financialStatus,
#app .financial-status,
#app .fs-wrap{
  padding: 24px !important;
  border-radius: 27px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"]{
  gap: 12px !important;
  margin-bottom: 16px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"] > .card{
  padding: 14px !important;
  min-height: 78px !important;
  min-width: 160px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"] .card div{
  font-size: 12px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"] .card b{
  font-size: 19px !important;
}
#app .fs-project-bubble{
  margin-top: 10px !important;
  padding: 18px 20px !important;
  border-radius: 24px !important;
  background:
    radial-gradient(circle at 92% 22%, rgba(227,191,140,.15), transparent 26%),
    linear-gradient(180deg, rgba(255,255,255,.065), rgba(255,255,255,.018)) !important;
  border: 1px solid rgba(227,191,140,.22) !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 12px 30px rgba(0,0,0,.22) !important;
}
#app .fs-project-head{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:12px;
  padding-bottom: 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(255,255,255,.08);
}
#app .fs-project-label{
  color:#c9b18d;
  font-size:12px;
  font-weight:800;
  letter-spacing:.08em;
  text-transform:uppercase;
}
#app .fs-project-bubble h3{
  margin:0 !important;
  font-size:24px !important;
  color:#fff !important;
  line-height:1.05 !important;
}
#app .fs-project-bubble > div:not(.fs-project-head){
  display:flex;
  justify-content:space-between;
  gap:18px;
  align-items:center;
  padding: 5px 0;
  font-size:15px !important;
  color:#d8dce6;
}
#app .fs-project-bubble b{
  font-size:16px !important;
}
@media(max-width:720px){
  #app .shell > header.card,
  #app .shell > section.panel{padding:16px !important;border-radius:23px !important;}
  #app .shell .stats{grid-template-columns:repeat(2,minmax(0,1fr)) !important;gap:11px !important;}
  #app .shell .stat{min-height:94px !important;padding:14px !important;border-radius:19px !important;}
  #app .shell .value,#app .shell .stat .value{font-size:19px !important;}
  #app #safeFinancialStatus,.safe-financial-status,#financialStatus,.financial-status,.fs-wrap{padding:18px !important;border-radius:23px !important;}
  #app #safeFinancialStatus > div[style*="display:flex"] > .card{min-width:130px !important;}
  #app .fs-project-bubble{padding:15px !important;border-radius:20px !important;}
}
</style>





<style id="remove-project-dashboard-v105">
/* V105: fully hide Project dashboard/card block. Login/auth untouched. */
#project-status,
#project-financial-status,
#projectDashboard,
#project-dashboard,
#projectCard,
#project-card,
#projects,
#projects-dashboard,
.project-status,
.project-financial-status,
.project-dashboard,
.project-card,
.project-summary-card,
.project-financial-card,
.projects-card,
.projects-dashboard,
.card.project,
.panel.project,
section.project,
div[data-section="project"],
div[data-card="project"],
div[data-title="PROJECT"],
div[data-title="Project"] {
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
  min-height: 0 !important;
  max-height: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
}

/* Hide the specific legacy block by content structure when present */
.financial-project-card,
.financial-project-panel,
.project-breakdown,
.project-breakdown-card,
.project-kpi-card {
  display: none !important;
}
</style>



<style id="v111-deposit-paid-lock">
/* Deposit status locked as Paid; login/auth untouched. */
.deposit-paid-locked { pointer-events:none; opacity:.75; }
</style>


<style id="v112-deposit-hard-lock">
/* V112: Deposit status is hard-locked to Paid and hidden. Login/auth untouched. */
#entryStatusWrap[style*="display: none"] { display:none !important; }
#entryStatus:disabled { pointer-events:none !important; opacity:.7 !important; }
</style>


<style id="v113-deposit-display">
/* V113: Deposit displayed as separate type, not Order. Login/auth untouched. */
.table-wrap .status-deposit,
.table-wrap .kind-deposit,
.badge.deposit {
  color:#111 !important;
  border-color:rgba(217,185,145,.34) !important;
  background:linear-gradient(145deg, #e4c9a7 0%, #d2ad83 44%, #bb9061 100%) !important;
}
</style>


<style id="v119-cosmetic-buttons">
/* V119 cosmetic buttons only. Login/auth/logic untouched. */

/* Add Deposit: close to Invoice gold, but slightly more copper/rose-gold */
button.add-deposit-btn,
#app button.add-deposit-btn {
  background:
    radial-gradient(circle at 22% 15%, rgba(255,255,255,.34), transparent 24%),
    linear-gradient(135deg, #f2d0a2 0%, #d7a56f 46%, #b9814f 100%) !important;
  color: #121212 !important;
  border: 1px solid rgba(255,222,176,.75) !important;
  font-weight: 900 !important;
  letter-spacing: .01em !important;
  box-shadow:
    0 10px 24px rgba(217,165,111,.22),
    inset 0 1px 0 rgba(255,255,255,.38) !important;
}
button.add-deposit-btn:hover,
#app button.add-deposit-btn:hover {
  filter: brightness(1.08) saturate(1.05) !important;
  transform: translateY(-1px) !important;
}

/* Delete Selected: designed red button with black text */
button.delete-selected-btn,
#app button.delete-selected-btn {
  background:
    radial-gradient(circle at 20% 14%, rgba(255,255,255,.24), transparent 26%),
    linear-gradient(135deg, #ff7373 0%, #e13737 45%, #a90000 100%) !important;
  color: #050505 !important;
  border: 1px solid rgba(255,80,80,.85) !important;
  font-weight: 950 !important;
  letter-spacing: .01em !important;
  text-shadow: none !important;
  box-shadow:
    0 10px 24px rgba(255,0,0,.20),
    inset 0 1px 0 rgba(255,255,255,.30) !important;
}
button.delete-selected-btn:hover,
#app button.delete-selected-btn:hover {
  filter: brightness(1.08) saturate(1.08) !important;
  transform: translateY(-1px) !important;
}
</style>


<style id="v121-header-daily-premium-layout">
/* V121: Premium header / logo / daily spacing only. Login/auth/logic untouched. */

#app .brand {
  align-items: center !important;
  gap: 22px !important;
}

#app .brand-left {
  display: grid !important;
  grid-template-columns: auto 1fr !important;
  align-items: center !important;
  column-gap: 22px !important;
  row-gap: 12px !important;
  width: 100% !important;
}

#app .logo {
  width: 72px !important;
  height: 72px !important;
  min-width: 72px !important;
  border-radius: 22px !important;
  font-size: 34px !important;
  box-shadow:
    0 14px 32px rgba(217,185,145,.22),
    inset 0 1px 0 rgba(255,255,255,.38) !important;
}

#app .logo::after {
  content: "LIVE" !important;
  position: absolute !important;
  right: -12px !important;
  bottom: 10px !important;
  font-size: 11px !important;
  color: rgba(255,255,255,.38) !important;
  letter-spacing: .05em !important;
  margin: 0 !important;
}

#app .title {
  font-size: clamp(34px, 4.2vw, 56px) !important;
  line-height: .95 !important;
  letter-spacing: -.04em !important;
  margin-bottom: 6px !important;
}

#app .brand-subtitle {
  font-size: 18px !important;
  color: #e5c79e !important;
  margin-bottom: 18px !important;
}

#app .daily-header-bar {
  display: grid !important;
  grid-template-columns: minmax(190px, auto) repeat(3, minmax(170px, auto)) !important;
  gap: 14px !important;
  align-items: stretch !important;
  margin: 14px 0 16px !important;
  max-width: 920px !important;
}

#app .daily-chip {
  min-height: 74px !important;
  border-radius: 22px !important;
  padding: 14px 18px !important;
  background:
    radial-gradient(circle at 18% 16%, rgba(255,255,255,.13), transparent 30%),
    linear-gradient(145deg, rgba(255,255,255,.085), rgba(255,255,255,.025)) !important;
  border: 1px solid rgba(217,185,145,.22) !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.075),
    0 12px 28px rgba(0,0,0,.20) !important;
}

#app .daily-chip.daily-title {
  background:
    radial-gradient(circle at 18% 16%, rgba(255,255,255,.22), transparent 30%),
    linear-gradient(135deg, rgba(217,185,145,.32), rgba(86,66,44,.18)) !important;
}

#app .daily-label {
  display: block !important;
  font-size: 13px !important;
  line-height: 1 !important;
  font-weight: 950 !important;
  letter-spacing: .08em !important;
  color: #d9c2a1 !important;
  text-transform: uppercase !important;
  margin-bottom: 9px !important;
  white-space: nowrap !important;
}

#app .daily-value {
  display: block !important;
  font-size: 24px !important;
  line-height: 1.05 !important;
  font-weight: 950 !important;
  color: #ffffff !important;
  letter-spacing: -.02em !important;
  white-space: nowrap !important;
}

#app .userbar {
  margin-top: 10px !important;
  display: flex !important;
  gap: 12px !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  font-size: 22px !important;
}

#app .role-badge {
  padding: 7px 18px !important;
  border-radius: 999px !important;
  font-size: 17px !important;
  font-weight: 950 !important;
}

#app header.card {
  padding-top: 30px !important;
  padding-bottom: 28px !important;
}

#app header.card .toolbar {
  margin-top: 26px !important;
}

/* Tablet / laptop narrow */
@media (max-width: 1050px) {
  #app .daily-header-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    max-width: 760px !important;
  }
}

/* Mobile */
@media (max-width: 720px) {
  #app .brand-left {
    grid-template-columns: 1fr !important;
    justify-items: center !important;
    text-align: center !important;
    gap: 14px !important;
  }

  #app .logo {
    width: 64px !important;
    height: 64px !important;
    min-width: 64px !important;
    font-size: 30px !important;
  }

  #app .title {
    font-size: 38px !important;
  }

  #app .brand-subtitle {
    font-size: 15px !important;
    margin-bottom: 14px !important;
  }

  #app .daily-header-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 10px !important;
    margin: 12px auto 14px !important;
    width: 100% !important;
  }

  #app .daily-chip {
    min-height: 66px !important;
    padding: 12px 14px !important;
    border-radius: 18px !important;
  }

  #app .daily-label {
    font-size: 11px !important;
    margin-bottom: 7px !important;
  }

  #app .daily-value {
    font-size: 19px !important;
  }

  #app .userbar {
    justify-content: center !important;
    font-size: 17px !important;
  }
}
</style>


<style id="v122-header-scale-50">
/* Reduce header elements to ~50% without changing layout */

#app .logo {
  width: 48px !important;
  height: 48px !important;
  min-width: 48px !important;
  font-size: 22px !important;
}

#app .title {
  font-size: 28px !important;
}

#app .brand-subtitle {
  font-size: 13px !important;
  margin-bottom: 8px !important;
}

#app .daily-chip {
  min-height: 44px !important;
  padding: 8px 12px !important;
  border-radius: 14px !important;
}

#app .daily-label {
  font-size: 10px !important;
  margin-bottom: 4px !important;
}

#app .daily-value {
  font-size: 15px !important;
}

#app .daily-header-bar {
  gap: 8px !important;
  margin: 6px 0 8px !important;
}

#app .userbar {
  font-size: 14px !important;
}

#app .role-badge {
  font-size: 12px !important;
  padding: 4px 10px !important;
}

#app header.card {
  padding-top: 14px !important;
  padding-bottom: 12px !important;
}
</style>


<style id="v127-button-colors">
/* Gold buttons like Order */
button[onclick*="convertOrderToDN"],
button[onclick*="convertOrderToInvoice"] {
  background: linear-gradient(135deg, #f2d3a0, #d4a65a) !important;
  color: #000 !important;
  font-weight: 700;
  border: 1px solid rgba(255,215,150,0.6);
  box-shadow: 0 6px 16px rgba(212,166,90,0.25);
}

button[onclick*="convertOrderToDN"]:hover,
button[onclick*="convertOrderToInvoice"]:hover {
  filter: brightness(1.05);
}

/* Softer red for delete */
button.delete-selected-btn {
  background: linear-gradient(135deg, #e06666, #a83232) !important;
  color: #000 !important;
  border: 1px solid rgba(200,80,80,0.6);
  box-shadow: 0 4px 12px rgba(160,50,50,0.25);
}

button.delete-selected-btn:hover {
  filter: brightness(1.05);
}
</style>


<style id="v128-gold-match-animation">
/* Match exact system gold (same tone as Order badge) */
button[onclick*="convertOrderToDN"],
button[onclick*="convertOrderToInvoice"] {
  background: linear-gradient(145deg, #e4c9a7 0%, #d2ad83 44%, #bb9061 100%) !important;
  color: #000 !important;
  border: 1px solid rgba(217,185,145,.45) !important;
  font-weight: 800;
  box-shadow:
    0 6px 18px rgba(187,144,97,.25),
    inset 0 1px 0 rgba(255,255,255,.35);
  transition: all 0.18s ease;
}

/* Hover glow animation (keyboard + mouse focus) */
button[onclick*="convertOrderToDN"]:hover,
button[onclick*="convertOrderToInvoice"]:hover,
button[onclick*="convertOrderToDN"]:focus,
button[onclick*="convertOrderToInvoice"]:focus {
  filter: brightness(1.12);
  box-shadow:
    0 0 0 2px rgba(217,185,145,.35),
    0 8px 22px rgba(187,144,97,.35),
    inset 0 1px 0 rgba(255,255,255,.45);
  transform: translateY(-1px);
}

/* Softer delete (keep elegant) */
button.delete-selected-btn {
  background: linear-gradient(145deg, #d97a7a 0%, #b84a4a 50%, #7a1f1f 100%) !important;
  color: #000 !important;
  border: 1px solid rgba(200,120,120,.5);
  transition: all 0.18s ease;
}

button.delete-selected-btn:hover,
button.delete-selected-btn:focus {
  filter: brightness(1.08);
  box-shadow:
    0 0 0 2px rgba(200,100,100,.25),
    0 8px 20px rgba(120,30,30,.3);
  transform: translateY(-1px);
}
</style>


<style id="v129-global-button-ux">
button {
  transition: all 0.15s ease;
  position: relative;
}

button:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
}

button:focus {
  outline: none;
  box-shadow:
    0 0 0 2px rgba(217,185,145,.35),
    0 6px 16px rgba(0,0,0,.25);
}

button:active {
  transform: translateY(1px) scale(0.97);
  box-shadow:
    inset 0 3px 8px rgba(0,0,0,.35);
}

button::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.2s ease;
  background: radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 60%);
}

button:active::after {
  opacity: 1;
}
</style>


<meta name="theme-color" content="#080808">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Vardophase">


<style id="v131-iphone-css-only-login-safe">
/* V131 iPhone CSS-only. No JS, no service worker, login/auth untouched. */

html, body {
  -webkit-text-size-adjust: 100%;
}

button,
select,
input,
textarea,
.month-btn,
.nav-pill {
  min-height: 44px;
  touch-action: manipulation;
}

@media (max-width: 820px) {
  body {
    padding: 8px !important;
  }

  #app .shell {
    padding: 8px 8px calc(80px + env(safe-area-inset-bottom)) !important;
    max-width: 100% !important;
  }

  #app header.card,
  #app section.panel,
  #app .card,
  #app .panel {
    border-radius: 20px !important;
  }

  #app header.card {
    padding: 12px !important;
  }

  #app .brand-left {
    display: grid !important;
    grid-template-columns: auto 1fr !important;
    gap: 10px !important;
    text-align: left !important;
    align-items: center !important;
  }

  #app .logo {
    width: 44px !important;
    height: 44px !important;
    min-width: 44px !important;
    border-radius: 14px !important;
    font-size: 20px !important;
  }

  #app .title {
    font-size: 24px !important;
    line-height: 1 !important;
    margin: 0 !important;
  }

  #app .brand-subtitle {
    font-size: 12px !important;
    margin: 3px 0 8px !important;
  }

  #app .daily-header-bar {
    grid-column: 1 / -1 !important;
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
    margin: 8px 0 6px !important;
    width: 100% !important;
    max-width: none !important;
  }

  #app .daily-chip {
    min-height: 54px !important;
    padding: 9px 10px !important;
    border-radius: 16px !important;
  }

  #app .daily-label {
    font-size: 10px !important;
    margin-bottom: 5px !important;
  }

  #app .daily-value {
    font-size: 16px !important;
    white-space: nowrap !important;
  }

  #app .userbar {
    grid-column: 1 / -1 !important;
    font-size: 12px !important;
    gap: 6px !important;
    margin-top: 6px !important;
  }

  #app header.card .toolbar {
    display: flex !important;
    overflow-x: auto !important;
    gap: 8px !important;
    padding: 4px 2px 8px !important;
    margin-top: 10px !important;
    -webkit-overflow-scrolling: touch;
  }

  #app header.card .toolbar button {
    flex: 0 0 auto !important;
    min-width: 122px !important;
    padding: 10px 12px !important;
    border-radius: 14px !important;
    font-size: 13px !important;
  }

  #app .filters {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 8px !important;
  }

  #app .filters input,
  #app .filters select,
  #app .filters button {
    width: 100% !important;
    font-size: 16px !important;
  }

  #app .month-tools {
    display: flex !important;
    overflow-x: auto !important;
    gap: 7px !important;
    padding-bottom: 6px !important;
    -webkit-overflow-scrolling: touch;
  }

  #app .month-btn {
    flex: 0 0 auto !important;
    min-width: 58px !important;
  }

  #safeFinancialStatus > div[style*="display:flex"],
  .safe-financial-status > div[style*="display:flex"],
  #app .stats,
  #app .alert-strip {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
  }

  #safeFinancialStatus .card,
  .safe-financial-status .card,
  #app .stat,
  #app .alert-card {
    min-height: 76px !important;
    padding: 11px !important;
    border-radius: 16px !important;
  }

  #app section.panel .toolbar {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
  }

  #app section.panel .toolbar button {
    width: 100% !important;
    min-height: 48px !important;
    border-radius: 15px !important;
    font-size: 13px !important;
    padding: 10px 8px !important;
  }

  #app .table-wrap {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    border-radius: 18px !important;
    max-width: 100% !important;
  }

  #app table {
    min-width: 1180px !important;
    font-size: 12px !important;
  }

  #app th,
  #app td {
    padding: 9px 8px !important;
    white-space: nowrap !important;
  }

  #app .modal-box,
  .modal-box {
    width: 100% !important;
    max-width: 100% !important;
    max-height: 92vh !important;
    overflow-y: auto !important;
    border-radius: 22px !important;
    padding: 14px !important;
  }

  #app .form-grid {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 10px !important;
  }

  #app input.dark,
  #app select.dark,
  #app textarea.dark {
    font-size: 16px !important;
    min-height: 46px !important;
  }
}
</style>


<style id="v133-iphone-refine-only">
/* V133: based on V131. Only fixes Change Password / Logout and table scrolling. Login untouched. */

@media (max-width: 820px) {
  /* Put Change Password + Logout in a clean row instead of floating/cutting */
  #app .brand > div[style*="justify-content:flex-end"] {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
    width: 100% !important;
    margin-top: 10px !important;
  }

  #app .brand > div[style*="justify-content:flex-end"] button {
    width: 100% !important;
    min-height: 44px !important;
    border-radius: 15px !important;
    font-size: 13px !important;
    padding: 9px 10px !important;
  }

  #app .brand > div[style*="justify-content:flex-end"] button.red {
    color: #ff8b8b !important;
  }

  /* Keep header compact like V131, not huge like V132 */
  #app header.card .toolbar {
    display: flex !important;
    overflow-x: auto !important;
    gap: 8px !important;
    padding: 4px 2px 8px !important;
    margin-top: 10px !important;
    -webkit-overflow-scrolling: touch !important;
    scroll-behavior: auto !important;
  }

  #app header.card .toolbar button {
    flex: 0 0 auto !important;
    min-width: 122px !important;
  }

  /* Faster, smoother horizontal table scrolling */
  #app .table-wrap {
    overflow-x: scroll !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
    scroll-behavior: auto !important;
    overscroll-behavior-x: contain !important;
    touch-action: pan-x pan-y !important;
  }

  #app .table-wrap table {
    min-width: 1320px !important;
  }

  /* Make row touch/drag feel less heavy */
  #app .table-wrap th,
  #app .table-wrap td {
    padding: 8px 7px !important;
  }

  #app .table-wrap tbody tr {
    contain: layout paint !important;
  }
}
</style>


<style id="v134-report-mobile-dark-fix">
/* V134 report readability + mobile return fix. Login untouched. */

/* If a generated report opens in same app window, force readable report styling */
body:has(h1):has(table) {
  background: #ffffff !important;
  color: #111111 !important;
}

body:has(h1):has(table) h1,
body:has(h1):has(table) h2,
body:has(h1):has(table) div,
body:has(h1):has(table) span,
body:has(h1):has(table) td,
body:has(h1):has(table) th {
  color: #111111 !important;
}

body:has(h1):has(table) table {
  background: #ffffff !important;
  color: #111111 !important;
}

body:has(h1):has(table) th {
  background: #edf2ff !important;
  color: #111111 !important;
}

body:has(h1):has(table) td {
  background: #ffffff !important;
  color: #111111 !important;
}

@media (max-width: 820px) {
  body:has(h1):has(table) {
    padding: 12px !important;
    overflow-x: auto !important;
  }
  body:has(h1):has(table) table {
    min-width: 980px !important;
  }
}
</style>


<style id="v136-selection-fix-css">
/* V136 selection UX. Login/auth untouched. */
tr.selected {
  background: rgba(217,185,145,.16) !important;
  box-shadow: inset 4px 0 0 rgba(217,185,145,.75) !important;
}
.row-check,
.premium-check {
  width: 22px !important;
  height: 22px !important;
  accent-color: #d2ad83 !important;
  cursor: pointer !important;
}
td:has(.row-check),
td:has(.premium-check) {
  cursor: pointer !important;
}
</style>


<style id="v148-inline-reports-safe-css">
#inlineReportModal.modal.show{
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  padding:18px!important;
  z-index:99999!important;
}
.inline-report-box{
  width:min(1180px,96vw)!important;
  max-height:92vh!important;
  display:flex!important;
  flex-direction:column!important;
  overflow:hidden!important;
}
.inline-report-toolbar{
  display:flex!important;
  justify-content:space-between!important;
  align-items:center!important;
  gap:10px!important;
  padding:12px 14px!important;
  border-bottom:1px solid rgba(217,185,145,.18)!important;
}
.inline-report-actions{display:flex!important;gap:8px!important;}
#inlineReportFrame{
  width:100%!important;
  height:76vh!important;
  border:0!important;
  background:#fff!important;
  border-radius:0 0 18px 18px!important;
}
@media(max-width:820px){
  #inlineReportModal.modal.show{padding:0!important;align-items:stretch!important;}
  .inline-report-box{width:100vw!important;max-width:100vw!important;height:100vh!important;max-height:100vh!important;border-radius:0!important;}
  .inline-report-toolbar{padding:10px!important;flex-wrap:wrap!important;}
  .inline-report-actions{width:100%!important;display:grid!important;grid-template-columns:1fr 1fr!important;}
  .inline-report-actions button{width:100%!important;min-height:44px!important;}
  #inlineReportFrame{height:calc(100vh - 112px)!important;border-radius:0!important;}
}
</style>


<style id="v168-dn-approver-css">
/* V168 DN Approver limited role - no login changes */

/* Hide financial cells/columns from the table */
body.role-dn-approver table th:nth-child(8),
body.role-dn-approver table td:nth-child(8),
body.role-dn-approver table th:nth-child(9),
body.role-dn-approver table td:nth-child(9),
body.role-dn-approver table th:nth-child(14),
body.role-dn-approver table td:nth-child(14),
body.role-dn-approver table th:nth-child(15),
body.role-dn-approver table td:nth-child(15),
body.role-dn-approver table th:nth-child(16),
body.role-dn-approver table td:nth-child(16),
body.role-dn-approver table th:nth-child(17),
body.role-dn-approver table td:nth-child(17),
body.role-dn-approver table th:nth-child(18),
body.role-dn-approver table td:nth-child(18),
body.role-dn-approver table th:nth-child(19),
body.role-dn-approver table td:nth-child(19) {
  display: none !important;
}

/* Hide money/cards/status financial overview */
body.role-dn-approver .stat,
body.role-dn-approver .stats,
body.role-dn-approver .alert-strip,
body.role-dn-approver #safeFinancialStatus,
body.role-dn-approver .safe-financial-status,
body.role-dn-approver .financial-status,
body.role-dn-approver .credit-statement {
  display: none !important;
}

/* Hide all action/report/admin buttons except Convert Order -> DN and filters/search */
body.role-dn-approver button[onclick*="Invoice"],
body.role-dn-approver button[onclick*="invoice"],
body.role-dn-approver button[onclick*="Deposit"],
body.role-dn-approver button[onclick*="deposit"],
body.role-dn-approver button[onclick*="Report"],
body.role-dn-approver button[onclick*="report"],
body.role-dn-approver button[onclick*="Audit"],
body.role-dn-approver button[onclick*="Roles"],
body.role-dn-approver button[onclick*="Settings"],
body.role-dn-approver button[onclick*="bulkDelete"],
body.role-dn-approver button[onclick*="duplicate"],
body.role-dn-approver button[onclick*="bulkMarkPaid"],
body.role-dn-approver button[onclick*="markSelected"],
body.role-dn-approver button[onclick*="openEntryModal"],
body.role-dn-approver button[onclick*="openDepositModal"] {
  display: none !important;
}

body.role-dn-approver button[onclick*="convertOrderToDN"] {
  display: inline-flex !important;
  visibility: visible !important;
}

/* Keep filters/search visible */
body.role-dn-approver .filters,
body.role-dn-approver .filters *,
body.role-dn-approver .month-tools,
body.role-dn-approver .month-tools * {
  display: revert !important;
}

/* Hide selected financial summary text */
body.role-dn-approver .money-gold,
body.role-dn-approver .money-red,
body.role-dn-approver .money-blue,
body.role-dn-approver .money-green,
body.role-dn-approver .money-amber {
  display: none !important;
}
</style>


<style id="v169-dn-approver-dropdown-label">
/* V169: role dropdown includes DN Approver. Login untouched. */
</style>

</head><body><button class="report-back-btn" onclick="if(window.opener){window.close()}else{history.back()}">← Back to Dashboard</button><h1>VARDOPHASE Transparency Report</h1><div>Generated: ${new Date().toLocaleString()}</div>
    <div class="cards">
      <div class="card"><div class="k">Orders</div><div class="v">${money(m.order)}</div></div>
      <div class="card"><div class="k">Delivered</div><div class="v">${money(m.delivered)}</div></div>
      <div class="card"><div class="k">Invoiced</div><div class="v">${money(m.invoiced)}</div></div>
      <div class="card"><div class="k">Open Balance</div><div class="v">${money(m.openBalance)}</div></div>
      <div class="card"><div class="k">Credit</div><div class="v">${money(m.credit)}</div></div>
      <div class="card"><div class="k">Cancelled / Closed</div><div class="v">${money(m.cancelled)}</div></div>
      <div class="card"><div class="k">Issues</div><div class="v">${m.issues}</div></div>
    </div>
    <div class="report-table-wrap"><table><thead><tr><th>Date</th><th>Supplier</th><th>Project</th><th>Order</th><th>DN</th><th>Invoice</th><th>Order Amount</th><th>Delivered</th><th>Invoiced</th><th>Open Balance</th><th>Credit</th><th>Cancelled</th><th>Closure</th><th>Audit</th></tr></thead><tbody>${body}</tbody></table>
    <script>window.onload=()=>window.print()<\/script>




</body></html>`);
  w.document.close();
};

window.printProjectTransparencyReport = async function(){
  const rows = await getEntries();
  const map = {};
  rows.forEach(r=>{
    const p = r.project || "No Project";
    if(!map[p]) map[p] = [];
    map[p].push(r);
  });
  const w = window.open("", "_blank");
  if(!w){ alert("Please allow pop-ups."); return; }

  const sections = Object.entries(map).map(([project,list])=>{
    const m = window.transparencyMetrics(list);
    const lines = list.map(r=>`<tr><td>${esc(r.supplier||"")}</td><td>${esc(r.order_no||"")}</td><td>${esc(extractDeliveryNoteNo(r)||"")}</td><td>${esc(r.invoice_no||"")}</td><td>${money(orderGrossAmount(r))}</td><td>${money(extractDeliveredAmount(r))}</td><td>${money(String(r.invoice_no||"").trim()?invoiceDisplayAmount(r):0)}</td><td>${money(orderRemainingBalance(r))}</td><td>${money(extractCreditAmount(r))}</td><td>${esc(window.rowAuditStatus(r))}</td></tr>`).join("");
    return `<h2>${esc(project)}</h2><div class="summary">Orders ${money(m.order)} | Delivered ${money(m.delivered)} | Invoiced ${money(m.invoiced)} | Open ${money(m.openBalance)} | Credit ${money(m.credit)} | Issues ${m.issues}</div><div class="report-table-wrap"><table><thead><tr><th>Supplier</th><th>Order</th><th>DN</th><th>Invoice</th><th>Order</th><th>Delivered</th><th>Invoiced</th><th>Open Balance</th><th>Credit</th><th>Audit</th></tr></thead><tbody>${lines}</tbody></table>`;
  }).join("");

  w.document.write(`<html><head><title>Project Transparency</title>
<style>
  html, body {
    background: #ffffff !important;
    color: #111111 !important;
    -webkit-text-size-adjust: 100%;
  }
  body {
    font-family: Arial, Helvetica, sans-serif !important;
    padding: 18px !important;
    margin: 0 !important;
  }
  h1, h2, h3, p, div, span, td, th {
    color: #111111 !important;
  }
  table {
    width: 100% !important;
    border-collapse: collapse !important;
    background: #ffffff !important;
    color: #111111 !important;
  }
  th {
    background: #edf2ff !important;
    color: #111111 !important;
    font-weight: 800 !important;
  }
  td {
    background: #ffffff !important;
    color: #111111 !important;
  }
  th, td {
    border: 1px solid #cfd6e4 !important;
    padding: 7px !important;
    font-size: 12px !important;
  }
  .cards, .summary {
    color: #111111 !important;
  }
  .card {
    background: #f7f8fb !important;
    color: #111111 !important;
    border: 1px solid #d9dee8 !important;
    border-radius: 12px !important;
    padding: 10px !important;
    margin: 6px !important;
    display: inline-block !important;
  }
  .report-back-btn {
    position: sticky;
    top: 0;
    z-index: 99999;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    padding: 10px 16px;
    margin: 0 0 14px 0;
    border-radius: 14px;
    border: 1px solid #d2ad83;
    background: linear-gradient(145deg, #e4c9a7 0%, #d2ad83 44%, #bb9061 100%);
    color: #111 !important;
    font-weight: 900;
    text-decoration: none;
    cursor: pointer;
  }
  @media (max-width: 820px) {
    body { padding: 12px !important; }
    h1 { font-size: 22px !important; }
    table { min-width: 980px !important; }
    .report-table-wrap {
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
      width: 100% !important;
    }
    th, td { font-size: 11px !important; padding: 6px !important; }
  }
  @media print {
    .report-back-btn { display:none !important; }
    body { padding: 0 !important; }
  }
</style>
<style>body{font-family:Arial;padding:24px}.summary{font-weight:bold;margin:8px 0 10px}table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:20px}th,td{border:1px solid #ddd;padding:6px;text-align:left}th{background:#f1f1f1}
.danger-delete-btn{
  background: linear-gradient(135deg, #ff4d4d, #b00000) !important;
  color: #fff !important;
  font-weight: 800 !important;
  border: 1px solid rgba(255,80,80,.65) !important;
  box-shadow: 0 0 14px rgba(255,0,0,.28), inset 0 1px 0 rgba(255,255,255,.18) !important;
}
.danger-delete-btn:hover{
  transform: translateY(-1px);
  box-shadow: 0 0 20px rgba(255,0,0,.45), inset 0 1px 0 rgba(255,255,255,.22) !important;
}


/* === V87.42.5 Financial Status clean layout === */
.fs-wrap{
  padding:22px !important;
}
.fs-section-title{
  margin:14px 0 10px;
  font-size:18px;
  font-weight:800;
  color:#f3dfbd;
}
.fs-cards{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(300px,1fr));
  gap:14px;
  align-items:stretch;
}
.fs-card{
  border:1px solid rgba(217,185,145,.18);
  border-radius:20px;
  padding:16px;
  background:linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.015));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.05), 0 12px 28px rgba(0,0,0,.18);
}
.fs-head{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:12px;
  margin-bottom:12px;
}
.fs-type{
  font-size:12px;
  color:#a7a9b3;
  font-weight:700;
}
.fs-name{
  font-size:22px;
  font-weight:900;
  color:#fff;
  line-height:1.15;
}
.fs-balance{
  min-width:110px;
  text-align:right;
}
.fs-balance span{
  display:block;
  font-size:11px;
  color:#a7a9b3;
  font-weight:700;
}
.fs-balance strong{
  display:block;
  font-size:16px;
}
.fs-balance.bad strong{color:#ff9a9a}
.fs-balance.good strong{color:#9cffb2}
.fs-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px 14px;
  margin:12px 0;
}
.fs-grid div{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:8px;
  border-bottom:1px solid rgba(255,255,255,.07);
  padding-bottom:6px;
}
.fs-grid span{
  color:#a7a9b3;
  font-size:12px;
  font-weight:700;
}
.fs-grid b{
  color:#fff;
  font-size:13px;
  text-align:right;
}
.fs-pills{
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  margin-top:10px;
}
.fs-pill{
  border-radius:999px;
  padding:6px 9px;
  font-size:12px;
  font-weight:800;
  background:rgba(217,185,145,.13);
  color:#f3dfbd;
  border:1px solid rgba(217,185,145,.18);
}
.fs-open,.fs-partial{color:#ffb0b0;background:rgba(255,90,90,.12)}
.fs-awaiting-invoice{color:#ffd58a;background:rgba(255,190,80,.12)}
.fs-invoiced{color:#9ecbff;background:rgba(80,150,255,.12)}
.fs-closed{color:#f3dfbd;background:rgba(217,185,145,.13)}
.fs-credit{color:#9cffb2;background:rgba(90,255,130,.12)}
.fs-note{
  margin-top:10px;
  border:1px dashed rgba(217,185,145,.25);
  border-radius:16px;
  padding:14px;
  color:#a7a9b3;
  background:rgba(255,255,255,.025);
}


/* === V87.44.1 Stable Financial Status Layout === */
.fs-wrap{padding:22px !important}
.fs-section-title{margin:14px 0 10px;font-size:18px;font-weight:800;color:#f3dfbd}
.fs-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;align-items:stretch}
.fs-card{border:1px solid rgba(217,185,145,.18);border-radius:20px;padding:16px;background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.015));box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 12px 28px rgba(0,0,0,.18)}
.fs-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}
.fs-type{font-size:12px;color:#a7a9b3;font-weight:700}
.fs-name{font-size:22px;font-weight:900;color:#fff;line-height:1.15}
.fs-balance{min-width:110px;text-align:right}
.fs-balance span{display:block;font-size:11px;color:#a7a9b3;font-weight:700}
.fs-balance strong{display:block;font-size:16px}
.fs-balance.bad strong{color:#ff9a9a}.fs-balance.good strong{color:#9cffb2}
.fs-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 14px;margin:12px 0}
.fs-grid div{display:flex;justify-content:space-between;align-items:center;gap:8px;border-bottom:1px solid rgba(255,255,255,.07);padding-bottom:6px}
.fs-grid span{color:#a7a9b3;font-size:12px;font-weight:700}.fs-grid b{color:#fff;font-size:13px;text-align:right}
.fs-pills{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.fs-pill{border-radius:999px;padding:6px 9px;font-size:12px;font-weight:800;background:rgba(217,185,145,.13);color:#f3dfbd;border:1px solid rgba(217,185,145,.18)}
.fs-open,.fs-partial{color:#ffb0b0;background:rgba(255,90,90,.12)}
.fs-awaiting-invoice{color:#ffd58a;background:rgba(255,190,80,.12)}
.fs-invoiced{color:#9ecbff;background:rgba(80,150,255,.12)}
.fs-closed{color:#f3dfbd;background:rgba(217,185,145,.13)}
.fs-credit{color:#9cffb2;background:rgba(90,255,130,.12)}
.fs-note{margin-top:10px;border:1px dashed rgba(217,185,145,.25);border-radius:16px;padding:14px;color:#a7a9b3;background:rgba(255,255,255,.025)}


/* === V78 Safe Financial Status === */
.safe-financial-status{padding:22px !important;margin:0 0 14px 0 !important}
.fs-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:12px 0 18px}
.fs-summary>div{border:1px solid rgba(217,185,145,.16);border-radius:16px;padding:12px;background:rgba(255,255,255,.025)}
.fs-summary span{display:block;color:#a7a9b3;font-size:12px;font-weight:700}
.fs-summary b{display:block;color:#fff;font-size:18px;margin-top:4px}
.fs-section-title{margin:14px 0 10px;font-size:18px;font-weight:800;color:#f3dfbd}
.fs-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}
.fs-card{border:1px solid rgba(217,185,145,.18);border-radius:20px;padding:16px;background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.015))}
.fs-card-head{display:flex;justify-content:space-between;gap:12px;margin-bottom:12px}
.fs-type{font-size:12px;color:#a7a9b3;font-weight:700}
.fs-name{font-size:21px;font-weight:900;color:#fff}
.fs-open{text-align:right}
.fs-open span{display:block;font-size:11px;color:#a7a9b3;font-weight:700}
.fs-open b{display:block;font-size:16px}
.fs-open.bad b,.bad-text{color:#ff9a9a !important}
.fs-open.good b,.good-text{color:#9cffb2 !important}
.fs-lines{display:grid;grid-template-columns:1fr 1fr;gap:8px 12px}
.fs-lines div{display:flex;justify-content:space-between;gap:8px;border-bottom:1px solid rgba(255,255,255,.07);padding-bottom:6px}
.fs-lines span{color:#a7a9b3;font-size:12px;font-weight:700}
.fs-lines b{color:#fff;font-size:13px;text-align:right}
.fs-pills{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.fs-pill{border-radius:999px;padding:6px 9px;font-size:12px;font-weight:800;background:rgba(217,185,145,.13);color:#f3dfbd;border:1px solid rgba(217,185,145,.18)}
.fs-note{margin-top:10px;border:1px dashed rgba(217,185,145,.25);border-radius:16px;padding:14px;color:#a7a9b3;background:rgba(255,255,255,.025)}

</style>
<style>
/* SAFE UI ONLY - NO JS TOUCH */

body {
  background: #0f0f10;
}

/* cards polish */
.card {
  border-radius: 18px !important;
  border: 1px solid rgba(255,255,255,0.08) !important;
  background: rgba(255,255,255,0.03) !important;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

/* headings */
h2, .section-title {
  font-weight: 900 !important;
  color: #ffffff !important;
}

/* KPI colors */
.green { color: #4cd964 !important; }
.red { color: #ff6b6b !important; }
.blue { color: #6ea8ff !important; }
.yellow { color: #f5c542 !important; }

/* top header spacing */
header, .topbar, .app-header {
  padding: 12px 20px !important;
}

/* small daily inline (visual only placeholder) */
.logo::after {
  content: "  |  LIVE";
  color: #d9b991;
  font-size: 12px;
  margin-left: 10px;
}

</style>



<style id="v84-bubble-size-and-financial-card">
/* V84 UI-only: reduce app bubbles by 20% and polish Project BLU card. Login/auth untouched. */
#app .shell > header.card,
#app .shell > section.panel{
  border-radius: 26px !important;
  padding: 22px !important;
}
#app .shell .card,
#app .shell .panel,
#app .shell .stat,
#app .shell .alert-card,
#app .shell .fs-card,
#app #safeFinancialStatus .card{
  border-radius: 22px !important;
}
#app .shell .stat{
  min-height: 112px !important;
  padding: 19px !important;
}
#app .shell .stat::after{
  width: 56px !important;
  height: 56px !important;
  right: 18px !important;
  top: 18px !important;
}
#app .shell .alert-card{
  min-height: 76px !important;
  padding: 14px !important;
}
#app .shell .stats{
  gap: 17px !important;
  margin-bottom: 19px !important;
}
#app .shell .toolbar{
  gap: 10px !important;
}
#app .shell button,
#app .shell .main-action,
#app .shell .month-btn,
#app .shell select.dark,
#app .shell input.dark{
  border-radius: 15px !important;
}
#app .shell .main-action,
#app .shell button{
  min-height: 42px !important;
  padding: 10px 14px !important;
}
#app .shell .label,
#app .shell .stat .label{
  font-size: 14px !important;
  margin-bottom: 9px !important;
}
#app .shell .value,
#app .shell .stat .value{
  font-size: 22px !important;
}
#app #safeFinancialStatus,
#app .safe-financial-status,
#app #financialStatus,
#app .financial-status,
#app .fs-wrap{
  padding: 24px !important;
  border-radius: 27px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"]{
  gap: 12px !important;
  margin-bottom: 16px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"] > .card{
  padding: 14px !important;
  min-height: 78px !important;
  min-width: 160px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"] .card div{
  font-size: 12px !important;
}
#app #safeFinancialStatus > div[style*="display:flex"] .card b{
  font-size: 19px !important;
}
#app .fs-project-bubble{
  margin-top: 10px !important;
  padding: 18px 20px !important;
  border-radius: 24px !important;
  background:
    radial-gradient(circle at 92% 22%, rgba(227,191,140,.15), transparent 26%),
    linear-gradient(180deg, rgba(255,255,255,.065), rgba(255,255,255,.018)) !important;
  border: 1px solid rgba(227,191,140,.22) !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 12px 30px rgba(0,0,0,.22) !important;
}
#app .fs-project-head{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:12px;
  padding-bottom: 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(255,255,255,.08);
}
#app .fs-project-label{
  color:#c9b18d;
  font-size:12px;
  font-weight:800;
  letter-spacing:.08em;
  text-transform:uppercase;
}
#app .fs-project-bubble h3{
  margin:0 !important;
  font-size:24px !important;
  color:#fff !important;
  line-height:1.05 !important;
}
#app .fs-project-bubble > div:not(.fs-project-head){
  display:flex;
  justify-content:space-between;
  gap:18px;
  align-items:center;
  padding: 5px 0;
  font-size:15px !important;
  color:#d8dce6;
}
#app .fs-project-bubble b{
  font-size:16px !important;
}
@media(max-width:720px){
  #app .shell > header.card,
  #app .shell > section.panel{padding:16px !important;border-radius:23px !important;}
  #app .shell .stats{grid-template-columns:repeat(2,minmax(0,1fr)) !important;gap:11px !important;}
  #app .shell .stat{min-height:94px !important;padding:14px !important;border-radius:19px !important;}
  #app .shell .value,#app .shell .stat .value{font-size:19px !important;}
  #app #safeFinancialStatus,.safe-financial-status,#financialStatus,.financial-status,.fs-wrap{padding:18px !important;border-radius:23px !important;}
  #app #safeFinancialStatus > div[style*="display:flex"] > .card{min-width:130px !important;}
  #app .fs-project-bubble{padding:15px !important;border-radius:20px !important;}
}

/* V94: Project BLU mirrors Financial Status KPI layout - UI only, no login/auth changes */
.safe-financial-status > h2{
  font-size: clamp(34px, 6vw, 64px);
  line-height: 1;
  letter-spacing: -1.2px;
  margin: 0 0 18px !important;
}
.fs-gold-line{
  width: 170px;
  height: 6px;
  border-radius: 999px;
  margin: 0 0 26px;
  background: linear-gradient(90deg,#f0cfa0,rgba(240,207,160,0));
}
.fs-kpi-grid{
  display:grid !important;
  grid-template-columns: repeat(2, minmax(0,1fr));
  gap:18px;
  margin-bottom:28px;
}
.fs-kpi-card{
  min-height: 118px;
  border:1px solid rgba(255,255,255,.11);
  border-radius:26px;
  padding:22px 24px;
  background:linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,255,255,.02));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 16px 34px rgba(0,0,0,.28);
}
.fs-kpi-card div{
  color:#c8cad6;
  font-size:20px;
  font-weight:800;
  margin-bottom:14px;
}
.fs-kpi-card b{
  display:block;
  font-size: clamp(27px, 4.5vw, 43px);
  line-height:1;
  letter-spacing:.2px;
}
.fs-project-financial-clone{
  margin-top:28px;
  padding:34px;
  border:1px solid rgba(217,185,145,.22);
  border-radius:34px;
  background:radial-gradient(circle at 85% 20%,rgba(217,185,145,.11),transparent 30%),linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.015));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.075), 0 20px 45px rgba(0,0,0,.24);
}
.fs-project-financial-clone h2{
  font-size: clamp(34px, 6vw, 64px);
  line-height:1;
  margin:0 0 18px;
  color:#fff;
  letter-spacing:-1.2px;
}
.project-kpi-grid{
  margin-bottom:0;
}
.safe-financial-status > div[style*="display:flex"]{
  display:grid !important;
  grid-template-columns: repeat(2,minmax(0,1fr));
  gap:18px !important;
}
.safe-financial-status > div[style*="display:flex"] > .card{
  min-height:118px;
  border-radius:26px !important;
  padding:22px 24px !important;
  background:linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,255,255,.02)) !important;
}
.safe-financial-status > div[style*="display:flex"] > .card div{
  color:#c8cad6;
  font-size:20px;
  font-weight:800;
  margin-bottom:14px;
}
.safe-financial-status > div[style*="display:flex"] > .card b{
  font-size: clamp(27px,4.5vw,43px);
  line-height:1;
}
@media (max-width: 720px){
  .fs-kpi-grid, .safe-financial-status > div[style*="display:flex"]{grid-template-columns:1fr 1fr;}
  .fs-project-financial-clone{padding:24px;border-radius:28px;}
  .fs-kpi-card,.safe-financial-status > div[style*="display:flex"] > .card{padding:18px !important;min-height:98px;}
  .fs-kpi-card div,.safe-financial-status > div[style*="display:flex"] > .card div{font-size:16px;}
}

</style>





<style id="remove-project-dashboard-v105">
/* V105: fully hide Project dashboard/card block. Login/auth untouched. */
#project-status,
#project-financial-status,
#projectDashboard,
#project-dashboard,
#projectCard,
#project-card,
#projects,
#projects-dashboard,
.project-status,
.project-financial-status,
.project-dashboard,
.project-card,
.project-summary-card,
.project-financial-card,
.projects-card,
.projects-dashboard,
.card.project,
.panel.project,
section.project,
div[data-section="project"],
div[data-card="project"],
div[data-title="PROJECT"],
div[data-title="Project"] {
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
  min-height: 0 !important;
  max-height: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
}

/* Hide the specific legacy block by content structure when present */
.financial-project-card,
.financial-project-panel,
.project-breakdown,
.project-breakdown-card,
.project-kpi-card {
  display: none !important;
}
</style>



<style id="v111-deposit-paid-lock">
/* Deposit status locked as Paid; login/auth untouched. */
.deposit-paid-locked { pointer-events:none; opacity:.75; }
</style>


<style id="v112-deposit-hard-lock">
/* V112: Deposit status is hard-locked to Paid and hidden. Login/auth untouched. */
#entryStatusWrap[style*="display: none"] { display:none !important; }
#entryStatus:disabled { pointer-events:none !important; opacity:.7 !important; }
</style>


<style id="v113-deposit-display">
/* V113: Deposit displayed as separate type, not Order. Login/auth untouched. */
.table-wrap .status-deposit,
.table-wrap .kind-deposit,
.badge.deposit {
  color:#111 !important;
  border-color:rgba(217,185,145,.34) !important;
  background:linear-gradient(145deg, #e4c9a7 0%, #d2ad83 44%, #bb9061 100%) !important;
}
</style>


<style id="v119-cosmetic-buttons">
/* V119 cosmetic buttons only. Login/auth/logic untouched. */

/* Add Deposit: close to Invoice gold, but slightly more copper/rose-gold */
button.add-deposit-btn,
#app button.add-deposit-btn {
  background:
    radial-gradient(circle at 22% 15%, rgba(255,255,255,.34), transparent 24%),
    linear-gradient(135deg, #f2d0a2 0%, #d7a56f 46%, #b9814f 100%) !important;
  color: #121212 !important;
  border: 1px solid rgba(255,222,176,.75) !important;
  font-weight: 900 !important;
  letter-spacing: .01em !important;
  box-shadow:
    0 10px 24px rgba(217,165,111,.22),
    inset 0 1px 0 rgba(255,255,255,.38) !important;
}
button.add-deposit-btn:hover,
#app button.add-deposit-btn:hover {
  filter: brightness(1.08) saturate(1.05) !important;
  transform: translateY(-1px) !important;
}

/* Delete Selected: designed red button with black text */
button.delete-selected-btn,
#app button.delete-selected-btn {
  background:
    radial-gradient(circle at 20% 14%, rgba(255,255,255,.24), transparent 26%),
    linear-gradient(135deg, #ff7373 0%, #e13737 45%, #a90000 100%) !important;
  color: #050505 !important;
  border: 1px solid rgba(255,80,80,.85) !important;
  font-weight: 950 !important;
  letter-spacing: .01em !important;
  text-shadow: none !important;
  box-shadow:
    0 10px 24px rgba(255,0,0,.20),
    inset 0 1px 0 rgba(255,255,255,.30) !important;
}
button.delete-selected-btn:hover,
#app button.delete-selected-btn:hover {
  filter: brightness(1.08) saturate(1.08) !important;
  transform: translateY(-1px) !important;
}
</style>


<style id="v121-header-daily-premium-layout">
/* V121: Premium header / logo / daily spacing only. Login/auth/logic untouched. */

#app .brand {
  align-items: center !important;
  gap: 22px !important;
}

#app .brand-left {
  display: grid !important;
  grid-template-columns: auto 1fr !important;
  align-items: center !important;
  column-gap: 22px !important;
  row-gap: 12px !important;
  width: 100% !important;
}

#app .logo {
  width: 72px !important;
  height: 72px !important;
  min-width: 72px !important;
  border-radius: 22px !important;
  font-size: 34px !important;
  box-shadow:
    0 14px 32px rgba(217,185,145,.22),
    inset 0 1px 0 rgba(255,255,255,.38) !important;
}

#app .logo::after {
  content: "LIVE" !important;
  position: absolute !important;
  right: -12px !important;
  bottom: 10px !important;
  font-size: 11px !important;
  color: rgba(255,255,255,.38) !important;
  letter-spacing: .05em !important;
  margin: 0 !important;
}

#app .title {
  font-size: clamp(34px, 4.2vw, 56px) !important;
  line-height: .95 !important;
  letter-spacing: -.04em !important;
  margin-bottom: 6px !important;
}

#app .brand-subtitle {
  font-size: 18px !important;
  color: #e5c79e !important;
  margin-bottom: 18px !important;
}

#app .daily-header-bar {
  display: grid !important;
  grid-template-columns: minmax(190px, auto) repeat(3, minmax(170px, auto)) !important;
  gap: 14px !important;
  align-items: stretch !important;
  margin: 14px 0 16px !important;
  max-width: 920px !important;
}

#app .daily-chip {
  min-height: 74px !important;
  border-radius: 22px !important;
  padding: 14px 18px !important;
  background:
    radial-gradient(circle at 18% 16%, rgba(255,255,255,.13), transparent 30%),
    linear-gradient(145deg, rgba(255,255,255,.085), rgba(255,255,255,.025)) !important;
  border: 1px solid rgba(217,185,145,.22) !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.075),
    0 12px 28px rgba(0,0,0,.20) !important;
}

#app .daily-chip.daily-title {
  background:
    radial-gradient(circle at 18% 16%, rgba(255,255,255,.22), transparent 30%),
    linear-gradient(135deg, rgba(217,185,145,.32), rgba(86,66,44,.18)) !important;
}

#app .daily-label {
  display: block !important;
  font-size: 13px !important;
  line-height: 1 !important;
  font-weight: 950 !important;
  letter-spacing: .08em !important;
  color: #d9c2a1 !important;
  text-transform: uppercase !important;
  margin-bottom: 9px !important;
  white-space: nowrap !important;
}

#app .daily-value {
  display: block !important;
  font-size: 24px !important;
  line-height: 1.05 !important;
  font-weight: 950 !important;
  color: #ffffff !important;
  letter-spacing: -.02em !important;
  white-space: nowrap !important;
}

#app .userbar {
  margin-top: 10px !important;
  display: flex !important;
  gap: 12px !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  font-size: 22px !important;
}

#app .role-badge {
  padding: 7px 18px !important;
  border-radius: 999px !important;
  font-size: 17px !important;
  font-weight: 950 !important;
}

#app header.card {
  padding-top: 30px !important;
  padding-bottom: 28px !important;
}

#app header.card .toolbar {
  margin-top: 26px !important;
}

/* Tablet / laptop narrow */
@media (max-width: 1050px) {
  #app .daily-header-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    max-width: 760px !important;
  }
}

/* Mobile */
@media (max-width: 720px) {
  #app .brand-left {
    grid-template-columns: 1fr !important;
    justify-items: center !important;
    text-align: center !important;
    gap: 14px !important;
  }

  #app .logo {
    width: 64px !important;
    height: 64px !important;
    min-width: 64px !important;
    font-size: 30px !important;
  }

  #app .title {
    font-size: 38px !important;
  }

  #app .brand-subtitle {
    font-size: 15px !important;
    margin-bottom: 14px !important;
  }

  #app .daily-header-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 10px !important;
    margin: 12px auto 14px !important;
    width: 100% !important;
  }

  #app .daily-chip {
    min-height: 66px !important;
    padding: 12px 14px !important;
    border-radius: 18px !important;
  }

  #app .daily-label {
    font-size: 11px !important;
    margin-bottom: 7px !important;
  }

  #app .daily-value {
    font-size: 19px !important;
  }

  #app .userbar {
    justify-content: center !important;
    font-size: 17px !important;
  }
}
</style>


<style id="v122-header-scale-50">
/* Reduce header elements to ~50% without changing layout */

#app .logo {
  width: 48px !important;
  height: 48px !important;
  min-width: 48px !important;
  font-size: 22px !important;
}

#app .title {
  font-size: 28px !important;
}

#app .brand-subtitle {
  font-size: 13px !important;
  margin-bottom: 8px !important;
}

#app .daily-chip {
  min-height: 44px !important;
  padding: 8px 12px !important;
  border-radius: 14px !important;
}

#app .daily-label {
  font-size: 10px !important;
  margin-bottom: 4px !important;
}

#app .daily-value {
  font-size: 15px !important;
}

#app .daily-header-bar {
  gap: 8px !important;
  margin: 6px 0 8px !important;
}

#app .userbar {
  font-size: 14px !important;
}

#app .role-badge {
  font-size: 12px !important;
  padding: 4px 10px !important;
}

#app header.card {
  padding-top: 14px !important;
  padding-bottom: 12px !important;
}
</style>


<style id="v127-button-colors">
/* Gold buttons like Order */
button[onclick*="convertOrderToDN"],
button[onclick*="convertOrderToInvoice"] {
  background: linear-gradient(135deg, #f2d3a0, #d4a65a) !important;
  color: #000 !important;
  font-weight: 700;
  border: 1px solid rgba(255,215,150,0.6);
  box-shadow: 0 6px 16px rgba(212,166,90,0.25);
}

button[onclick*="convertOrderToDN"]:hover,
button[onclick*="convertOrderToInvoice"]:hover {
  filter: brightness(1.05);
}

/* Softer red for delete */
button.delete-selected-btn {
  background: linear-gradient(135deg, #e06666, #a83232) !important;
  color: #000 !important;
  border: 1px solid rgba(200,80,80,0.6);
  box-shadow: 0 4px 12px rgba(160,50,50,0.25);
}

button.delete-selected-btn:hover {
  filter: brightness(1.05);
}
</style>


<style id="v128-gold-match-animation">
/* Match exact system gold (same tone as Order badge) */
button[onclick*="convertOrderToDN"],
button[onclick*="convertOrderToInvoice"] {
  background: linear-gradient(145deg, #e4c9a7 0%, #d2ad83 44%, #bb9061 100%) !important;
  color: #000 !important;
  border: 1px solid rgba(217,185,145,.45) !important;
  font-weight: 800;
  box-shadow:
    0 6px 18px rgba(187,144,97,.25),
    inset 0 1px 0 rgba(255,255,255,.35);
  transition: all 0.18s ease;
}

/* Hover glow animation (keyboard + mouse focus) */
button[onclick*="convertOrderToDN"]:hover,
button[onclick*="convertOrderToInvoice"]:hover,
button[onclick*="convertOrderToDN"]:focus,
button[onclick*="convertOrderToInvoice"]:focus {
  filter: brightness(1.12);
  box-shadow:
    0 0 0 2px rgba(217,185,145,.35),
    0 8px 22px rgba(187,144,97,.35),
    inset 0 1px 0 rgba(255,255,255,.45);
  transform: translateY(-1px);
}

/* Softer delete (keep elegant) */
button.delete-selected-btn {
  background: linear-gradient(145deg, #d97a7a 0%, #b84a4a 50%, #7a1f1f 100%) !important;
  color: #000 !important;
  border: 1px solid rgba(200,120,120,.5);
  transition: all 0.18s ease;
}

button.delete-selected-btn:hover,
button.delete-selected-btn:focus {
  filter: brightness(1.08);
  box-shadow:
    0 0 0 2px rgba(200,100,100,.25),
    0 8px 20px rgba(120,30,30,.3);
  transform: translateY(-1px);
}
</style>


<style id="v129-global-button-ux">
button {
  transition: all 0.15s ease;
  position: relative;
}

button:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
}

button:focus {
  outline: none;
  box-shadow:
    0 0 0 2px rgba(217,185,145,.35),
    0 6px 16px rgba(0,0,0,.25);
}

button:active {
  transform: translateY(1px) scale(0.97);
  box-shadow:
    inset 0 3px 8px rgba(0,0,0,.35);
}

button::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.2s ease;
  background: radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 60%);
}

button:active::after {
  opacity: 1;
}
</style>


<meta name="theme-color" content="#080808">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Vardophase">


<style id="v131-iphone-css-only-login-safe">
/* V131 iPhone CSS-only. No JS, no service worker, login/auth untouched. */

html, body {
  -webkit-text-size-adjust: 100%;
}

button,
select,
input,
textarea,
.month-btn,
.nav-pill {
  min-height: 44px;
  touch-action: manipulation;
}

@media (max-width: 820px) {
  body {
    padding: 8px !important;
  }

  #app .shell {
    padding: 8px 8px calc(80px + env(safe-area-inset-bottom)) !important;
    max-width: 100% !important;
  }

  #app header.card,
  #app section.panel,
  #app .card,
  #app .panel {
    border-radius: 20px !important;
  }

  #app header.card {
    padding: 12px !important;
  }

  #app .brand-left {
    display: grid !important;
    grid-template-columns: auto 1fr !important;
    gap: 10px !important;
    text-align: left !important;
    align-items: center !important;
  }

  #app .logo {
    width: 44px !important;
    height: 44px !important;
    min-width: 44px !important;
    border-radius: 14px !important;
    font-size: 20px !important;
  }

  #app .title {
    font-size: 24px !important;
    line-height: 1 !important;
    margin: 0 !important;
  }

  #app .brand-subtitle {
    font-size: 12px !important;
    margin: 3px 0 8px !important;
  }

  #app .daily-header-bar {
    grid-column: 1 / -1 !important;
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
    margin: 8px 0 6px !important;
    width: 100% !important;
    max-width: none !important;
  }

  #app .daily-chip {
    min-height: 54px !important;
    padding: 9px 10px !important;
    border-radius: 16px !important;
  }

  #app .daily-label {
    font-size: 10px !important;
    margin-bottom: 5px !important;
  }

  #app .daily-value {
    font-size: 16px !important;
    white-space: nowrap !important;
  }

  #app .userbar {
    grid-column: 1 / -1 !important;
    font-size: 12px !important;
    gap: 6px !important;
    margin-top: 6px !important;
  }

  #app header.card .toolbar {
    display: flex !important;
    overflow-x: auto !important;
    gap: 8px !important;
    padding: 4px 2px 8px !important;
    margin-top: 10px !important;
    -webkit-overflow-scrolling: touch;
  }

  #app header.card .toolbar button {
    flex: 0 0 auto !important;
    min-width: 122px !important;
    padding: 10px 12px !important;
    border-radius: 14px !important;
    font-size: 13px !important;
  }

  #app .filters {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 8px !important;
  }

  #app .filters input,
  #app .filters select,
  #app .filters button {
    width: 100% !important;
    font-size: 16px !important;
  }

  #app .month-tools {
    display: flex !important;
    overflow-x: auto !important;
    gap: 7px !important;
    padding-bottom: 6px !important;
    -webkit-overflow-scrolling: touch;
  }

  #app .month-btn {
    flex: 0 0 auto !important;
    min-width: 58px !important;
  }

  #safeFinancialStatus > div[style*="display:flex"],
  .safe-financial-status > div[style*="display:flex"],
  #app .stats,
  #app .alert-strip {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
  }

  #safeFinancialStatus .card,
  .safe-financial-status .card,
  #app .stat,
  #app .alert-card {
    min-height: 76px !important;
    padding: 11px !important;
    border-radius: 16px !important;
  }

  #app section.panel .toolbar {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
  }

  #app section.panel .toolbar button {
    width: 100% !important;
    min-height: 48px !important;
    border-radius: 15px !important;
    font-size: 13px !important;
    padding: 10px 8px !important;
  }

  #app .table-wrap {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    border-radius: 18px !important;
    max-width: 100% !important;
  }

  #app table {
    min-width: 1180px !important;
    font-size: 12px !important;
  }

  #app th,
  #app td {
    padding: 9px 8px !important;
    white-space: nowrap !important;
  }

  #app .modal-box,
  .modal-box {
    width: 100% !important;
    max-width: 100% !important;
    max-height: 92vh !important;
    overflow-y: auto !important;
    border-radius: 22px !important;
    padding: 14px !important;
  }

  #app .form-grid {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 10px !important;
  }

  #app input.dark,
  #app select.dark,
  #app textarea.dark {
    font-size: 16px !important;
    min-height: 46px !important;
  }
}
</style>


<style id="v133-iphone-refine-only">
/* V133: based on V131. Only fixes Change Password / Logout and table scrolling. Login untouched. */

@media (max-width: 820px) {
  /* Put Change Password + Logout in a clean row instead of floating/cutting */
  #app .brand > div[style*="justify-content:flex-end"] {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
    width: 100% !important;
    margin-top: 10px !important;
  }

  #app .brand > div[style*="justify-content:flex-end"] button {
    width: 100% !important;
    min-height: 44px !important;
    border-radius: 15px !important;
    font-size: 13px !important;
    padding: 9px 10px !important;
  }

  #app .brand > div[style*="justify-content:flex-end"] button.red {
    color: #ff8b8b !important;
  }

  /* Keep header compact like V131, not huge like V132 */
  #app header.card .toolbar {
    display: flex !important;
    overflow-x: auto !important;
    gap: 8px !important;
    padding: 4px 2px 8px !important;
    margin-top: 10px !important;
    -webkit-overflow-scrolling: touch !important;
    scroll-behavior: auto !important;
  }

  #app header.card .toolbar button {
    flex: 0 0 auto !important;
    min-width: 122px !important;
  }

  /* Faster, smoother horizontal table scrolling */
  #app .table-wrap {
    overflow-x: scroll !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
    scroll-behavior: auto !important;
    overscroll-behavior-x: contain !important;
    touch-action: pan-x pan-y !important;
  }

  #app .table-wrap table {
    min-width: 1320px !important;
  }

  /* Make row touch/drag feel less heavy */
  #app .table-wrap th,
  #app .table-wrap td {
    padding: 8px 7px !important;
  }

  #app .table-wrap tbody tr {
    contain: layout paint !important;
  }
}
</style>


<style id="v134-report-mobile-dark-fix">
/* V134 report readability + mobile return fix. Login untouched. */

/* If a generated report opens in same app window, force readable report styling */
body:has(h1):has(table) {
  background: #ffffff !important;
  color: #111111 !important;
}

body:has(h1):has(table) h1,
body:has(h1):has(table) h2,
body:has(h1):has(table) div,
body:has(h1):has(table) span,
body:has(h1):has(table) td,
body:has(h1):has(table) th {
  color: #111111 !important;
}

body:has(h1):has(table) table {
  background: #ffffff !important;
  color: #111111 !important;
}

body:has(h1):has(table) th {
  background: #edf2ff !important;
  color: #111111 !important;
}

body:has(h1):has(table) td {
  background: #ffffff !important;
  color: #111111 !important;
}

@media (max-width: 820px) {
  body:has(h1):has(table) {
    padding: 12px !important;
    overflow-x: auto !important;
  }
  body:has(h1):has(table) table {
    min-width: 980px !important;
  }
}
</style>


<style id="v136-selection-fix-css">
/* V136 selection UX. Login/auth untouched. */
tr.selected {
  background: rgba(217,185,145,.16) !important;
  box-shadow: inset 4px 0 0 rgba(217,185,145,.75) !important;
}
.row-check,
.premium-check {
  width: 22px !important;
  height: 22px !important;
  accent-color: #d2ad83 !important;
  cursor: pointer !important;
}
td:has(.row-check),
td:has(.premium-check) {
  cursor: pointer !important;
}
</style>


<style id="v148-inline-reports-safe-css">
#inlineReportModal.modal.show{
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  padding:18px!important;
  z-index:99999!important;
}
.inline-report-box{
  width:min(1180px,96vw)!important;
  max-height:92vh!important;
  display:flex!important;
  flex-direction:column!important;
  overflow:hidden!important;
}
.inline-report-toolbar{
  display:flex!important;
  justify-content:space-between!important;
  align-items:center!important;
  gap:10px!important;
  padding:12px 14px!important;
  border-bottom:1px solid rgba(217,185,145,.18)!important;
}
.inline-report-actions{display:flex!important;gap:8px!important;}
#inlineReportFrame{
  width:100%!important;
  height:76vh!important;
  border:0!important;
  background:#fff!important;
  border-radius:0 0 18px 18px!important;
}
@media(max-width:820px){
  #inlineReportModal.modal.show{padding:0!important;align-items:stretch!important;}
  .inline-report-box{width:100vw!important;max-width:100vw!important;height:100vh!important;max-height:100vh!important;border-radius:0!important;}
  .inline-report-toolbar{padding:10px!important;flex-wrap:wrap!important;}
  .inline-report-actions{width:100%!important;display:grid!important;grid-template-columns:1fr 1fr!important;}
  .inline-report-actions button{width:100%!important;min-height:44px!important;}
  #inlineReportFrame{height:calc(100vh - 112px)!important;border-radius:0!important;}
}
</style>


<style id="v168-dn-approver-css">
/* V168 DN Approver limited role - no login changes */

/* Hide financial cells/columns from the table */
body.role-dn-approver table th:nth-child(8),
body.role-dn-approver table td:nth-child(8),
body.role-dn-approver table th:nth-child(9),
body.role-dn-approver table td:nth-child(9),
body.role-dn-approver table th:nth-child(14),
body.role-dn-approver table td:nth-child(14),
body.role-dn-approver table th:nth-child(15),
body.role-dn-approver table td:nth-child(15),
body.role-dn-approver table th:nth-child(16),
body.role-dn-approver table td:nth-child(16),
body.role-dn-approver table th:nth-child(17),
body.role-dn-approver table td:nth-child(17),
body.role-dn-approver table th:nth-child(18),
body.role-dn-approver table td:nth-child(18),
body.role-dn-approver table th:nth-child(19),
body.role-dn-approver table td:nth-child(19) {
  display: none !important;
}

/* Hide money/cards/status financial overview */
body.role-dn-approver .stat,
body.role-dn-approver .stats,
body.role-dn-approver .alert-strip,
body.role-dn-approver #safeFinancialStatus,
body.role-dn-approver .safe-financial-status,
body.role-dn-approver .financial-status,
body.role-dn-approver .credit-statement {
  display: none !important;
}

/* Hide all action/report/admin buttons except Convert Order -> DN and filters/search */
body.role-dn-approver button[onclick*="Invoice"],
body.role-dn-approver button[onclick*="invoice"],
body.role-dn-approver button[onclick*="Deposit"],
body.role-dn-approver button[onclick*="deposit"],
body.role-dn-approver button[onclick*="Report"],
body.role-dn-approver button[onclick*="report"],
body.role-dn-approver button[onclick*="Audit"],
body.role-dn-approver button[onclick*="Roles"],
body.role-dn-approver button[onclick*="Settings"],
body.role-dn-approver button[onclick*="bulkDelete"],
body.role-dn-approver button[onclick*="duplicate"],
body.role-dn-approver button[onclick*="bulkMarkPaid"],
body.role-dn-approver button[onclick*="markSelected"],
body.role-dn-approver button[onclick*="openEntryModal"],
body.role-dn-approver button[onclick*="openDepositModal"] {
  display: none !important;
}

body.role-dn-approver button[onclick*="convertOrderToDN"] {
  display: inline-flex !important;
  visibility: visible !important;
}

/* Keep filters/search visible */
body.role-dn-approver .filters,
body.role-dn-approver .filters *,
body.role-dn-approver .month-tools,
body.role-dn-approver .month-tools * {
  display: revert !important;
}

/* Hide selected financial summary text */
body.role-dn-approver .money-gold,
body.role-dn-approver .money-red,
body.role-dn-approver .money-blue,
body.role-dn-approver .money-green,
body.role-dn-approver .money-amber {
  display: none !important;
}
</style>


<style id="v169-dn-approver-dropdown-label">
/* V169: role dropdown includes DN Approver. Login untouched. */
</style>

</head><body><button class="report-back-btn" onclick="if(window.opener){window.close()}else{history.back()}">← Back to Dashboard</button><h1>VARDOPHASE Project Transparency Report</h1>${sections}<script>window.onload=()=>window.print()<\/script>




</body></html>`);
  w.document.close();
};

window.addTransparencyButtons = function(){
  const toolbars = Array.from(document.querySelectorAll(".toolbar"));
  const toolbar = toolbars.find(t => (t.textContent||"").includes("Monthly Report")) || toolbars[0];
  if(!toolbar) return;
  if(!document.getElementById("btnTransparencyReport")){
    const b = document.createElement("button");
    b.id = "btnTransparencyReport";
    b.className = "soft";
    b.textContent = "Transparency Report";
    b.onclick = window.printTransparencyReport;
    toolbar.appendChild(b);
  }
  if(!document.getElementById("btnProjectTransparencyReport")){
    const b = document.createElement("button");
    b.id = "btnProjectTransparencyReport";
    b.className = "soft";
    b.textContent = "Project Transparency";
    b.onclick = window.printProjectTransparencyReport;
    toolbar.appendChild(b);
  }
};
setInterval(window.addTransparencyButtons, 1000);

/* === V260 SAFE CREDIT NOTE - DOES NOT TOUCH LOGIN === */
(function(){
  if(window.__v260CreditNoteLoaded) return;
  window.__v260CreditNoteLoaded = true;
  function cnAmount(v){ return Number(String(v||"").replace(/[^0-9.-]/g,"")) || 0; }
  function cnToday(){ return new Date().toISOString().slice(0,10); }
  function cnMoney(n){ try{ return money(Number(n||0)); }catch(e){ return "R " + Number(n||0).toLocaleString("en-ZA",{minimumFractionDigits:2,maximumFractionDigits:2}); } }

  window.openCreditNoteModal = async function(){
    try{
      if(typeof supabase === "undefined" || !supabase) return alert("System is still loading. Refresh and try again.");
      if(typeof canAccountant === "function" && !canAccountant()) return alert("Only accountant / manager / admin can add Credit Note.");
      if(!Array.isArray(selectedIds) || selectedIds.length !== 1) return alert("Select exactly one Invoice row first.");

      const id = selectedIds[0];
      const res = await supabase.from("suppliers").select("*").eq("id", id).single();
      if(res.error || !res.data) return alert(res.error?.message || "Could not load selected row.");
      const row = res.data;

      const hasInvoice = !!String(row.invoice_no || "").trim();
      const kind = (typeof displayEntryKind === "function") ? String(displayEntryKind(row) || "").toLowerCase() : String(row.entry_type || "").toLowerCase();
      if(!hasInvoice || kind === "order" || kind === "deposit" || kind === "delivery_note" || kind === "delivery"){
        return alert("Credit Note works only on the selected Invoice row. Select an invoice with an Invoice No.");
      }

      const currentCredit = (typeof extractCreditAmount === "function") ? Number(extractCreditAmount(row) || 0) : 0;
      const invoiceBase = (typeof invoiceDisplayAmount === "function") ? Number(invoiceDisplayAmount(row) || 0) : Number(row.total || row.amount || 0);
      const depositApplied = Number(row.deposit_applied || 0);
      const currentOutstanding = (typeof amountDueDisplay === "function") ? Number(amountDueDisplay(row) || 0) : Math.max(0, invoiceBase - depositApplied - currentCredit);

      if(currentOutstanding <= 0) return alert("This invoice has no outstanding balance to credit.");

      const creditNo = prompt("Credit Note Number", "CN-" + String(row.invoice_no || ""));
      if(creditNo === null || !String(creditNo).trim()) return;

      const raw = prompt("Credit Note Amount\nOutstanding: " + cnMoney(currentOutstanding), currentOutstanding.toFixed(2));
      if(raw === null) return;
      const creditAmount = cnAmount(raw);
      if(creditAmount <= 0) return alert("Invalid Credit Note amount.");
      if(creditAmount > currentOutstanding + 0.01) return alert("Credit Note cannot be higher than the invoice outstanding: " + cnMoney(currentOutstanding));

      const reason = prompt("Reason / Note", "Supplier credit note") || "Supplier credit note";
      const date = prompt("Credit Note Date", cnToday()) || cnToday();
      const newCreditTotal = currentCredit + creditAmount;
      const newAmountDue = Math.max(0, invoiceBase - depositApplied - newCreditTotal);

      let notes = String(row.notes || "");
      if(typeof upsertNoteTag === "function"){
        notes = upsertNoteTag(notes, "CREDIT", newCreditTotal.toFixed(2));
        notes = upsertNoteTag(notes, "CREDITNO", String(creditNo).trim());
        notes = upsertNoteTag(notes, "CREDITDATE", date);
        notes = upsertNoteTag(notes, "CREDITREASON", reason);
      } else {
        notes += "\n[[CREDIT:" + newCreditTotal.toFixed(2) + "]]";
        notes += "\n[[CREDITNO:" + String(creditNo).trim() + "]]";
        notes += "\n[[CREDITDATE:" + date + "]]";
        notes += "\n[[CREDITREASON:" + reason + "]]";
      }

      const update = {
        notes,
        amount_due: newAmountDue,
        unpaid_after_deposit: newAmountDue,
        status: newAmountDue <= 0.01 ? "Covered" : (row.status || "Unpaid")
      };

      const upd = await supabase.from("suppliers").update(update).eq("id", id);
      if(upd.error) return alert(upd.error.message);

      selectedIds = [];
      try{ if(typeof logAudit === "function") await logAudit("credit_note", "invoice=" + (row.invoice_no || id) + " amount=" + creditAmount + " no=" + creditNo); }catch(e){}
      alert("Credit Note saved on invoice " + String(row.invoice_no || "") + ": " + String(creditNo).trim() + " / " + cnMoney(creditAmount) + "\nNew Outstanding: " + cnMoney(newAmountDue));
      if(typeof render === "function") await render();
    }catch(err){ alert(err?.message || "Credit Note error"); }
  };
  const st = document.createElement("style");
  st.textContent = ".credit-note-btn{color:#111!important;background:linear-gradient(145deg,#efd3ab,#b88754)!important;font-weight:900!important}.credit-note-value{color:#f5c26b!important}";
  document.head.appendChild(st);
})();

// V303 runtime style: dropdown/chips no text-shadow
(function(){
  const css = `#app .custom-select-menu,#app .custom-select-menu *,#loginScreen .custom-select-menu,#loginScreen .custom-select-menu *,#contractorsProScreen .custom-select-menu,#contractorsProScreen .custom-select-menu *,.custom-select-menu,.custom-select-menu *,.custom-select-item,div[role="option"],.custom-select-menu [role="option"]{text-shadow:none!important;-webkit-text-stroke:0!important;filter:none!important;color:#050505!important;-webkit-text-fill-color:#050505!important;font-weight:400!important}#app .chips,#app .chips *,#app .chip,#app .chip *,#contractorsProScreen .chips,#contractorsProScreen .chips *,#contractorsProScreen .chip,#contractorsProScreen .chip *,.table-wrap .chip,.table-wrap .chip *{text-shadow:none!important;-webkit-text-stroke:0!important;filter:none!important}#app .modal-box .custom-select-btn,#app .modal-box .custom-select-btn *,#app .modal-box input,#app .modal-box textarea,#app .modal-box select{text-shadow:none!important;-webkit-text-stroke:0!important;filter:none!important}`;
  if (typeof document !== 'undefined' && !document.getElementById('v303-runtime-no-shadow')) {
    const st = document.createElement('style'); st.id='v303-runtime-no-shadow'; st.textContent=css; document.head.appendChild(st);
  }
})();
