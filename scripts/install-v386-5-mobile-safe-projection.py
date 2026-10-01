"""MOVX v386.5 — certify a full-silhouette mobile projection for Scene 01.

The v386.3 projection stylesheet is rebuilt from source earlier in the pipeline;
v386.5 verifies that the mobile 1.12:1 field reached the built pages and adds a
release marker. No model/runtime/WebGL/input resources are introduced.
"""
from pathlib import Path
import json,re

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v386-5-mobile-safe-projection'
needle='aspect-ratio:1.12 / 1!important'
installed=[]

for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-v386-hero-stability="v386-4-hero-selector-stability"' not in text:
        raise SystemExit(f'MOVX v386.5 requires v386.4 in {name}')
    if needle not in text:
        raise SystemExit(f'MOVX v386.5 mobile projection CSS missing in {name}')
    if 'data-v386-mobile-projection=' not in text:
        text=text.replace('<html ',f'<html data-v386-mobile-projection="{release}" ',1)
    else:
        text=re.sub(r'data-v386-mobile-projection="[^"]+"',f'data-v386-mobile-projection="{release}"',text,count=1)
    path.write_text(text)
    installed.append(name)

models=sorted(p.name for p in (out/'models').glob('*.glb'))
if models!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v386.5 single-model invariant failed: {models}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'scope':'#boot / mobile projection only',
    'projection':'1.12:1 mobile WebGL field inside unchanged tall natural-flow wrapper',
    'pose':'unchanged approved v386 three-quarter pose',
    'new_webgl_resources':0,
    'models':models,
},ensure_ascii=False))
