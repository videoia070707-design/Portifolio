# MOVX — Creative Machine / Tripo Production Spec

## Role
Scene 04 / CAPABILITIES. A physical modular creative processor that represents the four MOVX capabilities already present in the website: Art Direction, Motion, AI Creative and Interactive.

The machine must feel like believable early-2000s creative hardware, not a futuristic gaming console.

## Core silhouette
- low, wide modular desktop/rack unit
- four removable front modules/cartridges arranged in one chassis
- softened industrial corners
- substantial physical weight and believable depth
- top carry/structural rail integrated into the body
- front face wider than tall
- avoid symmetrical sci-fi spaceship styling

## Materials
1. Warm off-white / light-grey semi-matte ABS outer chassis
2. Graphite/dark satin module faces
3. Smoked dark glass for the four screens
4. Brushed aluminium only on knobs, screws or small structural details
5. MOVX orange `#ff5a18` restricted to status LEDs, tiny marks and subtle active accents
6. Black rubber or dark polymer feet / seams

No RGB gradients, transparent body, holographic panels, chrome shell or gamer lighting.

## Front architecture
Four modules must remain visually independent:
- `Module_ArtDirection`
- `Module_Motion`
- `Module_AI`
- `Module_Interactive`

Each module needs:
- one recessed smoked display
- 2–3 tactile controls / knobs
- a small engraved identifier zone
- small status LED
- believable seams so it appears removable

The full chassis needs:
- top structural rail
- small MOVX product badge
- four corner screws / fasteners
- discreet ventilation
- lower status strip

## Rear / side
- restrained ventilation slots
- believable power/data sockets
- recessed cable area
- no giant exposed cables
- enough detail for a 15–25 degree orbit

## Mesh naming
Keep separate meshes where practical:
- `Machine_Chassis`
- `Top_Rail`
- `Module_ArtDirection`
- `Module_Motion`
- `Module_AI`
- `Module_Interactive`
- `Screen_01`
- `Screen_02`
- `Screen_03`
- `Screen_04`
- `Knobs`
- `Status_LEDs`
- `Badge`
- `Ports`
- `Vents`
- `Feet`

## Web delivery
- GLB / glTF 2.0
- approximate width: 1.25 m
- pivot near physical center of chassis
- clean normals and UVs
- no baked floor, background, studio lights or shadow plane
- preferred triangle budget: 70k–130k
- hard pre-optimization ceiling: ~180k
- 2K textures for chassis/front modules, 1K secondary maps
- KTX2/Basis preferred in production
- target optimized GLB: <= 8 MB

## Website movement
The site owns almost all movement.

Pointer:
- yaw approximately ±2°
- pitch approximately ±1.5°

Scroll:
- subtle 1–2° orientation drift
- sequential activation of the four modules
- active module may translate forward only 1–2 cm in 3D space
- screen emission rises on active module
- no continuous rotation or floating

## Screen behavior
Do not bake final UI text or website copy into the texture.
The displays should be separate meshes/material regions so the website can add live screen content later.

## Tripo prompt
A premium modular early-2000s creative workstation hardware device for a design studio called MOVX, low wide industrial desktop processor with four removable front modules, warm off-white semi-matte injection-molded ABS outer chassis, dark graphite satin module faces, four recessed smoked-glass displays, tactile aluminium and graphite rotary knobs, small orange status LEDs, discreet MOVX industrial badge, top structural carry rail, believable seams, screws, ventilation and rear I/O, refined Y2K professional creative equipment, physical product design quality, functional believable construction, slightly softened rectangular geometry, neutral product material definition, no background, no floor, no cyberpunk styling, no RGB gaming lights, no transparent shell, no holographic UI, no excessive text, no toy proportions.

## Negative prompt
cyberpunk, gamer RGB, spaceship, weapon, robot, transparent computer, hologram, neon strips, extreme sci-fi, toy, cartoon, glossy chrome shell, excessive buttons, random labels, steampunk, dirty grunge, rust, damaged hardware, huge cables, floating components, excessive vents, futuristic HUD, arcade machine.

## Integration contract
Website slot: `data-model-slot="creative-machine"`

Runtime contract:
`window.MOVX3D.slots['creative-machine']`

The DOM fallback remains visible until a renderer explicitly calls `replaceWith(rendererElement)`. On failure, call `restoreFallback()`.
