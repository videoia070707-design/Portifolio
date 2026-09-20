/* MOVX v51 — archive physics
   Real portfolio works flex out of a 3D archive case, overlap in space, then align into
   a corridor that hands the eye to the Process chapter. */
import * as THREE from './vendor/three.module.min.js';

const root=document.documentElement;
root.classList.add('movx-v51');
root.dataset.movxArchivePhysics='v51';
const gsap=window.gsap, ScrollTrigger=window.ScrollTrigger;
const reduced=new URLSearchParams(location.search).has('static')||matchMedia('(prefers-reduced-motion: reduce)').matches;
const desktop=matchMedia('(min-width:981px)').matches;
const fine=matchMedia('(pointer:fine)').matches;
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);

function selectedProjects(){
  const all=Array.isArray(window.MOVX_PROJECTS)?window.MOVX_PROJECTS:[];
  const wanted=['motionhub','hardwork-thermo-plus','voltara-operacoes','belive-cashflow'];
  return wanted.map(slug=>all.find(p=>p.slug===slug)).filter(Boolean);
}

function makeSection(items){
  const services=document.querySelector('.services-section');
  if(!services||document.querySelector('.v51-artifact-section')) return null;
  const section=document.createElement('section');
  section.className='v51-artifact-section';
  section.innerHTML=`<div class="v51-artifact-sticky">
    <div class="v51-artifact-fallback" aria-hidden="true">
      <div class="v51-fallback-case"><div class="v51-fallback-lid"><span>MOVX</span></div><div class="v51-fallback-base"></div></div>
      ${items.map((p,i)=>`<figure class="v51-fallback-sheet" data-index="${i}"><img src="${p.cover}" alt="" loading="eager" decoding="async"><i style="--accent:${p.accent||'#9c2e24'}"></i></figure>`).join('')}
    </div>
    <canvas class="v51-artifact-canvas" aria-hidden="true"></canvas>
    <div class="v51-artifact-vignette" aria-hidden="true"></div>
    <div class="v51-artifact-copy"><div class="v51-artifact-kicker">ARQUIVO / MATÉRIA-PRIMA</div><h2>Do trabalho ao método</h2><p>As peças saem do arquivo, ganham profundidade e se reorganizam até revelar o processo por trás da direção</p></div>
    <div class="v51-artifact-caption"><span></span></div>
    <div class="v51-artifact-meta"><span>EXTRAÇÃO</span><i class="v51-progress"></i><span>PROCESSO</span></div>
    <div class="v51-mobile-artworks">${items.slice(0,3).map(p=>`<img src="${p.cover}" alt="${p.client} — ${p.title}" loading="lazy" decoding="async">`).join('')}</div>
  </div>`;
  services.insertAdjacentElement('afterend',section);
  return section;
}

function initDomFallback(section,items){
  if(!gsap||!ScrollTrigger||!desktop||reduced) return;
  gsap.registerPlugin(ScrollTrigger);
  const fallback=section.querySelector('.v51-artifact-fallback');
  const caseEl=fallback?.querySelector('.v51-fallback-case');
  const lid=fallback?.querySelector('.v51-fallback-lid');
  const sheets=[...(fallback?.querySelectorAll('.v51-fallback-sheet')||[])];
  if(!fallback||!caseEl||!lid||!sheets.length) return;

  const master=gsap.timeline({scrollTrigger:{trigger:section,start:'top top',end:'bottom bottom',scrub:1.02,invalidateOnRefresh:true}});
  master.fromTo(caseEl,{x:190,y:140,z:-420,rotationX:-11,rotationY:24,rotationZ:-2.5,scale:.72,opacity:0},{x:115,y:20,z:0,rotationX:-6,rotationY:16,rotationZ:-1.2,scale:1,opacity:1,duration:.20,ease:'none'},0)
    .fromTo(lid,{rotationY:0},{rotationY:-104,duration:.24,ease:'none'},.10)
    .to(caseEl,{x:40,y:-20,z:-90,rotationY:9,scale:.92,duration:.22,ease:'none'},.70)
    .to(caseEl,{y:-80,z:-360,opacity:.12,duration:.14,ease:'none'},.86);

  sheets.forEach((sheet,i)=>{
    const side=i%2?-1:1;
    const rank=i-(sheets.length-1)/2;
    const start=.24+i*.055;
    const fanX=side*(245+Math.abs(rank)*58);
    const fanY=rank*82+26;
    const tunnelX=side*(78+Math.abs(rank)*18);
    const tunnelY=rank*36;
    master.fromTo(sheet,
      {x:135,y:35,z:-170,rotationX:7,rotationY:side*3,rotationZ:rank*2.4,scale:.52,opacity:0},
      {x:fanX,y:fanY,z:115+Math.abs(rank)*26,rotationX:-2,rotationY:side*(-11-rank*1.2),rotationZ:rank*3.5,scale:1,opacity:.98,duration:.36,ease:'none'},start
    ).to(sheet,
      {x:tunnelX,y:tunnelY,z:-20-i*155,rotationX:-1.5,rotationY:side*4,rotationZ:0,scale:.82,opacity:.82,duration:.18,ease:'none'},.70
    ).to(sheet,
      {y:tunnelY-24,z:-360-i*90,scale:.66,opacity:0,duration:.12,ease:'none'},.88
    );
  });

  ScrollTrigger.create({trigger:section,start:'top top',end:'bottom bottom',onUpdate:self=>{
    section.style.setProperty('--v51-progress',String(self.progress));
    const idx=Math.min(items.length-1,Math.max(0,Math.floor(clamp((self.progress-.28)/.38)*items.length)));
    const caption=section.querySelector('.v51-artifact-caption span');
    if(caption&&items[idx]) caption.textContent=`${items[idx].client} — ${items[idx].title}`;
  }});
}

