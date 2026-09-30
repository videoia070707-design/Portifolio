"""MOVX v370 — make the approved CRT illuminate Scene 01.

Runs after v369. CSS-only and scoped to #boot. It consumes the existing v365
`data-crt-physical-channel` state plus v367 scene variables; it does not add a
renderer, WebGL context, model, scene, input listener or RAF.
"""
from pathlib import Path
import json, re, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v370-screen-to-room'
css_name='v370-crt-light-spill.css'

src=root/'site'/css_name
if not src.exists():
    raise SystemExit(f'MOVX v370 source missing: {src}')
shutil.copy2(src,out/css_name)
css=src.read_text()
style_tag=f'<style data-v370-crt-light-spill="{release}">\n{css}\n</style>'

installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-crt-scene-frame-layer="v369-full-bleed"' not in text:
        raise SystemExit(f'MOVX v370 requires v369 full-bleed Scene 01 in {name}')
    if 'data-crt-channel-physics="v365-channel-physics"' not in text:
        raise SystemExit(f'MOVX v370 requires v365 channel physics in {name}')
    if 'data-crt-light-spill-layer=' not in text:
        text=text.replace('<html ',f'<html data-crt-light-spill-layer="{release}" ',1)
    else:
        text=re.sub(r'data-crt-light-spill-layer="[^"]+"',f'data-crt-light-spill-layer="{release}"',text,count=1)
    if 'data-v370-crt-light-spill=' not in text:
        text=text.replace('</head>',style_tag+'\n</head>',1)
    path.write_text(text)
    installed.append(name)

published=sorted(p.name for p in (out/'models').glob('*.glb'))
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v370 single-model invariant failed: {published}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'scope':'Scene 01 environmental light only',
    'driver':'existing v365 physical-channel state + v367 pointer/presence variables',
    'interaction':'selected channel changes screen-to-room bounce and active control reflection',
    'runtime':'unchanged shared CRT renderer/frame',
    'single_model_gate':True,
    'other_models':'deferred and unpublished',
    'assets':[css_name],
    'published_glbs':published,
},ensure_ascii=False))
