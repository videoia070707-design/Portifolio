"""Build canonical MOVX source, then install the Scroll World powered Into the Signal chapter."""
from pathlib import Path
import runpy, json, re, base64

root=Path(__file__).resolve().parents[1]
# Local media stays in the bundle as a resilience fallback. The canonical runtime
# source is the user-provided Cloudinary 0923.mp4 declared in v116-scroll-film.html.
encoded_media=root/'.assets'/'into-signal'/'deploy-video'
encoded_webm=root/'.assets'/'into-signal'/'deploy-video-webm'
video_out=root/'site'/'media'/'movx-crt-scroll.mp4'
if not video_out.exists():
    chunks=sorted(encoded_media.glob('part-*.b64'))
    if not chunks: raise SystemExit('v116 encoded scroll-film fallback is missing')
    video_out.parent.mkdir(parents=True,exist_ok=True)
    video_out.write_bytes(base64.b64decode(''.join(p.read_text() for p in chunks)))
webm_out=root/'site'/'media'/'movx-crt-scroll.webm'
if not webm_out.exists():
    chunks=sorted(encoded_webm.glob('part-*.b64'))
    if not chunks: raise SystemExit('v116 encoded VP9 scroll-film fallback is missing')
    webm_out.parent.mkdir(parents=True,exist_ok=True)
    webm_out.write_bytes(base64.b64decode(''.join(p.read_text() for p in chunks)))
poster_out=root/'site'/'media'/'movx-crt-poster.jpg'
poster_source=encoded_media/'poster.b64'
if not poster_out.exists() and poster_source.exists():
    poster_out.parent.mkdir(parents=True,exist_ok=True)
    poster_out.write_bytes(base64.b64decode(poster_source.read_text()))

runpy.run_path(str(root/'scripts'/'build.py'),run_name='__main__')
out=root/'_site'
release='v117-scroll-world-cloudinary'
cloudinary='https://res.cloudinary.com/gp3xbngz/video/upload/v1790173902/0923.mp4'
fragment=(root/'site'/'v116-scroll-film.html').read_text().strip()
installed=[]

if cloudinary not in fragment:
    raise SystemExit('Scroll World chapter is not pointing at the approved Cloudinary 0923.mp4')

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
    text=re.sub(r'<script type="module" src="v107-scroll-sculpture\.mjs(?:\?[^\"]*)?"></script>\s*','',text)
    if 'v116-scroll-film.css' not in text:
        text=text.replace('</head>',f'<link rel="stylesheet" href="v116-scroll-film.css?v={release}">\n</head>',1)
    if 'v116-scroll-film.mjs' not in text:
        text=text.replace('</body>',f'<script type="module" src="v116-scroll-film.mjs?v={release}"></script>\n</body>',1)
    html.write_text(text)
    installed.append(html.name)

fragment_out=out/'v116-scroll-film.html'
if fragment_out.exists(): fragment_out.unlink()

required=[
    out/'v116-scroll-film.css',
    out/'v116-scroll-film.mjs',
    out/'media/movx-crt-scroll.mp4',
    out/'media/movx-crt-scroll.webm',
    out/'media/movx-crt-poster.jpg'
]
missing=[str(p.relative_to(out)) for p in required if not p.exists()]
if missing: raise SystemExit('v116 missing build assets: '+str(missing))
if not installed: raise SystemExit('Scroll World chapter did not find a Social Media cover + Living Archive target')

for name in installed:
    built=(out/name).read_text()
    if cloudinary not in built:
        raise SystemExit(f'Cloudinary 0923.mp4 missing from {name}')
    if 'data-src="media/movx-crt-scroll.mp4"' not in built or 'data-src-webm="media/movx-crt-scroll.webm"' not in built:
        raise SystemExit(f'local film fallback missing from {name}')
    if 'v116-scroll-film.mjs' not in built or 'v116-scroll-film.css' not in built:
        raise SystemExit(f'Scroll World runtime missing from {name}')

print(json.dumps({
    'release':release,
    'scroll_film_owner':'scroll-world',
    'installed_pages':installed,
    'video_source':'cloudinary-0923-primary-with-blob-loading',
    'fallback_source':'local-vp9-h264',
    'poster_source':'local',
    'missing':missing
}))
