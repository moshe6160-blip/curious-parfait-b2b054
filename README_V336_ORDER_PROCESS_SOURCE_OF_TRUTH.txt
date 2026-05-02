V336 ORDER PROCESS SOURCE OF TRUTH
- Save In Process writes the order items into suppliers.notes as [[GL_ITEMS:...]].
- Reopening an order restores the items from suppliers.notes first, then local cache fallback.
- Process column displays "Order in Process" until Finalize Order changes status to "Final Order".
- Final Order remains an order and can then be converted to DN.
