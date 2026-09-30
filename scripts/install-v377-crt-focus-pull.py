"""MOVX v377 — physical focus pull for the approved Scene-01 CRT.

Runs after v376.1. The v375 spatial-grab source is already copied earlier in the
build; v377 cache-busts that capability, adds a critical inline editorial response,
and marks the new shared-state focus contract. No second model, renderer, WebGL
context, scene, input listener or requestAnimationFrame is introduced.
"""
from pathlib import Path
import json, re, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v377-physical-focus-pull'
css_name='v377-crt-focus-pull.css'
runtime_path=out/'v322-glb-runtime.mjs'

src=root/'site'/css_name
if not src.exists():
    raise SystemExit(f'MOVX v377 source missing: {src}')
shutil.copy2(src,out/css_name)
css=src.read_text()
if len(css.encode())>12_000:
    raise SystemExit(f'MOVX v377 critical CSS exceeds 12 KB: {len(css.encode())}')

if not runtime_path.exists():
    raise SystemExit('MOVX v377 requires the built v376.1 CRT runtime')
runtime=runtime_path.read_text()

old_import="import {attachCRTSpatialGrab} from './v375-crt-spatial-grab.mjs?v=v375-spatial-grab';"
new_import=f"import {{attachCRTSpatialGrab}} from './v375-crt-spatial-grab.mjs?v={release}';"
if new_import not in runtime:
    if runtime.count(old_import)!=1:
        raise SystemExit('MOVX v377 could not find the v375 spatial-grab import')
    runtime=runtime.replace(old_import,new_import,1)
runtime_path.write_text(runtime)

style_tag=f'<style data-v377-focus-pull="{release}">\n{css}\n</style>'
installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-crt-orbit-recoil-layer="v376-1-visible-recoil"' not in text:
        raise SystemExit(f'MOVX v377 requires the validated v376.1 recoil layer in {name}')
    if 'data-crt-spatial-grab-layer="v375-spatial-grab"' not in text:
        raise SystemExit(f'MOVX v377 requires v375 spatial grab in {name}')
    if 'data-crt-focus-pull-layer=' not in text:
        text=text.replace('<html ',f'<html data-crt-focus-pull-layer="{release}" ',1)
    else:
        text=re.sub(r'data-crt-focus-pull-layer="[^"]+"',f'data-crt-focus-pull-layer="{release}"',text,count=1)
    if 'data-v377-focus-pull=' not in text:
        text=text.replace('</head>',style_tag+'\n</head>',1)

    old_key='v322-glb-runtime.mjs?v=v372-channel-pose-authority&layer=v375-spatial-grab&physics=v376-1-visible-recoil'
    new_key=old_key+f'&focus={release}'
    text=text.replace(old_key,new_key)
    if new_key not in text:
        raise SystemExit(f'MOVX v377 runtime cache key missing in {name}')
    path.write_text(text)
    installed.append(name)

published=sorted(p.name for p in (out/'models').glob('*.glb'))
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v377 single-model invariant failed: {published}')

grab=(out/'v375-crt-spatial-grab.mjs').read_text()
contracts=(
    "root.dataset.crtFocusPull='v377-ready'",
    "--v377-focus",
    "--v377-copy-shift",
    "instance.camera.position.z+=state.camZ-state.focus*.018",
    "heldLift=state.focus",
)
for contract in contracts:
    if contract not in grab:
        raise SystemExit(f'MOVX v377 grab contract missing: {contract}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'single_model_gate':True,
    'interaction':'existing cabinet grab -> CRT lift + camera focus pull + room light pressure + editorial recede',
    'render_loop':'existing shared v322 frame',
    'input':'existing v364 listeners only',
    'css_delivery':'critical inline; zero extra stylesheet requests',
    'new_webgl_resources':0,
    'other_models':'deferred and unpublished',
    'assets':['v375-crt-spatial-grab.mjs',css_name],
    'published_glbs':published,
},ensure_ascii=False))
