
(function(){
  'use strict';
  const GL_CODES = [{"code": "2301", "description": "PRELIMINARIES AND GENERAL", "type": "Cost of Sales"}, {"code": "2301>001", "description": "Salaries", "type": "Cost of Sales"}, {"code": "2301>002", "description": "Insurance & Security", "type": "Cost of Sales"}, {"code": "2301>003", "description": "Site Establishment", "type": "Cost of Sales"}, {"code": "2301>004", "description": "Consulting Fees", "type": "Cost of Sales"}, {"code": "2301>005", "description": "Equipment Hire", "type": "Cost of Sales"}, {"code": "2301>006", "description": "Temporary Site Services", "type": "Cost of Sales"}, {"code": "2301>007", "description": "Safety Equipment & First Aid", "type": "Cost of Sales"}, {"code": "2301>008", "description": "Consumables", "type": "Cost of Sales"}, {"code": "2301>009", "description": "Cleaning & Rubble Removal", "type": "Cost of Sales"}, {"code": "2301>010", "description": "Scaffolding", "type": "Cost of Sales"}, {"code": "2301>011", "description": "Permits", "type": "Cost of Sales"}, {"code": "2302", "description": "EARTHWORKS", "type": "Cost of Sales"}, {"code": "2302>001", "description": "Earthworks - Sub- Contractor", "type": "Cost of Sales"}, {"code": "2302>002", "description": "Earthworks - Materials", "type": "Cost of Sales"}, {"code": "2302>003", "description": "Earthworks - Other", "type": "Cost of Sales"}, {"code": "2302>004", "description": "Sub Soill Drainage - Sub Contractor", "type": "Cost of Sales"}, {"code": "2302>005", "description": "Sub Soil Drainage - Materials", "type": "Cost of Sales"}, {"code": "2303", "description": "PILING", "type": "Cost of Sales"}, {"code": "2303>001", "description": "Piling - Sub- Contractor", "type": "Cost of Sales"}, {"code": "2303>002", "description": "Piling - Other", "type": "Cost of Sales"}, {"code": "2304", "description": "CONCRETE, FORMWORK & REINFORCEMENT", "type": "Cost of Sales"}, {"code": "2304>001", "description": "Concrete - Supply", "type": "Cost of Sales"}, {"code": "2304>002", "description": "Concrete- Plant", "type": "Cost of Sales"}, {"code": "2304>003", "description": "Concrete - Labour", "type": "Cost of Sales"}, {"code": "2304>004", "description": "Concrete - Sundries", "type": "Cost of Sales"}, {"code": "2304>005", "description": "Formwork - Supply", "type": "Cost of Sales"}, {"code": "2304>006", "description": "Formwork - Install", "type": "Cost of Sales"}, {"code": "2304>007", "description": "Movement Joints, Supply & Install", "type": "Cost of Sales"}, {"code": "2304>008", "description": "Reinforcing - Supply", "type": "Cost of Sales"}, {"code": "2304>009", "description": "Reinforcing - Labour", "type": "Cost of Sales"}, {"code": "2304>010", "description": "Concrete,Formwork & Reinforcement - Other", "type": "Cost of Sales"}, {"code": "2304>011", "description": "Post Tensioning Reinforcing", "type": "Cost of Sales"}, {"code": "2304>012", "description": "Structural Steel", "type": "Cost of Sales"}, {"code": "2304>013>01", "description": "Concrete - Guardhouse", "type": "Cost of Sales"}, {"code": "2304>013>02", "description": "Formwork - Guardhouse", "type": "Cost of Sales"}, {"code": "2304>013>03", "description": "Reinforcing - Guardhouse", "type": "Cost of Sales"}, {"code": "2305", "description": "PRECAST CONCRETE", "type": "Cost of Sales"}, {"code": "2305>001", "description": "Precast Concrete - Supply", "type": "Cost of Sales"}, {"code": "2305>002", "description": "Precast Concrete - Labour", "type": "Cost of Sales"}, {"code": "2305>003", "description": "Propping - Material", "type": "Cost of Sales"}, {"code": "2305>004", "description": "Precast Concrete - Other", "type": "Cost of Sales"}, {"code": "2306", "description": "MASONARY", "type": "Cost of Sales"}, {"code": "2306>001", "description": "Brick - Supply", "type": "Cost of Sales"}, {"code": "2306>002", "description": "Brick - Labour", "type": "Cost of Sales"}, {"code": "2306>003", "description": "Building Sand - Supply", "type": "Cost of Sales"}, {"code": "2306>004", "description": "Cement - Supply", "type": "Cost of Sales"}, {"code": "2306>005", "description": "Lintels - Supply & Install", "type": "Cost of Sales"}, {"code": "2306>006", "description": "Galvanized Hoop Iron Cramps, Ties- Supply& Install", "type": "Cost of Sales"}, {"code": "2306>007", "description": "Masonary - Other", "type": "Cost of Sales"}, {"code": "2306>008", "description": "Masonary - Guardhouse", "type": "Cost of Sales"}, {"code": "2307", "description": "WATERPROOFING", "type": "Cost of Sales"}, {"code": "2307>001", "description": "Waterproofing - Sub- Contractor", "type": "Cost of Sales"}, {"code": "2307>002", "description": "Waterproofing - Material", "type": "Cost of Sales"}, {"code": "2307>003", "description": "Waterproofing - Other", "type": "Cost of Sales"}, {"code": "2307>004", "description": "Waterproofing - Supply", "type": "Cost of Sales"}, {"code": "2308", "description": "ROOF COVERING", "type": "Cost of Sales"}, {"code": "2308>001", "description": "Roof Covering - Sub Contractor", "type": "Cost of Sales"}, {"code": "2309", "description": "CARPENTARY & JOINERY", "type": "Cost of Sales"}, {"code": "2309>001", "description": "Skirting - Supply & Install", "type": "Cost of Sales"}, {"code": "2309>002", "description": "Window Sills - Supply & Install", "type": "Cost of Sales"}, {"code": "2309>003", "description": "Door & Frames - Supply", "type": "Cost of Sales"}, {"code": "2309>004", "description": "Door & Frames - Install", "type": "Cost of Sales"}, {"code": "2309>005", "description": "Ducts", "type": "Cost of Sales"}, {"code": "2309>010", "description": "Carpentry - Other", "type": "Cost of Sales"}, {"code": "2310", "description": "CEILING", "type": "Cost of Sales"}, {"code": "2310>001", "description": "Ceiling - Sub- Contractor", "type": "Cost of Sales"}, {"code": "2310>002", "description": "Ceiling Materials", "type": "Cost of Sales"}, {"code": "2311", "description": "FLOOR COVERING", "type": "Cost of Sales"}, {"code": "2311>001", "description": "Floor Covering - Sub- Contractor", "type": "Cost of Sales"}, {"code": "2312", "description": "IRON MONGERY", "type": "Cost of Sales"}, {"code": "2312>001", "description": "Supply Door Handles Etc", "type": "Cost of Sales"}, {"code": "2312>002", "description": "Sub - Contractor", "type": "Cost of Sales"}, {"code": "2312>003", "description": "Ironmongery- Install", "type": "Cost of Sales"}, {"code": "2313", "description": "METALWORK", "type": "Cost of Sales"}, {"code": "2313>001", "description": "Balustrading - Supply & Install", "type": "Cost of Sales"}, {"code": "2313>002", "description": "Aluminum Window & Doors- Supply & Install", "type": "Cost of Sales"}, {"code": "2313>003", "description": "Shower Doors - Supply & Install", "type": "Cost of Sales"}, {"code": "2313>004", "description": "Metalwork Sundries", "type": "Cost of Sales"}, {"code": "2314", "description": "PLASTERING", "type": "Cost of Sales"}, {"code": "2314>001", "description": "Plaster - Labour", "type": "Cost of Sales"}, {"code": "2314>002", "description": "Screed - Labour", "type": "Cost of Sales"}, {"code": "2314>003", "description": "River Sand - Supply", "type": "Cost of Sales"}, {"code": "2314>004", "description": "Cement - Supply", "type": "Cost of Sales"}, {"code": "2314>005", "description": "Plaster Sand - Supply", "type": "Cost of Sales"}, {"code": "2314>006", "description": "Rhinolight - Supply", "type": "Cost of Sales"}, {"code": "2314>007", "description": "Plaster Key - Supply", "type": "Cost of Sales"}, {"code": "2314>008", "description": "Plastering - Other", "type": "Cost of Sales"}, {"code": "2315", "description": "TILING", "type": "Cost of Sales"}, {"code": "2315>001", "description": "Tiles - Supply", "type": "Cost of Sales"}, {"code": "2315>002", "description": "Adhesive - Supply", "type": "Cost of Sales"}, {"code": "2315>003", "description": "Grout - Supply", "type": "Cost of Sales"}, {"code": "2315>004", "description": "Edge Trim - Supply", "type": "Cost of Sales"}, {"code": "2315>005", "description": "Tiling - Labour - Install", "type": "Cost of Sales"}, {"code": "2315>006", "description": "Tiling - Other", "type": "Cost of Sales"}, {"code": "2316", "description": "PAINTWORK", "type": "Cost of Sales"}, {"code": "2316>001", "description": "Paintwork -Sub Contractor - Supply & Install", "type": "Cost of Sales"}, {"code": "2316>002", "description": "Paintwork - Other", "type": "Cost of Sales"}, {"code": "2316>003", "description": "Paintwork - Labour", "type": "Cost of Sales"}, {"code": "2317", "description": "PROVISIONAL SUMS", "type": "Cost of Sales"}, {"code": "2317>001", "description": "ELECTRICAL", "type": "Cost of Sales"}, {"code": "2317>001>01", "description": "Electrical - Sub Contractor", "type": "Cost of Sales"}, {"code": "2317>001>02", "description": "Electrical Fitting", "type": "Cost of Sales"}, {"code": "2317>001>03", "description": "Electrical - Other", "type": "Cost of Sales"}, {"code": "2317>002", "description": "EARTHING & LIGHTING PROTECTION", "type": "Cost of Sales"}, {"code": "2317>002>01", "description": "Earthing & Lighting Protection -Sub Contractor", "type": "Cost of Sales"}, {"code": "2317>002>02", "description": "Earthing & Lighting Protection -Material", "type": "Cost of Sales"}, {"code": "2317>002>03", "description": "Earthing & Lighting Protection -Other", "type": "Cost of Sales"}, {"code": "2317>003", "description": "DSTV & INTERNET", "type": "Cost of Sales"}, {"code": "2317>003>01", "description": "DSTV & Internet - Sub Contractor", "type": "Cost of Sales"}, {"code": "2317>003>02", "description": "DSTV & Internet - Material", "type": "Cost of Sales"}, {"code": "2317>003>03", "description": "DSTV & Internet -Other", "type": "Cost of Sales"}, {"code": "2317>004", "description": "ELECTRONIC & SECURITY", "type": "Cost of Sales"}, {"code": "2317>004>01", "description": "Electronic & Security - Sub Contractor", "type": "Cost of Sales"}, {"code": "2317>004>02", "description": "Electronic & Security - Material", "type": "Cost of Sales"}, {"code": "2317>004>03", "description": "Electronic & Security - Other", "type": "Cost of Sales"}, {"code": "2317>005", "description": "FIRE INSTALLATION", "type": "Cost of Sales"}, {"code": "2317>005>01", "description": "Fire Installation - Sub - Contractor", "type": "Cost of Sales"}, {"code": "2317>005>02", "description": "Fire Installation -Material", "type": "Cost of Sales"}, {"code": "2317>005>03", "description": "Fire Intallation - Other", "type": "Cost of Sales"}, {"code": "2317>006", "description": "GAS RETICULATION", "type": "Cost of Sales"}, {"code": "2317>006>01", "description": "Gas Reticulation -Sub Contractor", "type": "Cost of Sales"}, {"code": "2317>006>02", "description": "Gas Reticulation - Material", "type": "Cost of Sales"}, {"code": "2317>006>03", "description": "Gas Reticulation - Other", "type": "Cost of Sales"}, {"code": "2317>007", "description": "GAS GEYSERS", "type": "Cost of Sales"}, {"code": "2317>007>01", "description": "Gas Geysers - Material", "type": "Cost of Sales"}, {"code": "2317>007>02", "description": "Gas Geysers - Other", "type": "Cost of Sales"}, {"code": "2317>008", "description": "HVAC", "type": "Cost of Sales"}, {"code": "2317>008>01", "description": "HVAC - Sub Contractor", "type": "Cost of Sales"}, {"code": "2317>008>02", "description": "HVAC - Materials", "type": "Cost of Sales"}, {"code": "2317>008>03", "description": "HVAC - Other", "type": "Cost of Sales"}, {"code": "2317>009", "description": "LIFTS & HOISTS", "type": "Cost of Sales"}, {"code": "2317>009>01", "description": "Lifts & Hoists - Sub Contractor", "type": "Cost of Sales"}, {"code": "2317>009>02", "description": "Lifts & Hoists - Material", "type": "Cost of Sales"}, {"code": "2317>009>03", "description": "Lifts & Hoists - Other", "type": "Cost of Sales"}, {"code": "2317>010", "description": "LANDSCAPING", "type": "Cost of Sales"}, {"code": "2317>010>01", "description": "Landscaping - Sub Contractor", "type": "Cost of Sales"}, {"code": "2317>010>02", "description": "Landscaping - Material", "type": "Cost of Sales"}, {"code": "2317>010>03", "description": "Landscaping - Other", "type": "Cost of Sales"}, {"code": "2317>011", "description": "PLUMBING, DRAINING (INC SANITARY,BRASSWARE)", "type": "Cost of Sales"}, {"code": "2317>011>01", "description": "Plumbing & Drainage - Sub Contractor", "type": "Cost of Sales"}, {"code": "2317>011>02", "description": "Plumbing & Drainage - Material", "type": "Cost of Sales"}, {"code": "2317>011>03", "description": "Plumbing & Drainage - Other", "type": "Cost of Sales"}, {"code": "2317>012", "description": "SANITARY FITTING", "type": "Cost of Sales"}, {"code": "2317>012>01", "description": "Supply Sanitary Fitting & Bathroom Accesories", "type": "Cost of Sales"}, {"code": "2317>012>02", "description": "Sanitary Fitting - Other", "type": "Cost of Sales"}, {"code": "2317>013", "description": "RAINWATER", "type": "Cost of Sales"}, {"code": "2317>013>01", "description": "Rainwater - Sub Contractor", "type": "Cost of Sales"}, {"code": "2317>013>02", "description": "Rainwater - Material", "type": "Cost of Sales"}, {"code": "2317>013>03", "description": "Rainwater - Other", "type": "Cost of Sales"}, {"code": "2317>013>04", "description": "Rainwater- Gutters", "type": "Cost of Sales"}, {"code": "2317>014", "description": "SIGNAGE", "type": "Cost of Sales"}, {"code": "2317>014>01", "description": "Signage - Sub Contractor", "type": "Cost of Sales"}, {"code": "2317>014>02", "description": "Signage - Material", "type": "Cost of Sales"}, {"code": "2317>014>03", "description": "Signage - Other", "type": "Cost of Sales"}, {"code": "2317>015", "description": "KITCHENS,BIC , VANITIES", "type": "Cost of Sales"}, {"code": "2317>015>01", "description": "Kitchen, BIC & Vanities - Sub Contractor", "type": "Cost of Sales"}, {"code": "2317>015>02", "description": "Kitchen,BIB & Vanities -Material", "type": "Cost of Sales"}, {"code": "2317>015>03", "description": "Kitchen, BIC & Vanities- Other", "type": "Cost of Sales"}, {"code": "2317>016", "description": "STONEWORK", "type": "Cost of Sales"}, {"code": "2317>016>01", "description": "Stonework- Sub Contractor", "type": "Cost of Sales"}, {"code": "2317>016>02", "description": "Stoneworks - Material", "type": "Cost of Sales"}, {"code": "2317>016>03", "description": "Stoneworks - Other", "type": "Cost of Sales"}, {"code": "2317>017", "description": "MIRRORS", "type": "Cost of Sales"}, {"code": "2317>017>01", "description": "Mirrors - Sub Contractors", "type": "Cost of Sales"}, {"code": "2317>017>02", "description": "Mirrors - Material", "type": "Cost of Sales"}, {"code": "2317>017>03", "description": "Mirrors - Other", "type": "Cost of Sales"}, {"code": "2317>018", "description": "APPLIANCES", "type": "Cost of Sales"}, {"code": "2317>018>01", "description": "Appliances - Sub Contractor", "type": "Cost of Sales"}, {"code": "2317>018>02", "description": "Appliances - Material", "type": "Cost of Sales"}, {"code": "2317>018>03", "description": "Appliances - Other", "type": "Cost of Sales"}, {"code": "2317>019", "description": "SUNDRY METAL WORK", "type": "Cost of Sales"}, {"code": "2317>019>01", "description": "Sundry Metal Work - Sub Contractor", "type": "Cost of Sales"}, {"code": "2317>019>02", "description": "Sundry Metal Work - Material", "type": "Cost of Sales"}, {"code": "2317>019>03", "description": "Sundry Metal Work - Other", "type": "Cost of Sales"}, {"code": "2317>020", "description": "BLINDS & FITTINGS", "type": "Cost of Sales"}, {"code": "2317>020>01", "description": "Blinds & Fittings- Sub Contractor", "type": "Cost of Sales"}, {"code": "2317>020>02", "description": "Blinds & Fittings- Materials", "type": "Cost of Sales"}, {"code": "2318", "description": "EXTERNAL WORKS", "type": "Cost of Sales"}, {"code": "2318>001", "description": "ROAD WORKS", "type": "Cost of Sales"}, {"code": "2318>001>01", "description": "Road Works - Sub Contractor", "type": "Cost of Sales"}, {"code": "2318>001>02", "description": "Road Works - Material", "type": "Cost of Sales"}, {"code": "2318>001>03", "description": "Road Works - Other", "type": "Cost of Sales"}, {"code": "2318>002", "description": "RETAINING WALLS", "type": "Cost of Sales"}, {"code": "2318>002>01", "description": "Retaining Walls Sub Contractor", "type": "Cost of Sales"}, {"code": "2318>002>02", "description": "Retaining Walls Material", "type": "Cost of Sales"}, {"code": "2318>002>03", "description": "Retaining Walls Other", "type": "Cost of Sales"}, {"code": "2319", "description": "CARPORTS", "type": "Cost of Sales"}, {"code": "2319>001", "description": "Carports - Sub Contarctor", "type": "Cost of Sales"}, {"code": "2320", "description": "YARD WALLS", "type": "Cost of Sales"}, {"code": "2320>001", "description": "Yard Walls- Sub Contractor", "type": "Cost of Sales"}, {"code": "2320>002", "description": "Yard -Other", "type": "Cost of Sales"}, {"code": "2322", "description": "BOUNDARY WALLS", "type": "Cost of Sales"}, {"code": "2322>001", "description": "Boundary Walls- Sub Contractor", "type": "Cost of Sales"}, {"code": "2322>002", "description": "Boundary Walls- Materials", "type": "Cost of Sales"}, {"code": "2322>003", "description": "Boundary Walls- Other", "type": "Cost of Sales"}, {"code": "2323", "description": "POOL AREA", "type": "Cost of Sales"}, {"code": "2323>001", "description": "Pool Area - Sub Contractor", "type": "Cost of Sales"}, {"code": "2324", "description": "WALL CLADDING", "type": "Cost of Sales"}, {"code": "2324>001", "description": "Wall Cladding - Sub Contractor", "type": "Cost of Sales"}, {"code": "2324>002", "description": "Wall Cladding - Other", "type": "Cost of Sales"}, {"code": "2400", "description": "DEVELOPMENT COST & OVERHEADS", "type": "Cost of Sales"}, {"code": "2400>010-0003", "description": "Development  overheads office MVE (Giovanni)", "type": "Cost of Sales"}, {"code": "2400>010-0008", "description": "Development overheads Travel and accomodation (Giovanni)", "type": "Cost of Sales"}, {"code": "3375", "description": "O'Two Boutique - Retail Area Project", "type": "Cost of Sales"}, {"code": "3380", "description": "O'Two - Repairs and Maintenance", "type": "Other Expense"}, {"code": "3385", "description": "O'Two Boutique - Executive Lounge Project", "type": "Cost of Sales"}, {"code": "3390", "description": "O'Two Boutique - Rooftop Project", "type": "Cost of Sales"}, {"code": "3391", "description": "O'Two Boutique - Penthouse Project", "type": "Cost of Sales"}, {"code": "3392", "description": "O'Two Boutique - Room Project", "type": "Cost of Sales"}, {"code": "3393", "description": "O'Two Boutique - Renovations to Basement", "type": "Cost of Sales"}, {"code": "3395", "description": "O'Two Boutique - Boardroom Project (Basement)", "type": "Cost of Sales"}];
  window.VARDOPHASE_GL_CODES = GL_CODES;
  const MARK_START = '[[V309_ORDER_ITEMS_JSON:';
  const MARK_END = ']]';
  function $(id){ return document.getElementById(id); }
  function num(v){ const n = Number(String(v ?? '').replace(/,/g,'')); return Number.isFinite(n) ? n : 0; }
  function money(n){ return (Math.round(num(n)*100)/100).toFixed(2); }
  function esc(s){ return String(s ?? '').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function encodeItems(items){ try { return btoa(unescape(encodeURIComponent(JSON.stringify(items || [])))); } catch(e){ return ''; } }
  function decodeItems(raw){ try { return JSON.parse(decodeURIComponent(escape(atob(raw || '')))); } catch(e){ return []; } }
  function unpackNotes(notes){
    const text = String(notes || '');
    const a = text.indexOf(MARK_START);
    if(a < 0) return { clean:text, items:[] };
    const b = text.indexOf(MARK_END, a + MARK_START.length);
    if(b < 0) return { clean:text, items:[] };
    const encoded = text.slice(a + MARK_START.length, b);
    const clean = (text.slice(0,a) + text.slice(b + MARK_END.length)).trim();
    return { clean, items: decodeItems(encoded) };
  }
  function packNotes(notes, items){
    const clean = unpackNotes(notes).clean.trim();
    const valid = (items || []).filter(x => (x.item || x.glCode || x.manualGL || x.description || x.manualDescription || num(x.qty) || num(x.price)));
    if(!valid.length) return clean;
    return (clean ? clean + '\n' : '') + MARK_START + encodeItems(valid) + MARK_END;
  }
  function glDescription(code){
    const found = GL_CODES.find(g => String(g.code) === String(code));
    return found ? found.description : '';
  }
  function defaultItem(){ return { item:'', glCode:'', description:'', manualGL:'', manualDescription:'', qty:1, price:'', discount:'', total:0 }; }
  function getVatRate(){
    try { if(typeof window.getVatRate === 'function') return Number(window.getVatRate()) || 15; } catch(e){}
    return 15;
  }
  function supplierNotRegistered(){
    try{
      const supplier = String($('entrySupplier')?.value || '').trim();
      if(supplier && typeof window.getSupplierVatType === 'function') return window.getSupplierVatType(supplier) === 'not_registered';
    }catch(e){}
    return false;
  }
  function calcTotals(items){
    let net = 0;
    (items || []).forEach(x => {
      const line = Math.max(0, num(x.qty) * num(x.price) - num(x.discount));
      x.total = Math.round(line * 100) / 100;
      net += x.total;
    });
    net = Math.round(net * 100) / 100;
    const vat = supplierNotRegistered() ? 0 : Math.round(net * getVatRate()) / 100;
    const total = Math.round((net + vat) * 100) / 100;
    return { net, vat, total };
  }
  function currentItems(){
    return Array.from(document.querySelectorAll('#v309OrderItemsBody tr')).map(tr => ({
      item: tr.querySelector('[data-field="item"]')?.value || '',
      glCode: tr.querySelector('[data-field="glCode"]')?.value || '',
      description: tr.querySelector('[data-field="description"]')?.value || '',
      manualGL: '',
      manualDescription: tr.querySelector('[data-field="manualDescription"]')?.value || '',
      qty: tr.querySelector('[data-field="qty"]')?.value || '',
      price: tr.querySelector('[data-field="price"]')?.value || '',
      discount: tr.querySelector('[data-field="discount"]')?.value || '',
      total: tr.querySelector('[data-field="total"]')?.value || ''
    }));
  }
  function setMainAmountsFromItems(){
    const items = currentItems();
    const t = calcTotals(items);
    const netEl = $('entryNetAmount'), vatEl = $('entryVatAmount'), totalEl = $('entryTotal');
    if(netEl) netEl.value = money(t.net);
    if(vatEl) vatEl.value = money(t.vat);
    if(totalEl) totalEl.value = money(t.total);
    const descEl = $('entryDescription');
    if(descEl && !String(descEl.value || '').trim()){
      const first = items.find(x => x.item || x.description || x.manualDescription);
      if(first) descEl.value = first.item || first.manualDescription || first.description || '';
    }
  }
  function getGlSearchFilter(){
    const el = document.getElementById('v322GlSearch');
    return (el && el.value ? String(el.value).toLowerCase().trim() : '');
  }
  function glOptions(selected, filter){
    let out = '<option value="">Select GL Code</option>';
    const f = (filter || '').toLowerCase().trim();
    GL_CODES.forEach(g => {
      if(f && !(String(g.code||'').toLowerCase().includes(f) || String(g.description||'').toLowerCase().includes(f))) return;
      const label = (g.code + ' - ' + g.description).trim();
      out += '<option value="'+esc(g.code)+'" '+(String(selected)===String(g.code)?'selected':'')+'>'+esc(label)+'</option>';
    });
    return out;
  }
  function renderRows(items){
    const body = $('v309OrderItemsBody');
    if(!body) return;
    const arr = (items && items.length) ? items : [defaultItem()];
    body.innerHTML = arr.map((x,i) => {
      const total = Math.max(0, num(x.qty) * num(x.price) - num(x.discount));
      const desc = x.description || glDescription(x.glCode);
      return '<tr>'+
        '<td><input class="dark" data-field="item" value="'+esc(x.item)+'" placeholder="Item"></td>'+
        '<td><input class="dark" data-field="manualDescription" value="'+esc(x.manualDescription)+'" placeholder="Manual description"></td>'+
        '<td><select class="dark" data-field="glCode">'+glOptions(x.glCode, getGlSearchFilter())+'</select></td>'+
        '<td><input class="dark" data-field="description" value="'+esc(desc)+'" placeholder="Auto description"></td>'+
        '<td><input class="dark" data-field="codeDisplay" value="'+esc(x.glCode || '')+'" placeholder="Code" readonly></td>'+
        '<td><input class="dark" data-field="qty" type="number" step="0.01" value="'+esc(x.qty || 1)+'"></td>'+
        '<td><input class="dark" data-field="price" type="number" step="0.01" value="'+esc(x.price)+'"></td>'+
        '<td><input class="dark" data-field="discount" type="number" step="0.01" value="'+esc(x.discount)+'"></td>'+
        '<td><input class="dark" data-field="total" type="number" step="0.01" value="'+money(total)+'" readonly></td>'+
        '<td><button type="button" class="red" data-remove-row="1">×</button></td>'+
      '</tr>';
    }).join('');
    bindTableEvents();
    recalcVisibleTotals();
  }
  function recalcVisibleTotals(){
    document.querySelectorAll('#v309OrderItemsBody tr').forEach(tr => {
      const qty = tr.querySelector('[data-field="qty"]')?.value;
      const price = tr.querySelector('[data-field="price"]')?.value;
      const discount = tr.querySelector('[data-field="discount"]')?.value;
      const totalEl = tr.querySelector('[data-field="total"]');
      if(totalEl) totalEl.value = money(Math.max(0, num(qty) * num(price) - num(discount)));
    });
    setMainAmountsFromItems();
  }
  function refreshGlDropdowns(){
    const filter = getGlSearchFilter();
    document.querySelectorAll('#v309OrderItemsBody select[data-field="glCode"]').forEach(sel => {
      const val = sel.value || '';
      sel.innerHTML = glOptions(val, filter);
      sel.value = val;
    });
  }
  function bindTableEvents(){
    const body = $('v309OrderItemsBody');
    if(!body || body.dataset.bound === '1') return;
    body.dataset.bound = '1';
    body.addEventListener('input', function(e){
      if(e.target && e.target.matches('[data-field]')) recalcVisibleTotals();
    });
    body.addEventListener('change', function(e){
      if(e.target && e.target.matches('[data-field="glCode"]')){
        const tr = e.target.closest('tr');
        const descEl = tr?.querySelector('[data-field="description"]');
        const codeEl = tr?.querySelector('[data-field="codeDisplay"]');
        if(descEl) descEl.value = glDescription(e.target.value);
        if(codeEl) codeEl.value = e.target.value || '';
      }
      recalcVisibleTotals();
    });
    body.addEventListener('click', function(e){
      if(e.target && e.target.matches('[data-remove-row]')){
        const rows = body.querySelectorAll('tr');
        if(rows.length <= 1){ renderRows([defaultItem()]); return; }
        e.target.closest('tr')?.remove();
        recalcVisibleTotals();
      }
    });
  }

  function getTargetGlSelect(){
    return document.querySelector('#v309OrderItemsBody tr:last-child select[data-field="glCode"]') || document.querySelector('#v309OrderItemsBody select[data-field="glCode"]');
  }
  function applyGlToCurrentRow(code){
    const sel = getTargetGlSelect();
    if(!sel || !code) return;
    const found = GL_CODES.find(g => String(g.code||'') === String(code));
    if(found && !Array.from(sel.options).some(o => o.value === String(code))){
      const opt = document.createElement('option');
      opt.value = found.code;
      opt.textContent = found.code + ' - ' + found.description;
      sel.appendChild(opt);
    }
    sel.value = code;
    sel.dispatchEvent(new Event('change',{bubbles:true}));
    const search = $('v322GlSearch');
    const results = $('v322GlResults');
    if(search) search.value = '';
    if(results) results.innerHTML = '';
    refreshGlDropdowns();
  }
  function renderGlSearchResults(){
    const results = $('v322GlResults');
    if(!results) return;
    const q = getGlSearchFilter();
    if(!q){ results.innerHTML = ''; return; }
    const matches = GL_CODES.filter(g => (String(g.code||'') + ' ' + String(g.description||'')).toLowerCase().includes(q)).slice(0, 8);
    if(!matches.length){ results.innerHTML = '<div class="v322-gl-empty">No GL match</div>'; return; }
    results.innerHTML = matches.map(g => '<button type="button" class="v322-gl-result" data-gl-code="'+esc(g.code)+'"><span>'+esc(g.code)+'</span><em>'+esc(g.description)+'</em></button>').join('');
  }
  function mountTable(){
    if($('v309OrderItemsBox')) return;
    const descLabel = $('entryDescription')?.closest('label');
    if(!descLabel || !$('entryModal')) return;
    const box = document.createElement('div');
    box.id = 'v309OrderItemsBox';
    box.className = 'full v309-order-items-box';
    box.innerHTML = '<div class="v309-title-row"><span>Order Items / GL Allocation</span><button type="button" class="primary" id="v309AddItemRow">+ Add Item</button></div>'+
      '<div class="v322-gl-search-wrap"><input id="v322GlSearch" class="dark v322-gl-search" type="search" placeholder="Search GL or description..." autocomplete="off"><div id="v322GlResults" class="v322-gl-results"></div></div>'+
      '<div class="v309-scroll"><table class="v309-items-table"><thead><tr><th>Item</th><th>Manual Description</th><th>Select GL Code</th><th>Description</th><th>Code</th><th>Qty</th><th>Price</th><th>Discount</th><th>Total</th><th></th></tr></thead><tbody id="v309OrderItemsBody"></tbody></table></div>'+
      '<div class="helper">Select GL Code to autofill Description and Code. Manual Description stays editable. Qty can be saved without price.</div>';
    descLabel.insertAdjacentElement('afterend', box);
    $('v309AddItemRow')?.addEventListener('click', function(){ renderRows(currentItems().concat([defaultItem()])); });
    const glSearch = $('v322GlSearch');
    if(glSearch && glSearch.dataset.bound !== '1'){
      glSearch.dataset.bound = '1';
      glSearch.addEventListener('input', function(){ refreshGlDropdowns(); renderGlSearchResults(); });
      glSearch.addEventListener('keydown', function(e){
        if(e.key === 'Enter'){
          e.preventDefault();
          const filter = getGlSearchFilter();
          if(!filter) return;
          const first = GL_CODES.find(g => String(g.code||'').toLowerCase().includes(filter) || String(g.description||'').toLowerCase().includes(filter));
          if(first){ applyGlToCurrentRow(first.code); }
        }
      });
      glSearch.addEventListener('blur', function(){ setTimeout(function(){ const r=$('v322GlResults'); if(r) r.innerHTML=''; }, 180); });
    }
    const glResults = $('v322GlResults');
    if(glResults && glResults.dataset.bound !== '1'){
      glResults.dataset.bound = '1';
      glResults.addEventListener('mousedown', function(e){
        const btn = e.target.closest('[data-gl-code]');
        if(btn){ e.preventDefault(); applyGlToCurrentRow(btn.getAttribute('data-gl-code')); }
      });
    }
    renderRows(window.__v309PendingItems || [defaultItem()]);
  }
  function injectStyle(){
    if($('v309OrderItemsStyle')) return;
    const st = document.createElement('style');
    st.id = 'v309OrderItemsStyle';
    st.textContent = '.v309-order-items-box{grid-column:1/-1;margin:6px 0 10px 0}.v309-title-row{display:flex;justify-content:space-between;align-items:center;margin:8px 0 10px;font-weight:700}.v309-title-row .primary{min-width:110px}.v309-scroll{overflow-x:auto;overflow-y:hidden;border:1px solid rgba(218,178,122,.22);border-radius:18px;background:rgba(0,0,0,.16);max-width:100%}.v309-items-table{min-width:1180px;width:100%;border-collapse:separate;border-spacing:0;table-layout:fixed}.v309-items-table th{font-size:12px;text-align:left;padding:9px;color:#d9b27a;white-space:nowrap}.v309-items-table td{padding:5px}.v309-items-table input,.v309-items-table select{min-height:38px;font-size:13px;width:100%;box-sizing:border-box}.v309-items-table button{min-height:38px;padding:0 12px}.v309-items-table th:nth-child(1),.v309-items-table td:nth-child(1){width:74px}.v309-items-table th:nth-child(2),.v309-items-table td:nth-child(2){width:190px}.v309-items-table th:nth-child(3),.v309-items-table td:nth-child(3){width:220px}.v309-items-table th:nth-child(4),.v309-items-table td:nth-child(4){width:190px}.v309-items-table th:nth-child(5),.v309-items-table td:nth-child(5){width:150px}.v309-items-table th:nth-child(6),.v309-items-table td:nth-child(6),.v309-items-table th:nth-child(7),.v309-items-table td:nth-child(7),.v309-items-table th:nth-child(8),.v309-items-table td:nth-child(8),.v309-items-table th:nth-child(9),.v309-items-table td:nth-child(9){width:95px}.v309-items-table th:last-child,.v309-items-table td:last-child{width:48px}.v309-items-table [data-field="codeDisplay"],.v309-items-table [data-field="total"]{opacity:.9}'+
      '.v309-items-table input[type=number]{-webkit-appearance:textfield!important;appearance:textfield!important;text-align:center;padding-right:10px!important;line-height:38px!important}'+
      '.v309-items-table input[type=number]::-webkit-outer-spin-button,.v309-items-table input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none!important;margin:0!important;display:none!important}'+
      '.v309-items-table [data-field="qty"],.v309-items-table [data-field="price"],.v309-items-table [data-field="discount"],.v309-items-table [data-field="total"]{font-weight:700;text-align:center!important}'+
      '.v309-items-table input,.v309-items-table select{border-radius:14px!important;border:1px solid rgba(255,255,255,.22)!important;background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.02))!important}'+
      '.v322-gl-search-wrap{margin:0 0 8px 0;max-width:360px}.v322-gl-search{min-height:34px!important;width:100%;font-size:13px!important;border-radius:14px!important;opacity:.82;background:rgba(255,255,255,.035)!important;border:1px solid rgba(255,255,255,.16)!important;padding:0 14px!important}.v322-gl-search:focus{opacity:1;border-color:rgba(218,178,122,.35)!important;outline:none!important}.v322-gl-search-wrap{position:relative}.v322-gl-results{position:absolute;left:0;right:0;top:40px;z-index:9999;background:rgba(14,16,22,.98);border:1px solid rgba(218,178,122,.22);border-radius:14px;box-shadow:0 12px 28px rgba(0,0,0,.35);overflow:hidden}.v322-gl-result{display:flex!important;gap:10px;align-items:center;width:100%;min-height:36px!important;padding:7px 12px!important;border:0!important;border-bottom:1px solid rgba(255,255,255,.06)!important;background:transparent!important;color:#fff!important;text-align:left!important;border-radius:0!important}.v322-gl-result:hover{background:rgba(218,178,122,.10)!important}.v322-gl-result span{font-weight:800;color:#d9b27a;min-width:82px}.v322-gl-result em{font-style:normal;font-size:12px;opacity:.88;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v322-gl-empty{padding:9px 12px;font-size:12px;opacity:.75}'+
      '.v309-items-table td:nth-child(6),.v309-items-table td:nth-child(7),.v309-items-table td:nth-child(8),.v309-items-table td:nth-child(9){padding-left:7px;padding-right:7px}'+
      '.v309-items-table th:nth-child(6),.v309-items-table td:nth-child(6){width:86px}.v309-items-table th:nth-child(7),.v309-items-table td:nth-child(7),.v309-items-table th:nth-child(8),.v309-items-table td:nth-child(8),.v309-items-table th:nth-child(9),.v309-items-table td:nth-child(9){width:100px}';
    document.head.appendChild(st);
  }
  function refreshTable(items){
    injectStyle();
    mountTable();
    renderRows(items && items.length ? items : [defaultItem()]);
  }
  async function loadItemsForId(id){
    if(!id || !window.supabase) return [];
    try{
      const res = await window.supabase.from('suppliers').select('notes, order_no').eq('id', id).single();
      if(res && res.data){
        const items = unpackNotes(res.data.notes).items;
        if(items && items.length) return items;
        try{
          const key = 'v311_order_items_' + String(res.data.order_no || id);
          const saved = JSON.parse(localStorage.getItem(key) || '[]');
          if(saved && saved.length) return saved;
        }catch(e){}
      }
    }catch(e){ console.warn('V311 items load failed', e); }
    return [];
  }
  function stripMarkerFromNotesField(){
    const el = $('entryNotes');
    if(el) el.value = unpackNotes(el.value).clean;
  }
  function install(){
    if(window.__v309OrderItemsInstalled) return;
    if(typeof window.openEntryModal !== 'function' || typeof window.saveEntry !== 'function') return;
    window.__v309OrderItemsInstalled = true;
    const oldOpen = window.openEntryModal;
    window.openEntryModal = async function(id, forcedMode){
      const result = await oldOpen.apply(this, arguments);
      let items = [];
      // IMPORTANT: the original app keeps Supabase inside a module scope, so an external script
      // cannot reliably read window.supabase. The stable source after oldOpen is the value
      // already loaded into entryNotes. This is what fixes rows disappearing on second open.
      try {
        const notesEl = $('entryNotes');
        items = unpackNotes(notesEl ? notesEl.value : '').items || [];
      } catch(e) { items = []; }
      if((!items || !items.length) && id) items = await loadItemsForId(id);
      window.__v309PendingItems = items && items.length ? items : [defaultItem()];
      stripMarkerFromNotesField();
      refreshTable(window.__v309PendingItems);
      return result;
    };
    ['openOrderModal','openInvoiceModal','openDepositModal'].forEach(name => {
      if(typeof window[name] === 'function'){
        const old = window[name];
        window[name] = async function(){
          const result = await old.apply(this, arguments);
          window.__v309PendingItems = [defaultItem()];
          stripMarkerFromNotesField();
          refreshTable(window.__v309PendingItems);
          return result;
        };
      }
    });
    const oldSave = window.saveEntry;
    window.saveEntry = async function(){
      if($('v309OrderItemsBody')){
        recalcVisibleTotals();
        const notesEl = $('entryNotes');
        if(notesEl) notesEl.value = packNotes(notesEl.value, currentItems());
        try{
          const key = 'v311_order_items_' + String(document.getElementById('entryOrderNo')?.value || 'draft');
          localStorage.setItem(key, JSON.stringify(currentItems()));
        }catch(e){}
      }
      return await oldSave.apply(this, arguments);
    };
    setInterval(function(){ if($('entryModal')?.classList.contains('show')) mountTable(); }, 500);
  }
  const timer = setInterval(function(){ install(); if(window.__v309OrderItemsInstalled) clearInterval(timer); }, 200);
})();
