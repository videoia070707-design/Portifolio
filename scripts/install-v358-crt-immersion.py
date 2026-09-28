"""MOVX v358 — make Scene 01 feel immediately 3D and directly interactive.

This pass keeps the hard one-model production gate. It does four things only:
1) starts a guaranteed high-priority CRT fetch during <head> parsing;
2) shows procedural geometry of the same CRT while the optimized GLB decodes;
3) swaps to the approved standalone GLB in the existing WebGL context;
4) adds cursor depth + DIREÇÃO/MOTION/AI/DIGITAL spatial states and links.

No later storyboard model is activated or published.
"""
from pathlib import Path
import json, re, shutil

root=Path(__file__).resolve().parents[1]
out=root/'_site'
release='v359-crt-refined'
css_name='v358-crt-immersion.css'
js_name='v358-crt-immersion.js'
runtime_path=out/'v322-glb-runtime.mjs'

for name in (css_name,js_name):
    src=root/'site'/name
    if not src.exists():
        raise SystemExit(f'MOVX v358 source missing: {src}')
    shutil.copy2(src,out/name)

if not runtime_path.exists():
    raise SystemExit('MOVX v358 requires the built v322/v352 CRT runtime')

runtime=runtime_path.read_text()

# Expose the four existing stage lights to the interaction loop. We keep the
# renderer and scene count unchanged: one canvas, one scene, one production GLB.
stage_old='return {scene,group,camera};'
stage_new='return {scene,group,camera,lights:{hemi,key,fill,rim}};'
if runtime.count(stage_old)!=1:
    raise SystemExit('MOVX v358 could not expose CRT stage lights')
runtime=runtime.replace(stage_old,stage_new,1)

# Lower DPR slightly on memory-constrained devices. The CRT occupies a large
# viewport region, so this materially reduces raster cost without changing the
# source model or its geometry.
dpr_old="renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.05:1.5));"
dpr_new="const memory=Number(navigator.deviceMemory||4);const dprCap=coarse?1:(memory<=4?1.18:1.36);renderer.setPixelRatio(Math.min(devicePixelRatio||1,dprCap));"
if runtime.count(dpr_old)!=1:
    raise SystemExit('MOVX v358 could not install adaptive DPR')
runtime=runtime.replace(dpr_old,dpr_new,1)

