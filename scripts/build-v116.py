"""Build canonical MOVX source, then install v116 Into the Signal as an isolated scroll-film chapter."""
from pathlib import Path
import runpy, json

root=Path(__file__).resolve().parents[1]
runpy.run_path(str(root/'scripts'/'build.py'),run_name='__main__')
out=root/'_site'
release='v116-into-signal-scroll-film'
fragment=(root/'site'/'v116-scroll-film.html').read_text().strip()
installed=[]

for name in ['index.html','latest.html','social-media.html']:
    html=out/name
    if not html.exists():
        continue
    text=html.read_text()
    target='<section class="living-archive" id="livingArchive">'
    if 'social-cover-art' not in text or target not in text:
        continue
    if 'data-movx-v116="film"' not in text:
        text=text.replace(target,fragment+'\n'+target,1)
    if 'v116-scroll-film.css' not in text:
        text=text.replace('</head>',f'<link rel="stylesheet" href="v116-scroll-film.css?v={release}">\n</head>',1)
    if 'v116-scroll-film.mjs' not in text:
        text=text.replace('</body>',f'<script type="module" src="v116-scroll-film.mjs?v={release}"></script>\n</body>',1)
    html.write_text(text)
    installed.append(html.name)

fragment_out=out/'v116-scroll-film.html'
if fragment_out.exists(): fragment_out.unlink()

required=[out/'v116-scroll-film.css',out/'v116-scroll-film.mjs']
missing=[str(p.relative_to(out)) for p in required if not p.exists()]
if missing: raise SystemExit('v116 missing build assets: '+str(missing))
if not installed: raise SystemExit('v116 did not find a Social Media cover + Living Archive target')
video='https://res.cloudinary.com/gp3xbngz/video/upload/v1790173902/0923.mp4'
poster='https://res.cloudinary.com/gp3xbngz/video/upload/so_0/v1790173902/0923.jpg'
for name in installed:
    built=(out/name).read_text()
    if video not in built or poster not in built:
        raise SystemExit(f'v116 Cloudinary media missing from {name}')

print(json.dumps({'release':release,'scroll_film_owner':'v116','installed_pages':installed,'video_source':'cloudinary','poster_source':'cloudinary','missing':missing}))
