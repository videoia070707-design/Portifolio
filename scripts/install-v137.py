"""Install MOVX v137 reference-matched orange/black molten-glass runtime.

Runs after v136. Reuses the approved v136 markup/QA compatibility surface, swaps only
its WebGL runtime for v137, and adds a small visual override stylesheet.
"""
from pathlib import Path
import json, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v137-reference-morph'
runtime='v137-reference-morph.mjs'
css='v137-reference-morph.css'

for name in (runtime,css):
    src=root/'site'/name
    dst=out/name
    if not src.exists():
        raise SystemExit(f'MOVX v137 missing source file: {src}')
    shutil.copy2(src,dst)

installed=[]
for name in ('index.html','latest.html','social-media.html'):
    path=out/name
    if not path.exists():
        continue
    text=path.read_text()
    old='v136-fluid-morph.mjs?v=v136-fluid-morph'
    new=f'{runtime}?v={release}'
    if old in text:
        text=text.replace(old,new)
    elif new not in text:
        text=text.replace('</body>',f'<script type="module" src="{new}"></script>\n</body>',1)
    href=f'{css}?v={release}'
    if href not in text:
        text=text.replace('</head>',f'<link rel="stylesheet" href="{href}">\n</head>',1)
    path.write_text(text)
    installed.append(name)

if len(installed)<3:
    raise SystemExit(f'MOVX v137 invalid install: pages={installed}')

print(json.dumps({
    'release':release,
    'pages':installed,
    'runtime':'v137 molten orange/black fixed-topology morph',
    'states':['LIQUID','RING','TOWER','INFINITY'],
    'compatibility':'v136 DOM + datasets preserved',
    'protected':['hero-index','Scroll World','living archive','archive directory','v135 sections']
}))
