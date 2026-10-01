"""Static gate for MOVX v381 reference-led art direction."""
from pathlib import Path
import json

root=Path(__file__).resolve().parents[1]
out=root/'_site'
errors=[]
release='v381-reference-reset'
css_name='v381-art-direction-reset.css'

for name in ('index.html','latest.html'):
    path=out/name
    if not path.exists():
        errors.append(f'missing {name}')
        continue
    text=path.read_text()
    if f'data-v381-art-direction="{release}"' not in text:
        errors.append(f'{name} missing v381 html marker')
    if f'<style data-v381-art-direction="{release}">' not in text:
        errors.append(f'{name} missing v381 inline art-direction CSS')
    if 'data-crt-retune-layer="v380-physical-channel-retune"' not in text:
        errors.append(f'{name} lost v380 physical retune')
    if 'data-model-scope="v350-crt-only"' not in text:
        errors.append(f'{name} lost CRT-only production scope')

css=root/'site'/css_name
if not css.exists():
    errors.append(f'missing source {css_name}')
    css_bytes=0
    source=''
else:
    source=css.read_text()
    css_bytes=len(source.encode())
    if css_bytes>26_000:
        errors.append(f'{css_name} is {css_bytes} bytes; budget 26000')

for contract in (
    '.scene-inner{\n  border-radius:0!important',
    '#hero .movx-chassis{display:none!important}',
    '#portal .tunnel-lines,',
    '#work .work-carousel-stage::before{display:none!important}',
    '#machine .console311{',
    '#studio .studio-stage{background:#080808!important}',
    '#people .people-stage{gap:0!important',
    '#contact .contact-stage{background:var(--v381-orange)!important}',
    '@media(max-width:900px)',
):
    if contract not in source:
        errors.append(f'v381 CSS contract missing: {contract}')

models=sorted(p.name for p in (out/'models').glob('*.glb')) if (out/'models').exists() else []
if models!=['movx-crt-tv.glb']:
    errors.append(f'v381 single-model invariant failed: {models}')

if errors:
    raise SystemExit('MOVX v381 static QA failed: '+json.dumps(errors,ensure_ascii=False))
print(json.dumps({
    'status':'passed',
    'release':release,
    'css_bytes':css_bytes,
    'published_glbs':models,
    'scope':'site-wide visual reset with CRT geometry/runtime preserved',
},ensure_ascii=False))
