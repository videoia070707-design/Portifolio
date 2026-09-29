"""MOVX v366 — clean first paint, stronger CRT presence and roomier Scene-01 grid.

Runs after v365 and keeps the one-model production gate. The normal boot path no
longer mounts the procedural CRT streaming proxy: the authored poster of the real
TV stays visible until the canonical GLB is decoded. The real CRT then gains a
stronger pointer/camera/light presence layer inside the existing render frame.
"""
from pathlib import Path
import json, re, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v366-clean-boot-presence'
js_name='v366-crt-presence.mjs'
css_name='v366-crt-presence.css'
runtime_path=out/'v322-glb-runtime.mjs'

for name in (js_name,css_name):
    src=root/'site'/name
    if not src.exists():raise SystemExit(f'MOVX v366 source missing: {src}')
shutil.copy2(root/'site'/js_name,out/js_name)
css=(root/'site'/css_name).read_text()

if not runtime_path.exists():raise SystemExit('MOVX v366 requires the built v365 CRT runtime')
runtime=runtime_path.read_text()

physics_import="import {attachCRTChannelPhysics} from './v365-crt-channel-physics.mjs?v=v365-channel-physics';"
presence_import=f"import {{attachCRTPresence}} from './{js_name}?v={release}';"
if presence_import not in runtime:
    if runtime.count(physics_import)!=1:raise SystemExit('MOVX v366 could not find v365 physics import')
    runtime=runtime.replace(physics_import,physics_import+'\n'+presence_import,1)

# Remove only the normal boot streaming proxy. The procedural factory remains in
# the runtime for explicit diagnostics/emergency paths, but it is never mounted
# during a healthy production load, so users no longer see the old CSS-like TV.
proxy_pattern=r'''\n    if\(instance\.name==='boot-tv'\)\{\n      const factory=await getProceduralFactory\(\);.*?\n      \}\n    \}\n\n    const early='''
if 'procedural-streaming-proxy' in runtime:
    runtime,count=re.subn(proxy_pattern,"\n    const early=",runtime,count=1,flags=re.S)
    if count!=1:raise SystemExit('MOVX v366 could not remove the normal procedural streaming proxy')
if 'procedural-streaming-proxy' in runtime:raise SystemExit('MOVX v366 proxy marker survived runtime patch')

frame_old='''    attachCRTChannelPhysics(instance);\n    instance.channelPhysics?.update(t);\n    instance.renderer.render(instance.scene,instance.camera);'''
frame_new='''    attachCRTChannelPhysics(instance);\n    instance.channelPhysics?.update(t);\n    attachCRTPresence(instance);\n    instance.presence?.update(t);\n    instance.renderer.render(instance.scene,instance.camera);'''
if frame_new not in runtime:
    if runtime.count(frame_old)!=1:raise SystemExit('MOVX v366 could not install presence in the shared CRT frame')
    runtime=runtime.replace(frame_old,frame_new,1)
runtime_path.write_text(runtime)

style_tag=f'<style data-v366-crt-presence="{release}">\n{css}\n</style>'
installed=[]
for name in ('index.html','latest.html'):
    path=out/name;text=path.read_text()
    if 'data-crt-channel-physics="v365-channel-physics"' not in text:
        raise SystemExit(f'MOVX v366 requires the built v365 marker in {name}')
    if 'data-crt-presence-layer=' not in text:
        text=text.replace('<html ',f'<html data-crt-presence-layer="{release}" data-crt-loading="poster-only" ',1)
    if 'data-v366-crt-presence=' not in text:text=text.replace('</head>',style_tag+'\n</head>',1)
    text=text.replace('v322-glb-runtime.mjs?v=v365-channel-physics',f'v322-glb-runtime.mjs?v={release}')
    if f'v322-glb-runtime.mjs?v={release}' not in text:raise SystemExit(f'MOVX v366 runtime cache key missing in {name}')
    path.write_text(text);installed.append(name)

published=sorted(p.name for p in (out/'models').glob('*.glb'))
if published!=['movx-crt-tv.glb']:raise SystemExit(f'MOVX v366 single-model invariant failed: {published}')

print(json.dumps({
  'release':release,'installed':installed,'single_model_gate':True,
  'loading':'real authored poster until canonical GLB ready; no normal procedural proxy',
  'presence':'pointer-driven model/camera/light depth inside existing frame',
  'hero_grid':'roomier Scene-01 headline/copy/channel spacing',
  'renderer_identity':'v358-crt-spatial-runtime','published_glbs':published,
  'assets':[js_name,css_name]
},ensure_ascii=False))
