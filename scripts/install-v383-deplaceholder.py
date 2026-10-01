"""MOVX v383 — deferred-scene de-placeholder pass.

Runs after v382. It intentionally leaves the real CRT runtime untouched and
re-art-directs Portal, Playground and Studio so deferred 3D slots stop pretending
to be finished 3D assets before their approved GLBs exist.
"""
from pathlib import Path
import json, re

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v383-graphic-world'
css_name='v383-deplaceholder.css'
src=root/'site'/css_name

if not src.exists():
    raise SystemExit(f'MOVX v383 source missing: {src}')
css=src.read_text()
css_bytes=len(css.encode())
if css_bytes>24_000:
    raise SystemExit(f'MOVX v383 CSS exceeds 24 KB: {css_bytes}')

style_tag=f'<style data-v383-deplaceholder="{release}">\n{css}\n</style>'
installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    if not path.exists():
        raise SystemExit(f'MOVX v383 page missing: {name}')
    text=path.read_text()
    for contract in (
        'data-v382-reference-synthesis="v382-world-pass"',
        'data-v381-art-direction="v381-reference-reset"',
        'data-model-scope="v350-crt-only"',
    ):
        if contract not in text:
            raise SystemExit(f'MOVX v383 requires {contract} in {name}')
    if 'data-v383-deplaceholder=' in text:
        text=re.sub(r'data-v383-deplaceholder="[^"]+"',f'data-v383-deplaceholder="{release}"',text,count=1)
    else:
        text=text.replace('<html ',f'<html data-v383-deplaceholder="{release}" ',1)
    if '<style data-v383-deplaceholder=' not in text:
        text=text.replace('</head>',style_tag+'\n</head>',1)
    if text.count('<style data-v383-deplaceholder=')!=1:
        raise SystemExit(f'MOVX v383 duplicate visual layer in {name}')
    path.write_text(text)
    installed.append(name)

published=sorted(p.name for p in (out/'models').glob('*.glb')) if (out/'models').exists() else []
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v383 single-model invariant failed: {published}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'portal':'scroll-linked flat graphic X; fake tunnel geometry suppressed',
    'playground':'existing drag nodes restyled as kinetic typography',
    'studio':'fake CSS room removed; typographic studio chapter until real GLB approval',
    'people':'human crop tightened to remove competing campaign copy',
    'scene01':'runtime and geometry unchanged',
    'single_model_gate':True,
    'new_webgl_resources':0,
    'new_runtime_loops':0,
    'new_input_listeners':0,
    'css_bytes':css_bytes,
    'published_glbs':published,
},ensure_ascii=False))
