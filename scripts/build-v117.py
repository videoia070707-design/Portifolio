"""Build MOVX full-video Scroll World with pure-black surfaces and sparse story overlays."""
from pathlib import Path
import runpy, json, re, shutil, subprocess, tempfile, urllib.request

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v129-story-overlays'
surface_release='v128-pure-black-sections'
source_url='https://res.cloudinary.com/gp3xbngz/video/upload/v1790173902/0923.mp4'
clip_start='0.00'
media=root/'site'/'media'
media.mkdir(parents=True,exist_ok=True)

media_files={
    'desktop_mp4':media/'movx-scroll-world-0923.mp4',
    'mobile_mp4':media/'movx-scroll-world-0923-mobile.mp4',
    'desktop_webm':media/'movx-scroll-world-0923.webm',
    'mobile_webm':media/'movx-scroll-world-0923-mobile.webm',
    'poster':media/'movx-scroll-world-poster.jpg',
}
media_budgets={
    'desktop_mp4':3_900_000,
    'mobile_mp4':1_850_000,
    'desktop_webm':3_600_000,
    'mobile_webm':1_750_000,
    'poster':180_000,
}

def run_ffmpeg(ffmpeg,src,*args):
    subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-i',str(src),*map(str,args)],check=True)

def media_is_optimized():
    return all(path.exists() and 1024<path.stat().st_size<=media_budgets[key] for key,path in media_files.items())

def ensure_media():
    if media_is_optimized():
        return 'packaged-optimized'
    ffmpeg=shutil.which('ffmpeg')
    if not ffmpeg:
        raise SystemExit('MOVX performance media is missing and ffmpeg is unavailable')
    with tempfile.TemporaryDirectory(prefix='movx-v129-') as tmpdir:
        src=Path(tmpdir)/'0923-source.mp4'
        req=urllib.request.Request(source_url,headers={'User-Agent':'MOVX-v129-builder/1.0'})
        with urllib.request.urlopen(req,timeout=90) as response, src.open('wb') as target:
            shutil.copyfileobj(response,target)
        if src.stat().st_size<1024:
            raise SystemExit('MOVX source video download was empty')

        run_ffmpeg(ffmpeg,src,'-ss',clip_start,'-an','-vf','scale=1440:-2','-c:v','libx264','-preset','medium','-crf','26','-g','6','-keyint_min','6','-sc_threshold','0','-movflags','+faststart',media_files['desktop_mp4'])
        run_ffmpeg(ffmpeg,src,'-ss',clip_start,'-an','-vf','scale=854:-2','-c:v','libx264','-preset','medium','-crf','27','-g','4','-keyint_min','4','-sc_threshold','0','-movflags','+faststart',media_files['mobile_mp4'])
        run_ffmpeg(ffmpeg,src,'-ss',clip_start,'-an','-vf','scale=1440:-2','-c:v','libvpx-vp9','-deadline','good','-cpu-used','6','-crf','39','-b:v','0','-g','8',media_files['desktop_webm'])
        run_ffmpeg(ffmpeg,src,'-ss',clip_start,'-an','-vf','scale=854:-2','-c:v','libvpx-vp9','-deadline','good','-cpu-used','7','-crf','41','-b:v','0','-g','6',media_files['mobile_webm'])
        subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-ss',clip_start,'-i',str(src),'-frames:v','1','-vf','scale=1440:-2','-q:v','4',str(media_files['poster'])],check=True)
    if not media_is_optimized():
        sizes={key:path.stat().st_size if path.exists() else 0 for key,path in media_files.items()}
        raise SystemExit(f'MOVX media exceeds performance budget: {sizes}')
    return 'cloudinary-transcode-optimized'

def run_base_build_without_retired_v116():
    retired_names=('v116-scroll-film.html','v116-scroll-film.css','v116-scroll-film.mjs')
    with tempfile.TemporaryDirectory(prefix='movx-v129-retired-') as tmpdir:
        retired=Path(tmpdir)
        moved=[]
        for name in retired_names:
            src=root/'site'/name
            if src.exists():
                dst=retired/name
                shutil.move(str(src),str(dst))
                moved.append((src,dst))
        try:
            runpy.run_path(str(root/'scripts'/'build.py'),run_name='__main__')
        finally:
            for src,dst in moved:
                if dst.exists():
                    shutil.move(str(dst),str(src))

