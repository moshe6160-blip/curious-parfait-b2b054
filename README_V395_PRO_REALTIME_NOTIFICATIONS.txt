V395 PRO REALTIME NOTIFICATIONS

Built on V394 Realtime Full.

What changed:
- Keeps login untouched.
- Keeps Supabase realtime untouched.
- Adds a Live notification badge inside the app.
- Connects realtime events to push notifications:
  1) INSERT pending Pre-Order => notification to approver devices.
  2) UPDATE from pending to approved => notification that order is approved.
- Adds Netlify function: netlify/functions/push-realtime-event.js
- Uses Netlify Blobs dedupe so multiple open devices do not spam duplicate push notifications.
- No test notifications.

Required environment variables remain:
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT
NETLIFY_SITE_ID
NETLIFY_AUTH_TOKEN

Supabase:
- Realtime must be enabled for public.suppliers in supabase_realtime publication.
