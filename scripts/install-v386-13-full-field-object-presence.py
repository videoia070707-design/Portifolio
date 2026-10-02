"""MOVX v386.13 — align physical hover/presence with the visible Scene-01 field.

v386.9 moved real screen/dial/body manipulation to `.scene-inner`; v386.10 moved
simple screen/selector click there too. The older v366 hover/press presence family
was still bound to `.crt-wrap`, so visibly projected cabinet geometry outside that
historical DOM box could drag/click but would not receive hover depth/light response.

This release keeps exactly the same v366 presence family and Three.js raycast hit
authority, but ships the updated source under a fresh child-module cache key. The
still-unpublished v386.4 unified-runtime shell URL remains stable, matching the
existing release-chain contract. No new model, renderer, context, scene, RAF or
listener family is introduced.
"""
from pathlib import Path
import json,re

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v386-13-full-field-object-presence'
runtime_path=out/'v322-glb-runtime.mjs'
presence_path=out/'v366-crt-presence.mjs'

if not runtime_path.exists() or not presence_path.exists():
    raise SystemExit('MOVX v386.13 requires the built current CRT runtime and v366 presence module')

presence=presence_path.read_text()
for contract in (
    "const surface=boot?.querySelector('.scene-inner')||boot?.querySelector('.boot-stage')||wrap;",
    "surface.addEventListener('pointermove',move,{passive:true});",
    "surface.addEventListener('pointerdown',down,{passive:true});",
    "dataset.crtPresenceSurface='v386.13-scene-field'",
    "inputSurface:'scene-inner'",
):
    if contract not in presence:
        raise SystemExit(f'MOVX v386.13 full-field presence capability missing: {contract}')

runtime=runtime_path.read_text()
runtime,count=re.subn(
    r"v366-crt-presence\.mjs\?v=[^']+",
    f'v366-crt-presence.mjs?v={release}',
    runtime,
    count=1,
)
if count!=1:
    raise SystemExit('MOVX v386.13 could not cache-bust the v366 physical-presence child module')
runtime_path.write_text(runtime)

installed=[]
for name in ('index.html','latest.html'):
    path=out/name;text=path.read_text()
    if 'data-v386-input-surface="v386-9-scene-field-input"' not in text:
        raise SystemExit(f'MOVX v386.13 requires the current v386.9 Scene-01 input field in {name}')
    if 'data-v386-channel-click="v386-10-channel-click-field"' not in text:
        raise SystemExit(f'MOVX v386.13 requires the current v386.10 click field in {name}')
    if 'v322-glb-runtime.mjs?v=v386-4-hero-selector-stability' not in text:
        raise SystemExit(f'MOVX v386.13 requires the still-unpublished v386.4 shell URL in {name}')
    if 'data-v386-object-presence=' not in text:
        text=text.replace('<html ',f'<html data-v386-object-presence="{release}" ',1)
    else:
        text=re.sub(r'data-v386-object-presence="[^"]+"',f'data-v386-object-presence="{release}"',text,count=1)
    path.write_text(text);installed.append(name)

models=sorted(p.name for p in (out/'models').glob('*.glb'))
if models!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v386.13 single-model invariant failed: {models}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'scope':'Scene 01 / boot-tv only',
    'presence_surface':'scene-inner',
    'hit_authority':'Three.js raycast; editorial controls excluded',
    'existing_input_families':'v361/v363/v364/v366 reused; no new family',
    'new_listener_families':0,
    'new_webgl_resources':0,
    'runtime_shell':'still-unpublished v386.4 shell URL retained',
    'presence_child_cache':'fresh v386.13 URL',
    'models':models,
},ensure_ascii=False))