function textTexture(text){
  const c=document.createElement('canvas');c.width=1024;c.height=256;
  const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);x.fillStyle='#f3eee9';x.font='800 148px Arial';x.textBaseline='middle';x.fillText(text,42,132);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;return t;
}

function makeCase(scene){
  const group=new THREE.Group();scene.add(group);
  const shell=new THREE.MeshStandardMaterial({color:0x111010,roughness:.68,metalness:.2});
  const edge=new THREE.MeshStandardMaterial({color:0x2c2724,roughness:.46,metalness:.42});
  const accent=new THREE.MeshStandardMaterial({color:0x8f2d23,roughness:.4,metalness:.28});
  const base=new THREE.Mesh(new THREE.BoxGeometry(5.7,3.55,1.28),shell);group.add(base);
  const inset=new THREE.Mesh(new THREE.BoxGeometry(5.18,3.05,1.31),new THREE.MeshStandardMaterial({color:0x090808,roughness:.86,metalness:.04}));
  inset.position.z=.06;group.add(inset);
  const band=new THREE.Mesh(new THREE.BoxGeometry(.16,3.12,1.34),accent);band.position.x=-2.42;group.add(band);
  const lidPivot=new THREE.Group();lidPivot.position.set(-2.88,0,.73);group.add(lidPivot);
  const lid=new THREE.Mesh(new THREE.BoxGeometry(5.76,3.58,.18),edge);lid.position.x=2.88;lidPivot.add(lid);
  const logo=new THREE.Mesh(new THREE.PlaneGeometry(2.65,.68),new THREE.MeshBasicMaterial({map:textTexture('MOVX'),transparent:true,opacity:.92,depthWrite:false}));
  logo.position.set(2.68,0,.105);lidPivot.add(logo);
  const hinge=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,5.25,18),accent);hinge.rotation.z=Math.PI/2;hinge.position.set(0,0,-.02);lidPivot.add(hinge);
  group.position.set(1.1,-.02,-.1);group.rotation.set(-.085,.28,-.025);
  return {group,lidPivot};
}

function createBendGeometry(){
  const geom=new THREE.PlaneGeometry(1,1,20,14);
  const pos=geom.attributes.position;
  const base=new Float32Array(pos.array);
  geom.userData.base=base;
  return geom;
}

function applyBend(mesh,bend,twist=0){
  const geom=mesh.geometry;
  const pos=geom.attributes.position;
  const base=geom.userData.base;
  if(!base) return;
  for(let i=0;i<pos.count;i++){
    const x=base[i*3],y=base[i*3+1];
    const curve=(x*x-.25)*bend;
    const torsion=x*y*twist;
    pos.setXYZ(i,x,y,curve+torsion);
  }
  pos.needsUpdate=true;
}

