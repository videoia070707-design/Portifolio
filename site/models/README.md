# MOVX production GLB workflow

## Active stage — Model 01 only

The site is intentionally implemented **one model at a time**.

Current production slot:

- `boot-tv` — CRT / TV Y2K opening (Scene 01 / BOOT)
- Real Tripo source: `movx-camera.glb`
- Canonical production filename: `movx-crt-tv.glb`
- TV mesh cluster: `tripo_part_7`, `tripo_part_13`, `tripo_part_18`

The original Tripo upload groups several playground props in `movx-camera.glb`.
The approved CRT visible in that pack is now isolated at runtime: camera, cassette,
CD, X object and every other non-TV mesh are removed before framing/rendering.
The production build copies only this source asset and publishes it under the
canonical Scene-01 name `models/movx-crt-tv.glb`.

`v348-crt-procedural.mjs` remains only as an emergency fallback if the real GLB
cannot be resolved. It is not the intended production renderer for Scene 01.

## Deferred assets — do not publish yet

These source assets belong to later passes and must remain disabled until the
CRT is finished and approved:

- `movx-physical-logo.glb` → `hero-movx-logo` — Model 02
- `movx-x-portal.glb` → `x-portal` — Model 03
- `movx-creative-machine.glb` → `creative-machine`
- `movx-x-cube.glb` → `play-cube`
- `movx-spatial-studio.glb` → `spatial-studio`

No later model is allowed into the public build during the Model-01 stage.
