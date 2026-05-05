V385 STABLE PWA FIX

Based on V384 clean.
Fixes:
- Prevents stale iPhone PWA cache / white screen by cache-busting scripts.
- Adds no-cache Netlify headers.
- Updates service worker safely without unregistering Push.
- Keeps V381/V384 approvals and real push notifications.
- Removes test notification behavior.

Upload all files, Commit, Push, wait for Netlify deploy.
If iPhone still shows white once: close app fully and open again.
