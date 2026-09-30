"""MOVX v375 — couple direct CRT manipulation to the Scene-01 camera and light.

Runs after v374. The existing v364 cabinet orbit is deepened, then v375 consumes
that state at the end of the existing v322 render frame. No second model, renderer,
WebGL context, scene, input listener or requestAnimationFrame is introduced.
"""
from pathlib import Path
import json, re, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v375-spatial-grab'
js_name='v375-crt-spatial-grab.mjs'
css_name='v375-crt-spatial-grab.css'
runtime_path=out/'v322-glb-runtime.mjs'

for name in (js_name,css_name):
    src=root/'site'/name
    if not src.exists():
        raise SystemExit(f'MOVX v375 source missing: {src}')
    shutil.copy2(src,out/name)
css=(root/'site'/css_name).read_text()

if not runtime_path.exists():
    raise SystemExit('MOVX v375 requires the built v374 Scene-01 runtime')
runtime=runtime_path.read_text()

# v364 source changed in this release; cache-bust that imported capability while
# keeping its public capability marker stable for historical contracts.
old_object_import="import {attachCRTObjectInteraction} from './v364-crt-object-interaction.mjs?v=v364-immersive-object';"
new_object_import="import {attachCRTObjectInteraction} from './v364-crt-object-interaction.mjs?v=v375-spatial-grab';"
if new_object_import not in runtime:
    if runtime.count(old_object_import)!=1:
        raise SystemExit('MOVX v375 could not find the v364 object-interaction import')
    runtime=runtime.replace(old_object_import,new_object_import,1)

volume_import="import {attachCRTObjectVolume} from './v371-crt-object-volume.mjs?v=v371-object-volume';"
grab_import=f"import {{attachCRTSpatialGrab}} from './{js_name}?v={release}';"
if grab_import not in runtime:
    if runtime.count(volume_import)!=1:
        raise SystemExit('MOVX v375 could not find the v371 object-volume import')
    runtime=runtime.replace(volume_import,volume_import+'\n'+grab_import,1)

frame_old='''    attachCRTObjectVolume(instance);\n    instance.objectVolume?.update(t);\n    instance.renderer.render(instance.scene,instance.camera);'''
frame_new='''    attachCRTObjectVolume(instance);\n    instance.objectVolume?.update(t);\n    attachCRTSpatialGrab(instance);\n    instance.spatialGrab?.update(t);\n    instance.renderer.render(instance.scene,instance.camera);'''
if frame_new not in runtime:
    if runtime.count(frame_old)!=1:
        raise SystemExit('MOVX v375 could not install spatial grab after object volume')
    runtime=runtime.replace(frame_old,frame_new,1)

runtime_path.write_text(runtime)

# Keep v375 CSS critical/inline so Scene 01 gains no extra stylesheet request and
# the existing production CSS-layer budget remains unchanged.
style_tag=f'<style data-v375-spatial-grab="{release}">\n{css}\n</style>'
installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-crt-safe-framing-layer="v374-short-viewport"' not in text:
        raise SystemExit(f'MOVX v375 requires the validated v374 framing layer in {name}')
    if 'data-crt-object="v364-immersive-object"' not in text:
        raise SystemExit(f'MOVX v375 requires the v364 physical object interaction in {name}')
    if 'data-crt-spatial-grab-layer=' not in text:
        text=text.replace('<html ',f'<html data-crt-spatial-grab-layer="{release}" ',1)
    else:
        text=re.sub(r'data-crt-spatial-grab-layer="[^"]+"',f'data-crt-spatial-grab-layer="{release}"',text,count=1)
    if 'data-v375-spatial-grab=' not in text:
        text=text.replace('</head>',style_tag+'\n</head>',1)

    # Preserve the validated v372 key as the first query parameter so historical
    # static contracts remain meaningful, while the added layer parameter changes
    # the complete URL and forces browsers to fetch the v375 runtime bytes.
    old_key='v322-glb-runtime.mjs?v=v372-channel-pose-authority'
    new_key='v322-glb-runtime.mjs?v=v372-channel-pose-authority&layer=v375-spatial-grab'
    text=text.replace(old_key,new_key)
    if new_key not in text:
        raise SystemExit(f'MOVX v375 runtime cache key missing in {name}')
    path.write_text(text)
    installed.append(name)

published=sorted(p.name for p in (out/'models').glob('*.glb'))
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v375 single-model invariant failed: {published}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'single_model_gate':True,
    'interaction':'cabinet drag -> real CRT orbit + counter-camera + existing-room light response',
    'orbit':'deepened but bounded three-quarter manipulation with inertia',
    'camera':'existing v367 camera is offset after scene composition; zero new camera object',
    'lighting':'existing key/fill/rim react to grab state',
    'render_loop':'shared v322 frame; zero extra RAFs',
    'input':'reuses v364 pointer listeners; zero new input listeners',
    'css_delivery':'critical inline; zero extra stylesheet requests',
    'new_webgl_resources':0,
    'other_models':'deferred and unpublished',
    'assets':[js_name,css_name],
    'published_glbs':published,
},ensure_ascii=False))
