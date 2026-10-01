# MOVX v379 — Scene 01 contract

## Meaning
Scene 01 is the visitor's first physical encounter with MOVX: the CRT is not a product mockup beside copy; it is the spatial device that tunes the studio through Direção, Motion, AI and Digital.

## Scope
- Only the approved CRT is active in WebGL.
- `boot-tv` remains the only production model slot.
- All later 3D models remain deferred/unpublished.
- v379 changes editorial layout only; v374 owns short-viewport physical framing and v375–v378 own physical CRT interaction.

## Desktop composition
- CRT owns the larger left field.
- Editorial copy owns a bounded right field (roughly 410–560px).
- Maintain a visible spatial moat between the projected CRT silhouette and the copy column.
- Headline remains three lines: IDEIAS / NÃO FICAM / PARADAS.
- The title must read as one statement but not as three lines touching each other.
- Supporting copy, channel strip and channel controls form a descending rhythm below the title.
- The channel strip remains semantic DOM and keyboard-accessible.

## Short desktop override
- Keep the complete physical TV and selector inside the viewport using the existing v374 framing.
- Recover vertical room by compacting title/control spacing rather than hiding controls or cropping the CRT.
- No independent transform may replace the v374 CRT wrapper offset.

## Mobile override
- Natural vertical document flow; no desktop sticky or hover assumptions.
- No vertical separator between TV and copy.
- Preserve readable title spacing and the two-column channel layout already validated for touch.

## Interaction permissions
- Whole Scene 01 may feed cinematic pointer presence.
- Real CRT body drag/orbit/pickup stays physically authoritative.
- Screen drag and selector drag keep their current channel-specific meanings.
- Editorial layout must not intercept CRT pointer interaction.

## Reduced motion
- Preserve complete content and static spatial hierarchy.
- Remove continuous motion rather than removing interaction semantics or content.

## Acceptance gates
- exactly one production GLB (`movx-crt-tv.glb`);
- one active WebGL slot (`boot-tv`);
- one renderer/context/shared frame;
- 44,831 CRT triangles preserved;
- CRT and copy safe zones do not overlap at desktop target widths;
- complete CRT remains inside short desktop viewport;
- copy and channel panel remain inside Scene 01;
- headline line gaps remain visibly positive;
- no horizontal overflow;
- mobile and reduced-motion remain functional.
