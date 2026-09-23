"""Build MOVX v117 and install the single-take scroll-world chapter from user footage."""
from pathlib import Path
import runpy, json, re, shutil, subprocess, tempfile, urllib.request

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v117-scroll-world-0923'
source_url='https://res.cloudinary.com/gp3xbngz/video/upload/v1790173902/0923.mp4'
media=root/'site'/'media'
media.mkdir(parents=True,exist_ok=True)

media_files={
    'desktop_mp4':media/'movx-scroll-world-0923.mp4',
    'mobile_mp4':media/'movx-scroll-world-0923-mobile.mp4',
    'desktop_webm':media/'movx-scroll-world-0923.webm',
    'mobile_webm':media/'movx-scroll-world-0923-mobile.webm',
    'poster':media/'movx-scroll-world-poster.jpg',
}

def run_ffmpeg(ffmpeg,src,*args):
    subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-i',str(src),*map(str,args)],check=True)

def ensure_media():
    if all(path.exists() and path.stat().st_size>1024 for path in media_files.values()):
        return 'packaged'
    ffmpeg=shutil.which('ffmpeg')
    if not ffmpeg:
        raise SystemExit('MOVX v117 media is missing and ffmpeg is unavailable')
    with tempfile.TemporaryDirectory(prefix='movx-v117-') as tmpdir:
        src=Path(tmpdir)/'0923-source.mp4'
        req=urllib.request.Request(source_url,headers={'User-Agent':'MOVX-v117-builder/1.0'})
        with urllib.request.urlopen(req,timeout=90) as response, src.open('wb') as target:
            shutil.copyfileobj(response,target)
        if src.stat().st_size<1024:
            raise SystemExit('MOVX v117 source video download was empty')
        run_ffmpeg(ffmpeg,src,'-an','-vf','scale=1920:-2','-c:v','libx264','-preset','veryfast','-crf','20','-g','8','-keyint_min','8','-sc_threshold','0','-movflags','+faststart',media_files['desktop_mp4'])
        run_ffmpeg(ffmpeg,src,'-an','-vf','scale=960:-2','-c:v','libx264','-preset','veryfast','-crf','21','-g','4','-keyint_min','4','-sc_threshold','0','-movflags','+faststart',media_files['mobile_mp4'])
        run_ffmpeg(ffmpeg,src,'-an','-vf','scale=1920:-2','-c:v','libvpx-vp9','-deadline','good','-cpu-used','4','-crf','32','-b:v','0',media_files['desktop_webm'])
        run_ffmpeg(ffmpeg,src,'-an','-vf','scale=960:-2','-c:v','libvpx-vp9','-deadline','good','-cpu-used','5','-crf','34','-b:v','0',media_files['mobile_webm'])
        subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-ss','0.08','-i',str(src),'-frames:v','1','-vf','scale=1920:-2','-q:v','3',str(media_files['poster'])],check=True)
    return 'cloudinary-transcode'

media_mode=ensure_media()
runpy.run_path(str(root/'scripts'/'build.py'),run_name='__main__')
fragment=(root/'site'/'v117-scroll-world.html').read_text().strip()
installed=[]

for name in ('index.html','latest.html','social-media.html'):
    html=out/name
    if not html.exists():continue
    content=html.read_text()
    target='<section class="living-archive" id="livingArchive">'
    if 'social-cover-art' not in content or target not in content:continue
    content=content.replace(target,fragment+'\n'+target,1)
    content=re.sub(r'<script type="module" src="v107-scroll-sculpture\.mjs(?:\?[^"]*)?"></script>\s*','',content)
    content=content.replace('</head>',f'<link rel="stylesheet" href="v117-scroll-world.css?v={release}">\n</head>',1)
    content=content.replace('</body>',f'<script type="module" src="v117-scroll-world.mjs?v={release}"></script>\n</body>',1)
    html.write_text(content)
    installed.append(name)

# Keep v116 source for comparison, but do not ship its rejected, unused film.
for old in ('v116-scroll-film.html','v116-scroll-film.css','v116-scroll-film.mjs','media/movx-crt-scroll.mp4','media/movx-crt-poster.jpg'):
    (out/old).unlink(missing_ok=True)

required=('v117-scroll-world.css','v117-scroll-world.mjs','media/movx-scroll-world-0923.mp4','media/movx-scroll-world-0923-mobile.mp4','media/movx-scroll-world-0923.webm','media/movx-scroll-world-0923-mobile.webm','media/movx-scroll-world-poster.jpg')
missing=[name for name in required if not (out/name).exists()]
if missing or not installed:raise SystemExit(f'v117 invalid build: missing={missing}; installed={installed}')
print(json.dumps({'release':release,'pages':installed,'source':source_url,'media_mode':media_mode,'mobile':'landscape letterbox fallback','missing':missing}))
