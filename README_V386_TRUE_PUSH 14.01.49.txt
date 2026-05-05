V386 TRUE PUSH APPROVALS
- Restores full stable V385 base.
- Adds real server-side Push trigger: when a Pre-Order is created on any device, Netlify Function sends push to registered devices.
- Push subscriptions are stored centrally in Netlify Blobs using @netlify/blobs.
- No test notifications.
- Pre-Order before approval, Order after approval.
- Approval notification to user remains active.

Required Netlify environment variables:
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT=mailto:info@vardophase.co.za

After deploy:
1. Open app from iPhone Home Screen.
2. Enable Notifications once.
3. Create a new Pre-Order from the computer.
4. Phone should receive notification without opening app.
