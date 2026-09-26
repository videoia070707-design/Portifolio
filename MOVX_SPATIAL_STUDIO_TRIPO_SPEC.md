# MOVX — Spatial Studio / Tripo Production Spec

## Role
Scene 06 / SPATIAL STUDIO.

A complete small creative studio environment that feels physically plausible, premium and unmistakably MOVX. The room should look like a real early-2000s-to-modern creative workspace interpreted through the MOVX Y2K product language — not a sci-fi control room.

## Spatial composition
- medium-width studio room, wider than deep
- one primary back wall with three physical displays
- central low creative desk
- two chairs
- restrained ceiling structure / light rail
- clean floor plane with material variation, not a decorative grid
- enough side-wall depth for a subtle 15–25 degree camera orbit
- camera should feel at human eye level, slightly low and immersive

## Materials
1. Warm off-white / light-grey wall panels
2. Warm grey floor with satin/matte finish
3. Graphite desk structure
4. Dark graphite / charcoal chair upholstery
5. Smoked display glass
6. Brushed aluminium only for small structural pieces
7. MOVX orange `#ff5a18` only as a restrained light/status accent

Avoid bright neon strips, cyberpunk lighting, mirrored floors, transparent glass walls, HUD overlays and decorative grid lines.

## Architecture
### Back wall
- three recessed or mounted physical displays
- subtle panel seams
- small MOVX product/environment badge
- displays should be separate meshes/material regions for live website content later

### Desk
- low wide creative desk
- graphite/dark body
- believable leg structure
- minimal cable channel / underside detail
- no giant workstation clutter

### Chairs
- two compact creative-studio chairs
- dark graphite upholstery/polymer
- restrained Y2K industrial form
- not gaming chairs

### Ceiling
- simple physical soffit / rail
- one soft linear practical light source
- no futuristic light tunnel

### Floor
- continuous matte floor plane
- subtle roughness/material change only
- no checker/grid decorative lines

## Suggested mesh naming
- `Room_Shell`
- `Wall_Back`
- `Wall_Side_L`
- `Wall_Side_R`
- `Ceiling`
- `Floor`
- `Desk_Top`
- `Desk_Frame`
- `Chair_01`
- `Chair_02`
- `Display_01`
- `Display_02`
- `Display_03`
- `DisplayGlass_01`
- `DisplayGlass_02`
- `DisplayGlass_03`
- `Light_Rail`
- `Badge_MOVX`
- `Cable_Channel`
- `Small_Props`

## Web delivery
- GLB / glTF 2.0
- real-world width around 5.5–7 m
- origin/pivot near room center at floor level
- separate displays essential
- clean normals, UVs and lightmap-friendly topology
- preferred triangle budget: 120k–220k
- hard pre-optimization ceiling: ~300k
- 2K textures for main architectural surfaces, 1K secondary props
- KTX2/Basis preferred
- target optimized GLB <= 10–12 MB

## Website camera behavior
The site controls the camera/environment motion.

Pointer:
- horizontal camera drift / yaw approx ±1°
- vertical pitch approx ±0.8°

Scroll:
- subtle 1–2% dolly/scale forward
- wall/screens may move slightly relative to foreground for depth
- desk remains visually grounded
- no room spin or continuous orbit

## Lighting direction
- soft neutral ambient light
- warm practical ceiling light
- one restrained orange warm cast from side/right
- displays can emit very low neutral/orange light when active
- realistic falloff, no bloom-heavy neon

## Screen strategy
Do not bake portfolio images, interface text or final graphics into screen textures.
Keep the three screen surfaces separate so website content can be mapped later.

## Tripo prompt
A premium compact creative studio interior for MOVX, believable early-2000s inspired industrial design translated into a modern creative workspace, warm off-white wall panels, soft grey matte floor, dark graphite low central desk, two compact dark creative chairs, three recessed physical widescreen displays on the back wall, subtle panel seams and brushed aluminium details, one restrained ceiling light rail, tiny orange MOVX status accent, physically plausible proportions and construction, refined Y2K professional design studio, clean material definition, no background outside the room shell, no cyberpunk, no RGB gaming lights, no futuristic control room, no decorative grid floor, no excessive props, no glassmorphism, no neon tunnel.

## Negative prompt
cyberpunk, RGB gaming room, gamer chair, spaceship bridge, futuristic command center, hologram, HUD, neon strips, grid floor, checker floor, mirrored floor, transparent walls, nightclub, arcade, clutter, excessive cables, excessive screens, toy proportions, cartoon, dirty grunge, rust, industrial warehouse, sci-fi corridor.

## Runtime contract
Website slot: `data-model-slot="spatial-studio"`

Runtime object:
`window.MOVX3D.slots['spatial-studio']`

DOM fallback stays visible until `replaceWith(rendererElement)` succeeds. Use `restoreFallback()` if loading/rendering fails.
