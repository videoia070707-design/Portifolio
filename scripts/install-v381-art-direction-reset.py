"""MOVX v381 — reference-led art-direction reset.

Runs after v380. It is a CSS-only production layer that re-art-directs the
storyboard as one continuous editorial/Y2K experience while preserving the
validated CRT runtime and the one-model rollout.
"""
from pathlib import Path
import json, re

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v381-reference-reset'
css_name='v381-art-direction-reset.css'
src=root/'site'/css_name

if not src.exists():
    raise SystemExit(f'MOVX v381 source missing: {src}')
css=src.read_text()
css_bytes=len(css.encode())
if css_bytes>26_000:
    raise SystemExit(f'MOVX v381 art-direction CSS exceeds 26 KB: {css_bytes}')

style_tag=f'<style data-v381-art-direction="{release}">\n{css}\n</style>'
installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    if not path.exists():
        raise SystemExit(f'MOVX v381 page missing: {name}')
    text=path.read_text()
    for contract in (
        'data-crt-retune-layer="v380-physical-channel-retune"',
        'data-crt-editorial-grid-layer="v379-editorial-safe-zones"',
        'data-model-scope="v350-crt-only"',
    ):
        if contract not in text:
            raise SystemExit(f'MOVX v381 requires {contract} in {name}')
    if 'data-v381-art-direction=' in text:
        text=re.sub(r'data-v381-art-direction="[^"]+"',f'data-v381-art-direction="{release}"',text,count=1)
    else:
        text=text.replace('<html ',f'<html data-v381-art-direction="{release}" ',1)
    if '<style data-v381-art-direction=' not in text:
        text=text.replace('</head>',style_tag+'\n</head>',1)
    if text.count('<style data-v381-art-direction=')!=1:
        raise SystemExit(f'MOVX v381 duplicate art-direction layer in {name}')
    path.write_text(text)
    installed.append(name)

published=sorted(p.name for p in (out/'models').glob('*.glb')) if (out/'models').exists() else []
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v381 single-model invariant failed: {published}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'scope':'site-wide visual art direction; CRT runtime untouched',
    'visual_reset':'continuous chapters + editorial scale + restrained Y2K + fewer cards/frames',
    'scene01':'geometry preserved; visual treatment only',
    'deferred_scenes':'DOM-only art direction until their real models are approved',
    'single_model_gate':True,
    'new_webgl_resources':0,
    'new_runtime_loops':0,
    'new_input_listeners':0,
    'css_delivery':'critical inline, zero new stylesheet requests',
    'css_bytes':css_bytes,
    'published_glbs':published,
},ensure_ascii=False))
