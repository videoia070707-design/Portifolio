# MOVX Digital Product Skill Pack

Reusable project skills for websites, apps and digital products. The pack keeps Michelangelo as the visual specialist and separates UX, engineering, database, security, QA and deployment so responsibilities do not compete.

## Shared execution model
Every skill inherits the same operating sequence:

1. **Research** — inspect references, the current codebase and real product patterns before proposing changes.
2. **Reverse-engineer** — identify layout, hierarchy, typography, interaction, content model, constraints and failure modes.
3. **Plan** — state what will change, what must be preserved and how success will be verified.
4. **Execute** — make the smallest complete change that solves the problem.
5. **Verify** — test visual integrity, behavior, accessibility, performance and regressions appropriate to the task.
6. **Recover** — if validation fails, diagnose the cause instead of masking it with more visual layers.

## Skills

- `orchestrator/SKILL.md` — selects the minimum specialist set for each task.
- `shared-core/SKILL.md` — quality rules inherited by all skills.
- `michelangelo-visual/SKILL.md` — visual direction and reference intelligence.
- `ux-product/SKILL.md` — information architecture, flows, usability and accessibility.
- `frontend-web/SKILL.md` — HTML/CSS/JS, React/Next, responsive layout and motion.
- `app-engineering/SKILL.md` — application architecture, state, navigation and offline/mobile concerns.
- `backend-api/SKILL.md` — APIs, auth boundaries, jobs, storage and integrations.
- `database-supabase/SKILL.md` — PostgreSQL/Supabase schema, RLS, migrations and performance.
- `application-security/SKILL.md` — threat modeling, OWASP-style review and secure defaults.
- `qa-regression/SKILL.md` — Playwright, visual regression, overlap detection and release gates.
- `deploy-vercel/SKILL.md` — preview/production deployment, environment control and rollback.
- `rapid-prototyping-replit/SKILL.md` — isolated experiments and disposable prototypes.

## MOVX default pipeline
For the current portfolio, prefer:

`Research/Mobbin -> UX/Product -> Michelangelo Visual -> Frontend Web -> QA/Regression -> Security review -> GitHub -> Deploy`

Do **not** invoke backend/database skills unless a feature actually requires persistence, auth, APIs or server-side logic.
