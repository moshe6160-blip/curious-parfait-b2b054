V390 PRO CLEAN - Stable full package

Built from the latest stable V386/V385 line.

Included:
- Login/auth untouched.
- Existing Supabase data flow untouched.
- True Push approvals using Netlify Functions + Netlify Blobs.
- Fixed _push-store.js to use NETLIFY_SITE_ID + NETLIFY_AUTH_TOKEN.
- Smart refresh every 15 seconds only when data changed.
- No hard page reload, no screen jump, scroll position preserved.
- Auto-refresh pauses while typing, while modal is open, while rows are selected, or when app is in background.
- Manual Sync button does not conflict with auto-refresh.
- No test notifications.

Required Netlify Environment Variables:
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT=mailto:info@vardophase.co.za
NETLIFY_SITE_ID
NETLIFY_AUTH_TOKEN

Upload all files to GitHub, Commit, Push origin, then wait for Netlify Published deploy.
