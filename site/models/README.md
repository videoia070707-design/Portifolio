# MOVX production GLB workflow

## Active stage — Model 01 only

The site is intentionally implemented **one model at a time**.

Current production slot:

- `movx-crt-tv.glb` → `boot-tv` — CRT / TV Y2K opening (Scene 01 / BOOT)

Until this file exists and is approved, the v314 DOM/CSS CRT fallback stays active and **no later GLB is published**.

## Deferred assets — do not publish yet

These source assets belong to later passes and must remain disabled until the previous model is finished and approved:

- `movx-physical-logo.glb` → `hero-movx-logo` — Model 02
- `movx-x-portal.glb` → `x-portal` — Model 03
- `movx-creative-machine.glb` → `creative-machine`
- `movx-camera.glb` → `play-camera`
- `movx-x-cube.glb` → `play-cube`
- `movx-spatial-studio.glb` → `spatial-studio`

The production installer and runtime both enforce the current `boot-tv` scope, so merely storing a later `.glb` in this folder does not make it live.
