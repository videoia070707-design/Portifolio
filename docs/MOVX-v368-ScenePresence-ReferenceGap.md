# MOVX v368 — Scene-wide Presence / Reference Gap

## Scope

This phase remains strictly limited to **Scene 01 and the approved CRT television**. No second production 3D asset is activated, published or staged.

References reinforced for the decision:

- HAOQI.DESIGN — https://haoqi.design/
- HAOQI technical case study — https://tympanus.net/codrops/2026/08/15/inside-haoqi-design-letting-dom-and-webgl-share-a-retro-futurist-stage/
- Amir VL / 0110 — https://amirvl.com/
- 0110 3D scroll reference — https://www.awwwards.com/inspiration/3d-scroll-animation-0110-studio-portfolio-web
- Joseph Santamaria — https://joseph-san.com/
- Joseph technical case study — https://tympanus.net/codrops/2026/04/28/more-than-a-portfolio-building-a-scroll-driven-3d-world-with-something-to-say/

## The remaining interaction gap after v367

v367 solved the largest architectural problem in the first scene: camera, CRT staging, lights, typography, channels and scroll now resolve inside one authored frame rather than behaving like disconnected effects.

A subtler problem remained.

The cinematic pointer state still originated from **v366 CRT presence**, whose pointer listeners and raycast are intentionally bound to `.crt-wrap`. That is correct for physical TV interaction, but it means the cinematic world only fully notices the visitor after the cursor reaches the television.

So a visitor could move across the headline, copy and channel interface while the camera/light/type layer stayed comparatively inert.

That still reads as:

> “this object becomes interactive when I hover it.”

The reference-level feeling is closer to:

> “the scene knows where I am before I touch the object.”

## What the references suggest

### HAOQI: pointer position is shared scene state

The HAOQI case study describes a global PointerBus that converts pointer coordinates once and shares them with DOM and WebGL consumers. It also resets that state on leave/blur/hidden-tab conditions.

The transferable principle is not “copy their cursor effect.” It is that **visitor position belongs to the experience, not to one widget**.

### Joseph Santamaria: input moves through a world

Joseph's portfolio treats scroll/input as a way to travel through authored scenes. Camera, objects and reveal timing are coordinated so interaction reads as navigation through a place rather than independent hover effects on components.

### Amir / 0110: presence before utility

The 0110 work is staged so 3D content determines the visual field. The interaction does not need to wait for a conventional component boundary before the environment feels alive.

## v368 architecture

v368 separates two jobs that were previously coupled:

### 1. Scene presence — new

`v368-scene-presence.mjs` listens at `#boot .scene-inner` and produces a normalized scene state:

- pointer X/Y
- scene-presence mix
- bounded pointer velocity
- enter/leave state
- reset on scene leave
- reset on window blur
- reset when the document becomes hidden

This state is updated **inside the existing v322 render frame**.

It creates:

- no new WebGL renderer
- no new WebGL context
- no new Three.js scene
- no new model
- no new requestAnimationFrame loop

### 2. CRT physical presence — preserved

v366 remains responsible for the actual television hit/raycast behavior.

That means moving across text can affect the cinematic camera/light/type field, while actually reaching the CRT still activates the physical object response.

The two systems therefore have different semantics:

| Layer | Meaning | Surface |
| --- | --- | --- |
| v368 scene presence | “the visitor entered/moved through Scene 01” | whole `.scene-inner` |
| v366 CRT presence | “the visitor is physically over the television” | CRT wrapper + real model raycast |

## v367 director integration

The v367 director now prefers v368 scene presence when available.

Scene-wide state drives only the cinematic composition:

- Three.js camera X/Y
- camera look-at
- light positions
- headline counter-parallax
- copy/panel depth response
- subtle bounded velocity inertia

Direct CRT manipulation still has priority. While the user is dragging the cabinet or screen, automatic camera parallax is suppressed so the scene does not fight the explicit gesture.

## Why this is a more meaningful immersion change

This phase deliberately does **not** add another visible effect, decorative model or HUD.

Instead it removes an interaction boundary.

Before v368:

1. visitor moves over copy — mostly static scene
2. visitor reaches TV — scene wakes up
3. visitor leaves TV — scene settles

After v368:

1. visitor enters Scene 01 — environment notices them
2. typography/light/camera respond across the composition
3. visitor reaches TV — physical CRT response layers on top
4. visitor leaves Scene 01 — spatial state decays cleanly

The result should make the CRT feel less like an embedded product viewer and more like the spatial anchor of a small MOVX environment.

## Performance and accessibility gates

- sole published GLB remains `models/movx-crt-tv.glb`
- sole active 3D slot remains `boot-tv`
- later models remain deferred/unpublished
- coarse/touch pointers do not run continuous scene parallax
- `prefers-reduced-motion` suppresses continuous scene presence
- GLB budget remains 1.6 MB
- v368 scene-presence runtime budget: 10 KB
- one renderer/context/RAF remains the production contract

## Approval criterion before another 3D model

Scene 01 is not ready to hand off merely because the TV itself can rotate, scrub or change channel.

The approval criterion is perceptual:

> Moving through the first screen should feel like moving through one reactive composition even before the cursor touches the television.

Only after that feeling is stable should the project progress to another 3D asset.
