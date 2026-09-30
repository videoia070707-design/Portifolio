"""MOVX v372 — make semantic channel poses authoritative on the real CRT.

The v358 runtime already parses --crt-mode-yaw/pitch/roll/zoom, but its physical
pose still used one hard-coded -0.12 yaw for every channel. Newer v365/v367/v371
layers could only add small offsets on top of that bias, so MOTION/DIGITAL could
change screen/light/content while the cabinet visually remained on the same side.

v372 fixes that systemic handoff without adding a model, renderer, context, scene,
listener or RAF. The existing mode values become the low-frequency base pose; the
newer layers remain responsible for physics, camera composition and interaction.
"""
from pathlib import Path
import json, re

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v372-channel-pose-authority'
runtime_path=out/'v322-glb-runtime.mjs'

if not runtime_path.exists():
    raise SystemExit('MOVX v372 requires the built v371 CRT runtime')
runtime=runtime_path.read_text()

old="""      const targetY=-.12 + (reduced?0:px*.055 + progress*.10);
      const targetX=reduced?0:-py*.025;
      const targetZ=0;
      const targetDepth=(active?.025:0) + modeEnergy*.035;"""
new="""      // v372: channel semantics own the cabinet's low-frequency presentation.
      // v365/v367/v371 then add physical response, camera staging and scene-wide
      // pointer orbit. Removing the legacy -0.12 bias lets opposite channels
      // actually reveal opposite sides of the same real GLB.
      const targetY=(modeYaw*.55) + (reduced?0:px*.055 + progress*.10);
      const targetX=(modePitch*.45) + (reduced?0:-py*.025);
      const targetZ=modeRoll*.45;
      const targetDepth=(active?.025:0) + modeEnergy*.035 + modeZoom*.08;"""

if new not in runtime:
    if runtime.count(old)!=1:
        raise SystemExit('MOVX v372 could not find the legacy fixed-yaw pose contract')
    runtime=runtime.replace(old,new,1)

runtime_path.write_text(runtime)

installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-crt-object-volume-layer="v371-object-volume"' not in text:
        raise SystemExit(f'MOVX v372 requires the built v371 object-volume layer in {name}')
    if 'data-crt-channel-pose-layer=' not in text:
        text=text.replace('<html ',f'<html data-crt-channel-pose-layer="{release}" ',1)
    else:
        text=re.sub(r'data-crt-channel-pose-layer="[^"]+"',f'data-crt-channel-pose-layer="{release}"',text,count=1)
    text=text.replace('v322-glb-runtime.mjs?v=v371-object-volume',f'v322-glb-runtime.mjs?v={release}')
    if f'v322-glb-runtime.mjs?v={release}' not in text:
        raise SystemExit(f'MOVX v372 runtime cache key missing in {name}')
    path.write_text(text)
    installed.append(name)

published=sorted(p.name for p in (out/'models').glob('*.glb'))
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v372 single-model invariant failed: {published}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'single_model_gate':True,
    'fix':'v358 semantic yaw/pitch/roll/zoom now drive the real CRT base pose instead of a fixed -0.12 yaw',
    'yaw_mix':'.55 mode yaw + existing pointer/scroll, then v365/v367/v371',
    'pitch_mix':'.45 mode pitch + existing pointer, then downstream layers',
    'roll_mix':'.45 mode roll + downstream layers',
    'depth_mix':'.08 mode zoom + existing energy/active depth',
    'render_loop':'existing shared v322 frame',
    'new_webgl_resources':0,
    'other_models':'deferred and unpublished',
    'published_glbs':published,
},ensure_ascii=False))
