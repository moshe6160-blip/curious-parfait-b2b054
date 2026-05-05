V392 UI Sync Fix
- Sync now fetches from Supabase/cloud and forces the app renderer to redraw the table.
- Updates dashboard/table without normal reload.
- If mobile Safari/PWA keeps stale DOM after manual sync, it performs a one-time cache-busted refresh as a safe fallback.
- Keeps Login / Push / Approvals logic unchanged.
