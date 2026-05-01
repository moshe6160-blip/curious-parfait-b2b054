/* V283 - VARDOPHASE unified print template
   Safe module: no login changes, no DB changes, no report logic changes.
   Usage for future reports:
   window.VardophasePrintTemplate.open({
     type:'MONTHLY REPORT', documentNo:'APR-2026', period:'Apr 2026',
     meta:[{label:'SUPPLIER', value:'Buco'}, {label:'DATE', value:'2026-04-30'}],
     rows:[{Description:'...', Amount:'R 1 000,00'}],
     totals:[{label:'TOTAL', value:'R 1 000,00'}]
   });
*/
(function(){
  if (window.VardophasePrintTemplate) return;

  var GOLD = '#b88738';
  var GOLD_SOFT = '#eadcc1';
  var TEXT = '#111111';
  var MUTED = '#6f5a33';
  var BORDER = '#d8bf8f';

  function esc(v){
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function css(){
    return '<style>'+
      '@page{size:A4;margin:12mm;}'+
      'html,body{margin:0;background:#fff;color:'+TEXT+';font-family:Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;}'+
      '.vp-page{max-width:920px;margin:0 auto;background:#fff;border:2px solid '+BORDER+';padding:42px 52px 46px;box-sizing:border-box;min-height:100vh;}'+
      '.vp-back{display:inline-block;border:1.5px solid '+BORDER+';border-radius:16px;padding:12px 22px;font-weight:800;background:#fff;color:#111;margin-bottom:12px;text-decoration:none;}'+
      '@media print{.vp-back{display:none}.vp-page{border:none;padding:0;max-width:none;min-height:auto}}'+
      '.vp-brand{font-size:48px;letter-spacing:9px;font-weight:900;line-height:1;margin:0 0 18px;}'+
      '.vp-subtitle{color:'+MUTED+';font-size:22px;line-height:1.35;margin-bottom:42px;}'+
      '.vp-title-row{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;border-bottom:3px solid '+BORDER+';padding-bottom:34px;margin-bottom:42px;}'+
      '.vp-title{font-size:54px;letter-spacing:10px;color:'+GOLD+';font-weight:900;line-height:1.05;margin:0;text-transform:uppercase;}'+
      '.vp-pill{border:2px solid '+BORDER+';border-radius:999px;padding:14px 28px;font-size:24px;font-weight:900;white-space:nowrap;color:#111;}'+
      '.vp-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px 28px;margin-bottom:44px;}'+
      '.vp-box{border:2px solid '+GOLD_SOFT+';border-radius:22px;padding:24px 30px;min-height:92px;box-sizing:border-box;background:#fff;}'+
      '.vp-label{color:'+MUTED+';letter-spacing:6px;font-size:18px;font-weight:900;text-transform:uppercase;margin-bottom:16px;}'+
      '.vp-value{font-size:30px;font-weight:900;color:#111;word-break:break-word;}'+
      '.vp-section-title{font-size:28px;font-weight:900;color:'+GOLD+';letter-spacing:4px;text-transform:uppercase;margin:38px 0 18px;}'+
      '.vp-table{width:100%;border-collapse:collapse;margin:20px 0 32px;font-size:19px;}'+
      '.vp-table th{background:#f4ead8;color:'+MUTED+';text-align:left;font-size:17px;letter-spacing:3px;text-transform:uppercase;padding:18px 22px;border-bottom:3px solid '+BORDER+';}'+
      '.vp-table td{padding:18px 22px;border-bottom:1px solid #e8dcc6;vertical-align:top;}'+
      '.vp-table .num{text-align:right;font-weight:800;white-space:nowrap;}'+
      '.vp-totals{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px 28px;margin-top:24px;}'+
      '.vp-total-card{border:2px solid '+GOLD_SOFT+';border-radius:22px;padding:24px 30px;background:#fff;}'+
      '.vp-total-card strong{display:block;color:'+MUTED+';letter-spacing:5px;font-size:17px;text-transform:uppercase;margin-bottom:16px;}'+
      '.vp-total-card span{font-size:32px;font-weight:900;color:#111;}'+
      '.vp-total-card.major span{color:'+GOLD+';font-size:38px;}'+
      '.vp-note{margin-top:42px;font-size:20px;line-height:1.6;color:#555;border-top:1px solid #eadcc1;padding-top:22px;}'+
      '.vp-footer{margin-top:48px;display:flex;justify-content:space-between;color:#777;border-top:1px solid #ddd;padding-top:16px;font-size:14px;}'+
      '@media(max-width:760px){.vp-page{padding:30px 26px}.vp-title-row{display:block}.vp-title{font-size:44px}.vp-brand{font-size:42px}.vp-meta,.vp-totals{grid-template-columns:1fr}.vp-pill{display:inline-block;margin-top:18px}.vp-table{font-size:16px}.vp-table th,.vp-table td{padding:14px 12px}}'+
      '</style>';
  }

  function renderMeta(meta){
    if (!Array.isArray(meta) || !meta.length) return '';
    return '<div class="vp-meta">' + meta.map(function(m){
      return '<div class="vp-box"><div class="vp-label">'+esc(m.label)+'</div><div class="vp-value">'+esc(m.value)+'</div></div>';
    }).join('') + '</div>';
  }

  function renderTable(rows, columns){
    if (!Array.isArray(rows) || !rows.length) return '';
    columns = columns && columns.length ? columns : Object.keys(rows[0] || {}).map(function(k){return {key:k,label:k};});
    var head = columns.map(function(c){return '<th>'+esc(c.label || c.key)+'</th>';}).join('');
    var body = rows.map(function(r){
      return '<tr>'+columns.map(function(c){
        var val = r[c.key];
        var cls = c.num ? ' class="num"' : '';
        return '<td'+cls+'>'+esc(val)+'</td>';
      }).join('')+'</tr>';
    }).join('');
    return '<table class="vp-table"><thead><tr>'+head+'</tr></thead><tbody>'+body+'</tbody></table>';
  }

  function renderTotals(totals){
    if (!Array.isArray(totals) || !totals.length) return '';
    return '<div class="vp-totals">' + totals.map(function(t, i){
      return '<div class="vp-total-card '+(t.major || i === totals.length-1 ? 'major' : '')+'"><strong>'+esc(t.label)+'</strong><span>'+esc(t.value)+'</span></div>';
    }).join('') + '</div>';
  }

  function render(opts){
    opts = opts || {};
    var type = opts.type || opts.title || 'REPORT';
    var documentNo = opts.documentNo || opts.number || '';
    var period = opts.period || opts.date || '';
    var rows = opts.rows || [];
    var columns = opts.columns || null;
    var html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'+css()+'</head><body>';
    html += '<main class="vp-page">';
    if (opts.back !== false) html += '<a class="vp-back" href="javascript:history.back()">← Back</a>';
    html += '<h1 class="vp-brand">VARDOPHASE</h1>';
    html += '<div class="vp-subtitle">Suppliers Cloud Pro · Official Accounting Document' + (documentNo ? '<br>Official Accounting Document · '+esc(documentNo) : '') + '</div>';
    html += '<div class="vp-title-row"><div><h2 class="vp-title">'+esc(type)+'</h2>'+(period ? '<div class="vp-pill" style="margin-top:22px;display:inline-block">'+esc(period)+'</div>' : '')+'</div>'+(documentNo ? '<div class="vp-pill">'+esc(documentNo)+'</div>' : '')+'</div>';
    html += renderMeta(opts.meta || []);
    if (opts.sectionTitle) html += '<div class="vp-section-title">'+esc(opts.sectionTitle)+'</div>';
    html += renderTable(rows, columns);
    html += renderTotals(opts.totals || []);
    if (opts.note) html += '<div class="vp-note"><strong>Accounting note:</strong> '+esc(opts.note)+'</div>';
    html += '<div class="vp-footer"><span>VARDOPHASE · Confidential Accounting Document</span><span>Page 1 of 1</span></div>';
    html += '</main></body></html>';
    return html;
  }

  function open(opts){
    var html = render(opts);
    var w = window.open('', '_blank');
    if (!w) {
      alert('Popup blocked. The template is ready, but your browser blocked the preview window.');
      return html;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    return html;
  }

  window.VardophasePrintTemplate = {
    render: render,
    open: open,
    version: 'V283'
  };
})();
