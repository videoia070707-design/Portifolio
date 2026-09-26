# MOVX Physical Logo — Production Spec v315

## Role in the storyboard
Scene 02 / HERO. The logo is not a flat wordmark pasted into the page. It is a designed physical object: a compact sculptural identity piece that feels manufactured for the MOVX studio.

## Core visual idea
- Four individual letter bodies: M O V X.
- M/O/V: warm off-white molded material, slightly aged but clean.
- X: signature MOVX orange (#ff5a18), visually dominant but not oversized.
- Each letter has real depth and weight; avoid paper-thin extrusion.
- The object should look like a photographed industrial-design prototype rather than a glossy logo render.
- Subtle variation in depth/rotation between letters is allowed so the object feels assembled rather than computer-perfect.

## Materials
1. Main letters: injection-molded ABS / polyurethane prototype plastic, warm off-white, semi-matte, roughness around 0.48–0.62.
2. X letter: orange molded polymer, slightly richer satin finish, roughness around 0.38–0.50.
3. Optional small hardware: muted brushed metal, never chrome-heavy.
4. No glassmorphism, holographic material, iridescent rainbow, carbon fiber or gamer RGB.

## Geometry
- Thick chamfered letterforms with rounded industrial edges.
- Front faces remain close to the approved MOVX wordmark proportions.
- Realistic rear wall thickness and small bevels.
- Tiny seam lines or prototype assembly marks are acceptable.
- No pedestal baked into the model.
- Keep the silhouette readable at mobile sizes.

## Suggested hierarchy / mesh names
- `LogoRoot`
- `Letter_M`
- `Letter_O`
- `Letter_V`
- `Letter_X`
- `Badge` (optional)
- `Hardware_A`, `Hardware_B` (optional)

## Real-world scale / transforms
- Approx total width: 1.15 m.
- Approx overall height: 0.43 m.
- Approx depth: 0.12–0.18 m depending on the letter.
- Pivot centered around the complete assembled logo's center of mass.
- Front of logo must be clearly documented and consistent.

## Web budget
- Preferred total: 30k–65k triangles.
- Hard ceiling before optimization: 100k triangles.
- 2K shared texture atlas is enough; 1K secondary texture if separate.
- Prefer clean PBR and KTX2/Basis compression in production.
- Target optimized GLB: under 3–5 MB.

## Movement controlled by website
Do not bake a continuous spinning animation.
- Pointer: subtle yaw ±3° and pitch ±1.5°.
- Scroll: gentle 2°–4° yaw drift and approximately 2–3% scale change.
- Optional enter animation: 14–22 px settle on Y + mild 2° rotation correction.
- Keep movement soft and weighted; this object should feel physically heavy.

## Lighting intent
Website-side lighting should mimic a premium product still:
- large soft key from upper-left/front;
- dimmer fill from right;
- restrained warm/orange bounce near X;
- soft contact shadow underneath;
- no dramatic neon rim lights.

## Tripo prompt
A premium physical wordmark sculpture reading MOVX as four separate thick 3D letters, industrial product design object for a creative technology studio, M O V made from warm off-white injection-molded ABS plastic with semi-matte finish, X made from saturated MOVX orange molded polymer, compact thick chamfered geometry, softened industrial edges, believable manufactured wall thickness, subtle prototype seams and tiny assembly details, premium Y2K early-2000s creative hardware aesthetic, product-photography quality, tactile and physically believable, slight individual depth variation between letters, neutral studio-object construction, no background, no pedestal, no neon, no glossy chrome, no RGB, no holographic material, no floating UI, no extra text, no random symbols.

## Negative prompt
flat logo, thin extrusion, chrome, mirror finish, holographic, glass logo, neon, cyberpunk, RGB gaming, sci-fi weapon, toy, inflatable letters, bubbly cartoon type, graffiti, graffiti stickers, distressed grunge, rust, random labels, extra words, pedestal, environment, background scene, excessive bevels, liquid metal.

## Integration contract
Website slot: `data-model-slot="hero-movx-logo"`.
Current v315 exposes `window.MOVX3D.slots['hero-movx-logo']` and keeps a DOM physical-object fallback active until the final GLB is loaded.

The production GLB should replace the fallback only after successful renderer/model load. If loading fails, restore the DOM fallback so the hero never becomes visually empty.
