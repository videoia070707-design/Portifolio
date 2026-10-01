"""MOVX v386.3 — final Hero-only projection correction after v386.

The TV remains the only production GLB. This installer only restores a landscape
WebGL slot for desktop so strong three-quarter poses fit without clipping.
"""
from pathlib import Path
import json,re

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v386-3-landscape-field'
css_path=root/'site'/'v386-3-crt-safe-projection.css'
if not css_path.exists():raise SystemExit('MOVX v386.3 CSS source missing')
css=css_path.read_text()
style=f'<style data-v386-safe-projection="{release}">\n{css}\n</style>'
installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-v386-hero-immersion="v386-spatial-hero"' not in text:
        raise SystemExit(f'MOVX v386.3 requires v386 Hero in {name}')
    if 'data-v386-safe-projection=' not in text:
        text=text.replace('<html ',f'<html data-v386-safe-projection="{release}" ',1)
    else:
        text=re.sub(r'data-v386-safe-projection="[^"]+"',f'data-v386-safe-projection="{release}"',text,count=1)
    if f'data-v386-safe-projection="{release}"' not in text:
        raise SystemExit(f'MOVX v386.3 marker missing in {name}')
    if '<style data-v386-safe-projection=' not in text:
        text=text.replace('</head>',style+'\n</head>',1)
    path.write_text(text)
    installed.append(name)
models=sorted(p.name for p in (out/'models').glob('*.glb'))
if models!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v386.3 single-model invariant failed: {models}')
print(json.dumps({'release':release,'installed':installed,'scope':'#boot / boot-tv only','projection':'desktop landscape slot','models':models},ensure_ascii=False))
