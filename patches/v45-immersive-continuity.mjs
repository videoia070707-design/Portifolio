/* MOVX v45 — immersive continuity runtime
   Three.js + GSAP ScrollTrigger. The lower chapters share one authored spatial language.
   Process camera progress is synchronized to real row geometry rather than guessed section percentages. */
import * as THREE from './vendor/three.module.min.js';

const root = document.documentElement;
root.classList.add('movx-v42','movx-v45');
root.dataset.movxBuild = 'v45-immersive';
root.dataset.movxImmersive = 'three-scrolltrigger-v45';

const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
const desktop = matchMedia('(min-width:981px)').matches;
const finePointer = matchMedia('(pointer:fine)').matches;
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const q = (s,c=document) => c.querySelector(s);
const qa = (s,c=document) => [...c.querySelectorAll(s)];
const clamp = (v,a=0,b=1) => Math.min(b,Math.max(a,v));
const lerp = (a,b,t) => a+(b-a)*t;

if (!gsap || !ScrollTrigger) {
  root.classList.add('v45-dependency-fallback');
  console.warn('MOVX v45: GSAP/ScrollTrigger unavailable; editorial fallback kept.');
} else {
  gsap.registerPlugin(ScrollTrigger);
}

function removeOlderStages(){
  qa('.v42-parallax-layer,.v43-depth-stage,.v43-process-stage,.v43-journey-meter,.v44-css-stage,.v44-process-stage').forEach(n=>n.remove());
}

function makeStage(section,className){
  if (!section) return null;
  const stage = document.createElement('div');
  stage.className = `v45-css-stage ${className}`;
  stage.setAttribute('aria-hidden','true');
  section.insertBefore(stage,section.firstChild);
  return stage;
}

function buildAbout(){
  const section=q('.about-section');
  if(!section) return;
  const stage=makeStage(section,'v45-about-stage');
  const word=document.createElement('div');
  word.className='v45-word v45-about-word';
  word.textContent=q('h2',section)?.textContent?.replace(/\s+/g,' ').trim()||'Sobre';
  const brand=document.createElement('div');
  brand.className='v45-about-brand';
  brand.textContent='MOVX';
  const axis=document.createElement('div');
  axis.className='v45-axis';
  stage.append(word,brand,axis);
  if(!gsap||!ScrollTrigger||reduced) return;
  const tl=gsap.timeline({scrollTrigger:{trigger:section,start:'top bottom',end:'bottom top',scrub:1.08,invalidateOnRefresh:true}});
  tl.fromTo(word,{xPercent:-50,yPercent:-50,x:-170,y:170,z:-620,rotationZ:-4.5,scale:.78,opacity:.08},{x:150,y:-180,z:150,rotationZ:2.5,scale:1.18,opacity:.7,ease:'none'},0)
    .fromTo(brand,{x:-140,y:100,z:-220,rotation:-2.5,opacity:.03},{x:110,y:-120,z:170,rotation:1.5,opacity:.2,ease:'none'},0)
    .fromTo(axis,{xPercent:-50,yPercent:-50,x:-220,y:90,z:130,rotation:-2.2,opacity:.12},{x:210,y:-100,z:230,rotation:2.1,opacity:.7,ease:'none'},0);
}

function buildServices(){
  const section=q('.services-section');
  const rows=section?qa('.service-row',section):[];
  if(!section||!rows.length) return;
  const stage=makeStage(section,'v45-services-stage');
  const list=q('.services-list',section);
  rows.forEach((row,index)=>{
    const marker=document.createElement('div');
    marker.className='v45-service-marker';
    const title=q('h3',row)?.textContent?.trim()||'';
    marker.innerHTML=`<b>${String(index+1).padStart(2,'0')}</b><i></i><small>${title}</small>`;
    stage.append(marker);
    if(!gsap||!ScrollTrigger||reduced) return;
    const dir=index%2?-1:1;
    gsap.fromTo(marker,
      {xPercent:-50,yPercent:-50,x:dir*310,y:210,z:-860,rotationX:11,rotationY:dir*20,scale:.68,opacity:.015},
      {x:dir*-130,y:-120,z:210,rotationX:-5,rotationY:dir*-8,scale:1.09,opacity:.34,ease:'none',scrollTrigger:{trigger:row,start:'top 94%',end:'bottom 6%',scrub:1.0,invalidateOnRefresh:true}}
    );
    ScrollTrigger.create({trigger:row,start:'top 62%',end:'bottom 38%',onToggle:self=>{
      row.classList.toggle('v45-current',self.isActive);
      if(list) list.classList.toggle('v45-has-current',rows.some(r=>r.classList.contains('v45-current')));
    }});
  });
}

