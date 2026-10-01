"""Static gate for MOVX v382 reference synthesis."""
from pathlib import Path
import json

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v382-world-pass'
human='assets/projects/voltara-engenharia-aplicada/slide-01.webp'
errors=[]

for name in ('index.html','latest.html'):
    p=out/name
    if not p.exists():
        errors.append(f'missing {name}'); continue
    text=p.read_text()
    if f'data-v382-reference-synthesis="{release}"' not in text:
        errors.append(f'{name} missing v382 marker')
    if f'<style data-v382-reference-synthesis="{release}">' not in text:
        errors.append(f'{name} missing v382 inline CSS')
    if human not in text:
        errors.append(f'{name} missing human People image')
    if 'assets/projects/hardwork-neon-direction/slide-01.webp' in text:
        errors.append(f'{name} still uses non-human People placeholder')
    if 'data-v381-art-direction="v381-reference-reset"' not in text:
        errors.append(f'{name} lost v381 visual base')
    if 'data-model-scope="v350-crt-only"' not in text:
        errors.append(f'{name} lost CRT-only production scope')

css=root/'site'/'v382-reference-synthesis.css'
source=css.read_text() if css.exists() else ''
if not source: errors.append('missing v382-reference-synthesis.css')
if len(source.encode())>24_000: errors.append('v382 CSS exceeds 24 KB')
for contract in (
    '#machine [data-model-slot="creative-machine"]{',
    '#machine .console-unit{',
    'border-radius:0!important;',
    '#people .people-visual img{',
    'position:absolute!important;',
    '#contact .contact-window .landscape{',
    'height:calc(100% - 42px)!important;',
    '#hero .v315-logo-plaque,',
    '@media(min-width:901px) and (min-height:821px)',
):
    if contract not in source: errors.append(f'v382 CSS contract missing: {contract}')

models=sorted(p.name for p in (out/'models').glob('*.glb')) if (out/'models').exists() else []
if models!=['movx-crt-tv.glb']: errors.append(f'v382 single-model invariant failed: {models}')
if not (out/human).exists(): errors.append(f'missing built People asset {human}')

if errors: raise SystemExit('MOVX v382 static QA failed: '+json.dumps(errors,ensure_ascii=False))
print(json.dumps({'status':'passed','release':release,'css_bytes':len(source.encode()),'people_asset':human,'published_glbs':models},ensure_ascii=False))
