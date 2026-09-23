# MOVX v115.1 — Motion ownership contract

This document is the implementation contract for the current stabilization pass before **Soul of Design — Into the Signal** is added.

## Why this exists

The v106–v112 history contains useful visual work, but later layers sometimes target the same DOM/CSS properties. V115.1 makes ownership explicit so the next cinematic intro is not built on top of competing writers.

## Process section — canonical owners

| Concern | Canonical owner | Notes |
| --- | --- | --- |
| Semantic title/list content | Existing DOM (`.process-title`, `.process-list`) | Always source of truth; must remain readable in fallback states. |
| Normalized Process scroll progress / active source row | `v108-institutional-depth.mjs` | Existing scroll source remains authoritative. |
| Three.js scene, camera, renderer, theme materials | `v108-institutional-depth.mjs` | Progressive enhancement only. |
| WebGL edge-fade signal | `v108-institutional-depth.mjs` via `--v108-process-canvas-o` | v108 publishes the signal but does not own final computed opacity. |
| Final computed Process canvas opacity | `v115-process-owner.css` | No observer rewrites; CSS consumes the v108 fade variable. |
| Desktop Process canvas crop/mask/transform/filter | `v115-process-owner.mjs` | One runtime owner. |
| Editorial desktop Process copy | `v115-process-owner.mjs` | Generated from semantic DOM; `aria-hidden`; removed in fallback. |
| Editorial copy styling | `v111-process-cleanroom.css` + `v112-process-polish.css` | Presentation only. The old v111 runtime is retired from the canonical build. |
| Adaptive desktop/mobile/reduced-motion lifecycle | `v115-process-owner.mjs` | Restores semantic content and removes stale inline geometry when enhanced mode is unavailable. |
| Mobile-first widening with uninitialized WebGL | `v115-process-owner.mjs` + CSS | Explicit `field-fallback`; never expose an empty 3D field. |

## Legacy layers

- `v109-process-art-direction.css` and `v112-process-polish.css` remain lower-priority art-direction layers. V115 is injected after them and owns the properties listed above.
- `v110-process-legibility.mjs` can still establish the legacy desktop reading geometry at initial load; v115 is the final owner and clears its inline geometry whenever the experience returns to fallback flow.
- `v111-process-cleanroom.mjs` is kept in source history but is not loaded by the canonical build. Its MutationObserver opacity fight is retired.
- v106 chapter sculptures are suppressed in the Process/Services/Contact corridor by later art-direction CSS; they must not be reintroduced inside the Process reading lane.

## Lifecycle states

- `adaptive-owner`: desktop, motion allowed, Process field can participate in the enhanced composition.
- `flow-fallback`: mobile or reduced/static mode; semantic DOM is visible and 3D presentation is not required.
- `field-fallback`: desktop viewport reached after a mobile-first load where v108 never initialized WebGL (or another blocked field state); semantic content remains visible and the empty field is hidden.
- `missing-source`: required Process DOM is absent; do not manufacture replacement copy.

## Into the Signal contract

The hero cinematic intro must use its own namespace and must not write Process properties. Recommended public inputs:

- `--movx-intro-progress`: one normalized 0–1 source tied to the intro scroll chapter.
- `--movx-intro-camera-x`, `--movx-intro-camera-z`: derived camera cues only if DOM layers need them.
- one media controller owns `currentTime` or frame index; GSAP/ScrollTrigger may own scroll normalization but must not compete with another seek loop.
- typography, navigation and real project art remain DOM/composited assets, not generated video text.

Do not add another canvas or motion engine to the Process section as part of the intro. The intro ends at the real archive; Process remains a separate chapter.

## Required QA before the intro is considered integratable

1. Desktop initial load.
2. Mobile initial load.
3. Desktop → mobile → desktop in the same page.
4. Mobile → desktop → mobile in the same page.
5. Reduced-motion toggle while the page remains open.
6. WebGL unavailable/context-lost fallback.
7. Light/dark theme changes.
8. Fast forward/reverse scroll with no copy overlap or horizontal overflow.

Only after these gates pass should the three CRT direction frames and the pre-rendered intro asset be wired to the production page.
