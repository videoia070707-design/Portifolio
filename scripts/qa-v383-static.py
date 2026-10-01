"""Static gate for MOVX v383 de-placeholder layer."""
from pathlib import Path
import json

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v383-graphic-world'
errors=[]

for name in ('index.html','latest.html'):
    path=out/name
    if not path.exists():
        errors.append(f'missing {name}'); continue
    text=path.read_text()
    if f'data-v383-deplaceholder="{release}"' not in text:
        errors.append(f'{name} missing v383 root marker')
    if f'<style data-v383-deplaceholder="{release}">' not in text:
        errors.append(f'{name} missing v383 inline CSS')
    if 'data-v382-reference-synthesis="v382-world-pass"' not in text:
        errors.append(f'{name} lost v382 visual base')
    if 'data-model-scope="v350-crt-only"' not in text:
        errors.append(f'{name} lost CRT-only scope')

css=root/'site'/'v383-deplaceholder.css'
source=css.read_text() if css.exists() else ''
css_bytes=len(source.encode())
if not source: errors.append('missing v383-deplaceholder.css')
if css_bytes>24_000: errors.append(f'v383 CSS exceeds budget: {css_bytes}')
for contract in (
    '#portal .v316-tunnel-frame,',
    '#portal .v316-x-core::before,',
    '#playground .float.cassette::before{content:"IDEAS"!important}',
    '#playground .float.camera::before{content:"CAPTURE"!important}',
    '#studio .studio-wall,',
    '#studio .studio-stage::before{',
    'content:"STUDIO"!important;',
    '#people .people-visual img{',
):
    if contract not in source: errors.append(f'v383 CSS contract missing: {contract}')

models=sorted(p.name for p in (out/'models').glob('*.glb')) if (out/'models').exists() else []
if models!=['movx-crt-tv.glb']: errors.append(f'v383 single-model invariant failed: {models}')

if errors: raise SystemExit('MOVX v383 static QA failed: '+json.dumps(errors,ensure_ascii=False))
print(json.dumps({'status':'passed','release':release,'css_bytes':css_bytes,'published_glbs':models,'scope':'Portal + Playground + Studio de-placeholder pass'},ensure_ascii=False))
