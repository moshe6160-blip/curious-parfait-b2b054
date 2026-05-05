V379 WEB PUSH APPROVALS

Added real Web Push notification support for Pre-Orders waiting approval.

New files:
- v379-web-push-approvals.js
- sw.js upgraded with push + notificationclick
- manifest.json upgraded for PWA install
- netlify/functions/push-public-key.js
- netlify/functions/push-save-subscription.js
- netlify/functions/push-notify-approvals.js
- package.json dependencies: web-push, @netlify/blobs, @sendgrid/mail

Netlify environment variables required:
- VAPID_PUBLIC_KEY
- VAPID_PRIVATE_KEY
- VAPID_SUBJECT=mailto:info@vardophase.co.za

To create VAPID keys locally:
npx web-push generate-vapid-keys

Important for iPhone:
Open in Safari, Share -> Add to Home Screen, then open from the Home Screen icon and press Enable.
Push notifications on iPhone require installed web app mode.

Behavior:
- Floating Approvals notification badge stays visible in the system.
- Enable button asks for push permission and saves subscription.
- When new pending Pre-Orders exist, a push can be sent to subscribed devices.
- Notification click opens the system directly to approvals.
- Popup/drawer still shows only Pre-Orders not approved.
