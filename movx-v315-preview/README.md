# MOVX v315 — Physical Logo Pass

This preview layers Scene 02 / HERO physical identity work on top of the existing v314 CRT pass.

## Runtime slots
- `boot-tv` — inherited from v314.
- `hero-movx-logo` — introduced in v315.

## Query test hooks
- `?crtModel=<url-or-path>` records an intended CRT model source on the boot slot.
- `?logoModel=<url-or-path>` records an intended physical-logo model source on the hero slot.

These hooks do not fetch/render GLB files by themselves. They are contracts for the production renderer layer so DOM fallbacks remain available until a real WebGL renderer reports successful load.

## Fallback rule
Never hide the physical-logo DOM fallback before the production renderer confirms a successful model load. If a GLB or renderer fails, restore the fallback immediately.
