# MOVX Creative Portfolio

https://videoia070707-design.github.io/Portifolio/

## Canonical source — v100

Edit `site/`. Build with `npm ci && npm run build` (Node 22 and Python 3).
Serve `_site/` on port 4173 and run `npm run qa` after installing Playwright Chromium.
GitHub Pages runs the same build and browser checks before deployment.

The historical ZIP now supplies **only the 76 original media files**. No HTML,
CSS or JavaScript is extracted from it. `patches/` documents history; it is no
longer concatenated into production. Dependencies are pinned in package-lock.json.
The migration preserves existing visual CSS; this is not a claim that all historical
selectors and all old runtime modules have been fully removed.

Services, institutional chapter focus, Process and archive progress consume
`MOVX_MOTION_BRIDGE`. The conveyor keeps its own horizontal animation. Future
visual objects must use the bridge, preserve text geometry and include mobile
and reduced-motion fallbacks. The bridge responds to resize, late fonts,
dynamic geometry and changed reduced-motion preferences; it stops when hidden.

The hero displays the original image once. Fake depth made from duplicate crops
was removed because it doubled the typography and CRT screens.

## MOVX v117 — scroll world

This source installs the user's 0923 film as a single-take scroll-scrub chapter
between the existing Social Media cover and Living Archive. Build with
`npm ci && npm run build`. Serve `_site/` over HTTP; do not open source
`index.html` directly inside this ZIP. See `docs/MOVX-v117-scroll-world.md`.
