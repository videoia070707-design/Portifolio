"""MOVX v379 — Scene 01 editorial safe-zone grid.

Runs after v378.2. CSS-only and scoped to the first scene: it increases the
text/CRT spatial moat, fixes headline rhythm and compacts short-laptop controls
without touching the validated physical CRT framing, renderer or interactions.
"""
from pathlib import Path
import json, re, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v379-editorial-safe-zones'
css_name='v379-scene01-editorial-grid.css'

src=root/'site'/css_name
if not src.exists():
    raise SystemExit(f'MOVX v379 source missing: {src}')
shutil.copy2(src,out/css_name)
css=src.read_text()
if len(css.encode())>14_000:
    raise SystemExit(f'MOVX v379 critical CSS exceeds 14 KB: {len(css.encode())}')

style_tag=f'<style data-v379-editorial-grid="{release}">\n{css}\n</style>'
installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-crt-pickup-layer="v378-physical-pickup"' not in text:
        raise SystemExit(f'MOVX v379 requires the validated v378 physical pickup in {name}')
    if 'data-crt-safe-framing-layer="v374-short-viewport"' not in text:
        raise SystemExit(f'MOVX v379 requires the validated v374 short-viewport framing in {name}')
    if 'data-crt-editorial-grid-layer=' not in text:
        text=text.replace('<html ',f'<html data-crt-editorial-grid-layer="{release}" ',1)
    else:
        text=re.sub(r'data-crt-editorial-grid-layer="[^"]+"',f'data-crt-editorial-grid-layer="{release}"',text,count=1)
    if 'data-v379-editorial-grid=' not in text:
        text=text.replace('</head>',style_tag+'\n</head>',1)
    if '<span>IDEIAS</span><span>NÃO FICAM</span><span>PARADAS</span>' not in text:
        raise SystemExit(f'MOVX v379 headline contract missing in {name}')
    path.write_text(text)
    installed.append(name)

published=sorted(p.name for p in (out/'models').glob('*.glb'))
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v379 single-model invariant failed: {published}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'scope':'Scene 01 editorial grid and safe zones only',
    'headline':'three-line title keeps impact with explicit inter-line breathing room',
    'grid':'larger CRT/copy moat; bounded copy column; compact short-laptop controls',
    'physical_framing':'v374 remains authoritative; no CRT top/selector geometry override',
    'interaction':'v375-v378 unchanged',
    'css_delivery':'critical inline; zero extra stylesheet requests',
    'single_model_gate':True,
    'new_webgl_resources':0,
    'other_models':'deferred and unpublished',
    'assets':[css_name],
    'published_glbs':published,
},ensure_ascii=False))
