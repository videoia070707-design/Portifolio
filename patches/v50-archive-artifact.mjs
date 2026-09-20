/* MOVX v50 — Archive Artifact
   A portfolio-specific 3D object bridges Services -> Process: a MOVX archive case opens
   and real project artworks are extracted by scroll before the journey continues. */
import * as THREE from './vendor/three.module.min.js';

const root=document.documentElement;
root.classList.add('movx-v50');
root.dataset.movxArtifact='v50-archive-case';
const gsap=window.gsap, ScrollTrigger=window.ScrollTrigger;
const reduced=new URLSearchParams(location.search).has('static')||matchMedia('(prefers-reduced-motion: reduce)').matches;
const desktop=matchMedia('(min-width:981px)').matches;
const fine=matchMedia('(pointer:fine)').matches;
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);

function projects(){
  const all=Array.isArray(window.MOVX_PROJECTS)?window.MOVX_PROJECTS:[];
  const wanted=['motionhub','hardwork-thermo-plus','voltara-operacoes','belive-cashflow'];
  return wanted.map(slug=>all.find(p=>p.slug===slug)).filter(Boolean);
}

function makeSection(items){
  const services=document.querySelector('.services-section');
  if(!services||document.querySelector('.v50-artifact-section')) return null;
  const section=document.createElement('section');
  section.className='v50-artifact-section';
  section.innerHTML=`<div class="v50-artifact-sticky">
    <canvas class="v50-artifact-canvas" aria-hidden="true"></canvas>
    <div class="v50-artifact-copy"><div class="v50-artifact-kicker">ARQUIVO / MATÉRIA-PRIMA</div><h2>Do trabalho ao método</h2><p>As peças deixam de ser só resultado e passam a revelar o sistema por trás da direção</p></div>
    <div class="v50-artifact-index"><span>SCROLL / ARCHIVE OBJECT</span></div>
    <div class="v50-mobile-artworks">${items.slice(0,3).map(p=>`<img src="${p.cover}" alt="${p.client} — ${p.title}" loading="lazy" decoding="async">`).join('')}</div>
  </div>`;
  services.insertAdjacentElement('afterend',section);
  return section;
}

function textTexture(text){
  const c=document.createElement('canvas');c.width=1024;c.height=256;
  const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);x.fillStyle='#f3eee9';x.font='800 148px Arial';x.textBaseline='middle';x.fillText(text,42,132);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.minFilter=THREE.LinearFilter;return t;
}

function makeCase(scene){
  const group=new THREE.Group();scene.add(group);
  const dark=new THREE.MeshStandardMaterial({color:0x141111,roughness:.72,metalness:.18});
  const edge=new THREE.MeshStandardMaterial({color:0x2b2522,roughness:.52,metalness:.34});
  const base=new THREE.Mesh(new THREE.BoxGeometry(5.4,3.35,1.22),dark);group.add(base);
  const rim=new THREE.Mesh(new THREE.BoxGeometry(5.58,3.53,1.0),new THREE.MeshBasicMaterial({color:0x8e2e23,wireframe:true,transparent:true,opacity:.18}));group.add(rim);
  const pivot=new THREE.Group();pivot.position.set(-2.76,0,.72);group.add(pivot);
  const lid=new THREE.Mesh(new THREE.BoxGeometry(5.55,3.48,.16),edge);lid.position.x=2.76;pivot.add(lid);
  const mark=new THREE.Mesh(new THREE.PlaneGeometry(2.55,.65),new THREE.MeshBasicMaterial({map:textTexture('MOVX'),transparent:true,opacity:.9,depthWrite:false}));mark.position.set(2.65,0,.095);pivot.add(mark);
  group.position.set(1.0,-.05,0);group.rotation.set(-.08,.28,-.025);
  return {group,pivot};
}

function makeArtwork(scene,project,index){
  const group=new THREE.Group();scene.add(group);
  const frame=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0x111111}));group.add(frame);
  const mat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,side:THREE.DoubleSide});
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(1,1),mat);plane.position.z=.025;group.add(plane);
  const loader=new THREE.TextureLoader();
  loader.load(project.cover,tex=>{
    tex.colorSpace=THREE.SRGBColorSpace;tex.minFilter=THREE.LinearFilter;mat.map=tex;mat.needsUpdate=true;
    const img=tex.image||{};const aspect=(img.width&&img.height)?img.width/img.height:1;
    const h=2.75,w=Math.min(4.3,h*aspect);
    frame.scale.set(w+.12,h+.12,1);plane.scale.set(w,h,1);
  },undefined,()=>{});
  group.userData={index,mat,baseRot:(index%2?-1:1)*(.06+index*.015)};
  return group;
}