def optimize_hero():
    ffmpeg=shutil.which('ffmpeg')
    source=out/'assets'/'hero'/'soul-of-design-hero-clean.png'
    target=out/'assets'/'hero'/'soul-of-design-hero-clean.webp'
    if not ffmpeg or not source.exists():
        raise SystemExit('MOVX hero optimizer prerequisites are missing')
    run_ffmpeg(ffmpeg,source,'-frames:v','1','-c:v','libwebp','-quality','82','-compression_level','6',target)
    if not target.exists() or target.stat().st_size>220_000:
        raise SystemExit(f'MOVX optimized hero is too large: {target.stat().st_size if target.exists() else 0}')
    old_local='assets/hero/soul-of-design-hero-clean.png'
    new_local='assets/hero/soul-of-design-hero-clean.webp'
    rewrites=0
    for html in out.glob('*.html'):
        content=html.read_text()
        changed=content.replace(f'href="{old_local}"',f'href="{new_local}"').replace(f'src="{old_local}"',f'src="{new_local}"')
        if changed!=content:
            rewrites+=1
            html.write_text(changed)
    return {'png_bytes':source.stat().st_size,'webp_bytes':target.stat().st_size,'pages':rewrites}

def optimize_runtime():
    runtime=out/'script.js'
    text=runtime.read_text()
    eager='loading="${itemIndex < 2 ? \'eager\' : \'lazy\'}" fetchpriority="${itemIndex === 0 ? \'high\' : \'auto\'}"'
    lazy='loading="lazy" fetchpriority="low"'
    if text.count(eager)!=1:
        raise SystemExit('MOVX expected one eager conveyor image template')
    text=text.replace(eager,lazy,1)
    warm="rootMargin:'900px 0px'"
    if text.count(warm)!=1:
        raise SystemExit('MOVX expected one 900px archive predecode margin')
    text=text.replace(warm,"rootMargin:'320px 0px'",1)
    runtime.write_text(text)

def install_black_surfaces():
    href=f'v128-black-sections.css?v={surface_release}'
    installed=[]
    for html in out.glob('*.html'):
        content=html.read_text()
        if '<body' not in content or '</head>' not in content:
            continue
        if href not in content:
            content=content.replace('</head>',f'<link rel="stylesheet" href="{href}">\n</head>',1)
            html.write_text(content)
        installed.append(html.name)
    return installed

media_mode=ensure_media()
run_base_build_without_retired_v116()
hero_stats=optimize_hero()
optimize_runtime()
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
    content=content.replace('</head>',f'<link rel="stylesheet" href="v117-scroll-world.css?v={release}">\n<link rel="stylesheet" href="v129-scroll-story.css?v={release}">\n</head>',1)
    content=content.replace('</body>',f'<script type="module" src="v117-scroll-world.mjs?v={release}"></script>\n<script type="module" src="v129-scroll-story.mjs?v={release}"></script>\n</body>',1)
    html.write_text(content)
    installed.append(name)

surface_pages=install_black_surfaces()

for old in ('v116-scroll-film.html','v116-scroll-film.css','v116-scroll-film.mjs','media/movx-crt-scroll.mp4','media/movx-crt-poster.jpg'):
    (out/old).unlink(missing_ok=True)

required=('v117-scroll-world.css','v117-scroll-world.mjs','v128-black-sections.css','v129-scroll-story.css','v129-scroll-story.mjs','assets/hero/soul-of-design-hero-clean.webp','media/movx-scroll-world-0923.mp4','media/movx-scroll-world-0923-mobile.mp4','media/movx-scroll-world-0923.webm','media/movx-scroll-world-0923-mobile.webm','media/movx-scroll-world-poster.jpg')
missing=[name for name in required if not (out/name).exists()]
if missing or not installed or not surface_pages:raise SystemExit(f'v129 invalid build: missing={missing}; scroll_pages={installed}; surface_pages={surface_pages}')
media_sizes={key:path.stat().st_size for key,path in media_files.items()}
print(json.dumps({'release':release,'surface_release':surface_release,'pages':installed,'surface_pages':surface_pages,'source':source_url,'source_trim_seconds':float(clip_start),'media_mode':media_mode,'hero':hero_stats,'media_bytes':media_sizes,'desktop':'full-video H264-first deferred blob scrub','mobile':'full-video H264-first deferred blob scrub','scroll_world':'full-bleed scroll-linked video from original frame zero + 4 sparse editorial overlays','dark_sections':'pure #000 top-level surfaces; warm legacy section fills neutralized','missing':missing}))