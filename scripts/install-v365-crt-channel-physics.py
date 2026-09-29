"""MOVX v365 — give each CRT channel a physical/spatial signature.

Runs after v364. Direction, Motion, AI and Digital now affect the real CRT body,
lighting and screen glow while preserving the same GLB, scene, renderer, canvas,
WebGL context and requestAnimationFrame. Manual v364 cabinet orbit remains the
highest-priority spatial input. AI media remains a temporary authored placeholder
until the user's project video is supplied.
"""
from pathlib import Path
import json, re, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v365-channel-physics'
js_name='v365-crt-channel-physics.mjs'
runtime_path=out/'v322-glb-runtime.mjs'

src=root/'site'/js_name
if not src.exists():
    raise SystemExit(f'MOVX v365 source missing: {src}')
shutil.copy2(src,out/js_name)

if not runtime_path.exists():
    raise SystemExit('MOVX v365 requires the built v364 CRT runtime')

runtime=runtime_path.read_text()
object_import="import {attachCRTObjectInteraction} from './v364-crt-object-interaction.mjs?v=v364-immersive-object';"
physics_import=f"import {{attachCRTChannelPhysics}} from './{js_name}?v={release}';"
if physics_import not in runtime:
    if runtime.count(object_import)!=1:
        raise SystemExit('MOVX v365 could not find the v364 object-interaction import')
    runtime=runtime.replace(object_import,object_import+'\n'+physics_import,1)

frame_old='''    attachCRTObjectInteraction(instance);
    instance.objectInteraction?.update(t);
    instance.renderer.render(instance.scene,instance.camera);'''
frame_new='''    attachCRTObjectInteraction(instance);
    instance.objectInteraction?.update(t);
    attachCRTChannelPhysics(instance);
    instance.channelPhysics?.update(t);
    instance.renderer.render(instance.scene,instance.camera);'''
if frame_new not in runtime:
    if runtime.count(frame_old)!=1:
        raise SystemExit('MOVX v365 could not install channel physics in the shared CRT frame')
    runtime=runtime.replace(frame_old,frame_new,1)

runtime_path.write_text(runtime)

installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-crt-object="v364-immersive-object"' not in text:
        raise SystemExit(f'MOVX v365 requires the built v364 object marker in {name}')
    if 'data-crt-channel-physics=' not in text:
        text=text.replace('<html ',f'<html data-crt-channel-physics="{release}" ',1)
    else:
        text=re.sub(r'data-crt-channel-physics="[^"]+"',f'data-crt-channel-physics="{release}"',text,count=1)
    text=text.replace('v322-glb-runtime.mjs?v=v364-immersive-object',f'v322-glb-runtime.mjs?v={release}')
    if f'v322-glb-runtime.mjs?v={release}' not in text:
        raise SystemExit(f'MOVX v365 could not cache-bust the unified runtime in {name}')
    path.write_text(text)
    installed.append(name)

published=sorted(p.name for p in (out/'models').glob('*.glb'))
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v365 single-model invariant failed: {published}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'single_model_gate':True,
    'runtime':runtime_path.name,
    'renderer_identity':'v358-crt-spatial-runtime',
    'capabilities':['v361-live-channels','v362-crt-tactility','v363-direct-manipulation','v364-object-orbit','v365-channel-physics'],
    'channel_states':['direction-stable','motion-synchronised','ai-orbital-placeholder','digital-precise'],
    'ai_media':'temporary generative feed until user project video is supplied',
    'assets':[js_name],
},ensure_ascii=False))
