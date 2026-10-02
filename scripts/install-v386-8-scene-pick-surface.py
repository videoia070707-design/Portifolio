"""MOVX v386.8 — make the visible Scene-01 field the physical CRT input surface.

The v386 Hero deliberately projects parts of the real CRT beyond the historical
`.crt-wrap` box. The WebGL canvas itself has pointer-events:none, so binding v363
screen/dial and v364 cabinet gestures only to that CSS wrapper can make visible
geometry impossible to grab even though Three.js raycasts it correctly.

v386.8 does not add listeners or WebGL resources. The same listener families are
moved to `.boot-stage`, while Three.js raycasting remains the authority for screen,
selector and cabinet hits. Editorial controls are explicitly excluded.
"""
from pathlib import Path
import json,re

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v386-8-scene-pick-surface'
runtime=out/'v322-glb-runtime.mjs'

if not runtime.exists():raise SystemExit('MOVX v386.8 requires the built unified CRT runtime')
text=runtime.read_text()

for label,filename,version in (
    ('direct','v363-crt-direct-manipulation.mjs','v386-8-stage-pick'),
    ('object','v364-crt-object-interaction.mjs','v386-8-stage-pick'),
):
    pattern=rf"(\./{re.escape(filename)}\?v=)[^'\"]+"
    text,count=re.subn(pattern,rf"\g<1>{version}",text,count=1)
    if count!=1:raise SystemExit(f'MOVX v386.8 could not cache-bust {label} module')
runtime.write_text(text)

direct=(out/'v363-crt-direct-manipulation.mjs').read_text()
object_js=(out/'v364-crt-object-interaction.mjs').read_text()
for contract in (
    "const surface=boot?.querySelector('.boot-stage')||wrap;",
    "surface.addEventListener('pointerdown',begin,{passive:false});",
    "document.documentElement.dataset.crtInputSurface='v386.8-stage-pick';",
):
    if contract not in direct:raise SystemExit(f'MOVX v386.8 direct input-surface contract missing: {contract}')
for contract in (
    "const surface=boot?.querySelector('.boot-stage')||wrap;",
    "surface.addEventListener('pointerdown',begin,{passive:false});",
    "document.documentElement.dataset.crtControlOwnership='v386.8-stage-direct-first';",
):
    if contract not in object_js:raise SystemExit(f'MOVX v386.8 cabinet input-surface contract missing: {contract}')

installed=[]
for name in ('index.html','latest.html'):
    path=out/name;text=path.read_text()
    if 'data-v386-mobile-projection="v386-5-mobile-safe-projection"' not in text:
        raise SystemExit(f'MOVX v386.8 requires v386.5 projection in {name}')
    if 'data-v386-input-surface=' not in text:
        text=text.replace('<html ',f'<html data-v386-input-surface="{release}" ',1)
    else:
        text=re.sub(r'data-v386-input-surface="[^"]+"',f'data-v386-input-surface="{release}"',text,count=1)
    text,count=re.subn(r'v322-glb-runtime\.mjs\?v=[^"\']+',f'v322-glb-runtime.mjs?v={release}',text,count=1)
    if count!=1:raise SystemExit(f'MOVX v386.8 could not cache-bust unified runtime in {name}')
    path.write_text(text);installed.append(name)

models=sorted(p.name for p in (out/'models').glob('*.glb'))
if models!=['movx-crt-tv.glb']:raise SystemExit(f'MOVX v386.8 single-model invariant failed: {models}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'scope':'Scene 01 / boot-tv only',
    'input_surface':'existing v363/v364 pointer families moved from crt-wrap to boot-stage',
    'hit_authority':'Three.js raycast; editorial controls excluded',
    'selector':'v386.5 local selector intent preserved',
    'ownership':'v363 direct screen/dial capture precedes v364 cabinet orbit on same surface',
    'new_listeners':0,
    'new_webgl_resources':0,
    'runtime_shell_cache':release,
    'models':models,
},ensure_ascii=False))
