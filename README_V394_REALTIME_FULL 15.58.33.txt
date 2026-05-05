V394 REALTIME FULL
- Adds Supabase Realtime listener for suppliers table.
- Updates UI automatically on INSERT / UPDATE / DELETE without pressing Sync.
- Keeps V392 Sync button as fallback.
- Does not change login flow.
- Requires Supabase Realtime enabled for public.suppliers.

Supabase setup:
Database / Replication / Realtime -> enable table suppliers.
