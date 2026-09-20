/* MOVX v54 — native-scroll artwork portal
   The closest artwork from the archive sequence becomes a full-viewport wall.
   Native scroll progress punches a portal through it while a real Three.js Process corridor resolves behind. */
import * as THREE from './vendor/three.module.min.js';

const root=document.documentElement;
root.classList.add('movx-v54');
root.dataset.movxArtworkPortal='v54-native';
const reduced=new URLSearchParams(location.search).has('static')||matchMedia('(prefers-reduced-motion: reduce)').matches;
const desktop=matchMedia('(min-width:981px)').matches;
const fine=matchMedia('(pointer:fine)').matches;
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);

function escapeHTML(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function chosenProject(){
  const all=Array.isArray(window.MOVX_PROJECTS)?window.MOVX_PROJECTS:[];
  return all.find(p=>p.slug==='motionhub')||all.find(p=>p.slug==='voltara-operacoes')||all[0]||null;
}
function stepsFrom(process){
  return [...process.querySelectorAll('.process-list li')].slice(0,5).map((row,index)=>({
    index,
    title:row.querySelector('strong')?.textContent?.trim()||`Etapa ${index+1}`,
    body:row.querySelector('p')?.textContent?.trim()||''
  }));
}
function buildSequence(process,project,steps){
  if(process.querySelector('.v54-portal-sequence')) return process.querySelector('.v54-portal-sequence');
  const first=steps[0]||{title:'Diagnóstico',body:''};
  const section=document.createElement('div');
  section.className='v54-portal-sequence';
  section.innerHTML=`<div class="v54-portal-sticky">
    <div class="v54-process-space" aria-hidden="true">
      <div class="v54-process-space__eyebrow">PROCESSO / 01</div>
      <div class="v54-process-space__title">Processo</div>
      <div class="v54-process-space__step"><span>01</span><strong>${escapeHTML(first.title)}</strong><p>${escapeHTML(first.body)}</p></div>
      <div class="v54-process-space__spine"></div>
    </div>
    <canvas class="v54-portal-canvas" aria-hidden="true"></canvas>
    <div class="v54-artwork-wall" aria-hidden="true"><img src="${escapeHTML(project.cover)}" alt=""></div>
    <div class="v54-portal-vignette" aria-hidden="true"></div>
    <div class="v54-portal-meta" aria-hidden="true"><span>ARTE</span><i></i><span>PROCESSO</span></div>
  </div>`;
  process.insertBefore(section,process.firstChild);
  process.classList.add('v54-portal-host');
  return section;
}
function makeTextTexture(text){
  const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=280;
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#f2ebe5';ctx.font='700 112px Arial';ctx.textBaseline='middle';ctx.fillText(String(text).toUpperCase(),38,canvas.height/2);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;return texture;
}
function makeGate(scene,label,index){
  const group=new THREE.Group();scene.add(group);
  const lineMat=new THREE.LineBasicMaterial({color:0x9f948d,transparent:true,opacity:0});
  const accentMat=new THREE.LineBasicMaterial({color:0xb84434,transparent:true,opacity:0});
  const framePts=[-3.0,-1.72,0,3.0,-1.72,0,3.0,-1.72,0,3.0,1.72,0,3.0,1.72,0,-3.0,1.72,0,-3.0,1.72,0,-3.0,-1.72,0];
  const frameGeom=new THREE.BufferGeometry();frameGeom.setAttribute('position',new THREE.Float32BufferAttribute(framePts,3));group.add(new THREE.LineSegments(frameGeom,lineMat));
  const accentGeom=new THREE.BufferGeometry();accentGeom.setAttribute('position',new THREE.Float32BufferAttribute([-3,1.72,.02,-1.72,1.72,.02,-3,-1.72,.02,-3,-.42,.02],3));group.add(new THREE.LineSegments(accentGeom,accentMat));
  const texture=makeTextTexture(`${String(index+1).padStart(2,'0')}  ${label}`);
  const textMat=new THREE.MeshBasicMaterial({map:texture,color:root.getAttribute('data-theme')==='dark'?0xf2ebe5:0x2b2724,transparent:true,opacity:0,depthWrite:false});
  const text=new THREE.Mesh(new THREE.PlaneGeometry(5.0,.9),textMat);text.position.set(-.25,-1.27,.04);group.add(text);
  group.userData={lineMat,accentMat,textMat,index};
  return group;
}

function init(){
  const process=document.querySelector('#process.process-section')||document.querySelector('.process-section');
  const project=chosenProject();
  if(!process||!project) return;
  const steps=stepsFrom(process);
  const sequence=buildSequence(process,project,steps);
  const wall=sequence.querySelector('.v54-artwork-wall');
  const realContainer=process.querySelector(':scope > .container')||process.querySelector('.container');
  let renderer=null,scene=null,camera=null,gates=[],rails=[],railMat=null;
  let contextLost=false;

  if(desktop&&!reduced){
    const canvas=sequence.querySelector('.v54-portal-canvas');
    try{
      renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
      renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x000000,0);
      scene=new THREE.Scene();
      camera=new THREE.PerspectiveCamera(43,1,.1,70);camera.position.set(0,0,8.8);
      gates=steps.map((step,index)=>makeGate(scene,step.title,index));
      gates.forEach((gate,index)=>{gate.position.set(index%2?.72:-.52,(index-2)*.055,-2-index*3.15);gate.rotation.y=(index%2?-1:1)*.05;});
      railMat=new THREE.LineBasicMaterial({color:0x948983,transparent:true,opacity:0});
      rails=[-3.28,3.28].map(x=>{const geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,-2.2,.25),new THREE.Vector3(x,2.2,-17)]);const line=new THREE.Line(geometry,railMat);scene.add(line);return line;});
      canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;root.classList.add('v54-fallback');},{once:true});
    }catch(error){root.classList.add('v54-fallback');renderer=null;}
  }

  let target=0,current=0,lastY=scrollY,lastTime=performance.now(),velocity=0,pointerX=0,pointerY=0,targetPX=0,targetPY=0,raf=0,active=false;

  function progress(){
    const rect=sequence.getBoundingClientRect();
    const travel=Math.max(1,sequence.offsetHeight-innerHeight);
    return clamp(-rect.top/travel,0,1);
  }
  function resize(){
    if(renderer&&!contextLost){renderer.setSize(Math.max(1,innerWidth),Math.max(1,innerHeight),false);camera.aspect=Math.max(1,innerWidth)/Math.max(1,innerHeight);camera.updateProjectionMatrix();}
  }
  function setDom(p){
    const arrive=smooth(clamp((p-.02)/.22));
    const wallT=smooth(clamp((p-.19)/.29));
    const through=smooth(clamp((p-.52)/.27));
    const resolve=smooth(clamp((p-.77)/.21));
    const scale=lerp(.31,1.12,wallT);
    const rotateX=lerp(6.5,0,wallT)+pointerY*1.1*(1-through);
    const rotateY=lerp(-8.5,0,wallT)+pointerX*1.4*(1-through);
    const rotateZ=lerp(-1.8,0,wallT)+velocity*.12;
    sequence.style.setProperty('--v54-progress',String(p));
    sequence.style.setProperty('--v54-arrive',String(arrive));
    sequence.style.setProperty('--v54-wall',String(wallT));
    sequence.style.setProperty('--v54-through',String(through));
    sequence.style.setProperty('--v54-resolve',String(resolve));
    sequence.style.setProperty('--v54-scale',String(scale));
    sequence.style.setProperty('--v54-rx',`${rotateX}deg`);
    sequence.style.setProperty('--v54-ry',`${rotateY}deg`);
    sequence.style.setProperty('--v54-rz',`${rotateZ}deg`);
    sequence.style.setProperty('--v54-hole',`${through*50}%`);
    sequence.style.setProperty('--v54-wall-opacity',String(clamp(arrive*(1-resolve*.98))));
    if(realContainer){
      realContainer.style.setProperty('--v54-real-o',String(resolve));
      realContainer.style.setProperty('--v54-real-y',`${lerp(56,0,resolve)}px`);
      realContainer.style.setProperty('--v54-real-z',`${lerp(-130,0,resolve)}px`);
      realContainer.style.setProperty('--v54-real-rx',`${lerp(4.2,0,resolve)}deg`);
    }
    process.classList.toggle('v54-through',through>.12&&resolve<.98);
  }
  function setWebGL(p){
    if(!renderer||contextLost) return;
    const through=smooth(clamp((p-.52)/.27));
    const resolve=smooth(clamp((p-.77)/.21));
    const depth=smooth(clamp((p-.48)/.48));
    gates.forEach((gate,index)=>{
      const local=smooth(clamp((depth-index*.065)/Math.max(.001,1-index*.065)));
      const focus=clamp(1-Math.abs(depth-index/Math.max(1,gates.length-1))/.32,0,1);
      gate.userData.lineMat.opacity=(.025+local*.14+focus*.18)*through;
      gate.userData.accentMat.opacity=(.018+local*.18+focus*.21)*through;
      gate.userData.textMat.opacity=(.012+local*.12+focus*.25)*through;
      gate.scale.setScalar(.93+focus*.1);
    });
    railMat.opacity=.025+through*.18;
    rails.forEach((rail,index)=>rail.rotation.z=(index?1:-1)*velocity*.007);
    camera.position.x=pointerX*.14+velocity*.025;
    camera.position.y=-pointerY*.08;
    camera.position.z=8.8-through*.88-resolve*.28;
    camera.fov=43+Math.min(3.8,Math.abs(velocity)*1.7);camera.updateProjectionMatrix();
    camera.lookAt(0,-.04,lerp(-3.6,-6.4,depth));
    renderer.render(scene,camera);
  }
  function tick(){
    raf=0;
    if(!active||document.hidden) return;
    current=lerp(current,target,.16);
    pointerX=lerp(pointerX,targetPX,.09);pointerY=lerp(pointerY,targetPY,.09);
    velocity*=.84;
    setDom(current);setWebGL(current);
    if(Math.abs(current-target)>.0006||Math.abs(velocity)>.004||Math.abs(pointerX-targetPX)>.002||Math.abs(pointerY-targetPY)>.002)schedule();
  }
  function schedule(){if(!raf&&active&&!document.hidden)raf=requestAnimationFrame(tick);}
  function syncScroll(){
    const now=performance.now(),dy=scrollY-lastY,dt=Math.max(16,now-lastTime);
    lastY=scrollY;lastTime=now;velocity=clamp(dy/dt,-2.3,2.3);target=progress();schedule();
  }

  const observer=new IntersectionObserver(entries=>{
    active=entries.some(entry=>entry.isIntersecting);
    if(active){target=progress();resize();schedule();}else if(raf){cancelAnimationFrame(raf);raf=0;}
  },{rootMargin:'40% 0px 40% 0px',threshold:0});
  observer.observe(sequence);
  addEventListener('scroll',syncScroll,{passive:true});
  addEventListener('resize',()=>{resize();target=progress();schedule();},{passive:true});
  if(fine){sequence.addEventListener('pointermove',event=>{targetPX=clamp((event.clientX/Math.max(1,innerWidth)-.5)*2,-1,1);targetPY=clamp((event.clientY/Math.max(1,innerHeight)-.5)*2,-1,1);schedule();},{passive:true});sequence.addEventListener('pointerleave',()=>{targetPX=0;targetPY=0;schedule();},{passive:true});}
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&active){target=progress();schedule();}});
  new MutationObserver(mutations=>{if(renderer&&mutations.some(m=>m.attributeName==='data-theme')){gates.forEach(g=>g.userData.textMat.color.setHex(root.getAttribute('data-theme')==='dark'?0xf2ebe5:0x2b2724));schedule();}}).observe(root,{attributes:true,attributeFilter:['data-theme']});
  resize();target=progress();setDom(target);setWebGL(target);
}

try{init();}catch(error){root.classList.add('v54-fallback');console.warn('MOVX v54 portal failed open',error);}
