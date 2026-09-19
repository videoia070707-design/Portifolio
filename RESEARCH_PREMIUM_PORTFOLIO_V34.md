# MOVX v34 — Premium portfolio reference study

Date: 2026-09-19

## Sources reviewed

- Behance — Sirnik Studio, premium Webflow portfolio: https://www.behance.net/gallery/249940813/Sirnik-Studio-A-Premium-Webflow-Portfolio
- Behance — Creative Director Web / UX Strategy & Visual Design: https://www.behance.net/gallery/244241017/Creative-Director-Web-UX-Strategy-Visual-Design
- Behance — Mitchel Zein — Art Director Portfolio 2026: https://www.behance.net/gallery/248163643/Mitchel-Zein-Art-Director-Portfolio-2026
- Behance — Art Direction & Motion Design Portfolio 2026: https://www.behance.net/gallery/254338959/ART-DIRECTION-MOTION-DESIGN-PORTFOLIO-2026
- Dribbble — JH Editorial Art Director Portfolio: https://dribbble.com/shots/27288946-JH-Editorial-Art-Director-Portfolio-Personal-Website-UI-Design
- Dribbble — JH Work Detail Page: https://dribbble.com/shots/27302103-JH-Editorial-Art-Director-Portfolio-Personal-Website-Works-Page
- Dribbble — editorial portfolio search / quiet image-led examples: https://dribbble.com/search/portfolio-editorial
- Awwwards — portfolio / art / project-page collections: https://www.awwwards.com/websites/art/
- Awwwards — Takafumi Senda Portfolio: https://www.awwwards.com/sites/takafumi-senda-portfolio
- Pinterest — Art Director Portfolio Website Header Design: https://in.pinterest.com/pin/art-director-portfolio-website-header-design-in-2025--600245456623693123/
- Pinterest — Creative Director Portfolio reference: https://se.pinterest.com/pin/387239267982043623/

Mobbin was connected but its MCP search endpoint returned a paid-plan requirement, so no Mobbin screen was treated as inspected evidence in this iteration.

## Patterns extracted

1. **Quiet frame, loud work** — premium portfolios reduce chrome and let images, typography and spacing carry the identity.
2. **Typography as structure** — oversized editorial type is useful when it creates hierarchy; it should not compete with every other element.
3. **Whitespace is functional** — larger gaps and narrower text measures make the work feel curated rather than densely templated.
4. **Case studies behave like features** — project pages read as chapters, not generic modals or card stacks.
5. **Motion is paced, not constant** — slow reveals, subtle image-plane movement and restrained hover states feel more premium than tilt, bounce or constant transforms.
6. **Navigation is typographic** — active state can be expressed through rules, underlines and rhythm instead of filled pills/buttons.
7. **Project identity should leak into the interface carefully** — a small accent line or project color is enough; the page shell should remain calm.
8. **Fast interaction matters** — premium feel also comes from immediate case opening, so intent-based image prewarming is preferable to loading everything upfront.

## Applied in v34

- Header utility controls changed from pill UI to typographic controls.
- Hero index changed from four button tiles to an editorial contents rail.
- Archive section intros use stronger editorial measures and calmer spacing.
- Selected-work rows use serif-led hierarchy, project-color micro accents and larger unrotated previews.
- Archive card tilt language is neutralized; images receive only a very small zoom.
- Case architecture from v33 is preserved; only final chrome is reduced.
- Project covers and first slides are prewarmed only after hover/focus/pointer intent.
- Reduced-motion and fail-open behavior remain mandatory.
