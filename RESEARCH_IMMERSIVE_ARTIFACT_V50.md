# MOVX v50 — Immersive Archive Artifact

## Direction
The next immersive layer should not add 3D indiscriminately to project grids. The signature object belongs between **Services and Process**, where it can connect what MOVX produces to how MOVX thinks.

## References studied
- Codrops — Scroll-Reactive 3D Gallery with Three.js, Velocity, and Mood-Based Backgrounds: https://tympanus.net/codrops/2026/03/09/building-a-scroll-reactive-3d-gallery-with-three-js-velocity-and-mood-based-backgrounds/
- Codrops — On-Scroll Revealing WebGL Images: https://tympanus.net/codrops/2024/02/07/on-scroll-revealing-webgl-image-explorations/
- Awwwards — 0110 Studio 3D Scroll Animation: https://www.awwwards.com/inspiration/3d-scroll-animation-0110-studio-portfolio-web
- Awwwards — Noomo Labs mobile scroll / 3D interactions: https://www.awwwards.com/inspiration/mobile-scroll-and-interactions-noomo-labs
- Dribbble — Three.js portfolio references, including Noomo Showcase immersive scroll: https://dribbble.com/search/threejs-portfolio

## Extracted rules
1. Real content should become the 3D material. For a portfolio, project imagery is more meaningful than generic spheres or abstract blobs.
2. Scroll should control a physical action with a beginning, middle and end, not just rotate an object forever.
3. Velocity can add a subtle sense of weight, but must settle when the user stops.
4. The immersive object should bridge chapters and explain the portfolio narrative.
5. Project directories remain mostly flat so artwork is easy to inspect.

## MOVX concept — Archive Case
A physical-looking **MOVX archive case** becomes the transition from Services to Process.

Scroll choreography:
- 0–20%: the case rises from depth and settles in frame.
- 12–38%: the lid opens on a real hinge.
- 28–75%: real MOVX project covers emerge from the case one by one.
- 65–82%: the artworks fan into a controlled spatial composition.
- 82–100%: the case and artworks recede, clearing the frame for Process.

Selected artwork textures:
- MotionHub
- Hardwork Thermo+
- Voltara Operações
- Belive Cashflow

## Why this location
**Services → Archive Artifact → Process** creates a clear narrative:

`what MOVX can build → evidence/work → method behind the work`

This is stronger than putting the object inside the Directory, where it would interfere with browsing, or in Contact, where it would compete with the conversion action.

## Guardrails
- Essential copy stays in DOM.
- No generic floating 3D objects.
- No permanent auto-rotation.
- One bounded WebGL section, viewport-gated.
- DPR capped at 1.5.
- Reduced-motion/mobile fallback uses normal project images.
- The v49 shared camera fades down while the archive object owns the scene, then resumes for Process.
