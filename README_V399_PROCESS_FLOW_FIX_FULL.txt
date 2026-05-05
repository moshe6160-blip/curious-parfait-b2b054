V399 PROCESS FLOW FIX FULL

Base: user provided V398 full build.

Fixes:
- Approve Order changes Pre-Order to App order (status remains Approved in DB).
- Sent/Email/Share to supplier changes App order to Order (status Sent in DB).
- Process badges: Pre-Order = orange, App order = blue, Order = green.
- Patched V375 approval workflow and V398 overlay to stop DOM relabel from jumping Approved directly to Order.

Kept:
- Login unchanged
- Realtime unchanged
- Push unchanged
- Netlify functions unchanged
- Full project structure retained
