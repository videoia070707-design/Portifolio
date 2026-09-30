"""Static performance budgets for the deployed MOVX artifact.

v371 keeps the one-model-at-a-time rollout. Scene 01 / BOOT (`boot-tv`) is
the only 3D slot eligible for production and must publish exactly one canonical
GLB: `models/movx-crt-tv.glb`. v361 channels, v362 tactility, v363 screen/dial
manipulation, v364 cabinet orbit, v365 channel physics, v366 object presence,
v367 scene direction, v368 scene-wide presence and v371 object-volume staging
all share the approved v358 renderer/context. v369/v370 remain Scene-01-only
visual layers. Healthy boot uses the authored real-TV poster until the GLB is
ready; the procedural streaming proxy must not be mounted.
"""
from pathlib import Path
import json
import re

root=Path(__file__).resolve().parents[1]
out=root/'_site'

budgets={
    'assets/hero/soul-of-design-hero-clean.webp':220_000,
    'media/movx-scroll-world-0923.mp4':3_900_000,
    'media/movx-scroll-world-0923-mobile.mp4':1_850_000,
    'media/movx-scroll-world-0923.webm':3_600_000,
    'media/movx-scroll-world-0923-mobile.webm':1_750_000,
    'media/movx-scroll-world-poster.jpg':180_000,
}
errors=[]
sizes={}
for name,limit in budgets.items():
    path=out/name
    size=path.stat().st_size if path.exists() else 0
    sizes[name]=size
    if not path.exists():errors.append(f'missing {name}')
    elif size>limit:errors.append(f'{name} is {size} bytes; budget is {limit}')

stylesheet_re=re.compile(r'<link\b(?=[^>]*\brel=["\']stylesheet["\'])[^>]*\bhref=["\']([^"\']+)["\'][^>]*>',re.I)
script_re=re.compile(r'<script\b[^>]*\bsrc=["\']([^"\']+)["\'][^>]*></script>',re.I)

old='assets/hero/soul-of-design-hero-clean.png'
new='assets/hero/soul-of-design-hero-clean.webp'
legacy=out/'social-media.html'
if not legacy.exists():
    errors.append('missing social-media.html');legacy_text=''
else:
    legacy_text=legacy.read_text()
    if f'src="{old}"' in legacy_text or f'href="{old}"' in legacy_text:errors.append('social-media.html still loads the PNG hero')
    if f'src="{new}"' not in legacy_text and f'href="{new}"' not in legacy_text:errors.append('social-media.html is missing optimized hero preload/src')
    legacy_styles=[]
    for href in stylesheet_re.findall(legacy_text):
        ref=href.split('?',1)[0].split('#',1)[0]
        if ref and ':' not in ref and not ref.startswith('//'):legacy_styles.append(ref)
    if len(legacy_styles)!=1:errors.append(f'social-media.html loads {len(legacy_styles)} local stylesheets; expected one v119+ bundle')
    elif not legacy_styles[0].startswith('movx-css-'):errors.append(f'social-media.html does not load a MOVX CSS bundle: {legacy_styles[0]}')
    elif not (out/legacy_styles[0]).exists():errors.append(f'social-media.html references missing CSS bundle {legacy_styles[0]}')

home=out/'index.html';home_css_bytes=0;home_js_bytes=0;home_styles=[];home_scripts=[]
if not home.exists():
    errors.append('missing index.html');home_text=''
