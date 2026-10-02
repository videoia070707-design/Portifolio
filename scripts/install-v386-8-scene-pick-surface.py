"""MOVX v386.8/v386.9 — validate physical CRT input coverage.

The original v386.8 fix moved v363/v364 from `.crt-wrap` to `.boot-stage`.
v386.9 is a strict superset: the same listener families now live on the complete
`.scene-inner` because the v386 camera can visibly project screen/cabinet beyond
both historical boxes. Three.js remains hit authority; semantic editorial controls
are excluded. This historical build stage validates the current superset rather
than rejecting it by release-label string.
"""
from pathlib import Path
import json,re

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v386-8-scene-pick-surface'
runtime=out/'v322-glb-runtime.mjs'

if not runtime.exists():raise SystemExit('MOVX v386.8 requires the built unified CRT runtime')
runtime_text=runtime.read_text()
for contract in (
    'v363-crt-direct-manipulation.mjs?v=v386-5-selector-intent',
    'v364-crt-object-interaction.mjs?v=v386-4-direct-control-priority',
):
    if contract not in runtime_text:raise SystemExit(f'MOVX v386.8 expected unpublished fresh module cache missing: {contract}')

direct=(out/'v363-crt-direct-manipulation.mjs').read_text()
object_js=(out/'v364-crt-object-interaction.mjs').read_text()
for contract in (
    "const surface=boot?.querySelector('.scene-inner')||boot?.querySelector('.boot-stage')||wrap;",
    "surface.addEventListener('pointerdown',begin,{passive:false});",
    "document.documentElement.dataset.crtInputSurface='v386.9-scene-field';",
):
    if contract not in direct:raise SystemExit(f'MOVX v386.8/v386.9 direct input-surface capability missing: {contract}')
for contract in (
    "const surface=boot?.querySelector('.scene-inner')||boot?.querySelector('.boot-stage')||wrap;",
    "surface.addEventListener('pointerdown',begin,{passive:false});",
    "document.documentElement.dataset.crtControlOwnership='v386.9-scene-direct-first';",
):
    if contract not in object_js:raise SystemExit(f'MOVX v386.8/v386.9 cabinet input-surface capability missing: {contract}')

installed=[]
for name in ('index.html','latest.html'):
    path=out/name;text=path.read_text()
    if 'data-v386-mobile-projection="v386-5-mobile-safe-projection"' not in text:
        raise SystemExit(f'MOVX v386.8 requires v386.5 projection in {name}')
    if 'v322-glb-runtime.mjs?v=v386-4-hero-selector-stability' not in text:
        raise SystemExit(f'MOVX v386.8 requires the still-unpublished fresh v386.4 shell URL in {name}')
    if 'data-v386-input-surface=' not in text:
        text=text.replace('<html ',f'<html data-v386-input-surface="{release}" ',1)
    else:
        text=re.sub(r'data-v386-input-surface="[^"]+"',f'data-v386-input-surface="{release}"',text,count=1)
    path.write_text(text);installed.append(name)

models=sorted(p.name for p in (out/'models').glob('*.glb'))
if models!=['movx-crt-tv.glb']:raise SystemExit(f'MOVX v386.8 single-model invariant failed: {models}')

print(json.dumps({
    'release':release,
    'build_gate_revision':'v386.9 scene-field superset accepted',
    'installed':installed,
    'scope':'Scene 01 / boot-tv only',
    'input_surface':'existing v363/v364 pointer families on complete scene-inner field',
    'hit_authority':'Three.js raycast; editorial controls excluded',
    'selector':'v386.5 local selector intent preserved',
    'ownership':'v363 direct screen/dial capture precedes v364 cabinet orbit',
    'new_listeners':0,
    'new_webgl_resources':0,
    'runtime_shell_cache':'v386-4-hero-selector-stability (still unpublished/fresh)',
    'direct_module_cache':'v386-5-selector-intent (still unpublished/fresh)',
    'models':models,
},ensure_ascii=False))