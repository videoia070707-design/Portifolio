"""Static release gate for MOVX v379.2 Scene-01 editorial safe zones."""
from pathlib import Path
import json

root=Path(__file__).resolve().parents[1]
out=root/'_site'
errors=[]
release='v379-editorial-safe-zones'
css_name='v379-scene01-editorial-grid.css'

for name in ('index.html','latest.html'):
    path=out/name
    if not path.exists():
        errors.append(f'missing {name}')
        continue
    text=path.read_text()
    if f'data-crt-editorial-grid-layer="{release}"' not in text:
        errors.append(f'{name} missing v379 html marker')
    if f'data-v379-editorial-grid="{release}"' not in text:
        errors.append(f'{name} missing inline v379 CSS marker')
    if 'data-crt-pickup-layer="v378-physical-pickup"' not in text:
        errors.append(f'{name} lost v378 physical pickup')
    if 'data-crt-safe-framing-layer="v374-short-viewport"' not in text:
        errors.append(f'{name} lost v374 safe framing')
    if '<span>IDEIAS</span><span>NÃO FICAM</span><span>PARADAS</span>' not in text:
        errors.append(f'{name} lost Scene-01 headline contract')

css=out/css_name
if not css.exists():
    errors.append(f'missing {css_name}')
    css_bytes=0
else:
    css_bytes=css.stat().st_size
    if css_bytes>14_000:errors.append(f'{css_name} is {css_bytes} bytes; budget 14000')
    source=css.read_text()
    for contract in (
        'grid-template-columns:minmax(0,1.02fr) minmax(430px,.98fr)',
        'gap:.092em',
        'max-width:470px',
        'justify-self:end',
        'grid-template-columns:minmax(0,1.03fr) minmax(400px,.97fr)',
        'inset-inline-start:clamp(18px,1.75vw,24px)',
    ):
        if contract not in source:errors.append(f'v379.2 CSS contract missing: {contract}')

models=sorted(p.name for p in (out/'models').glob('*.glb')) if (out/'models').exists() else []
if models!=['movx-crt-tv.glb']:
    errors.append(f'v379 single-model invariant failed: {models}')

if errors:raise SystemExit('MOVX v379.2 static QA failed: '+json.dumps(errors,ensure_ascii=False))
print(json.dumps({'status':'passed','release':release,'revision':'v379.2-editorial-moat','css_bytes':css_bytes,'published_glbs':models,'scope':'Scene 01 editorial layout only'},ensure_ascii=False))
