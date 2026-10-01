"""MOVX v382 — approved-reference synthesis and visual hardening.

Runs after v381. Keeps the validated Scene-01 CRT runtime untouched, replaces the
People placeholder with an existing human project image, and injects one critical
CSS layer for capabilities/contact/hero composition cleanup.
"""
from pathlib import Path
import json, re

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v382-world-pass'
css_name='v382-reference-synthesis.css'
src=root/'site'/css_name
human_asset='assets/projects/voltara-engenharia-aplicada/slide-01.webp'
old_people='assets/projects/hardwork-neon-direction/slide-01.webp'

if not src.exists():
    raise SystemExit(f'MOVX v382 source missing: {src}')
css=src.read_text()
css_bytes=len(css.encode())
if css_bytes>24_000:
    raise SystemExit(f'MOVX v382 CSS exceeds 24 KB: {css_bytes}')
if not (out/human_asset).exists():
    raise SystemExit(f'MOVX v382 human People asset missing: {human_asset}')

style_tag=f'<style data-v382-reference-synthesis="{release}">\n{css}\n</style>'
installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    for contract in (
        'data-v381-art-direction="v381-reference-reset"',
        'data-crt-retune-layer="v380-physical-channel-retune"',
        'data-model-scope="v350-crt-only"',
    ):
        if contract not in text:
            raise SystemExit(f'MOVX v382 requires {contract} in {name}')
    if 'data-v382-reference-synthesis=' in text:
        text=re.sub(r'data-v382-reference-synthesis="[^"]+"',f'data-v382-reference-synthesis="{release}"',text,count=1)
    else:
        text=text.replace('<html ',f'<html data-v382-reference-synthesis="{release}" ',1)

    if old_people in text:
        text=text.replace(old_people,human_asset,1)
    if human_asset not in text:
        raise SystemExit(f'MOVX v382 could not install the human People image in {name}')
    text=text.replace('alt="Imagem humana provisória do acervo MOVX"','alt="Profissional em projeto real do acervo MOVX"',1)

    if '<style data-v382-reference-synthesis=' not in text:
        text=text.replace('</head>',style_tag+'\n</head>',1)
    if text.count('<style data-v382-reference-synthesis=')!=1:
        raise SystemExit(f'MOVX v382 duplicate synthesis layer in {name}')
    path.write_text(text)
    installed.append(name)

published=sorted(p.name for p in (out/'models').glob('*.glb')) if (out/'models').exists() else []
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v382 single-model invariant failed: {published}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'principles':['editorial DOM','one-world scene rhythm','object-led spatial moments','no dashboard residue'],
    'scene01':'same GLB/runtime; tall-desktop composition lift only',
    'capabilities':'flat editorial instrument grid; old rounded hardware shell suppressed',
    'people':'existing real-human project image; fixed absolute-fill crop',
    'contact':'zero-height landscape bug repaired; cinematic flat window',
    'single_model_gate':True,
    'new_webgl_resources':0,
    'new_runtime_loops':0,
    'new_input_listeners':0,
    'css_bytes':css_bytes,
    'published_glbs':published,
},ensure_ascii=False))
