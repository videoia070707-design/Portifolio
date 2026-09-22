# MOVX repository agent rules

Use the repository skills in `.agents/skills/`. They are the canonical GPT/Codex skill packages for this project.

## Operating contract
1. Inspect the current implementation before proposing changes.
2. Preserve approved work and change only what the user requested.
3. For visual, UX, motion, scroll, 3D or product-direction work, use `research-benchmark` before execution unless the task is a trivial code-only fix or the user already supplied a sufficient approved reference set.
4. Research must distinguish evidence from inspiration. Never claim to have inspected a source, screen or interaction that was not actually accessible.
5. Prefer high-signal references: live products and real flows, Awwwards, Mobbin when accessible, Behance case studies, Pinterest/Instagram for moodboard signals, then official technical documentation for implementation details.
6. Do not copy a reference mechanically. Extract reusable principles, constraints and anti-patterns, then adapt them to MOVX.
7. Structural correctness comes before motion. Motion/scroll/3D skills are conditional and must stay inactive when the task is only layout/debugging or when the user postponed them.
8. Do not add libraries because they are fashionable. Reuse the existing stack when it is capable.
9. Accessibility, responsive integrity, readable typography, performance and keyboard behavior are release requirements, not polish.
10. Run the relevant QA/release checks before calling a change complete. If validation fails, diagnose the cause instead of layering more CSS/effects.

## MOVX specific
- Artwork is the hero; never crop or obscure approved artwork unless explicitly requested.
- Case studies should keep art and explanation easy to compare.
- Avoid generic AI-site tropes: gratuitous glass panels, HUD lines, micro-data, random floating cards, meaningless gradients, constant parallax and decorative 3D without narrative purpose.
- 3D/WebGL must be progressive enhancement with a readable fallback.
