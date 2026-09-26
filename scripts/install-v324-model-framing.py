"""Install MOVX v324 framing, v336.1 mobile logo safe fit, v339 desktop Machine presence, and v331 smooth choreography after v323 model pack."""
from pathlib import Path
import json, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v324-model-framing'
revision='v3361-mobile-logo-safe-fit'
choreography='v331-smooth-handoffs'
cache='v339-desktop-machine-presence'
css='v324-model-framing.css'
js='v324-model-framing.mjs'

for name in (css,js):
    src=root/'site'/name
    if not src.exists(): raise SystemExit(f'MOVX v324 missing source: {src}')
    shutil.copy2(src,out/name)

for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-model-pack="v323-tripo-model-pack"' not in text:
        raise SystemExit(f'MOVX v324 expected v323 model pack marker in {name}')
    css_tag=f'<link rel="stylesheet" href="{css}?v={cache}">'
    js_tag=f'<script type="module" src="{js}?v={cache}"></script>'
    import re
    text=re.sub(r'<link rel="stylesheet" href="v324-model-framing\.css\?v=[^"]+">',css_tag,text,count=1)
    text=re.sub(r'<script type="module" src="v324-model-framing\.mjs\?v=[^"]+"></script>',js_tag,text,count=1)
    if css_tag not in text:text=text.replace('</head>',css_tag+'\n</head>',1)
    if js_tag not in text:text.replace('</body>',js_tag+'\n</body>',1)
    if js_tag not in text:text=text.replace('</body>',js_tag+'\n</body>',1)
    text=text.replace('data-model-pack="v323-tripo-model-pack"',f'data-model-pack="v323-tripo-model-pack" data-model-framing="{release}" data-model-framing-revision="{revision}"',1)
    path.write_text(text)

print(json.dumps({'release':release,'revision':revision,'cache':cache,'choreography':choreography,'css':css,'runtime':js,'pages':['index.html','latest.html']}))
