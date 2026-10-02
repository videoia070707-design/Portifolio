from pathlib import Path
import json,re
root=Path(__file__).resolve().parents[1]
out=root/'_site'
errors=[]
index=(out/'index.html').read_text() if (out/'index.html').exists() else ''
runtime=(out/'v322-glb-runtime.mjs').read_text() if (out/'v322-glb-runtime.mjs').exists() else ''
channels=(out/'v361-crt-channels.mjs').read_text() if (out/'v361-crt-channels.mjs').exists() else ''
if 'data-v386-channel-click="v386-10-channel-click-field"' not in index:errors.append('v386.10 page marker missing')
if "v361-crt-channels.mjs?v=v386-10-channel-click-field" not in runtime:errors.append('v386.10 v361 cache key missing')
for contract in (
    "const surface=boot.querySelector('.scene-inner')||boot.querySelector('.boot-stage')||wrap;",
    "down={x:e.clientX,y:e.clientY,target:hit(e)};",
    "const target=down.target||hit(e);",
    "dataset.crtChannelClickSurface='v386.10-scene-field'",
):
    if contract not in channels:errors.append('missing channel click contract: '+contract)
if "wrap.addEventListener('pointerup'" in channels:errors.append('legacy wrap-only click listener survived v386.10')
models=sorted(p.name for p in (out/'models').glob('*.glb')) if (out/'models').exists() else []
if models!=['movx-crt-tv.glb']:errors.append(f'single-model gate failed: {models}')
if errors:raise SystemExit('MOVX v386.10 static QA failed: '+json.dumps(errors,ensure_ascii=False))
print(json.dumps({'qa':'v386.10-static','status':'PASS','clickSurface':'scene-inner','pointerdownRayLock':True,'models':models},ensure_ascii=False))
