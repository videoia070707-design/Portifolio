"""Static compatibility gate for MOVX v380.1 physical channel retune.

v380.1 remains a required runtime capability, but later Scene-01 releases own the
final page cache key. Validate the v380 marker/import/update ordering plus the
current v386.15 final runtime instead of requiring a historical page query string.
"""
from pathlib import Path
import json

root=Path(__file__).resolve().parents[1]
out=root/'_site'
errors=[]
release='v380-physical-channel-retune'
cache_release='v380-1-frame-stable-retune'
final_release='v386-15-surface-contact'
js_name='v380-crt-channel-retune.mjs'

for name in ('index.html','latest.html'):
    path=out/name
    if not path.exists():
        errors.append(f'missing {name}')
        continue
    text=path.read_text()
    if f'data-crt-retune-layer="{release}"' not in text:
        errors.append(f'{name} missing v380 html marker')
    if 'data-crt-editorial-grid-layer="v379-editorial-safe-zones"' not in text:
        errors.append(f'{name} lost v379 Scene-01 contract')
    if 'data-crt-pickup-layer="v378-physical-pickup"' not in text:
        errors.append(f'{name} lost v378 physical pickup')
    if f'v322-glb-runtime.mjs?v={final_release}' not in text:
        errors.append(f'{name} missing current v386.15 final runtime cache key')
    if 'data-v386-hero-stability="v386-4-hero-selector-stability"' not in text:
        errors.append(f'{name} missing current v386.4 Hero stability marker')
    if 'data-v386-surface-contact="v386-15-surface-contact"' not in text:
        errors.append(f'{name} missing current v386.15 contact marker')

runtime=out/'v322-glb-runtime.mjs'
if not runtime.exists():
    errors.append('missing built v322 runtime')
else:
    text=runtime.read_text()
    for contract in (
        "import {attachCRTChannelRetune} from './v380-crt-channel-retune.mjs?v=v380-1-frame-stable-retune';",
        'attachCRTChannelRetune(instance);',
        'instance.channelRetune?.update(t);',
    ):
        if contract not in text:errors.append(f'v380.1 runtime contract missing: {contract}')
    pickup=text.find('instance.physicalPickup?.update(t);')
    retune=text.find('instance.channelRetune?.update(t);')
    render=text.find('instance.renderer.render(instance.scene,instance.camera);')
    if not (0<=pickup<retune<render):
        errors.append('v380.1 must run after pickup and before the existing render')

source=out/js_name
if not source.exists():
    errors.append(f'missing {js_name}')
    js_bytes=0
else:
    js_bytes=source.stat().st_size
    if js_bytes>12_000:errors.append(f'{js_name} is {js_bytes} bytes; budget 12000')
    text=source.read_text()
    for contract in (
        "root.dataset.crtChannelRetune='v380-ready'",
        "root.dataset.crtChannelRetuneLoop='shared-v322-frame'",
        'const authority=manualActive?0:1',
        'state.elapsedMs=Math.min(DURATION,state.elapsedMs+dt*1000)',
        'instance.group.position.z+=state.depthKick',
        'instance.camera.fov=clamp(instance.camera.fov+state.fovKick,24,34)',
        'No model, renderer, context, scene, listener or requestAnimationFrame',
    ):
        if contract not in text:errors.append(f'v380.1 source contract missing: {contract}')

models=sorted(p.name for p in (out/'models').glob('*.glb')) if (out/'models').exists() else []
if models!=['movx-crt-tv.glb']:
    errors.append(f'v380.1 single-model invariant failed: {models}')

if errors:raise SystemExit('MOVX v380.1 static compatibility QA failed: '+json.dumps(errors,ensure_ascii=False))
print(json.dumps({'status':'passed','release':release,'capability_cache':cache_release,'final_release':final_release,'js_bytes':js_bytes,'published_glbs':models,'scope':'frame-stable channel switch physical retune preserved inside v386.15'},ensure_ascii=False))
