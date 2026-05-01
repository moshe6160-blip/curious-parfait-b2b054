V283 - Unified Print Template (SAFE)

Base: V277_FULL_ACCOUNTING_TRUE_FROM_V276_CHECKED_FIXED

What changed:
- Added one central print template file: print-template.js
- Added a script include in index.html
- No login changes
- No Supabase changes
- No accounting logic changes
- No existing report functions were replaced yet

Purpose:
This is the safe first step. Future reports can call:
window.VardophasePrintTemplate.open({...})
so every printed/PDF document uses the same white + gold VARDOPHASE layout.
