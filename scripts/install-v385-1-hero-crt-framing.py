"""MOVX v385.1 — keep the complete approved CRT inside Scene 01.

Runs after v385. Scope remains strictly #boot. No lower section, model, renderer,
context, camera runtime, input listener or animation loop is added.
"""
from pathlib import Path
import json,re

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v385-1-crt-framing'
css_name='v385-1-hero-crt-framing.css'
src=root/'site'/css_name
if not src.exists():raise SystemExit(f'MOVX v385.1 source missing: {src}')
css=src.read_text()

for forbidden in ('#hero','#portal','#work','#machine','#playground','#studio','#people','#contact'):
    if forbidden in css:raise SystemExit(f'MOVX v385.1 escaped Hero scope via {forbidden}')
if '#boot' not in css:raise SystemExit('MOVX v385.1 has no #boot scope')

style_tag=f'<style data-v385-1-crt-framing="{release}">\n{css}\n</style>'
installed=[]
for name in ('index.html','latest.html'):
    path=out/name;text=path.read_text()
    if 'data-v385-hero-only="v385-hero-recovery"' not in text:
        raise SystemExit(f'MOVX v385.1 requires v385 Hero recovery in {name}')
    if 'data-v385-1-crt-framing=' not in text:
        text=text.replace('<html ',f'<html data-v385-1-crt-framing="{release}" ',1)
    else:
        text=re.sub(r'data-v385-1-crt-framing="[^"]+"',f'data-v385-1-crt-framing="{release}"',text,count=1)
    if '<style data-v385-1-crt-framing=' not in text:
        text=text.replace('</head>',style_tag+'\n</head>',1)
    path.write_text(text);installed.append(name)

published=sorted(p.name for p in (out/'models').glob('*.glb')) if (out/'models').exists() else []
if published!=['movx-crt-tv.glb']:raise SystemExit(f'MOVX v385.1 single-model invariant failed: {published}')
print(json.dumps({'release':release,'installed':installed,'scope':'#boot only','fix':'complete CRT vertical framing on tall and short desktop','single_model_gate':True,'new_webgl_resources':0,'published_glbs':published},ensure_ascii=False))
