"""Static gate for MOVX v386 immersive Hero through v386.15 surface contact."""
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
    if 'data-v386-input-surface="v386-9-scene-field-input"' not in text:errors.append(f'{name} missing v386.9 scene-field marker')
    if 'data-v386-surface-contact="v386-15-surface-contact"' not in text:errors.append(f'{name} missing v386.15 surface-contact marker')
    if '<style data-v386-surface-contact="v386-15-surface-contact">' not in text:errors.append(f'{name} missing v386.15 critical CSS')
    if 'v322-glb-runtime.mjs?v=v386-15-surface-contact' not in text:errors.append(f'{name} missing fresh v386.15 shell runtime URL')

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
    for contract in (
        'const nearKnob=event=>',
        'const selectorIntent=nearKnob(event);',
        "const kind=(obj===knob||selectorIntent)?'knob':obj===screen?'screen':'none';",
        "const surface=boot?.querySelector('.scene-inner')||boot?.querySelector('.boot-stage')||wrap;",
        "surface.addEventListener('pointerdown',begin,{passive:false});",
        "dataset.crtSelectorPickup='v386.5-intent-priority'",
        "dataset.crtInputSurface='v386.9-scene-field'",
        "inputSurface:'scene-inner'",
    ):
        if contract not in js:errors.append(f'v386.9 direct-control contract missing: {contract}')

object_js=out/'v364-crt-object-interaction.mjs'
if not object_js.exists():errors.append('built v364 object interaction missing')
else:
    js=object_js.read_text()
    for contract in (
        'if(instance.directManipulation?.state?.active)return;',
        "const surface=boot?.querySelector('.scene-inner')||boot?.querySelector('.boot-stage')||wrap;",
        "surface.addEventListener('pointerdown',begin,{passive:false});",
        "dataset.crtControlOwnership='v386.9-scene-direct-first'",
        "inputSurface:'scene-inner'",
    ):
        if contract not in js:errors.append(f'v386.9 cabinet-control contract missing: {contract}')

contact=out/'v386-15-crt-surface-contact.mjs'
contact_css=out/'v386-15-crt-surface-contact.css'
if not contact.exists():errors.append('built v386.15 surface-contact runtime missing')
else:
    js=contact.read_text()
    for contract in (
        "root.dataset.crtSurfaceContact='v386.15-ready'",
        "root.dataset.crtSurfaceContactLoop='shared-v322-frame'",
        "const surface=classify(presence.lastSurface);",
        "instance.group.position.z+=state.depth",
    ):
        if contract not in js:errors.append(f'v386.15 contact contract missing: {contract}')
if not contact_css.exists():errors.append('built v386.15 surface-contact CSS missing')

runtime=out/'v322-glb-runtime.mjs'
if not runtime.exists():errors.append('built unified CRT runtime missing')
else:
    js=runtime.read_text()
    if 'v363-crt-direct-manipulation.mjs?v=v386-5-selector-intent' not in js:errors.append('fresh v386.5 direct module cache key missing')
    if 'v364-crt-object-interaction.mjs?v=v386-4-direct-control-priority' not in js:errors.append('fresh v386.4 cabinet module cache key missing')
    if 'v386-15-crt-surface-contact.mjs?v=v386-15-surface-contact' not in js:errors.append('fresh v386.15 contact module cache key missing')
    if 'attachCRTSurfaceContact(instance);' not in js:errors.append('v386.15 contact attachment missing from shared frame')
    if 'instance.surfaceContact?.update(t);' not in js:errors.append('v386.15 contact update missing from shared frame')

models=sorted(p.name for p in (out/'models').glob('*.glb')) if (out/'models').exists() else []
if models!=['movx-crt-tv.glb']:errors.append(f'single-model gate failed: {models}')
if errors:raise SystemExit('MOVX v386.15 static QA failed: '+json.dumps(errors,ensure_ascii=False))
print(json.dumps({'qa':'v386.15-static','status':'PASS','scope':'#boot only','models':models,'projection':'desktop/short/mobile safe fields','short_visible_crt':True,'runtime_shell':'fresh v386.15 URL','selector':'v386.5 intent priority on full Scene-01 field','cabinet':'v386.9 Three.js raycast on same full Scene-01 field','contact':'v386.15 surface-aware feedback from existing v366 raycast presence'},ensure_ascii=False))