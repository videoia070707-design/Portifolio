# MOVX CRT / TV Y2K — Production Spec v314

## Role in the storyboard
Scene 01 / BOOT. This is the first physical object seen in the MOVX experience. It must feel like a real designed product from a near-future Y2K creative studio, not a generic retro television.

## Silhouette
- Compact CRT body with a deep rear shell, softened industrial corners and slightly asymmetrical product-design details.
- Front face wider than tall, with a convex glass screen occupying roughly 68–72% of the front surface.
- Body stance should feel heavy and physical, with a slight forward visual bias.
- Avoid toy proportions, sci-fi weapons, excessive vents, exposed cables or cyberpunk clutter.

## Materials
1. Main shell: warm off-white / light grey ABS plastic, semi-matte, subtle micro-roughness, very light age variation but no dirty/grunge look.
2. Screen bezel: darker graphite plastic with a restrained satin finish.
3. Screen: convex smoked glass with controlled reflections and slight green/blue tint only in reflection.
4. Controls: graphite / dark grey injection-molded plastic.
5. Accent: MOVX orange (#ff5a18) limited to the power/status light and one discreet product mark.
6. Small metal parts: brushed aluminium only where functionally plausible.

## Front details
- Convex CRT glass.
- Compact power button on lower-right area.
- Tiny orange status LED.
- Minimal MOVX badge / engraved mark.
- 2–3 small functional ports in lower-left or lower-front zone.
- No large fake UI labels, no gamer RGB, no random warning stickers.

## Side / rear details
- Vertical or horizontal ventilation slots concentrated on one side and a smaller secondary vent group.
- Recessed rear power/socket area.
- One believable cable exit point.
- Rear geometry must remain clean enough to look good during a 20–30 degree orbit.

## Modeling requirements for web
- Output: GLB / glTF 2.0.
- Prefer a single object hierarchy with named child meshes rather than one fused mesh.
- Suggested child mesh names: `Shell`, `ScreenGlass`, `ScreenBezel`, `PowerButton`, `StatusLED`, `Ports`, `Vent_A`, `Vent_B`, `Badge`, `CablePort`.
- Keep real-world scale consistent. Approx target width: 0.62 m.
- Pivot centered near the physical center of mass, not at the floor.
- Front direction must be documented and consistent.
- Clean normals and UVs.
- No baked background or floor.

## Web performance target
- Preferred visible geometry: 45k–90k triangles.
- Hard ceiling before optimization: 150k triangles.
- 2K textures are sufficient for the shell and glass; use 1K for secondary parts where possible.
- Prefer KTX2/Basis compressed textures for production export.
- Target final GLB under ~5–7 MB after optimization.

## Required movement
The site controls movement; the model itself should remain largely static.
- Slow pointer parallax: about ±2° pitch and ±3° yaw.
- Scroll: a subtle 2–4° yaw drift and 1–2% scale change through Scene 01.
- Power-on event: screen emission rises from 0 to final state, orange LED turns on, optional extremely subtle chassis vibration under 250 ms.
- No continuous rotation.
- No floating/spinning product animation.

## Screen strategy
Do not bake the final MOVX boot UI into the model texture. The website already owns the live boot content. The preferred production setup is:
1. model provides `ScreenGlass` / bezel geometry;
2. website overlays or projects the live MOVX screen content;
3. scanlines and CRT vignette remain restricted to the screen surface.

## Tripo image/text prompt
A premium Y2K industrial-design CRT monitor for a creative studio called MOVX, front three-quarter product view, compact deep CRT body, warm off-white injection-molded ABS shell, softened rectangular geometry, convex smoked glass screen, dark graphite bezel, small tactile power button, tiny orange status LED, discreet MOVX product badge, minimal functional ports, clean side ventilation slots, realistic 2000s consumer-electronics construction, refined Dieter-Rams-meets-early-2000s creative hardware feeling, physically believable seams and panel breaks, studio product-design quality, neutral material definition, no background, no cyberpunk clutter, no RGB gaming lights, no excessive stickers, no text except a tiny MOVX badge, no futuristic weapon details, no toy proportions.

## Negative prompt
cyberpunk, gamer RGB, spaceship, robot, weapon, excessive cables, dirty grunge, rust, damaged plastic, toy, cartoon, transparent full body, neon edge lights, HUD graphics, random labels, excessive buttons, overcomplicated vents, steampunk, glossy chrome body, extreme fisheye.

## Integration contract
Website slot: `data-model-slot="boot-tv"`.
Current v314 fallback remains active until the real GLB renderer is attached. The v314 runtime exposes `window.MOVX3D.slots['boot-tv']` so the actual renderer can replace or overlay the fallback without changing the storyboard DOM.