function makeArtwork(scene,project,index){
  const group=new THREE.Group();scene.add(group);
  const frameMat=new THREE.MeshStandardMaterial({color:0x0f0e0d,roughness:.72,metalness:.08});
  const frame=new THREE.Mesh(new THREE.BoxGeometry(1.08,1.08,.08),frameMat);group.add(frame);
  const geom=createBendGeometry();
  const mat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:true});
  const plane=new THREE.Mesh(geom,mat);plane.position.z=.055;group.add(plane);
  const accentColor=new THREE.Color(project.accent||'#9c2e24');
  const accent=new THREE.Mesh(new THREE.BoxGeometry(1,.028,.035),new THREE.MeshBasicMaterial({color:accentColor}));accent.position.set(0,-.56,.06);group.add(accent);
  const loader=new THREE.TextureLoader();
  loader.load(project.cover,tex=>{
    tex.colorSpace=THREE.SRGBColorSpace;tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;mat.map=tex;mat.needsUpdate=true;
    const img=tex.image||{};const aspect=(img.width&&img.height)?img.width/img.height:1;
    const h=2.82,w=Math.min(4.35,h*aspect);
    frame.scale.set(w+.14,h+.14,1);plane.scale.set(w,h,1);accent.scale.x=w+.08;accent.position.y=-(h/2+.055);
  },undefined,()=>{});
  group.userData={index,project,mat,plane,frame,accent,baseRot:(index%2?-1:1)*(.055+index*.012)};
  return group;
}

