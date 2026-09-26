"""MOVX v352 — make the uploaded standalone vintage CRT the only Scene-01 asset.

The source file is `site/models/vintage computer monitor 3d model.glb` and it
contains the complete TV by itself. v350 temporarily sourced the CRT from the
camera prop pack and isolated three meshes; that extraction is explicitly
bypassed here. Production still publishes one canonical file,
`models/movx-crt-tv.glb`, so the existing single-model contract remains intact.
"""
from pathlib import Path
import json, re, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
src=root/'site'/'models'/'vintage computer monitor 3d model.glb'
dst_dir=out/'models'
dst=dst_dir/'movx-crt-tv.glb'
runtime=out/'v322-glb-runtime.mjs'

if not src.exists():
    raise SystemExit(f'MOVX v352 standalone CRT source missing: {src}')
if not runtime.exists():
    raise SystemExit(f'MOVX v352 runtime missing: {runtime}')

# Hard single-model gate: wipe every copied source GLB and publish only the TV.
if dst_dir.exists():
    shutil.rmtree(dst_dir)
dst_dir.mkdir(parents=True,exist_ok=True)
shutil.copy2(src,dst)

# Keep the canonical production manifest, but point it at the complete standalone
# TV. Both production pages are normalized in case an earlier installer left a
# stale manifest.
manifest={'boot-tv':'models/movx-crt-tv.glb'}
manifest_script='<script>window.MOVX3D_MODELS='+json.dumps(manifest,separators=(',',':'))+';</script>'
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    text=re.sub(r'<script>window\.MOVX3D_MODELS=.*?</script>',manifest_script,text,count=1)
    if 'data-crt-asset=' not in text:
        text=text.replace('data-crt-fit="v351-scaled-center"',
                          'data-crt-fit="v351-scaled-center" data-crt-asset="v352-standalone-vintage-computer"',1)
    path.write_text(text)

# v350 identified the canonical filename as a signal to remove every mesh except
# three parts from the old prop-pack source. That is wrong for this standalone
# file: preserve every mesh/material/texture exactly as exported.
text=runtime.read_text()
needle="const productionCRT=instance.name==='boot-tv' && instance.url.includes(CRT_SOURCE_BASENAME);"
replacement="const productionCRT=false; // v352 standalone CRT: preserve the complete uploaded GLB"
if needle not in text:
    raise SystemExit('MOVX v352 could not find the legacy CRT extraction gate')
text=text.replace(needle,replacement,1)
text=text.replace("version:productionCRT?'v350-real-crt':'fixture'",
                  "version:(instance.name==='boot-tv'&&!instance.procedural)?'v352-standalone-crt':'fixture'",1)
runtime.write_text(text)

published=sorted(p.name for p in dst_dir.glob('*.glb'))
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v352 production scope escaped boot-tv: {published}')
if dst.stat().st_size!=src.stat().st_size:
    raise SystemExit('MOVX v352 standalone CRT copy size mismatch')

print(json.dumps({
    'release':'v352-standalone-crt',
    'source':'site/models/vintage computer monitor 3d model.glb',
    'published':'models/movx-crt-tv.glb',
    'bytes':dst.stat().st_size,
    'mesh_policy':'preserve-complete-glb',
    'active_slot':'boot-tv',
    'published_glbs':published,
    'later_models':'deferred'
},ensure_ascii=False))
