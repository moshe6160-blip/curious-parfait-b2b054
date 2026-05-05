V396 ANTI DUPLICATE PUSH

Fixes repeated push notifications for the same approval/pre-order event.

Changes:
- Server-side dedupe for realtime push events.
- Server-side dedupe for approval count push.
- Frontend local dedupe guard.
- Stable realtime channel name.
- Push notification renotify=false to reduce iOS stacking.
- Service worker version bumped to V396.

Commit message:
V396 anti duplicate push
