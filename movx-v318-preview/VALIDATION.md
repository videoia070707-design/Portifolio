# MOVX v318 — Validation Checklist

## Scope
Scene 05 / Playground Props only.

## Must remain unchanged
- CRT / TV Y2K
- MOVX Physical Logo
- X Portal / Tunnel
- Creative Machine
- existing project archive, studio, people and contact sections
- current drag engine in `movx-v311-preview/app.js`

## Functional checks
- existing pointer drag remains active for every `.float` prop
- prop keeps its placed position after release as in the base runtime
- no new drag physics engine is introduced
- each prop can be replaced independently by a runtime renderer
- DOM fallback remains visible until `replaceWith()` succeeds
- `restoreFallback()` removes only the renderer for that prop

## Visual checks
- shared Y2K industrial product family
- orange restricted to the cube, cursor and small accents
- no RGB, cyberpunk, glassmorphism or HUD styling
- cassette reads as cassette, camera as compact digital/DV camera, CD as physical disc, window as portable display
- no unnecessary microcopy added to the section

## Responsive checks
- all props remain within the float zone on mobile
- drag boundaries continue to use the existing zone dimensions
- no prop causes horizontal page overflow

## Runtime slots
- `play-cassette`
- `play-camera`
- `play-cube`
- `play-cd`
- `play-window`

Query staging parameters: `cassetteModel`, `cameraModel`, `cubeModel`, `cdModel`, `windowModel`. These record requested assets only; they do not pretend a GLB is rendered before a real renderer is attached.
