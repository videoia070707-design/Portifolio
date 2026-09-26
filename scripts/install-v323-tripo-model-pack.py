"""MOVX v347 — publish only the first approved Tripo GLB.

The one-by-one implementation rule is enforced here: source files for future
models may remain in the repository, but production publishes only the Physical
Logo until that first scene is approved. All later slots keep their DOM/CSS
fallback and are not registered in the WebGL manifest.
"""
from pathlib import Path
import json, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
src_models=root/'site'/'models'
dst_models=out/'models'
release='v323-tripo-model-pack'
scope='v347-physical-logo-only'

MODEL_MAP={
    'hero-movx-logo':'movx-physical-logo.glb',
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

if set(manifest)-{'hero-movx-logo'}:
    raise SystemExit('MOVX v347 production model scope escaped hero-movx-logo')

manifest_script='<script>window.MOVX3D_MODELS='+json.dumps(manifest,separators=(',',':'))+';</script>'
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    marker='<script type="module" src="v322-glb-runtime.mjs?v=v347-single-model"></script>'
    if marker not in text:
        raise SystemExit(f'MOVX v347 expected single-model runtime marker in {name}')
    if 'window.MOVX3D_MODELS=' not in text:
        text=text.replace(marker,manifest_script+'\n'+marker,1)
    text=text.replace('data-glb-runtime="v322-unified-glb-runtime"',
                      f'data-glb-runtime="v322-unified-glb-runtime" data-model-pack="{release}" data-model-scope="{scope}"',1)
    path.write_text(text)

print(json.dumps({
    'release':release,
    'scope':scope,
    'installed':manifest,
    'missing':missing,
    'mode':'one model at a time; later slots remain DOM/CSS fallbacks'
},ensure_ascii=False))