function makeTextTexture(text,{size=128,weight=700,family='Arial',color='#f0ebe5'}={}){
  const canvas=document.createElement('canvas');
  canvas.width=1024;canvas.height=256;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle=color;
  ctx.font=`${weight} ${size}px ${family}`;
  ctx.textBaseline='middle';
  ctx.fillText(text,40,canvas.height/2);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.minFilter=THREE.LinearFilter;
  texture.magFilter=THREE.LinearFilter;
  texture.needsUpdate=true;
  return texture;
}

function makeFrameGroup(row,index,total,theme){
  const group=new THREE.Group();
  const w=5.8,h=3.35;
  const geom=new THREE.PlaneGeometry(w,h);
  const edges=new THREE.EdgesGeometry(geom);geom.dispose();
  const lineMaterial=new THREE.LineBasicMaterial({color:theme.line,transparent:true,opacity:.15});
  const frame=new THREE.LineSegments(edges,lineMaterial);group.add(frame);

  const crossGeom=new THREE.BufferGeometry();
  crossGeom.setAttribute('position',new THREE.Float32BufferAttribute([-w/2,0,0,w/2,0,0,0,-h/2,0,0,h/2,0],3));
  const crossMat=new THREE.LineBasicMaterial({color:theme.accent,transparent:true,opacity:.2});
  group.add(new THREE.LineSegments(crossGeom,crossMat));

  const title=q('strong',row)?.textContent?.trim()||`Etapa ${index+1}`;
  const number=String(index+1).padStart(2,'0');
  const titleTex=makeTextTexture(title,{size:106,weight:600,color:theme.text});
  const titleMat=new THREE.MeshBasicMaterial({map:titleTex,transparent:true,opacity:.18,depthWrite:false});
  const titleMesh=new THREE.Mesh(new THREE.PlaneGeometry(4.15,1.04),titleMat);
  titleMesh.position.set(.22,-.72,.035);group.add(titleMesh);

  const numTex=makeTextTexture(number,{size:170,weight:800,color:theme.text});
  const numMat=new THREE.MeshBasicMaterial({map:numTex,transparent:true,opacity:.14,depthWrite:false});
  const numMesh=new THREE.Mesh(new THREE.PlaneGeometry(2.25,.72),numMat);
  numMesh.position.set(-1.42,.96,.04);group.add(numMesh);

  const side=index%2?-1:1;
  group.position.set(side*(index===0?.35:1.0+index*.08),((index%3)-1)*.32,-index*7.0);
  group.rotation.y=side*(.16+index*.014);
  group.rotation.x=-.028+(index%2?-.022:.022);
  group.userData={lineMaterial,crossMat,titleMat,numMat,titleTex,numTex,index,total};
  return group;
}

function currentTheme(){
  const dark=root.getAttribute('data-theme')==='dark';
  return dark?{line:0xeee9e3,accent:0x9c2e24,text:'#f0ebe5',fog:0x0b0909}:{line:0x2b2522,accent:0x9c2e24,text:'#2b2522',fog:0xf3eee9};
}