function init(){
  const items=projects();
  const section=makeSection(items);if(!section||items.length<3||!desktop||reduced||!gsap||!ScrollTrigger)return;
  gsap.registerPlugin(ScrollTrigger);
  const canvas=section.querySelector('.v50-artifact-canvas');
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});}catch(e){root.classList.add('v50-fallback');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x000000,0);
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(root.getAttribute('data-theme')==='dark'?0x0b0909:0xf1ece7,.028);
  const camera=new THREE.PerspectiveCamera(42,1,.1,60);camera.position.set(0,0,10.8);
  scene.add(new THREE.HemisphereLight(0xffffff,0x1b1110,1.25));
  const key=new THREE.DirectionalLight(0xffe8dc,2.1);key.position.set(4,6,8);scene.add(key);
  const accent=new THREE.PointLight(0xb83b2e,4,20);accent.position.set(-4,-2,5);scene.add(accent);
  const box=makeCase(scene);
  const arts=items.map((p,i)=>makeArtwork(scene,p,i));
  arts.forEach((g,i)=>{g.position.set(.8,0,.9-i*.04);g.scale.setScalar(.58);g.rotation.set(0,0,(i-1.5)*.025);});
  let target=0,current=0,vel=0,velTarget=0,active=false,raf=0,contextLost=false;
  const pointer=new THREE.Vector2(),pointerTarget=new THREE.Vector2();

  function resize(){const r=section.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,innerHeight),false);camera.aspect=Math.max(1,r.width)/Math.max(1,innerHeight);camera.updateProjectionMatrix();}
  function update(p){
    const rise=smooth(clamp(p/.2));
    const open=smooth(clamp((p-.12)/.26));
    const exit=smooth(clamp((p-.82)/.18));
    box.group.position.y=lerp(-1.05,.05,rise)-exit*.55;
    box.group.position.z=lerp(-3.6,.15,rise)-exit*2.2;
    box.group.rotation.y=.28+pointer.x*.08+vel*.035;
    box.group.rotation.x=-.08+pointer.y*.035;
    box.pivot.rotation.y=lerp(0,-1.78,open);
    box.group.scale.setScalar(lerp(.78,1,rise)*(1-exit*.16));
    arts.forEach((g,i)=>{
      const start=.28+i*.075,end=start+.34;
      const e=smooth(clamp((p-start)/(end-start)));
      const settle=smooth(clamp((p-.66)/.2));
      const side=i%2?-1:1;
      const rank=i-1.5;
      g.userData.mat.opacity=clamp((e*.98)*(1-exit*.95));
      g.position.x=lerp(.8,side*(1.7+Math.abs(rank)*.55),e);
      g.position.y=lerp(-.15,rank*.48+e*.22,e)-exit*.55;
      g.position.z=lerp(.78,3.0+Math.abs(rank)*.28,e)+settle*.45-exit*2.6;
      g.rotation.y=lerp(0,side*(-.18-rank*.025),e)+pointer.x*.035;
      g.rotation.x=pointer.y*-.025+vel*.012;
      g.rotation.z=lerp((i-1.5)*.025,rank*.045,e)*(1-settle*.4);
      g.scale.setScalar(lerp(.58,1,e)*(1-exit*.18));
    });
    section.style.setProperty('--v50-line',String(clamp(p/.82)));
    camera.position.x=pointer.x*.26+vel*.08;camera.position.y=-pointer.y*.16;camera.fov=42+Math.min(4,Math.abs(vel)*3);camera.updateProjectionMatrix();camera.lookAt(0,0,0);
  }
  function paint(){raf=0;if(!active||contextLost||document.hidden)return;current=lerp(current,target,.12);vel=lerp(vel,velTarget,.12);velTarget*=.82;pointer.lerp(pointerTarget,.08);update(current);renderer.render(scene,camera);if(Math.abs(current-target)>.0007||Math.abs(vel)>.003||Math.abs(velTarget)>.003||pointer.distanceTo(pointerTarget)>.002)schedule();}
  function schedule(){if(!raf&&active&&!contextLost&&!document.hidden)raf=requestAnimationFrame(paint);}
  const trig=ScrollTrigger.create({trigger:section,start:'top top',end:'bottom bottom',invalidateOnRefresh:true,onRefresh:resize,onEnter(){active=true;root.classList.add('v50-artifact-active');resize();schedule();},onEnterBack(){active=true;root.classList.add('v50-artifact-active');resize();schedule();},onLeave(){active=false;root.classList.remove('v50-artifact-active');},onLeaveBack(){active=false;root.classList.remove('v50-artifact-active');},onUpdate(self){target=self.progress;velTarget=clamp(self.getVelocity()/2200,-1.2,1.2);schedule();}});
  if(fine){section.addEventListener('pointermove',e=>{pointerTarget.set(clamp((e.clientX/innerWidth-.5)*2,-1,1),clamp((e.clientY/innerHeight-.5)*2,-1,1));schedule();},{passive:true});section.addEventListener('pointerleave',()=>{pointerTarget.set(0,0);schedule();},{passive:true});}
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;root.classList.add('v50-fallback');},{once:true});
  addEventListener('resize',()=>{resize();ScrollTrigger.refresh();schedule();},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&active)schedule();});
  resize();trig.refresh();
}

try{init();}catch(error){root.classList.add('v50-fallback');console.warn('MOVX v50 archive artifact failed open',error);}
