"""MOVX v363 — make the approved v362 CRT directly manipulable.

This installer layers on top of v361 channels + v362 tactility. It keeps the
single production GLB, single WebGL context and shared requestAnimationFrame.
The real screen handles semantic drag gestures and the real selector can be
turned to tune channels.
"""
from pathlib import Path
import json, re, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v363-direct-manipulation'
css_name='v363-crt-direct-manipulation.css'
js_name='v363-crt-direct-manipulation.mjs'
runtime_path=out/'v322-glb-runtime.mjs'

for name in (css_name,js_name):
    src=root/'site'/name
    if not src.exists():
        raise SystemExit(f'MOVX v363 source missing: {src}')
    shutil.copy2(src,out/name)

if not runtime_path.exists():
    raise SystemExit('MOVX v363 requires the built v362 CRT runtime')

runtime=runtime_path.read_text()
tactile_import="import {attachCRTTactility} from './v362-crt-tactility.mjs?v=v362-crt-tactility';"
direct_import=f"import {{attachCRTDirectManipulation}} from './{js_name}?v={release}';"
if direct_import not in runtime:
    if runtime.count(tactile_import)!=1:
        raise SystemExit('MOVX v363 could not find the v362 tactility import')
    runtime=runtime.replace(tactile_import,tactile_import+'\n'+direct_import,1)

frame_old='''    attachCRTTactility(instance);
    instance.tactility?.update(t);
    instance.renderer.render(instance.scene,instance.camera);'''
frame_new='''    attachCRTTactility(instance);
    instance.tactility?.update(t);
    attachCRTDirectManipulation(instance);
    instance.directManipulation?.update(t);
    instance.renderer.render(instance.scene,instance.camera);'''
if frame_new not in runtime:
    if runtime.count(frame_old)!=1:
        raise SystemExit('MOVX v363 could not install direct manipulation in the shared frame')
    runtime=runtime.replace(frame_old,frame_new,1)

# The renderer core stays v358. v361/v362/v363 are capabilities layered on top.
runtime_path.write_text(runtime)

css_link=f'<link rel="stylesheet" href="{css_name}?v={release}" data-v363-crt-style="{release}">'
installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-model-scope="v350-crt-only"' not in text:
        raise SystemExit(f'MOVX v363 refuses to run without CRT-only production gate in {name}')
    if 'data-crt-tactility="v362-crt-tactility"' not in text:
        raise SystemExit(f'MOVX v363 requires v362 tactility marker in {name}')
    if 'data-crt-direct=' not in text:
        text=text.replace('<html ',f'<html data-crt-direct="{release}" ',1)
    else:
        text=re.sub(r'data-crt-direct="[^"]+"',f'data-crt-direct="{release}"',text,count=1)
    if 'data-v363-crt-style=' not in text:
        text=text.replace('</head>',css_link+'\n</head>',1)
    text=text.replace('v322-glb-runtime.mjs?v=v362-crt-tactility',f'v322-glb-runtime.mjs?v={release}')
    path.write_text(text)
    installed.append(name)

published=sorted(p.name for p in (out/'models').glob('*.glb'))
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v363 single-model invariant failed: {published}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'single_model_gate':True,
    'runtime':runtime_path.name,
    'renderer_identity':'v358-crt-spatial-runtime',
    'capabilities':['v361-live-channels','v362-crt-tactility','v363-direct-manipulation'],
    'assets':[css_name,js_name]
},ensure_ascii=False))
