"""Install the v351 real-CRT scaled-center correction after model framing."""
from pathlib import Path
import json, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
module='v351-crt-recenter.mjs'
cache='v351-scaled-center'

src=root/'site'/module
if not src.exists():raise SystemExit(f'MOVX v351 missing source: {src}')
shutil.copy2(src,out/module)

inline=f'<script type="module">import "./{module}?v={cache}";</script>'
installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    marker='<script type="module" src="v322-glb-runtime.mjs?v=v350-real-crt"></script>'
    if marker not in text:raise SystemExit(f'MOVX v351 expected v350 runtime marker in {name}')
    if inline not in text:text=text.replace(marker,marker+'\n'+inline,1)
    if 'data-crt-fit=' not in text:
        text=text.replace('data-crt-runtime="v350-real-glb"',
                          'data-crt-runtime="v350-real-glb" data-crt-fit="v351-scaled-center"',1)
    path.write_text(text);installed.append(name)

print(json.dumps({'release':'v351-crt-recenter','cache':cache,'pages':installed,'module':module,'scope':'boot-tv only'}))