else:
    home_text=home.read_text()
    if 'data-movx-production="v321-production-storyboard"' not in home_text:errors.append('index.html is not the v321 production storyboard')
    if 'data-storyboard="v320"' not in home_text:errors.append('index.html missing v320 storyboard marker')
    if 'data-glb-runtime="v322-unified-glb-runtime"' not in home_text:errors.append('index.html missing v322 GLB runtime marker')
    if 'data-crt-runtime="v350-real-glb"' not in home_text:errors.append('index.html missing v350 real CRT marker')
    if 'v322-glb-runtime.mjs?v=v371-object-volume' not in home_text:errors.append('index.html missing v371 CRT runtime cache key')
    if 'v322-glb-runtime.css?v=v350-real-crt' not in home_text:errors.append('index.html missing v350 CRT surface cache key')
    if 'data-model-pack="v323-tripo-model-pack"' not in home_text:errors.append('index.html missing v323 model-pack marker')
    if 'data-model-scope="v350-crt-only"' not in home_text:errors.append('index.html missing v350 CRT-only production scope marker')
    if 'data-model-framing="v324-model-framing"' not in home_text:errors.append('index.html missing v324 framing marker')
    if 'data-crt-tactility="v362-crt-tactility"' not in home_text:errors.append('index.html missing v362 tactile CRT marker')
    if 'data-crt-direct="v363-direct-manipulation"' not in home_text:errors.append('index.html missing v363 direct manipulation marker')
    if 'data-crt-object="v364-immersive-object"' not in home_text:errors.append('index.html missing v364 cabinet interaction marker')
    if 'data-crt-channel-physics="v365-channel-physics"' not in home_text:errors.append('index.html missing v365 channel physics marker')
    if 'data-crt-presence-layer="v366-clean-boot-presence"' not in home_text:errors.append('index.html missing v366 object-presence marker')
    if 'data-crt-director-layer="v367-scene01-director"' not in home_text:errors.append('index.html missing v367 Scene-01 director marker')
    if 'data-crt-scene-presence-layer="v368-scene-presence"' not in home_text:errors.append('index.html missing v368 scene-presence marker')
    if 'data-crt-scene-frame-layer="v369-full-bleed"' not in home_text:errors.append('index.html missing v369 full-bleed Scene-01 marker')
    if 'data-crt-light-spill-layer="v370-screen-to-room"' not in home_text:errors.append('index.html missing v370 CRT light-spill marker')
    if 'data-crt-object-volume-layer="v371-object-volume"' not in home_text:errors.append('index.html missing v371 CRT object-volume marker')
    if 'data-crt-loading="poster-only"' not in home_text:errors.append('index.html missing poster-only loading marker')
    if 'data-v366-crt-presence="v366-clean-boot-presence"' not in home_text:errors.append('index.html missing v366 critical inline CSS')
    if 'data-v367-scene-director="v367-scene01-director"' not in home_text:errors.append('index.html missing v367 critical inline CSS')
    if 'data-logo-focus=' in home_text:errors.append('second-model Physical Logo focus is still active')
    if '../assets/' in home_text:errors.append('index.html contains parent-relative asset paths')
    for href in stylesheet_re.findall(home_text):
        ref=href.split('?',1)[0].split('#',1)[0]
        if not ref or ':' in ref or ref.startswith('//'):continue
        home_styles.append(ref);path=out/ref
        if not path.exists():errors.append(f'index.html references missing CSS {ref}')
        else:home_css_bytes+=path.stat().st_size
    for src in script_re.findall(home_text):
        ref=src.split('?',1)[0].split('#',1)[0]
        if not ref or ':' in ref or ref.startswith('//'):continue
        home_scripts.append(ref);path=out/ref
        if not path.exists():errors.append(f'index.html references missing JS {ref}')
        else:home_js_bytes+=path.stat().st_size
    if len(home_styles)!=18:errors.append(f'index.html loads {len(home_styles)} production CSS layers; expected 18 with v366/v367/v369/v370 critical CSS inline')
    if len(home_scripts)!=13:errors.append(f'index.html loads {len(home_scripts)} production JS layers; expected 13 with v366-v371 shared-runtime modules')
    if 'v345-logo-focus.css' in home_styles:errors.append('Physical Logo focus CSS must be inactive during CRT stage')
    if 'v345-logo-focus.mjs' in home_scripts:errors.append('Physical Logo focus runtime must be inactive during CRT stage')
    if 'v324-model-framing.css' not in home_styles:errors.append('index.html missing v324-model-framing.css')
    if 'v324-model-framing.mjs' not in home_scripts:errors.append('index.html missing v324-model-framing.mjs')
    if 'v358-crt-immersion.css' not in home_styles:errors.append('index.html missing v358 CRT immersion CSS')
    if 'v358-crt-immersion.js' not in home_scripts:errors.append('index.html missing v358 CRT interaction runtime')
    if 'v362-crt-tactility.css' not in home_styles:errors.append('index.html missing v362 CRT tactile CSS')
    if 'v363-crt-direct-manipulation.css' not in home_styles:errors.append('index.html missing v363 CRT direct manipulation CSS')
    if 'v364-crt-object-interaction.css' not in home_styles:errors.append('index.html missing v364 CRT object interaction CSS')
    if home_css_bytes>640_000:errors.append(f'CRT-first production CSS is {home_css_bytes} bytes; budget is 640000')
    if home_js_bytes>515_000:errors.append(f'CRT-first production JS is {home_js_bytes} bytes; budget is 515000')
    for slot in ('boot-tv','hero-movx-logo','x-portal','creative-machine','play-cassette','play-camera','play-cube','play-cd','play-window','spatial-studio','closing-window'):
        if f'data-model-slot="{slot}"' not in home_text:errors.append(f'index.html missing storyboard model slot {slot}')

