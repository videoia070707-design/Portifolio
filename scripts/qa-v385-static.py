"""Static scope gate for MOVX v385 Hero-only recovery."""
from pathlib import Path
import re,json

root=Path(__file__).resolve().parents[1]
out=root/'_site'
css=(root/'site'/'v385-hero-only-recovery.css').read_text()
errors=[]

for forbidden in ('#hero','#portal','#work','#machine','#playground','#studio','#people','#contact'):
    if forbidden in css:errors.append(f'v385 CSS escaped #boot via {forbidden}')

# Remove comments before selector scan, then require every actual rule selector to
# include #boot. @media bodies are scanned recursively by the regex below because
# individual selector blocks are still present in the source.
clean=re.sub(r'/\*.*?\*/','',css,flags=re.S)
for match in re.finditer(r'([^{}]+)\{',clean):
    selector=match.group(1).strip()
    if not selector or selector.startswith('@'):continue
    # CSS declarations from the parent @media body can appear before a nested rule
    # in this simple scan; selectors are the fragments that do not contain ':'.
    if ';' in selector:selector=selector.rsplit(';',1)[-1].strip()
    if selector and not selector.startswith('@') and '#boot' not in selector:
        errors.append(f'unscoped v385 selector: {selector[:140]}')

for name in ('index.html','latest.html'):
    path=out/name
    if not path.exists():errors.append(f'missing built page {name}');continue
    text=path.read_text()
    if 'data-v385-hero-only="v385-hero-recovery"' not in text:errors.append(f'{name} missing v385 marker')
    if '<style data-v385-hero-only="v385-hero-recovery">' not in text:errors.append(f'{name} missing v385 critical CSS')
    for retired in ('data-v381-art-direction=','data-v382-reference-synthesis=','data-v383-deplaceholder=','data-v384-composition-polish='):
        if retired in text:errors.append(f'{name} still installs retired global visual layer {retired}')

models=sorted(p.name for p in (out/'models').glob('*.glb')) if (out/'models').exists() else []
if models!=['movx-crt-tv.glb']:errors.append(f'single-model gate failed: {models}')
if errors:raise SystemExit('MOVX v385 static QA failed: '+json.dumps(errors,ensure_ascii=False))
print(json.dumps({'qa':'v385-static','status':'PASS','scope':'#boot only','retired_global_layers':True,'models':models},ensure_ascii=False))
