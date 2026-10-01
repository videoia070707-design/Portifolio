"""Static gate for MOVX v386 immersive Hero through v386.5 projection/intent fixes."""
from pathlib import Path
import json

root=Path(__file__).resolve().parents[1]
out=root/'_site'
css=(root/'site'/'v386-hero-immersion.css').read_text()
projection=(root/'site'/'v386-3-crt-safe-projection.css').read_text()
errors=[]

for forbidden in ('#hero','#portal','#work','#machine','#playground','#studio','#people','#contact'):
    if forbidden in css:errors.append(f'v386 CSS escaped #boot via {forbidden}')
    if forbidden in projection:errors.append(f'v386 projection CSS escaped #boot via {forbidden}')
if '#boot' not in css:errors.append('v386 CSS has no #boot scope')
if '#boot' not in projection:errors.append('v386 projection CSS has no #boot scope')
for contract in ('height:auto!important','aspect-ratio:1.2 / 1!important','aspect-ratio:1.30 / 1!important','aspect-ratio:1.12 / 1!important'):
    if contract not in projection:errors.append(f'v386 safe-projection contract missing: {contract}')
for contract in (
    'grid-template-columns:minmax(620px,1fr) minmax(400px,430px)!important',
    'width:430px!important',
    'column-gap:clamp(70px,5.6vw,88px)!important',
    'top:clamp(-300px,calc(100svh - 1030px),-190px)!important',
):
    if contract not in css:errors.append(f'v386.5 Hero/grid contract missing: {contract}')

for name in ('index.html','latest.html'):
    path=out/name
    if not path.exists():errors.append(f'missing built page {name}');continue
    text=path.read_text()
    if 'data-v386-hero-immersion="v386-spatial-hero"' not in text:errors.append(f'{name} missing v386 marker')
    if '<style data-v386-hero-immersion="v386-spatial-hero">' not in text:errors.append(f'{name} missing v386 critical CSS')
    if 'data-v386-safe-projection="v386-3-landscape-field"' not in text:errors.append(f'{name} missing v386.3 projection marker')
    if '<style data-v386-safe-projection="v386-3-landscape-field">' not in text:errors.append(f'{name} missing v386 projection CSS')
    if 'aspect-ratio:1.12 / 1!important' not in text:errors.append(f'{name} missing v386.5 mobile projection CSS')
    if 'data-v386-hero-stability="v386-4-hero-selector-stability"' not in text:errors.append(f'{name} missing v386.4 stability marker')
    if 'data-v386-mobile-projection="v386-5-mobile-safe-projection"' not in text:errors.append(f'{name} missing v386.5 projection marker')
    if 'v322-glb-runtime.mjs?v=v386-5-mobile-safe-projection' not in text:errors.append(f'{name} missing v386.5 final runtime cache key')

controller=out/'v358-crt-immersion.js'
if not controller.exists():errors.append('built v358 controller missing')
else:
    js=controller.read_text()
    for contract in ("yaw:rad(-16.0)","yaw:rad(17.0)","yaw:rad(-12.0)","yaw:rad(14.0)","root.style.setProperty('--crt-poster-x'","root.style.setProperty('--crt-poster-y'"):
        if contract not in js:errors.append(f'v386 controller contract missing: {contract}')

direct=out/'v363-crt-direct-manipulation.mjs'
if not direct.exists():errors.append('built v363 direct manipulation missing')
else:
    js=direct.read_text()
    for contract in ('const nearKnob=event=>','const selectorIntent=nearKnob(event);',"const kind=(obj===knob||selectorIntent)?'knob':obj===screen?'screen':'none';","dataset.crtSelectorPickup='v386.5-intent-priority'"):
        if contract not in js:errors.append(f'v386.5 selector intent contract missing: {contract}')

object_js=out/'v364-crt-object-interaction.mjs'
if not object_js.exists():errors.append('built v364 object interaction missing')
else:
    js=object_js.read_text()
    if 'if(instance.directManipulation?.state?.active)return;' not in js:errors.append('cabinet orbit can still steal direct-control pointerdown')
    if "dataset.crtControlOwnership='v386.4-direct-first'" not in js:errors.append('direct-first ownership marker missing')

runtime=out/'v322-glb-runtime.mjs'
if not runtime.exists():errors.append('built unified CRT runtime missing')
else:
    js=runtime.read_text()
    if 'v363-crt-direct-manipulation.mjs?v=v386-5-selector-intent' not in js:errors.append('v386.5 selector module cache key missing')
    if 'v364-crt-object-interaction.mjs?v=v386-4-direct-control-priority' not in js:errors.append('cabinet ownership module cache key missing')

models=sorted(p.name for p in (out/'models').glob('*.glb')) if (out/'models').exists() else []
if models!=['movx-crt-tv.glb']:errors.append(f'single-model gate failed: {models}')
if errors:raise SystemExit('MOVX v386.5 static QA failed: '+json.dumps(errors,ensure_ascii=False))
print(json.dumps({'qa':'v386.5-static','status':'PASS','scope':'#boot only','models':models,'projection':'desktop/short/mobile safe fields','short_visible_crt':True,'selector':'bounded physical-knob intent priority + direct-first ownership'},ensure_ascii=False))
