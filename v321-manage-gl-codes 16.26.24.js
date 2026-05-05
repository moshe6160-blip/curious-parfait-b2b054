
(function(){
  'use strict';
  function esc(s){ return String(s ?? '').replace(/[&<>\"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c] || c)); }
  function getGL(){ return Array.isArray(window.VARDOPHASE_GL_CODES) ? window.VARDOPHASE_GL_CODES : []; }
  function label(g){ return String((g.code || '') + ' - ' + (g.description || '')).trim(); }
  function applyManageGLList(){
    const modal = document.getElementById('listsModal');
    if(!modal || !modal.classList.contains('show')) return;
    const boxes = Array.from(modal.querySelectorAll('.mini-box'));
    const box = boxes.find(b => /Descriptions/i.test(b.querySelector('.mini-title')?.textContent || ''));
    const gl = getGL();
    if(!box || !gl.length) return;
    if(box.dataset.v321GlManaged === '1') return;
    box.dataset.v321GlManaged = '1';
    const options = gl.map(g => '<option value="'+esc(label(g))+'"></option>').join('');
    const selectOptions = '<option value="">Select GL code to remove / view</option>' + gl.map(g => '<option value="'+esc(g.code)+'">'+esc(label(g))+'</option>').join('');
    const chips = gl.map(g => '<span class="chip v321-gl-chip"><b>'+esc(g.code)+'</b> · '+esc(g.description)+'</span>').join('');
    box.innerHTML = `
      <div class="mini-title">GL Codes / Descriptions</div>
      <div class="add-row">
        <input class="dark" id="newDescriptionInput" placeholder="Add manual description">
        <button class="primary" onclick="window.addQuickListItem && window.addQuickListItem('description')">Add</button>
      </div>
      <div class="add-row" style="margin-top:10px">
        <input class="dark" id="searchDescriptionInput" list="descriptionSearchList" placeholder="Search GL code or description">
        <datalist id="descriptionSearchList">${options}</datalist>
      </div>
      <div class="remove-row">
        <select class="dark" id="removeDescriptionSelect">${selectOptions}</select>
        <button class="red" onclick="window.removeSelectedListItem && window.removeSelectedListItem('description','removeDescriptionSelect')">Remove Manual</button>
      </div>
      <div class="helper" style="margin-top:8px">This list is now the same GL list used inside Order: GL Code + Description. Manual descriptions can still be added separately.</div>
      <div class="chips v321-gl-chips">${chips}</div>
    `;
  }
  function install(){
    const oldOpen = window.openListsModal;
    if(typeof oldOpen === 'function' && !oldOpen.__v321Wrapped){
      const wrapped = async function(){
        const res = await oldOpen.apply(this, arguments);
        setTimeout(applyManageGLList, 80);
        setTimeout(applyManageGLList, 300);
        return res;
      };
      wrapped.__v321Wrapped = true;
      window.openListsModal = wrapped;
    }
    setInterval(applyManageGLList, 700);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
  const css = document.createElement('style');
  css.textContent = `
    .v321-gl-chips{max-height:320px;overflow:auto;padding-right:6px;display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start}
    .v321-gl-chip{font-size:12px;line-height:1.25;box-shadow:none!important;text-shadow:none!important;white-space:normal;max-width:280px}
    .v321-gl-chip b{color:#f4d7a1;font-weight:900;margin-right:4px}
  `;
  document.head.appendChild(css);
})();
