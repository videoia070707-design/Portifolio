"""Build canonical MOVX source, then install v116 Into the Signal as an isolated scroll-film chapter."""
from pathlib import Path
import runpy, json, re, base64

root=Path(__file__).resolve().parents[1]
# GitHub stores the reviewed source video as small text-safe chunks so the
# exact MP4 can be reconstructed during Pages builds without committing a
# large opaque binary blob.
encoded_media=root/'.assets'/'into-signal'/'deploy-video'
video_out=root/'site'/'media'/'movx-crt-scroll.mp4'
if not video_out.exists():
    chunks=sorted(encoded_media.glob('part-*.b64'))
    if not chunks: raise SystemExit('v116 encoded scroll-film source is missing')
    video_out.parent.mkdir(parents=True,exist_ok=True)
    video_out.write_bytes(base64.b64decode(''.join(p.read_text() for p in chunks)))
poster_out=root/'site'/'media'/'movx-crt-poster.jpg'
poster_source=encoded_media/'poster.b64'
if not poster_out.exists() and poster_source.exists():
    poster_out.parent.mkdir(parents=True,exist_ok=True)
    poster_out.write_bytes(base64.b64decode(poster_source.read_text()))
runpy.run_path(str(root/'scripts'/'build.py'),run_name='__main__')
out=root/'_site'
release='v116-local-scroll-preview'
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
    # The film replaces the old procedural transition before the archive.
    text=re.sub(r'<script type="module" src="v107-scroll-sculpture\.mjs(?:\?[^\"]*)?"></script>\s*','',text)
    if 'v116-scroll-film.css' not in text:
        text=text.replace('</head>',f'<link rel="stylesheet" href="v116-scroll-film.css?v={release}">\n</head>',1)
    if 'v116-scroll-film.mjs' not in text:
        text=text.replace('</body>',f'<script type="module" src="v116-scroll-film.mjs?v={release}"></script>\n</body>',1)
    html.write_text(text)
    installed.append(html.name)

fragment_out=out/'v116-scroll-film.html'
if fragment_out.exists(): fragment_out.unlink()

required=[out/'v116-scroll-film.css',out/'v116-scroll-film.mjs',out/'media/movx-crt-scroll.mp4',out/'media/movx-crt-poster.jpg']
missing=[str(p.relative_to(out)) for p in required if not p.exists()]
if missing: raise SystemExit('v116 missing build assets: '+str(missing))
if not installed: raise SystemExit('v116 did not find a Social Media cover + Living Archive target')
video='media/movx-crt-scroll.mp4'
poster='media/movx-crt-poster.jpg'
for name in installed:
    built=(out/name).read_text()
    if video not in built or poster not in built:
        raise SystemExit(f'v116 local media missing from {name}')

print(json.dumps({'release':release,'scroll_film_owner':'v116','installed_pages':installed,'video_source':'local-h264','poster_source':'local','missing':missing}))
