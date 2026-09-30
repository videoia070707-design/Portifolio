"""MOVX v374 — keep the approved CRT physically accessible on short desktops.

Runs after v373. CSS-only and scoped to Scene 01. The complete `.crt-wrap` moves
up on <=820px-tall desktop viewports so the screen, cabinet selector, loading
poster and WebGL hit surface remain registered and inside the visible scene.
No new renderer/context/scene/model/listener/RAF is introduced.
"""
from pathlib import Path
import json, re, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v374-short-viewport'
css_name='v374-short-viewport-physical-framing.css'

src=root/'site'/css_name
if not src.exists():
    raise SystemExit(f'MOVX v374 source missing: {src}')
shutil.copy2(src,out/css_name)
css=src.read_text()
style_tag=f'<style data-v374-safe-framing="{release}">\n{css}\n</style>'

installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-crt-instant-presence-layer="v373-poster-continuity"' not in text:
        raise SystemExit(f'MOVX v374 requires built v373 loading continuity in {name}')
    if 'data-crt-scene-frame-layer="v369-full-bleed"' not in text:
        raise SystemExit(f'MOVX v374 requires the full-bleed Scene 01 in {name}')
    if 'data-crt-safe-framing-layer=' not in text:
        text=text.replace('<html ',f'<html data-crt-safe-framing-layer="{release}" ',1)
    else:
        text=re.sub(r'data-crt-safe-framing-layer="[^"]+"',f'data-crt-safe-framing-layer="{release}"',text,count=1)
    if 'data-v374-safe-framing=' not in text:
        text=text.replace('</head>',style_tag+'\n</head>',1)
    if 'top:clamp(-250px,calc(100svh - 980px),-150px)' not in text:
        raise SystemExit(f'MOVX v374 critical short-viewport framing was not delivered in {name}')
    path.write_text(text)
    installed.append(name)

published=sorted(p.name for p in (out/'models').glob('*.glb'))
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v374 single-model invariant failed: {published}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'scope':'Scene 01 short desktop framing only',
    'short_desktop':'<=820px height moves the complete CRT interaction surface upward',
    'loading_continuity':'poster and real renderer move together because the shared wrapper is offset',
    'mobile':'unchanged natural flow',
    'single_model_gate':True,
    'new_script_requests':0,
    'new_webgl_resources':0,
    'other_models':'deferred and unpublished',
    'assets':[css_name],
    'published_glbs':published,
},ensure_ascii=False))
