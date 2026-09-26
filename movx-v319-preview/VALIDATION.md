# MOVX v319 — Validation Checklist

## Scope
Scene 06 / Spatial Studio only.

## Must remain unchanged
- CRT / TV Y2K
- Physical Logo
- X Portal
- Creative Machine
- Playground drag and props
- Work archive, People and Contact sections

## Structural checks
- reuses `data-model-slot="spatial-studio"`
- preserves existing wall, three screens, desk and two chairs
- no duplicate studio environment is created
- screen surfaces remain independent in the Tripo spec
- runtime model is opt-in via `window.MOVX3D.slots['spatial-studio']`

## Motion checks
- stage gets only subtle pointer orientation and scroll dolly
- existing wall parallax can continue to run
- desk remains visually grounded
- reduced-motion removes the new transforms

## Visual checks
- no decorative grid-floor effect
- no cyberpunk / RGB / gamer-room treatment
- orange is limited to restrained ambient/status accents
- screens read as physical monitors, not floating UI cards
- environment remains clean and professional

## Responsive checks
- room remains contained on mobile
- copy remains above scene layers
- no horizontal overflow caused by floor/ceiling geometry

## GLB integration
Query staging parameter: `studioModel`.
It records the requested source only; a real renderer must still call `replaceWith(rendererElement)` before the fallback is hidden.
