"""MOVX v386.14 — keep the approved CRT physically visible on tall desktops.

Runs after v386.13. This is a Scene-01 CSS framing correction only: the same CRT,
renderer, camera rig, interaction stack and single-model production gate remain.
"""
from pathlib import Path
import json,re

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v386-14-tall-viewport'
css_path=root/'site'/'v386-14-tall-viewport-framing.css'

if not css_path.exists():raise SystemExit('MOVX v386.14 CSS source missing')
css=css_path.read_text()
style=f'<style data-v386-tall-framing="{release}">\n{css}\n</style>'
installed=[]
for name in ('index.html','latest.html'):
    path=out/name;text=path.read_text()
    if 'data-v386-object-presence="v386-13-full-field-object-presence"' not in text:
        raise SystemExit(f'MOVX v386.14 requires current v386.13 physical-presence build in {name}')
    if 'data-v386-safe-projection="v386-3-landscape-field"' not in text:
        raise SystemExit(f'MOVX v386.14 requires v386.3 safe projection in {name}')
    if 'data-v386-tall-framing=' not in text:
        text=text.replace('<html ',f'<html data-v386-tall-framing="{release}" ',1)
    else:
        text=re.sub(r'data-v386-tall-framing="[^"]+"',f'data-v386-tall-framing="{release}"',text,count=1)
    if '<style data-v386-tall-framing=' not in text:
        text=text.replace('</head>',style+'\n</head>',1)
    path.write_text(text);installed.append(name)

models=sorted(p.name for p in (out/'models').glob('*.glb'))
if models!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v386.14 single-model invariant failed: {models}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'scope':'Scene 01 / boot-tv CSS framing only',
    'desktop_tall':'responsive upward physical field offset; no scale reduction',
    'short_desktop':'v386.5 framing preserved',
    'mobile':'unchanged natural flow',
    'new_webgl_resources':0,
    'new_listeners':0,
    'models':models,
},ensure_ascii=False))
