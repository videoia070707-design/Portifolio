/* MOVX v108 — institutional depth runtime
   About/Services/Contact use DOM 3D layers; Process gets one real Three.js corridor.
   Scroll is the input. Semantic copy remains the source of truth. */

const root=document.documentElement;
const body=document.body;
const q=(s,c=document)=>c.querySelector(s);
const qa=(s,c=document)=>[...c.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const reduced=new URLSearchParams(location.search).has('static')||matchMedia('(prefers-reduced-motion: reduce)').matches||root.dataset.movxReducedMotion==='true';
const desktop=matchMedia('(min-width:981px)').matches;
const coarse=matchMedia('(pointer:coarse)').matches;

root.classList.add('movx-v108');
root.dataset.movxV108='institutional-depth';
if(reduced)root.classList.add('v108-reduced');

if(body?.dataset.page!=='social'){
  root.dataset.v108Webgl='not-applicable';
}else{
  setupInstitutionalLayers();
  setupScrollDepth();
  initProcessWorld();
}

function sectionProgress(el){
  if(!el)return 0;
  const r=el.getBoundingClientRect();
  return clamp((innerHeight-r.top)/(innerHeight+r.height),0,1);
}

function makeAboutDepth(){
  const section=q('#about');
  if(!section||q('.v108-about-depth',section))return;
  const layer=document.createElement('div');
  layer.className='v108-about-depth';
  layer.setAttribute('aria-hidden','true');
  layer.innerHTML='<div class="v108-about-depth__word">MOVX</div><div class="v108-about-depth__slab"></div><div class="v108-about-depth__ring"></div>';
  section.prepend(layer);
}

function makeServicesDepth(){
  const section=q('#services');
  if(!section||q('.v108-services-depth',section))return;
  const rows=qa('.service-row',section);
  if(!rows.length)return;
  const layer=document.createElement('div');
  layer.className='v108-services-depth';
  layer.setAttribute('aria-hidden','true');
  rows.forEach((_,index)=>{
    const n=document.createElement('span');
    n.className='v108-services-depth__index';
    n.textContent=String(index+1).padStart(2,'0');
    layer.appendChild(n);
  });
  section.prepend(layer);
}

function makeContactDepth(){
  const section=q('#contact');
  if(!section||q('.v108-contact-depth',section))return;
  const layer=document.createElement('div');
  layer.className='v108-contact-depth';
  layer.setAttribute('aria-hidden','true');
  layer.innerHTML='<div class="v108-contact-depth__x"></div>';
  section.prepend(layer);
}

function ensureJourney(){
  const process=q('#process.process-section');
  if(!process)return null;
  let journey=q('.v55-process-journey',process);
  let grid=q('.container.process-grid',process);
  if(!grid)return null;
  if(!journey){
    journey=document.createElement('div');
    journey.className='v55-process-journey v108-owned-journey';
    process.insertBefore(journey,grid);
    journey.appendChild(grid);
  }
  return {process,journey,grid};
}

function setupInstitutionalLayers(){
  makeAboutDepth();makeServicesDepth();makeContactDepth();
}

function setupScrollDepth(){
  const about=q('#about');
  const services=q('#services');
  const serviceRows=services?qa('.service-row',services):[];
  const serviceNumbers=services?qa('.v108-services-depth__index',services):[];
  const contact=q('#contact');
  let raf=0;

  const sync=()=>{
    raf=0;
    if(about)about.style.setProperty('--v108-about-progress',sectionProgress(about).toFixed(4));
    if(contact)contact.style.setProperty('--v108-contact-progress',sectionProgress(contact).toFixed(4));
    if(services&&serviceNumbers.length){
      const p=sectionProgress(services);
      const active=p*(serviceNumbers.length-1);
      const nearest=Math.round(active);
      services.style.setProperty('--v108-services-progress',p.toFixed(4));
      serviceNumbers.forEach((el,index)=>{
        const d=index-active;
        const ad=Math.abs(d);
        const z=110-ad*330;
        const y=d*145;
        const ry=d*-12;
        const s=Math.max(.62,1-ad*.14);
        const o=clamp(.62-ad*.26,.055,.62);
        el.style.setProperty('--v108-service-z',`${z.toFixed(1)}px`);
        el.style.setProperty('--v108-service-y',`${y.toFixed(1)}px`);
        el.style.setProperty('--v108-service-ry',`${ry.toFixed(1)}deg`);
        el.style.setProperty('--v108-service-s',s.toFixed(3));
        el.style.setProperty('--v108-service-o',o.toFixed(3));
        el.classList.toggle('is-near',index===nearest);
      });
      serviceRows.forEach((row,index)=>row.classList.toggle('v108-service-active',index===nearest));
    }
  };
  const schedule=()=>{if(!raf)raf=requestAnimationFrame(sync);};
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  window.MOVX_MOTION_BRIDGE?.subscribe?.(sync);
  sync();
}

async function initProcessWorld(){
  const built=ensureJourney();
  if(!built){root.dataset.v108Webgl='missing-process';return;}
  const {process,journey,grid}=built;
  const rows=qa('.process-list li',grid).slice(0,5);
  if(rows.length<3){root.dataset.v108Webgl='missing-steps';return;}

  rows.forEach((row,index)=>row.dataset.v108Step=String(index+1));

  const canvas=document.createElement('canvas');
  canvas.className='v108-process-canvas';
  canvas.setAttribute('aria-hidden','true');
  const atmosphere=document.createElement('div');
  atmosphere.className='v108-process-atmosphere';
  atmosphere.setAttribute('aria-hidden','true');
  journey.prepend(atmosphere);
  journey.prepend(canvas);

  const progressHud=document.createElement('div');
  progressHud.className='v108-process-progress';
  progressHud.setAttribute('aria-hidden','true');
  progressHud.innerHTML='<span>PROCESS</span><i></i><b>01 / 05</b>';
  grid.appendChild(progressHud);

  const processProgress=()=>{
    const r=journey.getBoundingClientRect();
    const travel=Math.max(1,r.height-innerHeight);
    return clamp(-r.top/travel,0,1);
  };

  let domRaf=0;
  const syncRows=()=>{
    domRaf=0;
    const p=processProgress();
    const stepFloat=p*(rows.length-1);
    const active=Math.round(stepFloat);
    journey.style.setProperty('--v108-process-progress',p.toFixed(4));
    progressHud.style.setProperty('--v108-process-progress',p.toFixed(4));
    const label=q('b',progressHud);if(label)label.textContent=`${String(active+1).padStart(2,'0')} / ${String(rows.length).padStart(2,'0')}`;
    rows.forEach((row,index)=>{
      const d=index-stepFloat;
      const ad=Math.abs(d);
      const o=clamp(1-ad*.92,.035,1);
      const y=d*118;
      const z=-ad*330;
      const x=d*16;
      const rx=d*-3.2;
      const s=clamp(1-ad*.10,.76,1);
      row.style.setProperty('--v108-row-o',o.toFixed(3));
      row.style.setProperty('--v108-row-y',`${y.toFixed(1)}px`);
      row.style.setProperty('--v108-row-z',`${z.toFixed(1)}px`);
      row.style.setProperty('--v108-row-x',`${x.toFixed(1)}px`);
      row.style.setProperty('--v108-row-rx',`${rx.toFixed(1)}deg`);
      row.style.setProperty('--v108-row-s',s.toFixed(3));
      row.classList.toggle('v108-process-active',index===active);
    });
    root.dataset.movxProcessStep=String(active+1);
  };
  const scheduleRows=()=>{if(!domRaf)domRaf=requestAnimationFrame(syncRows);};
  addEventListener('scroll',scheduleRows,{passive:true});
  addEventListener('resize',scheduleRows,{passive:true});
  syncRows();

  if(reduced||!desktop){
    root.dataset.v108Webgl=reduced?'reduced':'mobile-fallback';
    return;
  }

  let THREE;
  try{THREE=await import('./vendor/three.module.min.js');}
  catch(error){console.warn('[MOVX v108] Three.js unavailable; process keeps DOM fallback.',error);root.dataset.v108Webgl='fallback';return;}

  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:!coarse,powerPreference:'high-performance'});}
  catch(error){console.warn('[MOVX v108] WebGL unavailable; process keeps DOM fallback.',error);root.dataset.v108Webgl='fallback';return;}
  renderer.setClearColor(0x000000,0);
  if('outputColorSpace'in renderer&&THREE.SRGBColorSpace)renderer.outputColorSpace=THREE.SRGBColorSpace;

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(42,1,.1,90);
  camera.position.set(0,.1,8.5);
  const world=new THREE.Group();
  scene.add(world);

  const style=getComputedStyle(root);
  const cssValue=(name,fallback)=>style.getPropertyValue(name).trim()||fallback;
  const bgColor=new THREE.Color(cssValue('--bg','#0b0908'));
  const fgColor=new THREE.Color(cssValue('--fg','#efe9e2'));
  const accentColor=new THREE.Color(cssValue('--editorial-red','#df6a5b'));
  scene.fog=new THREE.Fog(bgColor,8,30);

  const lineMaterial=new THREE.LineBasicMaterial({color:fgColor,transparent:true,opacity:.20});
  const accentLineMaterial=new THREE.LineBasicMaterial({color:accentColor,transparent:true,opacity:.62});
  const plateMaterial=new THREE.MeshStandardMaterial({color:fgColor,roughness:.52,metalness:.18,transparent:true,opacity:.15});
  const accentMaterial=new THREE.MeshStandardMaterial({color:accentColor,roughness:.38,metalness:.26,transparent:true,opacity:.82});
  const darkMaterial=new THREE.MeshStandardMaterial({color:bgColor.clone().lerp(fgColor,.13),roughness:.62,metalness:.20,transparent:true,opacity:.84});

  const stations=[];
  const zGap=8;
  const makeRod=(w,h,d,material)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);

  for(let i=0;i<rows.length;i++){
    const station=new THREE.Group();
    station.position.set((i%2?-.55:.55),((i%3)-1)*.12,-i*zGap);
    station.rotation.y=(i%2?-.08:.08);

    const frameGeo=new THREE.BoxGeometry(5.9,3.45,.08);
    const frameEdges=new THREE.LineSegments(new THREE.EdgesGeometry(frameGeo),i===2?accentLineMaterial:lineMaterial);
    station.add(frameEdges);

    const plate=makeRod(1.28,2.45,.16,i===2?accentMaterial:darkMaterial);
    plate.position.set(i%2?-2.1:2.1,0,.25);
    plate.rotation.z=i%2?.08:-.08;
    station.add(plate);

    const blade=makeRod(.16,2.8,.18,accentMaterial);
    blade.position.set(i%2?1.74:-1.74,.05,.62);
    blade.rotation.z=(i-2)*.055;
    station.add(blade);

    const ring=new THREE.Mesh(
      new THREE.TorusGeometry(1.02+.08*i,.018,8,64),
      new THREE.MeshBasicMaterial({color:i===2?accentColor:fgColor,transparent:true,opacity:i===2?.52:.20})
    );
    ring.position.set(i%2?.65:-.65,.12,.92);
    ring.rotation.x=.92+(i%2?.10:-.08);
    ring.rotation.y=(i-2)*.10;
    station.add(ring);

    const railLeft=makeRod(.035,5.4,.035,plateMaterial);railLeft.position.set(-3.35,0,-1.2);station.add(railLeft);
    const railRight=makeRod(.035,5.4,.035,plateMaterial);railRight.position.set(3.35,0,-1.2);station.add(railRight);

    station.userData={plate,blade,ring,frameEdges,index:i};
    world.add(station);stations.push(station);
  }

  const vanishing=new THREE.Mesh(
    new THREE.TorusGeometry(4.8,.025,8,96),
    new THREE.MeshBasicMaterial({color:accentColor,transparent:true,opacity:.16})
  );
  vanishing.position.z=-rows.length*zGap-3;
  vanishing.rotation.x=1.18;
  world.add(vanishing);

  scene.add(new THREE.HemisphereLight(0xffffff,0x111111,1.45));
  const key=new THREE.DirectionalLight(0xffffff,1.85);key.position.set(4,5,6);scene.add(key);
  const rim=new THREE.DirectionalLight(accentColor,1.35);rim.position.set(-4,-1,3);scene.add(rim);

  let targetP=processProgress(),p=targetP;
  let pointerX=0,pointerY=0,targetX=0,targetY=0;
  let velocity=0,lastTarget=targetP;
  let visible=true,raf=0,last=performance.now();

  function resize(){
    const w=Math.max(1,journey.clientWidth),h=Math.max(1,innerHeight);
    const raw=Math.min(devicePixelRatio||1,coarse?1.05:1.35);
    const maxPixels=1750000;
    let bw=Math.floor(w*raw),bh=Math.floor(h*raw);
    const pixels=bw*bh;
    if(pixels>maxPixels){const s=Math.sqrt(maxPixels/pixels);bw=Math.floor(bw*s);bh=Math.floor(bh*s);}
    renderer.setSize(Math.max(1,bw),Math.max(1,bh),false);
    camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  resize();

  function syncTheme(){
    const current=getComputedStyle(root);
    const bg=new THREE.Color(current.getPropertyValue('--bg').trim()||'#0b0908');
    const fg=new THREE.Color(current.getPropertyValue('--fg').trim()||'#efe9e2');
    const ac=new THREE.Color(current.getPropertyValue('--editorial-red').trim()||'#df6a5b');
    scene.fog.color.copy(bg);
    lineMaterial.color.copy(fg);accentLineMaterial.color.copy(ac);plateMaterial.color.copy(fg);accentMaterial.color.copy(ac);
    darkMaterial.color.copy(bg.clone().lerp(fg,.13));
  }
  const themeObserver=new MutationObserver(syncTheme);
  themeObserver.observe(root,{attributes:true,attributeFilter:['data-theme']});

  function update(progress){
    const cameraTravel=(rows.length-1)*zGap;
    camera.position.z=8.5-progress*cameraTravel;
    camera.position.x=Math.sin(progress*Math.PI*1.35)*.48+pointerX*.16;
    camera.position.y=.08+Math.sin(progress*Math.PI*2)*.18-pointerY*.12;
    camera.rotation.z=clamp(velocity*-.55,-.045,.045);
    camera.rotation.y=pointerX*.018;

    const focusZ=camera.position.z-7.2;
    stations.forEach((station,index)=>{
      const dz=Math.abs(station.position.z-focusZ);
      const near=clamp(1-dz/10,0,1);
      station.rotation.y=(index%2?-.08:.08)+(progress-.5)*.035+pointerX*.018;
      station.rotation.x=(index-2)*.006-pointerY*.012;
      station.userData.plate.rotation.y=(index%2?-1:1)*near*.22;
      station.userData.blade.position.z=.62+near*.72;
      station.userData.ring.rotation.z=progress*(index%2?-2.2:2.2)+index*.3;
      station.userData.frameEdges.material.opacity=.12+near*.30;
    });
    vanishing.rotation.z=progress*1.8;
    vanishing.scale.setScalar(.9+progress*.22);

    const edgeFade=1-smooth(.93,1,progress);
    canvas.style.opacity=String(.96*edgeFade);
    journey.style.setProperty('--v108-process-canvas-o',String(.96*edgeFade));
    renderer.render(scene,camera);
  }

  function tick(now){
    raf=0;if(!visible||document.hidden)return;
    const dt=Math.min((now-last)/16.667,2.2);last=now;
    p=lerp(p,targetP,1-Math.pow(.82,dt));
    pointerX=lerp(pointerX,targetX,1-Math.pow(.84,dt));
    pointerY=lerp(pointerY,targetY,1-Math.pow(.84,dt));
    velocity=lerp(velocity,targetP-lastTarget,.22);lastTarget=targetP;
    update(p);
    if(Math.abs(p-targetP)>.0007||Math.abs(pointerX-targetX)>.0015||Math.abs(pointerY-targetY)>.0015||Math.abs(velocity)>.0002)start();
  }
  function start(){if(!raf)raf=requestAnimationFrame(tick);}
  function onScroll(){targetP=processProgress();scheduleRows();start();}
  function onResize(){resize();targetP=processProgress();scheduleRows();start();}

  if(!coarse){
    process.addEventListener('pointermove',e=>{
      const r=process.getBoundingClientRect();
      targetX=clamp((e.clientX-r.left)/Math.max(r.width,1)*2-1,-1,1);
      targetY=clamp((e.clientY-r.top)/Math.max(innerHeight,1)*2-1,-1,1);
      journey.style.setProperty('--v108-pointer-x',targetX.toFixed(3));
      journey.style.setProperty('--v108-pointer-y',targetY.toFixed(3));
      start();
    },{passive:true});
    process.addEventListener('pointerleave',()=>{targetX=0;targetY=0;start();},{passive:true});
  }

  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',onResize,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&visible){last=performance.now();start();}});

  const observer=new IntersectionObserver(entries=>{
    visible=entries.some(entry=>entry.isIntersecting);
    if(visible){last=performance.now();start();}
  },{rootMargin:'18% 0px'});
  observer.observe(process);

  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();root.dataset.v108Webgl='context-lost';canvas.style.display='none';},{passive:false});

  function dispose(){
    observer.disconnect();themeObserver.disconnect();cancelAnimationFrame(raf);
    world.traverse(obj=>{obj.geometry?.dispose?.();if(obj.material){if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose?.());else obj.material.dispose?.();}});
    renderer.dispose();
    removeEventListener('scroll',onScroll);removeEventListener('resize',onResize);
  }
  addEventListener('pagehide',dispose,{once:true});

  update(p);renderer.render(scene,camera);
  root.dataset.v108Webgl='ready';
  start();
}
