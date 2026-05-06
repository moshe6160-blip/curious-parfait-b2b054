V420 MODAL MINIMIZE FIX

Base: V414/V401 stable.

Fixes:
- Yellow button creates a live Dock item before hiding the window.
- Modal overlay is fully hidden with v420-modal-minimized, so screen does not stay black.
- Restore from Dock removes minimized state and shows the same window.
- Supports both windowAction(event,'compact') and windowAction('compact').
- Home closes active modals and returns to dashboard/top.
- Dock action routing: Order, DN, Invoice call their real functions.
- No login / Push / Realtime / DB changes.
