(function(){
  if (window.__VP_CONTRACTORS_PRO_V244__) return;
  window.__VP_CONTRACTORS_PRO_V244__ = true;

  const KEY = 'vp_contractors_pro_v233'; // keep same key so your old contractor data stays
  const OLD_KEYS = ['vp_contractors_pro_v236','vp_contractors_pro_v235','vp_contractors_pro_v234','vp_contractors_pro_v231','vp_contractors_pro_v230','vp_contractors_pro_v229','vp_contractors_pro_v226','vp_contractors_pro_v225','vp_contractors_pro_v224'];
  let activeId = null;

  const q = id => document.getElementById(id);
  const money = v => 'R ' + Number(v || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const today = () => new Date().toISOString().slice(0,10);
  const nowText = () => new Date().toLocaleString('en-ZA');
  const uid = () => 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2,8);
  const esc = x => String(x ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const num = v => Number(String(v ?? '').replace(/[^0-9.-]/g,'')) || 0;

  function loadRaw(){
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch(e){ return []; }
  }
  function save(data){ localStorage.setItem(KEY, JSON.stringify(data || [])); }

  function normalizeAccount(a, idx, retentionPct){
    const claimed = num(a.claimed ?? a.amount ?? a.approved);
    return {
      id: a.id || uid(),
      no: Number(a.no || a.number || idx + 1) || (idx + 1),
      date: a.date || today(),
      claimed,
      note: a.note || a.description || '',
      retentionPercent: Number(a.retentionPercent ?? retentionPct ?? 5),
      status: a.status || (a.paid ? 'paid' : 'open'),
      paidDate: a.paidDate || '',
      paymentNote: a.paymentNote || ''
    };
  }
  function normalizeMovement(x){
    return { id:x.id || uid(), date:x.date || today(), amount:num(x.amount ?? x), note:x.note || '' };
  }
  function normalizeContractor(c){
    const retentionPct = Number(c.retention ?? c.retentionPercent ?? 5);
    const accounts = Array.isArray(c.accounts) ? c.accounts.map((a,i)=>normalizeAccount(a,i,retentionPct)) : [];
    const payments = Array.isArray(c.payments) ? c.payments.map(normalizeMovement) : [];
    const variations = Array.isArray(c.variations) ? c.variations.map(normalizeMovement) : [];
    const deductions = Array.isArray(c.deductions) ? c.deductions.map(normalizeMovement) : [];
    const retentionPayments = Array.isArray(c.retentionPayments) ? c.retentionPayments.map(normalizeMovement) : (Array.isArray(c.retention) ? c.retention.map(normalizeMovement) : []);
    return {
      id: c.id || uid(),
      name: c.name || c.contractor || c.supplier || 'Contractor',
      trade: c.trade || c.category || 'Sub Contractor',
      project: c.project || '',
      contract: num(c.contract || c.contractValue || c.contract_value),
      retention: retentionPct,
      accounts,
      payments,
      variations,
      deductions,
      retentionPayments,
      contractHistory: Array.isArray(c.contractHistory) ? c.contractHistory : []
    };
  }
  function migrate(){
    let data = loadRaw();
    if (!Array.isArray(data) || !data.length) {
      for (const k of OLD_KEYS) {
        try {
          const old = JSON.parse(localStorage.getItem(k) || '[]');
          if (Array.isArray(old) && old.length) { data = old; break; }
        } catch(e) {}
      }
    }
    data = (Array.isArray(data) ? data : []).map(normalizeContractor);
    save(data);
    return data;
  }
  function load(){ return migrate(); }
  function getById(id){ return load().find(c => c.id === id); }

  function getSupplierList(){
    const set = new Set();
    const tryArray = key => { try { (JSON.parse(localStorage.getItem(key) || '[]') || []).forEach(x => x && set.add(String(x.name || x.supplier || x).trim())); } catch(e) {} };
    tryArray('vardophase_list_supplier');
    tryArray('supplier');
    tryArray('suppliers');
    tryArray('vp_suppliers');
    try { (window.entries || window.rows || []).forEach(r => r && r.supplier && set.add(String(r.supplier).trim())); } catch(e) {}
    try { document.querySelectorAll('#supplierFilter option,#removeSupplierSelect option,#supplierVatSelect option,select option').forEach(o => {
      const v=(o.value || o.textContent || '').replace(' · VAT','').replace(' · No VAT','').trim();
      if(v && !/^all suppliers$/i.test(v) && !/^select/i.test(v) && !/^choose/i.test(v) && v.length > 1) set.add(v);
    }); } catch(e) {}
    return [...set].filter(Boolean).sort((a,b)=>a.localeCompare(b));
  }

  function accountRetention(c,a){ return num(a.claimed) * (Number(a.retentionPercent ?? c.retention ?? 0) / 100); }
  function accountNet(c,a){ return Math.max(0, num(a.claimed) - accountRetention(c,a)); }
  function isAccountPaid(a){ return String(a.status || '').toLowerCase() === 'paid'; }
  function totals(c){
    const accounts = c.accounts || [], variations = c.variations || [], deductions = c.deductions || [], retentionPayments = c.retentionPayments || [];
    const claimed = accounts.reduce((s,a)=>s+num(a.claimed),0);
    const variationsTotal = variations.reduce((s,a)=>s+num(a.amount),0);
    const deductionsTotal = deductions.reduce((s,a)=>s+num(a.amount),0);
    const retentionHeld = accounts.reduce((s,a)=>s + accountRetention(c,a), 0);
    const totalPayable = accounts.reduce((s,a)=>s + accountNet(c,a), 0) + variationsTotal - deductionsTotal;
    const paid = accounts.filter(isAccountPaid).reduce((s,a)=>s + accountNet(c,a), 0);
    const openPayable = accounts.filter(a=>!isAccountPaid(a)).reduce((s,a)=>s + accountNet(c,a), 0);
    const retentionPaid = retentionPayments.reduce((s,a)=>s+num(a.amount),0);
    const retentionBalance = Math.max(0, retentionHeld - retentionPaid);
    const contract = num(c.contract);
    const approvedBudget = contract + variationsTotal; // contract plus approved variations / additions
    const outstanding = approvedBudget - paid; // outstanding from contract + variations minus paid account payments
    const accountNetTotal = claimed - retentionHeld;
    const accountBalance = totalPayable - paid;
    const progressRaw = contract ? (claimed / contract * 100) : 0;
    const progress = Math.max(0, progressRaw);
    const budgetProgress = approvedBudget ? Math.max(0, claimed / approvedBudget * 100) : 0;
    const overOriginalContract = Math.max(0, claimed - contract);
    const overApprovedBudget = Math.max(0, claimed - approvedBudget);
    const availableForAccounts = Math.max(0, approvedBudget - claimed);
    const totalAccounts = accounts.length;
    const paidAccounts = accounts.filter(isAccountPaid).length;
    const openAccounts = totalAccounts - paidAccounts;
    return { contract, approvedBudget, claimed, variationsTotal, deductionsTotal, paid, retentionHeld, retentionPaid, retentionBalance, outstanding, accountNet: accountNetTotal, accountBalance, totalPayable, openPayable, progress, progressRaw, budgetProgress, overOriginalContract, overApprovedBudget, availableForAccounts, totalAccounts, paidAccounts, openAccounts };
  }
  function grandTotals(data){
    const out = data.reduce((a,c)=>{ const t=totals(c); a.contract += t.contract; a.approvedBudget += t.approvedBudget; a.claimed += t.claimed; a.variationsTotal += t.variationsTotal; a.deductionsTotal += t.deductionsTotal; a.retentionHeld += t.retentionHeld; a.retentionPaid += t.retentionPaid; a.retentionBalance += t.retentionBalance; a.paid += t.paid; a.outstanding += t.outstanding; a.overOriginalContract += t.overOriginalContract; a.overApprovedBudget += t.overApprovedBudget; a.totalAccounts += t.totalAccounts; a.paidAccounts += t.paidAccounts; a.openAccounts += t.openAccounts; return a; }, {contract:0,approvedBudget:0,claimed:0,variationsTotal:0,deductionsTotal:0,retentionHeld:0,retentionPaid:0,retentionBalance:0,paid:0,outstanding:0,overOriginalContract:0,overApprovedBudget:0,totalAccounts:0,paidAccounts:0,openAccounts:0});
    out.progress = out.contract ? Math.max(0, out.claimed / out.contract * 100) : 0;
    out.budgetProgress = out.approvedBudget ? Math.max(0, out.claimed / out.approvedBudget * 100) : 0;
    out.availableForAccounts = Math.max(0, out.approvedBudget - out.claimed);
    return out;
  }
  function nextAccountNo(c){
    const nums = (c.accounts || []).map(a => Number(a.no || 0)).filter(Boolean);
    return nums.length ? Math.max(...nums) + 1 : 1;
  }

  function css(){
    if (q('vpConCssV236')) return;
    const s = document.createElement('style');
    s.id = 'vpConCssV236';
    s.textContent = `
      html,body{background:#050505!important;color:#fff!important;}
      #appScreen{background:#050505!important;color:#fff!important;}
      #app,#app *{color:#fff;}
      #app input,#app select,#app textarea{color:#fff!important;background:linear-gradient(180deg,#111116,#050506)!important;border-color:rgba(230,198,154,.26)!important;}
      #app input::placeholder,#app textarea::placeholder{color:rgba(255,255,255,.68)!important;}
      #app table{background:#08080a!important;color:#fff!important;border-collapse:separate!important;border-spacing:0!important;}
      #app thead,#app tbody,#app tr,#app td,#app th{background:#08080a!important;color:#fff!important;border-color:rgba(230,198,154,.18)!important;}
      #app thead th,#app th{position:sticky;top:0;z-index:2;background:linear-gradient(180deg,#1b1b20,#09090b)!important;color:#e8c79a!important;text-transform:uppercase!important;letter-spacing:.08em!important;font-weight:950!important;box-shadow:0 1px 0 rgba(230,198,154,.25)!important;}
      #app tbody tr:nth-child(even) td{background:#0d0d10!important;}
      #app tbody tr:hover td{background:#17171c!important;}
      #app td{border-bottom:1px solid rgba(230,198,154,.12)!important;}
      #app .table-wrap,#app .tableWrap,#app .table-container{background:#08080a!important;border:1px solid rgba(230,198,154,.22)!important;border-radius:22px!important;overflow:auto!important;box-shadow:0 24px 60px rgba(0,0,0,.42)!important;}
      #app input[type="checkbox"]{accent-color:#d6aa72!important;background:#08080a!important;}

      #contractorsProScreen{display:none;width:100%!important;min-height:100vh!important;padding:18px 14px 122px!important;box-sizing:border-box!important;color:#fff!important;background:radial-gradient(circle at top left,rgba(230,198,154,.18),transparent 32%),linear-gradient(180deg,#050505 0%,#0b0b0e 56%,#050505 100%)!important;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Arial,sans-serif!important;}
      #contractorsProScreen,#contractorsProScreen *{box-sizing:border-box!important;color:#fff!important;}
      #contractorsProScreen .muted{color:#c9cbd2!important;} #contractorsProScreen .goldText{color:#e8c79a!important;} #contractorsProScreen .red{color:#ff8d8d!important;} #contractorsProScreen .green{color:#73e29b!important;}
      #contractorsProScreen .shell{max-width:1280px;margin:0 auto!important;}
      #contractorsProScreen .hero,#contractorsProScreen .panel,#contractorsProScreen .card,#contractorsProScreen .kpi,#contractorsProScreen .mini,#contractorsProScreen .formBox{background:linear-gradient(180deg,rgba(29,29,34,.98),rgba(7,7,9,.99))!important;border:1px solid rgba(230,198,154,.35)!important;box-shadow:0 22px 60px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.06)!important;}
      #contractorsProScreen .hero{border-radius:34px!important;padding:20px!important;margin-bottom:16px!important;}
      #contractorsProScreen .row{display:flex!important;gap:12px!important;align-items:center!important;justify-content:space-between!important;flex-wrap:wrap!important;}
      #contractorsProScreen h1{font-size:30px!important;line-height:1.05!important;margin:0!important;font-weight:950!important;letter-spacing:.02em!important;color:#fff!important;}
      #contractorsProScreen h2{font-size:22px!important;margin:0 0 12px!important;font-weight:950!important;color:#fff!important;}
      #contractorsProScreen h3{font-size:17px!important;margin:16px 0 10px!important;font-weight:900!important;color:#fff!important;}
      #contractorsProScreen .sub{margin-top:7px!important;color:#e8c79a!important;font-weight:800!important;}
      #contractorsProScreen .btn{border:1px solid rgba(230,198,154,.34)!important;border-radius:18px!important;background:linear-gradient(180deg,#222226,#101012)!important;color:#fff!important;font-weight:950!important;padding:12px 15px!important;min-height:44px!important;box-shadow:0 10px 24px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.06)!important;cursor:pointer!important;white-space:nowrap!important;}
      #contractorsProScreen .btn.gold,.vpcon-float button.active{background:linear-gradient(135deg,#f2d2a2,#c6945a 48%,#a8733d)!important;color:#120d08!important;border-color:rgba(255,230,190,.72)!important;}
      #contractorsProScreen .btn.danger{background:linear-gradient(180deg,#3a1719,#18090a)!important;color:#ffd7d7!important;border-color:rgba(255,150,150,.28)!important;}
      #contractorsProScreen .btn.small{min-height:36px!important;padding:8px 11px!important;border-radius:13px!important;font-size:12px!important;}
      #contractorsProScreen .selectBar{display:grid!important;grid-template-columns:1fr auto!important;gap:10px!important;margin:14px 0 0!important;align-items:center!important;}
      #contractorsProScreen .selectBar select{margin:0!important;min-height:54px!important;font-weight:900!important;}
      #contractorsProScreen .selectBar .btn{min-height:54px!important;}
      #contractorsProScreen option{background:#111114!important;color:#fff!important;}
      #contractorsProScreen .kpis{display:grid!important;grid-template-columns:repeat(6,1fr)!important;gap:10px!important;margin-top:16px!important;}
      #contractorsProScreen .kpi,#contractorsProScreen .mini{border-radius:22px!important;padding:15px!important;min-height:78px!important;}
      #contractorsProScreen .kpi span,#contractorsProScreen .mini span{display:block!important;color:#e8c79a!important;font-size:11px!important;text-transform:uppercase!important;letter-spacing:.10em!important;font-weight:950!important;}
      #contractorsProScreen .kpi b,#contractorsProScreen .mini b{display:block!important;margin-top:8px!important;font-size:18px!important;line-height:1.1!important;color:#fff!important;}
      #contractorsProScreen .layout{display:grid!important;grid-template-columns:360px 1fr!important;gap:16px!important;}
      #contractorsProScreen .panel{border-radius:30px!important;padding:18px!important;overflow:hidden!important;}
      #contractorsProScreen .formBox{border-radius:24px!important;padding:14px!important;margin:10px 0 14px!important;}
      #contractorsProScreen input,#contractorsProScreen select,#contractorsProScreen textarea{width:100%!important;box-sizing:border-box!important;margin:7px 0!important;padding:14px 15px!important;border-radius:18px!important;border:1px solid rgba(230,198,154,.25)!important;background:linear-gradient(180deg,#111114,#070708)!important;color:#fff!important;font-size:16px!important;outline:none!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 10px 24px rgba(0,0,0,.22)!important;}
      #contractorsProScreen input::placeholder,#contractorsProScreen textarea::placeholder{color:rgba(255,255,255,.72)!important;}
      #contractorsProScreen .card{border-radius:24px!important;padding:15px!important;margin:10px 0!important;cursor:pointer!important;}
      #contractorsProScreen .card.active{outline:2px solid rgba(242,210,162,.95)!important;box-shadow:0 0 0 5px rgba(230,198,154,.08),0 22px 60px rgba(0,0,0,.55)!important;}
      #contractorsProScreen .line{display:flex!important;justify-content:space-between!important;gap:8px!important;margin:9px 0!important;color:#cfd2db!important;font-weight:750!important;}
      #contractorsProScreen .line span{color:#cfd2db!important;} #contractorsProScreen .line b{color:#fff!important;}
      #contractorsProScreen .progress{height:10px!important;background:#2b2b30!important;border-radius:99px!important;overflow:hidden!important;margin-top:12px!important;border:1px solid rgba(255,255,255,.04)!important;}
      #contractorsProScreen .progress i{display:block!important;height:100%!important;background:linear-gradient(90deg,#a8733d,#f2d2a2)!important;border-radius:99px!important;}
      #contractorsProScreen .grid6{display:grid!important;grid-template-columns:repeat(6,1fr)!important;gap:10px!important;margin:14px 0!important;}
      #contractorsProScreen .grid4{display:grid!important;grid-template-columns:repeat(4,1fr)!important;gap:10px!important;margin:14px 0!important;}
      #contractorsProScreen .grid2{display:grid!important;grid-template-columns:1fr 1fr!important;gap:12px!important;}
      #contractorsProScreen .actions{display:grid!important;grid-template-columns:repeat(5,1fr)!important;gap:10px!important;margin:12px 0!important;}
      #contractorsProScreen .tableWrap{overflow:auto!important;border:1px solid rgba(230,198,154,.26)!important;border-radius:22px!important;background:#070709!important;box-shadow:0 20px 50px rgba(0,0,0,.46)!important;max-height:460px!important;}
      #contractorsProScreen table{width:100%!important;border-collapse:separate!important;border-spacing:0!important;min-width:720px!important;background:#070709!important;color:#fff!important;}
      #contractorsProScreen th{position:sticky!important;top:0!important;z-index:3!important;background:linear-gradient(180deg,#1d1d22,#09090b)!important;color:#e8c79a!important;text-align:left!important;padding:12px!important;border-bottom:1px solid rgba(230,198,154,.28)!important;font-size:12px!important;text-transform:uppercase!important;letter-spacing:.08em!important;}
      #contractorsProScreen td{padding:12px!important;border-bottom:1px solid rgba(230,198,154,.12)!important;background:#0a0a0c!important;color:#fff!important;vertical-align:middle!important;}
      #contractorsProScreen tr:nth-child(even) td{background:#101014!important;} #contractorsProScreen tr:hover td{background:#18181d!important;}
      #contractorsProScreen .note,#contractorsProScreen .empty{border:1px dashed rgba(230,198,154,.30)!important;border-radius:22px!important;padding:16px!important;color:#d9dbe2!important;background:rgba(255,255,255,.025)!important;}
      #contractorsProScreen .statusPaid{display:inline-flex!important;align-items:center!important;gap:6px!important;padding:7px 10px!important;border-radius:999px!important;background:rgba(115,226,155,.13)!important;border:1px solid rgba(115,226,155,.35)!important;color:#73e29b!important;font-weight:950!important;}
      #contractorsProScreen .statusOpen{display:inline-flex!important;align-items:center!important;gap:6px!important;padding:7px 10px!important;border-radius:999px!important;background:rgba(255,141,141,.10)!important;border:1px solid rgba(255,141,141,.28)!important;color:#ffb0b0!important;font-weight:950!important;}
      .vpcon-float{position:fixed!important;left:max(18px,env(safe-area-inset-left))!important;right:max(18px,env(safe-area-inset-right))!important;bottom:calc(18px + env(safe-area-inset-bottom))!important;z-index:999999!important;display:none;gap:10px!important;padding:10px!important;border-radius:28px!important;background:linear-gradient(180deg,rgba(28,28,31,.98),rgba(5,5,6,.98))!important;border:1px solid rgba(230,198,154,.38)!important;box-shadow:0 24px 60px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.07)!important;}
      .vpcon-float button{flex:1!important;min-height:50px!important;border-radius:20px!important;border:1px solid rgba(230,198,154,.22)!important;background:#121216!important;color:#fff!important;font-weight:950!important;font-size:15px!important;}

      /* V243 - Contractors financial status colors matched to Suppliers */
      #contractorsProScreen .kpis .kpi:nth-child(1) b{color:#64a8ff!important;} /* Contract / Orders blue */
      #contractorsProScreen .kpis .kpi:nth-child(2) b{color:#e8c79a!important;} /* Budget rose-gold */
      #contractorsProScreen .kpis .kpi:nth-child(3) b{color:#f5c15d!important;} /* Claimed / Invoiced yellow */
      #contractorsProScreen .kpis .kpi:nth-child(4) b{color:#73e29b!important;} /* Paid / Delivered green */
      #contractorsProScreen .kpis .kpi:nth-child(5) b{color:#ff8d8d!important;} /* Outstanding / Open red */
      #contractorsProScreen .kpis .kpi:nth-child(6) b{color:#ff6b6b!important;} /* Above Contract red */
      #contractorsProScreen .contractColor{color:#64a8ff!important;}
      #contractorsProScreen .retentionColor{color:#e8c79a!important;}
      #contractorsProScreen .claimedColor{color:#f5c15d!important;}
      #contractorsProScreen .paidColor{color:#73e29b!important;}
      #contractorsProScreen .outstandingColor,#contractorsProScreen .overColor{color:#ff8d8d!important;}
      #contractorsProScreen .proDash{margin:16px 0!important;padding:18px!important;border-radius:30px!important;background:linear-gradient(180deg,rgba(29,29,34,.98),rgba(7,7,9,.99))!important;border:1px solid rgba(230,198,154,.35)!important;box-shadow:0 22px 60px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.06)!important;}
      #contractorsProScreen .proDashTitle{font-size:26px!important;font-weight:950!important;margin:0 0 12px!important;color:#fff!important;}
      #contractorsProScreen .proDashGrid{display:grid!important;grid-template-columns:repeat(4,1fr)!important;gap:10px!important;}
      #contractorsProScreen .proTile{border-radius:22px!important;padding:15px!important;background:linear-gradient(180deg,rgba(22,22,26,.98),rgba(7,7,9,.99))!important;border:1px solid rgba(230,198,154,.25)!important;min-height:92px!important;}
      #contractorsProScreen .proTile span{display:block!important;color:#cfd2db!important;font-size:12px!important;font-weight:900!important;text-transform:uppercase!important;letter-spacing:.08em!important;}
      #contractorsProScreen .proTile b{display:block!important;margin-top:9px!important;font-size:21px!important;line-height:1.1!important;}
      #contractorsProScreen .barBox{margin-top:14px!important;}
      #contractorsProScreen .barLabel{display:flex!important;justify-content:space-between!important;color:#cfd2db!important;font-weight:900!important;margin-bottom:7px!important;}
      #contractorsProScreen .bar{height:12px!important;border-radius:99px!important;background:#24242a!important;overflow:hidden!important;border:1px solid rgba(255,255,255,.05)!important;}
      #contractorsProScreen .bar i{display:block!important;height:100%!important;border-radius:99px!important;background:linear-gradient(90deg,#64a8ff,#f5c15d,#51d87a)!important;}
      @media(max-width:860px){#contractorsProScreen .proDashGrid{grid-template-columns:repeat(2,1fr)!important;}}
      #contractorsProScreen .kpi b.red,#contractorsProScreen .mini b.red{color:#ff8d8d!important;}
      #contractorsProScreen .kpi b.green,#contractorsProScreen .mini b.green{color:#73e29b!important;}
      #contractorsProScreen .kpi,#contractorsProScreen .mini{background:linear-gradient(180deg,rgba(29,29,34,.98),rgba(7,7,9,.99))!important;}

      @media(max-width:920px){#contractorsProScreen .layout{grid-template-columns:1fr!important;}#contractorsProScreen .kpis{grid-template-columns:repeat(2,1fr)!important;}#contractorsProScreen .grid6,#contractorsProScreen .grid4,#contractorsProScreen .grid2,#contractorsProScreen .actions{grid-template-columns:1fr!important;}#contractorsProScreen h1{font-size:25px!important;}.vpcon-float{left:10px!important;right:10px!important}.vpcon-float button{font-size:14px!important;min-height:54px!important}}
    `;
    document.head.appendChild(s);
  }

  function ensure(){
    css();
    if(!q('contractorsProScreen')){
      const div = document.createElement('div');
      div.id = 'contractorsProScreen';
      const appScreen = q('appScreen') || document.body;
      appScreen.appendChild(div);
    }
    if(!q('vpConFloat')){
      const nav = document.createElement('div');
      nav.className = 'vpcon-float'; nav.id = 'vpConFloat';
      nav.innerHTML = '<button id="vpNavDash" onclick="showSuppliersDashboard()">Dashboard</button><button id="vpNavSup" onclick="showSuppliersDashboard()">Suppliers</button><button id="vpNavCon" onclick="showContractorsDashboard()">Contractors</button>';
      document.body.appendChild(nav);
    }
  }
  function logged(){
    const appScreen=q('appScreen'), login=q('loginScreen');
    return !!(appScreen && !appScreen.classList.contains('hidden') && (!login || login.classList.contains('hidden')));
  }
  function tick(){ ensure(); const n=q('vpConFloat'); if(n) n.style.display = logged() ? 'flex' : 'none'; }
  function setActive(where){ ['vpNavDash','vpNavSup','vpNavCon'].forEach(id=>{ const b=q(id); if(b) b.classList.remove('active'); }); const b=q(where==='con'?'vpNavCon':'vpNavSup'); if(b) b.classList.add('active'); }
  function showSuppliers(){ ensure(); const app=q('app'), con=q('contractorsProScreen'); if(app) app.style.display=''; if(con) con.style.display='none'; setActive('sup'); }
  function showContractors(){ ensure(); const app=q('app'), con=q('contractorsProScreen'); if(app) app.style.display='none'; if(con){ con.style.display='block'; render(); } setActive('con'); }

  function activeContractorOptions(data){
    const opts = ['<option value="">Select Contractor</option>'];
    (data||[]).forEach(c => opts.push(`<option value="${esc(c.id)}" ${c.id===activeId?'selected':''}>${esc(c.name)}${c.project ? ' · '+esc(c.project) : ''}</option>`));
    return opts.join('');
  }
  function contractorListOptions(){
    const existing = loadRaw();
    const supplierNames = getSupplierList();
    const names = new Set();
    (Array.isArray(existing)?existing:[]).forEach(c => c && c.name && names.add(String(c.name).trim()));
    supplierNames.forEach(n => n && names.add(String(n).trim()));
    const opts = ['<option value="">Choose from existing supplier list</option>'];
    [...names].filter(Boolean).sort((a,b)=>a.localeCompare(b)).forEach(n => opts.push(`<option value="${esc(n)}">${esc(n)}</option>`));
    return opts.join('');
  }
  function cards(data){
    if (!data.length) return '<div class="empty">No contractors yet. Choose a contractor from the existing supplier list and click Create/Open.</div>';
    return data.map(c=>{ const t=totals(c); const alert=t.overOriginalContract>0?`<div class="line"><span class="red">Above original contract</span><b class="red">${money(t.overOriginalContract)} · ${t.progress.toFixed(1)}%</b></div>`:''; return `<div class="card ${c.id===activeId?'active':''}" data-vpcard="${esc((c.name+' '+c.trade+' '+c.project).toLowerCase())}" onclick="vpConSelect('${c.id}')"><h3 style="margin:0 0 8px!important">${esc(c.name)}</h3><div class="line"><span>${esc(c.trade||'Sub Contractor')}</span><b>${money(c.contract)}</b></div><div class="line"><span>Approved Budget</span><b>${money(t.approvedBudget)}</b></div><div class="line"><span>Claimed</span><b>${money(t.claimed)}</b></div><div class="line"><span>Outstanding</span><b class="${t.outstanding>0?'red':'green'}">${money(t.outstanding)}</b></div>${alert}<div class="progress"><i style="width:${Math.min(100,t.budgetProgress)}%"></i></div></div>`; }).join('');
  }
  function accountRows(c){
    const rows = (c.accounts||[]).slice().sort((a,b)=>Number(a.no)-Number(b.no)).map(a=>{
      const pct=Number(a.retentionPercent ?? c.retention ?? 0);
      const ret=accountRetention(c,a);
      const net=accountNet(c,a);
      const paid=isAccountPaid(a);
      const status = paid ? `<span class="statusPaid">PAID ${a.paidDate ? '· '+esc(a.paidDate) : ''}</span>` : '<span class="statusOpen">OPEN</span>';
      const action = paid
        ? `<button class="btn danger small" onclick="vpConUndoAccountPayment('${c.id}','${a.id}')">Undo Paid</button>`
        : `<button class="btn gold small" onclick="vpConPayAccount('${c.id}','${a.id}')">Pay Account</button>`;
      return `<tr><td><b>#${esc(a.no)}</b></td><td>${esc(a.date)}</td><td>${money(a.claimed)}</td><td>${pct}%</td><td>${money(ret)}</td><td><b>${money(net)}</b></td><td>${status}</td><td>${esc(a.note||'')}${a.paymentNote?'<br><span class="muted">Payment: '+esc(a.paymentNote)+'</span>':''}</td><td>${action} <button class="btn danger small" onclick="vpConDeleteItem('${c.id}','accounts','${a.id}')">Delete</button></td></tr>`;
    }).join('');
    return rows || '<tr><td colspan="9" class="muted">No partial accounts yet</td></tr>';
  }
  function movementRows(c){
    const pack = [];
    (c.accounts||[]).filter(isAccountPaid).forEach(a=>pack.push({id:a.id, date:a.paidDate || a.date || today(), amount:accountNet(c,a), note:`Account #${a.no}${a.paymentNote ? ' - '+a.paymentNote : ''}`, type:'Payment'}));
    (c.variations||[]).forEach(x=>pack.push({...x,type:'Variation'}));
    (c.deductions||[]).forEach(x=>pack.push({...x,type:'Deduction'}));
    (c.retentionPayments||[]).forEach(x=>pack.push({...x,type:'Release Retention'}));
    pack.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    const rows = pack.map(x=>`<tr><td><b>${esc(x.type)}</b></td><td>${esc(x.date)}</td><td>${money(x.amount)}</td><td>${esc(x.note||'')}</td><td></td></tr>`).join('');
    return rows || '<tr><td colspan="5" class="muted">No movements yet</td></tr>';
  }
  function historyRows(c){
    const rows = (c.contractHistory||[]).slice().reverse().map(h=>`<tr><td>${esc(h.date||'')}</td><td>${money(h.oldValue)}</td><td>${money(h.newValue)}</td><td>${esc(h.note||'')}</td></tr>`).join('');
    return rows || '<tr><td colspan="4" class="muted">No contract changes yet</td></tr>';
  }
  function proDashboard(data, gt){
    const progress = gt.progress || 0;
    const paidRatio = gt.approvedBudget ? Math.max(0, Math.min(100, gt.paid / gt.approvedBudget * 100)) : 0;
    const riskClass = gt.overOriginalContract > 0 || gt.overApprovedBudget > 0 ? 'overColor' : 'paidColor';
    return `<div class="proDash"><div class="proDashTitle">PRO Dashboard</div>
      <div class="proDashGrid">
        <div class="proTile"><span>Total Contractors</span><b class="contractColor">${data.length}</b></div>
        <div class="proTile"><span>Approved Budget</span><b class="retentionColor">${money(gt.approvedBudget)}</b></div>
        <div class="proTile"><span>Total Claimed</span><b class="claimedColor">${money(gt.claimed)}</b></div>
        <div class="proTile"><span>Total Paid</span><b class="paidColor">${money(gt.paid)}</b></div>
        <div class="proTile"><span>Total Outstanding</span><b class="outstandingColor">${money(gt.outstanding)}</b></div>
        <div class="proTile"><span>Over Contract</span><b class="${riskClass}">${money(gt.overOriginalContract)}</b></div>
        <div class="proTile"><span>Retention Held</span><b class="retentionColor">${money(gt.retentionHeld)}</b></div>
        <div class="proTile"><span>Retention Balance</span><b class="retentionColor">${money(gt.retentionBalance)}</b></div>
        <div class="proTile"><span>Open Accounts</span><b class="outstandingColor">${gt.openAccounts}</b></div>
        <div class="proTile"><span>Paid Accounts</span><b class="paidColor">${gt.paidAccounts} / ${gt.totalAccounts}</b></div>
        <div class="proTile"><span>Available For Accounts</span><b class="retentionColor">${money(gt.availableForAccounts)}</b></div>
        <div class="proTile"><span>Budget Progress</span><b class="${gt.budgetProgress>100?'overColor':'contractColor'}">${gt.budgetProgress.toFixed(1)}%</b></div>
      </div>
      <div class="barBox"><div class="barLabel"><span>Progress vs Original Contract</span><span class="${progress>100?'overColor':'paidColor'}">${progress.toFixed(1)}%</span></div><div class="bar"><i style="width:${Math.min(100,progress).toFixed(1)}%"></i></div></div>
      <div class="barBox"><div class="barLabel"><span>Paid vs Approved Budget</span><span class="paidColor">${paidRatio.toFixed(1)}%</span></div><div class="bar"><i style="width:${paidRatio.toFixed(1)}%"></i></div></div>
    </div>`;
  }

  function detail(c){
    const t = totals(c);
    const nextNo = nextAccountNo(c);
    return `<div class="row"><div><h1 style="font-size:24px!important">${esc(c.name)}</h1><div class="sub">${esc(c.trade||'')} • ${esc(c.project||'')}</div></div><div class="row" style="justify-content:flex-start!important"><button class="btn" onclick="vpConPrint()">Generate Statement / PDF</button><button class="btn danger" onclick="vpConDeleteContractor('${c.id}')">Delete Contractor</button></div></div>
      <div class="grid6"><div class="mini"><span>Original Contract</span><b class="contractColor">${money(c.contract)}</b></div><div class="mini"><span>Variations / Additions</span><b class="retentionColor">${money(t.variationsTotal)}</b></div><div class="mini"><span>Approved Budget</span><b class="retentionColor">${money(t.approvedBudget)}</b></div><div class="mini"><span>Claimed</span><b class="claimedColor">${money(t.claimed)}</b></div><div class="mini"><span>Paid Total</span><b class="paidColor">${money(t.paid)}</b></div><div class="mini"><span>Outstanding</span><b class="outstandingColor">${money(t.outstanding)}</b></div></div>
      <div class="grid4"><div class="mini"><span>Progress vs Contract</span><b class="${t.progress>100?'overColor':'paidColor'}">${t.progress.toFixed(1)}%</b></div><div class="mini"><span>Progress vs Budget</span><b class="contractColor">${t.budgetProgress.toFixed(1)}%</b></div><div class="mini"><span>Above Original Contract</span><b class="${t.overOriginalContract>0?'overColor':'paidColor'}">${money(t.overOriginalContract)}</b></div><div class="mini"><span>Available For Accounts</span><b class="retentionColor">${money(t.availableForAccounts)}</b></div></div>
      <div class="grid4"><div class="mini"><span>Paid Accounts</span><b class="paidColor">${t.paidAccounts} / ${t.totalAccounts}</b></div><div class="mini"><span>Open Accounts</span><b class="outstandingColor">${t.openAccounts}</b></div><div class="mini"><span>Retention Held</span><b class="retentionColor">${money(t.retentionHeld)}</b></div><div class="mini"><span>Retention Balance</span><b class="retentionColor">${money(t.retentionBalance)}</b></div></div>
      ${t.overApprovedBudget>0?`<div class="note" style="border-color:rgba(255,80,80,.7)!important;background:rgba(255,0,0,.08)!important"><b class="red">WARNING:</b> Accounts are above approved budget by <b class="red">${money(t.overApprovedBudget)}</b>. Add Variation before additional accounts.</div>`:''}
      <div class="grid2">
        <div class="formBox"><h3>Edit Contract</h3><div class="muted">Contract changes are saved in history and update Outstanding immediately.</div><input id="contractEditValue" type="number" inputmode="decimal" placeholder="New contract value" value="${esc(c.contract)}"><input id="contractEditNote" placeholder="Change note"><button class="btn gold" onclick="vpConSaveContract('${c.id}')">Save Contract</button></div>
        <div class="formBox"><h3>Quick Actions</h3><div class="actions"><button class="btn gold" onclick="vpConFocus('accClaimed')">+ Account #${nextNo}</button><button class="btn" onclick="vpConFocus('accountsTableAnchor')">Pay From Account</button><button class="btn" onclick="vpConFocus('varAmount')">Variation</button><button class="btn" onclick="vpConFocus('dedAmount')">Deduction</button><button class="btn" onclick="vpConFocus('retAmount')">Release Retention</button></div><div class="muted">Account number is automatic. No Approved field.</div></div>
      </div>
      <div class="grid2">
        <div class="formBox"><h3>Partial Account</h3><div class="muted">Next account number: <b class="goldText">#${nextNo}</b> · Available before variation required: <b class="goldText">${money(t.availableForAccounts)}</b></div><input id="accClaimed" type="number" inputmode="decimal" placeholder="Claimed amount"><input id="accNote" placeholder="Note"><button class="btn gold" onclick="vpConAddAccount('${c.id}')">Add Account #${nextNo}</button><div class="muted" style="margin-top:8px!important">You cannot create an account above Contract + Variations. If there is an overrun, add a Variation first.</div></div>
        <div class="formBox"><h3>Payment Rule</h3><div class="note">Payment can only be made from an existing account. Click <b class="goldText">Pay Account</b> on the account row. The paid amount is taken automatically from that account net value; free payment entry is disabled.</div></div>
      </div>
      <div class="grid2">
        <div class="formBox"><h3>Variation / Addition</h3><input id="varAmount" type="number" inputmode="decimal" placeholder="Variation amount"><input id="varNote" placeholder="Note"><button class="btn gold" onclick="vpConAddVariation('${c.id}')">Add Variation</button></div>
        <div class="formBox"><h3>Deduction</h3><input id="dedAmount" type="number" inputmode="decimal" placeholder="Deduction amount"><input id="dedNote" placeholder="Note"><button class="btn gold" onclick="vpConAddDeduction('${c.id}')">Add Deduction</button></div>
      </div>
      <div class="formBox"><h3>Release / Pay Retention</h3><div class="muted">Available retention balance: <b class="goldText">${money(t.retentionBalance)}</b></div><input id="retAmount" type="number" inputmode="decimal" placeholder="Retention amount to release/pay"><input id="retNote" placeholder="Retention note"><button class="btn gold" onclick="vpConReleaseRetention('${c.id}')">Release Retention</button></div>
      <h3 id="accountsTableAnchor">Partial Accounts / Pay From Account</h3><div class="tableWrap"><table><thead><tr><th>Account</th><th>Date</th><th>Claimed</th><th>Retention %</th><th>Retention</th><th>Net Payable</th><th>Status</th><th>Note</th><th>Action</th></tr></thead><tbody>${accountRows(c)}</tbody></table></div>
      <h3>Movements</h3><div class="tableWrap"><table><thead><tr><th>Type</th><th>Date</th><th>Amount</th><th>Note</th><th></th></tr></thead><tbody>${movementRows(c)}</tbody></table></div>
      <h3>Contract History</h3><div class="tableWrap"><table><thead><tr><th>Date</th><th>Old</th><th>New</th><th>Note</th></tr></thead><tbody>${historyRows(c)}</tbody></table></div>`;
  }

  function render(){
    const data = load();
    if (!activeId || !data.find(x=>x.id===activeId)) activeId = data[0]?.id || null;
    const active = data.find(x=>x.id===activeId);
    const gt = grandTotals(data);
    const el = q('contractorsProScreen'); if(!el) return;
    el.innerHTML = `<div class="shell"><div class="hero"><div class="row"><div><h1>CONTRACTORS PRO V244</h1><div class="sub">Select contractor from existing list · Auto account numbers · Retention · PDF · Local saving</div></div><div class="row" style="justify-content:flex-start!important"><button class="btn gold" onclick="vpConQuickAdd()">+ Open Contractor</button><button class="btn" onclick="vpConPrint()">Statement PDF</button></div></div><div class="selectBar"><select id="vpActiveContractorSelect" onchange="vpConChooseExisting(this.value)">${activeContractorOptions(data)}</select><button class="btn gold" onclick="vpConQuickAdd()">New from List</button></div><div class="kpis"><div class="kpi"><span>Total Contracts</span><b class="contractColor">${money(gt.contract)}</b></div><div class="kpi"><span>Approved Budget</span><b class="retentionColor">${money(gt.approvedBudget)}</b></div><div class="kpi"><span>Claimed</span><b class="claimedColor">${money(gt.claimed)}</b></div><div class="kpi"><span>Paid</span><b class="paidColor">${money(gt.paid)}</b></div><div class="kpi"><span>Outstanding</span><b class="outstandingColor">${money(gt.outstanding)}</b></div><div class="kpi"><span>Above Contract</span><b class="${gt.overOriginalContract>0?'overColor':'paidColor'}">${money(gt.overOriginalContract)}</b></div></div></div>${proDashboard(data, gt)}
      <div class="layout"><div class="panel"><h2>Open Contractor from Existing List</h2><div class="formBox"><select id="newConNameSelect" onchange="vpConFillFromList(this.value)">${contractorListOptions()}</select><input id="newConName" list="vpExistingSuppliers" placeholder="Contractor name from existing list"><datalist id="vpExistingSuppliers">${getSupplierList().map(s=>`<option value="${esc(s)}"></option>`).join('')}</datalist><input id="newConTrade" placeholder="Trade / Category"><input id="newConProject" placeholder="Project"><input id="newConContract" type="number" inputmode="decimal" placeholder="Contract value"><input id="newConRetention" type="number" inputmode="decimal" placeholder="Retention %" value="5"><button class="btn gold" onclick="vpConCreateFromForm()">Create / Open Contractor</button></div><input placeholder="Search contractor" oninput="vpConFilter(this.value)"><div id="vpCards">${cards(data)}</div><div class="note">V244 PRO: Auto calculations dashboard. No Approved field. Accounts cannot exceed Contract + Variations. Overruns above the original contract are shown in red with progress percentages. All updates are saved in localStorage.</div></div><div class="panel">${active?detail(active):'<div class="empty"><h2>Ready to start</h2><div class="muted">Choose a contractor from the dropdown. After creating it, you can manage the contract, accounts, payments, retention, and PDF statement.</div></div>'}</div></div></div>`;
  }

  function updateContractor(id, mutator){
    const data = load();
    const c = data.find(x=>x.id===id);
    if(!c) return null;
    mutator(c);
    save(data);
    activeId = id;
    render();
    return c;
  }

  window.showContractorsDashboard = showContractors;
  window.showSuppliersDashboard = showSuppliers;
  window.vpConSelect = id => { activeId = id; render(); };
  window.vpConChooseExisting = id => { if(!id) return; activeId = id; render(); };
  window.vpConFilter = val => { const v=String(val||'').toLowerCase(); document.querySelectorAll('[data-vpcard]').forEach(e=>{ e.style.display = e.dataset.vpcard.includes(v) ? '' : 'none'; }); };
  window.vpConFillFromList = val => { const el=q('newConName'); if(el) el.value = val || ''; };
  window.vpConFocus = id => { const el=q(id); if(el){ el.focus(); el.scrollIntoView({behavior:'smooth',block:'center'}); } };
  window.vpConQuickAdd = () => { const el=q('newConNameSelect') || q('newConName'); if(el){ el.focus(); el.scrollIntoView({behavior:'smooth',block:'center'}); } };
  window.vpConCreateFromForm = () => {
    const selected = (q('newConNameSelect')?.value || '').trim();
    const typed = (q('newConName')?.value || '').trim();
    const name = selected || typed;
    if(!name){ alert('Choose contractor from the existing list'); return; }
    const data = load();
    const existing = data.find(c => String(c.name).trim().toLowerCase() === name.toLowerCase());
    if(existing){ activeId = existing.id; render(); return; }
    const c = { id:uid(), name, trade:(q('newConTrade')?.value||'Sub Contractor').trim(), project:(q('newConProject')?.value||'').trim(), contract:num(q('newConContract')?.value), retention:Number(q('newConRetention')?.value||5), accounts:[], payments:[], variations:[], deductions:[], retentionPayments:[], contractHistory:[] };
    data.unshift(c); save(data); activeId=c.id; render();
  };
  window.vpConSaveContract = id => updateContractor(id, c => {
    const oldValue = num(c.contract);
    const newValue = num(q('contractEditValue')?.value);
    const note = (q('contractEditNote')?.value || '').trim();
    c.contractHistory = c.contractHistory || [];
    if(oldValue !== newValue){ c.contractHistory.push({date:nowText(), oldValue, newValue, note}); }
    c.contract = newValue;
  });
  window.vpConAddAccount = id => updateContractor(id, c => {
    c.accounts = c.accounts || [];
    const amount = num(q('accClaimed')?.value);
    if(amount <= 0){ alert('Enter claimed amount'); return; }
    const t = totals(c);
    const projectedClaimed = t.claimed + amount;
    const allowedBudget = t.approvedBudget;
    if(allowedBudget <= 0){ alert('Set contract value before adding accounts'); return; }
    if(projectedClaimed > allowedBudget){
      const over = projectedClaimed - allowedBudget;
      alert('Cannot add this account. It is above Contract + Variations by ' + money(over) + '. Add a Variation first, then add the account.');
      return;
    }
    c.accounts.push({id:uid(), no:nextAccountNo(c), date:today(), claimed:amount, note:(q('accNote')?.value||'').trim(), retentionPercent:Number(c.retention || 5), status:'open', paidDate:'', paymentNote:''});
  });
  window.vpConPayAccount = (id, accountId) => updateContractor(id, c => {
    const a = (c.accounts || []).find(x => x.id === accountId);
    if(!a) return;
    if(isAccountPaid(a)){ alert('This account is already paid'); return; }
    const net = accountNet(c,a);
    if(net <= 0){ alert('Cannot pay an account with zero value'); return; }
    const ok = confirm(`Mark Account #${a.no} as PAID?\nPayment amount: ${money(net)}`);
    if(!ok) return;
    const note = prompt('Payment note / reference (optional)', a.paymentNote || '') || '';
    a.status = 'paid';
    a.paidDate = today();
    a.paymentNote = note.trim();
  });
  window.vpConUndoAccountPayment = (id, accountId) => updateContractor(id, c => {
    const a = (c.accounts || []).find(x => x.id === accountId);
    if(!a) return;
    if(!confirm(`Undo PAID status for Account #${a.no}?`)) return;
    a.status = 'open';
    a.paidDate = '';
    a.paymentNote = '';
  });
  window.vpConAddPayment = id => { alert('Payment is only allowed from an existing account. Open the Partial Accounts table and click Pay Account.'); };
  window.vpConAddVariation = id => updateContractor(id, c => {
    c.variations = c.variations || [];
    c.variations.push({id:uid(), date:today(), amount:num(q('varAmount')?.value), note:(q('varNote')?.value||'').trim()});
  });
  window.vpConAddDeduction = id => updateContractor(id, c => {
    c.deductions = c.deductions || [];
    c.deductions.push({id:uid(), date:today(), amount:num(q('dedAmount')?.value), note:(q('dedNote')?.value||'').trim()});
  });
  window.vpConReleaseRetention = id => updateContractor(id, c => {
    c.retentionPayments = c.retentionPayments || [];
    const amount = num(q('retAmount')?.value);
    const bal = totals(c).retentionBalance;
    if(amount <= 0){ alert('Enter retention amount'); return; }
    if(amount > bal){ alert('Cannot release more than retention balance: ' + money(bal)); return; }
    c.retentionPayments.push({id:uid(), date:today(), amount, note:(q('retNote')?.value||'Release retention').trim()});
  });
  window.vpConDeleteItem = (id,key,item) => updateContractor(id, c => { c[key]=(c[key]||[]).filter(x=>x.id!==item); });
  window.vpConDeleteContractor = id => { if(!confirm('Delete contractor?')) return; const data=load().filter(c=>c.id!==id); save(data); activeId=data[0]?.id||null; render(); };
  window.vpConPrint = () => {
    const c=load().find(x=>x.id===activeId); if(!c){ alert('Select contractor'); return; }
    const t=totals(c);
    const accountHtml = (c.accounts||[]).map(a=>{ const pct=Number(a.retentionPercent ?? c.retention ?? 0); const ret=num(a.claimed)*(pct/100); return `<tr><td>#${esc(a.no)}</td><td>${esc(a.date)}</td><td>${money(a.claimed)}</td><td>${pct}%</td><td>${money(ret)}</td><td>${money(num(a.claimed)-ret)}</td><td>${esc(a.note||'')}</td></tr>`; }).join('') || '<tr><td colspan="7">No accounts</td></tr>';
    const paymentsHtml = (c.accounts||[]).filter(isAccountPaid).map(a=>`<tr><td>${esc(a.paidDate || a.date)}</td><td>Account #${esc(a.no)}</td><td>${money(accountNet(c,a))}</td><td>${esc(a.paymentNote||'')}</td></tr>`).join('') || '<tr><td colspan="4">No paid accounts</td></tr>';
    const retentionHtml = (c.retentionPayments||[]).map(p=>`<tr><td>${esc(p.date)}</td><td>${money(p.amount)}</td><td>${esc(p.note||'')}</td></tr>`).join('') || '<tr><td colspan="3">No retention releases</td></tr>';
    const w=window.open('','_blank');
    w.document.write(`<html><head><title>Contractor Statement</title><style>body{font-family:Arial;padding:30px;color:#111}h1{letter-spacing:2px;margin:0}h2{margin-top:8px}table{width:100%;border-collapse:collapse;margin:18px 0}td,th{border:1px solid #ddd;padding:8px;text-align:left}th{background:#111;color:#fff}.sum{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.box{border:1px solid #ddd;padding:12px}.small{color:#666}</style></head><body><h1>VARDOPHASE</h1><h2>Contractor Statement</h2><p><b>${esc(c.name)}</b> - ${esc(c.trade||'')} ${c.project?' / '+esc(c.project):''}</p><p class="small">Generated: ${esc(nowText())}</p><div class="sum"><div class="box"><b>Original Contract</b><br>${money(c.contract)}</div><div class="box"><b>Variations</b><br>${money(t.variationsTotal)}</div><div class="box"><b>Approved Budget</b><br>${money(t.approvedBudget)}</div><div class="box"><b>Claimed</b><br>${money(t.claimed)}</div><div class="box"><b>Paid</b><br>${money(t.paid)}</div><div class="box"><b>Outstanding</b><br>${money(t.outstanding)}</div><div class="box"><b>Progress vs Contract</b><br>${t.progress.toFixed(1)}%</div><div class="box"><b>Above Original Contract</b><br><span style="color:${t.overOriginalContract>0?'#c00':'#080'};font-weight:bold">${money(t.overOriginalContract)}</span></div><div class="box"><b>Retention Balance</b><br>${money(t.retentionBalance)}</div></div><h3>Accounts</h3><table><tr><th>Account</th><th>Date</th><th>Claimed</th><th>Retention %</th><th>Retention</th><th>Net</th><th>Note</th></tr>${accountHtml}</table><h3>Payments From Accounts</h3><table><tr><th>Date</th><th>Account</th><th>Amount</th><th>Note</th></tr>${paymentsHtml}</table><h3>Retention Released / Paid</h3><table><tr><th>Date</th><th>Amount</th><th>Note</th></tr>${retentionHtml}</table></body></html>`);
    w.document.close(); w.focus(); setTimeout(()=>w.print(), 300);
  };

  setInterval(tick, 600);
  document.addEventListener('DOMContentLoaded', tick);
  window.addEventListener('load', tick);
})();
