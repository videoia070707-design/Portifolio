/* MOVX v106 — dimensional motion runtime
   Progressive 3D/2D enhancement. DOM content remains the source of truth. */

const root=document.documentElement;
const body=document.body;
const q=(s,c=document)=>c.querySelector(s);
const qa=(s,c=document)=>[...c.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smoothstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const reduceQuery=new URLSearchParams(location.search).has('static');
const reduceMedia=matchMedia('(prefers-reduced-motion: reduce)');
const reduced=reduceQuery||reduceMedia.matches||root.dataset.movxReducedMotion==='true';
const coarse=matchMedia('(pointer:coarse)').matches;
const narrow=matchMedia('(max-width:720px)').matches;

root.classList.add('movx-v106');
root.dataset.movxV106='dimensional-motion';
if(reduced)root.classList.add('v106-reduced');

function makeSculpture(className='v106-page-sculpture'){
  const el=document.createElement('div');
  el.className=className;
  el.setAttribute('aria-hidden','true');
  for(let i=0;i<4;i++){
    const plane=document.createElement('i');
    plane.className=className==='v106-page-sculpture'?'v106-page-sculpture__plane':'v106-chapter-sculpture__plane';
    el.appendChild(plane);
  }
  return el;
}

function setupDomDepth(){
  const hero=q('.page-hero');
  if(hero&&!q('.v106-page-sculpture',hero))hero.appendChild(makeSculpture());

  if(body?.dataset.page==='social'){
    const heroStage=q('.social-cover-art__stage');
    if(heroStage&&!q('.v106-hero-atmosphere',heroStage)){
      const atmosphere=document.createElement('div');
      atmosphere.className='v106-hero-atmosphere';
      atmosphere.setAttribute('aria-hidden','true');
      heroStage.appendChild(atmosphere);
    }
    ['#services','#process','#contact'].forEach(selector=>{
      const section=q(selector);
      if(!section)return;
      section.classList.add('v106-depth-host');
      if(!q(':scope > .v106-chapter-sculpture',section))section.appendChild(makeSculpture('v106-chapter-sculpture'));
    });
  }
}
setupDomDepth();

const tracked=()=>qa('.page-hero,.v106-depth-host,.social-cover-art__stage');
let scrollRaf=0;
function sectionProgress(el){
  const r=el.getBoundingClientRect();
  return clamp((innerHeight-r.top)/(innerHeight+r.height),0,1);
}
function syncDepth(){
  scrollRaf=0;
  tracked().forEach(el=>{
    const p=sectionProgress(el);
    el.style.setProperty('--v106-progress',p.toFixed(4));
    const sculpture=q(':scope > .v106-page-sculpture,:scope > .v106-chapter-sculpture',el);
    if(sculpture)sculpture.style.setProperty('--v106-progress',p.toFixed(4));
  });
}
function scheduleDepth(){if(!scrollRaf)scrollRaf=requestAnimationFrame(syncDepth);}
window.MOVX_MOTION_BRIDGE?.subscribe?.(syncDepth);
addEventListener('scroll',scheduleDepth,{passive:true});
addEventListener('resize',scheduleDepth,{passive:true});
syncDepth();

if('IntersectionObserver'in window){
  const io=new IntersectionObserver(entries=>{
    entries.forEach(entry=>entry.target.classList.toggle('v106-section-active',entry.isIntersecting));
  },{threshold:.18,rootMargin:'-8% 0px -8% 0px'});
  qa('.v106-depth-host').forEach(el=>io.observe(el));
}

function bindPointer(host){
  if(!host||coarse||reduced)return;
  const targets=qa('.v106-page-sculpture,.v106-chapter-sculpture',host);
  if(!targets.length)return;
  let px=0,py=0,tx=0,ty=0,raf=0;
  const tick=()=>{
    raf=0;
    px+=(tx-px)*.09;py+=(ty-py)*.09;
    targets.forEach(el=>{el.style.setProperty('--v106-px',px.toFixed(3));el.style.setProperty('--v106-py',py.toFixed(3));});
    if(Math.abs(tx-px)>.005||Math.abs(ty-py)>.005)raf=requestAnimationFrame(tick);
  };
  host.addEventListener('pointermove',e=>{
    const r=host.getBoundingClientRect();
    tx=clamp((e.clientX-r.left)/Math.max(r.width,1)*2-1,-1,1);
    ty=clamp((e.clientY-r.top)/Math.max(r.height,1)*2-1,-1,1);
    if(!raf)raf=requestAnimationFrame(tick);
  },{passive:true});
  host.addEventListener('pointerleave',()=>{tx=0;ty=0;if(!raf)raf=requestAnimationFrame(tick);},{passive:true});
}
bindPointer(q('.page-hero'));
bindPointer(q('.social-cover-art__stage'));
qa('.v106-depth-host').forEach(bindPointer);

async function initHeroWebGL(){
  if(body?.dataset.page!=='social')return;
  const host=q('.social-cover-art__stage');
  if(!host)return;
  if(reduced||narrow){root.dataset.v106Webgl=reduced?'reduced':'mobile-fallback';return;}

  const stage=document.createElement('div');
  stage.className='v106-webgl-stage';
  stage.setAttribute('aria-hidden','true');
  const canvas=document.createElement('canvas');
  stage.appendChild(canvas);
  host.appendChild(stage);
  root.dataset.v106Webgl='loading';

  let THREE;
  try{
    THREE=await import('./vendor/three.module.min.js');
  }catch(error){
    console.warn('[MOVX v106] Three.js unavailable; using CSS depth fallback.',error);
    root.dataset.v106Webgl='fallback';
    stage.remove();
    return;
  }

  let renderer;
  try{
    renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:!coarse,powerPreference:'high-performance'});
  }catch(error){
    console.warn('[MOVX v106] WebGL renderer unavailable; using CSS depth fallback.',error);
    root.dataset.v106Webgl='fallback';
    stage.remove();
    return;
  }
  renderer.setClearColor(0x000000,0);
  if('outputColorSpace'in renderer&&THREE.SRGBColorSpace)renderer.outputColorSpace=THREE.SRGBColorSpace;

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(34,1,.1,50);
  camera.position.set(0,0,8.2);

  const group=new THREE.Group();
  group.position.set(1.42,.12,0);
  scene.add(group);

  const accent=0xe66c5d;
  const cream=0xf0e8dc;
  const graphite=0x161515;
  const matCream=new THREE.MeshStandardMaterial({color:cream,roughness:.72,metalness:.06,transparent:true,opacity:.9});
  const matDark=new THREE.MeshStandardMaterial({color:graphite,roughness:.64,metalness:.12,transparent:true,opacity:.92});
  const matAccent=new THREE.MeshStandardMaterial({color:accent,roughness:.58,metalness:.09,transparent:true,opacity:.8});
  const lineMat=new THREE.LineBasicMaterial({color:cream,transparent:true,opacity:.38});
  const accentLine=new THREE.LineBasicMaterial({color:accent,transparent:true,opacity:.62});

  const makePlate=(w,h,d,material)=>{
    const geo=new THREE.BoxGeometry(w,h,d,1,1,1);
    const mesh=new THREE.Mesh(geo,material);
    const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geo),material===matAccent?accentLine:lineMat);
    mesh.add(edges);
    return mesh;
  };

  const rear=makePlate(3.55,2.16,.055,matDark);
  rear.position.set(-.18,.12,-.62);rear.rotation.z=-.14;
  const paper=makePlate(3.08,1.84,.065,matCream);
  paper.position.set(.28,-.08,.02);paper.rotation.z=.105;
  const blade=makePlate(1.16,2.7,.085,matAccent);
  blade.position.set(1.12,.02,.66);blade.rotation.z=.42;
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.44,.025,8,80),new THREE.MeshBasicMaterial({color:cream,transparent:true,opacity:.42}));
  ring.position.set(-.76,.1,.94);ring.rotation.x=1.12;ring.rotation.y=.32;
  const accentRing=new THREE.Mesh(new THREE.TorusGeometry(.78,.018,6,64),new THREE.MeshBasicMaterial({color:accent,transparent:true,opacity:.72}));
  accentRing.position.set(.78,-.34,1.18);accentRing.rotation.x=.76;accentRing.rotation.y=-.52;

  group.add(rear,paper,blade,ring,accentRing);
  scene.add(new THREE.AmbientLight(0xffffff,1.22));
  const key=new THREE.DirectionalLight(0xffffff,2.2);key.position.set(3,4,6);scene.add(key);
  const rim=new THREE.DirectionalLight(accent,1.05);rim.position.set(-4,-2,2);scene.add(rim);

  let visible=true,raf=0,last=performance.now();
  let progress=0,targetProgress=0,pointerX=0,pointerY=0,targetX=0,targetY=0;

  function resize(){
    const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);
    const rawDpr=Math.min(devicePixelRatio||1,coarse?1.05:1.4);
    const maxPixels=coarse?900000:1850000;
    let bw=Math.max(1,Math.floor(w*rawDpr)),bh=Math.max(1,Math.floor(h*rawDpr));
    const pixels=bw*bh;
    if(pixels>maxPixels){const s=Math.sqrt(maxPixels/pixels);bw=Math.floor(bw*s);bh=Math.floor(bh*s);}
    renderer.setSize(bw,bh,false);
    camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  resize();

  function targetFromScroll(){
    const r=host.getBoundingClientRect();
    targetProgress=clamp(-r.top/Math.max(r.height,1),0,1);
    host.style.setProperty('--v106-progress',targetProgress.toFixed(4));
  }
  targetFromScroll();

  if(!coarse){
    host.addEventListener('pointermove',e=>{
      const r=host.getBoundingClientRect();
      targetX=clamp((e.clientX-r.left)/Math.max(r.width,1)*2-1,-1,1);
      targetY=clamp((e.clientY-r.top)/Math.max(r.height,1)*2-1,-1,1);
      start();
    },{passive:true});
    host.addEventListener('pointerleave',()=>{targetX=0;targetY=0;start();},{passive:true});
  }

  function render(now){
    raf=0;
    if(!visible||document.hidden)return;
    const dt=Math.min((now-last)/16.667,2.2);last=now;
    progress=lerp(progress,targetProgress,1-Math.pow(.87,dt));
    pointerX=lerp(pointerX,targetX,1-Math.pow(.86,dt));
    pointerY=lerp(pointerY,targetY,1-Math.pow(.86,dt));

    const split=smoothstep(.05,.78,progress);
    group.rotation.x=.08+progress*.32-pointerY*.055;
    group.rotation.y=-.34+progress*.98+pointerX*.14;
    group.rotation.z=-.035+progress*.12;
    group.position.x=1.42-progress*.38;
    group.position.y=.12+progress*.26;
    group.scale.setScalar(1-progress*.055);

    rear.position.z=-.62-split*.42;
    paper.position.z=.02+split*.34;
    blade.position.z=.66+split*.86;
    blade.rotation.y=-.08+split*.42;
    ring.rotation.z=progress*1.6;
    accentRing.rotation.z=-progress*2.1;
    camera.position.z=8.2-progress*.42;

    const fade=1-smoothstep(.74,1,progress);
    stage.style.opacity=String(.96*fade);
    renderer.render(scene,camera);

    const unsettled=Math.abs(progress-targetProgress)>.001||Math.abs(pointerX-targetX)>.002||Math.abs(pointerY-targetY)>.002;
    if(unsettled)start();
  }
  function start(){if(!raf)raf=requestAnimationFrame(render);}

  const observer='IntersectionObserver'in window?new IntersectionObserver(entries=>{
    visible=entries.some(entry=>entry.isIntersecting);
    if(visible){last=performance.now();start();}
  },{rootMargin:'15% 0px'}):null;
  observer?.observe(host);

  const onScroll=()=>{targetFromScroll();if(visible)start();};
  const onResize=()=>{resize();targetFromScroll();if(visible)start();};
  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',onResize,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&visible){last=performance.now();start();}});

  function dispose(){
    observer?.disconnect();
    cancelAnimationFrame(raf);
    [rear,paper,blade].forEach(mesh=>{mesh.geometry.dispose();mesh.children.forEach(child=>child.geometry?.dispose?.());});
    ring.geometry.dispose();accentRing.geometry.dispose();
    [matCream,matDark,matAccent,lineMat,accentLine,ring.material,accentRing.material].forEach(material=>material?.dispose?.());
    renderer.dispose();
    removeEventListener('scroll',onScroll);removeEventListener('resize',onResize);
  }
  addEventListener('pagehide',dispose,{once:true});

  root.dataset.v106Webgl='ready';
  start();
}

initHeroWebGL();
