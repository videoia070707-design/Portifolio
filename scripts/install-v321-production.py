"""Promote the MOVX v320 storyboard stack to the production homepage.

Preserves the historical previews/editorial pages and emits production-safe copies
of scripts that were originally authored for nested preview routes.
"""
from pathlib import Path
import json, re, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v321-production-storyboard'

preview_dirs=[f'movx-v{n}-preview' for n in range(311,321)]
missing=[name for name in preview_dirs if not (root/name).is_dir()]
if missing:
    raise SystemExit(f'MOVX v321 missing preview sources: {missing}')

for name in preview_dirs:
    src=root/name
    dst=out/name
    if dst.exists():shutil.rmtree(dst)
    shutil.copytree(src,dst)

base=(root/'movx-v312-preview'/'index.html').read_text()
body_match=re.search(r'<body>(.*)</body>',base,re.S|re.I)
if not body_match:raise SystemExit('MOVX v321 could not extract v312 storyboard body')
body=body_match.group(1).replace('../assets/','assets/')

css=[
    'movx-v311-preview/styles.css','movx-v311-preview/v312-polish.css',
    'movx-v311-preview/v313-fidelity.css','movx-v312-preview/v312-work.css',
    'movx-v313-preview/v313-work-overlap-fix.css','movx-v314-preview/v314-crt.css',
    'movx-v315-preview/v315-logo.css','movx-v316-preview/v316-portal.css',
    'movx-v317-preview/v317-machine.css','movx-v318-preview/v318-props.css',
    'movx-v319-preview/v319-studio.css','movx-v320-preview/v320-contact.css',
]
js=[
    'v321-app.js','movx-v311-preview/v313-fidelity.js','v321-work.js',
    'movx-v314-preview/v314-crt.js','movx-v315-preview/v315-logo.js',
    'movx-v316-preview/v316-portal.js','movx-v317-preview/v317-machine.js',
    'movx-v318-preview/v318-props.js','movx-v319-preview/v319-studio.js',
    'movx-v320-preview/v320-contact.js',
]

for ref in css:
    if not (out/ref).exists():raise SystemExit(f'MOVX v321 missing CSS: {ref}')
for ref in js:
    if ref in ('v321-app.js','v321-work.js'):continue
    if not (out/ref).exists():raise SystemExit(f'MOVX v321 missing JS: {ref}')

# app.js historically injects `v312-polish.css` relative to the document. In the
# production root that creates a duplicate root request (`/v312-polish.css`) even
# though the correct nested stylesheet is already included above. Keep historical
# previews untouched and remove only this redundant injection in the production copy.
app=(root/'movx-v311-preview'/'app.js').read_text()
injection="const polish=document.createElement('link');polish.rel='stylesheet';polish.href='v312-polish.css?v=312';document.head.appendChild(polish);\n"
if injection not in app:raise SystemExit('MOVX v321 expected legacy polish injection in app.js')
app=app.replace(injection,'',1)
(out/'v321-app.js').write_text(app)

# v312-work was authored for a nested preview route. On the production root,
# browser-created image URLs must point to assets/ rather than ../assets/.
work=(root/'movx-v312-preview'/'v312-work.js').read_text().replace('../assets/','assets/')
(out/'v321-work.js').write_text(work)

# Keep the storyboard release cache stable and bust only the Playground props
# stylesheet changed by the camera/cube/cassette/CD desktop-presence passes.
cache_versions={'movx-v318-preview/v318-props.css':'v344-cd-slot-safe'}
styles='\n'.join(f'<link rel="stylesheet" href="{href}?v={cache_versions.get(href,release)}">' for href in css)
scripts='\n'.join(f'<script src="{src}?v={release}"></script>' for src in js)
classes='v312 v313 v314 v315 v316 v317 v318 v319 v320'
production=f'''<!doctype html>
<html class="{classes}" lang="pt-BR" data-movx-production="{release}" data-storyboard="v320">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#070807">
<meta name="description" content="MOVX Creative Studio — direção de arte, motion, AI e experiências digitais em um portfólio espacial Y2K.">
<meta name="robots" content="index,follow,max-image-preview:large">
<title>MOVX — Creative Studio</title>
<link rel="canonical" href="https://videoia070707-design.github.io/Portifolio/">
{styles}
</head>
<body>
{body}
{scripts}
</body>
</html>'''

for name in ('index.html','latest.html'):(out/name).write_text(production)

required_slots=['boot-tv','hero-movx-logo','x-portal','creative-machine','play-cassette','play-camera','play-cube','play-cd','play-window','spatial-studio','closing-window']
missing_slots=[slot for slot in required_slots if f'data-model-slot="{slot}"' not in production]
if missing_slots:raise SystemExit(f'MOVX v321 missing model slots: {missing_slots}')
if 'href="#work"' not in production or 'href="#contact"' not in production:raise SystemExit('MOVX v321 internal navigation contract missing')
if '../assets/' in production or '../assets/' in work:raise SystemExit('MOVX v321 production still contains parent-relative asset paths')
if "polish.href='v312-polish.css?v=312'" in app:raise SystemExit('MOVX v321 production app still contains root polish injection')

print(json.dumps({'release':release,'homepage':'v320 storyboard promoted to /','preserved':['social-media.html','v93.html','legacy editorial QA'],'preview_dirs':preview_dirs,'model_slots':required_slots,'css_layers':len(css),'js_layers':len(js),'production_app':'v321-app.js','cache_overrides':cache_versions}))