crt_name='movx-crt-tv.glb'
deferred_model_files=(
    'movx-physical-logo.glb','movx-x-portal.glb','movx-creative-machine.glb',
    'movx-camera.glb','movx-x-cube.glb','movx-spatial-studio.glb'
)
model_dir=out/'models'
published_glbs=sorted(p.name for p in model_dir.glob('*.glb')) if model_dir.exists() else []
for filename in deferred_model_files:
    if filename in published_glbs:errors.append(f'deferred GLB leaked into production: models/{filename}')
if published_glbs!=[crt_name]:errors.append(f'CRT-first production GLBs are {published_glbs}; expected exactly [{crt_name!r}]')
model_sizes={};model_total=0
for filename in published_glbs:
    path=model_dir/filename;size=path.stat().st_size
    model_sizes[filename]=size;model_total+=size
    if size>1_600_000:errors.append(f'{filename} is {size} bytes; optimized Scene-01 budget is 1600000')
manifest_refs=re.findall(r'models/movx-[^"\']+\.glb',home_text) if home_text else []
if manifest_refs!=[f'models/{crt_name}']:errors.append(f'CRT manifest mismatch: {manifest_refs}')

addon_root=out/'vendor'/'three-addons'
loader=addon_root/'loaders'/'GLTFLoader.js'
if not loader.exists():errors.append('local GLTFLoader.js is missing')
addon_bytes=sum(p.stat().st_size for p in addon_root.rglob('*.js')) if addon_root.exists() else 0
if addon_bytes>350_000:errors.append(f'v322 Three addon modules are {addon_bytes} bytes; budget is 350000')
if loader.exists() and re.search(r"from\s+['\"]three['\"]",loader.read_text()):errors.append('GLTFLoader still has a bare three import')
required_assets=(
    'v322-glb-runtime.mjs','v322-glb-runtime.css','v348-crt-procedural.mjs',
    'v324-model-framing.mjs','v324-model-framing.css','v358-crt-immersion.css','v358-crt-immersion.js',
    'v361-crt-channels.mjs','v362-crt-tactility.css','v362-crt-tactility.mjs',
    'v363-crt-direct-manipulation.css','v363-crt-direct-manipulation.mjs',
    'v364-crt-object-interaction.css','v364-crt-object-interaction.mjs',
    'v365-crt-channel-physics.mjs','v366-crt-presence.mjs','v366-crt-presence.css',
    'v367-crt-scene-director.mjs','v367-crt-scene-director.css','v368-scene-presence.mjs',
    'v369-scene01-full-bleed.css','v370-crt-light-spill.css','v371-crt-object-volume.mjs'
)
for required in required_assets:
    if not (out/required).exists():errors.append(f'{required} is missing')
procedural_path=out/'v348-crt-procedural.mjs'
procedural_bytes=procedural_path.stat().st_size if procedural_path.exists() else 0
if procedural_bytes>35_000:errors.append(f'procedural CRT fallback module is {procedural_bytes} bytes; budget is 35000')
physics_path=out/'v365-crt-channel-physics.mjs'
physics_bytes=physics_path.stat().st_size if physics_path.exists() else 0
if physics_bytes>12_000:errors.append(f'v365 channel physics module is {physics_bytes} bytes; budget is 12000')
presence_path=out/'v366-crt-presence.mjs';presence_css_path=out/'v366-crt-presence.css'
presence_bytes=presence_path.stat().st_size if presence_path.exists() else 0
presence_css_bytes=presence_css_path.stat().st_size if presence_css_path.exists() else 0
if presence_bytes>14_000:errors.append(f'v366 presence module is {presence_bytes} bytes; budget is 14000')
if presence_css_bytes>18_000:errors.append(f'v366 critical CSS is {presence_css_bytes} bytes; budget is 18000')
director_path=out/'v367-crt-scene-director.mjs';director_css_path=out/'v367-crt-scene-director.css'
director_bytes=director_path.stat().st_size if director_path.exists() else 0
director_css_bytes=director_css_path.stat().st_size if director_css_path.exists() else 0
if director_bytes>22_000:errors.append(f'v367 Scene-01 director module is {director_bytes} bytes; budget is 22000')
if director_css_bytes>18_000:errors.append(f'v367 Scene-01 director CSS is {director_css_bytes} bytes; budget is 18000')
scene_presence_path=out/'v368-scene-presence.mjs'
scene_presence_bytes=scene_presence_path.stat().st_size if scene_presence_path.exists() else 0
if scene_presence_bytes>10_000:errors.append(f'v368 scene-presence module is {scene_presence_bytes} bytes; budget is 10000')
object_volume_path=out/'v371-crt-object-volume.mjs'
object_volume_bytes=object_volume_path.stat().st_size if object_volume_path.exists() else 0
if object_volume_bytes>12_000:errors.append(f'v371 object-volume module is {object_volume_bytes} bytes; budget is 12000')

