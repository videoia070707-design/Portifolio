# MOVX — Playground Props / Tripo Production Spec

## Role
Scene 05 / ZERO GRAVITY PLAYGROUND.

This is a coordinated Y2K creative-object set, not a random collection of generic icons. Every object must feel like it came from the same MOVX product family.

## Shared art direction
- early-2000s industrial / creative hardware language
- warm off-white ABS, graphite polymer, restrained brushed metal
- MOVX orange `#ff5a18` as a limited accent
- softened physical edges
- believable seams, screws and manufacturing logic
- no cyberpunk, RGB gaming, glassmorphism or floating HUD styling
- slightly playful proportions, but still plausible physical products
- clean enough for close-up web interaction

## Objects

### 1. Cassette — `play-cassette`
Compact physical audio cassette.
- cream ABS shell
- dark graphite tape window
- two visible reels
- restrained MOVX product mark
- small orange indexing mark only
- do not bake large typography into the shell

Preferred meshes:
- `Cassette_Shell`
- `Cassette_Window`
- `Cassette_Reel_L`
- `Cassette_Reel_R`
- `Cassette_Label`

Target: 15k–28k triangles.

### 2. Camera — `play-camera`
Compact early-2000s creative DV / digital camera hybrid.
- cream + graphite body
- large physical lens on one side
- small tactile REC control
- believable grip and seams
- not a cinema camera and not a smartphone

Preferred meshes:
- `Camera_Body`
- `Camera_Lens`
- `Camera_LensGlass`
- `Camera_Button_REC`
- `Camera_Grip`
- `Camera_Ports`

Target: 25k–45k triangles.

### 3. X Cube — `play-cube`
A solid MOVX orange physical identity cube.
- orange molded polymer body
- softened corners
- shallow recessed / raised X detail
- subtle physical imperfections only
- no glowing neon edges

Preferred meshes:
- `Cube_Body`
- `Cube_X`

Target: 8k–18k triangles.

### 4. CD — `play-cd`
Physical compact disc / mini creative archive disc.
- silver-iridescent reflective surface
- physically correct center hole
- subtle MOVX mark
- reflection may carry a faint warm/orange cast but must not become rainbow neon

Preferred meshes:
- `CD_Disc`
- `CD_Print`

Target: 5k–12k triangles.

### 5. Portable Screen / Window — `play-window`
Small physical portable display object inspired by early-2000s creative devices.
- cream top housing
- graphite recessed screen
- small hardware controls
- more like a portable monitor / mini workstation than a floating software window
- screen must be a separate material region for live website content later

Preferred meshes:
- `Window_Chassis`
- `Window_Screen`
- `Window_Controls`
- `Window_Feet`

Target: 18k–35k triangles.

## Common web requirements
- GLB / glTF 2.0
- individual exports preferred, one asset per prop
- pivots centered near each object's center of mass
- no baked floor/background/shadow plane
- clean normals and UVs
- 1K textures are enough for most props; 2K only for camera if necessary
- KTX2/Basis preferred
- individual optimized GLBs should preferably stay under ~2.5 MB each

## Website movement
The current website already owns drag and idle float behavior. Do not bake looping animation into the models.

Expected behavior:
- subtle idle bob from website runtime
- direct pointer drag
- object remains where user places it
- no auto-spin
- no uncontrolled physics bounce

## Tripo prompts

### Cassette
Premium early-2000s physical audio cassette for MOVX creative studio, warm off-white injection-molded ABS shell, dark graphite tape window, two realistic reels, subtle industrial product seams, tiny restrained orange indexing accent, refined Y2K creative hardware aesthetic, believable consumer-electronics construction, no background, no neon, no cyberpunk, no toy styling.

### Camera
Premium compact early-2000s digital DV creative camera for MOVX studio, warm off-white and graphite polymer body, large realistic circular lens, smoked lens glass, tactile REC button, subtle orange status accent, believable grip, seams and small I/O details, refined Y2K professional creative hardware, no background, no smartphone, no cinema rig, no RGB, no cyberpunk.

### X Cube
Solid molded MOVX identity cube, premium orange polymer body, softened industrial corners, shallow physical X detail, restrained product-design finish, subtle micro roughness, believable manufactured object, no glow, no neon edges, no transparent body, no background.

### CD
Premium physical compact disc for MOVX creative archive, realistic silver iridescent optical surface, correct center hole, subtle restrained MOVX print mark, clean early-2000s design object, physically believable reflections, no background, no exaggerated rainbow neon, no holographic HUD.

### Portable Screen
Premium small early-2000s portable creative monitor for MOVX studio, warm off-white ABS chassis, dark graphite recessed display, compact physical controls, subtle orange status accent, believable seams and feet, refined Y2K creative hardware, separate screen surface, no background, no floating software UI, no cyberpunk, no RGB gaming lights.

## Shared negative prompt
cyberpunk, gamer RGB, spaceship, weapon, transparent gadget, hologram, floating HUD, smartphone, glossy chrome, excessive labels, random text, neon strips, toy, cartoon, steampunk, dirty grunge, rust, broken device, excessive cables, unrealistic buttons.

## Runtime contracts
- `window.MOVX3D.slots['play-cassette']`
- `window.MOVX3D.slots['play-camera']`
- `window.MOVX3D.slots['play-cube']`
- `window.MOVX3D.slots['play-cd']`
- `window.MOVX3D.slots['play-window']`

The DOM fallback remains until each individual renderer calls `replaceWith(rendererElement)`. Props can therefore migrate to GLB one at a time.
