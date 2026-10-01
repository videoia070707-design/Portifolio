"""MOVX v384 — composition polish.

Runs after v383. It preserves the single real CRT runtime and only adjusts two
visual details discovered in Chromium evidence: desktop Playground spacing and
the People image crop.
"""
from pathlib import Path
import json, re

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v384-clean-spacing'
css_name='v384-composition-polish.css'
src=root/'site'/css_name

if not src.exists():
    raise SystemExit(f'MOVX v384 source missing: {src}')
css=src.read_text()
css_bytes=len(css.encode())
if css_bytes>10_000:
    raise SystemExit(f'MOVX v384 CSS exceeds 10 KB: {css_bytes}')

style_tag=f'<style data-v384-composition-polish="{release}">\n{css}\n</style>'
installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    if not path.exists():
        raise SystemExit(f'MOVX v384 page missing: {name}')
    text=path.read_text()
    for contract in (
        'data-v383-deplaceholder="v383-graphic-world"',
        'data-v382-reference-synthesis="v382-world-pass"',
        'data-model-scope="v350-crt-only"',
    ):
        if contract not in text:
            raise SystemExit(f'MOVX v384 requires {contract} in {name}')
    if 'data-v384-composition-polish=' in text:
        text=re.sub(r'data-v384-composition-polish="[^"]+"',f'data-v384-composition-polish="{release}"',text,count=1)
    else:
        text=text.replace('<html ',f'<html data-v384-composition-polish="{release}" ',1)
    if '<style data-v384-composition-polish=' not in text:
        text=text.replace('</head>',style_tag+'\n</head>',1)
    if text.count('<style data-v384-composition-polish=')!=1:
        raise SystemExit(f'MOVX v384 duplicate visual layer in {name}')
    path.write_text(text)
    installed.append(name)

published=sorted(p.name for p in (out/'models').glob('*.glb')) if (out/'models').exists() else []
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v384 single-model invariant failed: {published}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'playground':'desktop kinetic tokens redistributed into five non-colliding anchors',
    'people':'human crop tightened; mobile Playground unchanged',
    'scene01':'runtime and geometry unchanged',
    'single_model_gate':True,
    'new_webgl_resources':0,
    'new_runtime_loops':0,
    'new_input_listeners':0,
    'css_bytes':css_bytes,
    'published_glbs':published,
},ensure_ascii=False))
