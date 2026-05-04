V382 APPROVAL NOTIFY USER

Added:
- After a Pre-Order is approved, the system sends a Push notification:
  "Order approved — can send to supplier"
- Notification includes order number, supplier, project and amount.
- No Blobs required. Uses the local subscription already created by Enable Notifications.
- If no device subscription exists, approval still works and shows a clear message.

Netlify env required:
- VAPID_PUBLIC_KEY
- VAPID_PRIVATE_KEY
- VAPID_SUBJECT=mailto:info@vardophase.co.za

Files added:
- v382-approval-notify-user.js
- netlify/functions/push-approved-user.js
