V364_ROW_TYPE_SOURCE_FINAL
- Final root fix for Entry modal type confusion.
- Loaded as type=module after the main module, so it wraps the real final openEntryModal.
- Opening from bottom/action rows now uses the row data only, never the last top button state.
- New top buttons still use their own forced type.
- Removed conflicting old type router scripts from index.html.
- Invoice wins when a real invoice_no exists; DN is used when DN exists and no real invoice exists.
- Login, save, calculations untouched.
