"""Static gate for MOVX v384 composition polish."""
from pathlib import Path
import json

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v384-clean-spacing'
errors=[]

for name in ('index.html','latest.html'):
    path=out/name
    if not path.exists():
        errors.append(f'missing {name}'); continue
    text=path.read_text()
    if f'data-v384-composition-polish="{release}"' not in text:
        errors.append(f'{name} missing v384 root marker')
    if f'<style data-v384-composition-polish="{release}">' not in text:
        errors.append(f'{name} missing v384 inline CSS')
    if 'data-v383-deplaceholder="v383-graphic-world"' not in text:
        errors.append(f'{name} lost v383 visual base')
    if 'data-model-scope="v350-crt-only"' not in text:
        errors.append(f'{name} lost CRT-only scope')

css=root/'site'/'v384-composition-polish.css'
source=css.read_text() if css.exists() else ''
css_bytes=len(source.encode())
if not source: errors.append('missing v384-composition-polish.css')
if css_bytes>10_000: errors.append(f'v384 CSS exceeds budget: {css_bytes}')
for contract in (
    '@media(min-width:901px)',
    '#playground .float-zone{',
    'position:absolute!important;',
    'bottom:8%!important;',
    'height:auto!important;',
    '#playground .float.camera{',
    'left:24%!important;top:34%!important;',
    '#playground .float.cube{',
    'left:2%!important;top:61%!important;',
    '#playground .float.cd{',
    'left:55%!important;top:64%!important;',
    '#people .people-visual img{',
    'transform:scale(1.90)!important;',
    '@media(max-width:900px)',
    'transform:scale(1.82)!important;',
):
    if contract not in source: errors.append(f'v384 CSS contract missing: {contract}')

models=sorted(p.name for p in (out/'models').glob('*.glb')) if (out/'models').exists() else []
if models!=['movx-crt-tv.glb']: errors.append(f'v384 single-model invariant failed: {models}')

if errors: raise SystemExit('MOVX v384 static QA failed: '+json.dumps(errors,ensure_ascii=False))
print(json.dumps({'status':'passed','release':release,'css_bytes':css_bytes,'published_glbs':models,'scope':'desktop Playground containing block + spacing + People crop'},ensure_ascii=False))
