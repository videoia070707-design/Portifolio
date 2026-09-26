# MOVX v317 — Validation Checklist

## Scope
Scene 04 / Creative Machine only.

## Must remain unchanged
- Scene 01 CRT / TV Y2K
- Scene 02 MOVX Physical Logo
- Scene 03 X Portal / Tunnel
- Work archive / project carousel
- Playground, Spatial Studio, People and Contact sections
- existing copy and service labels

## Structural checks
- reuses existing `data-model-slot="creative-machine"`
- does not create a second capabilities machine
- preserves the four existing `.console-unit` modules
- does not rewrite module copy
- runtime renderer is opt-in through `window.MOVX3D.slots['creative-machine']`
- DOM fallback remains until `replaceWith()` succeeds
- `restoreFallback()` removes runtime renderer and restores DOM machine

## Motion checks
- scroll drives only subtle chassis orientation and active module sequencing
- pointer movement is damped and limited
- no continuous rotation
- reduced-motion disables transforms/transitions

## Visual checks
- orange remains an accent, not a full neon treatment
- no RGB/gaming/cyberpunk styling
- no extra content cards or microcopy
- machine reads as professional Y2K creative hardware

## Responsive checks
- desktop: four modules remain readable and contained
- tablet: chassis padding reduced without clipping
- mobile: no horizontal overflow from chassis or module transforms

## GLB integration
Expected mesh families documented in `MOVX_CREATIVE_MACHINE_TRIPO_SPEC.md`.
Query-string staging hook: `?machineModel=<url-to-glb>` records the requested asset without pretending to render it.
