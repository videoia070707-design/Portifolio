# MOVX v41 — WebGL project transitions / continuity research

## Problem observed after v40
v40 introduced a real WebGL corridor in Selected Cases, but opening a project still changed interaction modes too abruptly: GPU depth while browsing, then an immediate DOM case viewer. The next step is continuity — the artwork clicked by the visitor should become the transition itself.

## External references studied

### Codrops — Building a Scroll-Revealed WebGL Gallery with GSAP, Three.js, Astro and Barba.js (2026)
Key principle adapted: synchronize a DOM image with a WebGL plane and animate that same visual into a full-size project/detail view. MOVX adapts the principle without importing the referenced stack. The current site keeps its native DOM viewer and uses a small native WebGL transition layer only while entering/leaving a case.

### Codrops — Building a Scroll-Reactive 3D Gallery with Three.js, Velocity, and Mood-Based Backgrounds (2026)
Key principle adapted: project focus can influence the atmosphere of the surrounding scene. MOVX v41 uses the project accent already present in the data model to softly tint the Selected Cases chapter and the perspective room guides. The strength stays low so artwork remains dominant.

### Codrops — More Than a Portfolio: Building a Scroll-Driven 3D World with Something to Say (2026)
Key principle adapted: project opening should feel authored rather than like a generic fade. MOVX uses one recurring signature transition instead of inventing unrelated effects for every project, keeping the portfolio coherent.

### Awwwards — Landing transition / scroll (Enpower Trading)
Useful pattern: transition, scroll, 3D and WebGL are strongest when they read as one continuous spatial system rather than separate effects.

## v41 implementation rules
1. The clicked artwork is the source of the transition.
2. The WebGL mesh expands from the exact DOM image bounds to the viewport.
3. The shader adds bending, chromatic separation and restrained grain only during the transition.
4. Closing reverses the spatial logic and returns toward the original opener.
5. Text never receives 3D transforms.
6. The transition renderer is lazy and dormant outside the short open/close animation.
7. WebGL failure must never block navigation: the normal case viewer remains fully functional.
8. Reduced motion and narrow mobile layouts disable the portal.
9. No GSAP, Lenis, Three.js or CDN dependency is added.
10. Project mood uses existing accent metadata; no invented project colors.

## Intended result
Selected Cases now behaves as one continuous experience: scroll-driven WebGL corridor -> focused DOM project spread -> clicked artwork becomes a GPU mesh -> full case viewer -> reverse spatial return.