# Guard the exact close-up regression: WebGL owns perspective; legacy CSS must
# not transform the active CRT slot/renderer.
crt_surface=(out/'v322-glb-runtime.css').read_text() if (out/'v322-glb-runtime.css').exists() else ''
if '[data-model-slot="boot-tv"].v322-runtime-active{transform:none!important' not in crt_surface:
    errors.append('CRT active slot does not neutralize legacy CSS perspective')
if '[data-model-slot="boot-tv"].v322-runtime-active .v322-model-renderer{transform:none!important}' not in crt_surface:
    errors.append('CRT renderer host still allows compounded CSS perspective')
crt_runtime=(out/'v322-glb-runtime.mjs').read_text() if (out/'v322-glb-runtime.mjs').exists() else ''
for contract in ("camera.position.set(.02,.03,4.72)","const CRT_PARTS=new Set(['tripo_part_7','tripo_part_13','tripo_part_18'])","version:'v358-crt-spatial-runtime'","fit:'full-product'","immersionVersion:'v358-crt-spatial'"):
    if contract not in crt_runtime:errors.append(f'v371 real CRT runtime contract missing: {contract}')
if "attachCRTChannels(instance);" not in crt_runtime:errors.append('v361 live channel runtime is missing from the unified CRT frame')
if "attachCRTTactility(instance);" not in crt_runtime:errors.append('v362 tactile CRT runtime is missing from the unified CRT frame')
if "attachCRTDirectManipulation(instance);" not in crt_runtime:errors.append('v363 direct CRT manipulation is missing from the unified CRT frame')
if "attachCRTObjectInteraction(instance);" not in crt_runtime:errors.append('v364 cabinet orbit is missing from the unified CRT frame')
if "attachCRTChannelPhysics(instance);" not in crt_runtime:errors.append('v365 channel physics is missing from the unified CRT frame')
if "attachCRTPresence(instance);" not in crt_runtime:errors.append('v366 object presence is missing from the unified CRT frame')
if "attachCRTScenePresence(instance);" not in crt_runtime:errors.append('v368 scene-wide presence is missing from the unified CRT frame')
if "instance.scenePresence?.update(t);" not in crt_runtime:errors.append('v368 scene-wide presence is not running inside the shared CRT frame')
if "attachCRTSceneDirector(instance);" not in crt_runtime:errors.append('v367 Scene-01 director is missing from the unified CRT frame')
if "instance.sceneDirector?.update(t);" not in crt_runtime:errors.append('v367 Scene-01 director is not running inside the shared CRT frame')
if "attachCRTObjectVolume(instance);" not in crt_runtime:errors.append('v371 object-volume staging is missing from the unified CRT frame')
if "instance.objectVolume?.update(t);" not in crt_runtime:errors.append('v371 object-volume staging is not running inside the shared CRT frame')
scene_presence_pos=crt_runtime.find('instance.scenePresence?.update(t);')
director_pos=crt_runtime.find('attachCRTSceneDirector(instance);')
director_update_pos=crt_runtime.find('instance.sceneDirector?.update(t);')
volume_pos=crt_runtime.find('attachCRTObjectVolume(instance);')
volume_update_pos=crt_runtime.find('instance.objectVolume?.update(t);')
if scene_presence_pos<0 or director_pos<0 or scene_presence_pos>director_pos:errors.append('v368 scene presence must update before the v367 director resolves the frame')
if director_update_pos<0 or volume_pos<0 or director_update_pos>volume_pos:errors.append('v371 object volume must resolve after the v367 director')
if volume_pos<0 or volume_update_pos<0 or volume_pos>volume_update_pos:errors.append('v371 object-volume attachment/update order is invalid')
if 'procedural-streaming-proxy' in crt_runtime:errors.append('healthy boot still contains the procedural streaming proxy')
if "const dprCap=coarse?1:(memory<=4?1.18:1.36)" not in crt_runtime:errors.append('v358 adaptive CRT DPR cap is missing')
if "instance.lights.key.intensity=4.05+modeEnergy*.78" not in crt_runtime:errors.append('v358 interactive CRT lighting contract is missing')

