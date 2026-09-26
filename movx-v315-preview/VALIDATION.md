# MOVX v315 validation checklist

## Scene 01 / CRT regression
- Existing v314 boot slot still loads.
- `v314-crt.css` and `v314-crt.js` remain in the v315 chain.
- No v315 rule intentionally targets `.boot-scene` or `boot-tv`.

## Scene 02 / Physical Logo
- Runtime locates `.hero` even if `#hero` is absent.
- If an explicit `hero-movx-logo` slot exists, it reuses it.
- If no slot exists, it appends a dedicated slot to a known hero visual host, falling back to the hero container itself.
- Pointer state eases back to zero on leave.
- Scroll state is clamped to 0–1.
- `prefers-reduced-motion` disables the primary physical transforms.
- Mobile widths reduce the object size and remove micro-detail plaques.

## Production model handoff
- Fallback remains visible until `replaceWith(rendererElement)` is explicitly called.
- `restoreFallback()` makes the DOM object visible again after a renderer/model failure.
- Model source query parameter is metadata only in this pass; it does not perform untrusted remote fetching.

## Next validation after merge
1. GitHub Pages build completes.
2. Open `/movx-v315-preview/`.
3. Confirm no console errors.
4. Confirm Scene 01 CRT remains unchanged.
5. Confirm Scene 02 logo does not overlap hero copy at desktop/mobile breakpoints.
6. Confirm reduced-motion behavior.
7. Then begin Scene 03 / X Portal.
