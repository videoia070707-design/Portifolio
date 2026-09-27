"""MOVX v354 — install Scene-01 scroll choreography after v353.

This pass keeps the approved standalone CRT GLB as the only live 3D model.
It adds a sticky/scroll choreography layer around Scene 01, feeds progress into
the existing CRT runtime, and leaves every later 3D slot deferred.
"""
from pathlib import Path
import json, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
css_src=root/'site'/'v354-boot-choreo.css'
js_src=root/'site'/'v354-boot-choreo.js'
js_out=out/'v354-boot-choreo.js'
release='v354-boot-scroll'

if not css_src.exists() or not js_src.exists():
    raise SystemExit('MOVX v354 choreography sources are missing')
if css_src.stat().st_size>14_000 or js_src.stat().st_size>18_000:
    raise SystemExit('MOVX v354 choreography layer exceeded lightweight budget')

shutil.copy2(js_src,js_out)
css=css_src.read_text()
style_tag=f'<style data-v354-boot-choreo="{release}">\n{css}\n</style>'
script_tag=f'<script type="module" data-v354-boot-choreo-runtime="{release}">import("./v354-boot-choreo.js?v={release}");</script>'
installed=[]

for name in ('index.html','latest.html'):
    path=out/name
    if not path.exists():
        raise SystemExit(f'MOVX v354 page missing: {name}')
    text=path.read_text()
    if 'data-motion-layer="v353-cinematic-motion"' not in text:
        raise SystemExit(f'MOVX v354 requires v353 motion layer in {name}')
    if 'data-crt-asset="v352-standalone-vintage-computer"' not in text:
        raise SystemExit(f'MOVX v354 requires approved standalone CRT in {name}')
    if 'data-v354-boot-choreo=' not in text:
        text=text.replace('</head>',style_tag+'\n</head>',1)
    if 'data-v354-boot-choreo-runtime=' not in text:
        text=text.replace('</body>',script_tag+'\n</body>',1)
    path.write_text(text)
    installed.append(name)

for name in installed:
    text=(out/name).read_text()
    if 'v354-boot-choreo.js?v=v354-boot-scroll' not in text:
        raise SystemExit(f'MOVX v354 runtime missing from {name}')
    if 'data-v354-boot-choreo="v354-boot-scroll"' not in text:
        raise SystemExit(f'MOVX v354 CSS missing from {name}')

models=sorted(p.name for p in (out/'models').glob('*.glb')) if (out/'models').exists() else []
if models!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v354 single-model invariant failed: {models}')

print(json.dumps({
    'release':release,
    'pages':installed,
    'scene':'01 / boot-tv only',
    'motion':'sticky scroll choreography + CRT progress handoff + phased copy exit',
    'crt_asset':'v352 standalone vintage computer unchanged',
    'published_glbs':models,
    'later_3d_models':'deferred',
    'css_bytes':len(css.encode()),
    'js_bytes':js_out.stat().st_size,
},ensure_ascii=False))