# A procedural CRT already exists in the MOVX runtime as the emergency fallback.
# v358 promotes it to a streaming proxy for the SAME Scene-01 object. It mounts
# instantly after Three.js is available, then the real GLB replaces it inside the
# same group/canvas. `loaded` is held false during streaming so v351 recentering
# waits for the final asset rather than locking onto the proxy.
new_load=r'''async function load(instance){
  if(instance.loading||instance.loaded)return;
  instance.loading=true;instance.element.dataset.glbState='loading';
  try{
    await modules();
    if(instance.procedural){
      const factory=await getProceduralFactory();
      const built=factory(THREE,{coarse});
      if(!built?.model)throw new Error('Procedural CRT factory returned no model');
      instance.model=built.model;
      instance.proceduralUpdate=built.update;
      instance.proceduralDispose=built.dispose;
      instance.stats={...statsFor(built.model),...(built.meta||{})};
      const stage=createStage(instance);Object.assign(instance,stage);
      instance.loaded=true;instance.loading=false;
      if(instance.visible)mount(instance);
      return;
    }

    if(instance.name==='boot-tv'){
      const factory=await getProceduralFactory();
      const preview=factory(THREE,{coarse});
      if(preview?.model){
        instance.model=preview.model;
        instance.proceduralUpdate=preview.update;
        instance.proceduralDispose=preview.dispose;
        instance.previewProcedural=true;
        instance.stats={...statsFor(preview.model),...(preview.meta||{}),streamingProxy:true};
        const stage=createStage(instance);Object.assign(instance,stage);
        instance.loaded=true;
        if(instance.visible)mount(instance);
        instance.loaded=false;
        instance.element.dataset.glbState='preview-ready';
        instance.element.dataset.modelKind='procedural-preview';
        if(instance.host)instance.host.dataset.modelKind='procedural-preview';
        root.dataset.crt3d='preview-ready';
        root.dataset.crtSource='procedural-streaming-proxy';
      }
    }

    const early=instance.name==='boot-tv'&&instance.url.includes(CRT_SOURCE_BASENAME)?window.__MOVX_CRT_BUFFER__:null;
    let gltf=null;
    if(early){
      root.dataset.crtDecode='waiting-buffer';
      const buffer=await early;
      if(buffer&&buffer.byteLength){
        root.dataset.crtDecode='parsing-early-buffer';
        gltf=await loader.parseAsync(buffer,new URL('.',instance.url).href);
      }
    }
    if(!gltf){
      root.dataset.crtDecode='loader-fetch';
      gltf=await loader.loadAsync(instance.url);
    }

    const model=gltf.scene||gltf.scenes?.[0];
    if(!model)throw new Error('GLTF contains no scene');
    const rawStats=statsFor(model);
    if(rawStats.triangles>MAX_TRIANGLES){disposeObject(model);throw new Error(`Model exceeds ${MAX_TRIANGLES} triangles (${rawStats.triangles})`)}
    model.traverse(node=>{if(node.isMesh){node.castShadow=!coarse;node.receiveShadow=!coarse;}});
    const fit=normalizeModel(model,instance.name==='boot-tv'?2.02:1.65);

    // Recenter after scaling before the swap. v351 remains as a defensive QA
    // layer, but users no longer see a one-frame right/down correction.
    model.updateMatrixWorld(true);
    const postBox=new THREE.Box3().setFromObject(model);
    if(!postBox.isEmpty()){
      const postCenter=postBox.getCenter(new THREE.Vector3());
      model.position.sub(postCenter);model.updateMatrixWorld(true);
    }

    const stats=statsFor(model);
    // Preserve the v352 standalone-asset metadata contract while adding v358
    // interaction metadata. No legacy prop-pack mesh extraction may reappear.
    const realStats={...stats,...fit,sourceMeshes:rawStats.meshes,sourceTriangles:rawStats.triangles,animations:gltf.animations?.length||0,kind:'glb',version:instance.name==='boot-tv'?'v352-standalone-crt':'fixture',immersionVersion:'v358-crt-spatial',fit:'full-product',crtParts:[],removedParts:0,streamingProxy:false};

    if(instance.previewProcedural&&instance.group){
      const oldModel=instance.model;
      instance.group.remove(oldModel);
      try{instance.proceduralDispose?.()}catch{}
      instance.proceduralUpdate=null;instance.proceduralDispose=null;
      instance.previewProcedural=false;
      instance.model=model;instance.stats=realStats;
      instance.group.add(model);
    }else{
      instance.model=model;instance.stats=realStats;
      const stage=createStage(instance);Object.assign(instance,stage);
    }

    instance.loaded=true;instance.loading=false;
    if(instance.visible&&!instance.renderer)mount(instance);
    instance.element.dataset.glbState='ready';
    instance.element.dataset.modelKind='glb';
    if(instance.host)instance.host.dataset.modelKind='glb';
    if(instance.name==='boot-tv'){
      root.dataset.crt3d='glb-ready';
      root.dataset.crtSource='v352-standalone-vintage-computer';
      root.dataset.crtDecode='ready';
    }
  }catch(error){
    if(instance.previewProcedural&&instance.renderer){
      instance.loading=false;instance.loaded=true;
      instance.procedural=true;instance.previewProcedural=false;
      instance.element.dataset.glbState='ready';
      instance.element.dataset.modelKind='procedural-crt';
      if(instance.host)instance.host.dataset.modelKind='procedural-crt';
      root.dataset.crt3d='procedural-ready';
      root.dataset.crtSource='fallback-after-stream-error';
      root.dataset.crtDecode='degraded';
      instance.error=String(error?.message||error);
      runtime.errors.push({slot:instance.name,src:instance.src||'procedural',error:instance.error,degraded:true});
      console.warn('[MOVX v358] real CRT stream failed; procedural CRT retained',error);
      return;
    }
    instance.loading=false;instance.error=String(error?.message||error);instance.element.dataset.glbState='error';
    runtime.errors.push({slot:instance.name,src:instance.src||'procedural',error:instance.error});
    root.dataset.crt3d='error';
    console.warn(`[MOVX v358] ${instance.name} fallback preserved`,error);
    try{instance.slot.restoreFallback?.()}catch{}
  }
}'''

