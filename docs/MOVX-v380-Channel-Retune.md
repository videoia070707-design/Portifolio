# MOVX v380 — Physical Channel Retune

## Why this pass exists
Scene 01 already has the correct ingredients: one real CRT, live channel content, cabinet manipulation, channel-specific pose/lighting, scroll-directed camera, focus pull, pickup and a validated editorial safe zone. The remaining perceptual gap is the instant when the visitor changes **Direção / Motion / AI / Digital**.

Before v380 that switch was distributed across systems but did not read strongly enough as one authored physical event. The screen had a 420 ms tuning wipe and the v365/v367 layers lerped toward the next semantic state, yet the actual change moment could still feel like a UI state update.

v380 does **not** add another effect system. It makes the existing channel change produce one short, bounded retune response in the same Scene-01 frame.

## Reference principle carried forward
The v367 audit already established the reference lesson from HAOQI.DESIGN and Joseph Santamaria: shared state and authored scene response matter more than effect count. v380 applies that principle specifically to channel switching.

The event is therefore resolved through the existing CRT/camera/light rig rather than a new overlay, HUD, canvas, WebGL scene or decorative object.

## Physical event
When the semantic channel changes:

1. the existing selector travels toward the new detent;
2. the CRT receives a very small depth recoil and signed yaw/roll settle;
3. the existing Scene-01 camera receives a bounded focus/FOV impulse;
4. the existing key/fill/rim rig lifts briefly;
5. the existing CRT emissive response rises slightly;
6. everything settles inside a 640 ms authored envelope.

This overlaps the existing v361 screen tuning wipe so the pixels, cabinet, optics and room light read as the same retune.

## Authority rules
- v380 runs **after** v378 pickup and immediately before the existing renderer call.
- body drag, screen/direct manipulation and physical pickup remain authoritative.
- if a manual gesture is active, v380 suppresses automatic object/camera displacement.
- coarse pointers receive a quieter response.
- `prefers-reduced-motion` keeps the semantic channel change and selector state but removes the oscillatory retune impulse.

## Architecture constraints
- exactly one production GLB: `movx-crt-tv.glb`;
- exactly one active production model slot: `boot-tv`;
- no second renderer;
- no second WebGL context;
- no second scene;
- no new `requestAnimationFrame`;
- no new input listener;
- no new pointer bus;
- no additional 3D model activated;
- v379 editorial/framing contract remains untouched.

## Acceptance gates
- v380 installs only after validated v379/v378 markers;
- retune layer runs after physical pickup and before the shared render;
- channel switches produce a non-zero transient depth/focus/light response on desktop;
- selector settles on the correct detent;
- reverse channel travel preserves signed physical direction;
- response settles completely rather than accumulating;
- manual manipulation suppresses automatic displacement;
- reduced-motion channel switching has zero oscillatory impulse;
- 44,831 CRT triangles, one renderer and one active slot remain intact;
- no horizontal overflow or runtime errors.

## Scope boundary
This pass still belongs entirely to **Scene 01**. It does not activate Scene 02 or any later 3D asset. The next scene should only be considered after the first encounter remains stable through published-surface QA.