function buildProcess(){
  const section=q('.process-section');
  const rows=section?qa('.process-list li',section):[];
  if(!section||!rows.length||!desktop||reduced||!gsap||!ScrollTrigger) return;

  const stage=document.createElement('div');
  stage.className='v45-process-stage';
  stage.setAttribute('aria-hidden','true');
  const canvas=document.createElement('canvas');canvas.className='v45-process-canvas';
  const vignette=document.createElement('div');vignette.className='v45-process-vignette';
  stage.append(canvas,vignette);section.insertBefore(stage,section.firstChild);

  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});}catch(error){root.classList.add('v45-webgl-fallback');stage.remove();console.warn('MOVX v45: WebGL unavailable',error);return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;

  const scene=new THREE.Scene();
  let theme=currentTheme();
  scene.fog=new THREE.FogExp2(theme.fog,.03);
  const camera=new THREE.PerspectiveCamera(46,1,.1,100);
  const world=new THREE.Group();scene.add(world);
  const frames=rows.map((row,i)=>makeFrameGroup(row,i,rows.length,theme));frames.forEach(f=>world.add(f));

  const railMat=new THREE.LineBasicMaterial({color:theme.line,transparent:true,opacity:.11});
  [-3.05,3.05].forEach(x=>{
    const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,-2.2,8),new THREE.Vector3(x,2.2,-38)]);
    world.add(new THREE.Line(g,railMat));
  });

  const cameraPoints=[new THREE.Vector3(0,0,8.3)];
  frames.forEach((frame,i)=>cameraPoints.push(new THREE.Vector3((i%2?-1:1)*.18,((i%3)-1)*.08,frame.position.z+5.35)));
  cameraPoints.push(new THREE.Vector3(0,0,frames.at(-1).position.z-2.2));
  const path=new THREE.CatmullRomCurve3(cameraPoints,false,'catmullrom',.48);

  let active=false,contextLost=false,progress=0,targetProgress=0,velocity=0,velocityTarget=0,raf=0;
  const pointer=new THREE.Vector2(),pointerTarget=new THREE.Vector2();
  let milestones=[];

  function computeMilestones(){
    const sectionRect=section.getBoundingClientRect();
    const sectionTop=scrollY+sectionRect.top;
    const travel=Math.max(1,section.offsetHeight-innerHeight);
    milestones=rows.map(row=>{
      const r=row.getBoundingClientRect();
      const center=scrollY+r.top+r.height/2;
      return clamp((center-sectionTop-innerHeight*.5)/travel,0,1);
    });
  }

  function mappedPathT(p){
    if(!milestones.length) return p;
    if(p<=milestones[0]) return lerp(0,1/(rows.length+1),clamp(p/Math.max(.0001,milestones[0])));
    for(let i=0;i<milestones.length-1;i++){
      const a=milestones[i],b=milestones[i+1];
      if(p<=b){
        const local=clamp((p-a)/Math.max(.0001,b-a));
        return lerp((i+1)/(rows.length+1),(i+2)/(rows.length+1),local);
      }
    }
    const last=milestones.at(-1);
    return lerp(rows.length/(rows.length+1),1,clamp((p-last)/Math.max(.0001,1-last)));
  }

  function nearestIndex(p){
    let best=0,dist=Infinity;
    milestones.forEach((m,i)=>{const d=Math.abs(p-m);if(d<dist){dist=d;best=i;}});
    return best;
  }

  function resize(){
    if(contextLost) return;
    const rect=stage.getBoundingClientRect();
    const w=Math.max(1,Math.round(rect.width)),h=Math.max(1,Math.round(rect.height));
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();computeMilestones();
  }

  function applyTheme(){
    theme=currentTheme();
    scene.fog.color.setHex(theme.fog);
    railMat.color.setHex(theme.line);
    frames.forEach(frame=>{
      frame.userData.lineMaterial.color.setHex(theme.line);
      frame.userData.crossMat.color.setHex(theme.accent);
    });
    schedule();
  }

  function paint(){
    raf=0;if(contextLost||!active||document.hidden) return;
    progress=lerp(progress,targetProgress,.15);
    velocity=lerp(velocity,velocityTarget,.14);velocityTarget*=.82;
    pointer.lerp(pointerTarget,.09);
    const t=mappedPathT(progress);
    const pos=path.getPointAt(clamp(t,0,1));
    const ahead=path.getPointAt(clamp(t+.028,0,1));
    camera.position.copy(pos);
    camera.position.x+=pointer.x*.34+velocity*.08;
    camera.position.y+=-pointer.y*.19;
    camera.fov=46+Math.min(4.5,Math.abs(velocity)*3.2);camera.updateProjectionMatrix();
    camera.lookAt(ahead.x+pointer.x*.15,ahead.y-pointer.y*.1,ahead.z);
    camera.rotateZ(velocity*.008);

    const current=nearestIndex(progress);
    rows.forEach((row,i)=>row.classList.toggle('v45-current',i===current));
    frames.forEach((frame,i)=>{
      const dz=Math.abs(camera.position.z-frame.position.z);
      const focus=clamp(1-dz/8.8,0,1);
      frame.userData.lineMaterial.opacity=.045+focus*.4;
      frame.userData.crossMat.opacity=.035+focus*.33;
      frame.userData.titleMat.opacity=.06+focus*.42;
      frame.userData.numMat.opacity=.04+focus*.3;
      const s=.94+focus*.1;frame.scale.setScalar(s);
    });
    renderer.render(scene,camera);
    const unsettled=Math.abs(progress-targetProgress)>.0008||Math.abs(velocity)>.004||Math.abs(velocityTarget)>.004||pointer.distanceTo(pointerTarget)>.002;
    if(unsettled) schedule();
  }
  function schedule(){if(!raf&&active&&!document.hidden&&!contextLost)raf=requestAnimationFrame(paint);}

  const trigger=ScrollTrigger.create({
    trigger:section,start:'top top',end:'bottom bottom',invalidateOnRefresh:true,
    onRefresh(){resize();},
    onEnter(){active=true;resize();schedule();},onEnterBack(){active=true;resize();schedule();},
    onLeave(){active=false;if(raf){cancelAnimationFrame(raf);raf=0;}},onLeaveBack(){active=false;if(raf){cancelAnimationFrame(raf);raf=0;}},
    onUpdate(self){targetProgress=self.progress;velocityTarget=clamp(self.getVelocity()/2100,-1.35,1.35);schedule();}
  });

  if(finePointer){
    section.addEventListener('pointermove',e=>{pointerTarget.set(clamp((e.clientX/Math.max(1,innerWidth)-.5)*2,-1,1),clamp((e.clientY/Math.max(1,innerHeight)-.5)*2,-1,1));schedule();},{passive:true});
    section.addEventListener('pointerleave',()=>{pointerTarget.set(0,0);schedule();},{passive:true});
  }
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;root.classList.add('v45-webgl-fallback');stage.remove();},{once:true});
  addEventListener('resize',()=>{resize();ScrollTrigger.refresh();schedule();},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&active)schedule();else if(raf){cancelAnimationFrame(raf);raf=0;}});
  new MutationObserver(muts=>{if(muts.some(m=>m.attributeName==='data-theme'))applyTheme();}).observe(root,{attributes:true,attributeFilter:['data-theme']});
  resize();trigger.refresh();
}

