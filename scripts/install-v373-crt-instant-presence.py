"""MOVX v373.3 — make Scene-01 feel interactive before the real GLB is ready.

v373 reuses the authored poster inserted by v358. The poster acknowledges the
existing pointer/channel state during loading and cross-fades into the single
approved CRT renderer. v373.2 made the pointer bridge portable by publishing
pixel-valued poster vars from the EXISTING v358 pointer handler.

v373.3 fixes delivery order: v370 has already inlined its critical Scene-01 CSS
into index/latest before this installer runs, so appending only to the emitted
v370 file does not affect the shipped HTML. This installer now keeps the emitted
v370 file in sync AND injects the v373 rules into that existing critical <style>
block. No extra stylesheet/script request, listener, RAF, model, canvas, scene or
WebGL resource is added.
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

critical_pattern=re.compile(
    r'(<style\s+data-v370-crt-light-spill="v370-screen-to-room"[^>]*>)(.*?)(</style>)',
    re.S,
)

def inject_critical_v373(text,name):
    match=critical_pattern.search(text)
    if not match:
        raise SystemExit(f'MOVX v373.3 cannot find delivered v370 critical CSS block in {name}')
    if marker in match.group(2):
        return text
    body=match.group(2).rstrip()+'\n\n'+css.rstrip()+'\n'
    return text[:match.start()]+match.group(1)+body+match.group(3)+text[match.end():]

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

    # v370 was inlined earlier in the build. Inject into the already-delivered
    # critical block rather than only mutating a file the HTML no longer loads.
    text=inject_critical_v373(text,name)
    if marker not in text or '--crt-poster-x' not in text:
        raise SystemExit(f'MOVX v373.3 critical poster CSS was not delivered in {name}')
    path.write_text(text)
    installed.append(name)

built_bundle=bundle_path.read_text()
if marker not in built_bundle:
    raise SystemExit('MOVX v373 CSS did not reach the emitted v370 bundle')
if '--crt-poster-x' not in (out/'v358-crt-immersion.js').read_text():
    raise SystemExit('MOVX v373.2 pointer-length bridge is missing from built v358 controller')

published=sorted(p.name for p in (out/'models').glob('*.glb'))
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v373 single-model invariant failed: {published}')

print(json.dumps({
    'release':release,
    'delivery_revision':'v373.3-inline-critical-delivery',
    'pointer_bridge':bridge_release,
    'installed':installed,
    'single_model_gate':True,
    'perceived_loading':'authored poster reacts to existing channel/pointer variables before GLB ready',
    'handoff':'poster remains rendered and fades optically to the real renderer instead of display:none cut',
    'css_delivery':f'injected into the existing v370 critical style block and mirrored in {bundle_name}; zero additional stylesheet requests',
    'pointer_delivery':'existing v358 pointer handler publishes --crt-poster-x/y lengths; zero additional listeners',
    'new_script_requests':0,
    'new_raf':0,
    'new_webgl_resources':0,
    'other_models':'deferred and unpublished',
    'source_asset':css_name,
    'published_glbs':published,
},ensure_ascii=False))
