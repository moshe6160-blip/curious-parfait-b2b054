V411 PERFORMANCE CLEAN FINAL

Base: V409/V408 stable workspace build.

Cleaned:
- Removed old README_V*.txt, .bak, .tmp, .orig, .DS_Store, unused split scripts and unused v*.js files.
- Kept all scripts referenced by index.html and all Netlify functions.

Fixed performance:
- Disabled 15-second auto cloud sync polling. Realtime remains active; Sync button stays manual.
- Removed automatic reload from the stable loader.
- Reduced/removes aggressive UI polling loops that ran every 700ms/800ms/1500ms/2000ms.
- Approve flow no longer forces page reload; it calls render() instead.
- Service Worker registration no longer forces immediate update/skip waiting while the user is typing/login.

Kept unchanged:
- Login flow
- Supabase connection
- Push notifications
- Realtime notifications
- Netlify functions

Commit suggestion:
V411 performance clean final
