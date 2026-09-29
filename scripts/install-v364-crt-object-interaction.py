"""MOVX v364 — make the approved CRT cabinet a directly manipulable 3D object.

Runs after v363. It keeps the same production GLB, WebGL context, canvas and
requestAnimationFrame. The real screen/selector remain v363 controls; dragging
other cabinet geometry adds a restrained orbit with inertia. This pass also
cache-busts the v354 framing fix so the complete TV stays visible during scroll.
"""
from pathlib import Path
import json, re, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v364-immersive-object'
css_name='v364-crt-object-interaction.css'
js_name='v364-crt-object-interaction.mjs'
runtime_path=out/'v322-glb-runtime.mjs'

for name in (css_name,js_name):
    src=root/'site'/name
    if not src.exists():
        raise SystemExit(f'MOVX v364 source missing: {src}')
    shutil.copy2(src,out/name)

if not runtime_path.exists():
    raise SystemExit('MOVX v364 requires the built v363 CRT runtime')

runtime=runtime_path.read_text()
direct_import="import {attachCRTDirectManipulation} from './v363-crt-direct-manipulation.mjs?v=v363-direct-manipulation';"
object_import=f"import {{attachCRTObjectInteraction}} from './{js_name}?v={release}';"
if object_import not in runtime:
    if runtime.count(direct_import)!=1:
        raise SystemExit('MOVX v364 could not find the v363 direct-manipulation import')
    runtime=runtime.replace(direct_import,direct_import+'\n'+object_import,1)

frame_old='''    attachCRTDirectManipulation(instance);
    instance.directManipulation?.update(t);
    instance.renderer.render(instance.scene,instance.camera);'''
frame_new='''    attachCRTDirectManipulation(instance);
    instance.directManipulation?.update(t);
    attachCRTObjectInteraction(instance);
    instance.objectInteraction?.update(t);
    instance.renderer.render(instance.scene,instance.camera);'''
if frame_new not in runtime:
    if runtime.count(frame_old)!=1:
        raise SystemExit('MOVX v364 could not install object manipulation in the shared frame')
    runtime=runtime.replace(frame_old,frame_new,1)

# Renderer identity stays v358; v364 is another capability on the same owner.
runtime_path.write_text(runtime)

css_link=f'<link rel="stylesheet" href="{css_name}?v={release}" data-v364-crt-style="{release}">'
installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-model-scope="v350-crt-only"' not in text:
        raise SystemExit(f'MOVX v364 refuses to run without CRT-only production gate in {name}')
    if 'data-crt-direct="v363-direct-manipulation"' not in text:
        raise SystemExit(f'MOVX v364 requires the built v363 direct-manipulation marker in {name}')
    if 'data-crt-object=' not in text:
        text=text.replace('<html ',f'<html data-crt-object="{release}" ',1)
    else:
        text=re.sub(r'data-crt-object="[^"]+"',f'data-crt-object="{release}"',text,count=1)
    if 'data-v364-crt-style=' not in text:
        text=text.replace('</head>',css_link+'\n</head>',1)
    text=text.replace('v322-glb-runtime.mjs?v=v363-direct-manipulation',f'v322-glb-runtime.mjs?v={release}')
    text,count=re.subn(r'v354-boot-choreo\.js\?v=[^"\']+',f'v354-boot-choreo.js?v={release}',text,count=1)
    if count!=1:
        raise SystemExit(f'MOVX v364 could not cache-bust the framing runtime in {name}')
    path.write_text(text)
    installed.append(name)

published=sorted(p.name for p in (out/'models').glob('*.glb'))
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v364 single-model invariant failed: {published}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'single_model_gate':True,
    'runtime':runtime_path.name,
    'renderer_identity':'v358-crt-spatial-runtime',
    'capabilities':['v361-live-channels','v362-crt-tactility','v363-direct-manipulation','v364-object-orbit'],
    'framing':'restrained outer choreography; full cabinet preserved',
    'assets':[css_name,js_name],
},ensure_ascii=False))
