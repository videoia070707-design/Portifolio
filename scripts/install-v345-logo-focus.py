"""Install MOVX v345 Physical Logo focus stage 1 after the shared model framing pass.

This intentionally touches only the hero-movx-logo slot. Other model slots remain
owned by the existing runtime/framing modules until their own focused pass begins.
"""
from pathlib import Path
import json, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v345-logo-focus-stage1'
css='v345-logo-focus.css'
js='v345-logo-focus.mjs'

for name in (css,js):
    src=root/'site'/name
    if not src.exists():raise SystemExit(f'MOVX v345 missing source: {src}')
    shutil.copy2(src,out/name)

installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-model-framing="v324-model-framing"' not in text:
        raise SystemExit(f'MOVX v345 expected v324 framing before logo focus: {name}')
    css_tag=f'<link rel="stylesheet" href="{css}?v={release}">'
    js_tag=f'<script type="module" src="{js}?v={release}"></script>'
    if css_tag not in text:text=text.replace('</head>',css_tag+'\n</head>',1)
    if js_tag not in text:text.replace('</body>',js_tag+'\n</body>',1)
    if js_tag not in text:text=text.replace('</body>',js_tag+'\n</body>',1)
    if 'data-logo-focus=' not in text:
        text=text.replace('data-storyboard="v320"',f'data-storyboard="v320" data-logo-focus="{release}"',1)
    path.write_text(text)
    installed.append(name)

print(json.dumps({'release':release,'scope':'hero-movx-logo only','stage':1,'css':css,'runtime':js,'pages':installed}))
