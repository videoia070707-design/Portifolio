# MOVX v367 — Scene 01 Immersion Audit

## Scope

This audit is intentionally restricted to **Scene 01 / the approved CRT television**. No other MOVX 3D model is activated, redesigned or staged in this phase.

References reinforced for this pass:

- HAOQI.DESIGN — https://haoqi.design/
- HAOQI technical case study — https://tympanus.net/codrops/2026/08/15/inside-haoqi-design-letting-dom-and-webgl-share-a-retro-futurist-stage/
- Amir VL / 0110 — https://amirvl.com/
- 0110 3D scroll reference — https://www.awwwards.com/inspiration/3d-scroll-animation-0110-studio-portfolio-web
- Joseph Santamaria — https://joseph-san.com/
- Joseph technical case study — https://tympanus.net/codrops/2026/04/28/more-than-a-portfolio-building-a-scroll-driven-3d-world-with-something-to-say/

## Core diagnosis

The current MOVX CRT already has technically meaningful interactions: a live screen, channel switching, direct screen manipulation, knob interaction, cabinet drag, channel physics, pointer presence, scroll choreography and a clean real-TV poster while the GLB loads.

The remaining immersion gap is therefore **not a lack of effects**. It is a lack of a single authored scene response.

Before v367 the visitor could still read the experience as:

> page + text column + interactive 3D product

The references more often read as:

> one environment in which typography, camera, object, light and input all belong to the same shot

That distinction is the main target of v367.

## What HAOQI teaches MOVX

### 1. Shared state matters more than effect count

HAOQI's case study describes moving scroll and WebGL onto the same frame source after independent loops produced visible one-frame slippage during fast scroll. It also describes a global PointerBus so the same pointer coordinates can drive DOM, camera parallax, lighting and WebGL effects.

**MOVX gap:** Scene 01 accumulated several successful interaction layers over multiple versions. They share one renderer, but their conceptual ownership is still fragmented: scroll, pointer presence, channel semantics and manual manipulation were implemented as separate capabilities.

**v367 response:** add one Scene 01 director inside the existing v322 render frame. It consumes the already validated state from those systems and resolves the final camera/object/light/DOM composition. v367 adds no renderer, WebGL context, RAF or pointer listener.

### 2. DOM and WebGL should have different jobs, but look like one system

HAOQI keeps structure/accessibility in DOM and uses WebGL where optical behavior adds value. The important part is not forcing everything into WebGL; it is synchronizing the two layers.

**MOVX response:** keep the headline, copy and semantic channel buttons as accessible DOM. Make them respond to the same Scene 01 state as the CRT rather than turning them into another WebGL texture.

### 3. One visual grammar beats many unrelated effects

HAOQI repeats a small optical language across loading, hover, transitions and highlights. This gives the site identity even when implementations differ.

**MOVX response:** use one warm filmed-light / CRT-tuning grammar. Avoid generic HUDs, neon grids, floating cards and extra decorative 3D objects.

## What Joseph Santamaria teaches MOVX

### 1. A section should behave like a shot, not a block

Joseph maps scroll to camera movement, object animation and reveal timing so the user feels like they are moving through a place.

**MOVX gap:** earlier Scene 01 scroll mostly moved the CRT wrapper and faded the copy. The 3D camera itself remained conservative.

**v367 response:** Scene 01 now has an actual camera path:

1. boot/focus
2. approach/presence
3. channel hold
4. handoff/recede

The CRT stays within safe framing; immersion comes from the viewer position changing, not from scaling the television until it crops.

### 2. Input needs one coherent meaning

Joseph uses unified input handling and carefully tuned thresholds/easing so scroll, touch and trackpad feel like one experience.

**MOVX response:** v367 does not create a new input mechanism. Pointer data comes from the already validated CRT presence state; manual cabinet/screen manipulation remains higher-priority and suppresses camera parallax while active.

### 3. Transitions are authored events

The Joseph case study treats opening a project as part of the experience rather than a generic click/fade.

**MOVX response in this phase:** the end of Scene 01 is now a composed handoff: camera, CRT depth, typography and environment resolve together before the next section. No Scene 02 model is activated yet.

## What Amir VL / 0110 teaches MOVX

Awwwards identifies the 0110 portfolio specifically around immersive scenes, 3D scroll animation, Three.js and shader-driven interaction, including desktop/mobile variants and a dedicated 3D page.

The strongest transferable lesson is **presence and staging**: the 3D content is not treated as a small product viewer embedded beside conventional UI. It is allowed to determine the composition and the motion of the page.

**MOVX response:** the CRT stays large and compositionally dominant, but the copy column now counter-reacts to it. Channel UI is redesigned as an editorial tuning strip rather than four generic UI cards, and its detail panel becomes a compact scene caption/control deck.

## Why MOVX previously felt less immersive

| Area | Before v367 | Reference-level behavior | v367 direction |
| --- | --- | --- | --- |
| Camera | Mostly static with modest pointer parallax | Camera participates in the experience | Real scroll + pointer + channel camera path |
| CRT | Interactive object | Spatial anchor of the scene | CRT remains anchor but no longer acts alone |
| Typography | Beside the CRT | Shares depth/timing with scene | Counter-parallax and channel offsets after intro |
| Background | Reactive gradient backdrop | Environment/light field | Light field shares pointer/channel/scroll state |
| Channels | Functional buttons + panel | Input changes the scene | Same channel state affects screen, object, camera, light and type |
| Scroll | Wrapper translation + copy fade | Authored shot progression | boot → presence → channel → handoff |
| Loading | Real poster fixed the fake CRT problem | Loading belongs to visual language | Keep real-TV poster; no procedural normal-path proxy |
| Mobile | Separate simplified flow | Purpose-built lower-cost experience | Natural flow + semantic channels; hover camera disabled |
| Performance | GLB optimized, QA timing brittle | Visual fallback + explicit budget | 1.6 MB GLB budget + authored poster contract + hard CI ceiling |

## v367 implementation rules

- exactly one published production GLB: `movx-crt-tv.glb`
- exactly one active model slot: `boot-tv`
- later 3D slots remain deferred
- no extra WebGL renderer
- no extra WebGL context
- no extra scene
- no extra requestAnimationFrame introduced by v367
- no extra pointer listener introduced by v367
- DOM retains semantic buttons, links and accessible text
- manual object/screen manipulation has priority over automatic pointer camera motion
- `prefers-reduced-motion` removes continuous pointer-depth behavior
- coarse pointers/mobile do not run hover camera parallax

## Scene 01 target feeling

The user should no longer think:

> “the TV moves when I put my mouse on it”

The desired perception is:

> “I entered a small MOVX space; the TV, light, camera and typography notice where I am and the four channels retune the whole scene.”

That is the bar for Scene 01 before any second 3D model is introduced.