runtime,count=re.subn(r'async function load\(instance\)\{.*?\n\}\n\nconst observer=',new_load+'\n\nconst observer=',runtime,count=1,flags=re.S)
if count!=1:
    raise SystemExit('MOVX v358 could not replace the CRT streaming loader')

# Make the MODEL itself react, rather than only tilting its DOM/canvas wrapper.
# Pointer, scroll, drag and the four semantic modes all feed one damped owner.
frame_old='''    if(instance.procedural){
      instance.proceduralUpdate?.({time:t,progress,active,pointerX:px,pointerY:py});
    }else if(!reduced){
      instance.group.rotation.y=px*.03 + (progress-.5)*.018;
      instance.group.rotation.x=-py*.018;
    }
    instance.renderer.render(instance.scene,instance.camera);'''
frame_new='''    const modeYaw=parseFloat(styles.getPropertyValue('--crt-mode-yaw'))||0;
    const modePitch=parseFloat(styles.getPropertyValue('--crt-mode-pitch'))||0;
    const modeRoll=parseFloat(styles.getPropertyValue('--crt-mode-roll'))||0;
    const modeZoom=parseFloat(styles.getPropertyValue('--crt-mode-zoom'))||0;
    const modeEnergy=Math.max(0,Math.min(1,parseFloat(styles.getPropertyValue('--crt-mode-energy'))||0));
    const dragYaw=parseFloat(styles.getPropertyValue('--crt-drag-yaw'))||0;
    const dragPitch=parseFloat(styles.getPropertyValue('--crt-drag-pitch'))||0;
    if(instance.procedural||instance.previewProcedural){
      instance.proceduralUpdate?.({time:t,progress,active,pointerX:px,pointerY:py});
    }
    if(!reduced){
      const motion=instance.motionState||(instance.motionState={rx:0,ry:0,rz:0,z:0,cameraZ:instance.camera.position.z});
      const targetY=-.18 + px*.18 + progress*.25 + modeYaw*2.3 + dragYaw;
      const targetX=-py*.070 + modePitch + dragPitch;
      const targetZ=modeRoll + (active?Math.sin(t*.00135)*.0045:0);
      const targetDepth=(active?.025:0) + modeEnergy*.035;
      const dt=instance.lastMotionTime?Math.min((t-instance.lastMotionTime)/1000,.1):1/60;instance.lastMotionTime=t;
      const follow=1-Math.exp(-dt*6);
      motion.ry+=(targetY-motion.ry)*follow;
      motion.rx+=(targetX-motion.rx)*follow;
      motion.rz+=(targetZ-motion.rz)*follow;
      motion.z+=(targetDepth-motion.z)*follow;
      const baseCamera=instance.name==='boot-tv'?4.72:3.45;
      const targetCamera=baseCamera-modeZoom-(active?.035:0);
      motion.cameraZ+=(targetCamera-motion.cameraZ)*follow;
      instance.group.rotation.set(motion.rx,motion.ry,motion.rz);
      instance.group.position.x=px*.025;
      instance.group.position.y=-.015-py*.010;
      instance.group.position.z=motion.z;
      instance.camera.position.z=motion.cameraZ;
      instance.camera.lookAt(0,0,0);
      if(instance.lights){
        instance.lights.key.intensity=4.05+modeEnergy*.78;
        instance.lights.fill.intensity=.72+modeEnergy*.62+Math.abs(px)*.10;
        instance.lights.rim.intensity=.48+modeEnergy*.70;
        instance.lights.key.position.x=3.2-px*.48;
        instance.lights.fill.position.x=-3+px*.62;
      }
    }
    instance.renderer.render(instance.scene,instance.camera);'''
if runtime.count(frame_old)!=1:
    raise SystemExit('MOVX v358 could not install model-owned spatial motion')
runtime=runtime.replace(frame_old,frame_new,1)

runtime=runtime.replace("version:'v350-real-crt-runtime'","version:'v358-crt-spatial-runtime'",1)
runtime_path.write_text(runtime)

