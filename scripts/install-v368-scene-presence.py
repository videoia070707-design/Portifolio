"""MOVX v368 — make the whole first scene spatially aware.

Runs after v367. The CRT remains the sole production GLB. v368 adds one
scene-level pointer state source and injects its update into the existing v322
render frame before the v367 director. It adds no WebGL renderer/context,
scene, model or requestAnimationFrame loop.
"""
from pathlib import Path
import json, re, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v368-scene-presence'
js_name='v368-scene-presence.mjs'
runtime_path=out/'v322-glb-runtime.mjs'

src=root/'site'/js_name
if not src.exists():
    raise SystemExit(f'MOVX v368 source missing: {src}')
shutil.copy2(src,out/js_name)

if not runtime_path.exists():
    raise SystemExit('MOVX v368 requires the built v367 CRT runtime')
runtime=runtime_path.read_text()

director_import="import {attachCRTSceneDirector} from './v367-crt-scene-director.mjs?v=v367-scene01-director';"
presence_import=f"import {{attachCRTScenePresence}} from './{js_name}?v={release}';"
if presence_import not in runtime:
    if runtime.count(director_import)!=1:
        raise SystemExit('MOVX v368 could not find the v367 director import')
    runtime=runtime.replace(director_import,presence_import+'\n'+director_import,1)

frame_old='''    attachCRTPresence(instance);\n    instance.presence?.update(t);\n    attachCRTSceneDirector(instance);\n    instance.sceneDirector?.update(t);\n    instance.renderer.render(instance.scene,instance.camera);'''
frame_new='''    attachCRTPresence(instance);\n    instance.presence?.update(t);\n    attachCRTScenePresence(instance);\n    instance.scenePresence?.update(t);\n    attachCRTSceneDirector(instance);\n    instance.sceneDirector?.update(t);\n    instance.renderer.render(instance.scene,instance.camera);'''
if frame_new not in runtime:
    if runtime.count(frame_old)!=1:
        raise SystemExit('MOVX v368 could not install scene presence before the v367 director')
    runtime=runtime.replace(frame_old,frame_new,1)

runtime_path.write_text(runtime)

installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-crt-director-layer="v367-scene01-director"' not in text:
        raise SystemExit(f'MOVX v368 requires the built v367 marker in {name}')
    if 'data-crt-scene-presence-layer=' not in text:
        text=text.replace('<html ',f'<html data-crt-scene-presence-layer="{release}" ',1)
    else:
        text=re.sub(r'data-crt-scene-presence-layer="[^"]+"',f'data-crt-scene-presence-layer="{release}"',text,count=1)
    text=text.replace('v322-glb-runtime.mjs?v=v367-scene01-director',f'v322-glb-runtime.mjs?v={release}')
    if f'v322-glb-runtime.mjs?v={release}' not in text:
        raise SystemExit(f'MOVX v368 runtime cache key missing in {name}')
    path.write_text(text)
    installed.append(name)

published=sorted(p.name for p in (out/'models').glob('*.glb'))
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v368 single-model invariant failed: {published}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'single_model_gate':True,
    'scene_presence':'scene-inner pointer -> shared state -> v367 camera/light/type',
    'physical_presence':'v366 CRT raycast remains independent for object interaction',
    'render_loop':'shared v322 frame; zero extra RAFs introduced by v368',
    'webgl':'zero new renderer/context/scene/model',
    'other_models':'deferred and unpublished',
    'assets':[js_name],
    'published_glbs':published,
},ensure_ascii=False))
