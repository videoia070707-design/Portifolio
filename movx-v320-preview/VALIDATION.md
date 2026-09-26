# MOVX v320 — Validation Checklist

## Scope
Scene 07 / Contact Window only.

## Must remain unchanged
- all previous storyboard scenes v314–v319
- contact copy, CTA and footer/social text
- existing whole-window pointer parallax from base runtime

## Structural checks
- reuses `data-model-slot="closing-window"`
- preserves existing landscape, mountain, orange sun and contact footer
- no duplicate contact object is created
- runtime model is opt-in through `window.MOVX3D.slots['closing-window']`
- fallback stays visible until `replaceWith()` succeeds
- `restoreFallback()` removes only the external renderer

## Motion checks
- scroll only deepens the screen and raises/scales the sun subtly
- no continuous rotation
- whole-frame pointer motion remains owned by existing app runtime
- reduced-motion disables the new internal transforms

## Visual checks
- object reads as a physical Y2K exit/display frame, not a browser window
- orange sun is the final focal point
- no neon portal ring, HUD, glassmorphism or RGB treatment
- contact text remains outside the 3D model/screen content

## Responsive checks
- frame remains contained on mobile
- footer/contact strip stays readable
- no horizontal overflow from frame shadow or hinges

## GLB integration
Query staging parameter: `contactModel`.
The parameter records a requested source only; a renderer still must call `replaceWith(rendererElement)` before the DOM fallback is hidden.
