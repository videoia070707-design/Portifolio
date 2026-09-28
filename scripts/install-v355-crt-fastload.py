"""MOVX v355/v356 — optimize, preload and warm the standalone Scene-01 CRT.

Goals:
- keep the approved standalone vintage TV as the only production GLB;
- reduce transfer/parse cost without simplifying geometry;
- start the GLB request from <head> before the runtime modules execute;
- warm the Three.js + GLTFLoader module graph before the runtime reaches Scene 01;
- never expose the obsolete CSS/DOM television while the real model loads.
"""
from pathlib import Path
import json, re, shutil, subprocess

root=Path(__file__).resolve().parents[1]
out=root/'_site'
model=out/'models'/'movx-crt-tv.glb'
css_src=root/'site'/'v355-crt-fastload.css'
release='v355-optimized-preload'
priority_release='v356-module-warmup'

if not model.exists():
    raise SystemExit('MOVX v355 canonical CRT GLB missing before optimization')
if not css_src.exists():
    raise SystemExit('MOVX v355 fast-load CSS missing')

raw_bytes=model.stat().st_size
tmp_webp=model.with_name('movx-crt-tv.v355-webp.glb')
tmp_quant=model.with_name('movx-crt-tv.v355-quant.glb')
for tmp in (tmp_webp,tmp_quant):
    if tmp.exists(): tmp.unlink()

cli=[str(root/'node_modules'/'.bin'/'gltf-transform')]
# v358: cap GPU upload/decode cost; keep all geometry and original source.
resized=model.with_name('movx-crt-tv.resized.glb')
subprocess.run(cli+['resize',str(model),str(resized),'--width','2048','--height','2048'],check=True)
subprocess.run(cli+['webp',str(resized),str(tmp_webp),'--quality','80'],check=True)
resized.unlink()
subprocess.run(cli+['quantize',str(tmp_webp),str(tmp_quant)],check=True)
if not tmp_quant.exists() or tmp_quant.stat().st_size<=0:
    raise SystemExit('MOVX v355 optimizer did not produce a GLB')
optimized_bytes=tmp_quant.stat().st_size
if optimized_bytes>=raw_bytes:
    raise SystemExit(f'MOVX v355 optimization regression: {optimized_bytes} >= {raw_bytes}')
shutil.move(str(tmp_quant),str(model))
if tmp_webp.exists(): tmp_webp.unlink()

css=css_src.read_text()
style=f'<style data-v355-crt-fastload="{release}">\n{css}\n</style>'

# Inserted at the first executable position in <head>. The model URL is split so
# the legacy static manifest regex does not mistake this preload for another
# manifest entry; the browser still resolves exactly models/movx-crt-tv.glb.
preload=(
    '<script data-v355-crt-preload="v355-optimized-preload">'
    '(()=>{const l=document.createElement("link");l.rel="preload";l.as="fetch";'
    'l.type="model/gltf-binary";l.crossOrigin="anonymous";l.fetchPriority="high";'
    'l.href="models/"+"movx-crt-tv.glb";document.head.appendChild(l)})();'
    '</script>'
)

# v356: fetch/compile the heavy module graph during HTML parsing. `modulepreload`
# does not execute the runtime, so the DOM model slot can still be registered by
# the normal bottom-of-body module after the full storyboard exists.
module_warmup=(
    f'<link rel="modulepreload" href="vendor/three.module.js" fetchpriority="high" data-v356-module="three" data-v356-priority="{priority_release}">\n'
    f'<link rel="modulepreload" href="vendor/three-addons/loaders/GLTFLoader.js?v=v350-real-crt" fetchpriority="high" data-v356-module="gltfloader" data-v356-priority="{priority_release}">'
)

installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-v354-boot-choreo="v354-boot-scroll"' not in text:
        raise SystemExit(f'MOVX v355 requires v354 in {name}')

    # Inject root markers against both <html> and <html ...>. Doing this before
    # head/body insertion guarantees the loading shield exists before runtime.
    if 'data-crt-fastload=' not in text:
        text,count=re.subn(
            r'<html(?=[\s>])',
            f'<html data-crt-fastload="{release}" data-crt-priority="{priority_release}"',
            text,
            count=1,
            flags=re.IGNORECASE,
        )
        if count!=1:
            raise SystemExit(f'MOVX v355 could not inject root fast-load marker into {name}')
    elif 'data-crt-priority=' not in text:
        text=text.replace(f'data-crt-fastload="{release}"',f'data-crt-fastload="{release}" data-crt-priority="{priority_release}"',1)

    if 'data-v355-crt-preload=' not in text:
        text=text.replace('<head>', '<head>\n'+preload+'\n'+module_warmup,1)
    elif 'data-v356-module="three"' not in text:
        text=text.replace('</head>',module_warmup+'\n</head>',1)
    if 'data-v355-crt-fastload=' not in text:
        text=text.replace('</head>',style+'\n</head>',1)
    path.write_text(text)
    installed.append(name)

for name in installed:
    text=(out/name).read_text()
    if 'data-v355-crt-preload="v355-optimized-preload"' not in text:
        raise SystemExit(f'MOVX v355 preload missing from {name}')
    if text.count('data-crt-fastload="v355-optimized-preload"')!=1:
        raise SystemExit(f'MOVX v355 root fast-load marker invalid in {name}')
    if text.count('data-crt-priority="v356-module-warmup"')!=1:
        raise SystemExit(f'MOVX v356 root priority marker invalid in {name}')
    if '<style data-v355-crt-fastload="v355-optimized-preload">' not in text:
        raise SystemExit(f'MOVX v355 critical fast-load CSS missing from {name}')
    if text.count('data-v356-module="three"')!=1 or text.count('data-v356-module="gltfloader"')!=1:
        raise SystemExit(f'MOVX v356 module warmup links invalid in {name}')
    # Static ordering contracts: markers, model preload and module warmup all
    # need to exist before the boot runtime is discovered at the end of body.
    if text.find('data-crt-fastload="v355-optimized-preload"') > text.find('<head>'):
        raise SystemExit(f'MOVX v355 root marker was injected too late in {name}')
    if text.find('data-v355-crt-preload="v355-optimized-preload"') > text.find('</head>'):
        raise SystemExit(f'MOVX v355 preload was injected outside head in {name}')
    if text.find('data-v356-module="three"') > text.find('</head>') or text.find('data-v356-module="gltfloader"') > text.find('</head>'):
        raise SystemExit(f'MOVX v356 module warmup escaped head in {name}')

published=sorted(p.name for p in (out/'models').glob('*.glb'))
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v355 single-model invariant failed: {published}')

print(json.dumps({
    'release':release,
    'priority_release':priority_release,
    'raw_bytes':raw_bytes,
    'optimized_bytes':optimized_bytes,
    'saved_bytes':raw_bytes-optimized_bytes,
    'ratio':round(optimized_bytes/raw_bytes,4),
    'texture_codec':'webp quality 80',
    'geometry':'quantized, not simplified',
    'preload':'head/high priority',
    'module_warmup':['three.module.js','GLTFLoader.js'],
    'root_marker':'parser-time/static',
    'fallback':'old DOM/CSS television hidden during real GLB load',
    'published_glbs':published,
},ensure_ascii=False))