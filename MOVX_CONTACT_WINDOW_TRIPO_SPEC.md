# MOVX — Contact Window / Exit Portal — Tripo Production Spec

## Role
Scene 07 / CONTACT / EXIT.

The final 3D object should feel like a physical framed portal/display device, not a generic browser window. It closes the experience with a calm landscape and the MOVX orange sun as the final focal point.

## Core silhouette
- wide physical display/window frame
- warm off-white / grey molded housing
- softened Y2K industrial corners
- slightly thick body with believable depth
- dark recessed screen opening
- small physical side hinges / structural mounts
- compact status LED
- low visual complexity: this is the quiet ending object

## Materials
1. Warm off-white semi-matte ABS outer frame
2. Graphite inner bezel
3. Smoked glass display surface
4. Small brushed-metal hinge / fastener details
5. MOVX orange `#ff5a18` only for status LED and/or the sun content layer
6. Dark rubber feet or rear pads if visible

No RGB, neon edge light, sci-fi portal ring, hologram or floating glass UI.

## Geometry / parts
Keep these regions separate where possible:
- `ExitFrame_Shell`
- `ExitFrame_Bezel`
- `ExitFrame_Glass`
- `ExitFrame_Hinge_L`
- `ExitFrame_Hinge_R`
- `ExitFrame_LED`
- `ExitFrame_Badge`
- `ExitFrame_Rear`
- `ExitFrame_Feet`

The landscape itself should NOT be permanently baked if avoidable. Prefer a separate screen/glass material region so the website can render the final landscape dynamically.

## Web delivery
- GLB / glTF 2.0
- approximate physical width: 1.1–1.35 m
- pivot centered near the physical center of mass
- clean normals and UVs
- no background/floor/shadow plane baked into the asset
- preferred triangle budget: 45k–85k
- hard pre-optimization ceiling: ~120k
- 2K shell/glass textures; 1K secondary details
- KTX2/Basis preferred
- target optimized GLB <= 5–6 MB

## Website movement
The final scene should remain calm.

Scroll:
- slight 2–3% screen push-in
- orange sun may rise a few pixels and scale subtly
- shadow compresses slightly as the object feels closer

Pointer:
- the existing site can keep its very small whole-frame parallax
- no extra continuous rotation

Do not bake looping model animation.

## Screen content strategy
The screen/glass must support website-driven content.
Recommended live layers:
- muted landscape gradient
- dark foreground mountain silhouette
- orange sun disc
- subtle glass reflection / scanline only inside screen

Do not bake contact text, social links or CTA copy into the GLB.

## Tripo prompt
A premium physical exit display device for a creative studio called MOVX, wide early-2000s industrial-design screen frame, warm off-white semi-matte injection-molded ABS housing, dark graphite recessed bezel, smoked glass display, compact realistic thickness, softened rectangular corners, subtle side hinge details, tiny orange status LED, restrained MOVX product badge, believable rear construction and seams, refined Y2K professional creative hardware, calm minimal object, neutral product material definition, no background, no floor, no sci-fi portal ring, no cyberpunk, no RGB gaming lights, no hologram, no floating UI, no excessive buttons or text.

## Negative prompt
cyberpunk, portal ring, spaceship window, hologram, RGB, neon frame, floating glass panel, browser UI, futuristic HUD, gamer monitor, glossy chrome body, transparent full shell, toy, cartoon, steampunk, dirty grunge, rust, broken screen, excessive buttons, excessive cables, random labels.

## Runtime contract
Website slot: `data-model-slot="closing-window"`

Runtime object:
`window.MOVX3D.slots['closing-window']`

Fallback stays visible until a real renderer explicitly calls `replaceWith(rendererElement)`. Use `restoreFallback()` on model/render failure.
