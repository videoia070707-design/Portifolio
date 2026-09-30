"""MOVX v373 — make Scene-01 feel interactive before the real GLB is ready.

v373 reuses the authored poster inserted by v358. The poster now acknowledges the
existing pointer/channel CSS variables during loading and cross-fades into the
single approved CRT renderer. To avoid another production stylesheet request,
its source is bundled into the already-loaded v370 Scene-01 CSS layer.

No JavaScript, RAF, model, canvas, scene or WebGL resource is added by this pass.
"""
from pathlib import Path
import json, re

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v373-poster-continuity'
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
marker='/* MOVX v373 — instant presence before the GLB finishes decoding.'
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
    if 'data-crt-instant-presence-layer=' not in text:
        text=text.replace('<html ',f'<html data-crt-instant-presence-layer="{release}" ',1)
    else:
        text=re.sub(r'data-crt-instant-presence-layer="[^"]+"',f'data-crt-instant-presence-layer="{release}"',text,count=1)
    path.write_text(text)
    installed.append(name)

if marker not in bundle_path.read_text():
    raise SystemExit('MOVX v373 CSS did not reach the existing v370 production bundle')

published=sorted(p.name for p in (out/'models').glob('*.glb'))
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v373 single-model invariant failed: {published}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'single_model_gate':True,
    'perceived_loading':'authored poster reacts to existing channel/pointer variables before GLB ready',
    'handoff':'poster remains rendered and fades optically to the real renderer instead of display:none cut',
    'css_delivery':f'bundled into existing {bundle_name}; zero additional stylesheet requests',
    'new_javascript':0,
    'new_raf':0,
    'new_webgl_resources':0,
    'other_models':'deferred and unpublished',
    'source_asset':css_name,
    'published_glbs':published,
},ensure_ascii=False))
