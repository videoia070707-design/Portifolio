# MOVX v386.4 — Hero stability

Scope remains strictly Scene 01 / `boot-tv`.

This patch fixes two release-blocking regressions without weakening the approved 3D pose:

- 1366×768 now reserves a fixed editorial rail to the right of the CRT field, preserving a real visual gap instead of collapsing copy toward the model.
- the tiny physical CRT selector keeps exact raycasting as the primary hit path, with a bounded projected pickup radius to survive live camera/model parallax between reprojection and pointerdown.
- direct screen/selector capture is exclusive: cabinet orbit cannot steal the same pointerdown after v363 accepts it.

No additional GLB, WebGL renderer/context, scene, RAF, or second 3D model is introduced.
