"""MOVX v380 — make channel switching one physical Scene-01 event.

Runs after v379. The new layer consumes the existing v361 semantic channel state
and runs after the validated v378 pickup stack inside the same v322 frame. It adds
only bounded selector/object/camera/light response; no model, renderer, WebGL
context, scene, input listener or requestAnimationFrame is introduced.
"""
from pathlib import Path
import json, re, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v380-physical-channel-retune'
js_name='v380-crt-channel-retune.mjs'
runtime_path=out/'v322-glb-runtime.mjs'

src=root/'site'/js_name
if not src.exists():
    raise SystemExit(f'MOVX v380 source missing: {src}')
shutil.copy2(src,out/js_name)

if not runtime_path.exists():
    raise SystemExit('MOVX v380 requires the built v379 CRT runtime')
runtime=runtime_path.read_text()

pickup_import="import {attachCRTPhysicalPickup} from './v378-crt-physical-pickup.mjs?v=v378-physical-pickup';"
retune_import=f"import {{attachCRTChannelRetune}} from './{js_name}?v={release}';"
if retune_import not in runtime:
    if runtime.count(pickup_import)!=1:
        raise SystemExit('MOVX v380 could not find the v378 pickup import')
    runtime=runtime.replace(pickup_import,pickup_import+'\n'+retune_import,1)

frame_old='''    attachCRTPhysicalPickup(instance);\n    instance.physicalPickup?.update(t);\n    instance.renderer.render(instance.scene,instance.camera);'''
frame_new='''    attachCRTPhysicalPickup(instance);\n    instance.physicalPickup?.update(t);\n    attachCRTChannelRetune(instance);\n    instance.channelRetune?.update(t);\n    instance.renderer.render(instance.scene,instance.camera);'''
if frame_new not in runtime:
    if runtime.count(frame_old)!=1:
        raise SystemExit('MOVX v380 could not install retune after v378 pickup')
    runtime=runtime.replace(frame_old,frame_new,1)

runtime_path.write_text(runtime)

installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-crt-editorial-grid-layer="v379-editorial-safe-zones"' not in text:
        raise SystemExit(f'MOVX v380 requires the validated v379 Scene-01 contract in {name}')
    if 'data-crt-pickup-layer="v378-physical-pickup"' not in text:
        raise SystemExit(f'MOVX v380 requires the validated v378 physical pickup in {name}')
    if 'data-crt-retune-layer=' not in text:
        text=text.replace('<html ',f'<html data-crt-retune-layer="{release}" ',1)
    else:
        text=re.sub(r'data-crt-retune-layer="[^"]+"',f'data-crt-retune-layer="{release}"',text,count=1)

    old_key='v322-glb-runtime.mjs?v=v372-channel-pose-authority&layer=v375-spatial-grab&physics=v376-1-visible-recoil&focus=v377-physical-focus-pull&pickup=v378-physical-pickup'
    new_key=old_key+f'&retune={release}'
    text=text.replace(old_key,new_key)
    if new_key not in text:
        raise SystemExit(f'MOVX v380 runtime cache key missing in {name}')
    path.write_text(text)
    installed.append(name)

published=sorted(p.name for p in (out/'models').glob('*.glb'))
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v380 single-model invariant failed: {published}')

retune=(out/js_name).read_text()
for contract in (
    "root.dataset.crtChannelRetune='v380-ready'",
    "root.dataset.crtChannelRetuneLoop='shared-v322-frame'",
    "instance.group.position.z+=state.depthKick",
    "instance.camera.fov=clamp(instance.camera.fov+state.fovKick,24,34)",
    "const authority=manualActive?0:1",
    "No model, renderer, context, scene, listener or requestAnimationFrame",
):
    if contract not in retune:
        raise SystemExit(f'MOVX v380 retune contract missing: {contract}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'single_model_gate':True,
    'event':'channel switch -> selector detent + bounded CRT recoil + focus impulse + existing-rig light lift',
    'manual_priority':'body/screen/pickup manipulation suppresses automatic retune displacement',
    'reduced_motion':'semantic channel switch remains; oscillatory retune impulse removed',
    'render_loop':'existing shared v322 frame',
    'input':'existing semantic controls only; zero new listeners',
    'new_webgl_resources':0,
    'other_models':'deferred and unpublished',
    'assets':[js_name],
    'published_glbs':published,
},ensure_ascii=False))