function init(){
  const items=selectedProjects();
  const section=makeSection(items);
  if(!section) return;
  initDomFallback(section,items);
  if(items.length<3||!desktop||reduced||!gsap||!ScrollTrigger)return;
  gsap.registerPlugin(ScrollTrigger);
  const canvas=section.querySelector('.v51-artifact-canvas');
  const caption=section.querySelector('.v51-artifact-caption span');
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});}catch(error){root.classList.add('v51-fallback');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x000000,0);
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(root.getAttribute('data-theme')==='dark'?0x0b0909:0xf1ece7,.027);
  const camera=new THREE.PerspectiveCamera(42,1,.1,80);camera.position.set(0,0,11.2);
  scene.add(new THREE.HemisphereLight(0xffffff,0x180f0d,1.35));
  const key=new THREE.DirectionalLight(0xffe8dc,2.25);key.position.set(4.6,6.2,8.2);scene.add(key);
  const red=new THREE.PointLight(0xb53a2d,5.2,24);red.position.set(-4.6,-2.4,5.5);scene.add(red);
  const box=makeCase(scene);
  const arts=items.map((p,i)=>makeArtwork(scene,p,i));
  arts.forEach((g,i)=>{g.position.set(.9,-.05,.86-i*.05);g.scale.setScalar(.55);g.rotation.set(0,0,(i-1.5)*.025);});

  const corridor=new THREE.Group();scene.add(corridor);
  const railMat=new THREE.LineBasicMaterial({color:0x8b817b,transparent:true,opacity:.08});
  [-2.65,2.65].forEach(x=>{
    const geom=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,-2.1,4.2),new THREE.Vector3(x,2.1,-18)]);
    corridor.add(new THREE.Line(geom,railMat));
  });

  let target=0,current=0,vel=0,velTarget=0,active=false,raf=0,contextLost=false,currentCaption=-1,painted=false;
  const pointer=new THREE.Vector2(),pointerTarget=new THREE.Vector2();

  function resize(){
    const r=section.getBoundingClientRect();
    renderer.setSize(Math.max(1,r.width),Math.max(1,innerHeight),false);
    camera.aspect=Math.max(1,r.width)/Math.max(1,innerHeight);camera.updateProjectionMatrix();
  }

  function setCaption(index,opacity){
    if(index!==currentCaption&&items[index]){
      currentCaption=index;
      caption.textContent=`${items[index].client} — ${items[index].title}`;
    }
    section.style.setProperty('--v51-caption-o',String(opacity));
    section.style.setProperty('--v51-caption-y',`${lerp(10,0,opacity)}px`);
  }

  function update(p){
    const rise=smooth(clamp(p/.17));
    const open=smooth(clamp((p-.10)/.24));
    const fan=smooth(clamp((p-.26)/.44));
    const corridorT=smooth(clamp((p-.70)/.18));
    const exit=smooth(clamp((p-.88)/.12));

    box.group.position.y=lerp(-1.1,.08,rise)-exit*.52;
    box.group.position.z=lerp(-4.1,.18,rise)-corridorT*.75-exit*2.4;
    box.group.rotation.y=.29+pointer.x*.08+vel*.04;
    box.group.rotation.x=-.09+pointer.y*.04;
    box.group.scale.setScalar(lerp(.75,1,rise)*(1-corridorT*.1-exit*.14));
    box.lidPivot.rotation.y=lerp(0,-1.86,open);

    let nearest=0,nearestDist=9;
    arts.forEach((g,i)=>{
      const start=.24+i*.065,end=start+.34;
      const e=smooth(clamp((p-start)/(end-start)));
      const side=i%2?-1:1;
      const rank=i-1.5;
      const fanX=side*(1.78+Math.abs(rank)*.5);
      const fanY=rank*.5+e*.24;
      const fanZ=2.9+Math.abs(rank)*.32;
      const tunnelX=side*(.72+Math.abs(rank)*.16);
      const tunnelY=rank*.2;
      const tunnelZ=2.2-i*2.65;

      g.userData.mat.opacity=clamp(e*(1-exit*.96));
      g.position.x=lerp(lerp(.82,fanX,e),tunnelX,corridorT);
      g.position.y=lerp(lerp(-.16,fanY,e),tunnelY,corridorT)-exit*.35;
      g.position.z=lerp(lerp(.72,fanZ,e),tunnelZ,corridorT)-exit*2.5;
      g.rotation.y=lerp(lerp(0,side*(-.19-rank*.024),e),side*.08,corridorT)+pointer.x*.035;
      g.rotation.x=lerp(pointer.y*-.026+vel*.014,-.02,corridorT);
      g.rotation.z=lerp(lerp((i-1.5)*.025,rank*.05,e),0,corridorT);
      g.scale.setScalar(lerp(.55,1,e)*(1-exit*.15));

      const physicalBend=(1-corridorT)*(0.10*(1-e)+Math.abs(vel)*.09)+corridorT*.025;
      const twist=(1-corridorT)*(side*.07*e+vel*.025);
      applyBend(g.userData.plane,physicalBend,twist);

      const d=Math.abs(p-(start+.20));
      if(d<nearestDist){nearestDist=d;nearest=i;}
    });

    const captionOpacity=clamp(fan*(1-corridorT)*(1-exit)*1.35,0,1);
    setCaption(nearest,captionOpacity);
    section.style.setProperty('--v51-progress',String(clamp(p)));
    root.style.setProperty('--v51-journey-opacity',String(lerp(.07,.58,corridorT)*(1-exit*.25)));

    railMat.opacity=lerp(.02,.18,corridorT)*(1-exit);
    corridor.position.z=lerp(-3.5,1.5,corridorT)-exit*.8;
    corridor.rotation.z=vel*.012;

    camera.position.x=pointer.x*.28+vel*.09;
    camera.position.y=-pointer.y*.17;
    camera.position.z=11.2-corridorT*.65;
    camera.fov=42+Math.min(4.5,Math.abs(vel)*3.2);camera.updateProjectionMatrix();
    camera.lookAt(0,lerp(.05,-.18,corridorT),lerp(0,-2.5,corridorT));
  }

  function paint(){
    raf=0;if(!active||contextLost||document.hidden)return;
    current=lerp(current,target,.12);vel=lerp(vel,velTarget,.12);velTarget*=.82;pointer.lerp(pointerTarget,.08);
    update(current);renderer.render(scene,camera);
    if(!painted){painted=true;root.classList.add('v51-webgl-painted');}
    if(Math.abs(current-target)>.0007||Math.abs(vel)>.003||Math.abs(velTarget)>.003||pointer.distanceTo(pointerTarget)>.002)schedule();
  }
  function schedule(){if(!raf&&active&&!contextLost&&!document.hidden)raf=requestAnimationFrame(paint);}

  const trigger=ScrollTrigger.create({
    trigger:section,start:'top top',end:'bottom bottom',invalidateOnRefresh:true,
    onRefresh(){resize();},
    onEnter(){active=true;root.classList.add('v51-artifact-active');resize();schedule();},
    onEnterBack(){active=true;root.classList.add('v51-artifact-active');resize();schedule();},
    onLeave(){active=false;root.classList.remove('v51-artifact-active');root.style.removeProperty('--v51-journey-opacity');if(raf){cancelAnimationFrame(raf);raf=0;}},
    onLeaveBack(){active=false;root.classList.remove('v51-artifact-active');root.style.removeProperty('--v51-journey-opacity');if(raf){cancelAnimationFrame(raf);raf=0;}},
    onUpdate(self){target=self.progress;velTarget=clamp(self.getVelocity()/2200,-1.2,1.2);schedule();}
  });

  if(fine){
    section.addEventListener('pointermove',e=>{pointerTarget.set(clamp((e.clientX/innerWidth-.5)*2,-1,1),clamp((e.clientY/innerHeight-.5)*2,-1,1));schedule();},{passive:true});
    section.addEventListener('pointerleave',()=>{pointerTarget.set(0,0);schedule();},{passive:true});
  }
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;root.classList.remove('v51-webgl-painted');root.classList.add('v51-fallback');},{once:true});
  addEventListener('resize',()=>{resize();ScrollTrigger.refresh();schedule();},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&active)schedule();});
  resize();trigger.refresh();requestAnimationFrame(()=>ScrollTrigger.refresh());
}

try{init();}catch(error){root.classList.add('v51-fallback');console.warn('MOVX v51 archive physics failed open',error);}
