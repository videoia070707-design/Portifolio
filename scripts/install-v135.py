"""Install MOVX v135 approved redesign after v134 without touching protected hero/Scroll World markup."""
from pathlib import Path
import json

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v135-approved-redesign'
css='v135-approved-redesign.css'
runtime='v135-approved-redesign.mjs'

if not (out/css).exists() or not (out/runtime).exists():
    raise SystemExit('MOVX v135 source files are missing from _site')

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

for name in ('index.html','latest.html','social-media.html'):
    path=out/name
    if not path.exists():
        raise SystemExit(f'MOVX v135 missing canonical page: {name}')
    text=path.read_text()
    if f'{css}?v={release}' not in text or f'{runtime}?v={release}' not in text:
        raise SystemExit(f'MOVX v135 was not installed in {name}')

print(json.dumps({
    'release':release,
    'installed_pages':installed,
    'scope':['archive','services','about'],
    'protected':['hero','scroll-world','living-archive','selected-cases'],
    'fluid_3d_hero':'reserved_until_asset_is_ready'
}))
