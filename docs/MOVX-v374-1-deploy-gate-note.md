# MOVX v374.1 — Deploy gate note

This revision does not change the Scene 01 runtime or visual composition.

The v374 short-desktop framing already passed its dedicated physical checks: the real CRT stays vertically inside the 1280×720 viewport and `tripo_part_8` remains ray-hittable inside the visible safe area.

v374.1 updates two older QA assumptions so they match the current full-bleed art direction:

- mobile validates a neutral CRT wrapper offset by behavior (`auto` or approximately `0px`) instead of depending on one browser's serialized computed-style string;
- the legacy v364 choreography gate requires full vertical framing, at least 82% horizontal projected-volume visibility, and a real ray-hittable cabinet surface instead of requiring the entire rotated 3D bounding box — including rear depth — to remain inside the horizontal viewport.

The production invariants remain unchanged: one `movx-crt-tv.glb`, one active `boot-tv` slot, one WebGL renderer/canvas, 44,831 triangles, and all later 3D models deferred.
