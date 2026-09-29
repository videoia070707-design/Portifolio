"""MOVX v369 — remove the visual 'card around the world' from Scene 01.

Runs after v368. CSS-only, scoped to #boot. The approved CRT stays the sole
production GLB and the v368/v367 shared input/render architecture is unchanged.
"""
from pathlib import Path
import json, re, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v369-full-bleed'
css_name='v369-scene01-full-bleed.css'

src=root/'site'/css_name
if not src.exists():
    raise SystemExit(f'MOVX v369 source missing: {src}')
shutil.copy2(src,out/css_name)
css=src.read_text()
style_tag=f'<style data-v369-scene-frame="{release}">\n{css}\n</style>'

installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-crt-scene-presence-layer="v368-scene-presence"' not in text:
        raise SystemExit(f'MOVX v369 requires the built v368 marker in {name}')
    if 'v322-glb-runtime.mjs?v=v368-scene-presence' not in text:
        raise SystemExit(f'MOVX v369 requires the v368 shared runtime cache key in {name}')
    if 'data-crt-scene-frame-layer=' not in text:
        text=text.replace('<html ',f'<html data-crt-scene-frame-layer="{release}" ',1)
    else:
        text=re.sub(r'data-crt-scene-frame-layer="[^"]+"',f'data-crt-scene-frame-layer="{release}"',text,count=1)
    if 'data-v369-scene-frame=' not in text:
        text=text.replace('</head>',style_tag+'\n</head>',1)
    path.write_text(text)
    installed.append(name)

published=sorted(p.name for p in (out/'models').glob('*.glb'))
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v369 single-model invariant failed: {published}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'scope':'Scene 01 framing only',
    'framing':'full-bleed below the 58px global header; no rounded-card boundary',
    'runtime':'unchanged v368 shared renderer/input frame',
    'single_model_gate':True,
    'other_models':'deferred and unpublished',
    'assets':[css_name],
    'published_glbs':published,
},ensure_ascii=False))