function buildContact(){
  const section=q('.contact-section');if(!section) return;
  const stage=makeStage(section,'v45-contact-stage');
  const word=document.createElement('div');word.className='v45-word v45-contact-word';word.textContent='MOVX';
  const axis=document.createElement('div');axis.className='v45-axis';stage.append(word,axis);
  if(!gsap||!ScrollTrigger||reduced) return;
  const tl=gsap.timeline({scrollTrigger:{trigger:section,start:'top bottom',end:'bottom top',scrub:1.12,invalidateOnRefresh:true}});
  tl.fromTo(word,{xPercent:-50,yPercent:-50,x:-120,y:150,z:-720,scale:.68,rotationX:10,opacity:.05},{x:70,y:-80,z:80,scale:1.08,rotationX:-1,opacity:.48,ease:'none'},0)
    .fromTo(axis,{xPercent:-50,yPercent:-50,x:190,y:90,z:170,rotation:2.3,opacity:.12},{x:-160,y:-70,z:60,rotation:-1.2,opacity:.62,ease:'none'},0);
}

function init(){
  try{
    removeOlderStages();
    buildAbout();buildServices();buildProcess();buildContact();
    if(gsap&&ScrollTrigger) requestAnimationFrame(()=>ScrollTrigger.refresh());
    root.classList.add('v45-runtime-ready');
  }catch(error){root.classList.add('v45-runtime-fallback');console.warn('MOVX v45 immersive runtime failed open:',error);}
}

init();
