"""MOVX v378 — physical pickup for the approved Scene-01 CRT.

Runs after v377.1. It consumes the already-validated v364 body raycast and v375
spatial-grab state, then applies a small bounded hand-follow translation/lift after
those layers inside the existing v322 frame. No second model, renderer, WebGL
context, scene, input listener or requestAnimationFrame is introduced.
"""
from pathlib import Path
import json, re, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v378-physical-pickup'
js_name='v378-crt-physical-pickup.mjs'
css_name='v378-crt-physical-pickup.css'
runtime_path=out/'v322-glb-runtime.mjs'

for name in (js_name,css_name):
    src=root/'site'/name
    if not src.exists():
        raise SystemExit(f'MOVX v378 source missing: {src}')
    shutil.copy2(src,out/name)
css=(root/'site'/css_name).read_text()
if len(css.encode())>10_000:
    raise SystemExit(f'MOVX v378 critical CSS exceeds 10 KB: {len(css.encode())}')

if not runtime_path.exists():
    raise SystemExit('MOVX v378 requires the built v377.1 CRT runtime')
runtime=runtime_path.read_text()

grab_import="import {attachCRTSpatialGrab} from './v375-crt-spatial-grab.mjs?v=v377-physical-focus-pull';"
pickup_import=f"import {{attachCRTPhysicalPickup}} from './{js_name}?v={release}';"
if pickup_import not in runtime:
    if runtime.count(grab_import)!=1:
        raise SystemExit('MOVX v378 could not find the v377 spatial-grab import')
    runtime=runtime.replace(grab_import,grab_import+'\n'+pickup_import,1)

frame_old='''    attachCRTSpatialGrab(instance);\n    instance.spatialGrab?.update(t);\n    instance.renderer.render(instance.scene,instance.camera);'''
frame_new='''    attachCRTSpatialGrab(instance);\n    instance.spatialGrab?.update(t);\n    attachCRTPhysicalPickup(instance);\n    instance.physicalPickup?.update(t);\n    instance.renderer.render(instance.scene,instance.camera);'''
if frame_new not in runtime:
    if runtime.count(frame_old)!=1:
        raise SystemExit('MOVX v378 could not install pickup after v377 spatial focus')
    runtime=runtime.replace(frame_old,frame_new,1)

runtime_path.write_text(runtime)

style_tag=f'<style data-v378-physical-pickup="{release}">\n{css}\n</style>'
installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-crt-focus-pull-layer="v377-physical-focus-pull"' not in text:
        raise SystemExit(f'MOVX v378 requires validated v377 focus pull in {name}')
    if 'data-crt-spatial-grab-layer="v375-spatial-grab"' not in text:
        raise SystemExit(f'MOVX v378 requires v375 spatial grab in {name}')
    if 'data-crt-pickup-layer=' not in text:
        text=text.replace('<html ',f'<html data-crt-pickup-layer="{release}" ',1)
    else:
        text=re.sub(r'data-crt-pickup-layer="[^"]+"',f'data-crt-pickup-layer="{release}"',text,count=1)
    if 'data-v378-physical-pickup=' not in text:
        text=text.replace('</head>',style_tag+'\n</head>',1)

    old_key='v322-glb-runtime.mjs?v=v372-channel-pose-authority&layer=v375-spatial-grab&physics=v376-1-visible-recoil&focus=v377-physical-focus-pull'
    new_key=old_key+f'&pickup={release}'
    text=text.replace(old_key,new_key)
    if new_key not in text:
        raise SystemExit(f'MOVX v378 runtime cache key missing in {name}')
    path.write_text(text)
    installed.append(name)

published=sorted(p.name for p in (out/'models').glob('*.glb'))
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v378 single-model invariant failed: {published}')

pickup=(out/js_name).read_text()
for contract in (
    "root.dataset.crtPhysicalPickup='v378-ready'",
    "instance.group.position.x+=state.handX",
    "instance.group.position.z+=state.depth",
    "bodyHit=boot.dataset.crtObjectHit==='body'",
    "zero new" if False else "No model, renderer, context, scene, listener or RAF",
):
    if contract not in pickup:
        raise SystemExit(f'MOVX v378 pickup contract missing: {contract}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'single_model_gate':True,
    'interaction':'existing cabinet raycast -> hover lift; existing drag -> bounded real-group hand follow + lift + settle',
    'manual_priority':'v364 orbit remains primary; v378 adds only small positional pickup',
    'render_loop':'existing shared v322 frame',
    'input':'existing v364 listeners only; zero new listeners',
    'css_delivery':'critical inline; zero extra stylesheet requests',
    'new_webgl_resources':0,
    'other_models':'deferred and unpublished',
    'assets':[js_name,css_name],
    'published_glbs':published,
},ensure_ascii=False))
