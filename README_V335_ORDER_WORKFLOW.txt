V335 ORDER WORKFLOW LOCK

What changed:
1. New Order creates a fresh PO number and opens an editable items table.
2. Save In Process saves item rows (product/description/qty even without prices), stores status as Order in Process, and preserves items on reopen.
3. Finalize Order requires item prices and stores status as Final Order.
4. Convert Order -> DN remains the next step after Final Order.

Data preservation:
- Items are saved inside suppliers.notes under [[GL_ITEMS:...]] and also mirrored to orders/order_items when those tables exist.
- Local browser cache is used as fallback by PO number and row id.

This patch is embedded as script id: v335-order-workflow-lock.
