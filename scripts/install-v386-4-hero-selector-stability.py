"""MOVX v386.4 — stabilize Scene-01 short viewport layout + physical selector pickup.

Runs after v386.3. It adds no model, renderer, context, scene, RAF or input
listener. The source modules copied earlier in the build already contain the
v386.4 selector pickup / gesture ownership fix; this final installer only marks
that contract and cache-busts those modules + the unified runtime for production.
"""
from pathlib import Path
import json,re

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v386-4-hero-selector-stability'
runtime=out/'v322-glb-runtime.mjs'

if not runtime.exists():raise SystemExit('MOVX v386.4 requires the built CRT runtime')
text=runtime.read_text()

contracts={
    'direct':("v363-crt-direct-manipulation.mjs",'v386-4-selector-pickup'),
    'object':("v364-crt-object-interaction.mjs",'v386-4-direct-control-priority'),
}
for label,(filename,version) in contracts.items():
    pattern=rf"(\./{re.escape(filename)}\?v=)[^'\"]+"
    text,count=re.subn(pattern,rf"\g<1>{version}",text,count=1)
    if count!=1:raise SystemExit(f'MOVX v386.4 could not cache-bust {label} runtime import')

runtime.write_text(text)

installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    html=path.read_text()
    if 'data-v386-safe-projection="v386-3-landscape-field"' not in html:
        raise SystemExit(f'MOVX v386.4 requires v386.3 projection in {name}')
    if 'data-v386-hero-stability=' not in html:
        html=html.replace('<html ',f'<html data-v386-hero-stability="{release}" ',1)
    else:
        html=re.sub(r'data-v386-hero-stability="[^"]+"',f'data-v386-hero-stability="{release}"',html,count=1)
    html,count=re.subn(r'v322-glb-runtime\.mjs\?v=[^"\']+',f'v322-glb-runtime.mjs?v={release}',html,count=1)
    if count!=1:raise SystemExit(f'MOVX v386.4 could not cache-bust unified runtime in {name}')
    path.write_text(html)
    installed.append(name)

# Verify source copies in the built artifact, not only repository sources.
direct=(out/'v363-crt-direct-manipulation.mjs').read_text()
object_js=(out/'v364-crt-object-interaction.mjs').read_text()
if 'const nearKnob=event=>' not in direct or "dataset.crtSelectorPickup='v386.4-bounded'" not in direct:
    raise SystemExit('MOVX v386.4 selector pickup source did not reach built artifact')
if 'if(instance.directManipulation?.state?.active)return;' not in object_js:
    raise SystemExit('MOVX v386.4 direct-control priority did not reach built artifact')

models=sorted(p.name for p in (out/'models').glob('*.glb'))
if models!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v386.4 single-model invariant failed: {models}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'scope':'#boot / boot-tv only',
    'short_viewport':'fixed editorial rail + dedicated CRT field',
    'selector':'bounded projected pickup around the real tripo_part_8 selector',
    'gesture_ownership':'v363 direct controls before v364 cabinet orbit',
    'new_webgl_resources':0,
    'models':models,
},ensure_ascii=False))
