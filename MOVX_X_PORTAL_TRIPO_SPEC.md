# MOVX X Portal / Tunnel — Production Spec v316

## Storyboard role
Scene 03 / ENTER THE X. The orange X from the physical MOVX logo becomes architecture. The transition must feel continuous: identity turns into space.

## Primary form
- A large sculptural X-shaped portal, not a circular sci-fi gate.
- The outer silhouette must clearly inherit the MOVX X proportions.
- The negative spaces inside the X become the entrance into a short tunnel / spatial corridor.
- The portal should feel manufactured from modular creative-hardware panels, not fantasy stone or cyberpunk machinery.

## Materials
1. Main X shell: MOVX orange molded/composite panels with moderate roughness, subtle edge wear only at physically plausible seams.
2. Inner tunnel: charcoal/graphite structural ribs with low gloss.
3. Accent surfaces: restrained off-white / aluminium details only where useful for orientation.
4. No RGB strips, neon tubes, holographic surfaces, chrome-heavy panels or random sci-fi decals.

## Mesh hierarchy
- `PortalRoot`
- `PortalX_Frame`
- `PortalX_InnerCut`
- `TunnelSegment_01`
- `TunnelSegment_02`
- `TunnelSegment_03`
- `TunnelSegment_04`
- optional `Panel_A..N`
- optional `LightBounce_Orange` as geometry only if genuinely needed; lighting should preferably stay website-side.

## Geometry / scale
- Portal overall width: ~4.0 m.
- Portal overall height: ~4.0 m.
- Tunnel depth: ~7–10 m.
- Entrance remains readable as an X from a front three-quarter view.
- Pivot at portal center.
- Keep tunnel segments modular and aligned along a clean forward axis.

## Web performance
- Preferred geometry: 55k–110k triangles.
- Hard ceiling before optimization: 170k triangles.
- Reuse materials across tunnel segments.
- Prefer 2K atlas for portal, 1K for repeating tunnel panels.
- Target optimized GLB under ~6–8 MB.

## Motion strategy
Do not bake a continuous fly-through animation.
The website controls camera and scroll progression.
- Entry: X starts as a large object in front of camera.
- Scroll: camera advances through the negative space of the X.
- Tunnel segments provide parallax and depth.
- Pointer: very subtle yaw/pitch influence only.
- No infinite rotation or vortex effect.

## Tripo prompt
A large architectural X-shaped portal derived from a premium MOVX wordmark, sculptural orange industrial-design gateway opening into a short modular tunnel, bold X silhouette, saturated MOVX orange composite shell, charcoal graphite tunnel ribs, subtle off-white and brushed aluminium functional details, premium Y2K creative-technology studio hardware language, physically believable manufactured panel seams, modular corridor construction, clean product-architecture design, immersive but minimal, strong front silhouette, no circular portal, no cyberpunk clutter, no neon RGB, no fantasy stone, no spaceship cockpit, no random warning stickers, no background environment beyond the integrated tunnel.

## Negative prompt
circular stargate, ring portal, vortex, cyberpunk, neon tunnel, RGB strips, spaceship, weapon, fantasy ruin, stone arch, chrome mirror, holographic, liquid metal, excessive cables, dense machinery, random labels, gamer aesthetic, glowing runes, sci-fi HUD, organic monster tunnel.

## Integration contract
Website slot: `data-model-slot="x-portal"`.
The v316 DOM fallback remains visible until the production renderer reports successful model load. On failure, call `restoreFallback()`.

## Continuity requirement
The final `PortalX_Frame` should preserve visual proportions close enough to the Scene 02 `Letter_X` mesh that the handoff can be aligned without a visible shape jump.
