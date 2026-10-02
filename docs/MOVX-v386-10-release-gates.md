# MOVX v386.10 — Scene 01 release-gate fixes

Scope remains strictly **Scene 01 / the approved CRT only**.

## Runtime fix

v386.8/v386.9 correctly expanded direct screen/dial/cabinet gestures to the visible Scene-01 field because the authored camera can project real CRT geometry beyond the old `.crt-wrap` DOM box. The older v361 simple-click family was still bound to `.crt-wrap`, so a visible part of the real screen could be draggable yet fail a simple click.

v386.10 relocates that existing click family to `.scene-inner` and records the Three.js ray-hit on pointerdown. This prevents a valid press from becoming a miss when the CRT/camera responds a few pixels between pointerdown and pointerup.

No new listener family, model, renderer, WebGL context, scene or RAF is introduced.

## Current release contract

The old v371 gate compared one instantaneous group-yaw snapshot against a startup snapshot. With later v375-v386 composition layers this can measure different damped owners at different phases instead of the user-visible result.

The v386.10 current-scene gate preserves the actual requirement but measures it in the current architecture:

- the visible real screen is ray-hittable;
- a deliberate click advances DIREÇÃO and changes the live screen texture;
- moving across the complete Scene-01 field produces opposite object-volume pointer intent;
- the final real `THREE.Group` yaw is sampled after settling on both sides and must show a visible spatial delta;
- one renderer, one active `boot-tv` slot and 44,831 triangles remain invariant.

All later storyboard models stay deferred/unpublished.
