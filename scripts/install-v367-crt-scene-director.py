"""MOVX v367 — unify Scene 01 into one authored camera/light/type composition.

Runs after v366. The CRT remains the sole production GLB. v367 adds no renderer,
WebGL context, model, scene, RAF or pointer listener; it consumes the already
validated Scene-01 states and resolves their final camera/object/light/DOM result
inside the existing v322 render frame.
"""
from pathlib import Path
import json, re, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v367-scene01-director'
js_name='v367-crt-scene-director.mjs'
css_name='v367-crt-scene-director.css'
runtime_path=out/'v322-glb-runtime.mjs'

for name in (js_name,css_name):
    src=root/'site'/name
    if not src.exists():
        raise SystemExit(f'MOVX v367 source missing: {src}')
shutil.copy2(root/'site'/js_name,out/js_name)
css=(root/'site'/css_name).read_text()

if not runtime_path.exists():
    raise SystemExit('MOVX v367 requires the built v366 CRT runtime')
runtime=runtime_path.read_text()

presence_import="import {attachCRTPresence} from './v366-crt-presence.mjs?v=v366-clean-boot-presence';"
director_import=f"import {{attachCRTSceneDirector}} from './{js_name}?v={release}';"
if director_import not in runtime:
    if runtime.count(presence_import)!=1:
        raise SystemExit('MOVX v367 could not find the v366 presence import')
    runtime=runtime.replace(presence_import,presence_import+'\n'+director_import,1)

frame_old='''    attachCRTChannelPhysics(instance);\n    instance.channelPhysics?.update(t);\n    attachCRTPresence(instance);\n    instance.presence?.update(t);\n    instance.renderer.render(instance.scene,instance.camera);'''
frame_new='''    attachCRTChannelPhysics(instance);\n    instance.channelPhysics?.update(t);\n    attachCRTPresence(instance);\n    instance.presence?.update(t);\n    attachCRTSceneDirector(instance);\n    instance.sceneDirector?.update(t);\n    instance.renderer.render(instance.scene,instance.camera);'''
if frame_new not in runtime:
    if runtime.count(frame_old)!=1:
        raise SystemExit('MOVX v367 could not install the Scene-01 director in the shared frame')
    runtime=runtime.replace(frame_old,frame_new,1)

runtime_path.write_text(runtime)

style_tag=f'<style data-v367-scene-director="{release}">\n{css}\n</style>'
installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-crt-presence-layer="v366-clean-boot-presence"' not in text:
        raise SystemExit(f'MOVX v367 requires the built v366 marker in {name}')
    if 'data-crt-director-layer=' not in text:
        text=text.replace('<html ',f'<html data-crt-director-layer="{release}" ',1)
    else:
        text=re.sub(r'data-crt-director-layer="[^"]+"',f'data-crt-director-layer="{release}"',text,count=1)
    if 'data-v367-scene-director=' not in text:
        text=text.replace('</head>',style_tag+'\n</head>',1)
    text=text.replace('v322-glb-runtime.mjs?v=v366-clean-boot-presence',f'v322-glb-runtime.mjs?v={release}')
    if f'v322-glb-runtime.mjs?v={release}' not in text:
        raise SystemExit(f'MOVX v367 runtime cache key missing in {name}')
    path.write_text(text)
    installed.append(name)

published=sorted(p.name for p in (out/'models').glob('*.glb'))
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v367 single-model invariant failed: {published}')

print(json.dumps({
  'release':release,
  'installed':installed,
  'single_model_gate':True,
  'director':'scroll + existing pointer state + channel state -> camera/object/light/editorial DOM',
  'render_loop':'shared v322 frame; zero extra RAFs introduced by v367',
  'input':'consumes v366 presence state; zero extra pointer listeners introduced by v367',
  'other_models':'deferred and unpublished',
  'assets':[js_name,css_name],
  'published_glbs':published,
},ensure_ascii=False))
