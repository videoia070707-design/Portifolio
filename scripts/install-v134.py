"""Install MOVX v134 as a final, narrowly-scoped refinement layer before CSS bundling."""
from pathlib import Path
import json

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v134-surgical-tech-refine'
css='v134-surgical-refine.css'
runtime='v134-surgical-refine.mjs'

if not (out/css).exists() or not (out/runtime).exists():
    raise SystemExit('MOVX v134 source files are missing from _site')

installed=[]
for html in out.glob('*.html'):
    text=html.read_text()
    if '<body' not in text or '</head>' not in text or '</body>' not in text:
        continue
    href=f'{css}?v={release}'
    src=f'{runtime}?v={release}'
    if href not in text:
        text=text.replace('</head>',f'<link rel="stylesheet" href="{href}">\n</head>',1)
    if src not in text:
        text=text.replace('</body>',f'<script type="module" src="{src}"></script>\n</body>',1)
    html.write_text(text)
    installed.append(html.name)

canonical=('index.html','latest.html','social-media.html')
for name in canonical:
    path=out/name
    if not path.exists():
        raise SystemExit(f'MOVX v134 missing canonical page: {name}')
    text=path.read_text()
    if f'{css}?v={release}' not in text or f'{runtime}?v={release}' not in text:
        raise SystemExit(f'MOVX v134 was not installed in {name}')

print(json.dumps({
    'release':release,
    'installed_pages':installed,
    'scope':['about','services','contact','discipline-footer'],
    'protected':['hero','scroll-world','artwork-wall','case-studies']
}))
