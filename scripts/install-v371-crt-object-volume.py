"""MOVX v371 — give the real Scene-01 CRT a readable presentation volume.

Runs after v370. The approved CRT remains the only production GLB. v371 consumes
v368 scene-wide presence and runs after the v367 director inside the existing
v322 frame. It adds no WebGL renderer/context, scene, model, input listener or RAF.
"""
from pathlib import Path
import json, re, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v371-object-volume'
js_name='v371-crt-object-volume.mjs'
runtime_path=out/'v322-glb-runtime.mjs'

src=root/'site'/js_name
if not src.exists():
    raise SystemExit(f'MOVX v371 source missing: {src}')
shutil.copy2(src,out/js_name)

if not runtime_path.exists():
    raise SystemExit('MOVX v371 requires the built v368+ CRT runtime')
runtime=runtime_path.read_text()

director_import="import {attachCRTSceneDirector} from './v367-crt-scene-director.mjs?v=v367-scene01-director';"
volume_import=f"import {{attachCRTObjectVolume}} from './{js_name}?v={release}';"
if volume_import not in runtime:
    if runtime.count(director_import)!=1:
        raise SystemExit('MOVX v371 could not find the v367 director import')
    runtime=runtime.replace(director_import,director_import+'\n'+volume_import,1)

frame_old='''    attachCRTScenePresence(instance);\n    instance.scenePresence?.update(t);\n    attachCRTSceneDirector(instance);\n    instance.sceneDirector?.update(t);\n    instance.renderer.render(instance.scene,instance.camera);'''
frame_new='''    attachCRTScenePresence(instance);\n    instance.scenePresence?.update(t);\n    attachCRTSceneDirector(instance);\n    instance.sceneDirector?.update(t);\n    attachCRTObjectVolume(instance);\n    instance.objectVolume?.update(t);\n    instance.renderer.render(instance.scene,instance.camera);'''
if frame_new not in runtime:
    if runtime.count(frame_old)!=1:
        raise SystemExit('MOVX v371 could not install object volume after the Scene-01 director')
    runtime=runtime.replace(frame_old,frame_new,1)

runtime_path.write_text(runtime)

installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-crt-light-spill-layer="v370-screen-to-room"' not in text:
        raise SystemExit(f'MOVX v371 requires the built v370 light-spill Scene 01 in {name}')
    if 'data-crt-scene-presence-layer="v368-scene-presence"' not in text:
        raise SystemExit(f'MOVX v371 requires v368 scene presence in {name}')
    if 'data-crt-object-volume-layer=' not in text:
        text=text.replace('<html ',f'<html data-crt-object-volume-layer="{release}" ',1)
    else:
        text=re.sub(r'data-crt-object-volume-layer="[^"]+"',f'data-crt-object-volume-layer="{release}"',text,count=1)
    text=text.replace('v322-glb-runtime.mjs?v=v368-scene-presence',f'v322-glb-runtime.mjs?v={release}')
    if f'v322-glb-runtime.mjs?v={release}' not in text:
        raise SystemExit(f'MOVX v371 runtime cache key missing in {name}')
    path.write_text(text)
    installed.append(name)

published=sorted(p.name for p in (out/'models').glob('*.glb'))
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v371 single-model invariant failed: {published}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'single_model_gate':True,
    'object_volume':'channel rest pose + scene-pointer orbit + subtle idle depth on the real Three.js group',
    'manual_priority':'v364/v363 direct manipulation suppresses v371 presentation motion',
    'reduced_motion':'static three-quarter pose; no pointer or idle motion',
    'coarse_pointer':'static three-quarter pose; no continuous pointer motion',
    'render_loop':'shared v322 frame; zero extra RAFs introduced by v371',
    'input':'reuses v368 scene presence; zero extra listeners introduced by v371',
    'webgl':'zero new renderer/context/scene/model',
    'other_models':'deferred and unpublished',
    'assets':[js_name],
    'published_glbs':published,
},ensure_ascii=False))
