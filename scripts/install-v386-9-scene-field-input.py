"""MOVX v386.9 — bind physical CRT picking to the complete visible Scene 01.

Runs after v386.8. No new pointer family is introduced: v363/v364 source modules
already moved their existing listeners to `.scene-inner`; this installer records
that capability in the built pages and preserves the still-unpublished fresh cache
URLs from v386.4/v386.5. Three.js raycasting remains the hit authority.
"""
from pathlib import Path
import json,re

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v386-9-scene-field-input'
runtime=out/'v322-glb-runtime.mjs'

if not runtime.exists():raise SystemExit('MOVX v386.9 requires built unified CRT runtime')
runtime_text=runtime.read_text()
for contract in (
    'v363-crt-direct-manipulation.mjs?v=v386-5-selector-intent',
    'v364-crt-object-interaction.mjs?v=v386-4-direct-control-priority',
):
    if contract not in runtime_text:raise SystemExit(f'MOVX v386.9 fresh module cache missing: {contract}')

direct=(out/'v363-crt-direct-manipulation.mjs').read_text()
object_js=(out/'v364-crt-object-interaction.mjs').read_text()
for contract in (
    "const surface=boot?.querySelector('.scene-inner')||boot?.querySelector('.boot-stage')||wrap;",
    "document.documentElement.dataset.crtInputSurface='v386.9-scene-field';",
    "inputSurface:'scene-inner'",
):
    if contract not in direct:raise SystemExit(f'MOVX v386.9 direct field capability missing: {contract}')
for contract in (
    "const surface=boot?.querySelector('.scene-inner')||boot?.querySelector('.boot-stage')||wrap;",
    "document.documentElement.dataset.crtControlOwnership='v386.9-scene-direct-first';",
    "inputSurface:'scene-inner'",
):
    if contract not in object_js:raise SystemExit(f'MOVX v386.9 cabinet field capability missing: {contract}')

installed=[]
for name in ('index.html','latest.html'):
    path=out/name;text=path.read_text()
    if 'data-v386-input-surface="v386-8-scene-pick-surface"' not in text:
        raise SystemExit(f'MOVX v386.9 requires v386.8 build marker in {name}')
    text=re.sub(r'data-v386-input-surface="[^"]+"',f'data-v386-input-surface="{release}"',text,count=1)
    path.write_text(text);installed.append(name)

models=sorted(p.name for p in (out/'models').glob('*.glb'))
if models!=['movx-crt-tv.glb']:raise SystemExit(f'MOVX v386.9 single-model invariant failed: {models}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'scope':'Scene 01 / boot-tv only',
    'input_surface':'scene-inner',
    'hit_authority':'Three.js raycast',
    'editorial_controls':'excluded before raycast capture',
    'selector':'v386.5 bounded projected intent retained',
    'new_listener_families':0,
    'new_webgl_resources':0,
    'models':models,
},ensure_ascii=False))