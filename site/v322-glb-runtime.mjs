/* MOVX v347 — single-model GLB runtime gate.
   The storyboard keeps every future 3D slot as DOM/CSS fallback, but production
   WebGL is intentionally limited to the FIRST storyboard model until it is signed
   off. Current active slot: boot-tv (CRT / Y2K TV opening). */
const root=document.documentElement;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse=matchMedia('(pointer:coarse)').matches;
const params=new URLSearchParams(location.search);

const PARAMS={
  'boot-tv':'crtModel',
  'hero-movx-logo':'logoModel',
  'x-portal':'portalModel',
  'creative-machine':'machineModel',
  'play-cassette':'cassetteModel',
  'play-camera':'cameraModel',
  'play-cube':'cubeModel',
  'play-cd':'cdModel',
  'play-window':'windowModel',
  'spatial-studio':'studioModel',
  'closing-window':'contactModel',
};
const ACTIVE_MODEL_SLOTS=new Set(['boot-tv']);
const MAX_TRIANGLES=220000;
const CONTEXT_LIMIT=coarse?2:3;
const runtime={
  version:'v347-single-model-runtime',
  instances:{},
  errors:[],
  contextLimit:CONTEXT_LIMIT,
  activeSlots:[...ACTIVE_MODEL_SLOTS],
  awaitingSlots:[],
  deferredSlots:[],
  singleModelMode:true,
};
window.MOVX3D=window.MOVX3D||{};
window.MOVX3D.runtime=runtime;
root.dataset.v322Glb='booting';
root.dataset.movx3dScope='boot-tv';

const manifest=(()=>{
  const direct=window.MOVX3D_MODELS;
  if(direct&&typeof direct==='object')return direct;
  const node=document.querySelector('#movx-3d-manifest[type="application/json"]');
  if(!node)return {};
  try{return JSON.parse(node.textContent||'{}')}catch(error){console.warn('[MOVX v347] Invalid model manifest',error);return {}}
})();

let THREE,GLTFLoader,loader;
async function modules(){
  if(THREE&&GLTFLoader)return {THREE,GLTFLoader};
  const [threeMod,loaderMod]=await Promise.all([
    import('./vendor/three.module.js'),
    import('./vendor/three-addons/loaders/GLTFLoader.js?v=v347-single-model-runtime')
  ]);
  THREE=threeMod;GLTFLoader=loaderMod.GLTFLoader;loader=new GLTFLoader();
  return {THREE,GLTFLoader};
}

function sourceFor(name,slot){
  const key=PARAMS[name];
  return (key&&params.get(key)) || slot?.requestedSrc || slot?.element?.dataset?.modelSrc || manifest[name] || null;
}
function safeURL(src){
  try{
    const url=new URL(src,location.href);
    if(!['http:','https:','blob:'].includes(url.protocol))return null;
    return url.href;
  }catch{return null}
}
function statsFor(object){
  let meshes=0,triangles=0;
  object.traverse(node=>{
    if(!node.isMesh)return;
    meshes++;
    const g=node.geometry;
    if(!g)return;
    const count=g.index?.count ?? g.attributes?.position?.count ?? 0;
    triangles+=Math.floor(count/3);
  });
  return {meshes,triangles};
}
function normalizeModel(object){
  const box=new THREE.Box3().setFromObject(object);
  if(box.isEmpty())throw new Error('Model bounding box is empty');
  const center=box.getCenter(new THREE.Vector3());
  const size=box.getSize(new THREE.Vector3());
  object.position.sub(center);
  const max=Math.max(size.x,size.y,size.z,.001);
  const scale=1.65/max;
  object.scale.multiplyScalar(scale);
  object.updateMatrixWorld(true);
  return {sourceSize:{x:size.x,y:size.y,z:size.z},normalizedScale:scale};
}
function createStage(instance){
  const scene=new THREE.Scene();
  const group=new THREE.Group();scene.add(group);group.add(instance.model);
  const camera=new THREE.PerspectiveCamera(34,1,.05,30);
  camera.position.set(0,0,3.2);
  scene.add(new THREE.HemisphereLight(0xfff2e8,0x16110e,2.15));
  const key=new THREE.DirectionalLight(0xfff7ef,4.4);key.position.set(3.2,4.4,5);scene.add(key);
  const fill=new THREE.DirectionalLight(0xff8a45,1.35);fill.position.set(-3,.8,2.2);scene.add(fill);
  return {scene,group,camera};
}
function removeRenderer(instance,{restore=true}={}){
  if(!instance.renderer)return;
  try{instance.renderer.dispose();instance.renderer.forceContextLoss?.()}catch{}
  try{instance.slot.restoreFallback?.()}catch{}
  instance.host?.remove();
  instance.element.classList.remove('v322-runtime-active');
  if(restore)instance.element.dataset.glbState='hibernated';
  instance.renderer=null;instance.host=null;instance.canvas=null;
}
function activeRenderers(){return Object.values(runtime.instances).filter(x=>x.renderer)}
function enforceLimit(except){
  const live=activeRenderers();
  if(live.length<CONTEXT_LIMIT)return;
  const victim=live.filter(x=>x!==except&&!x.visible).sort((a,b)=>(a.lastSeen||0)-(b.lastSeen||0))[0]
    || live.filter(x=>x!==except).sort((a,b)=>(a.lastSeen||0)-(b.lastSeen||0))[0];
  if(victim)removeRenderer(victim);
}
function mount(instance){
  if(instance.renderer||!instance.loaded)return;
  enforceLimit(instance);
  const host=document.createElement('div');host.className='v322-model-renderer';
  host.dataset.runtimeModel=instance.name;
  const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');host.appendChild(canvas);
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:!coarse,powerPreference:'high-performance'});
  renderer.setClearColor(0x000000,0);
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.05:1.5));
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  if('outputColorSpace'in renderer&&THREE.SRGBColorSpace)renderer.outputColorSpace=THREE.SRGBColorSpace;
  instance.renderer=renderer;instance.host=host;instance.canvas=canvas;
  const accepted=instance.slot.replaceWith?.(host)!==false;
  if(!accepted){renderer.dispose();host.remove();instance.renderer=null;instance.host=null;instance.canvas=null;throw new Error('Slot rejected renderer')}
  instance.element.classList.add('v322-runtime-active');
  instance.element.dataset.glbState='ready';
  resize(instance);
}
function resize(instance){
  if(!instance.renderer||!instance.host)return;
  const r=instance.element.getBoundingClientRect();
  const w=Math.max(1,Math.round(r.width)),h=Math.max(1,Math.round(r.height));
  if(w===instance.width&&h===instance.height)return;
  instance.width=w;instance.height=h;
  instance.renderer.setSize(w,h,false);instance.camera.aspect=w/h;instance.camera.updateProjectionMatrix();
}
function disposeObject(object){
  object?.traverse?.(node=>{
    node.geometry?.dispose?.();
    const mats=Array.isArray(node.material)?node.material:[node.material];
    mats.filter(Boolean).forEach(mat=>{
      for(const value of Object.values(mat))if(value?.isTexture)value.dispose?.();
      mat.dispose?.();
    });
  });
}
async function load(instance){
  if(instance.loading||instance.loaded)return;
  instance.loading=true;instance.element.dataset.glbState='loading';
  try{
    await modules();
    const gltf=await loader.loadAsync(instance.url);
    const model=gltf.scene||gltf.scenes?.[0];
    if(!model)throw new Error('GLTF contains no scene');
    const stats=statsFor(model);
    if(stats.triangles>MAX_TRIANGLES){disposeObject(model);throw new Error(`Model exceeds ${MAX_TRIANGLES} triangles (${stats.triangles})`)}
    const fit=normalizeModel(model);
    instance.model=model;instance.stats={...stats,...fit,animations:gltf.animations?.length||0};
    const stage=createStage(instance);Object.assign(instance,stage);
    instance.loaded=true;instance.loading=false;
    if(instance.visible)mount(instance);
  }catch(error){
    instance.loading=false;instance.error=String(error?.message||error);instance.element.dataset.glbState='error';
    runtime.errors.push({slot:instance.name,src:instance.src,error:instance.error});
    console.warn(`[MOVX v347] ${instance.name} fallback preserved`,error);
    try{instance.slot.restoreFallback?.()}catch{}
  }
}

