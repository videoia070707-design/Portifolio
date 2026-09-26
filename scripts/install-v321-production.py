"""Promote the MOVX v320 storyboard stack to the production homepage.

This runs last in the build. It preserves the editorial/social pages and only
replaces index.html/latest.html with the approved spatial storyboard experience.
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

# Publish the whole versioned stack so every historical preview remains directly
# inspectable while production uses a deterministic static composition.
for name in preview_dirs:
    src=root/name
    dst=out/name
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src,dst)

base=(root/'movx-v312-preview'/'index.html').read_text()
body_match=re.search(r'<body>(.*)</body>',base,re.S|re.I)
if not body_match:
    raise SystemExit('MOVX v321 could not extract v312 storyboard body')
body=body_match.group(1).replace('../assets/','assets/')

css=[
    'movx-v311-preview/styles.css',
    'movx-v311-preview/v312-polish.css',
    'movx-v311-preview/v313-fidelity.css',
    'movx-v312-preview/v312-work.css',
    'movx-v313-preview/v313-work-overlap-fix.css',
    'movx-v314-preview/v314-crt.css',
    'movx-v315-preview/v315-logo.css',
    'movx-v316-preview/v316-portal.css',
    'movx-v317-preview/v317-machine.css',
    'movx-v318-preview/v318-props.css',
    'movx-v319-preview/v319-studio.css',
    'movx-v320-preview/v320-contact.css',
]
js=[
    'movx-v311-preview/app.js',
    'movx-v311-preview/v313-fidelity.js',
    'v321-work.js',
    'movx-v314-preview/v314-crt.js',
    'movx-v315-preview/v315-logo.js',
    'movx-v316-preview/v316-portal.js',
    'movx-v317-preview/v317-machine.js',
    'movx-v318-preview/v318-props.js',
    'movx-v319-preview/v319-studio.js',
    'movx-v320-preview/v320-contact.js',
]

for ref in css:
    if not (out/ref).exists():
        raise SystemExit(f'MOVX v321 missing CSS: {ref}')
for ref in js:
    if ref=='v321-work.js':
        continue
    if not (out/ref).exists():
        raise SystemExit(f'MOVX v321 missing JS: {ref}')

# v312-work was authored for a nested preview route. On the production root,
# browser-created image URLs must point to assets/ rather than ../assets/.
work=(root/'movx-v312-preview'/'v312-work.js').read_text().replace('../assets/','assets/')
(out/'v321-work.js').write_text(work)

styles='\n'.join(f'<link rel="stylesheet" href="{href}?v={release}">' for href in css)
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

for name in ('index.html','latest.html'):
    (out/name).write_text(production)

required_slots=[
    'boot-tv','hero-movx-logo','x-portal','creative-machine','play-cassette',
    'play-camera','play-cube','play-cd','play-window','spatial-studio','closing-window'
]
missing_slots=[slot for slot in required_slots if f'data-model-slot="{slot}"' not in production]
if missing_slots:
    raise SystemExit(f'MOVX v321 missing model slots: {missing_slots}')
if 'href="#work"' not in production or 'href="#contact"' not in production:
    raise SystemExit('MOVX v321 internal navigation contract missing')
if '../assets/' in production or '../assets/' in work:
    raise SystemExit('MOVX v321 production still contains parent-relative asset paths')

print(json.dumps({
    'release':release,
    'homepage':'v320 storyboard promoted to /',
    'preserved':['social-media.html','v93.html','legacy editorial QA'],
    'preview_dirs':preview_dirs,
    'model_slots':required_slots,
    'css_layers':len(css),
    'js_layers':len(js),
}))
