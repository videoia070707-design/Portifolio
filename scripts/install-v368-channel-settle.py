"""MOVX v368 channel-settle patch.

Runs after v368 scene presence. It does not add a renderer, context, scene,
model, listener or RAF. It only promotes the updated v361 live-screen module
with a fresh import cache key and cache-busts the shared runtime URL so clients
cannot reuse the pre-fix channel code.
"""
from pathlib import Path
import json, re

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v368-channel-settle'
runtime_path=out/'v322-glb-runtime.mjs'

if not runtime_path.exists():
    raise SystemExit('MOVX v368 channel-settle requires the built shared CRT runtime')
runtime=runtime_path.read_text()
old="./v361-crt-channels.mjs?v=v361-live-channels"
new=f"./v361-crt-channels.mjs?v={release}"
if new not in runtime:
    if runtime.count(old)!=1:
        raise SystemExit('MOVX channel-settle could not find the v361 live-screen import')
    runtime=runtime.replace(old,new,1)
runtime_path.write_text(runtime)

# Keep the v368 scene-presence cache-contract prefix visible to the existing
# performance gate while still forcing browsers/CDNs to fetch the patched v322
# module. This is a patch of v368, not a new Scene-01 architecture revision.
old_runtime_url='v322-glb-runtime.mjs?v=v368-scene-presence'
patched_runtime_url='v322-glb-runtime.mjs?v=v368-scene-presence-patch-v368-channel-settle'

installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-crt-scene-presence-layer="v368-scene-presence"' not in text:
        raise SystemExit(f'MOVX channel-settle requires v368 scene presence in {name}')
    if 'data-crt-channel-settle=' not in text:
        text=text.replace('<html ',f'<html data-crt-channel-settle="{release}" ',1)
    else:
        text=re.sub(r'data-crt-channel-settle="[^"]+"',f'data-crt-channel-settle="{release}"',text,count=1)
    text=text.replace(old_runtime_url,patched_runtime_url)
    if patched_runtime_url not in text:
        raise SystemExit(f'MOVX channel-settle runtime cache key missing in {name}')
    path.write_text(text)
    installed.append(name)

published=sorted(p.name for p in (out/'models').glob('*.glb'))
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX channel-settle single-model invariant failed: {published}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'fix':'non-animated CRT channels always commit one fully settled post-wipe frame',
    'runtime':'shared v322 renderer/frame unchanged',
    'runtime_cache_key':patched_runtime_url,
    'channel_import':new,
    'single_model_gate':True,
    'published_glbs':published,
},ensure_ascii=False))
