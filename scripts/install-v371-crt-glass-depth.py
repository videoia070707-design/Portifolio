"""MOVX v371 — add optical glass depth to the approved CRT screen.

Runs after v370. The CRT remains the sole production GLB. v371 wraps the
existing v361 screen material and updates its optical uniforms from v367/v368
state inside the shared v322 frame. It adds no renderer, canvas, scene, model,
listener or requestAnimationFrame loop.
"""
from pathlib import Path
import json, re, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v371-curved-screen-glass'
js_name='v371-crt-glass-depth.mjs'
runtime_path=out/'v322-glb-runtime.mjs'

src=root/'site'/js_name
if not src.exists():
    raise SystemExit(f'MOVX v371 source missing: {src}')
shutil.copy2(src,out/js_name)

if not runtime_path.exists():
    raise SystemExit('MOVX v371 requires the built shared CRT runtime')
runtime=runtime_path.read_text()

director_import="import {attachCRTSceneDirector} from './v367-crt-scene-director.mjs?v=v367-scene01-director';"
glass_import=f"import {{attachCRTGlassDepth}} from './{js_name}?v={release}';"
if glass_import not in runtime:
    if runtime.count(director_import)!=1:
        raise SystemExit('MOVX v371 could not find the v367 director import')
    runtime=runtime.replace(director_import,director_import+'\n'+glass_import,1)

frame_old='''    attachCRTSceneDirector(instance);\n    instance.sceneDirector?.update(t);\n    instance.renderer.render(instance.scene,instance.camera);'''
frame_new='''    attachCRTSceneDirector(instance);\n    instance.sceneDirector?.update(t);\n    attachCRTGlassDepth(instance);\n    instance.crtGlassDepth?.update(t);\n    instance.renderer.render(instance.scene,instance.camera);'''
if frame_new not in runtime:
    if runtime.count(frame_old)!=1:
        raise SystemExit('MOVX v371 could not install glass depth before the shared render')
    runtime=runtime.replace(frame_old,frame_new,1)

runtime_path.write_text(runtime)

old_runtime_url='v322-glb-runtime.mjs?v=v368-scene-presence-patch-v368-channel-settle'
new_runtime_url='v322-glb-runtime.mjs?v=v368-scene-presence-patch-v368-channel-settle-v371-crt-glass-depth'
installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-crt-light-spill-layer="v370-screen-to-room"' not in text:
        raise SystemExit(f'MOVX v371 requires v370 screen-to-room light in {name}')
    if 'data-crt-glass-depth-layer=' not in text:
        text=text.replace('<html ',f'<html data-crt-glass-depth-layer="{release}" ',1)
    else:
        text=re.sub(r'data-crt-glass-depth-layer="[^"]+"',f'data-crt-glass-depth-layer="{release}"',text,count=1)
    text=text.replace(old_runtime_url,new_runtime_url)
    if new_runtime_url not in text:
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
    'screen':'existing tripo_part_1 mesh / v361 material',
    'optics':'view-dependent Fresnel + curved edge falloff + pointer-driven specular response',
    'driver':'existing v367 director + v368 scene presence + channel state',
    'render_loop':'shared v322 frame; zero extra RAFs introduced by v371',
    'input':'zero new listeners introduced by v371',
    'webgl':'same renderer/context/scene/model',
    'assets':[js_name],
    'published_glbs':published,
},ensure_ascii=False))
