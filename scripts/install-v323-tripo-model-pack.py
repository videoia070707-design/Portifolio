"""MOVX v350 — publish only the FIRST real Tripo model.

The approved CRT exists inside `site/models/movx-camera.glb`, the original Tripo
prop pack. Production copies that source to the canonical Scene-01 filename
`movx-crt-tv.glb`; the runtime then isolates only the TV meshes. Every other
source GLB remains excluded from the public build.
"""
from pathlib import Path
import json, shutil, re

root=Path(__file__).resolve().parents[1]
out=root/'_site'
src_models=root/'site'/'models'
dst_models=out/'models'
release='v323-tripo-model-pack'
scope='v350-crt-only'

MODEL_MAP={
    # slot: (source asset containing approved TV, canonical published filename)
    'boot-tv':('movx-camera.glb','movx-crt-tv.glb'),
}

# The canonical base build copies the whole `site/` tree. Remove that copied
# model directory first so later-stage GLBs cannot leak into the public build.
if dst_models.exists():
    shutil.rmtree(dst_models)

manifest={}
missing=[]
source_map={}
for slot,(source_name,published_name) in MODEL_MAP.items():
    src=src_models/source_name
    if not src.exists():
        missing.append(source_name)
        continue
    dst_models.mkdir(parents=True,exist_ok=True)
    dst=dst_models/published_name
    shutil.copy2(src,dst)
    manifest[slot]=f'models/{published_name}'
    source_map[slot]=source_name

if set(manifest)-{'boot-tv'}:
    raise SystemExit('MOVX v350 production model scope escaped boot-tv')
if missing:
    raise SystemExit('MOVX v350 real CRT source missing: '+', '.join(missing))

manifest_script='<script>window.MOVX3D_MODELS='+json.dumps(manifest,separators=(',',':'))+';</script>'
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    marker='<script type="module" src="v322-glb-runtime.mjs?v=v350-real-crt"></script>'
    if marker not in text:
        raise SystemExit(f'MOVX v350 expected CRT runtime marker in {name}')
    # Replace any stale manifest left by a previous source layer, otherwise inject.
    if re.search(r'<script>window\.MOVX3D_MODELS=.*?</script>',text):
        text=re.sub(r'<script>window\.MOVX3D_MODELS=.*?</script>',manifest_script,text,count=1)
    else:
        text=text.replace(marker,manifest_script+'\n'+marker,1)
    if 'data-model-pack=' not in text:
        text=text.replace('data-glb-runtime="v322-unified-glb-runtime"',
                          f'data-glb-runtime="v322-unified-glb-runtime" data-model-pack="{release}" data-model-scope="{scope}"',1)
    else:
        text=re.sub(r'data-model-scope="[^"]*"',f'data-model-scope="{scope}"',text,count=1)
    path.write_text(text)

# Hard build invariant: production gets exactly one GLB and it is the canonical TV.
published_glbs=[] if not dst_models.exists() else sorted(p.name for p in dst_models.glob('*.glb'))
expected=['movx-crt-tv.glb']
if published_glbs!=expected:
    raise SystemExit(f'MOVX v350 production GLBs mismatch: {published_glbs}; expected {expected}')

print(json.dumps({
    'release':release,
    'scope':scope,
    'installed':manifest,
    'source_map':source_map,
    'published_glbs':published_glbs,
    'missing':missing,
    'procedural_fallback':None,
    'runtime_cache':'v350-real-crt',
    'mode':'CRT first; real Tripo TV source only; later GLBs stripped from public build'
},ensure_ascii=False))