# This fetch is intentionally executable, not only <link rel=preload>. It gives
# GLTFLoader an already-resolved ArrayBuffer and guarantees that network starts
# while the browser is still parsing the head. Query-model QA/debug overrides
# deliberately skip it so their custom asset remains authoritative.
early_fetch='''<script data-v358-crt-stream="v358-crt-spatial-input">(()=>{if(new URLSearchParams(location.search).has("crtModel")||window.__MOVX_CRT_BUFFER__)return;const u=new URL("models/"+"movx-crt-tv.glb",document.baseURI);window.__MOVX_CRT_FETCH_STARTED__=performance.now();window.__MOVX_CRT_BUFFER__=fetch(u,{cache:"force-cache",credentials:"same-origin",priority:"high"}).then(r=>{if(!r.ok)throw new Error("CRT HTTP "+r.status);return r.arrayBuffer()}).catch(e=>{console.warn("[MOVX v358] early CRT fetch fallback",e);return null})})();</script>'''
css_link=f'<link rel="stylesheet" href="{css_name}?v={release}" data-v358-crt-style="{release}">'
js_tag=f'<script src="{js_name}?v={release}" data-v358-crt-input="{release}"></script>'

installed=[]
for name in ('index.html','latest.html'):
    path=out/name
    text=path.read_text()
    if 'data-v355-crt-preload="v355-optimized-preload"' not in text:
        raise SystemExit(f'MOVX v358 requires v355 preload in {name}')
    if 'data-crt-asset="v352-standalone-vintage-computer"' not in text:
        raise SystemExit(f'MOVX v358 requires standalone CRT in {name}')
    if 'data-crt-immersion=' not in text:
        text=text.replace('<html ',f'<html data-crt-immersion="{release}" ',1)
    if 'data-v358-crt-stream=' not in text:
        marker='<script data-v355-crt-preload="v355-optimized-preload">'
        pos=text.find(marker)
        if pos<0:raise SystemExit(f'MOVX v358 could not find v355 preload insertion point in {name}')
        text=text[:pos]+early_fetch+'\n'+text[pos:]
    if 'data-v358-crt-style=' not in text:
        text=text.replace('</head>',css_link+'\n</head>',1)
    if 'data-v358-crt-input=' not in text:
        text=text.replace('</body>',js_tag+'\n</body>',1)
    text=text.replace('v322-glb-runtime.mjs?v=v350-real-crt','v322-glb-runtime.mjs?v=v359-crt-refined')
    text=text.replace('v354-boot-choreo.js?v=v354-boot-scroll','v354-boot-choreo.js?v=v359-crt-refined')
    text=text.replace('v314-crt.js?v=v321-production-storyboard','v314-crt.js?v=v359-crt-refined')
    text=text.replace('</head>','<link rel="preload" as="image" href="media/crt-v358-poster.webp" fetchpriority="high">\n</head>',1)
    text=re.sub(r'(<div[^>]*data-model-slot="boot-tv"[^>]*>)',r'\1<img class="crt-loading-poster" src="media/crt-v358-poster.webp" alt="TV MOVX" fetchpriority="high" width="900" height="800">',text,count=1)
    path.write_text(text)
    installed.append(name)

published=sorted(p.name for p in (out/'models').glob('*.glb'))
if published!=['movx-crt-tv.glb']:
    raise SystemExit(f'MOVX v358 single-model invariant failed: {published}')

for name in installed:
    text=(out/name).read_text()
    if text.find('data-v358-crt-stream=')>text.find('data-v355-crt-preload='):
        raise SystemExit(f'MOVX v358 early fetch must begin before the v355 preload script in {name}')
    if text.count('data-v358-crt-input=')!=1 or text.count('data-v358-crt-style=')!=1:
        raise SystemExit(f'MOVX v358 asset injection invalid in {name}')

print(json.dumps({
    'release':release,
    'pages':installed,
    'production_glbs':published,
    'active_model':'boot-tv only',
    'load_path':'head fetch -> procedural same-CRT proxy -> parse optimized GLB -> same-canvas swap',
    'interaction':['pointer parallax','scroll depth','DIREÇÃO/MOTION/AI/DIGITAL spatial modes'],
    'renderer':'single WebGL context; adaptive DPR',
    'later_3d_models':'still deferred'
},ensure_ascii=False))
