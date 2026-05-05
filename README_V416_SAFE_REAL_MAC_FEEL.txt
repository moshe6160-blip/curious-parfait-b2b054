V416 SAFE REAL MAC FEEL

Built directly on V414/V401 stable base.

What this fixes:
- The existing windowAction used a missing #windowDock, so minimize made windows disappear.
- V416 connects minimize to the existing V401 Dock.
- Only one Dock remains.
- Dock has hide/show toggle.
- Existing modal windows get Mac traffic-light behavior:
  red close, yellow minimize to Dock, green fullscreen.
- Existing modal windows can be dragged by their window bar / modal header.
- Gemini-like lightweight open animation.
- No login changes.
- No DB/Supabase changes.
- No Push/Realtime changes.
- No auto refresh, no setInterval, no reload.
