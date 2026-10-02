"""MOVX v386.5/v386.16 — full-silhouette projection + stable physical selector intent.

Runs after v386.4. The v386.3 projection stylesheet is rebuilt from source earlier
in the pipeline; v386.16 verifies the widened 1.16:1 mobile field, lifts the short
CRT through its updated Hero CSS, and promotes only the selector module cache key.
The v386.4 unified-runtime page URL is intentionally retained at this stage because
later installers own the final published shell key, while the changed v363 child
module gets its own v386.5 cache key. No model, renderer, context, scene, RAF or
new listener family is introduced.
"""
from pathlib import Path
import json,re

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v386-5-mobile-safe-projection'
needle='aspect-ratio:1.16 / 1!important'
runtime=out/'v322-glb-runtime.mjs'

if not runtime.exists():raise SystemExit('MOVX v386.5 requires built unified CRT runtime')
runtime_text=runtime.read_text()
old_import="./v363-crt-direct-manipulation.mjs?v=v386-4-selector-pickup"
new_import="./v363-crt-direct-manipulation.mjs?v=v386-5-selector-intent"
if new_import not in runtime_text:
    if old_import not in runtime_text:
        raise SystemExit('MOVX v386.5 could not find v386.4 direct-manipulation import')
    runtime_text=runtime_text.replace(old_import,new_import,1)
runtime.write_text(runtime_text)

direct=out/'v363-crt-direct-manipulation.mjs'
if not direct.exists():raise SystemExit('MOVX v386.5 built direct manipulation module missing')
direct_text=direct.read_text()
for contract in (
    'const selectorIntent=nearKnob(event);',
    "const kind=(obj===knob||selectorIntent)?'knob':obj===screen?'screen':'none';",
    "dataset.crtSelectorPickup='v386.5-intent-priority'",
):
    if contract not in direct_text:raise SystemExit(f'MOVX v386.5 selector intent contract missing: {contract}')

installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-v386-hero-stability="v386-4-hero-selector-stability"' not in text:
        raise SystemExit(f'MOVX v386.5 requires v386.4 in {name}')
    if needle not in text:
        raise SystemExit(f'MOVX v386.16 mobile projection CSS missing in {name}')
    if 'top:clamp(-300px,calc(100svh - 1030px),-190px)!important' not in text:
        raise SystemExit(f'MOVX v386.5 short visible-CRT lift missing in {name}')
    if 'v322-glb-runtime.mjs?v=v386-4-hero-selector-stability' not in text:
        raise SystemExit(f'MOVX v386.5 requires fresh unpublished v386.4 shell key in {name}')
    if 'data-v386-mobile-projection=' not in text:
        text=text.replace('<html ',f'<html data-v386-mobile-projection="{release}" ',1)
    else:
        text=re.sub(r'data-v386-mobile-projection="[^"]+"',f'data-v386-mobile-projection="{release}"',text,count=1)
    path.write_text(text)
    installed.append(name)

models=sorted(p.name for p in (out/'models').glob('*.glb'))
if models!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v386.5 single-model invariant failed: {models}')

print(json.dumps({
    'release':release,
    'projection_revision':'v386.16-mobile-full-silhouette',
    'installed':installed,
    'scope':'#boot / approved CRT only',
    'mobile_projection':'1.16:1 internal WebGL field inside unchanged tall natural-flow wrapper',
    'short_projection':'physical knob/base lifted into visible 1366x768 viewport',
    'selector':'bounded projected intent owns its local footprint before screen/body hit ambiguity',
    'runtime_shell_cache':'v386-4-hero-selector-stability at this pipeline stage',
    'selector_cache':'v386-5-selector-intent',
    'pose':'unchanged approved v386 three-quarter pose',
    'new_webgl_resources':0,
    'models':models,
},ensure_ascii=False))
