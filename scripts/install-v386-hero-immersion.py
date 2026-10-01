"""MOVX v386 — visible Scene 01 immersion pass.

The v385 family fixed scope discipline but intentionally preserved most of the
Hero look. v386 makes the change visually obvious while keeping the same approved
CRT, renderer, scene, interaction stack and later-model gate.

This installer does two things only:
1) injects #boot-only critical CSS for the new Hero composition;
2) strengthens the already-existing semantic CRT mode poses in the built v358
   controller so the real GLB reads as 3D before the visitor drags it.
"""
from pathlib import Path
import json,re

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v386-spatial-hero'
css_name='v386-hero-immersion.css'
css_src=root/'site'/css_name
controller=out/'v358-crt-immersion.js'

if not css_src.exists():raise SystemExit(f'MOVX v386 source missing: {css_src}')
if not controller.exists():raise SystemExit('MOVX v386 requires built v358 interaction controller')
css=css_src.read_text()

for forbidden in ('#hero','#portal','#work','#machine','#playground','#studio','#people','#contact'):
    if forbidden in css:raise SystemExit(f'MOVX v386 escaped Hero scope via {forbidden}')
if '#boot' not in css:raise SystemExit('MOVX v386 CSS has no #boot scope')

js=controller.read_text()
old="""  const MODES=[
    {id:'direction',label:'DIREÇÃO',yaw:rad(-7.2),pitch:rad(1.0),roll:rad(-.25),zoom:.08,energy:.34},
    {id:'motion',label:'MOTION',yaw:rad(7.8),pitch:rad(-1.45),roll:rad(1.25),zoom:.13,energy:.72},
    {id:'ai',label:'AI',yaw:rad(-3.2),pitch:rad(2.15),roll:rad(-.7),zoom:.18,energy:1},
    {id:'digital',label:'DIGITAL',yaw:rad(6.1),pitch:rad(.7),roll:rad(-1.05),zoom:.11,energy:.56},
  ];"""
new="""  const MODES=[
    {id:'direction',label:'DIREÇÃO',yaw:rad(-16.0),pitch:rad(1.8),roll:rad(-.45),zoom:.10,energy:.38},
    {id:'motion',label:'MOTION',yaw:rad(17.0),pitch:rad(-2.2),roll:rad(1.55),zoom:.15,energy:.76},
    {id:'ai',label:'AI',yaw:rad(-12.0),pitch:rad(2.8),roll:rad(-1.0),zoom:.19,energy:1},
    {id:'digital',label:'DIGITAL',yaw:rad(14.0),pitch:rad(1.15),roll:rad(-1.2),zoom:.13,energy:.60},
  ];"""
if new not in js:
    if js.count(old)!=1:raise SystemExit('MOVX v386 could not locate semantic CRT mode profiles')
    js=js.replace(old,new,1)
controller.write_text(js)

style_tag=f'<style data-v386-hero-immersion="{release}">\n{css}\n</style>'
installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    if not path.exists():raise SystemExit(f'MOVX v386 page missing: {name}')
    text=path.read_text()
    for contract in (
        'data-v385-hero-only="v385-hero-recovery"',
        'data-v385-1-crt-framing="v385-1-crt-framing"',
        'data-model-scope="v350-crt-only"',
    ):
        if contract not in text:raise SystemExit(f'MOVX v386 requires {contract} in {name}')
    if 'data-v386-hero-immersion=' not in text:
        text=text.replace('<html ',f'<html data-v386-hero-immersion="{release}" ',1)
    else:
        text=re.sub(r'data-v386-hero-immersion="[^"]+"',f'data-v386-hero-immersion="{release}"',text,count=1)
    if '<style data-v386-hero-immersion=' not in text:
        text=text.replace('</head>',style_tag+'\n</head>',1)
    if text.count('<style data-v386-hero-immersion=')!=1:
        raise SystemExit(f'MOVX v386 duplicate Hero immersion layer in {name}')
    path.write_text(text);installed.append(name)

published=sorted(p.name for p in (out/'models').glob('*.glb')) if (out/'models').exists() else []
if published!=['movx-crt-tv.glb']:raise SystemExit(f'MOVX v386 single-model invariant failed: {published}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'scope':'#boot only',
    'visible_change':'complete CRT framing + stronger three-quarter rest pose + wider spatial separation + calmer interaction cue',
    'direction_yaw_deg':-16,
    'motion_yaw_deg':17,
    'ai_yaw_deg':-12,
    'digital_yaw_deg':14,
    'single_model_gate':True,
    'new_webgl_resources':0,
    'new_runtime_loops':0,
    'new_input_listeners':0,
    'published_glbs':published,
},ensure_ascii=False))
