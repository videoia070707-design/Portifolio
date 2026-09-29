# MOVX v369 — Scene 01 Full-Bleed Rationale

## Scope

This phase changes only the framing/composition of **Scene 01 / the approved CRT television**.

No second 3D model is activated, published, loaded or staged.

References reinforced during the Scene-01 study:

- HAOQI.DESIGN — https://haoqi.design/
- HAOQI technical case study — https://tympanus.net/codrops/2026/08/15/inside-haoqi-design-letting-dom-and-webgl-share-a-retro-futurist-stage/
- Amir VL / 0110 — https://amirvl.com/
- Joseph Santamaria — https://joseph-san.com/
- Joseph technical case study — https://tympanus.net/codrops/2026/04/28/more-than-a-portfolio-building-a-scroll-driven-3d-world-with-something-to-say/

## The visual problem after v368

v367 unified camera, CRT staging, lighting, typography, channels and scroll.
v368 then made the whole first scene spatially aware before the pointer reaches the television.

Those changes fixed much of the interaction architecture, but one strong visual cue still contradicted the desired experience:

- Scene 01 lived inside an 8px outer gutter;
- its environment had an 18px rounded rectangle;
- a 46px internal scene bar behaved like a separate toolbar;
- the combination visually read as a large UI card embedded in the page.

That boundary keeps telling the visitor:

> “this is a component containing a 3D object.”

The intended feeling is closer to:

> “this first screen is the place I entered.”

## Why the reference sites feel more immersive

The relevant references do not depend only on technically complex WebGL. Their staging gives the interactive world enough authority over the viewport that the user stops reading it as an embedded product viewer.

For MOVX, the transferable lesson is not to copy their layouts. It is to remove an unnecessary interface boundary around the already-approved scene.

## v369 decision

Scene 01 becomes full-bleed directly below the fixed 58px MOVX header.

### Removed only from Scene 01

- 8px outer side/bottom gutter
- 18px scene card radius
- scene-card border
- dedicated toolbar-like visual separation for `.scene-bar`

### Preserved

- global MOVX navigation/header
- CRT size/framing safety
- v367 camera/light/type direction
- v368 scene-wide pointer state
- v366 CRT-specific physical presence
- channel interaction and controls
- natural mobile document flow
- reduced-motion behavior
- all later scene framing, until those scenes receive their own explicit phase

## Scene metadata

The scene number/name remains available, but on desktop it becomes quiet environmental labeling over the top of the first scene instead of consuming a separate horizontal toolbar row.

This creates more vertical field for the actual composition without adding content.

## Grounding without adding another 3D object

Removing the rounded-card edge can make an object feel visually ungrounded if the environment stays perfectly flat.

v369 therefore uses only a very subtle lower-edge density gradient tied to the existing scene. It is not a new prop, HUD, glass card or decorative 3D layer.

The CRT remains the sole spatial anchor.

## Responsive strategy

### Desktop

- sticky Scene 01 begins at `top: 58px`
- width is the full viewport
- height is `100svh - 58px`
- scene metadata overlays the environment
- CRT + editorial copy keep a controlled two-column grid

### Short laptops

- reduced vertical padding and gap
- compact v367 channel deck remains inside the viewport
- no forced CRT enlargement/cropping

### Mobile / coarse pointer

- natural document flow remains
- no sticky desktop composition is forced onto touch
- full-bleed framing removes the card edge, but continuous scene parallax remains disabled

### Reduced motion

- natural relative flow remains
- no sticky scroll scene is required

## Scope guard

The QA explicitly verifies that the next scene remains inset/rounded.

This is intentional. The user asked to perfect the first 3D section before touching the others, so v369 must not silently redesign the rest of the site.

## Approval signal

The main perceptual test for this phase is simple:

> On first sight, does the visitor perceive the CRT as part of the page/world itself, or as a 3D demo sitting inside a large rounded card?

v369 is aimed directly at removing the second reading.
