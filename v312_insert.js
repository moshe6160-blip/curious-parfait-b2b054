
  // V312 dashboard shell matching the requested reference image
  try{
    const shell = document.querySelector('#app .shell');
    if(shell && !shell.classList.contains('vp-dashboard-shell')){
      shell.classList.add('vp-dashboard-shell');
      window.setVPTab = async function(tab){ uiState.tab = tab || 'dashboard'; await render(); };
      shell.insertAdjacentHTML('afterbegin', `
        <aside class="vp-sidebar">
          <div class="vp-sidebar-brand">
            <img class="vp-logo-img" src="assets/vardophase-logo.png" alt="Vardophase logo">
            <div class="vp-brand-name">VARDOPHASE</div>
            <div class="vp-brand-sub">Suppliers Cloud Pro</div>
          </div>
          <nav class="vp-side-nav">
            <button class="vp-nav-item ${uiState.tab==='dashboard'?'active':''}" onclick="window.setVPTab('dashboard')"><span class="vp-nav-ico">▣</span>Dashboard</button>
            <button class="vp-nav-item ${uiState.tab==='orders'?'active':''}" onclick="window.setVPTab('orders')"><span class="vp-nav-ico">▤</span>Orders</button>
            <button class="vp-nav-item ${uiState.tab==='suppliers'?'active':''}" onclick="window.setVPTab('suppliers')"><span class="vp-nav-ico">♙</span>Suppliers</button>
            <button class="vp-nav-item ${uiState.tab==='invoices'?'active':''}" onclick="window.setVPTab('invoices')"><span class="vp-nav-ico">▧</span>Invoices</button>
            <button class="vp-nav-item" onclick="window.openDepositModal()"><span class="vp-nav-ico">▰</span>Payments</button>
            <button class="vp-nav-item" onclick="window.openListsModal()"><span class="vp-nav-ico">⌑</span>Products</button>
            <button class="vp-nav-item" onclick="window.printMonthlyReport()"><span class="vp-nav-ico">▨</span>Reports</button>
            <button class="vp-nav-item" onclick="window.openRolesModal()"><span class="vp-nav-ico">♙</span>Users</button>
            <button class="vp-nav-item" onclick="window.openSettingsModal()"><span class="vp-nav-ico">⚙</span>Settings</button>
            <button class="vp-nav-item" onclick="window.openAuditLog()"><span class="vp-nav-ico">◴</span>Audit Log</button>
          </nav>
          <div class="vp-sidebar-user"><div class="vp-user-avatar">V</div><div><div class="vp-user-mail">${esc(currentUser?.email || '')}</div><span class="vp-admin-mini">${esc(getRoleLabel())}</span></div></div>
        </aside>`);
      const header = shell.querySelector('header.card');
      const recent = entries.slice(0,5);
      if(header){
        header.insertAdjacentHTML('afterbegin', `
          <div class="vp-main-topbar">
            <div class="vp-top-left"><span class="vp-hamburger">☰</span><span class="vp-top-title">VARDOPHASE</span></div>
            <div class="vp-top-actions"><span>⌕</span><span>♧</span><span class="vp-top-avatar">V</span></div>
          </div>
          <div class="vp-dashboard-content">
            <div class="vp-welcome-row">
              <div><div class="vp-welcome-small">Welcome back,</div><div class="vp-welcome-title">VARDOPHASE</div></div>
              <div class="vp-date-pill">May 1 – May 31, 2026 ◷</div>
            </div>
            <div class="vp-metric-grid">
              <div class="vp-metric-card"><div class="vp-metric-icon">✓</div><div><div class="vp-metric-label">Orders</div><div class="vp-metric-value">${openOrders.count || entries.filter(e=>displayEntryKind(e)==='order').length}</div><div class="vp-metric-sub">Total Orders</div></div></div>
              <div class="vp-metric-card"><div class="vp-metric-icon">♙</div><div><div class="vp-metric-label">Suppliers</div><div class="vp-metric-value">${sum.suppliers || suppliers.length || 0}</div><div class="vp-metric-sub">Active Suppliers</div></div></div>
              <div class="vp-metric-card"><div class="vp-metric-icon">▤</div><div><div class="vp-metric-label">Invoices</div><div class="vp-metric-value">${money(sum.invoiceTotal || 0)}</div><div class="vp-metric-sub">Total Invoices</div></div></div>
              <div class="vp-metric-card"><div class="vp-metric-icon">▣</div><div><div class="vp-metric-label">Payments</div><div class="vp-metric-value">${money(sum.depositTotal || 0)}</div><div class="vp-metric-sub">Total Payments</div></div></div>
            </div>
            <div class="vp-dashboard-panels">
              <div class="vp-chart-panel"><div class="vp-panel-title">Orders Overview</div><div class="vp-chart-box"><div class="vp-chart-line"></div><div class="vp-chart-stroke"></div></div><div class="vp-chart-axis"><span>May 1</span><span>May 8</span><span>May 15</span><span>May 22</span><span>May 31</span></div></div>
              <div class="vp-recent-panel"><div class="vp-panel-title">Recent Orders</div><div class="vp-recent-list">
                ${(recent.length?recent:[{}]).map((r,i)=>`<div class="vp-recent-row"><span>${esc(r.order_no || r.invoice_no || ('ORD-10015'+(6-i)))}</span><span>${money(r.total || r.amount || 0)}</span><span class="vp-status">${esc(r.status || 'Completed')}</span></div>`).join('')}
              </div></div>
            </div>
            <div class="vp-action-grid">
              <button class="vp-action-card" onclick="window.openOrderModal()"><b>＋</b><span>New Order</span></button>
              <button class="vp-action-card" onclick="window.openInvoiceModal()"><b>▤</b><span>New Invoice</span></button>
              <button class="vp-action-card" onclick="window.openListsModal()"><b>♙＋</b><span>Add Supplier</span></button>
              <button class="vp-action-card" onclick="window.openListsModal()"><b>◼</b><span>Add Product</span></button>
              <button class="vp-action-card" onclick="window.openSupplierReportModal()"><b>▥</b><span>Supplier Report</span></button>
              <button class="vp-action-card" onclick="window.printMonthlyReport()"><b>▤</b><span>Invoice Report</span></button>
            </div>
          </div>`);
      }
    }
  }catch(e){ console.warn('V312 dashboard shell skipped', e); }