runtime=(out/'script.js').read_text()
if 'loading="${itemIndex < 2 ? \'eager\' : \'lazy\'}"' in runtime:errors.append('conveyor still promotes below-fold artwork to eager')
if 'loading="lazy" fetchpriority="low"' not in runtime:errors.append('conveyor low-priority image policy is missing')
if "rootMargin:'320px 0px'" not in runtime:errors.append('archive predecode margin was not reduced')

scroll=(out/'v117-scroll-world.mjs').read_text()
if "rootMargin:'120% 0px'" not in scroll or "rootMargin:'0px'" not in scroll:errors.append('Scroll World warm-load plus viewport observers are missing')
if "const response=await fetch(candidate.url" not in scroll or "const data=await response.blob()" not in scroll or "video.src=blobURL" not in scroll:errors.append('Scroll World deferred Blob delivery for reliable seeking is missing')
if "canWebM" not in scroll or "canH264" not in scroll or "candidatesFor" not in scroll:errors.append('Scroll World codec negotiation/retry candidates are missing')
if "if(canH264)items.push({codec:'h264-mp4'" not in scroll:errors.append('Scroll World no longer prefers H.264 for desktop scrub responsiveness')
if "sourceTrim=0.00" not in scroll or "mappedTarget" not in scroll or "markFrameReady" not in scroll:errors.append('Scroll World must scrub the complete encoded source from 0.00s')
if "retrying alternate codec" not in scroll:errors.append('Scroll World alternate codec retry is missing')
if 'userEngaged' not in scroll or 'engagementThreshold' not in scroll or '!nearby' not in scroll:errors.append('Scroll World engagement-aware warm loading is missing')
if 'video.play()' in scroll:errors.append('Scroll World must not depend on autoplay to expose real frames')
if "dataset.spatialMode='camera-3d'" not in scroll or '--world-persp-x' not in scroll or '--world-persp-y' not in scroll:errors.append('Scroll World spatial scroll contract is missing')

scroll_css=(out/'v117-scroll-world.css').read_text()
if 'background:#000' not in scroll_css:errors.append('Scroll World pure black stage is missing')
if '#050403' in scroll_css or '#080706' in scroll_css:errors.append('Scroll World still contains the old warm brown-black stage colors')
if 'rgba(5,4,4' in scroll_css:errors.append('Scroll World veil still contains warm brown tint')
if legacy_text:
    if legacy_text.count('data-world-chapter-panel=')!=4:errors.append('social-media Scroll World must render four scroll chapters')
    if 'movx-scroll-world-poster.jpg?v=v127-full-video-black' not in legacy_text:errors.append('social-media Scroll World v127 poster cache-bust is missing')
    if 'ROLE PARA ATRAVESSAR' not in legacy_text:errors.append('social-media Scroll World interaction cue is missing')

if errors:raise SystemExit('MOVX performance QA failed: '+json.dumps(errors,ensure_ascii=False))
print(json.dumps({
    'status':'passed','sizes':sizes,
    'storyboard':{'css_layers':len(home_styles),'css_bytes':home_css_bytes,'js_layers':len(home_scripts),'js_bytes':home_js_bytes},
    'crt3d':{
        'revision':'v371-object-volume','renderer':'v358-crt-spatial-runtime','active_slot':'boot-tv',
        'published_asset':'models/movx-crt-tv.glb','healthy_loading':'authored real-TV poster until GLB ready',
        'procedural_streaming_proxy':'disabled','production_glbs':len(published_glbs),'published_glbs':published_glbs,
        'model_bytes':model_sizes,'model_total_bytes':model_total,'channel_physics_bytes':physics_bytes,
        'object_presence_bytes':presence_bytes,'presence_css_bytes':presence_css_bytes,
        'director_bytes':director_bytes,'director_css_bytes':director_css_bytes,
        'scene_presence_bytes':scene_presence_bytes,'object_volume_bytes':object_volume_bytes,
        'director_loop':'shared v322 frame',
        'presence_contract':'scene-wide cinematic pointer + CRT-specific physical raycast + real-group presentation volume',
        'later_models':'forbidden until CRT approval'
    },
    'legacy_editorial':'social-media.html','deferred_video_gate':True,
    'desktop_delivery':'full-video h264-first blob scrub','mobile_delivery':'full-video h264-first blob scrub',
    'source_trim_seconds':0.00,'stage_background':'#000','warm_margin':'120%','scroll_chapters':4
},ensure_ascii=False))