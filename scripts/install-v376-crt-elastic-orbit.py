"""MOVX v376 — elastic safety stops for direct CRT orbit.

Runs after v375. The v364 source is already copied earlier in the build; v376 only
cache-busts that updated capability and marks the validated physics revision. No
second model, renderer, context, scene, input listener or RAF is introduced.
"""
from pathlib import Path
import json, re

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v376-elastic-boundary'
runtime_path=out/'v322-glb-runtime.mjs'

if not runtime_path.exists():
    raise SystemExit('MOVX v376 requires the built v375 CRT runtime')
runtime=runtime_path.read_text()

old_import="import {attachCRTObjectInteraction} from './v364-crt-object-interaction.mjs?v=v375-spatial-grab';"
new_import=f"import {{attachCRTObjectInteraction}} from './v364-crt-object-interaction.mjs?v={release}';"
if new_import not in runtime:
    if runtime.count(old_import)!=1:
        raise SystemExit('MOVX v376 could not find the v375 object-interaction import')
    runtime=runtime.replace(old_import,new_import,1)

runtime_path.write_text(runtime)

installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-crt-spatial-grab-layer="v375-spatial-grab"' not in text:
        raise SystemExit(f'MOVX v376 requires v375 spatial grab in {name}')
    if 'data-crt-orbit-physics-layer=' not in text:
        text=text.replace('<html ',f'<html data-crt-orbit-physics-layer="{release}" ',1)
    else:
        text=re.sub(r'data-crt-orbit-physics-layer="[^"]+"',f'data-crt-orbit-physics-layer="{release}"',text,count=1)
    old_key='v322-glb-runtime.mjs?v=v372-channel-pose-authority&layer=v375-spatial-grab'
    new_key=old_key+f'&physics={release}'
    text=text.replace(old_key,new_key)
    if new_key not in text:
        raise SystemExit(f'MOVX v376 runtime cache key missing in {name}')
    path.write_text(text)
    installed.append(name)

published=sorted(p.name for p in (out/'models').glob('*.glb'))
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v376 single-model invariant failed: {published}')

source=(out/'v364-crt-object-interaction.mjs').read_text()
contracts=(
    "pointerVelocityYaw",
    "edgeCompressionYaw",
    "boundaryBounce",
    "crtOrbitPhysics='v376-elastic-boundary'",
    "integrateElastic",
)
for contract in contracts:
    if contract not in source:
        raise SystemExit(f'MOVX v376 source contract missing: {contract}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'single_model_gate':True,
    'fix':'pointer-derived momentum survives the authored orbit clamp; safety stop rebounds inward',
    'yaw_limit_radians':0.50,
    'pitch_limit_radians':0.20,
    'render_loop':'existing shared v322 frame',
    'input':'existing v364 listeners only',
    'new_webgl_resources':0,
    'other_models':'deferred and unpublished',
    'published_glbs':published,
},ensure_ascii=False))
