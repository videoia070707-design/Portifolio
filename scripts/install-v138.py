"""Install MOVX v138 reference-matched molten-glass runtime after v137."""
from pathlib import Path
import json, shutil
root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v138-reference-morph'
runtime='v138-reference-morph.mjs'
src=root/'site'/runtime
if not src.exists(): raise SystemExit(f'MOVX v138 missing source file: {src}')
shutil.copy2(src,out/runtime)
installed=[]
for name in ('index.html','latest.html','social-media.html'):
    path=out/name
    if not path.exists(): continue
    text=path.read_text()
    old='v137-reference-morph.mjs?v=v137-reference-morph'
    new=f'{runtime}?v={release}'
    if old in text: text=text.replace(old,new)
    elif new not in text: text=text.replace('</body>',f'<script type="module" src="{new}"></script>\n</body>',1)
    path.write_text(text);installed.append(name)
if len(installed)<3: raise SystemExit(f'MOVX v138 invalid install: pages={installed}')
print(json.dumps({'release':release,'pages':installed,'runtime':'molten black glass + orange emissive veins','geometry':'fixed topology procedural WebGL','states':['LIQUID','RING','TOWER','INFINITY']}))
