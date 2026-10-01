"""Static gate for MOVX v386 visibly immersive Hero pass."""
from pathlib import Path
import json,re

root=Path(__file__).resolve().parents[1]
out=root/'_site'
css=(root/'site'/'v386-hero-immersion.css').read_text()
errors=[]

for forbidden in ('#hero','#portal','#work','#machine','#playground','#studio','#people','#contact'):
    if forbidden in css:errors.append(f'v386 CSS escaped #boot via {forbidden}')
if '#boot' not in css:errors.append('v386 CSS has no #boot scope')

for name in ('index.html','latest.html'):
    path=out/name
    if not path.exists():errors.append(f'missing built page {name}');continue
    text=path.read_text()
    if 'data-v386-hero-immersion="v386-spatial-hero"' not in text:errors.append(f'{name} missing v386 marker')
    if '<style data-v386-hero-immersion="v386-spatial-hero">' not in text:errors.append(f'{name} missing v386 critical CSS')

controller=out/'v358-crt-immersion.js'
if not controller.exists():errors.append('built v358 controller missing')
else:
    js=controller.read_text()
    for contract in (
        "yaw:rad(-16.0)","yaw:rad(17.0)","yaw:rad(-12.0)","yaw:rad(14.0)",
        "root.style.setProperty('--crt-poster-x'", "root.style.setProperty('--crt-poster-y'"
    ):
        if contract not in js:errors.append(f'v386 controller contract missing: {contract}')

models=sorted(p.name for p in (out/'models').glob('*.glb')) if (out/'models').exists() else []
if models!=['movx-crt-tv.glb']:errors.append(f'single-model gate failed: {models}')
if errors:raise SystemExit('MOVX v386 static QA failed: '+json.dumps(errors,ensure_ascii=False))
print(json.dumps({'qa':'v386-static','status':'PASS','scope':'#boot only','models':models,'strong_rest_pose':True},ensure_ascii=False))
