
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { jsPDF } from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";

const supabase = createClient(
  "https://owfbbshsemjvfltrsxsz.supabase.co",
  "sb_publishable_-2wNFqv-HQXKgKQFS4KMvA_SArEjQls"
);
window.vpSupabase = supabase;

const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
let currentUser = null;
let currentRole = "user";
let selectedMonth = "";
let editingId = null;
let selectedIds = [];
let channel = null;

const uiState = { tab:"dashboard", search:"", supplier:"", project:"", status:"", sort:"date_desc" };

const PERFORMANCE_CONFIG = {
  defaultLimit: 300,
  hardLimit: 1000,
  daysBackDefault: 90
};

function money(v){
  const n = Number(v || 0);
  return "R " + n.toLocaleString("en-ZA",{minimumFractionDigits:2, maximumFractionDigits:2});
}
function esc(s){
  return String(s ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}
function getVatRate(){
  const x = localStorage.getItem("vardophase_cloud_vat_rate");
  return x ? Number(x) : 15;
}
function setVatRate(v){ localStorage.setItem("vardophase_cloud_vat_rate", String(v)); }
function getDepositBasis(){
  return localStorage.getItem("vardophase_deposit_basis") || "net";
}
function setDepositBasis(v){
  localStorage.setItem("vardophase_deposit_basis", v);
}
function depositBaseAmount(row){
  const basis = getDepositBasis();
  const gross = Number(row.total || row.amount || 0);
  const net = Number(row.net_amount || 0);
  if(basis === "total") return gross;
  if(net > 0) return net;
  return gross > 0 ? calcNetFromGross(gross) : 0;
}
function extractDeliveryNoteNo(row){
  if(row){
    const direct = String(row.delivery_note_no || row.dn_no || row.delivery_no || "").trim();
    if(direct) return direct;
  }
  const notes = String(row?.notes || "");
  const m = notes.match(/\[\[DN:([^\]]+)\]\]/);
  if(m) return m[1].trim();
  const mAlt = notes.match(/\[\[(?:DELIVERY_NOTE|DELIVERYNO|DNNO):([^\]]+)\]\]/i);
  if(mAlt) return mAlt[1].trim();
  const m2 = notes.match(/Delivery\s*Note\s*:?\s*([^\n\r]+)/i);
  return m2 ? m2[1].trim() : "";
}
function stripDeliveryNoteTags(notes){
  return String(notes || "")
    .replace(/\n?\[\[DN:[^\]]+\]\]/gi, "")
    .replace(/\n?\[\[(?:DELIVERY_NOTE|DELIVERYNO|DNNO):[^\]]+\]\]/gi, "")
    .replace(/\n?Delivery\s*Note\s*:?\s*[^\n\r]+/gi, "")
    .trim();
}
function upsertDeliveryNoteTag(notes, dn){
  const clean = stripDeliveryNoteTags(notes);
  return (clean ? clean + "\n" : "") + "[[DN:" + dn + "]]";
}

function getNoteTag(row, tag){
  const notes = String(row?.notes || "");
  const re = new RegExp("\\[\\[" + tag + ":([^\\]]*)\\]\\]");
  const m = notes.match(re);
  return m ? String(m[1] || "").trim() : "";
}
function stripNoteTag(notes, tag){
  const re = new RegExp("\\n?\\[\\[" + tag + ":[^\\]]*\\]\\]", "g");
  return String(notes || "").replace(re, "").trim();
}
function upsertNoteTag(notes, tag, value){
  let clean = stripNoteTag(notes, tag);
  return (clean ? clean + "\\n" : "") + "[[" + tag + ":" + value + "]]";
}
function extractDeliveredAmount(row){ return Number(getNoteTag(row, "DNAMT") || 0); }
function extractCancelledAmount(row){ return Number(getNoteTag(row, "CANCELAMT") || 0); }
function extractCreditAmount(row){ return Number(getNoteTag(row, "CREDIT") || 0); }
function extractCloseReason(row){ return getNoteTag(row, "CLOSE"); }
function orderGrossAmount(row){ return Number(row?.total || row?.amount || 0); }
function orderRemainingBalance(row){
  const orderTotal = orderGrossAmount(row);
  const delivered = extractDeliveredAmount(row);
  const cancelled = extractCancelledAmount(row);
  // Open supply balance must be based on supply only:
  // Open Supply = Order Total - Delivered - Cancelled.
  // Invoice must NOT reduce supply balance again.
  return Math.max(0, orderTotal - delivered - cancelled);
}

function invoiceDisplayAmount(row){
  const delivered = typeof extractDeliveredAmount === "function" ? extractDeliveredAmount(row) : 0;
  // Once DN exists, invoice value must be the delivered amount only.
  if(delivered > 0) return delivered;
  return Number(row?.total || row?.amount || 0);
}

function amountDueDisplay(row){
  if(typeof displayEntryKind === "function" && displayEntryKind(row) === "credit_note") return 0;
  const delivered = typeof extractDeliveredAmount === "function" ? extractDeliveredAmount(row) : 0;
  const credit = typeof extractCreditAmount === "function" ? Number(extractCreditAmount(row) || 0) : 0;
  const hasDN = !!(typeof extractDeliveryNoteNo === "function" && extractDeliveryNoteNo(row));
  const hasInvoice = !!String(row?.invoice_no || "").trim();
  const closed = !!(typeof extractCloseReason === "function" && extractCloseReason(row));
  const status = String(row?.status || "").trim().toLowerCase();

  // V269 ACCOUNTING FIX: Credit Note is a separate negative document row.
  // Original invoice Amount Due is never allowed to become negative.
  if(hasInvoice){
    const invoiceBase = (typeof invoiceDisplayAmount === "function") ? Number(invoiceDisplayAmount(row) || 0) : Number(row?.total || row?.amount || 0);
    if(status === "paid" || status === "covered" || status === "credit available") return 0;
    return Math.max(0, invoiceBase - Number(row?.deposit_applied || 0) - credit);
  }

  if(hasDN){
    if(closed) return 0;
    return Math.max(0, delivered - credit);
  }

  return Math.max(0, Number(row?.amount_due || row?.total || row?.amount || 0) - credit);
}
function extractCreditNo(row){ return getNoteTag(row, "CREDITNO"); }
function extractCreditDate(row){ return getNoteTag(row, "CREDITDATE"); }
function extractCreditReason(row){ return getNoteTag(row, "CREDITREASON"); }
function creditNoteLabel(row){
  const credit = typeof extractCreditAmount === "function" ? Number(extractCreditAmount(row) || 0) : 0;
  if(!credit) return "";
  const no = extractCreditNo(row);
  const dt = extractCreditDate(row);
  return "Credit Note" + (no ? " " + no : "") + " · " + money(credit) + (dt ? " · " + dt : "");
}
function extractSupplierOrderNo(row){
  const notes = String(row?.notes || "");
  const start = "[[V316_SUPPLIER_ORDER_NO:";
  const end = "]]";
  const i = notes.indexOf(start);
  if(i < 0) return "";
  const j = notes.indexOf(end, i + start.length);
  if(j < 0) return "";
  const raw = notes.slice(i + start.length, j);
  try { return decodeURIComponent(raw || ""); } catch(e){ return raw || ""; }
}
function stripSupplierOrderFromNotesText(notes){
  notes = String(notes || "");
  const start = "[[V316_SUPPLIER_ORDER_NO:";
  const end = "]]";
  const i = notes.indexOf(start);
  if(i < 0) return notes;
  const j = notes.indexOf(end, i + start.length);
  if(j < 0) return notes;
  return (notes.slice(0,i) + notes.slice(j + end.length)).trim();
}
function visibleNotes(row){
  let n = stripSupplierOrderFromNotesText(String(row?.notes || ""));
  ["DNAMT","CANCELAMT","CREDIT","CREDITNO","CREDITDATE","CREDITREASON","CREDITLINK","CREDITPARENT","PARENTINVOICE","CLOSE"].forEach(tag => n = stripNoteTag(n, tag));
  return n;
}

function processStatusLabel(row){
  // Credit Note / Deposit are their own processes.
  if(displayEntryKind(row) === "credit_note") return "Credit Note";
  if(displayEntryKind(row) === "deposit") return "Deposit";

  const hasOrder = !!String(row.order_no || "").trim();
  const hasDN = !!extractDeliveryNoteNo(row) || extractDeliveredAmount(row) > 0 || ["delivery_note","dn"].includes(String(row.entry_type || "").toLowerCase());
  const hasInvoice = !!String(row.invoice_no || "").trim();

  if(hasOrder && !hasDN && !hasInvoice) return "Order";
  if(hasOrder && hasDN && !hasInvoice) return "Delivery Note";
  if(hasOrder && hasDN && hasInvoice) return "Invoice";
  if(hasInvoice && !hasOrder) return "Done";
  if(hasOrder && hasInvoice) return "Invoice";
  return "Order";
}

function processStatusClass(row){
  const label = processStatusLabel(row);
  if(label === "Credit Note") return "vat";
  if(label === "Deposit") return "deposit";
  if(label === "Order") return "unpaid";
  if(label === "Delivery Note") return "vat";
  if(label === "Invoice") return "paid";
  if(label === "Done") return "paid";
  return "unpaid";
}


function monthCarryStatus(row){
  if(!selectedMonth) return "";
  const currentYear = new Date().getFullYear();
  const monthStart = `${currentYear}-${selectedMonth}-01`;
  const date = String(row.created_at || "");
  return date < monthStart ? "Opening Balance" : "Current Month";
}

function smartSearch(row, term){
  const t = String(term || "").toLowerCase().trim();
  if(!t) return true;
  const dn = typeof extractDeliveryNoteNo === "function" ? extractDeliveryNoteNo(row) : "";
  return [
    row.order_no,
    dn,
    row.invoice_no,
    row.supplier,
    row.project,
    row.description,
    row.status,
    row.notes,
    row.entry_type
  ].some(v => String(v || "").toLowerCase().includes(t));
}

function displayEntryKind(row){
  const rawType = String(row.entry_type || "").toLowerCase();
  const invoiceNo = String(row.invoice_no || "").trim();
  const orderNo = String(row.order_no || "").trim();
  const status = String(row.status || "").toLowerCase();
  const desc = String(row.description || "").toLowerCase();

  // Credit Note is its own accounting document row.
  if(rawType === "credit_note" || status === "credit note" || desc.includes("credit note")) return "credit_note";

  // Deposit / Advance Payment must be its own document type.
  // It is supplier credit/payment, not an Order.
  if(rawType === "deposit" || status === "deposit" || desc.includes("deposit") || desc.includes("advance payment")) return "deposit";

  if(rawType === "delivery_note") return "delivery_note";
  if(rawType === "invoice" || invoiceNo) return "invoice";
  if(rawType === "order" || orderNo) return "order";
  return "order";
}
function vatFraction(){ return getVatRate() / 100; }
function calcVatFromNet(net){ return Number(net||0) * vatFraction(); }
function calcGrossFromNet(net){ return Number(net||0) * (1 + vatFraction()); }
function calcNetFromGross(gross){ return Number(gross||0) / (1 + vatFraction()); }
function reportMonthLabel(){ return selectedMonth ? monthNames[Number(selectedMonth)-1] : "All Months"; }
window.setTab = function(tab){
  uiState.tab = tab;
  render();
};

function daysOld(dateStr){
  const d = new Date(dateStr || "");
  if(Number.isNaN(d.getTime())) return 0;
  const now = new Date();
  return Math.floor((now - d) / 86400000);
}
function openOrdersSummary(rows){
  const open = rows.filter(r => displayEntryKind(r) === "order");
  return {
    count: open.length,
    older30: open.filter(r => daysOld(r.created_at) >= 30).length,
    older60: open.filter(r => daysOld(r.created_at) >= 60).length,
    total: open.reduce((s,r) => s + depositBaseAmount(r), 0)
  };
}


