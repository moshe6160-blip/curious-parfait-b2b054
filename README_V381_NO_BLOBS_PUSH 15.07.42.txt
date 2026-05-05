V381_NO_BLOBS_PUSH
- Removes Netlify Blobs dependency from push functions.
- Subscription is saved locally in the browser after Enable Notifications.
- Test button sends a real push using the local subscription.
- Approval push sends using the local subscription when a Pre-Order trigger happens.
- Required Netlify env vars: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT.
- No NETLIFY_BLOBS_TOKEN / siteID needed.
