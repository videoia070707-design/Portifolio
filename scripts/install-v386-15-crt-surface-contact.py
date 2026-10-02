"""MOVX v386.15 — make the already-interactive CRT advertise physical contact.

Runs after v386.14. Reuses v366 raycast presence and the existing shared v322
frame; adds no model, renderer, WebGL context, scene, input listener or RAF.
"""
from pathlib import Path
import json,re,shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v386-15-surface-contact'
js_name='v386-15-crt-surface-contact.mjs'
css_name='v386-15-crt-surface-contact.css'
runtime_path=out/'v322-glb-runtime.mjs'

for name in (js_name,css_name):
    src=root/'site'/name
    if not src.exists():raise SystemExit(f'MOVX v386.15 source missing: {src}')
    shutil.copy2(src,out/name)
css=(root/'site'/css_name).read_text()
if len(css.encode())>9_000:raise SystemExit(f'MOVX v386.15 critical CSS exceeds 9 KB: {len(css.encode())}')

if not runtime_path.exists():raise SystemExit('MOVX v386.15 requires the built current CRT runtime')
runtime=runtime_path.read_text()
retune_import="import {attachCRTChannelRetune} from './v380-crt-channel-retune.mjs?v=v380-1-frame-stable-retune';"
contact_import=f"import {{attachCRTSurfaceContact}} from './{js_name}?v={release}';"
if contact_import not in runtime:
    if runtime.count(retune_import)!=1:raise SystemExit('MOVX v386.15 could not find current channel-retune import')
    runtime=runtime.replace(retune_import,retune_import+'\n'+contact_import,1)

frame_old='''    attachCRTChannelRetune(instance);\n    instance.channelRetune?.update(t);\n    instance.renderer.render(instance.scene,instance.camera);'''
frame_new='''    attachCRTChannelRetune(instance);\n    instance.channelRetune?.update(t);\n    attachCRTSurfaceContact(instance);\n    instance.surfaceContact?.update(t);\n    instance.renderer.render(instance.scene,instance.camera);'''
if frame_new not in runtime:
    if runtime.count(frame_old)!=1:raise SystemExit('MOVX v386.15 could not install contact after channel retune')
    runtime=runtime.replace(frame_old,frame_new,1)
runtime_path.write_text(runtime)

style=f'<style data-v386-surface-contact="{release}">\n{css}\n</style>'
installed=[]
for name in ('index.html','latest.html'):
    path=out/name;text=path.read_text()
    for contract in (
        'data-v386-tall-framing="v386-14-tall-viewport"',
        'data-v386-object-presence="v386-13-full-field-object-presence"',
        'data-model-scope="v350-crt-only"',
    ):
        if contract not in text:raise SystemExit(f'MOVX v386.15 requires {contract} in {name}')
    if 'data-v386-surface-contact=' not in text:
        text=text.replace('<html ',f'<html data-v386-surface-contact="{release}" ',1)
    else:
        text=re.sub(r'data-v386-surface-contact="[^"]+"',f'data-v386-surface-contact="{release}"',text,count=1)
    if '<style data-v386-surface-contact=' not in text:text=text.replace('</head>',style+'\n</head>',1)
    text=text.replace('v322-glb-runtime.mjs?v=v386-4-hero-selector-stability',f'v322-glb-runtime.mjs?v={release}')
    if f'v322-glb-runtime.mjs?v={release}' not in text:raise SystemExit(f'MOVX v386.15 fresh runtime URL missing in {name}')
    path.write_text(text);installed.append(name)

models=sorted(p.name for p in (out/'models').glob('*.glb'))
if models!=['movx-crt-tv.glb']:raise SystemExit(f'MOVX v386.15 single-model invariant failed: {models}')
source=(out/js_name).read_text()
for contract in (
    "root.dataset.crtSurfaceContact='v386.15-ready'",
    "root.dataset.crtSurfaceContactLoop='shared-v322-frame'",
    "const surface=classify(presence.lastSurface);",
    "instance.group.position.z+=state.depth",
    "No new model, renderer, scene, RAF or listener family",
):
    if contract not in source:raise SystemExit(f'MOVX v386.15 contact contract missing: {contract}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'scope':'Scene 01 / approved CRT only',
    'interaction':'existing v366 raycast presence -> surface-aware body/screen/dial contact response',
    'hint':'surface semantic hint follows actual Three.js hit surface',
    'lighting':'existing key/rim rig only; no new light objects',
    'render_loop':'existing shared v322 frame',
    'input':'existing listeners only; zero new listeners',
    'runtime_shell':'fresh v386.15 URL',
    'new_webgl_resources':0,
    'models':models,
},ensure_ascii=False))