function localTodayKeyV93(dateValue){
  const d = dateValue ? new Date(dateValue) : new Date();
  if(Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}


function localDateFromAnyV97(value){
  if(!value) return "";
  const str = String(value);
  if(/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const d = new Date(str);
  if(Number.isNaN(d.getTime())) return str.slice(0,10);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function rowLocalDateKey(row){
  // Supabase created_at is UTC; convert it to the user's local day before comparing.
  const candidates = [row?.created_at, row?.date, row?.invoice_date, row?.order_date];
  for(const v of candidates){
    if(!v) continue;
    const str = String(v);
    if(/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const key = localTodayKeyV93(str);
    if(key) return key;
  }
  return "";
}

function dailyAmount(row){
  const values = [row?.total, row?.amount, row?.totalAfterVAT, row?.total_after_vat, row?.gross, row?.net_amount];
  for(const v of values){
    const n = Number(v || 0);
    if(n > 0) return n;
  }
  return 0;
}

function dailyKind(row){
  const type = String(row?.entry_type || "").toLowerCase();
  const status = String(row?.status || "").toLowerCase();
  const desc = String(row?.description || "").toLowerCase();

  if(type === "deposit" || status === "deposit" || desc.includes("deposit") || desc.includes("advance payment")) return "deposit";
  if(type === "delivery_note" || type === "dn") return "delivery_note";
  if(type === "order") return "order";
  if(type === "invoice") return "invoice";

  const hasDN = !!extractDeliveryNoteNo(row) || !!String(row?.delivery_note_no || row?.dn_no || "").trim();
  const hasInvoice = !!String(row?.invoice_no || "").trim();
  const hasOrder = !!String(row?.order_no || "").trim();
  if(hasInvoice) return "invoice";
  if(hasDN) return "delivery_note";
  if(hasOrder) return "order";
  return displayEntryKind(row);
}


function dailyHeaderSummary(rows){
  const today = localTodayKeyV93();
  const selectedProjectDaily = String((typeof uiState !== "undefined" && uiState.project) ? uiState.project : "").trim();

  const todayRows = (rows || []).filter(r => {
    if(rowLocalDateKey(r) !== today) return false;
    if(selectedProjectDaily && String(r?.project || "").trim() !== selectedProjectDaily) return false;
    return true;
  });

  const isDeposit = (r) => String(r?.entry_type || '').toLowerCase() === 'deposit';
  const hasOrderNo = (r) => !!String(r?.order_no || '').trim();
  const hasInvoiceNo = (r) => !!String(r?.invoice_no || '').trim();
  const hasDeliveryNo = (r) => {
    try{
      return !!(extractDeliveryNoteNo(r) || String(r?.delivery_note_no || r?.dn_no || '').trim());
    }catch(e){
      return !!String(r?.delivery_note_no || r?.dn_no || '').trim();
    }
  };
  const entryType = (r) => String(r?.entry_type || '').toLowerCase();
  const grossAmount = (r) => {
    try{
      if(typeof orderGrossAmount === 'function') return Number(orderGrossAmount(r) || 0);
    }catch(e){}
    return Number(r?.total || r?.amount || r?.totalAfterVAT || r?.total_after_vat || 0);
  };
  const deliveredAmount = (r) => {
    try{
      const delivered = typeof extractDeliveredAmount === 'function' ? Number(extractDeliveredAmount(r) || 0) : 0;
      if(delivered > 0) return delivered;
    }catch(e){}
    return grossAmount(r);
  };
  const invoiceAmount = (r) => {
    try{
      if(typeof invoiceDisplayAmount === 'function') return Number(invoiceDisplayAmount(r) || 0);
    }catch(e){}
    return grossAmount(r);
  };

  let orders = 0;
  let delivered = 0;
  let invoiced = 0;

  todayRows.forEach(r => {
    if(isDeposit(r)) return;
    const type = entryType(r);

    // Important: one Order row can later contain DN and Invoice data.
    // Therefore DAILY must count each component independently, not classify the row as only one state.
    if(hasOrderNo(r) || type === 'order') orders += grossAmount(r);
    if(hasDeliveryNo(r) || type === 'delivery_note' || type === 'dn') delivered += deliveredAmount(r);
    if(hasInvoiceNo(r) || type === 'invoice') invoiced += invoiceAmount(r);
  });

  return { date: today, orders, delivered, invoiced, count: todayRows.length };
}
function renderDailyHeader(summary){
  const d = summary || {date:'',orders:0,delivered:0,invoiced:0,count:0};
  return `
    <div class="daily-header-bar" aria-label="Daily status" data-daily-date="${esc(d.date || '')}">
      <div class="daily-chip daily-title"><span class="daily-label">${esc((typeof uiState !== "undefined" && uiState.project) ? "Daily · " + uiState.project : "Daily")}</span><span id="daily-date" class="daily-value">${esc(d.date || '')}</span></div>
      <div class="daily-chip"><span class="daily-label">Orders</span><span id="daily-orders" class="daily-value">${money(d.orders || 0)}</span></div>
      <div class="daily-chip"><span class="daily-label">DN</span><span id="daily-dn" class="daily-value">${money(d.delivered || 0)}</span></div>
      <div class="daily-chip"><span class="daily-label">Invoice</span><span id="daily-invoice" class="daily-value">${money(d.invoiced || 0)}</span></div>
    </div>`;
}

function getStoredList(key){
  try { return JSON.parse(localStorage.getItem("vardophase_list_" + key) || "[]"); }
  catch(e){ return []; }
}
function saveStoredList(key, arr){
  localStorage.setItem("vardophase_list_" + key, JSON.stringify(arr));
}
function mergeUnique(base, extra){
  return [...new Set([...(base||[]), ...(extra||[])].filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));
}
const DEFAULT_DESCRIPTION_OPTIONS = ["PRELIMINARIES AND GENERAL", "Salaries", "Insurance & Security", "Site Establishment", "Consulting Fees", "Equipment Hire", "Temporary Site Services", "Safety Equipment & First Aid", "Consumables", "Cleaning & Rubble Removal", "Scaffolding", "Permits", "EARTHWORKS", "Earthworks - Sub- Contractor", "Earthworks - Materials", "Earthworks - Other", "Sub Soill Drainage - Sub Contractor", "Sub Soil Drainage - Materials", "PILING", "Piling - Sub- Contractor", "Piling - Other", "CONCRETE, FORMWORK & REINFORCEMENT", "Concrete - Supply", "Concrete- Plant", "Concrete - Labour", "Concrete - Sundries", "Formwork - Supply", "Formwork - Install", "Movement Joints, Supply & Install", "Reinforcing - Supply", "Reinforcing - Labour", "Concrete,Formwork & Reinforcement - Other", "Post Tensioning Reinforcing", "Structural Steel", "Concrete - Guardhouse", "Formwork - Guardhouse", "Reinforcing - Guardhouse", "PRECAST CONCRETE", "Precast Concrete - Supply", "Precast Concrete - Labour", "Propping - Material", "Precast Concrete - Other", "MASONARY", "Brick - Supply", "Brick - Labour", "Building Sand - Supply", "Cement - Supply", "Lintels - Supply & Install", "Galvanized Hoop Iron Cramps, Ties- Supply& Install", "Masonary - Other", "Masonary - Guardhouse", "WATERPROOFING", "Waterproofing - Sub- Contractor", "Waterproofing - Material", "Waterproofing - Other", "Waterproofing - Supply", "ROOF COVERING", "Roof Covering - Sub Contractor", "CARPENTARY & JOINERY", "Skirting - Supply & Install", "Window Sills - Supply & Install", "Door & Frames - Supply", "Door & Frames - Install", "Ducts", "Carpentry - Other", "CEILING", "Ceiling - Sub- Contractor", "Ceiling Materials", "FLOOR COVERING", "Floor Covering - Sub- Contractor", "IRON MONGERY", "Supply Door Handles Etc", "Sub - Contractor", "Ironmongery- Install", "METALWORK", "Balustrading - Supply & Install", "Aluminum Window & Doors- Supply & Install", "Shower Doors - Supply & Install", "Metalwork Sundries", "PLASTERING", "Plaster - Labour", "Screed - Labour", "River Sand - Supply", "Plaster Sand - Supply", "Rhinolight - Supply", "Plaster Key - Supply", "Plastering - Other", "TILING", "Tiles - Supply", "Adhesive - Supply", "Grout - Supply", "Edge Trim - Supply", "Tiling - Labour - Install", "Tiling - Other", "PAINTWORK", "Paintwork -Sub Contractor - Supply & Install", "Paintwork - Other", "Paintwork - Labour", "PROVISIONAL SUMS", "ELECTRICAL", "Electrical - Sub Contractor", "Electrical Fitting", "Electrical - Other", "EARTHING & LIGHTING PROTECTION", "Earthing & Lighting Protection -Sub Contractor", "Earthing & Lighting Protection -Material", "Earthing & Lighting Protection -Other", "DSTV & INTERNET", "DSTV & Internet - Sub Contractor", "DSTV & Internet - Material", "DSTV & Internet -Other", "ELECTRONIC & SECURITY", "Electronic & Security - Sub Contractor", "Electronic & Security - Material", "Electronic & Security - Other", "FIRE INSTALLATION", "Fire Installation - Sub - Contractor", "Fire Installation -Material", "Fire Intallation - Other", "GAS RETICULATION", "Gas Reticulation -Sub Contractor", "Gas Reticulation - Material", "Gas Reticulation - Other", "GAS GEYSERS", "Gas Geysers - Material", "Gas Geysers - Other", "HVAC", "HVAC - Sub Contractor", "HVAC - Materials", "HVAC - Other", "LIFTS & HOISTS", "Lifts & Hoists - Sub Contractor", "Lifts & Hoists - Material", "Lifts & Hoists - Other", "LANDSCAPING", "Landscaping - Sub Contractor", "Landscaping - Material", "Landscaping - Other", "PLUMBING, DRAINING (INC SANITARY,BRASSWARE)", "Plumbing & Drainage - Sub Contractor", "Plumbing & Drainage - Material", "Plumbing & Drainage - Other", "SANITARY FITTING", "Supply Sanitary Fitting & Bathroom Accesories", "Sanitary Fitting - Other", "RAINWATER", "Rainwater - Sub Contractor", "Rainwater - Material", "Rainwater - Other", "Rainwater- Gutters", "SIGNAGE", "Signage - Sub Contractor", "Signage - Material", "Signage - Other", "KITCHENS,BIC , VANITIES", "Kitchen, BIC & Vanities - Sub Contractor", "Kitchen,BIB & Vanities -Material", "Kitchen, BIC & Vanities- Other", "STONEWORK", "Stonework- Sub Contractor", "Stoneworks - Material", "Stoneworks - Other", "MIRRORS", "Mirrors - Sub Contractors", "Mirrors - Material", "Mirrors - Other", "APPLIANCES", "Appliances - Sub Contractor", "Appliances - Material", "Appliances - Other", "SUNDRY METAL WORK", "Sundry Metal Work - Sub Contractor", "Sundry Metal Work - Material", "Sundry Metal Work - Other", "BLINDS & FITTINGS", "Blinds & Fittings- Sub Contractor", "Blinds & Fittings- Materials", "EXTERNAL WORKS", "ROAD WORKS", "Road Works - Sub Contractor", "Road Works - Material", "Road Works - Other", "RETAINING WALLS", "Retaining Walls Sub Contractor", "Retaining Walls Material", "Retaining Walls Other", "CARPORTS", "Carports - Sub Contarctor", "YARD WALLS", "Yard Walls- Sub Contractor", "Yard -Other", "BOUNDARY WALLS", "Boundary Walls- Sub Contractor", "Boundary Walls- Materials", "Boundary Walls- Other", "POOL AREA", "Pool Area - Sub Contractor", "WALL CLADDING", "Wall Cladding - Sub Contractor", "Wall Cladding - Other", "DEVELOPMENT COST & OVERHEADS", "Development  overheads office MVE (Giovanni)", "Development overheads Travel and accomodation (Giovanni)", "O'Two Boutique - Retail Area Project", "O'Two - Repairs and Maintenance", "O'Two Boutique - Executive Lounge Project", "O'Two Boutique - Rooftop Project", "O'Two Boutique - Penthouse Project", "O'Two Boutique - Room Project", "O'Two Boutique - Renovations to Basement", "O'Two Boutique - Boardroom Project (Basement)"];

function normalizeSupplierKey(name){
  return String(name || "").trim().toLowerCase();
}
function getSupplierVatMap(){
  try { return JSON.parse(localStorage.getItem("vardophase_supplier_vat_map") || "{}"); }
  catch(e){ return {}; }
}
function setSupplierVatMap(map){
  localStorage.setItem("vardophase_supplier_vat_map", JSON.stringify(map || {}));
}
function getSupplierVatType(name){
  const key = normalizeSupplierKey(name);
  if(!key) return "registered";
  const map = getSupplierVatMap();
  return map[key] || "registered";
}
function setSupplierVatType(name, vatType){
  const key = normalizeSupplierKey(name);
  if(!key) return;
  const map = getSupplierVatMap();
  map[key] = vatType || "registered";
  setSupplierVatMap(map);
}
function supplierIsVatRegistered(name){
  return getSupplierVatType(name) !== "not_registered";
}

function setLoginStatus(msg, type="ok"){
  const el = document.getElementById("loginStatus");
  el.className = "status " + type;
  el.textContent = msg;
}
function setEntryStatus(msg, type="ok"){
  const el = document.getElementById("entryStatusMsg");
  if(!el) return;
  el.className = "status " + type;
  el.textContent = msg;
}

function canAdmin(){
  return currentRole === "admin";
}
function canManager(){
  return currentRole === "admin" || currentRole === "manager";
}
function canAccountant(){
  return currentRole === "admin" || currentRole === "manager" || currentRole === "accountant";
}
function canCreateOrder(){
  return currentRole === "admin" || currentRole === "manager" || currentRole === "user";
}
function canCreateInvoice(){
  return currentRole === "admin" || currentRole === "manager" || currentRole === "accountant";
}
function canManageLists(){
  return currentRole === "admin";
}
function canManageSettings(){
  return currentRole === "admin";
}
function canManageRoles(){
  return currentRole === "admin";
}
function canViewAudit(){
  return currentRole === "admin" || currentRole === "manager" || currentRole === "accountant";
}
function canDeleteRows(){
  return currentRole === "admin";
}
function canEditAnyEntry(){
  return currentRole !== "viewer";
}
function getRoleLabel(){
  return String(currentRole || "user").toUpperCase();
}
function renderToolbarButtons(){
  const btn = [];
  if(canCreateOrder()) btn.push('<button class="primary main-action" onclick="window.openOrderModal()">Order</button>');
  if(canCreateInvoice()) btn.push('<button class="warning main-action" onclick="window.openInvoiceModal()">Invoice</button>');
  if(canAccountant()) btn.push('<button class="soft main-action add-deposit-btn" onclick="window.openDepositModal()">Add Deposit</button>');
  if(canAccountant()) btn.push('<button class="soft main-action credit-note-btn" onclick="window.openCreditNoteModal()">Credit Note</button>');
  if(canManageLists()) btn.push('<button class="ghost" onclick="window.openListsModal()">Manage Lists</button>');
  if(canManageSettings()) btn.push('<button class="ghost" onclick="window.openSettingsModal()">VAT Settings</button>');
  btn.push('<button class="ghost" onclick="window.openAISearchModal()">AI Search Pro</button>');
  if(canAccountant()) btn.push('<button class="soft" onclick="window.exportCurrentCsv()">Export CSV</button>');
  if(canAccountant()) btn.push('<button class="soft" onclick="window.openSupplierReportModal()">Supplier Report</button>');
  if(canAccountant()) btn.push('<button class="soft" onclick="window.printSupplierDepositReport()">Supplier Credit Statement</button>');
  if(canAccountant()) btn.push('<button class="soft" onclick="window.printProjectSummary()">Project Report</button>');
  if(canAccountant()) btn.push('<button class="soft" onclick="window.printMonthlyReport()">Monthly Report</button>');
  if(canAccountant()) btn.push('<button class="warning" onclick="window.shareMonthlyToWhatsApp()">Share Monthly PDF</button>');
  if(canAccountant()) btn.push('<button class="soft" onclick="window.printOpenOrdersReport()">Open Orders Report</button>');
  if(canViewAudit()) btn.push('<button class="ghost" onclick="window.openAuditLog()">Audit Log</button>');
  if(canManageRoles()) btn.push('<button class="ghost" onclick="window.openRolesModal()">User Roles</button>');
  return btn.join('');
}
function renderSelectionButtons(){
  const btn = [];
  if(canEditAnyEntry()) btn.push('<button class="soft" onclick="window.duplicateEntry()">Duplicate Selected</button>');
  if(canAccountant()) btn.push('<button class="primary main-action convert-order" onclick="window.convertOrderToDN()">Convert Order → DN</button>');
  if(canAccountant()) btn.push('<button class="primary main-action convert-order" onclick="window.openConvertOrderModal()">Convert to Invoice</button>');
  if(canAccountant()) btn.push('<button class="credit-note-btn-pro main-action" onclick="window.openCreditNoteModal()">Credit Note</button>');
  if(canAccountant()) btn.push('<button class="green" onclick="window.bulkMarkPaid()">Mark Selected Paid</button>');
  if(canAccountant()) btn.push('<button class="reverse-dn-btn" onclick="window.reverseSelectedDN()">Reverse DN</button>');
  if(canDeleteRows()) btn.push('<button class="red delete-selected-btn" onclick="window.bulkDelete()">Delete Selected</button>');
  btn.push('<button class="ghost" onclick="window.clearSelection()">Clear Selection</button>');
  return btn.join('');
}
async function fetchUserRole(email){
  const normalized = String(email || "").trim().toLowerCase();
  if(!normalized) return "user";
  const bootstrapAdmins = ["admin@vardophase.com","moshe6160@gmail.com","moshe6160@gmail.com".toLowerCase()];
  if(bootstrapAdmins.includes(normalized)) return "admin";
  try{
    const { data, error } = await supabase.from("user_roles").select("role").eq("email", normalized).maybeSingle();
    if(error) return "user";
    const role = String(data?.role || "user").toLowerCase();
    return ["admin","manager","accountant","viewer","user","dn_approver"].includes(role) ? role : "user";
  }catch(e){
    return "user";
  }
}

async function logAudit(action, details=""){
  try{
    if(!currentUser?.email) return;
    await supabase.from("audit_logs").insert([{
      user_email: String(currentUser.email).toLowerCase(),
      role: currentRole || "user",
      action,
      details
    }]);
  }catch(e){}
}

function applyTheme(theme){
  document.body.classList.toggle("light-mode", theme === "light");
}
function loadTheme(){
  const t = localStorage.getItem("vardophase_theme") || "dark";
  applyTheme(t);
}
document.getElementById("themeBtn").addEventListener("click", ()=>{
  const next = document.body.classList.contains("light-mode") ? "dark" : "light";
  localStorage.setItem("vardophase_theme", next);
  applyTheme(next);
});
loadTheme();

document.addEventListener("click", function(ev){
  const btn = ev.target.closest(".nav-pill[data-tab]");
  if(!btn) return;
  ev.preventDefault();
  ev.stopPropagation();
  const tab = btn.getAttribute("data-tab");
  if(tab) window.setTab(tab);
}, true);


function showApp(){
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("appScreen").classList.remove("hidden");
}
function showLogin(){
  document.getElementById("appScreen").classList.add("hidden");
  document.getElementById("loginScreen").classList.remove("hidden");
}

async function login(){
  const btn = document.getElementById("loginBtn");
  if(btn) btn.disabled = true;
  setLoginStatus("Logging in...");
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value || "";
  if(!email || !password){
    setLoginStatus("Enter email and password.", "error");
    if(btn) btn.disabled = false;
    return;
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if(btn) btn.disabled = false;
  if(error){
    setLoginStatus(error.message, "error");
    return;
  }
  currentUser = data.user;
  currentRole = await fetchUserRole(currentUser?.email || "");
  showApp();
  await render();
  setupRealtime();
}
async function logout(){
  await supabase.auth.signOut();
  if(channel){
    await supabase.removeChannel(channel);
    channel = null;
  }
  currentUser = null;
  currentRole = "user";
  selectedIds = [];
  editingId = null;
  showLogin();
  setLoginStatus("");
}

window.safeLoginClick = async function(){
  try{
    await login();
  }catch(err){
    setLoginStatus(err?.message || "Login failed", "error");
    const btn = document.getElementById("loginBtn");
    if(btn) btn.disabled = false;
  }
};
function setupRealtime(){
  if(channel) return;
  channel = supabase.channel("suppliers-cloud-live")
    .on("postgres_changes", { event:"*", schema:"public", table:"suppliers" }, async () => {
      await render();
    })
    .subscribe();
}


window.windowAction = function(ev, action){
  if(ev){
    ev.preventDefault();
    ev.stopPropagation();
  }
  const host = ev?.target?.closest?.('.modal-box, .card, .panel, .login-card');
  if(!host) return;
  const modal = ev?.target?.closest?.('.modal');

  if(action === 'close'){
    if(modal) modal.classList.remove('show');
    else host.style.display = 'none';
    return;
  }

  if(action === 'compact'){
    const title = host.querySelector('.section-title, .title, h3')?.textContent?.trim() || 'Window';
    const id = host.dataset.windowId || ('w_' + Math.random().toString(36).slice(2,9));
    host.dataset.windowId = id;
    host.style.display = 'none';
    const dock = document.getElementById('windowDock');
    if(!dock) return;
    if(dock.querySelector(`[data-window-id="${id}"]`)) return;
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'dock-item';
    item.dataset.windowId = id;
    item.textContent = title;
    item.onclick = () => {
      host.style.display = '';
      item.remove();
      if(modal) modal.classList.add('show');
    };
    dock.appendChild(item);
    return;
  }

  if(action === 'maximize'){
    host.classList.toggle('maximized');
    host.classList.remove('compact');
  }
};


async function getAllRows(){
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("created_at", { ascending:false })
    .limit(PERFORMANCE_CONFIG.hardLimit);
  if(error) throw error;
  return computeLedger(data || []);
}

async function getEntries(){
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("created_at", { ascending:false })
    .limit(PERFORMANCE_CONFIG.hardLimit || 1000);

  if(error) throw error;

  let rows = computeLedger(data || []);

  // Month behavior:
  // If a month is selected, show:
  // 1. Rows created in selected month
  // 2. Carry Forward rows from previous months that are still not closed/paid
  if(selectedMonth){
    const currentYear = new Date().getFullYear();
    const monthStart = `${currentYear}-${selectedMonth}-01`;
    const nextMonthNumber = Number(selectedMonth) === 12 ? 1 : Number(selectedMonth) + 1;
    const nextYear = Number(selectedMonth) === 12 ? currentYear + 1 : currentYear;
    const monthEnd = `${nextYear}-${String(nextMonthNumber).padStart(2,"0")}-01`;

    rows = rows.filter(r => {
      const date = String(r.created_at || "");
      const inSelectedMonth = date >= monthStart && date < monthEnd;

      const hasInvoice = !!String(r.invoice_no || "").trim();
      const status = String(r.status || "").toLowerCase();
      const isClosed = hasInvoice || status === "paid" || status === "closed" || status === "covered";
      const isCarryForward = date < monthStart && !isClosed;

      return inSelectedMonth || isCarryForward;
    });
  }

  if(uiState.search){
    rows = rows.filter(r => smartSearch(r, uiState.search));
  }

  if(uiState.supplier){
    rows = rows.filter(r => String(r.supplier || "") === uiState.supplier);
  }

  if(uiState.project){
    rows = rows.filter(r => String(r.project || "") === uiState.project);
  }

  if(uiState.status){
    rows = rows.filter(r => String(r.status || "") === uiState.status);
  }

  if(uiState.tab === "orders"){
    rows = rows.filter(r => {
      const label = typeof processStatusLabel === "function" ? processStatusLabel(r) : displayEntryKind(r);
      return label === "Order" || label === "Delivery Note";
    });
  }

  if(uiState.tab === "invoices"){
    rows = rows.filter(r => {
      const label = typeof processStatusLabel === "function" ? processStatusLabel(r) : displayEntryKind(r);
      return label === "Invoice" || label === "Done" || displayEntryKind(r) === "invoice";
    });
  }

  rows.sort((a,b) => {
    const av = Number(a.total || a.amount || 0);
    const bv = Number(b.total || b.amount || 0);

    if(uiState.sort === "date_asc") return String(a.created_at || "").localeCompare(String(b.created_at || ""));
    if(uiState.sort === "amount_desc") return bv - av;
    if(uiState.sort === "amount_asc") return av - bv;
    if(uiState.sort === "supplier_asc") return String(a.supplier || "").localeCompare(String(b.supplier || ""));
    return String(b.created_at || "").localeCompare(String(a.created_at || ""));
  });

  const __vpSlicedRows = rows.slice(0, PERFORMANCE_CONFIG.defaultLimit || 300);
  try{
    window.__VP_ROW_CACHE = window.__VP_ROW_CACHE || {};
    __vpSlicedRows.forEach(r => { if(r && r.id != null) window.__VP_ROW_CACHE[String(r.id)] = r; });
    window.__VP_ROW_CACHE_TS = Date.now();
  }catch(e){}
  return __vpSlicedRows;
}

function computeLedger(rows){
  const sorted = [...rows].sort((a,b)=>{
    const ad = a.created_at || "";
    const bd = b.created_at || "";
    if(ad !== bd) return ad.localeCompare(bd);
    return String(a.id||"").localeCompare(String(b.id||""));
  });

  const totalDeposits = {};
  sorted.forEach(r=>{
    const supplier = r.supplier || "Unknown";
    const type = (r.entry_type || "invoice").toLowerCase();
    const amount = Number(r.total || r.amount || 0);
    if(type === "deposit"){
      totalDeposits[supplier] = (totalDeposits[supplier] || 0) + amount;
    }
  });

  const used = {};
  return sorted.map(r=>{
    const e = {...r};
    const supplier = e.supplier || "Unknown";
    const type = (e.entry_type || "invoice").toLowerCase();
    const amount = Number(e.total || e.amount || 0);
    const availableBefore = Math.max(0, Number(totalDeposits[supplier] || 0) - Number(used[supplier] || 0));

    e.entry_type = type;
    e.deposit_applied = 0;
    e.amount_due = 0;
    e.unpaid_after_deposit = 0;

    if(type === "deposit"){
      e.status = "Deposit";
      e.amount_due = 0;
    } else {
      const applied = Math.min(availableBefore, amount);
      e.deposit_applied = applied;
      e.amount_due = Math.max(0, amount - applied);
      e.unpaid_after_deposit = e.amount_due;
      used[supplier] = Number(used[supplier] || 0) + applied;

      if(e.amount_due <= 0){
        e.status = "Covered";
      } else if(e.deposit_applied > 0){
        e.status = "Part Covered";
      } else if(!e.status){
        e.status = "Unpaid";
      }
    }

    const totalUsed = Number(used[supplier] || 0);
    e.supplier_credit_balance = Math.max(0, Number(totalDeposits[supplier] || 0) - totalUsed);
    return e;
  });
}

function totals(entries){
  let invoiceTotal = 0, orderTotal = 0, depositTotal = 0, depositApplied = 0, outstanding = 0, net = 0, vat = 0;
  const grouped = {};
  entries.forEach(e=>{
    const supplier = e.supplier || "Unknown";
    const kind = displayEntryKind(e);
    const base = depositBaseAmount(e);
    if(!grouped[supplier]) grouped[supplier] = { deposits:0, invoices:0 };
    if(kind === "deposit"){
      depositTotal += base;
      grouped[supplier].deposits += base;
    } else if(kind === "credit_note"){
      const creditValue = Math.abs(Number(e.total || e.amount || e.net_amount || 0));
      invoiceTotal -= creditValue;
      net -= Math.abs(Number(e.net_amount || creditValue || 0));
      vat -= Math.abs(Number(e.vat_amount || 0));
      grouped[supplier].invoices -= creditValue;
    } else if(kind === "invoice"){
      // If DN exists, invoice financial value follows delivered amount.
      // If no DN exists, it falls back to the invoice/order total.
      const invoiceBase = (typeof invoiceDisplayAmount === "function") ? invoiceDisplayAmount(e) : base;
      const dueBase = (typeof amountDueDisplay === "function") ? amountDueDisplay(e) : Math.max(0, invoiceBase - Number(e.deposit_applied || 0));
      invoiceTotal += invoiceBase;
      depositApplied += Number(e.deposit_applied || 0);
      outstanding += dueBase;
      net += Number(e.net_amount || 0);
      vat += Number(e.vat_amount || 0);
      grouped[supplier].invoices += invoiceBase;
    } else {
      orderTotal += base;
    }
  });
  const carryForward = Object.values(grouped).reduce((sum, g) => sum + Math.max(0, g.deposits - g.invoices), 0);
  return { invoiceTotal, orderTotal, depositTotal, depositApplied, outstanding, net, vat, carryForward, suppliers: new Set(entries.map(e=>e.supplier)).size };
}

function setMonthFilter(m){ selectedMonth = selectedMonth === m ? "" : m; render(); }
function clearSelection(){ selectedIds = []; render(); }
function toggleRowSelect(id, ev){
  if(ev && typeof ev.preventDefault === "function" && ev.currentTarget && ev.currentTarget.tagName === "TD"){
    // Let checkbox click control itself; prevent td double-toggle when needed.
  }
  if(ev && typeof ev.stopPropagation === "function") ev.stopPropagation();

  const checkbox = ev?.target?.closest ? ev.target.closest('input[type="checkbox"]') : null;
  let checked;

  if(checkbox){
    checked = !!checkbox.checked;
  } else {
    checked = !selectedIds.includes(id);
  }

  if(checked){
    if(!selectedIds.includes(id)) selectedIds.push(id);
  } else {
    selectedIds = selectedIds.filter(x=>x!==id);
  }

  const row = (ev && ev.target) ? ev.target.closest("tr") : null;
  if(row){
    row.classList.toggle("selected", checked);
    const cb = row.querySelector('input[type="checkbox"]');
    if(cb) cb.checked = checked;
  }

  const counters = document.querySelectorAll("[data-selected-count]");
  counters.forEach(el => el.textContent = String(selectedIds.length));

  return true;
}
async function duplicateEntry(){
  if(!canEditAnyEntry()) return alert("This role cannot duplicate rows.");
  if(!selectedIds.length) return alert("Select rows first.");

  const { data, error } = await supabase.from("suppliers").select("*").in("id", selectedIds);
  if(error) return alert(error.message);
  if(!data || !data.length) return alert("No selected rows found.");

  const copies = data.map(row => {
    const copy = {...row};
    delete copy.id;
    delete copy.created_at;
    copy.created_by = currentUser?.email || "";
    copy.status = copy.status || row.status || "";
    // Avoid accidental duplicate invoice number collision.
    if(copy.invoice_no) copy.invoice_no = String(copy.invoice_no) + "-COPY";
    if(copy.order_no) copy.order_no = String(copy.order_no) + "-COPY";
    return copy;
  });

  const { error: insertError } = await supabase.from("suppliers").insert(copies);
  if(insertError) return alert(insertError.message);

  await logAudit("duplicate_selected", `rows=${selectedIds.length}`);
  selectedIds = [];
  await render();
}
async function bulkMarkPaid(){
  if(!canAccountant()) return alert("Only accountant or admin can mark paid.");
  if(!selectedIds.length) return alert("Select rows first.");
  // Mark as paid must also clear all outstanding balances.
  const { error } = await supabase.from("suppliers").update({
    status:"Paid",
    amount_due:0,
    unpaid_after_deposit:0
  }).in("id", selectedIds);
  if(error) alert(error.message);
  else await logAudit("bulk_mark_paid", `rows=${selectedIds.length}`);
  selectedIds = [];
  await render();
}
async function bulkDelete(){
  if(!canAdmin()) return alert("Only admin can delete rows.");
  if(!selectedIds.length) return alert("Select rows first.");
  if(!confirm("Delete selected rows?")) return;
  const { error } = await supabase.from("suppliers").delete().in("id", selectedIds);
  if(error) alert(error.message);
  else await logAudit("bulk_delete", `rows=${selectedIds.length}`);
  selectedIds = [];
  await render();
}


function closeCustomSelectMenus(exceptWrap=null){
  document.querySelectorAll('.custom-select-wrap.open').forEach(w=>{
    if(exceptWrap && w===exceptWrap) return;
    w.classList.remove('open');
  });
}
function buildCustomSelect(select){
  if(!select || select.dataset.customized === "1") return;
  select.dataset.customized = "1";
  select.classList.add('custom-select-native');

  const wrap = document.createElement('div');
  wrap.className = 'custom-select-wrap';
  select.parentNode.insertBefore(wrap, select);
  wrap.appendChild(select);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'custom-select-btn';
  wrap.appendChild(btn);

  const menu = document.createElement('div');
  menu.className = 'custom-select-menu';
  wrap.appendChild(menu);

  const renderMenu = ()=>{
    const opts = Array.from(select.options || []);
    const selectedText = (opts.find(o=>o.value===select.value)?.textContent || opts[0]?.textContent || '').trim();
    btn.textContent = selectedText;
    menu.innerHTML = '';
    opts.forEach(opt=>{
      const item = document.createElement('div');
      item.className = 'custom-select-item' + (opt.value===select.value ? ' active' : '') + (!opt.value ? ' placeholder' : '');
      item.textContent = opt.textContent;
      item.onclick = (e)=>{
        e.preventDefault();
        e.stopPropagation();
        select.value = opt.value;
        renderMenu();
        wrap.classList.remove('open');
        select.dispatchEvent(new Event('change', {bubbles:true}));
      };
      menu.appendChild(item);
    });
  };

  btn.onclick = (e)=>{
    e.preventDefault();
    e.stopPropagation();
    const isOpen = wrap.classList.contains('open');
    closeCustomSelectMenus(wrap);
    wrap.classList.toggle('open', !isOpen);
    renderMenu();
  };

  renderMenu();
  select._customRefresh = renderMenu;
}
function initCustomSelects(scope=document){
  scope.querySelectorAll('select.dark').forEach(buildCustomSelect);
}
function refreshCustomSelects(scope=document){
  scope.querySelectorAll('select.dark').forEach(sel=>{
    if(typeof sel._customRefresh === 'function') sel._customRefresh();
  });
}
document.addEventListener('click', ()=> closeCustomSelectMenus());







window.openAISearchModal = function(){
  document.getElementById("aiSearchModal")?.classList.add("show");
  if(!window.__assistantBooted){
    window.__assistantBooted = true;
    window.clearAssistantChat();
  }
};
window.closeAISearchModal = function(){
  document.getElementById("aiSearchModal")?.classList.remove("show");
};

function escHtml(s){
  return String(s || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

function setAssistantLinks(items){
  const wrap = document.getElementById("assistantQuickLinks");
  if(!wrap) return;
  if(!items || !items.length){
    wrap.innerHTML = '<div class="helper">Supplier, Google, Maps, Shopping, and saved-search links will appear here.</div>';
    return;
  }
  wrap.innerHTML = items.map(item => {
    const title = item.title || item.label || "Open link";
    const subtitle = item.subtitle || item.snippet || "";
    const url = item.url || "#";
    return `
      <a class="assistant-link" href="${url}" target="_blank" rel="noopener noreferrer">
        <strong>${escHtml(title)}</strong>
        <span>${escHtml(subtitle)}</span>
      </a>
    `;
  }).join("");
}

function pushAssistantMessage(role, text){
  const chat = document.getElementById("assistantChat");
  if(!chat) return;
  const msg = document.createElement("div");
  msg.className = "assistant-msg " + role;
  msg.innerHTML = `
    <div class="assistant-label">${role === "user" ? "You" : "AI Assistant"}</div>
    <div class="assistant-bubble">${escHtml(text)}</div>
  `;
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

window.clearAssistantChat = function(){
  const chat = document.getElementById("assistantChat");
  const input = document.getElementById("assistantInput");
  if(chat){
    chat.innerHTML = "";
    pushAssistantMessage("ai", "Hi. I am Vardophase AI Search Pro.\n\nYou can ask me almost anything: suppliers, products, ideas, prices, comparisons, real-estate, business questions, and general information. For supplier or product searches, I can also generate live quick links.");
  }
  if(input) input.value = "";
  setAssistantLinks([]);
};

window.fillAssistantInput = function(text){
  const input = document.getElementById("assistantInput");
  if(input) input.value = text;
};

window.openAISearchWithText = function(text){
  window.openAISearchModal();
  const input = document.getElementById("assistantInput");
  if(input){
    input.value = String(text || "").trim();
    input.focus();
  }
};
window.searchFromEntrySupplier = function(){
  const supplier = document.getElementById("entrySupplier")?.value || "";
  const description = document.getElementById("entryDescription")?.value || document.getElementById("entryDescriptionSelect")?.value || "";
  const project = document.getElementById("entryProject")?.value || "";
  const query = [description, supplier, project].filter(Boolean).join(" ").trim() || "find suppliers";
  window.openAISearchWithText(query);
};

window.syncQuickListSearch = function(type){
  const map = {
    supplier: { input: 'searchSupplierInput', select: 'removeSupplierSelect' },
    project: { input: 'searchProjectInput', select: 'removeProjectSelect' },
    description: { input: 'searchDescriptionInput', select: 'removeDescriptionSelect' }
  };
  const cfg = map[type];
  if(!cfg) return;
  const input = document.getElementById(cfg.input);
  const select = document.getElementById(cfg.select);
  if(!input || !select) return;

  const query = String(input.value || '').trim().toLowerCase();
  const options = Array.from(select.options).slice(1);

  options.forEach(opt => {
    const hit = !query || String(opt.textContent || '').toLowerCase().includes(query);
    opt.hidden = !hit;
  });

  const firstVisible = options.find(opt => !opt.hidden);
  if(firstVisible){
    select.value = firstVisible.value;
  } else if(!query) {
    select.value = "";
  }
};

window.searchSimilarSupplierFromList = function(){
  const supplier = document.getElementById("supplierVatSelect")?.value || "";
  const query = supplier ? `find similar suppliers to ${supplier}` : "find suppliers";
  window.openAISearchWithText(query);
};
window.filterQuickListOptions = function(type){
  const map = {
    project: { search: 'searchProjectInput', select: 'removeProjectSelect' },
    supplier: { search: 'searchSupplierInput', select: 'removeSupplierSelect' },
    description: { search: 'searchDescriptionInput', select: 'removeDescriptionSelect' }
  };
  const cfg = map[type];
  if(!cfg) return;
  const q = (document.getElementById(cfg.search)?.value || '').toLowerCase().trim();
  const sel = document.getElementById(cfg.select);
  if(!sel) return;
  Array.from(sel.options).forEach((opt, idx) => {
    if(idx === 0){ opt.hidden = false; return; }
    const text = (opt.textContent || '').toLowerCase();
    opt.hidden = q ? !text.includes(q) : false;
  });
};


window.sendAssistantMessage = async function(){
  const input = document.getElementById("assistantInput");
  const q = String(input?.value || "").trim();
  if(!q) return;

  pushAssistantMessage("user", q);
  input.value = "";

  try{
    const res = await fetch("/.netlify/functions/ai-assistant", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({
        message: q,
        currentUserEmail: currentUser?.email || "",
        currentRole: currentRole || "user"
      })
    });

    const data = await res.json().catch(() => ({}));

    if(!res.ok){
      throw new Error(data?.error || "AI request failed");
    }

    pushAssistantMessage("ai", data.answer || "No answer returned.");
    setAssistantLinks(data.links || []);
  } catch(err){
    pushAssistantMessage("ai", "AI Assistant error:\n\n" + (err?.message || "Unknown error"));
    setAssistantLinks([]);
  }
};

document.addEventListener("keydown", (e)=>{
  const active = document.activeElement;
  if(active && active.id === "assistantInput" && (e.ctrlKey || e.metaKey) && e.key === "Enter"){
    e.preventDefault();
    window.sendAssistantMessage();
  }
});


async function render(){
  const allRows = await getAllRows();
  const entries = await getEntries();
  const sum = totals(entries);
  const openOrders = openOrdersSummary(entries);
  const dailyHeader = dailyHeaderSummary(allRows);
  const suppliers = mergeUnique(getStoredList("supplier"), [...new Set(allRows.map(e=>e.supplier).filter(Boolean))]);
  const projects = mergeUnique(getStoredList("project"), [...new Set(allRows.map(e=>e.project).filter(Boolean))]);
  const descriptions = mergeUnique(DEFAULT_DESCRIPTION_OPTIONS, mergeUnique(getStoredList("description"), [...new Set(allRows.map(e=>e.description).filter(Boolean))]));

  document.getElementById("app").innerHTML = `
    <div class="shell">
      <header class="card">
        <div class="window-bar"><button class="window-btn red" onclick="window.windowAction(event,'close')"></button><button class="window-btn yellow" onclick="window.windowAction(event,'compact')"></button><button class="window-btn green" onclick="window.windowAction(event,'maximize')"></button></div>
        <div class="brand">
          <div class="brand-left">
            <div class="logo">V</div>
            <div>
              <div class="title">VARDOPHASE</div>
              <div class="brand-subtitle">Suppliers Cloud Pro</div>
              ${renderDailyHeader(dailyHeader)}
              ${currentRole !== "admin" ? `<div class="sub">⚠️ Limited access</div>` : ``}
              <div class="userbar">
                <span>👤 ${esc(currentUser?.email || "")}</span>
                <span class="role-badge role-${esc(currentRole || "user")}">${esc(String(currentRole || "user").toUpperCase())}</span>
              </div>
            </div>
          </div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:flex-end">
            <button class="ghost" onclick="window.openPasswordModal()">Change Password</button>
            <button class="red" onclick="window.logout()">Logout</button>
          </div>
        </div>
        <div class="toolbar">
          <button class="primary main-action" onclick="window.openOrderModal()">Order</button>
          <button class="warning main-action" onclick="window.openInvoiceModal()">Invoice</button>
          <button class="soft main-action add-deposit-btn" onclick="window.openDepositModal()">Add Deposit</button>
          <button class="ghost" onclick="window.openListsModal()">Manage Lists</button>
          <button class="ghost" onclick="window.openSettingsModal()">VAT Settings</button>
          <button class="ghost" onclick="window.openAISearchModal()">AI Search Pro</button>
          <button class="soft" onclick="window.exportCurrentCsv()">Export CSV</button>
          <button class="soft" onclick="window.openSupplierReportModal()">Supplier Report</button>
          <button class="soft" onclick="window.printSupplierDepositReport()">Supplier Credit Statement</button>
          <button class="soft" onclick="window.printProjectSummary()">Project Report</button>
          <button class="soft" onclick="window.printMonthlyReport()">Monthly Report</button>
          
          <button class="warning" onclick="window.shareMonthlyToWhatsApp()">Share Monthly PDF</button>
          <button class="soft" onclick="window.printOpenOrdersReport()">Open Orders Report</button>
          <button class="ghost" onclick="window.openAuditLog()">Audit Log</button>
          <button class="ghost" onclick="window.openRolesModal()">User Roles</button>
        </div>

        <div class="month-tools ${uiState.tab==='dashboard' || uiState.tab==='orders' || uiState.tab==='invoices' ? '' : 'hidden'}">
          ${monthNames.map((m,i)=>`<button class="month-btn ${selectedMonth===String(i+1).padStart(2,'0')?'active':''}" onclick="window.setMonthFilter('${String(i+1).padStart(2,'0')}')">${m}</button>`).join("")}
        </div>

        <div class="filters ${uiState.tab==='dashboard' || uiState.tab==='orders' || uiState.tab==='invoices' ? '' : 'hidden'}">
          <div style="display:grid;grid-template-columns:1fr auto;gap:10px">
            <input class="dark" id="searchInput" placeholder="Search invoice / supplier / project / description" value="${esc(uiState.search)}">
            <button class="search-btn" onclick="window.applyFilters()">Search</button>
          </div>
          <select class="dark" id="supplierFilter">
            <option value="">All Suppliers</option>
            ${suppliers.map(s=>`<option value="${esc(s)}" ${uiState.supplier===s?'selected':''}>${esc(s)}</option>`).join("")}
          </select>
          <select class="dark" id="projectFilter">
            <option value="">All Projects</option>
            ${projects.map(p=>`<option value="${esc(p)}" ${uiState.project===p?'selected':''}>${esc(p)}</option>`).join("")}
          </select>
          <select class="dark" id="statusFilter">
            <option value="">All Status</option>
            ${["Paid","Unpaid","Partial","Closed","Covered","Part Covered","Deposit"].map(st=>`<option value="${esc(st)}" ${uiState.status===st?'selected':''}>${esc(st)}</option>`).join("")}
          </select>
          <select class="dark" id="sortFilter">
            <option value="date_desc" ${uiState.sort==='date_desc'?'selected':''}>Newest First</option>
            <option value="date_asc" ${uiState.sort==='date_asc'?'selected':''}>Oldest First</option>
            <option value="amount_desc" ${uiState.sort==='amount_desc'?'selected':''}>Amount High-Low</option>
            <option value="amount_asc" ${uiState.sort==='amount_asc'?'selected':''}>Amount Low-High</option>
            <option value="supplier_asc" ${uiState.sort==='supplier_asc'?'selected':''}>Supplier A-Z</option>
          </select>
        </div>
      </header>

      <section class="panel">
        <div class="window-bar"><button class="window-btn red" onclick="window.windowAction(event,'close')"></button><button class="window-btn yellow" onclick="window.windowAction(event,'compact')"></button><button class="window-btn green" onclick="window.windowAction(event,'maximize')"></button></div>
        <div class="alert-strip ${uiState.tab==='dashboard' || uiState.tab==='orders' ? '' : 'hidden'}">
          <div class="alert-card"><div class="label">Open Orders</div><div class="value money-gold">${openOrders.count}</div></div>
          <div class="alert-card"><div class="label">Open Orders Value</div><div class="value money-blue">${money(openOrders.total)}</div></div>
          <div class="alert-card"><div class="label">Orders 30+ Days</div><div class="value money-amber">${openOrders.older30}</div></div>
          <div class="alert-card"><div class="label">Orders 60+ Days</div><div class="value money-red">${openOrders.older60}</div></div>
        </div>
        <h2 class="section-title ${uiState.tab==='dashboard' ? '' : 'hidden'}">Overview</h2>
        <div class="helper" style="margin-bottom:12px">Credit statement basis: ${getDepositBasis()==="net" ? "Before VAT" : "After VAT / Total"}</div>
        ${(uiState.supplier || uiState.project) ? `
        <div class="stats ${uiState.tab==='dashboard' || uiState.tab==='suppliers' || uiState.tab==='projects' ? '' : 'hidden'}">
          <div class="stat"><div class="label">Orders Total</div><div class="value money-blue">${money(sum.orderTotal)}</div></div>
          <div class="stat"><div class="label">Invoices Total</div><div class="value money-blue">${money(sum.invoiceTotal)}</div></div>
          <div class="stat"><div class="label">Open Orders</div><div class="value money-gold">${openOrders.count}</div></div>
          <div class="stat"><div class="label">Deposits Added</div><div class="value money-green">${money(sum.depositTotal)}</div></div>
          <div class="stat"><div class="label">Deposit Applied</div><div class="value money-amber">${money(sum.depositApplied)}</div></div>
          <div class="stat"><div class="label">Outstanding After Deposit</div><div class="value money-red">${money(sum.outstanding)}</div></div>
          <div class="stat"><div class="label">Carry Forward Credit</div><div class="value money-gold">${money(sum.carryForward)}</div></div>
          <div class="stat"><div class="label">${uiState.supplier ? 'Supplier' : 'Project'}</div><div class="value money-blue">${esc(uiState.supplier || uiState.project)}</div></div>
        </div>` : `
        <div class="stats ${uiState.tab==='dashboard' || uiState.tab==='suppliers' || uiState.tab==='projects' || uiState.tab==='orders' || uiState.tab==='invoices' ? '' : 'hidden'}">
          <div class="stat"><div class="label">Orders Total</div><div class="value money-blue">${money(sum.orderTotal)}</div></div>
          <div class="stat"><div class="label">Invoices Total</div><div class="value money-blue">${money(sum.invoiceTotal)}</div></div>
          <div class="stat"><div class="label">Open Orders</div><div class="value money-gold">${openOrders.count}</div></div>
          <div class="stat"><div class="label">Orders 30+ Days</div><div class="value money-red">${openOrders.older30}</div></div>
          <div class="stat"><div class="label">Orders 60+ Days</div><div class="value money-red">${openOrders.older60}</div></div>
          <div class="stat"><div class="label">Suppliers in View</div><div class="value money-blue">${sum.suppliers}</div></div>
          <div class="stat"><div class="label">Credit Statement</div><div class="value" style="font-size:14px;color:#a7a9b3">Choose a supplier to view deposit, applied credit and carry forward.</div></div>
        </div>`}

        <div class="helper" style="margin-bottom:10px">Selected rows: <span data-selected-count>${selectedIds.length}</span></div><div class="toolbar supplier-selection-toolbar" style="grid-template-columns:repeat(6,1fr);margin-bottom:12px">
<button class="soft main-action" onclick="window.convertOrderToDN()">Convert Order → DN</button>
<button class="soft main-action" onclick="window.openConvertOrderModal()">Convert to Invoice</button>
<button class="credit-note-btn-pro main-action" onclick="window.openCreditNoteModal()">Credit Note</button>
<button class="green" onclick="window.bulkMarkPaid()">Mark Selected</button>
<button onclick="window.duplicateEntry()">Duplicate Selected</button>
<button class="reverse-dn-btn" onclick="window.reverseSelectedDN()">Reverse DN</button>
<button class="red delete-selected-btn" onclick="window.bulkDelete()">Delete Selected</button>
</div>
        <div class="helper" style="margin-bottom:10px">Tip: drag the table left/right or swipe sideways to see all columns.</div>

        <div class="table-wrap ${uiState.tab==='dashboard' || uiState.tab==='orders' || uiState.tab==='invoices' ? '' : 'hidden'}">
          <table>
            <thead>
              <tr>
                <th>Select</th>
                <th>Date</th>
                <th>Month Status</th>
                <th>Supplier</th>
                <th>Process</th>
                <th>Order No</th>
                <th>Supplier Order No</th>
                <th>Delivery Note</th>
                <th>Delivered</th>
                <th>Balance</th>
                <th>Closure</th>
                <th>Invoice No</th>
                <th>Project</th>
                <th>Description</th>
                <th>Order Amount</th>
                <th>VAT Amount</th><th>Total (Invoice)</th>
                <th>Deposit Applied</th>
                <th>Amount Due</th>
                <th>Supplier Credit Balance</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${entries.map(e=>`
                <tr class="${selectedIds.includes(e.id)?'selected':''} ${displayEntryKind(e)==="order" && daysOld(e.created_at)>=60 ? 'order-60' : (displayEntryKind(e)==="order" && daysOld(e.created_at)>=30 ? 'order-30' : '')}" onclick="if(event.target.closest('button') || event.target.closest('input') || event.target.closest('select') || event.target.closest('label')) return; window.openEntryModal('${e.id}')">
                  <td onclick="window.toggleRowSelect('${e.id}', event)"><input class="row-check premium-check" type="checkbox" ${selectedIds.includes(e.id)?'checked':''} onclick="window.toggleRowSelect('${e.id}', event)"></td>
                  <td>${esc(localDateFromAnyV97(e.created_at))}</td>
                  <td>${selectedMonth ? `<span class="badge ${monthCarryStatus(e)==='Opening Balance'?'vat':'paid'}">${esc(monthCarryStatus(e))}</span>` : ""}</td>
                  <td>${esc(e.supplier || "")}</td>
                  <td><span class="badge ${processStatusClass(e)}">${esc(processStatusLabel(e))}</span></td>
                  <td>${esc(e.order_no || "")}</td>
                  <td>${esc(typeof extractSupplierOrderNo === "function" ? extractSupplierOrderNo(e) : "")}</td>
                  <td>${esc(extractDeliveryNoteNo(e) || "")}</td>
                  <td>${extractDeliveredAmount(e) ? money(extractDeliveredAmount(e)) : ""}</td>
                  <td>${money(orderRemainingBalance(e))}</td>
                  <td>${esc(extractCloseReason(e) || "")}</td>
                  <td>${esc(e.invoice_no || "")}</td>
                  <td>${esc(e.project || "")}</td>
                  <td>${esc(e.description || "")}</td>
                  <td>${money(e.total || e.amount || 0)}</td>
                  <td><span class="badge vat">${money(e.vat_amount || 0)}</span></td>
                  <td>${money(typeof invoiceDisplayAmount === "function" ? invoiceDisplayAmount(e) : (e.total || e.amount || 0))}</td>
                  <td>${money(e.deposit_applied || 0)}</td>
                  <td>${money(typeof amountDueDisplay === "function" ? amountDueDisplay(e) : (e.amount_due || 0))}</td>
                  <td>${money(e.supplier_credit_balance || 0)}</td>
                  <td><span class="badge ${e.status==='Paid'?'paid':'unpaid'}">${esc(e.status || "")}</span></td>
                  <td>${esc(e.created_by || "")}</td>
                  <td>${esc(typeof visibleNotes === "function" ? visibleNotes(e) : (e.notes || ""))}${typeof creditNoteLabel === "function" && creditNoteLabel(e) ? `<br><span class="badge vat credit-note-value">${esc(creditNoteLabel(e))}</span>` : ""}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
        <div class="note">Deposit is automatically applied against the supplier invoices. Amount Due shows the real remaining balance after deposit.</div>
      </section>
    </div>

    <div id="entryModal" class="modal">
      <div class="modal-box">
        <div class="window-bar"><button class="window-btn red" onclick="window.windowAction(event,'close')"></button><button class="window-btn yellow" onclick="window.windowAction(event,'compact')"></button><button class="window-btn green" onclick="window.windowAction(event,'maximize')"></button></div>
        <div class="modal-head">
          <h3 id="entryModalTitle">${editingId ? "Edit Entry / Invoice" : "New Entry / Invoice"}</h3>
          <button class="close-plain" onclick="window.closeEntryModal()">Close</button>
        </div>

        <div class="form-grid">
          <label><span>Supplier</span>
            <div class="inline-add">
              <select class="dark" id="entrySupplier">
                <option value="">Select supplier</option>
                ${suppliers.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join("")}
              </select>
              <button type="button" onclick="window.searchFromEntrySupplier()">Find Supplier</button>
            </div>
          </label>
          <label><span>Project</span>
            <select class="dark" id="entryProject">
              <option value="">Select project</option>
              ${projects.map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join("")}
            </select>
          </label>
          <label id="entryOrderWrap"><span id="entryOrderLabel">Order No</span><input class="dark" id="entryOrderNo" type="text" placeholder="PO-001"></label>
          <label id="entryInvoiceWrap"><span id="entryInvoiceLabel">Invoice No</span><input class="dark" id="entryInvoiceNo" type="text" placeholder="INV-001"></label>
          <input type="hidden" id="entryMode" value="">
          <label id="entryTypeWrap"><span>Entry Type</span>
            <select class="dark" id="entryType" onchange="window.handleEntryTypeChange()">
              <option value="invoice">Invoice</option>
              <option value="deposit">Deposit</option>
            </select>
          </label>

          <label class="full"><span>Description</span>
            <div class="inline-add">
              <select class="dark" id="entryDescriptionSelect" onchange="window.pickDescriptionFromList()">
                <option value="">Select description</option>
                ${descriptions.map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join("")}
              </select>
              <button type="button" onclick="window.addDescriptionFromEntry()">+ Add</button>
            </div>
            <input class="dark" id="entryDescription" type="text" placeholder="Or type new description" style="margin-top:10px">
          </label>

          <label><span>Net Before VAT</span><input class="dark" id="entryNetAmount" type="number" step="0.01" oninput="window.recalcFromNet()"></label>
          <label><span>VAT Amount</span><input class="dark" id="entryVatAmount" type="number" step="0.01" readonly></label>
          <label><span>Total After VAT</span><input class="dark" id="entryTotal" type="number" step="0.01" oninput="window.recalcFromTotal()"></label>

          <label id="entryStatusWrap"><span>Status</span>
            <select class="dark" id="entryStatus">
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </label>

          <label class="full"><span>Notes</span><textarea class="dark" id="entryNotes"></textarea></label>
        </div>

        <div id="entryStatusMsg" class="status"></div>
        <div class="helper">VAT uses ${getVatRate().toFixed(2)}%. For small businesses not registered for VAT, choose VAT Type = Not Registered. VAT stays 0.00 and total always equals net. Supplier VAT rule is taken from Manage Lists automatically. Orders can be created without invoice number. Direct invoices can be entered even when no order exists. Deposit is treated as supplier credit and automatically carries forward to future months until used.</div>

        <div class="modal-actions">
          <button onclick="window.deleteEntry()">Delete</button>
          <div class="spacer"></div>
          <button onclick="window.closeEntryModal()">Cancel</button>
          <button class="primary" onclick="window.saveEntry()">Save Entry</button>
        </div>
      </div>
    </div>

    <div id="listsModal" class="modal">
      <div class="modal-box wide">
        <div class="window-bar"><button class="window-btn red" onclick="window.windowAction(event,'close')"></button><button class="window-btn yellow" onclick="window.windowAction(event,'compact')"></button><button class="window-btn green" onclick="window.windowAction(event,'maximize')"></button></div>
        <div class="modal-head">
          <h3>Manage Lists</h3>
          <button class="close-plain" onclick="window.closeListsModal()">Close</button>
        </div>
        <div class="mini-grid">
          <div class="mini-box">
            <div class="mini-title">Suppliers</div>
            <div class="add-row">
              <input class="dark" id="newSupplierInput" placeholder="Add supplier">
              <button class="primary" onclick="window.addQuickListItem('supplier')">Add</button>
            </div>
            <div class="add-row" style="margin-top:10px">
              <input class="dark" id="searchSupplierInput" list="supplierSearchList" placeholder="Search supplier from existing list" oninput="window.syncQuickListSearch('supplier')">
              <datalist id="supplierSearchList">
                ${suppliers.map(s=>`<option value="${esc(s)}"></option>`).join("")}
              </datalist>
            </div>
            <div class="remove-row">
              <select class="dark" id="removeSupplierSelect">
                <option value="">Select supplier to remove</option>
                ${suppliers.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join("")}
              </select>
              <button class="red" onclick="window.removeSelectedListItem('supplier','removeSupplierSelect')">Remove</button>
            </div>
            <div class="remove-row">
              <select class="dark" id="supplierVatSelect" onchange="document.getElementById('supplierVatTypeSelect').value = getSupplierVatType(this.value)">
                <option value="">Select supplier</option>
                ${suppliers.map(s=>`<option value="${esc(s)}">${esc(s)}${getSupplierVatType(s)==='not_registered' ? ' · No VAT' : ' · VAT'}</option>`).join("")}
              </select>
              <select class="dark" id="supplierVatTypeSelect">
                <option value="registered">Registered</option>
                <option value="not_registered">Not Registered</option>
              </select>
              <button class="ghost" onclick="window.saveSupplierVatTypeFromList()">Save VAT Type</button>
              <button class="ghost" onclick="window.searchSimilarSupplierFromList()">Search Similar</button>
            </div>
            <div class="helper" style="margin-top:8px">Search chooses from the existing supplier list and keeps manual add enabled.</div>
            <div class="chips">${suppliers.map(s=>`<span class="chip">${esc(s)} · ${getSupplierVatType(s)==='not_registered' ? 'No VAT' : 'VAT'}</span>`).join("") || '<span class="helper">No suppliers yet</span>'}</div>
          </div>

          <div class="mini-box">
            <div class="mini-title">Projects</div>
            <div class="add-row">
              <input class="dark" id="newProjectInput" placeholder="Add project">
              <button class="primary" onclick="window.addQuickListItem('project')">Add</button>
            </div>
            <div class="add-row" style="margin-top:10px">
              <input class="dark" id="searchProjectInput" list="projectSearchList" placeholder="Search project from existing list" oninput="window.syncQuickListSearch('project')">
              <datalist id="projectSearchList">
                ${projects.map(s=>`<option value="${esc(s)}"></option>`).join("")}
              </datalist>
            </div>
            <div class="remove-row">
              <select class="dark" id="removeProjectSelect">
                <option value="">Select project to remove</option>
                ${projects.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join("")}
              </select>
              <button class="red" onclick="window.removeSelectedListItem('project','removeProjectSelect')">Remove</button>
            </div>
            <div class="helper" style="margin-top:8px">Search chooses from the existing project list and keeps manual add enabled.</div>
            <div class="chips">${projects.map(s=>`<span class="chip">${esc(s)}</span>`).join("") || '<span class="helper">No projects yet</span>'}</div>
          </div>

          <div class="mini-box">
            <div class="mini-title">Descriptions</div>
            <div class="add-row">
              <input class="dark" id="newDescriptionInput" placeholder="Add description">
              <button class="primary" onclick="window.addQuickListItem('description')">Add</button>
            </div>
            <div class="add-row" style="margin-top:10px">
              <input class="dark" id="searchDescriptionInput" list="descriptionSearchList" placeholder="Search description from existing list" oninput="window.syncQuickListSearch('description')">
              <datalist id="descriptionSearchList">
                ${descriptions.map(s=>`<option value="${esc(s)}"></option>`).join("")}
              </datalist>
            </div>
            <div class="remove-row">
              <select class="dark" id="removeDescriptionSelect">
                <option value="">Select description to remove</option>
                ${descriptions.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join("")}
              </select>
              <button class="red" onclick="window.removeSelectedListItem('description','removeDescriptionSelect')">Remove</button>
            </div>
            <div class="helper" style="margin-top:8px">Descriptions now include your uploaded GL code list. You can search the existing list, select a match, and still add new ones manually.</div>
            <div class="chips">${descriptions.map(s=>`<span class="chip">${esc(s)}</span>`).join("") || '<span class="helper">No descriptions yet</span>'}</div>
          </div>
        </div>
      </div>
    </div>

    <div id="supplierReportModal" class="modal">
      <div class="modal-box">
        <div class="window-bar"><button class="window-btn red" onclick="window.windowAction(event,'close')"></button><button class="window-btn yellow" onclick="window.windowAction(event,'compact')"></button><button class="window-btn green" onclick="window.windowAction(event,'maximize')"></button></div>
        <div class="modal-head">
          <h3>Supplier Report</h3>
          <button class="close-plain" onclick="window.closeSupplierReportModal()">Close</button>
        </div>
        <label><span>Choose supplier from list</span>
          <select class="dark" id="reportSupplierSelect">
            <option value="">Select supplier</option>
            ${suppliers.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join("")}
          </select>
        </label>
        <label style="margin-top:12px"><span>Or type supplier / suppliers</span>
          <input class="dark" id="reportSupplierInput" type="text" placeholder="Example: Buco, Tile toria">
        </label>
        <div class="helper" style="margin-top:10px">You can choose one supplier from the list, or type multiple suppliers separated by commas.</div>
        <div class="modal-actions">
          <div class="spacer"></div>
          <button onclick="window.closeSupplierReportModal()">Cancel</button>
          <button class="primary" onclick="window.runSupplierReport()">Create Report</button>
        </div>
      </div>
    </div>



    <div id="rolesModal" class="modal">
      <div class="modal-box">
        <div class="window-bar"><button class="window-btn red" onclick="window.closeRolesModal()"></button><button class="window-btn yellow" onclick="window.windowAction(event,'compact')"></button><button class="window-btn green" onclick="window.windowAction(event,'maximize')"></button></div>
        <div class="modal-head">
          <h3>User Roles</h3>
          <button class="close-plain" onclick="window.closeRolesModal()">Close</button>
        </div>
        <label><span>Email</span><input class="dark" id="roleEmailInput" type="email" placeholder="user@example.com"></label>
        <label style="margin-top:12px"><span>Role</span>
          <select class="dark" id="roleValueInput">
            <option value="user">User</option>
            <option value="accountant">Accountant</option>
            <option value="manager">Manager</option>
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option><option value="dn_approver">DN Approver</option>
          </select>
        </label>
        <div id="rolesStatus" class="status"></div>
        <div class="helper" style="margin-top:10px">Admin can assign roles from the database table user_roles. User = orders only. Accountant = finance and invoices. Manager = operations + finance without system settings.</div>
        <div class="modal-actions">
          <div class="spacer"></div>
          <button onclick="window.closeRolesModal()">Cancel</button>
          <button class="primary" onclick="window.saveUserRole()">Save Role</button>
        </div>
      </div>
    </div>

    <div id="passwordModal" class="modal">
      <div class="modal-box">
        <div class="window-bar"><button class="window-btn red" onclick="window.windowAction(event,'close')"></button><button class="window-btn yellow" onclick="window.windowAction(event,'compact')"></button><button class="window-btn green" onclick="window.windowAction(event,'maximize')"></button></div>
        <div class="modal-head">
          <h3>Change Password</h3>
          <button class="close-plain" onclick="window.closePasswordModal()">Close</button>
        </div>
        <label><span>New Password</span><input class="dark" id="newPassword" type="password" placeholder="New password"></label>
        <label style="margin-top:12px"><span>Confirm New Password</span><input class="dark" id="confirmPassword" type="password" placeholder="Confirm new password"></label>
        <div id="passwordStatus" class="status"></div>
        <div class="helper" style="margin-top:10px">The logged-in user can update their own password here.</div>
        <div class="modal-actions">
          <div class="spacer"></div>
          <button onclick="window.closePasswordModal()">Cancel</button>
          <button class="primary" onclick="window.changePassword()">Save Password</button>
        </div>
      </div>
    </div>


    <div id="convertOrderModal" class="modal">
      <div class="modal-box">
        <div class="window-bar"><button class="window-btn red" onclick="window.closeConvertOrderModal()"></button><button class="window-btn yellow" onclick="window.windowAction(event,'compact')"></button><button class="window-btn green" onclick="window.windowAction(event,'maximize')"></button></div>
        <div class="modal-head">
          <h3>Convert DN to Invoice</h3>
          <button class="close-plain" onclick="window.closeConvertOrderModal()">Close</button>
        </div>
        <label><span>Invoice No</span><input class="dark" id="convertInvoiceNo" type="text" placeholder="INV-001"></label>
        <label style="margin-top:12px"><span>Status</span>
          <select class="dark" id="convertInvoiceStatus">
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </label>
        <div id="convertOrderStatus" class="status"></div>
        <div class="helper" style="margin-top:10px">Select one order row, then enter the received invoice number. The row will switch from order to invoice.</div>
        <div class="modal-actions">
          <div class="spacer"></div>
          <button onclick="window.closeConvertOrderModal()">Cancel</button>
          <button class="primary" onclick="window.convertOrderToInvoice()">Save Invoice</button>
        </div>
      </div>
    </div>

    <div id="settingsModal" class="modal">
      <div class="modal-box">
        <div class="window-bar"><button class="window-btn red" onclick="window.windowAction(event,'close')"></button><button class="window-btn yellow" onclick="window.windowAction(event,'compact')"></button><button class="window-btn green" onclick="window.windowAction(event,'maximize')"></button></div>
        <div class="modal-head">
          <h3>VAT Settings</h3>
          <button class="close-plain" onclick="window.closeSettingsModal()">Close</button>
        </div>
        <label><span>VAT Rate %</span><input class="dark" id="vatRateInput" type="number" step="0.01" value="${getVatRate().toFixed(2)}"></label>
        <label style="margin-top:12px"><span>Credit Statement Basis</span>
          <select class="dark" id="depositBasisInput">
            <option value="net" ${getDepositBasis()==="net"?"selected":""}>Before VAT</option>
            <option value="total" ${getDepositBasis()==="total"?"selected":""}>After VAT / Total</option>
          </select>
        </label>
        <div class="helper" style="margin-top:10px">Choose whether deposit offsets invoices by before VAT or by total amount.</div>
        <div class="modal-actions">
          <div class="spacer"></div>
          <button onclick="window.closeSettingsModal()">Cancel</button>
          <button class="primary" onclick="window.saveVatRate()">Save VAT Rate</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("searchInput").addEventListener("keydown", e => { if(e.key==="Enter") window.applyFilters(); });
  document.getElementById("supplierFilter").addEventListener("change", e=>{ uiState.supplier = e.target.value; render(); });
  document.getElementById("projectFilter").addEventListener("change", e=>{ uiState.project = e.target.value; render(); });
  document.getElementById("statusFilter").addEventListener("change", e=>{ uiState.status = e.target.value; render(); });
  document.getElementById("sortFilter").addEventListener("change", e=>{ uiState.sort = e.target.value; render(); });

function initTableHorizontalDrag(root=document){
  root.querySelectorAll('.table-wrap').forEach(wrap => {
    if(wrap.dataset.dragReady === "1") return;
    wrap.dataset.dragReady = "1";
    let isDown = false;
    let startX = 0;
    let startScroll = 0;

    const start = (pageX) => {
      isDown = true;
      startX = pageX;
      startScroll = wrap.scrollLeft;
      wrap.classList.add('dragging');
    };
    const move = (pageX) => {
      if(!isDown) return;
      const dx = pageX - startX;
      wrap.scrollLeft = startScroll - dx;
    };
    const stop = () => {
      isDown = false;
      wrap.classList.remove('dragging');
    };

    wrap.addEventListener('mousedown', e => {
      if(e.target.closest('button, a, input, select, textarea, label')) return;
      start(e.pageX);
    });
    window.addEventListener('mousemove', e => move(e.pageX));
    window.addEventListener('mouseup', stop);

    wrap.addEventListener('touchstart', e => {
      const t = e.touches && e.touches[0];
      if(!t) return;
      start(t.pageX);
    }, {passive:true});
    wrap.addEventListener('touchmove', e => {
      const t = e.touches && e.touches[0];
      if(!t) return;
      move(t.pageX);
    }, {passive:true});
    wrap.addEventListener('touchend', stop, {passive:true});

    wrap.addEventListener('wheel', e => {
      if(Math.abs(e.deltaY) > Math.abs(e.deltaX)){
        wrap.scrollLeft += e.deltaY;
      } else {
        wrap.scrollLeft += e.deltaX;
      }
    }, {passive:true});
  });
}

  initCustomSelects(document.getElementById("app"));
  refreshCustomSelects(document.getElementById("app"));
  initTableHorizontalDrag(document.getElementById("app"));
}

window.applyFilters = async function(){
  uiState.search = document.getElementById("searchInput")?.value || "";
  uiState.supplier = document.getElementById("supplierFilter")?.value || "";
  uiState.project = document.getElementById("projectFilter")?.value || "";
  uiState.status = document.getElementById("statusFilter")?.value || "";
  uiState.sort = document.getElementById("sortFilter")?.value || "date_desc";

  await render();

  setTimeout(()=>{
    const input = document.getElementById("searchInput");
    if(input){
      input.value = uiState.search || "";
      input.focus();
      try{ input.setSelectionRange(input.value.length, input.value.length); }catch(e){}
    }
  },50);
};
window.setMonthFilter = setMonthFilter;
window.clearSelection = clearSelection;
window.toggleRowSelect = toggleRowSelect;
window.logout = logout;
window.duplicateEntry = duplicateEntry;
window.duplicateSelected = duplicateEntry;
window.bulkMarkPaid = bulkMarkPaid;
window.markSelectedPaid = bulkMarkPaid;
window.bulkDelete = bulkDelete;


async function buildPdfReport(title, subtitle, rows, summaryLines){
  const doc = new jsPDF({unit:"pt", format:"a4"});
  let y = 48;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  function drawBrandHeader(){
    doc.setFillColor(228,192,140);
    doc.roundedRect(40, 36, 54, 54, 10, 10, "F");
    doc.setFont("helvetica","bold");
    doc.setFontSize(28);
    doc.setTextColor(20,20,20);
    doc.text("V", 58, 72);
    doc.setTextColor(30,30,30);
    doc.setFontSize(20);
    doc.text("VARDOPHASE", 108, 58);
    doc.setFont("helvetica","normal");
    doc.setFontSize(10);
    doc.text("Supplier Cloud Pro", 108, 74);

    doc.setDrawColor(183,139,85);
    doc.setLineWidth(1.2);
    doc.circle(pageW - 95, 64, 34);
    doc.setFont("helvetica","bold");
    doc.setFontSize(10);
    doc.text("OFFICIAL", pageW - 118, 60);
    doc.text("REPORT", pageW - 112, 74);

    y = 112;
    doc.setDrawColor(190,190,190);
    doc.line(40, y, pageW - 40, y);
    y += 18;
  }
  function drawFooter(){
    const pages = doc.getNumberOfPages();
    for(let i=1;i<=pages;i++){
      doc.setPage(i);
      doc.setDrawColor(190,190,190);
      doc.line(40, pageH - 34, pageW - 40, pageH - 34);
      doc.setFont("helvetica","normal");
      doc.setFontSize(9);
      doc.text("VARDOPHASE • Internal Supplier Report", 40, pageH - 18);
      doc.text(`Page ${i} of ${pages}`, pageW - 90, pageH - 18);
    }
  }
  function ensureSpace(h=24){
    if(y + h > pageH - 56){
      doc.addPage();
      y = 48;
      drawBrandHeader();
    }
  }
  function line(txt, x=40, size=11, weight="normal"){
    ensureSpace(18);
    doc.setFont("helvetica", weight);
    doc.setFontSize(size);
    doc.setTextColor(20,20,20);
    doc.text(String(txt), x, y);
    y += 16;
  }
  function hr(){
    ensureSpace(12);
    doc.setDrawColor(210,210,210);
    doc.line(40, y, pageW-40, y);
    y += 12;
  }
  function row(vals, xs, weight="normal"){
    ensureSpace(18);
    doc.setFont("helvetica", weight);
    doc.setFontSize(10);
    doc.setTextColor(20,20,20);
    vals.forEach((v,i)=>doc.text(String(v ?? ""), xs[i], y));
    y += 16;
  }

  drawBrandHeader();

  doc.setFont("helvetica","bold");
  doc.setFontSize(20);
  doc.text(title, 40, y);
  y += 20;
  doc.setFont("helvetica","normal");
  doc.setFontSize(11);
  doc.text(subtitle, 40, y);
  y += 18;
  hr();

  if(summaryLines?.length){
    summaryLines.forEach(s => line(s, 40, 11, "bold"));
    hr();
  }

  const headers = ["Date","Supplier","Invoice","Project","Total","Status"];
  const xs = [40, 105, 220, 330, 455, 535];
  row(headers, xs, "bold");
  hr();
  rows.forEach(r=>{
    row([
      localDateFromAnyV97(r.created_at),
      String(r.supplier||"").slice(0,16),
      String(r.invoice_no||"").slice(0,14),
      String(r.project||"").slice(0,14),
      money(r.total||r.amount||0),
      r.status||""
    ], xs);
  });

  drawFooter();
  return doc;
}

function groupEntriesDetailed(rows, key){
  const grouped = {};
  rows.forEach(r=>{
    const k = r[key] || "Unassigned";
    if(!grouped[k]) grouped[k] = { orders:0, invoices:0, deposits:0, applied:0, due:0, credit:0, count:0 };
    const base = depositBaseAmount(r);
    grouped[k].count += 1;
    if(r.entry_type === "deposit"){
      grouped[k].deposits += base;
    } else if(r.entry_type === "invoice"){
      grouped[k].invoices += base;
      grouped[k].applied += Number(r.deposit_applied || 0);
      grouped[k].due += Number(r.amount_due || 0);
    } else {
      grouped[k].orders += base;
    }
    grouped[k].credit = Math.max(0, grouped[k].deposits - grouped[k].invoices);
  });
  return Object.entries(grouped).sort((a,b)=>b[1].invoices - a[1].invoices);
}

async function buildProfessionalMonthlyPdf(rows){
  const doc = new jsPDF({unit:"pt", format:"a4"});
  let y = 48;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const sum = totals(rows);
  const supplierGroups = groupEntriesDetailed(rows, "supplier");
  const projectGroups = groupEntriesDetailed(rows, "project");

  function drawBrandHeader(){
    doc.setFillColor(228,192,140);
    doc.roundedRect(40, 36, 54, 54, 10, 10, "F");
    doc.setFont("helvetica","bold");
    doc.setFontSize(28);
    doc.setTextColor(20,20,20);
    doc.text("V", 58, 72);
    doc.setFont("helvetica","bold");
    doc.setFontSize(20);
    doc.text("VARDOPHASE", 108, 58);
    doc.setFont("helvetica","normal");
    doc.setFontSize(10);
    doc.text("Supplier Credit Statement", 108, 74);

    doc.setDrawColor(183,139,85);
    doc.setLineWidth(1.2);
    doc.circle(pageW - 95, 64, 34);
    doc.setFont("helvetica","bold");
    doc.setFontSize(10);
    doc.text("APPROVED", pageW - 118, 60);
    doc.text("MONTHLY", pageW - 116, 74);

    y = 112;
    doc.setDrawColor(190,190,190);
    doc.line(40, y, pageW - 40, y);
    y += 18;
  }
  function drawFooter(){
    const pages = doc.getNumberOfPages();
    for(let i=1;i<=pages;i++){
      doc.setPage(i);
      doc.setDrawColor(190,190,190);
      doc.line(40, pageH - 34, pageW - 40, pageH - 34);
      doc.setFont("helvetica","normal");
      doc.setFontSize(9);
      doc.text("VARDOPHASE • Confidential Monthly PDF", 40, pageH - 18);
      doc.text(`Page ${i} of ${pages}`, pageW - 90, pageH - 18);
    }
  }
  function ensureSpace(h=24){
    if(y + h > pageH - 56){
      doc.addPage();
      y = 48;
      drawBrandHeader();
    }
  }
  function title(txt, size=20){
    ensureSpace(26);
    doc.setFont("helvetica","bold");
    doc.setFontSize(size);
    doc.setTextColor(20,20,20);
    doc.text(txt, 40, y);
    y += 20;
  }
  function sub(txt){
    ensureSpace(18);
    doc.setFont("helvetica","normal");
    doc.setFontSize(11);
    doc.setTextColor(20,20,20);
    doc.text(txt, 40, y);
    y += 16;
  }
  function hr(){
    ensureSpace(10);
    doc.setDrawColor(190,190,190);
    doc.line(40, y, pageW-40, y);
    y += 12;
  }
  function tableHeader(vals, xs){
    ensureSpace(18);
    doc.setFont("helvetica","bold");
    doc.setFontSize(10);
    doc.setTextColor(20,20,20);
    vals.forEach((v,i)=>doc.text(v, xs[i], y));
    y += 14;
    hr();
  }
  function tableRow(vals, xs){
    ensureSpace(18);
    doc.setFont("helvetica","normal");
    doc.setFontSize(10);
    doc.setTextColor(20,20,20);
    vals.forEach((v,i)=>doc.text(String(v ?? ""), xs[i], y));
    y += 14;
  }

  drawBrandHeader();
  title("VARDOPHASE Supplier Credit Statement");
  sub("Period: " + reportMonthLabel());
  hr();

  title("Summary", 14);
  sub(`Net Before VAT: ${money(sum.net)}`);
  sub(`VAT: ${money(sum.vat)}`);
  sub(`Total: ${money(sum.total)}`);
  sub(`Deposit Applied: ${money(sum.depositApplied)}`);
  sub(`Outstanding After Deposit: ${money(sum.outstanding)}`);
  sub(`Carry Forward Credit: ${money(sum.carryForward)}`);
  sub(`Entries: ${rows.length}`);
  hr();

  title("By Supplier", 14);
  tableHeader(["Supplier","Deposits","Orders","Invoices","Credit"], [40, 210, 320, 410, 510]);
  supplierGroups.forEach(([name,v])=>{
    tableRow([String(name).slice(0,20), money(v.deposits), money(v.orders), money(v.invoices), money(v.credit)], [40, 210, 320, 410, 510]);
  });
  hr();

  title("By Project", 14);
  tableHeader(["Project","Orders","Invoices","Applied","Outstanding"], [40, 220, 330, 425, 515]);
  projectGroups.forEach(([name,v])=>{
    tableRow([String(name).slice(0,24), money(v.orders), money(v.invoices), money(v.applied), money(v.due)], [40, 220, 330, 425, 515]);
  });
  hr();

  title("Detailed Entries", 14);
  tableHeader(["Date","Supplier","Type","Order","Invoice","Applied","Amount Due"], [40, 110, 205, 275, 355, 455, 530]);
  rows.forEach(r=>{
    tableRow([
      localDateFromAnyV97(r.created_at),
      String(r.supplier||"").slice(0,12),
      String(r.entry_type||"invoice"),
      String(r.order_no||"").slice(0,10),
      String(r.invoice_no||"").slice(0,10),
      money(r.deposit_applied||0),
      money(r.amount_due||0)
    ], [40, 110, 205, 275, 355, 455, 530]);
  });

  drawFooter();
  return doc;
}

async function sharePdf(doc, filename, fallbackTitle){
  const blob = doc.output("blob");
  const file = new File([blob], filename, {type:"application/pdf"});
  if(navigator.canShare && navigator.canShare({files:[file]})){
    await navigator.share({ files:[file], title:fallbackTitle });
    return;
  }
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}



window.shareMonthlyToWhatsApp = async function(){
  if(!selectedMonth){
    alert("Choose a month first from the month tools at the top.");
    return;
  }
  const rows = await getEntries();
  const doc = await buildProfessionalMonthlyPdf(rows);
  const blob = doc.output("blob");
  const file = new File([blob], `Vardophase_Professional_Monthly_Report_${reportMonthLabel().replaceAll(" ","_")}.pdf`, {type:"application/pdf"});
  if(navigator.canShare && navigator.canShare({files:[file]})){
    try{
      await navigator.share({files:[file], title:"Vardophase Monthly Report", text:"Share to WhatsApp"});
      return;
    }catch(e){}
  }
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
};

window.addQuickListItem = async function(kind){
  const map = { supplier:"newSupplierInput", project:"newProjectInput", description:"newDescriptionInput" };
  const el = document.getElementById(map[kind]);
  const val = (el?.value || "").trim();
  if(!val) return;
  const arr = getStoredList(kind);
  if(!arr.includes(val)) arr.push(val);
  saveStoredList(kind, arr.sort());
  if(el) el.value = "";
  await render();
  document.getElementById("listsModal")?.classList.add("show");
};
window.removeQuickListItem = async function(kind, value){
  const arr = getStoredList(kind).filter(x => x !== value);
  saveStoredList(kind, arr);
  await render();
  document.getElementById("listsModal")?.classList.add("show");
};
window.pickDescriptionFromList = function(){
  const sel = document.getElementById("entryDescriptionSelect");
  const inp = document.getElementById("entryDescription");
  if(sel && inp && sel.value){
    inp.value = sel.value;
  }
};

window.addDescriptionFromEntry = async function(){
  const description = (document.getElementById("entryDescription")?.value || "").trim();
  if(!description) return;
  const arr = getStoredList("description");
  if(!arr.includes(description)) arr.push(description);
  saveStoredList("description", arr.sort());

  const sel = document.getElementById("entryDescriptionSelect");
  if(sel && !Array.from(sel.options).some(o => o.value === description)){
    const opt = document.createElement("option");
    opt.value = description;
    opt.textContent = description;
    sel.appendChild(opt);
  }
  if(sel) sel.value = description;
  setEntryStatus("Description added to list.", "ok");
};



window.openOrderModal = async function(){
  await window.openEntryModal(null, "order");
};
window.openInvoiceModal = async function(){
  await window.openEntryModal(null, "invoice");
};
window.openDepositModal = async function(){
  if(!canAccountant()) return alert("Only accountant or admin can add deposit.");
  await window.openEntryModal(null, "deposit");
};

window.applyEntryModeUI = function(){
  const mode = document.getElementById("entryMode")?.value || "";
  const orderWrap = document.getElementById("entryOrderWrap");
  const invoiceWrap = document.getElementById("entryInvoiceWrap");
  if(orderWrap) orderWrap.classList.remove("field-hidden","field-highlight");
  if(invoiceWrap) invoiceWrap.classList.remove("field-hidden","field-highlight");

  if(mode === "order"){
    if(invoiceWrap) invoiceWrap.classList.add("field-hidden");
    if(orderWrap) orderWrap.classList.add("field-highlight");
  } else if(mode === "invoice"){
    if(invoiceWrap) invoiceWrap.classList.add("field-highlight");
  } else if(mode === "deposit"){
    if(invoiceWrap) invoiceWrap.classList.add("field-hidden");
    if(orderWrap) orderWrap.classList.add("field-highlight");
  }
};

window.handleEntryTypeChange = function(){
  const type = document.getElementById("entryType")?.value || "invoice";
  const invoice = document.getElementById("entryInvoiceNo");
  const status = document.getElementById("entryStatus");
  const vat = document.getElementById("entryVatAmount");
  const note = document.getElementById("entryStatusMsg");

  if(type === "deposit"){
    const statusWrap = document.getElementById("entryStatusWrap");
    if(invoice) invoice.value = "";
    if(invoice) invoice.placeholder = "Not required for deposit";
    if(status){
      status.innerHTML = '<option value="Paid">Paid</option>';
      status.value = "Paid";
      status.disabled = true;
      status.setAttribute("aria-disabled","true");
      status.title = "Deposit is always Paid";
    }
    if(statusWrap) statusWrap.style.display = "none";
    if(note){
      note.className = "status ok";
      note.textContent = "Deposit / Advance Payment is always PAID and recorded as supplier credit. It is NOT an invoice and will be applied against future invoices.";
    }
  } else {
    const statusWrap = document.getElementById("entryStatusWrap");
    if(invoice) invoice.placeholder = "INV-001";
    if(status){
      status.innerHTML = '<option value="Paid">Paid</option><option value="Unpaid">Unpaid</option>';
      status.disabled = currentRole === "viewer";
      status.removeAttribute("aria-disabled");
      status.title = "";
    }
    if(statusWrap) statusWrap.style.display = "";
    if(note){
      note.className = "status";
      note.textContent = "";
    }
  }
  window.applyEntryModeUI();
};

window.recalcFromNet = function(){
  const net = Number(document.getElementById("entryNetAmount").value || 0);
  const supplierName = String(document.getElementById("entrySupplier")?.value || "").trim();
  const vatType = supplierName ? getSupplierVatType(supplierName) : String(document.getElementById("entrySupplierVatType")?.value || "registered");
  if(vatType === "not_registered"){
    document.getElementById("entryVatAmount").value = "0.00";
    document.getElementById("entryTotal").value = net.toFixed(2);
    return;
  }
  const vat = calcVatFromNet(net);
  const total = calcGrossFromNet(net);
  document.getElementById("entryVatAmount").value = vat.toFixed(2);
  document.getElementById("entryTotal").value = total.toFixed(2);
};
window.recalcFromTotal = function(){
  const total = Number(document.getElementById("entryTotal").value || 0);
  const supplierName = String(document.getElementById("entrySupplier")?.value || "").trim();
  const vatType = supplierName ? getSupplierVatType(supplierName) : String(document.getElementById("entrySupplierVatType")?.value || "registered");
  if(vatType === "not_registered"){
    document.getElementById("entryNetAmount").value = total.toFixed(2);
    document.getElementById("entryVatAmount").value = "0.00";
    return;
  }
  const net = calcNetFromGross(total);
  const vat = total - net;
  document.getElementById("entryNetAmount").value = net.toFixed(2);
  document.getElementById("entryVatAmount").value = vat.toFixed(2);
};

window.openEntryModal = async function(id=null, forcedMode=""){
  editingId = id;
  // V449 performance fix: existing documents must not re-render the whole dashboard before opening.
  // New documents still render to ensure fresh empty form/options; existing documents use the already-mounted modal.
  const needsFullRender = !id || !document.getElementById("entryModal");
  if(needsFullRender) await render();
  const modal = document.getElementById("entryModal");
  if(modal) modal.classList.add("show");

  let row = {
    supplier:"",
    order_no:"",
    invoice_no:"",
    project:"",
    description:"",
    net_amount:"",
    vat_amount:"",
    total:"",
    status:"Paid",
    notes:"",
    entry_type:"invoice"
  };

  if(id){
    // V449 performance fix: v364 already fetches the row to decide document type.
    // Reuse it here to avoid a second Supabase request on every existing-order open.
    const cachedRow = window.__VP_FAST_OPEN_ROW;
    if(cachedRow && String(cachedRow.id) === String(id)){
      row = cachedRow;
    } else {
      const { data, error } = await supabase.from("suppliers").select("*").eq("id", id).single();
      if(!error && data) row = data;
    }
  }

  const detectedMode = forcedMode || (row.invoice_no ? "invoice" : (row.order_no ? "order" : "invoice"));

  const modeField = document.getElementById("entryMode");
  if(modeField) modeField.value = detectedMode;

  const setVal = (id, value) => {
    const el = document.getElementById(id);
    if(el) el.value = value ?? "";
  };

  setVal("entrySupplier", row.supplier || "");
  setVal("entrySupplierVatType", getSupplierVatType(row.supplier || ""));
  setVal("entryOrderNo", row.order_no || "");
  setVal("entryInvoiceNo", row.invoice_no || "");
  setVal("entryProject", row.project || "");
  setVal("entryType", row.entry_type || "invoice");
  setVal("entryDescription", row.description || "");
  setVal("entryDescriptionSelect", row.description || "");
  setVal("entryNetAmount", row.net_amount || "");
  setVal("entryVatAmount", row.vat_amount || "");
  setVal("entryTotal", row.total || row.amount || "");
  setVal("entryStatus", row.status || "Paid");
  setVal("entryNotes", row.notes || "");

  const ttl = document.getElementById("entryModalTitle");
  const sub = document.getElementById("entryModalSub");
  if(ttl){
    ttl.textContent = id
      ? (detectedMode === "order" ? "Edit Entry / Order" : (detectedMode === "deposit" ? "Edit Deposit / Advance Payment" : "Edit Entry / Invoice"))
      : (detectedMode === "order" ? "New Entry / Order" : (detectedMode === "deposit" ? "New Deposit / Advance Payment" : "New Entry / Invoice"));
  }
  if(sub){
    sub.textContent = detectedMode === "order"
      ? "Create or edit supplier order without invoice number"
      : (detectedMode === "deposit"
        ? "Record supplier advance payment / deposit as credit. It is not an invoice."
        : "Create or edit invoice directly, even without order number");
  }

  if(!id && detectedMode === "order"){
    setVal("entryType", "invoice");
    setVal("entryInvoiceNo", "");
    setVal("entryStatus", "Unpaid");
  }
  if(!id && detectedMode === "invoice"){
    setVal("entryType", "invoice");
    setVal("entryStatus", "Paid");
  }
  if(!id && detectedMode === "deposit"){
    setVal("entryType", "deposit");
    setVal("entryInvoiceNo", "");
    setVal("entryStatus", "Paid");
    setVal("entryDescription", "Deposit / Advance Payment");
    setVal("entryDescriptionSelect", "");
  }

  const editableIds = ["entrySupplier","entryOrderNo","entryInvoiceNo","entryProject","entryType","entryDescription","entryDescriptionSelect","entryNetAmount","entryVatAmount","entryTotal","entryStatus","entryNotes"];
  editableIds.forEach(fieldId => {
    const el = document.getElementById(fieldId);
    if(el) el.disabled = currentRole === "viewer";
  });

  window.handleEntryTypeChange();
  window.handleSupplierVatTypeChange();
  window.applyEntryModePermissions();

  if(document.getElementById("entryTotal")?.value){
    window.recalcFromTotal();
  } else if(document.getElementById("entryNetAmount")?.value){
    window.recalcFromNet();
  }

  setEntryStatus("");
  refreshCustomSelects(document);
};
window.closeEntryModal = function(){ editingId = null; const modeField = document.getElementById("entryMode"); if(modeField) modeField.value = ""; document.getElementById("entryModal")?.classList.remove("show"); window.applyEntryModePermissions(); };
window.openListsModal = async function(){ if(!canManageLists()) return alert("Only admin can manage lists."); await render(); document.getElementById("listsModal")?.classList.add("show"); refreshCustomSelects(document); };

window.addQuickListItem = async function(type){
  if(!canAdmin()) return alert("Only admin can manage lists.");
  const inputId = type === "supplier" ? "newSupplierInput" : (type === "project" ? "newProjectInput" : "newDescriptionInput");
  const input = document.getElementById(inputId);
  const value = String(input?.value || "").trim();
  if(!value) return;
  saveStoredList(type, mergeUnique(getStoredList(type), [value]));
  await logAudit("manage_list_add", `${type}:${value}`);
  await render();
  document.getElementById("listsModal")?.classList.add("show");
};

window.removeSelectedListItem = async function(type, selectId){
  if(!canAdmin()) return alert("Only admin can manage lists.");
  const sel = document.getElementById(selectId);
  const value = String(sel?.value || "").trim();
  if(!value) return alert("Choose item to remove.");
  if(!confirm("Delete item from list?")) return;
  const next = getStoredList(type).filter(v => String(v) !== String(value));
  saveStoredList(type, next);
  await logAudit("manage_list_remove", `${type}:${value}`);
  await render();
  document.getElementById("listsModal")?.classList.add("show");
};

window.removeQuickListItem = async function(type, value){
  if(!canAdmin()) return alert("Only admin can manage lists.");
  if(!confirm("Delete item from list?")) return;
  const next = getStoredList(type).filter(v => String(v) !== String(value));
  saveStoredList(type, next);
  await logAudit("manage_list_remove", `${type}:${value}`);
  await render();
  document.getElementById("listsModal")?.classList.add("show");
};


window.saveSupplierVatTypeFromList = async function(){
  if(!canAdmin()) return alert("Only admin can manage lists.");
  const supplier = String(document.getElementById("supplierVatSelect")?.value || "").trim();
  const vatType = String(document.getElementById("supplierVatTypeSelect")?.value || "registered").trim();
  if(!supplier) return alert("Select supplier.");
  setSupplierVatType(supplier, vatType);
  await logAudit("save_supplier_vat_type", `${supplier}:${vatType}`);
  await render();
  document.getElementById("listsModal")?.classList.add("show");
};

window.handleSupplierVatTypeChange = function(){
  const supplier = String(document.getElementById("entrySupplier")?.value || "").trim();
  const vatTypeEl = document.getElementById("entrySupplierVatType");
  if(!vatTypeEl) return;
  vatTypeEl.value = getSupplierVatType(supplier);
  window.handleVatTypeChange();
};

window.handleVatTypeChange = function(){
  const supplierName = String(document.getElementById("entrySupplier")?.value || "").trim();
  const selectedVatType = String(document.getElementById("entrySupplierVatType")?.value || "registered");
  const supplierVatType = supplierName ? getSupplierVatType(supplierName) : selectedVatType;
  const vatInput = document.getElementById("entryVatAmount");
  const netInput = document.getElementById("entryNetAmount");
  const totalInput = document.getElementById("entryTotal");
  const vatTypeEl = document.getElementById("entrySupplierVatType");
  if(vatTypeEl && supplierName){
    vatTypeEl.value = supplierVatType;
  }
  if(!vatInput || !netInput || !totalInput) return;

  if(supplierVatType === "not_registered"){
    vatInput.value = "0.00";
    const total = Number(totalInput.value || 0);
    const net = Number(netInput.value || 0);
    if(total > 0){
      netInput.value = total.toFixed(2);
    } else if(net > 0){
      totalInput.value = net.toFixed(2);
    }
    return;
  }

  if(totalInput.value){
    window.recalcFromTotal();
  } else if(netInput.value){
    window.recalcFromNet();
  }
};

window.closeListsModal = function(){ document.getElementById("listsModal")?.classList.remove("show"); };

window.applyEntryModePermissions = function(){
  const mode = (document.getElementById("entryMode")?.value || "").trim();
  const invoiceWrap = document.getElementById("entryInvoiceWrap");
  const orderWrap = document.getElementById("entryOrderWrap");
  const typeWrap = document.getElementById("entryTypeWrap");
  const typeSel = document.getElementById("entryType");
  const statusSel = document.getElementById("entryStatus");
  if(mode === "order"){
    if(invoiceWrap) invoiceWrap.style.display = "none";
    if(orderWrap) orderWrap.style.display = "";
    if(typeWrap) typeWrap.style.display = "none";
    if(typeSel) typeSel.value = "invoice";
    if(statusSel) statusSel.value = "Unpaid";
  } else if(mode === "invoice"){
    if(invoiceWrap) invoiceWrap.style.display = "";
    if(orderWrap) orderWrap.style.display = "";
    if(typeWrap) typeWrap.style.display = "";
  } else if(mode === "deposit"){
    const statusWrap = document.getElementById("entryStatusWrap");
    if(invoiceWrap) invoiceWrap.style.display = "none";
    if(orderWrap) orderWrap.style.display = "";
    if(typeWrap) typeWrap.style.display = "none";
    if(typeSel) typeSel.value = "deposit";
    if(statusSel){
      statusSel.innerHTML = '<option value="Paid">Paid</option>';
      statusSel.value = "Paid";
      statusSel.disabled = true;
      statusSel.setAttribute("aria-disabled","true");
      statusSel.title = "Deposit is always Paid";
    }
    if(statusWrap) statusWrap.style.display = "none";
  } else {
    if(invoiceWrap) invoiceWrap.style.display = "";
    if(orderWrap) orderWrap.style.display = "";
    if(typeWrap) typeWrap.style.display = "";
  }
};

window.openOrderModal = async function(){
  if(!canCreateOrder()) return alert("This role cannot create orders.");
  editingId = null;
  await render();
  document.getElementById("entryMode").value = "order";
  document.getElementById("entrySupplier").value = "";
  document.getElementById("entryProject").value = "";
  document.getElementById("entryOrderNo").value = "";
  document.getElementById("entryInvoiceNo").value = "";
  document.getElementById("entryDescription").value = "";
  document.getElementById("entryDescriptionSelect").value = "";
  document.getElementById("entryNetAmount").value = "";
  document.getElementById("entryVatAmount").value = "0.00";
  document.getElementById("entryTotal").value = "";
  document.getElementById("entryStatus").value = "Unpaid";
  document.getElementById("entryNotes").value = "";
  window.applyEntryModePermissions();
  document.getElementById("entryModal")?.classList.add("show");
  setEntryStatus("");
  refreshCustomSelects(document);
};

window.openInvoiceModal = async function(){
  if(!canCreateInvoice()) return alert("This role cannot create invoices.");
  editingId = null;
  await render();
  document.getElementById("entryMode").value = "invoice";
  document.getElementById("entrySupplier").value = "";
  document.getElementById("entryProject").value = "";
  document.getElementById("entryOrderNo").value = "";
  document.getElementById("entryInvoiceNo").value = "";
  document.getElementById("entryDescription").value = "";
  document.getElementById("entryDescriptionSelect").value = "";
  document.getElementById("entryNetAmount").value = "";
  document.getElementById("entryVatAmount").value = "0.00";
  document.getElementById("entryTotal").value = "";
  document.getElementById("entryStatus").value = "Paid";
  document.getElementById("entryNotes").value = "";
  window.applyEntryModePermissions();
  document.getElementById("entryModal")?.classList.add("show");
  setEntryStatus("");
  refreshCustomSelects(document);
};

window.openDepositModal = async function(){
  if(!canAccountant()) return alert("Only accountant or admin can add deposit.");
  editingId = null;
  await render();
  document.getElementById("entryMode").value = "deposit";
  document.getElementById("entrySupplier").value = "";
  document.getElementById("entryProject").value = "";
  document.getElementById("entryOrderNo").value = "";
  document.getElementById("entryInvoiceNo").value = "";
  document.getElementById("entryType").value = "deposit";
  document.getElementById("entryDescription").value = "Deposit / Advance Payment";
  document.getElementById("entryDescriptionSelect").value = "";
  document.getElementById("entryNetAmount").value = "";
  document.getElementById("entryVatAmount").value = "0.00";
  document.getElementById("entryTotal").value = "";
  document.getElementById("entryStatus").value = "Paid";
  document.getElementById("entryNotes").value = "";
  document.getElementById("entryModal")?.classList.add("show");
  window.handleEntryTypeChange();
  window.applyEntryModePermissions();
  const statusWrap = document.getElementById("entryStatusWrap");
  const statusSel = document.getElementById("entryStatus");
  if(statusSel){
    statusSel.innerHTML = '<option value="Paid">Paid</option>';
    statusSel.value = "Paid";
    statusSel.disabled = true;
  }
  if(statusWrap) statusWrap.style.display = "none";
  setEntryStatus("Deposit is recorded as supplier credit, not invoice. Status is locked to Paid.", "ok");
  refreshCustomSelects(document);
};


window.openSettingsModal = async function(){ if(!canManageSettings()) return alert("Only admin can change VAT settings."); await render(); document.getElementById("settingsModal")?.classList.add("show"); refreshCustomSelects(document); };
window.closeSettingsModal = function(){ document.getElementById("settingsModal")?.classList.remove("show"); };

window.openConvertOrderModal = async function(){
  if(!canAccountant()) return alert("Only accountant or admin can convert order to invoice.");
  if(selectedIds.length !== 1){
    alert("Select exactly one order row.");
    return;
  }
  const id = selectedIds[0];
  const { data, error } = await supabase.from("suppliers").select("*").eq("id", id).single();
  if(error || !data){
    alert(error?.message || "Could not load selected row.");
    return;
  }
  const selectedKind = displayEntryKind(data);
  if(selectedKind === "order"){
    alert("Create or select a Delivery Note before converting to Invoice.");
    return;
  }
  if(selectedKind !== "delivery_note"){
    alert("Select a Delivery Note row to convert to Invoice.");
    return;
  }
  document.getElementById("convertInvoiceNo").value = "";
  document.getElementById("convertInvoiceStatus").value = "Paid";
  const st = document.getElementById("convertOrderStatus");
  if(st){ st.textContent = ""; st.className = "status"; }
  document.getElementById("convertOrderModal")?.classList.add("show");
};

window.closeConvertOrderModal = function(){
  document.getElementById("convertOrderModal")?.classList.remove("show");
};

window.convertOrderToInvoice = async function(){
  if(selectedIds.length !== 1){
    alert("Select exactly one order row.");
    return;
  }
  const id = selectedIds[0];
  const invoiceNo = (document.getElementById("convertInvoiceNo")?.value || "").trim();
  const statusVal = document.getElementById("convertInvoiceStatus")?.value || "Paid";
  const statusEl = document.getElementById("convertOrderStatus");

  if(!invoiceNo){
    statusEl.className = "status error";
    statusEl.textContent = "Enter invoice number.";
    return;
  }

  const { data: row, error: rowErr } = await supabase.from("suppliers").select("*").eq("id", id).single();
  if(rowErr || !row){
    statusEl.className = "status error";
    statusEl.textContent = rowErr?.message || "Could not load selected row.";
    return;
  }
  const selectedKind = displayEntryKind(row);
  if(selectedKind === "order"){
    statusEl.className = "status error";
    statusEl.textContent = "Create or select a Delivery Note before converting to Invoice.";
    return;
  }
  if(selectedKind !== "delivery_note"){
    statusEl.className = "status error";
    statusEl.textContent = "Selected row is no longer a Delivery Note.";
    return;
  }

  const { data: dupRows, error: dupErr } = await supabase
    .from("suppliers")
    .select("id, invoice_no, supplier, entry_type")
    .eq("invoice_no", invoiceNo)
    .eq("supplier", row.supplier);

  if(dupErr){
    statusEl.className = "status error";
    statusEl.textContent = dupErr.message;
    return;
  }
  const duplicateExists = (dupRows || []).some(r => String(r.id) !== String(id) && ((r.entry_type || "invoice") !== "deposit"));
  if(duplicateExists){
    statusEl.className = "status error";
    statusEl.textContent = "This supplier already has the same invoice number.";
    return;
  }

  const { error } = await supabase.from("suppliers").update({
    invoice_no: invoiceNo,
    entry_type: "invoice",
    status: statusVal
  }).eq("id", id);

  if(error){
    statusEl.className = "status error";
    statusEl.textContent = error.message;
    return;
  }

  await logAudit("convert_dn_to_invoice", `${row.supplier} | ${row.order_no || "-"} / ${typeof extractDeliveryNoteNo === "function" ? (extractDeliveryNoteNo(row) || "DN") : "DN"} -> ${invoiceNo}`);
  statusEl.className = "status ok";
  statusEl.textContent = "Order converted to invoice.";
  window.closeConvertOrderModal();
  selectedIds = [];
  await render();
};


window.saveVatRate = function(){
  const v = Number(document.getElementById("vatRateInput").value || 15);
  const b = document.getElementById("depositBasisInput").value || "net";
  setVatRate(v);
  setDepositBasis(b);
  window.closeSettingsModal();
  render();
};


window.saveEntry = async function(){
  if(currentRole === "viewer"){
    setEntryStatus("Viewer role cannot create or edit entries.", "error");
    return;
  }
  const modeValue = (document.getElementById("entryMode")?.value || "").trim();
  if(modeValue === "order" && !canCreateOrder()){
    setEntryStatus("This role cannot create orders.", "error");
    return;
  }
  if(modeValue === "invoice" && !canCreateInvoice()){
    setEntryStatus("This role cannot create invoices.", "error");
    return;
  }
  const supplier = document.getElementById("entrySupplier").value.trim();
  const supplierVatType = getSupplierVatType(supplier);
  const orderNo = document.getElementById("entryOrderNo").value.trim();
  const invoiceNo = document.getElementById("entryInvoiceNo").value.trim();
  const project = document.getElementById("entryProject").value.trim();
  let entryType = document.getElementById("entryType").value;
  const saveMode = (document.getElementById("entryMode")?.value || "").trim();
  if(saveMode === "deposit") entryType = "deposit";
  const description = (document.getElementById("entryDescription").value || document.getElementById("entryDescriptionSelect").value || "").trim();
  let netAmount = Number(document.getElementById("entryNetAmount").value || 0);
  let vatAmount = Number(document.getElementById("entryVatAmount").value || 0);
  let total = Number(document.getElementById("entryTotal").value || 0);
  const status = entryType === "deposit" ? "Paid" : document.getElementById("entryStatus").value;
  const notes = document.getElementById("entryNotes").value.trim();

  if(!supplier || !project || !total){
    setEntryStatus("Fill supplier, project and total.", "error");
    return;
  }

  setSupplierVatType(supplier, supplierVatType);

  if(supplierVatType === "not_registered"){
    if(total > 0){
      netAmount = total;
    } else if(netAmount > 0){
      total = netAmount;
    }
    vatAmount = 0;
  } else {
    if(total > 0){
      netAmount = calcNetFromGross(total);
      vatAmount = total - netAmount;
    } else if(netAmount > 0){
      vatAmount = calcVatFromNet(netAmount);
      total = calcGrossFromNet(netAmount);
    }
  }

  if(invoiceNo && modeValue !== "delivery_note"){
    const { data: dupRows, error: dupErr } = await supabase
      .from("suppliers")
      .select("id, invoice_no, supplier, entry_type")
      .eq("invoice_no", invoiceNo)
      .eq("supplier", supplier);

    if(dupErr){
      setEntryStatus(dupErr.message, "error");
      return;
    }
    const duplicateExists = (dupRows || []).some(r => String(r.id) !== String(editingId) && (r.entry_type || "invoice") === "invoice");
    if(duplicateExists){
      setEntryStatus("This supplier already has the same invoice number.", "error");
      return;
    }
  }

  const effectiveMode = (document.getElementById("entryMode")?.value || "").trim();
  const payload = {
    supplier,
    order_no: effectiveMode === "invoice" ? (orderNo || null) : (orderNo || null),
    invoice_no: effectiveMode === "order" ? null : (entryType === "deposit" ? null : (invoiceNo || null)),
    project,
    description,
    net_amount: netAmount,
    vat_amount: vatAmount,
    total: total,
    status,
    notes,
    entry_type: effectiveMode === "delivery_note" ? "delivery_note" : (effectiveMode === "order" ? "order" : (entryType === "deposit" ? "deposit" : (invoiceNo ? "invoice" : "order"))),
    created_by: currentUser?.email || "",
    amount: total
  };

  if(editingId){
    const { error } = await supabase.from("suppliers").update(payload).eq("id", editingId);
    if(error){
      setEntryStatus(error.message.includes("duplicate") ? "Database still blocks duplicate invoice numbers globally. Update Supabase unique rule to Supplier + Invoice No." : error.message, "error");
      return;
    }
  } else {
    const { error } = await supabase.from("suppliers").insert([payload]);
    if(error){
      setEntryStatus(error.message.includes("duplicate") ? "Database still blocks duplicate invoice numbers globally. Update Supabase unique rule to Supplier + Invoice No." : error.message, "error");
      return;
    }
  }

  await logAudit(editingId ? "update_entry" : "create_entry", `${supplier} | ${project} | ${orderNo || "-"} | ${invoiceNo || "-"}`);
  setEntryStatus("Saved", "ok");
  window.closeEntryModal();
  await render();
};


window.deleteEntry = async function(){
  if(!editingId) return;
  if(!confirm("Delete this entry?")) return;
  const { error } = await supabase.from("suppliers").delete().eq("id", editingId);
  if(error){ alert(error.message); return; }
  window.closeEntryModal();
  await render();
};


window.printSupplierDepositReport = async function(){
  const rows = await getEntries();
  if(uiState.supplier){
    const supplier = uiState.supplier;
    const supplierRows = rows.filter(r => (r.supplier || "") === supplier)
      .sort((a,b)=>{
        const ad = a.created_at || "";
        const bd = b.created_at || "";
        if(ad !== bd) return ad.localeCompare(bd);
        return String(a.id||"").localeCompare(String(b.id||""));
      });

    let balance = 0;
    const txRows = supplierRows.map(r=>{
      const kind = displayEntryKind(r);
      let debit = 0, credit = 0, ref = "";
      if(kind === "deposit"){
        credit = depositBaseAmount(r);
        ref = r.order_no || r.invoice_no || r.notes || "Deposit";
        balance += credit;
      } else if(kind === "invoice"){
        debit = depositBaseAmount(r);
        ref = r.invoice_no || r.order_no || "Invoice";
        balance -= debit;
      } else {
        ref = r.order_no || "Order";
      }
      return { date:localDateFromAnyV97(r.created_at), kind, ref, debit, credit, balance };
    });

    const opening = 0;
    const closing = balance;
    const txHtml = txRows.map(t => `<tr>
      <td>${esc(t.date)}</td>
      <td>${esc(t.kind)}</td>
      <td>${esc(t.ref)}</td>
      <td>${money(t.debit)}</td>
      <td>${money(t.credit)}</td>
      <td>${money(t.balance)}</td>
    </tr>`).join("");

    const w = window.open("", "_blank");
    if(!w){ alert("Please allow pop-ups for reports."); return; }
    w.document.write(`<html><head><title>Supplier Statement</title><style>
      body{font-family:Arial;padding:24px;color:#111}
      h1,h2{margin:0 0 12px}
      .meta{margin:0 0 16px;color:#444}
      .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0}
      .card{border:1px solid #ddd;border-radius:10px;padding:12px;background:#fafafa}
      table{width:100%;border-collapse:collapse;font-size:12px;margin-top:12px}
      th,td{border:1px solid #ddd;padding:8px;text-align:left}
      th{background:#eef3ff}
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


/* V471 Reverse DN button - blue gray, before Delete */
.reverse-dn-btn{
  background:linear-gradient(180deg,#667789,#344454)!important;
  color:#fff!important;
  border:1px solid rgba(184,205,224,.55)!important;
  border-radius:18px!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 10px 22px rgba(0,0,0,.28)!important;
  font-weight:800!important;
}
.reverse-dn-btn:hover{filter:brightness(1.08);}
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

</head><body><button class="report-back-btn" onclick="if(window.opener){window.close()}else{history.back()}">← Back to Dashboard</button>
      <h1>Supplier Statement</h1>
      <div class="meta">Supplier: ${esc(supplier)} • Period: ${reportMonthLabel()} • Basis: ${getDepositBasis()==="net" ? "Before VAT" : "After VAT / Total"}</div>
      <div class="cards">
        <div class="card"><strong>Opening Balance</strong><div>${money(opening)}</div></div>
        <div class="card"><strong>Orders Open</strong><div>${supplierRows.filter(r=>displayEntryKind(r)==="order").length}</div></div>
        <div class="card"><strong>Invoices</strong><div>${money(supplierRows.filter(r=>displayEntryKind(r)==="invoice").reduce((s,r)=>s+depositBaseAmount(r),0))}</div></div>
        <div class="card"><strong>Closing Balance</strong><div>${money(closing)}</div></div>
      </div>
      <table>
        <thead><tr><th>Date</th><th>Type</th><th>Reference</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
        <tbody>${txHtml}</tbody>
      </table>
      <script>window.onload=()=>window.print()<\/script>
    

</body></html>`);
    w.document.close();
    return;
  }

  const groups = {};
  rows.forEach(r=>{
    const s = r.supplier || "Unknown";
    if(!groups[s]) groups[s] = { deposits:0, orders:0, invoices:0, applied:0, due:0, credit:0 };
    const base = depositBaseAmount(r);
    const kind = displayEntryKind(r);
    if(kind === "deposit") groups[s].deposits += base;
    else if(kind === "invoice"){
      groups[s].invoices += base;
      groups[s].applied += Number(r.deposit_applied || 0);
      groups[s].due += Number(r.amount_due || 0);
    } else groups[s].orders += base;
    groups[s].credit = Math.max(0, groups[s].deposits - groups[s].invoices);
  });
  const rowsHtml = Object.entries(groups).sort((a,b)=>a[0].localeCompare(b[0])).map(([name,v]) =>
    `<tr><td>${esc(name)}</td><td>${money(v.deposits)}</td><td>${money(v.orders)}</td><td>${money(v.invoices)}</td><td>${money(v.applied)}</td><td>${money(v.due)}</td><td>${money(v.credit)}</td></tr>`
  ).join("");
  const w = window.open("", "_blank");
  if(!w){ alert("Please allow pop-ups for reports."); return; }
  w.document.write(`<html><head><title>Supplier Credit Statement</title>
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
<style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#dfeaff}</style>
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

</head><body><button class="report-back-btn" onclick="if(window.opener){window.close()}else{history.back()}">← Back to Dashboard</button><h1>Supplier Credit Statement - ${reportMonthLabel()}</h1><div class="report-table-wrap"><table><thead><tr><th>Supplier</th><th>Deposits Added</th><th>Orders</th><th>Invoices Total</th><th>Deposit Applied</th><th>Outstanding</th><th>Carry Forward Credit</th></tr></thead><tbody>${rowsHtml}</tbody></table></div><script>window.onload=()=>window.print()<\/script>




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



/* === V471 REVERSE DN - single source Process = actual document state === */
window.reverseSelectedDN = async function(){
  try{
    if(typeof canAccountant === "function" && !canAccountant()) return alert("Only accountant / manager / admin can reverse DN.");
    if(!selectedIds || selectedIds.length !== 1) return alert("Select one row with Delivery Note.");

    const id = selectedIds[0];
    const { data, error } = await supabase.from("suppliers").select("*").eq("id", id).single();
    if(error || !data) return alert(error?.message || "Row not found.");

    const dn = extractDeliveryNoteNo(data);
    const hasDN = !!dn || extractDeliveredAmount(data) > 0 || ["delivery_note","dn"].includes(String(data.entry_type || "").toLowerCase());
    if(!hasDN) return alert("This row is not in DN state.");
    if(String(data.invoice_no || "").trim()) return alert("Cannot reverse DN after Invoice exists.");

    if(!confirm("Reverse Delivery Note" + (dn ? " " + dn : "") + " back to Order?")) return;

    let notes = stripDeliveryNoteTags(data.notes || "");
    ["DNAMT","CLOSE","CANCELAMT","CREDIT"].forEach(function(tag){ notes = stripNoteTag(notes, tag); });

    const payload = {
      notes: notes,
      status: "Order",
      entry_type: "order"
    };

    const { error: updError } = await supabase.from("suppliers").update(payload).eq("id", id);
    if(updError) return alert(updError.message);

    selectedIds = [];
    try{ await logAudit("reverse_dn", `order=${data.order_no || ""}, dn=${dn || ""}`); }catch(e){}
    if(typeof render === "function") await render();
    alert("DN reversed back to Order.");
  }catch(err){
    alert(err?.message || "Reverse DN failed.");
  }
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

// Protect Convert to Invoice as well.
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


/* === V471 REVERSE DN - single source Process = actual document state === */
window.reverseSelectedDN = async function(){
  try{
    if(typeof canAccountant === "function" && !canAccountant()) return alert("Only accountant / manager / admin can reverse DN.");
    if(!selectedIds || selectedIds.length !== 1) return alert("Select one row with Delivery Note.");

    const id = selectedIds[0];
    const { data, error } = await supabase.from("suppliers").select("*").eq("id", id).single();
    if(error || !data) return alert(error?.message || "Row not found.");

    const dn = extractDeliveryNoteNo(data);
    const hasDN = !!dn || extractDeliveredAmount(data) > 0 || ["delivery_note","dn"].includes(String(data.entry_type || "").toLowerCase());
    if(!hasDN) return alert("This row is not in DN state.");
    if(String(data.invoice_no || "").trim()) return alert("Cannot reverse DN after Invoice exists.");

    if(!confirm("Reverse Delivery Note" + (dn ? " " + dn : "") + " back to Order?")) return;

    let notes = stripDeliveryNoteTags(data.notes || "");
    ["DNAMT","CLOSE","CANCELAMT","CREDIT"].forEach(function(tag){ notes = stripNoteTag(notes, tag); });

    const payload = {
      notes: notes,
      status: "Order",
      entry_type: "order"
    };

    const { error: updError } = await supabase.from("suppliers").update(payload).eq("id", id);
    if(updError) return alert(updError.message);

    selectedIds = [];
    try{ await logAudit("reverse_dn", `order=${data.order_no || ""}, dn=${dn || ""}`); }catch(e){}
    if(typeof render === "function") await render();
    alert("DN reversed back to Order.");
  }catch(err){
    alert(err?.message || "Reverse DN failed.");
  }
};

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



/* === V471 REVERSE DN - single source Process = actual document state === */
window.reverseSelectedDN = async function(){
  try{
    if(typeof canAccountant === "function" && !canAccountant()) return alert("Only accountant / manager / admin can reverse DN.");
    if(!selectedIds || selectedIds.length !== 1) return alert("Select one row with Delivery Note.");

    const id = selectedIds[0];
    const { data, error } = await supabase.from("suppliers").select("*").eq("id", id).single();
    if(error || !data) return alert(error?.message || "Row not found.");

    const dn = extractDeliveryNoteNo(data);
    const hasDN = !!dn || extractDeliveredAmount(data) > 0 || ["delivery_note","dn"].includes(String(data.entry_type || "").toLowerCase());
    if(!hasDN) return alert("This row is not in DN state.");
    if(String(data.invoice_no || "").trim()) return alert("Cannot reverse DN after Invoice exists.");

    if(!confirm("Reverse Delivery Note" + (dn ? " " + dn : "") + " back to Order?")) return;

    let notes = stripDeliveryNoteTags(data.notes || "");
    ["DNAMT","CLOSE","CANCELAMT","CREDIT"].forEach(function(tag){ notes = stripNoteTag(notes, tag); });

    const payload = {
      notes: notes,
      status: "Order",
      entry_type: "order"
    };

    const { error: updError } = await supabase.from("suppliers").update(payload).eq("id", id);
    if(updError) return alert(updError.message);

    selectedIds = [];
    try{ await logAudit("reverse_dn", `order=${data.order_no || ""}, dn=${dn || ""}`); }catch(e){}
    if(typeof render === "function") await render();
    alert("DN reversed back to Order.");
  }catch(err){
    alert(err?.message || "Reverse DN failed.");
  }
};

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


/* === V471 REVERSE DN - single source Process = actual document state === */
window.reverseSelectedDN = async function(){
  try{
    if(typeof canAccountant === "function" && !canAccountant()) return alert("Only accountant / manager / admin can reverse DN.");
    if(!selectedIds || selectedIds.length !== 1) return alert("Select one row with Delivery Note.");

    const id = selectedIds[0];
    const { data, error } = await supabase.from("suppliers").select("*").eq("id", id).single();
    if(error || !data) return alert(error?.message || "Row not found.");

    const dn = extractDeliveryNoteNo(data);
    const hasDN = !!dn || extractDeliveredAmount(data) > 0 || ["delivery_note","dn"].includes(String(data.entry_type || "").toLowerCase());
    if(!hasDN) return alert("This row is not in DN state.");
    if(String(data.invoice_no || "").trim()) return alert("Cannot reverse DN after Invoice exists.");

    if(!confirm("Reverse Delivery Note" + (dn ? " " + dn : "") + " back to Order?")) return;

    let notes = stripDeliveryNoteTags(data.notes || "");
    ["DNAMT","CLOSE","CANCELAMT","CREDIT"].forEach(function(tag){ notes = stripNoteTag(notes, tag); });

    const payload = {
      notes: notes,
      status: "Order",
      entry_type: "order"
    };

    const { error: updError } = await supabase.from("suppliers").update(payload).eq("id", id);
    if(updError) return alert(updError.message);

    selectedIds = [];
    try{ await logAudit("reverse_dn", `order=${data.order_no || ""}, dn=${dn || ""}`); }catch(e){}
    if(typeof render === "function") await render();
    alert("DN reversed back to Order.");
  }catch(err){
    alert(err?.message || "Reverse DN failed.");
  }
};

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


/* === V471 REVERSE DN - single source Process = actual document state === */
window.reverseSelectedDN = async function(){
  try{
    if(typeof canAccountant === "function" && !canAccountant()) return alert("Only accountant / manager / admin can reverse DN.");
    if(!selectedIds || selectedIds.length !== 1) return alert("Select one row with Delivery Note.");

    const id = selectedIds[0];
    const { data, error } = await supabase.from("suppliers").select("*").eq("id", id).single();
    if(error || !data) return alert(error?.message || "Row not found.");

    const dn = extractDeliveryNoteNo(data);
    const hasDN = !!dn || extractDeliveredAmount(data) > 0 || ["delivery_note","dn"].includes(String(data.entry_type || "").toLowerCase());
    if(!hasDN) return alert("This row is not in DN state.");
    if(String(data.invoice_no || "").trim()) return alert("Cannot reverse DN after Invoice exists.");

    if(!confirm("Reverse Delivery Note" + (dn ? " " + dn : "") + " back to Order?")) return;

    let notes = stripDeliveryNoteTags(data.notes || "");
    ["DNAMT","CLOSE","CANCELAMT","CREDIT"].forEach(function(tag){ notes = stripNoteTag(notes, tag); });

    const payload = {
      notes: notes,
      status: "Order",
      entry_type: "order"
    };

    const { error: updError } = await supabase.from("suppliers").update(payload).eq("id", id);
    if(updError) return alert(updError.message);

    selectedIds = [];
    try{ await logAudit("reverse_dn", `order=${data.order_no || ""}, dn=${dn || ""}`); }catch(e){}
    if(typeof render === "function") await render();
    alert("DN reversed back to Order.");
  }catch(err){
    alert(err?.message || "Reverse DN failed.");
  }
};

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

// Convert to Invoice: copy the DN decision, do not recalculate.
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


/* === V471 REVERSE DN - single source Process = actual document state === */
window.reverseSelectedDN = async function(){
  try{
    if(typeof canAccountant === "function" && !canAccountant()) return alert("Only accountant / manager / admin can reverse DN.");
    if(!selectedIds || selectedIds.length !== 1) return alert("Select one row with Delivery Note.");

    const id = selectedIds[0];
    const { data, error } = await supabase.from("suppliers").select("*").eq("id", id).single();
    if(error || !data) return alert(error?.message || "Row not found.");

    const dn = extractDeliveryNoteNo(data);
    const hasDN = !!dn || extractDeliveredAmount(data) > 0 || ["delivery_note","dn"].includes(String(data.entry_type || "").toLowerCase());
    if(!hasDN) return alert("This row is not in DN state.");
    if(String(data.invoice_no || "").trim()) return alert("Cannot reverse DN after Invoice exists.");

    if(!confirm("Reverse Delivery Note" + (dn ? " " + dn : "") + " back to Order?")) return;

    let notes = stripDeliveryNoteTags(data.notes || "");
    ["DNAMT","CLOSE","CANCELAMT","CREDIT"].forEach(function(tag){ notes = stripNoteTag(notes, tag); });

    const payload = {
      notes: notes,
      status: "Order",
      entry_type: "order"
    };

    const { error: updError } = await supabase.from("suppliers").update(payload).eq("id", id);
    if(updError) return alert(updError.message);

    selectedIds = [];
    try{ await logAudit("reverse_dn", `order=${data.order_no || ""}, dn=${dn || ""}`); }catch(e){}
    if(typeof render === "function") await render();
    alert("DN reversed back to Order.");
  }catch(err){
    alert(err?.message || "Reverse DN failed.");
  }
};

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

/* === V269 PRO ACCOUNTING CREDIT NOTE - SEPARATE ROW / LOGIN SAFE === */
(function(){
  if(window.__v269CreditNoteLoaded) return;
  window.__v269CreditNoteLoaded = true;
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
      if(!hasInvoice || kind === "order" || kind === "deposit" || kind === "delivery_note" || kind === "delivery" || kind === "credit_note"){
        return alert("Credit Note works only on the selected Invoice row. Select an invoice with an Invoice No.");
      }

      const currentCredit = (typeof extractCreditAmount === "function") ? Number(extractCreditAmount(row) || 0) : 0;
      const invoiceBase = (typeof invoiceDisplayAmount === "function") ? Number(invoiceDisplayAmount(row) || 0) : Number(row.total || row.amount || 0);
      const depositApplied = Number(row.deposit_applied || 0);
      const currentOutstanding = (typeof amountDueDisplay === "function") ? Number(amountDueDisplay(row) || 0) : Math.max(0, invoiceBase - depositApplied - currentCredit);

      const creditNo = prompt("Credit Note Number", "CN-" + String(row.invoice_no || ""));
      if(creditNo === null || !String(creditNo).trim()) return;
      const cleanCreditNo = String(creditNo).trim();

      const defaultCreditAmount = currentOutstanding > 0 ? currentOutstanding : Math.max(0, invoiceBase - depositApplied - currentCredit);
      const raw = prompt(
        "Credit Note Amount\nInvoice: " + String(row.invoice_no || "") +
        "\nInvoice Value: " + cnMoney(invoiceBase) +
        "\nCurrent Outstanding: " + cnMoney(currentOutstanding) +
        "\nThe Credit Note will be saved as a separate row and linked to this invoice.",
        Number(defaultCreditAmount || 0).toFixed(2)
      );
      if(raw === null) return;
      const creditAmount = cnAmount(raw);
      if(creditAmount <= 0) return alert("Invalid Credit Note amount.");

      const reason = prompt("Reason / Note", "Material quality issue") || "Supplier credit note";
      const date = prompt("Credit Note Date", cnToday()) || cnToday();
      const newCreditTotal = currentCredit + creditAmount;
      const invoiceDueAfterCredit = Math.max(0, invoiceBase - depositApplied - newCreditTotal);
      const safeStatus = invoiceDueAfterCredit <= 0.01 ? "Covered" : (row.status || "Unpaid");

      let notes = String(row.notes || "");
      const historyLine = date + " | " + cleanCreditNo + " | " + creditAmount.toFixed(2) + " | " + reason;
      if(typeof upsertNoteTag === "function"){
        notes = upsertNoteTag(notes, "CREDIT", newCreditTotal.toFixed(2));
        notes = upsertNoteTag(notes, "CREDITNO", cleanCreditNo);
        notes = upsertNoteTag(notes, "CREDITDATE", date);
        notes = upsertNoteTag(notes, "CREDITREASON", reason);
        notes += "\n[[CREDITHISTORY:" + historyLine + "]]";
      } else {
        notes += "\n[[CREDIT:" + newCreditTotal.toFixed(2) + "]]";
        notes += "\n[[CREDITNO:" + cleanCreditNo + "]]";
        notes += "\n[[CREDITDATE:" + date + "]]";
        notes += "\n[[CREDITREASON:" + reason + "]]";
        notes += "\n[[CREDITHISTORY:" + historyLine + "]]";
      }

      const upd = await supabase.from("suppliers").update({ notes, status: safeStatus }).eq("id", id);
      if(upd.error) return alert(upd.error.message);
      try{ await supabase.from("suppliers").update({ amount_due: invoiceDueAfterCredit }).eq("id", id); }catch(e){}
      try{ await supabase.from("suppliers").update({ unpaid_after_deposit: invoiceDueAfterCredit }).eq("id", id); }catch(e){}

      const creditNotes =
        "Credit Note for Invoice " + String(row.invoice_no || "") + "\n" +
        "[[PARENTINVOICE:" + String(row.invoice_no || "") + "]]\n" +
        "[[CREDITPARENT:" + String(id) + "]]\n" +
        "[[CREDITNO:" + cleanCreditNo + "]]\n" +
        "[[CREDITDATE:" + date + "]]\n" +
        "[[CREDITREASON:" + reason + "]]";

      const creditPayload = {
        supplier: row.supplier || null,
        order_no: row.order_no || null,
        invoice_no: cleanCreditNo,
        project: row.project || null,
        description: "Credit Note - " + (reason || "Supplier credit"),
        net_amount: -Math.abs(creditAmount),
        vat_amount: 0,
        total: -Math.abs(creditAmount),
        status: "Credit Note",
        notes: creditNotes,
        entry_type: "credit_note",
        created_by: currentUser?.email || "",
        amount: -Math.abs(creditAmount)
      };
      const ins = await supabase.from("suppliers").insert([creditPayload]);
      if(ins.error) return alert("Invoice was updated, but Credit Note row could not be created: " + ins.error.message);

      selectedIds = [];
      try{ if(typeof logAudit === "function") await logAudit("credit_note", "invoice=" + (row.invoice_no || id) + " credit_row=" + cleanCreditNo + " amount=" + creditAmount); }catch(e){}
      alert("Credit Note row created: " + cleanCreditNo + " / " + cnMoney(creditAmount) + "\nInvoice outstanding is now: " + cnMoney(invoiceDueAfterCredit));
      if(typeof render === "function") await render();
    }catch(err){ alert(err?.message || "Credit Note error"); }
  };

  const st = document.createElement("style");
  st.textContent = ".credit-note-btn,.credit-note-btn-pro{color:#111!important;background:linear-gradient(145deg,#efd3ab,#b88754)!important;font-weight:900!important}.credit-note-value{color:#f5c26b!important}.badge.vat{white-space:nowrap}";
  document.head.appendChild(st);
})();


;

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

;

/* V88: Login guard only. Does not change users/auth credentials.
   It re-binds the existing Login button to the original safeLoginClick function
   and makes sure the button remains clickable after upload/cache issues. */
(function(){
  function bindLoginGuard(){
    var btn = document.getElementById("loginBtn");
    if(!btn || btn.dataset.v88LoginGuard === "1") return;
    btn.dataset.v88LoginGuard = "1";
    btn.disabled = false;
    btn.style.pointerEvents = "auto";
    btn.style.position = btn.style.position || "relative";
    btn.style.zIndex = "10";
    btn.addEventListener("click", function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      btn.disabled = false;
      if(typeof window.safeLoginClick === "function"){
        window.safeLoginClick();
      } else if(typeof window.login === "function"){
        window.login();
      } else {
        var st = document.getElementById("loginStatus");
        if(st) st.textContent = "Login is loading. Refresh and try again.";
      }
    }, true);
  }
  document.addEventListener("DOMContentLoaded", bindLoginGuard);
  window.addEventListener("load", bindLoginGuard);
  setTimeout(bindLoginGuard, 300);
  setTimeout(bindLoginGuard, 1200);
})();

;

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

;

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

;

;

/* === V266 PRO FORCE VISIBLE CREDIT NOTE BUTTON - NEXT TO CONVERT INVOICE === */
(function(){
 if(window.__v266ForceCreditNoteVisible) return; window.__v266ForceCreditNoteVisible=true;
 function run(){ if(typeof window.openCreditNoteModal==='function') return window.openCreditNoteModal(); alert('Credit Note module is still loading. Refresh and try again.'); }
 function make(id,txt){ var b=document.getElementById(id); if(!b){b=document.createElement('button');b.id=id;b.type='button';b.textContent=txt;b.onclick=run;} b.className='v266-credit-note-force'; b.style.cssText='display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:42px!important;padding:0 18px!important;border-radius:16px!important;border:1px solid rgba(255,255,255,.55)!important;background:linear-gradient(135deg,#ffe7b3,#d39a55)!important;color:#111!important;font-weight:900!important;font-size:13px!important;box-shadow:0 8px 24px rgba(211,154,85,.28)!important;cursor:pointer!important;white-space:nowrap!important;z-index:999999!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important'; return b;}
 function canShow(){try{return (typeof canAccountant!=='function')||canAccountant();}catch(e){return true;}}
 function inject(){ if(!canShow()) return; var bars=Array.from(document.querySelectorAll('.toolbar,.supplier-selection-toolbar,div')); var bar=bars.find(function(el){var t=(el.textContent||'').toLowerCase(); return (t.includes('mark selected')&&t.includes('delete selected'))||(t.includes('convert order')&&t.includes('duplicate selected'));}); if(bar&&!document.getElementById('v266CreditNoteMainBtn')){var b=make('v266CreditNoteMainBtn','Credit Note'); var convert=Array.from(bar.querySelectorAll('button')).find(function(x){var t=(x.textContent||'').toLowerCase(); return t.includes('convert order') && t.includes('invoice');}); if(convert && convert.nextSibling){bar.insertBefore(b, convert.nextSibling);} else if(convert){bar.appendChild(b);} else {bar.insertBefore(b,bar.firstElementChild||null);} try{bar.style.gridTemplateColumns='repeat(auto-fit,minmax(145px,1fr))';}catch(e){}} }
 var st=document.createElement('style'); st.textContent='.v266-credit-note-force{opacity:1!important;visibility:visible!important;pointer-events:auto!important}'; document.head.appendChild(st);
 document.addEventListener('DOMContentLoaded',inject); window.addEventListener('load',inject); setInterval(inject,700); setTimeout(inject,100);
})();


// V303 runtime style: dropdown/chips no text-shadow
(function(){
  const css = `#app .custom-select-menu,#app .custom-select-menu *,#loginScreen .custom-select-menu,#loginScreen .custom-select-menu *,#contractorsProScreen .custom-select-menu,#contractorsProScreen .custom-select-menu *,.custom-select-menu,.custom-select-menu *,.custom-select-item,div[role="option"],.custom-select-menu [role="option"]{text-shadow:none!important;-webkit-text-stroke:0!important;filter:none!important;color:#050505!important;-webkit-text-fill-color:#050505!important;font-weight:400!important}#app .chips,#app .chips *,#app .chip,#app .chip *,#contractorsProScreen .chips,#contractorsProScreen .chips *,#contractorsProScreen .chip,#contractorsProScreen .chip *,.table-wrap .chip,.table-wrap .chip *{text-shadow:none!important;-webkit-text-stroke:0!important;filter:none!important}#app .modal-box .custom-select-btn,#app .modal-box .custom-select-btn *,#app .modal-box input,#app .modal-box textarea,#app .modal-box select{text-shadow:none!important;-webkit-text-stroke:0!important;filter:none!important}`;
  if (typeof document !== 'undefined' && !document.getElementById('v303-runtime-no-shadow')) {
    const st = document.createElement('style'); st.id='v303-runtime-no-shadow'; st.textContent=css; document.head.appendChild(st);
  }
})();



/* ===== V439 TRUE LIVE STATUS MEDAL ===== */
(function(){
  if(window.__vpLiveStatusFixed) return;
  window.__vpLiveStatusFixed = true;

  function getDocStatus(modal){
    const txt = (modal.innerText || "").toLowerCase();

    if(txt.includes("return to pre-order")) return "ORDER";
    if(txt.includes("app order")) return "APP ORDER";
    return "PRE-ORDER";
  }

  function medalStyle(status){
    if(status === "ORDER"){
      return {
        bg:"linear-gradient(180deg,#0d5f39,#0a3f26)",
        border:"#6dd6a6"
      };
    }
    if(status === "APP ORDER"){
      return {
        bg:"linear-gradient(180deg,#334f88,#22345e)",
        border:"#a9c8ff"
      };
    }
    return {
      bg:"linear-gradient(180deg,#7a4c00,#5c3900)",
      border:"#f1c36d"
    };
  }

  function ensureMedal(modal){
    let footer =
      modal.querySelector(".modal-footer") ||
      modal.querySelector(".actions") ||
      modal.querySelector(".buttons") ||
      modal;

    let medal = footer.querySelector(".vp-status-medal-live");

    if(!medal){
      medal = document.createElement("div");
      medal.className = "vp-status-medal-live";
      medal.style.cssText = `
        margin:12px auto 0 auto;
        width:max-content;
        min-width:110px;
        text-align:center;
        padding:6px 14px;
        border-radius:18px;
        font-size:13px;
        font-weight:700;
        color:#fff;
        border:2px solid #fff;
        box-shadow:0 0 10px rgba(0,0,0,.35);
      `;
      footer.appendChild(medal);
    }

    const status = getDocStatus(modal);
    const style = medalStyle(status);

    medal.innerText = status;
    medal.style.background = style.bg;
    medal.style.borderColor = style.border;
  }

  function refresh(){
    document.querySelectorAll(".modal,.entry-modal,.window").forEach(ensureMedal);
  }

  document.addEventListener("click", function(){
    setTimeout(refresh, 120);
  });

  const observer = new MutationObserver(function(){
    refresh();
  });

  observer.observe(document.body,{
    childList:true,
    subtree:true,
    attributes:true
  });

  setInterval(refresh,1000);
  refresh();
})();



/* ===== V440 REAL STATUS STATE FIX ===== */
(function(){
  if(window.__v440Installed) return;
  window.__v440Installed = true;

  function resolveStatus(modal){
    try{
      if(modal.dataset && modal.dataset.status){
        return modal.dataset.status;
      }

      const approvedBtn = modal.querySelector('[data-status="approved"], .approved, .btn-approved');
      const returnBtn = [...modal.querySelectorAll('button')]
        .find(b => (b.innerText||'').toLowerCase().includes('return to pre-order'));

      if(returnBtn) return 'ORDER';
      if(approvedBtn) return 'APP ORDER';

      const statusEl = modal.querySelector('.status,.document-status,.workflow-status');
      if(statusEl){
        return (statusEl.innerText || 'PRE-ORDER').trim();
      }
    }catch(e){}

    return 'PRE-ORDER';
  }

  function getTheme(status){
    status = (status || '').toUpperCase();

    if(status.includes('ORDER') && !status.includes('APP')){
      return {
        text:'ORDER',
        bg:'linear-gradient(180deg,#0e6a43,#08462b)',
        border:'#69d8a2'
      };
    }

    if(status.includes('APP')){
      return {
        text:'APP ORDER',
        bg:'linear-gradient(180deg,#4868a8,#2f4776)',
        border:'#b9d1ff'
      };
    }

    return {
      text:'PRE-ORDER',
      bg:'linear-gradient(180deg,#8b5b12,#5f3c06)',
      border:'#f0c26b'
    };
  }

  function renderMedal(modal){
    const footer =
      modal.querySelector('.modal-footer') ||
      modal.querySelector('.actions') ||
      modal.querySelector('.buttons') ||
      modal;

    let medal = footer.querySelector('.v440-status-medal');

    if(!medal){
      medal = document.createElement('div');
      medal.className = 'v440-status-medal';
      medal.style.cssText = `
        margin:10px auto 0 auto;
        width:max-content;
        min-width:92px;
        text-align:center;
        padding:5px 12px;
        border-radius:16px;
        font-size:11px;
        font-weight:700;
        color:#fff;
        border:1.5px solid #fff;
        box-shadow:0 2px 8px rgba(0,0,0,.28);
      `;
      footer.appendChild(medal);
    }

    const theme = getTheme(resolveStatus(modal));

    medal.innerText = theme.text;
    medal.style.background = theme.bg;
    medal.style.borderColor = theme.border;
  }

  function refreshAll(){
    document.querySelectorAll('.modal,.entry-modal,.window').forEach(renderMedal);
  }

  document.addEventListener('click', ()=>{
    setTimeout(refreshAll,120);
    setTimeout(refreshAll,400);
  });

  const mo = new MutationObserver(refreshAll);
  mo.observe(document.body,{childList:true,subtree:true,attributes:true});

  setInterval(refreshAll,800);
  refreshAll();
})();
