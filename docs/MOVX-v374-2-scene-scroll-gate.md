# MOVX v374.2 — Scene 01 scroll contract

This revision does not change the production Scene 01 visuals or 3D runtime.

The v374 full-bleed Scene 01 passed its dedicated frame/light/volume/loading/channel-pose suite. The remaining deploy failure was an older v367 QA assumption: it derived the choreography target from `boot.offsetTop`, while the production choreography derives progress from `boot.getBoundingClientRect()` inside a full-bleed sticky layout.

v374.2 makes the QA drive scroll from the same live geometry as production (`current scroll + boot rect top + travel * ratio`) and requires both the raw v354 choreography progress and the damped v367 director progress to converge before validating camera travel and handoff.

No threshold for the actual spatial effect was removed. The suite still requires real camera depth change, the handoff beat, single renderer/canvas, 44,831 triangles, the single `boot-tv` model slot, and all later 3D models deferred.

The CRT runtime-contract job receives three additional minutes of CI headroom because the full historical suite now runs through v368 on software WebGL; no test is removed or skipped.