const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
  const name=entry.target.dataset.modelSlot;const instance=runtime.instances[name];if(!instance)return;
  instance.visible=entry.isIntersecting;instance.lastSeen=performance.now();
  if(instance.visible){if(!instance.loaded)load(instance);else mount(instance)}
}),{rootMargin:'320px 0px',threshold:.01});
const resizeObserver=new ResizeObserver(entries=>entries.forEach(entry=>{
  const name=entry.target.dataset.modelSlot;const instance=runtime.instances[name];if(instance)resize(instance);
}));

function deferSlot(name,slot){
  if(!slot?.element)return;
  slot.element.dataset.glbState='deferred';
  slot.element.dataset.modelDeferred='true';
  slot.element.classList.remove('v322-model-requested','v322-runtime-active');
  try{slot.restoreFallback?.()}catch{}
  runtime.deferredSlots.push(name);
}
function register(name,slot){
  if(!ACTIVE_MODEL_SLOTS.has(name)){deferSlot(name,slot);return}
  const src=sourceFor(name,slot);
  if(!src){
    slot.element.dataset.glbState='awaiting-model';
    slot.element.dataset.modelAwaiting='true';
    runtime.awaitingSlots.push(name);
    return;
  }
  const url=safeURL(src);
  if(!url){slot.element.dataset.glbState='error';runtime.errors.push({slot:name,src,error:'unsupported URL'});return}
  const instance={name,slot,element:slot.element,src,url,visible:false,loading:false,loaded:false,renderer:null,lastSeen:0};
  runtime.instances[name]=instance;slot.element.dataset.glbState='queued';slot.element.classList.add('v322-model-requested');
  observer.observe(slot.element);resizeObserver.observe(slot.element);
}

function initialize(){
  const slots=window.MOVX3D?.slots||{};
  Object.entries(slots).forEach(([name,slot])=>{if(slot?.element)register(name,slot)});
  root.dataset.v322Glb='ready';
  root.dataset.v322Requested=String(Object.keys(runtime.instances).length);
  root.dataset.v347ActiveModels=String(Object.keys(runtime.instances).length);
}
initialize();

let raf=0;
function frame(t){
  raf=requestAnimationFrame(frame);
  for(const instance of Object.values(runtime.instances)){
    if(!instance.visible||!instance.renderer||!instance.scene)continue;
    resize(instance);instance.lastSeen=t;
    const px=parseFloat(getComputedStyle(root).getPropertyValue('--crt-px'))||0;
    const py=parseFloat(getComputedStyle(root).getPropertyValue('--crt-py'))||0;
    if(!reduced){
      instance.group.rotation.y=px*.055;
      instance.group.rotation.x=-py*.035;
    }
    instance.renderer.render(instance.scene,instance.camera);
  }
}
raf=requestAnimationFrame(frame);

addEventListener('pagehide',()=>{
  cancelAnimationFrame(raf);observer.disconnect();resizeObserver.disconnect();
  for(const instance of Object.values(runtime.instances)){removeRenderer(instance,{restore:false});disposeObject(instance.model)}
},{once:true});
