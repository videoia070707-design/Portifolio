"""MOVX v373.2 — make Scene-01 feel interactive before the real GLB is ready.

v373 reuses the authored poster inserted by v358. The poster acknowledges the
existing pointer/channel state during loading and cross-fades into the single
approved CRT renderer. v373.2 makes the pointer bridge portable by publishing
pixel-valued poster vars from the EXISTING v358 pointer handler.

The v373 CSS is bundled into the already-loaded v370 Scene-01 CSS layer, and the
existing v358 controller URL is cache-busted so deployed clients receive the tiny
unit bridge. No new script request, listener, RAF, model, canvas, scene or WebGL
resource is added by this pass.
"""
from pathlib import Path
import json, re

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v373-poster-continuity'
bridge_release='v373-2-poster-pointer-bridge'
css_name='v373-crt-instant-presence.css'
bundle_name='v370-crt-light-spill.css'

src=root/'site'/css_name
bundle_path=out/bundle_name
if not src.exists():
    raise SystemExit(f'MOVX v373 source missing: {src}')
if not bundle_path.exists():
    raise SystemExit(f'MOVX v373 requires the built v370 Scene-01 CSS bundle: {bundle_path}')

css=src.read_text()
bundle=bundle_path.read_text()
marker='/* MOVX v373/v373.2 — instant presence before the GLB finishes decoding.'
if marker not in bundle:
    bundle=bundle.rstrip()+'\n\n'+css.rstrip()+'\n'
    bundle_path.write_text(bundle)

installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-crt-channel-pose-layer="v372-channel-pose-authority"' not in text:
        raise SystemExit(f'MOVX v373 requires built v372 channel pose authority in {name}')
    if 'data-crt-light-spill-layer="v370-screen-to-room"' not in text:
        raise SystemExit(f'MOVX v373 requires the loaded v370 CSS layer in {name}')
    if 'crt-loading-poster' not in text:
        raise SystemExit(f'MOVX v373 requires the authored CRT poster in {name}')
    if 'v358-crt-immersion.js?v=' not in text:
        raise SystemExit(f'MOVX v373.2 requires the existing v358 pointer controller in {name}')
    if 'data-crt-instant-presence-layer=' not in text:
        text=text.replace('<html ',f'<html data-crt-instant-presence-layer="{release}" ',1)
    else:
        text=re.sub(r'data-crt-instant-presence-layer="[^"]+"',f'data-crt-instant-presence-layer="{release}"',text,count=1)
    # Same script request, new cache key: browsers must receive the v373.2 unit
    # bridge that turns normalized pointer values into portable CSS lengths.
    text,count=re.subn(r'v358-crt-immersion\.js\?v=[^"\']+',f'v358-crt-immersion.js?v={bridge_release}',text,count=1)
    if count!=1:
        raise SystemExit(f'MOVX v373.2 could not cache-bust v358 controller in {name}')
    path.write_text(text)
    installed.append(name)

built_bundle=bundle_path.read_text()
if marker not in built_bundle:
    raise SystemExit('MOVX v373 CSS did not reach the existing v370 production bundle')
if '--crt-poster-x' not in (out/'v358-crt-immersion.js').read_text():
    raise SystemExit('MOVX v373.2 pointer-length bridge is missing from built v358 controller')

published=sorted(p.name for p in (out/'models').glob('*.glb'))
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v373 single-model invariant failed: {published}')

print(json.dumps({
    'release':release,
    'pointer_bridge':bridge_release,
    'installed':installed,
    'single_model_gate':True,
    'perceived_loading':'authored poster reacts to existing channel/pointer variables before GLB ready',
    'handoff':'poster remains rendered and fades optically to the real renderer instead of display:none cut',
    'css_delivery':f'bundled into existing {bundle_name}; zero additional stylesheet requests',
    'pointer_delivery':'existing v358 pointer handler publishes --crt-poster-x/y lengths; zero additional listeners',
    'new_script_requests':0,
    'new_raf':0,
    'new_webgl_resources':0,
    'other_models':'deferred and unpublished',
    'source_asset':css_name,
    'published_glbs':published,
},ensure_ascii=False))
