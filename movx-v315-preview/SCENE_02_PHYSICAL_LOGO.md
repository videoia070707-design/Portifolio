# Scene 02 — Physical Logo

## Purpose
Introduce MOVX as a physical identity object immediately after the CRT boot scene. The object should feel manufactured, weighted, tactile and connected to the Y2K / creative-hardware language of Scene 01.

## Motion timing
- Entry: subtle settle rather than reveal gimmick.
- Pointer response: small, damped, never twitchy.
- Scroll response: shallow yaw drift + 2–3% scale change.
- No infinite spin.
- No bounce loop.

## Handoff to Scene 03
As the Hero approaches its exit range, the X becomes the visual bridge to the X Portal / Tunnel scene. In the production GLB pass, the `Letter_X` mesh should therefore remain independently addressable so Scene 03 can reuse or visually align with it without a discontinuous cut.

## Important implementation consequence
The final GLB should preserve separate `Letter_M`, `Letter_O`, `Letter_V`, `Letter_X` meshes. Do not fuse all letters if avoidable. Scene 03 will benefit from being able to isolate and visually hand off the X.
