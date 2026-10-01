"""MOVX v385 — recover scope discipline: only Scene 01 / #boot is restyled.

This installer intentionally follows v380 directly. The site-wide v381-v384
experiment remains in repository history but is removed from the production build.
v385 may change only #boot selectors. It does not add WebGL resources or touch
later storyboard scenes.
"""
from pathlib import Path
import json,re

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v385-hero-recovery'
css_name='v385-hero-only-recovery.css'
src=root/'site'/css_name

if not src.exists():
    raise SystemExit(f'MOVX v385 source missing: {src}')
css=src.read_text()
css_bytes=len(css.encode())
if css_bytes>32_000:
    raise SystemExit(f'MOVX v385 hero CSS exceeds 32 KB: {css_bytes}')

# Scope guard: later section IDs must never appear in this production layer.
for forbidden in ('#hero','#portal','#work','#machine','#playground','#studio','#people','#contact'):
    if forbidden in css:
        raise SystemExit(f'MOVX v385 escaped Hero scope via {forbidden}')
# Every concrete selector line must be rooted in #boot (comments/@media excluded).
for raw in css.split('{')[:-1]:
    selector=raw.split('}')[-1].strip()
    if not selector or selector.startswith('@') or selector.startswith('/*'):
        continue
    if '#boot' not in selector:
        raise SystemExit(f'MOVX v385 unscoped selector: {selector[:120]}')

style_tag=f'<style data-v385-hero-only="{release}">\n{css}\n</style>'
installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    if not path.exists():
        raise SystemExit(f'MOVX v385 page missing: {name}')
    text=path.read_text()
    for contract in (
        'data-crt-retune-layer="v380-physical-channel-retune"',
        'data-crt-editorial-grid-layer="v379-editorial-safe-zones"',
        'data-model-scope="v350-crt-only"',
    ):
        if contract not in text:
            raise SystemExit(f'MOVX v385 requires {contract} in {name}')
    # Strong regression guard: global art-direction layers must not be installed.
    for retired in ('data-v381-art-direction=','data-v382-reference-synthesis=','data-v383-deplaceholder=','data-v384-composition-polish='):
        if retired in text:
            raise SystemExit(f'MOVX v385 found retired global layer {retired} in {name}')
    if 'data-v385-hero-only=' in text:
        text=re.sub(r'data-v385-hero-only="[^"]+"',f'data-v385-hero-only="{release}"',text,count=1)
    else:
        text=text.replace('<html ',f'<html data-v385-hero-only="{release}" ',1)
    if '<style data-v385-hero-only=' not in text:
        text=text.replace('</head>',style_tag+'\n</head>',1)
    if text.count('<style data-v385-hero-only=')!=1:
        raise SystemExit(f'MOVX v385 duplicate hero-only layer in {name}')
    path.write_text(text)
    installed.append(name)

published=sorted(p.name for p in (out/'models').glob('*.glb')) if (out/'models').exists() else []
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v385 single-model invariant failed: {published}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'scope':'#boot only',
    'retired_from_build':['v381','v382','v383','v384'],
    'hero_change':'full-bleed object-first grid + larger spatial CRT field + editorial title rail + compact channel tuner',
    'single_model_gate':True,
    'new_webgl_resources':0,
    'new_runtime_loops':0,
    'new_input_listeners':0,
    'css_delivery':'critical inline',
    'css_bytes':css_bytes,
    'published_glbs':published,
},ensure_ascii=False))
