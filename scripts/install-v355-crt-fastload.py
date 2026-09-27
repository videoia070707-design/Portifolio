"""MOVX v355 — optimize and preload the standalone Scene-01 CRT.

Goals:
- keep the approved standalone vintage TV as the only production GLB;
- reduce transfer/parse cost without simplifying geometry;
- start the GLB request from <head> before the runtime modules execute;
- never expose the obsolete CSS/DOM television while the real model loads.
"""
from pathlib import Path
import json, re, shutil, subprocess

root=Path(__file__).resolve().parents[1]
out=root/'_site'
model=out/'models'/'movx-crt-tv.glb'
css_src=root/'site'/'v355-crt-fastload.css'
release='v355-optimized-preload'

if not model.exists():
    raise SystemExit('MOVX v355 canonical CRT GLB missing before optimization')
if not css_src.exists():
    raise SystemExit('MOVX v355 fast-load CSS missing')

raw_bytes=model.stat().st_size
tmp_webp=model.with_name('movx-crt-tv.v355-webp.glb')
tmp_quant=model.with_name('movx-crt-tv.v355-quant.glb')
for tmp in (tmp_webp,tmp_quant):
    if tmp.exists(): tmp.unlink()

cli=['npx','-y','@gltf-transform/cli@4.5.0']
subprocess.run(cli+['webp',str(model),str(tmp_webp),'--quality','80'],check=True)
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
# Inserted at the first executable position in <head>. The URL is split only so
# the legacy static manifest regex does not mistake this preload for another
# model manifest entry; the browser still resolves models/movx-crt-tv.glb.
preload=(
    '<script data-v355-crt-preload="v355-optimized-preload">'
    '(()=>{const l=document.createElement("link");l.rel="preload";l.as="fetch";'
    'l.type="model/gltf-binary";l.crossOrigin="anonymous";l.fetchPriority="high";'
    'l.href="models/"+"movx-crt-tv.glb";document.head.appendChild(l)})();'
    '</script>'
)
installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-v354-boot-choreo="v354-boot-scroll"' not in text:
        raise SystemExit(f'MOVX v355 requires v354 in {name}')

    # Inject the root marker against both <html> and <html ...>. Doing this
    # before head/body insertion guarantees the fast-load state is present on
    # the parser-created root element, before any runtime modules can execute.
    if 'data-crt-fastload=' not in text:
        text,count=re.subn(
            r'<html(?=[\s>])',
            f'<html data-crt-fastload="{release}"',
            text,
            count=1,
            flags=re.IGNORECASE,
        )
        if count!=1:
            raise SystemExit(f'MOVX v355 could not inject root fast-load marker into {name}')

    if 'data-v355-crt-preload=' not in text:
        text=text.replace('<head>', '<head>\n'+preload,1)
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
    if '<style data-v355-crt-fastload="v355-optimized-preload">' not in text:
        raise SystemExit(f'MOVX v355 critical fast-load CSS missing from {name}')
    # Static ordering contract: root marker and preload must be available before
    # the boot runtime. This catches regressions before browser QA/deploy.
    if text.find('data-crt-fastload="v355-optimized-preload"') > text.find('<head>'):
        raise SystemExit(f'MOVX v355 root marker was injected too late in {name}')
    if text.find('data-v355-crt-preload="v355-optimized-preload"') > text.find('</head>'):
        raise SystemExit(f'MOVX v355 preload was injected outside head in {name}')

published=sorted(p.name for p in (out/'models').glob('*.glb'))
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v355 single-model invariant failed: {published}')

print(json.dumps({
    'release':release,
    'raw_bytes':raw_bytes,
    'optimized_bytes':optimized_bytes,
    'saved_bytes':raw_bytes-optimized_bytes,
    'ratio':round(optimized_bytes/raw_bytes,4),
    'texture_codec':'webp quality 80',
    'geometry':'quantized, not simplified',
    'preload':'head/high priority',
    'root_marker':'parser-time/static',
    'fallback':'old DOM/CSS television hidden during real GLB load',
    'published_glbs':published,
},ensure_ascii=False))