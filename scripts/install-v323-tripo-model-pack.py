"""MOVX v323 — install real Tripo GLB assets into the production storyboard.

The installer is intentionally fail-safe: only assets that physically exist in
site/models are published and added to the runtime manifest. Missing assets keep
the approved DOM/CSS fallback instead of creating broken WebGL scenes.
"""
from pathlib import Path
import json, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
src_models=root/'site'/'models'
dst_models=out/'models'
release='v323-tripo-model-pack'

MODEL_MAP={
    'hero-movx-logo':'movx-physical-logo.glb',
    'x-portal':'movx-x-portal.glb',
    'creative-machine':'movx-creative-machine.glb',
    'play-camera':'movx-camera.glb',
    'play-cube':'movx-x-cube.glb',
    'spatial-studio':'movx-spatial-studio.glb',
}

manifest={}
missing=[]
if src_models.exists():
    dst_models.mkdir(parents=True,exist_ok=True)
for slot,filename in MODEL_MAP.items():
    src=src_models/filename
    if not src.exists():
        missing.append(filename)
        continue
    dst=dst_models/filename
    shutil.copy2(src,dst)
    manifest[slot]=f'models/{filename}'

manifest_script='<script>window.MOVX3D_MODELS='+json.dumps(manifest,separators=(',',':'))+';</script>'
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    marker='<script type="module" src="v322-glb-runtime.mjs?v=v322-unified-glb-runtime"></script>'
    if marker not in text:
        raise SystemExit(f'MOVX v323 expected v322 runtime marker in {name}')
    if 'window.MOVX3D_MODELS=' not in text:
        text=text.replace(marker,manifest_script+'\n'+marker,1)
    text=text.replace('data-glb-runtime="v322-unified-glb-runtime"',
                      f'data-glb-runtime="v322-unified-glb-runtime" data-model-pack="{release}"',1)
    path.write_text(text)

print(json.dumps({
    'release':release,
    'installed':manifest,
    'missing':missing,
    'mode':'real GLB when present; DOM/CSS fallback when absent'
},ensure_ascii=False))
