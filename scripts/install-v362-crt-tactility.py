"""MOVX v362 — add tactile feedback to the already-approved v361 CRT channels.

This installer is intentionally incremental. It runs after v358/v361, keeps the
single production GLB and single WebGL context, and only augments the existing
screen/selector interaction plus the public cache key.
"""
from pathlib import Path
import json, re, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v362-crt-tactility'
css_name='v362-crt-tactility.css'
js_name='v362-crt-tactility.mjs'
runtime_path=out/'v322-glb-runtime.mjs'

for name in (css_name,js_name):
    src=root/'site'/name
    if not src.exists():
        raise SystemExit(f'MOVX v362 source missing: {src}')
    shutil.copy2(src,out/name)

if not runtime_path.exists():
    raise SystemExit('MOVX v362 requires the built v361 CRT runtime')

runtime=runtime_path.read_text()
channel_import="import {attachCRTChannels} from './v361-crt-channels.mjs?v=v361-live-channels';"
tactile_import=f"import {{attachCRTTactility}} from './{js_name}?v={release}';"
if tactile_import not in runtime:
    if runtime.count(channel_import)!=1:
        raise SystemExit('MOVX v362 could not find the v361 channel import')
    runtime=runtime.replace(channel_import,channel_import+'\n'+tactile_import,1)

frame_old='''    attachCRTChannels(instance);
    instance.channels?.update(t);
    instance.renderer.render(instance.scene,instance.camera);'''
frame_new='''    attachCRTChannels(instance);
    instance.channels?.update(t);
    attachCRTTactility(instance);
    instance.tactility?.update(t);
    instance.renderer.render(instance.scene,instance.camera);'''
if frame_new not in runtime:
    if runtime.count(frame_old)!=1:
        raise SystemExit('MOVX v362 could not install tactile update in the shared frame')
    runtime=runtime.replace(frame_old,frame_new,1)

# Keep the v358 renderer identity stable: v362 is a capability layered on top
# of that approved core, exposed separately through the tactility markers.
runtime_path.write_text(runtime)

css_link=f'<link rel="stylesheet" href="{css_name}?v={release}" data-v362-crt-style="{release}">'
installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-model-scope="v350-crt-only"' not in text:
        raise SystemExit(f'MOVX v362 refuses to run without the CRT-only production gate in {name}')
    if 'data-crt-tactility=' not in text:
        text=text.replace('<html ',f'<html data-crt-tactility="{release}" ',1)
    else:
        text=re.sub(r'data-crt-tactility="[^"]+"',f'data-crt-tactility="{release}"',text,count=1)
    if 'data-v362-crt-style=' not in text:
        text=text.replace('</head>',css_link+'\n</head>',1)
    text=text.replace('v322-glb-runtime.mjs?v=v361-live-channels',f'v322-glb-runtime.mjs?v={release}')
    path.write_text(text)
    installed.append(name)

print(json.dumps({
    'release':release,
    'installed':installed,
    'single_model_gate':True,
    'runtime':runtime_path.name,
    'renderer_identity':'v358-crt-spatial-runtime',
    'assets':[css_name,js_name]
},ensure_ascii=False))