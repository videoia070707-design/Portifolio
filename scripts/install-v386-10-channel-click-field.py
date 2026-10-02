"""MOVX v386.10 — make simple screen/selector clicks follow the visible CRT.

v386.8/v386.9 moved the existing drag/orbit pointer families from the historical
`.crt-wrap` to the complete Scene-01 field because the strongly staged CRT can be
visibly projected outside that old DOM box. The older v361 click family remained
on `.crt-wrap`, creating a real UX mismatch: visible screen geometry could drag,
but a deliberate click could miss the live channel action.

This build-stage patch relocates the *existing* v361 click listeners to the same
Scene-01 field and locks the Three.js ray-hit at pointerdown so small camera/object
movement between down/up cannot turn a valid click into a miss. No new listener
family, model, renderer, WebGL context, scene or RAF is introduced.
"""
from pathlib import Path
import json,re

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v386-10-channel-click-field'
channels_path=out/'v361-crt-channels.mjs'
runtime_path=out/'v322-glb-runtime.mjs'

if not channels_path.exists() or not runtime_path.exists():
    raise SystemExit('MOVX v386.10 requires the built v386.9 CRT runtime')

channels=channels_path.read_text()
old=''' const wrap=boot.querySelector('.crt-wrap');let down=null;
 wrap.addEventListener('pointermove',e=>{const target=hit(e);state.screenHover=target===screen||target?.name==='tripo_part_8';wrap.style.cursor=state.screenHover?'pointer':'default'});
 wrap.addEventListener('pointerleave',()=>{state.screenHover=false;wrap.style.cursor='default'});
 wrap.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY}});
 wrap.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<8){const target=hit(e);if(target===screen)interact();else if(target?.name==='tripo_part_8'){const modes=['direction','motion','ai','digital'];boot.querySelector('[data-crt-mode-control="'+modes[(modes.indexOf(state.channel)+1)%4]+'"]').click()}}down=null});'''
new=''' const wrap=boot.querySelector('.crt-wrap');
 const surface=boot.querySelector('.scene-inner')||boot.querySelector('.boot-stage')||wrap;let down=null;
 const editorialTarget=e=>e.target instanceof Element&&!!e.target.closest('button,a,input,label');
 surface.addEventListener('pointermove',e=>{
  if(editorialTarget(e)){state.screenHover=false;return}
  const target=hit(e);state.screenHover=target===screen||target?.name==='tripo_part_8';
 });
 surface.addEventListener('pointerleave',()=>{state.screenHover=false});
 surface.addEventListener('pointerdown',e=>{
  if(editorialTarget(e)){down=null;return}
  down={x:e.clientX,y:e.clientY,target:hit(e)};
 });
 surface.addEventListener('pointerup',e=>{
  if(!down){return}
  if(!editorialTarget(e)&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<8){
   // Keep pointerdown as click authority. The v386 camera/CRT can move a few
   // pixels between down/up under live parallax; a user who pressed the visible
   // screen must not lose the click because the object reacted to that press.
   const target=down.target||hit(e);
   if(target===screen)interact();
   else if(target?.name==='tripo_part_8'){
    const modes=['direction','motion','ai','digital'];
    boot.querySelector('[data-crt-mode-control="'+modes[(modes.indexOf(state.channel)+1)%4]+'"]').click();
   }
  }
  down=null;
 });
 document.documentElement.dataset.crtChannelClickSurface='v386.10-scene-field';'''

if new not in channels:
    if channels.count(old)!=1:
        raise SystemExit('MOVX v386.10 could not find the legacy v361 wrap-only click contract')
    channels=channels.replace(old,new,1)
channels_path.write_text(channels)

runtime=runtime_path.read_text()
runtime,count=re.subn(
    r"v361-crt-channels\.mjs\?v=[^']+",
    f'v361-crt-channels.mjs?v={release}',
    runtime,
    count=1,
)
if count!=1:
    raise SystemExit('MOVX v386.10 could not cache-bust the v361 live screen module')
runtime_path.write_text(runtime)

installed=[]
for name in ('index.html','latest.html'):
    path=out/name;text=path.read_text()
    if 'data-v386-input-surface="v386-9-scene-field-input"' not in text:
        raise SystemExit(f'MOVX v386.10 requires the v386.9 Scene-01 field in {name}')
    if 'data-v386-channel-click=' not in text:
        text=text.replace('<html ',f'<html data-v386-channel-click="{release}" ',1)
    else:
        text=re.sub(r'data-v386-channel-click="[^"]+"',f'data-v386-channel-click="{release}"',text,count=1)
    path.write_text(text);installed.append(name)

models=sorted(p.name for p in (out/'models').glob('*.glb'))
if models!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v386.10 single-model invariant failed: {models}')

print(json.dumps({
    'release':release,
    'installed':installed,
    'scope':'Scene 01 / boot-tv only',
    'click_surface':'scene-inner',
    'click_authority':'Three.js ray-hit captured on pointerdown',
    'editorial_controls':'excluded from physical click capture',
    'existing_drag_surface':'v386.9 scene-inner',
    'new_listener_families':0,
    'new_webgl_resources':0,
    'models':models,
},ensure_ascii=False))
