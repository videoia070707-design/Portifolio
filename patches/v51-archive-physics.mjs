/* MOVX v51.2 — archive-to-process spatial handoff
   The archive case now disassembles into the spatial frame of the Process chapter.
   Real portfolio works flex out of the case, settle into a corridor, then pass through
   structural gates built from the case itself. */
import * as THREE from './vendor/three.module.min.js';

const root=document.documentElement;
root.classList.add('movx-v51');
root.dataset.movxArchivePhysics='v51.2-architectural-handoff';
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
  if(!services)return null;
  document.querySelector('.v51-artifact-section')?.remove();
  const section=document.createElement('section');
  section.className='v51-artifact-section';
  section.innerHTML=`<div class="v51-artifact-sticky">
    <canvas class="v51-artifact-canvas" aria-hidden="true"></canvas>
    <div class="v51-artifact-vignette" aria-hidden="true"></div>
    <div class="v51-artifact-copy"><div class="v51-artifact-kicker">ARQUIVO / ESTRUTURA</div><h2>Do trabalho ao método</h2><p>As peças saem do arquivo, ganham profundidade e a própria caixa se desmonta para construir o espaço do processo</p></div>
    <div class="v51-artifact-caption"><span></span></div>
    <div class="v51-artifact-meta"><span>MATÉRIA</span><i class="v51-progress"></i><span>SISTEMA</span></div>
    <div class="v51-mobile-artworks">${items.slice(0,3).map(p=>`<img src="${p.cover}" alt="${p.client} — ${p.title}" loading="lazy" decoding="async">`).join('')}</div>
  </div>`;
  services.insertAdjacentElement('afterend',section);
  return section;
}

function textTexture(text){
  const c=document.createElement('canvas');c.width=1024;c.height=256;
  const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);x.fillStyle='#f3eee9';x.font='800 148px Arial';x.textBaseline='middle';x.fillText(text,42,132);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;return t;
}

function makeCase(scene){
  const group=new THREE.Group();scene.add(group);
  const shellMat=new THREE.MeshStandardMaterial({color:0x111010,roughness:.68,metalness:.2});
  const edgeMat=new THREE.MeshStandardMaterial({color:0x2c2724,roughness:.46,metalness:.42});
  const accentMat=new THREE.MeshStandardMaterial({color:0x8f2d23,roughness:.4,metalness:.28});
  const darkMat=new THREE.MeshStandardMaterial({color:0x090808,roughness:.86,metalness:.04});

  const base=new THREE.Mesh(new THREE.BoxGeometry(5.7,3.55,1.28),shellMat);group.add(base);
  const inset=new THREE.Mesh(new THREE.BoxGeometry(5.18,3.05,1.31),darkMat);inset.position.z=.06;group.add(inset);
  const band=new THREE.Mesh(new THREE.BoxGeometry(.16,3.12,1.34),accentMat);band.position.x=-2.42;group.add(band);

  const lidPivot=new THREE.Group();lidPivot.position.set(-2.88,0,.73);group.add(lidPivot);
  const lid=new THREE.Mesh(new THREE.BoxGeometry(5.76,3.58,.18),edgeMat);lid.position.x=2.88;lidPivot.add(lid);
  const logo=new THREE.Mesh(new THREE.PlaneGeometry(2.65,.68),new THREE.MeshBasicMaterial({map:textTexture('MOVX'),transparent:true,opacity:.92,depthWrite:false}));logo.position.set(2.68,0,.105);lidPivot.add(logo);
  const hinge=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,5.25,18),accentMat);hinge.rotation.z=Math.PI/2;hinge.position.set(0,0,-.02);lidPivot.add(hinge);

  const shards=[];
  const shardSpecs=[
    [5.65,.10,.10,0,1.68,.67],[5.65,.10,.10,0,-1.68,.67],
    [.10,3.35,.10,-2.78,0,.67],[.10,3.35,.10,2.78,0,.67]
  ];
  shardSpecs.forEach((s,i)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(s[0],s[1],s[2]),i===2?accentMat:edgeMat);
    mesh.position.set(s[3],s[4],s[5]);group.add(mesh);shards.push(mesh);
  });

  group.position.set(1.1,-.02,-.1);group.rotation.set(-.085,.28,-.025);
  return {group,lidPivot,base,inset,band,lid,logo,hinge,shards};
}

function createBendGeometry(){
  const geom=new THREE.PlaneGeometry(1,1,20,14);
  geom.userData.base=new Float32Array(geom.attributes.position.array);
  return geom;
}
function applyBend(mesh,bend,twist=0){
  const pos=mesh.geometry.attributes.position,base=mesh.geometry.userData.base;
  if(!base)return;
  for(let i=0;i<pos.count;i++){
    const x=base[i*3],y=base[i*3+1];
    pos.setXYZ(i,x,y,(x*x-.25)*bend+x*y*twist);
  }
  pos.needsUpdate=true;
}

function makeArtwork(scene,project,index){
  const group=new THREE.Group();scene.add(group);
  const frame=new THREE.Mesh(new THREE.BoxGeometry(1.08,1.08,.08),new THREE.MeshStandardMaterial({color:0x0f0e0d,roughness:.72,metalness:.08}));group.add(frame);
  const geom=createBendGeometry();
  const mat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:true});
  const plane=new THREE.Mesh(geom,mat);plane.position.z=.055;group.add(plane);
  const accent=new THREE.Mesh(new THREE.BoxGeometry(1,.028,.035),new THREE.MeshBasicMaterial({color:new THREE.Color(project.accent||'#9c2e24')}));accent.position.set(0,-.56,.06);group.add(accent);
  new THREE.TextureLoader().load(project.cover,tex=>{
    tex.colorSpace=THREE.SRGBColorSpace;tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;mat.map=tex;mat.needsUpdate=true;
    const img=tex.image||{},aspect=(img.width&&img.height)?img.width/img.height:1;
    const h=2.82,w=Math.min(4.35,h*aspect);
    frame.scale.set(w+.14,h+.14,1);plane.scale.set(w,h,1);accent.scale.x=w+.08;accent.position.y=-(h/2+.055);
  });
  group.userData={index,project,mat,plane};
  return group;
}

function makePortal(scene,index){
  const group=new THREE.Group();scene.add(group);
  const w=5.6-index*.18,h=3.2-index*.08;
  const pts=[
    -w/2,-h/2,0,w/2,-h/2,0, w/2,-h/2,0,w/2,h/2,0,
    w/2,h/2,0,-w/2,h/2,0, -w/2,h/2,0,-w/2,-h/2,0
  ];
  const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
  const lineMat=new THREE.LineBasicMaterial({color:index===0?0x9c2e24:0x9a908a,transparent:true,opacity:0});
  const frame=new THREE.LineSegments(geom,lineMat);group.add(frame);
  const crossGeom=new THREE.BufferGeometry();crossGeom.setAttribute('position',new THREE.Float32BufferAttribute([-w*.22,0,0,w*.22,0,0,0,-h*.18,0,0,h*.18,0],3));
  const crossMat=new THREE.LineBasicMaterial({color:0x9c2e24,transparent:true,opacity:0});
  group.add(new THREE.LineSegments(crossGeom,crossMat));
  group.userData={lineMat,crossMat,index};
  return group;
}

function init(){
  const items=selectedProjects(),section=makeSection(items);
  if(!section||items.length<3||!desktop||reduced||!gsap||!ScrollTrigger)return;
  gsap.registerPlugin(ScrollTrigger);
  const canvas=section.querySelector('.v51-artifact-canvas'),caption=section.querySelector('.v51-artifact-caption span');
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});}catch(error){root.classList.add('v51-fallback');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x000000,0);
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(root.getAttribute('data-theme')==='dark'?0x0b0909:0xf1ece7,.026);
  const camera=new THREE.PerspectiveCamera(42,1,.1,90);camera.position.set(0,0,11.2);
  scene.add(new THREE.HemisphereLight(0xffffff,0x180f0d,1.35));
  const key=new THREE.DirectionalLight(0xffe8dc,2.25);key.position.set(4.6,6.2,8.2);scene.add(key);
  const red=new THREE.PointLight(0xb53a2d,5.2,24);red.position.set(-4.6,-2.4,5.5);scene.add(red);

  const box=makeCase(scene),arts=items.map((p,i)=>makeArtwork(scene,p,i));
  arts.forEach((g,i)=>{g.position.set(.9,-.05,.86-i*.05);g.scale.setScalar(.55);g.rotation.set(0,0,(i-1.5)*.025);});
  const portals=[0,1,2,3].map(i=>makePortal(scene,i));
  portals.forEach((g,i)=>{g.position.set((i%2?-.22:.22),0,1.8-i*3.25);g.rotation.y=(i%2?-1:1)*.025;});

  const railMat=new THREE.LineBasicMaterial({color:0x8b817b,transparent:true,opacity:.03});
  const rails=[-2.7,2.7].map(x=>{
    const geom=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,-2.2,4.2),new THREE.Vector3(x,2.2,-18)]);
    const line=new THREE.Line(geom,railMat);scene.add(line);return line;
  });

  let target=0,current=0,vel=0,velTarget=0,active=false,raf=0,contextLost=false,currentCaption=-1;
  const pointer=new THREE.Vector2(),pointerTarget=new THREE.Vector2();

  function resize(){
    const r=section.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,innerHeight),false);
    camera.aspect=Math.max(1,r.width)/Math.max(1,innerHeight);camera.updateProjectionMatrix();
  }
  function setCaption(index,opacity){
    if(index!==currentCaption&&items[index]){currentCaption=index;caption.textContent=`${items[index].client} — ${items[index].title}`;}
    section.style.setProperty('--v51-caption-o',String(opacity));section.style.setProperty('--v51-caption-y',`${lerp(10,0,opacity)}px`);
  }

  function update(p){
    const rise=smooth(clamp(p/.16));
    const open=smooth(clamp((p-.09)/.22));
    const fan=smooth(clamp((p-.24)/.39));
    const corridorT=smooth(clamp((p-.64)/.20));
    const architect=smooth(clamp((p-.73)/.18));
    const exit=smooth(clamp((p-.91)/.09));

    const dissolve=architect;
    box.group.position.y=lerp(-1.08,.08,rise)-exit*.58;
    box.group.position.z=lerp(-4.15,.18,rise)-corridorT*.65-exit*2.8;
    box.group.rotation.y=.29+pointer.x*.08+vel*.04;
    box.group.rotation.x=-.09+pointer.y*.04;
    box.group.scale.setScalar(lerp(.75,1,rise)*(1-exit*.12));
    box.lidPivot.rotation.y=lerp(0,-1.86,open);

    box.base.scale.z=lerp(1,.035,dissolve);box.base.material.opacity=1-dissolve*.88;box.base.material.transparent=true;
    box.inset.scale.z=lerp(1,.02,dissolve);box.inset.material.opacity=1-dissolve*.96;box.inset.material.transparent=true;
    box.band.position.x=lerp(-2.42,-2.7,dissolve);box.band.scale.y=lerp(1,1.52,dissolve);
    box.lid.material.opacity=1-dissolve*.82;box.lid.material.transparent=true;
    box.logo.material.opacity=.92*(1-dissolve);
    box.hinge.material.opacity=1-dissolve*.72;box.hinge.material.transparent=true;
    box.shards.forEach((mesh,i)=>{
      const horizontal=i<2,side=i%2?-1:1;
      mesh.position.z=lerp(.67,-1.8-i*.95,dissolve);
      mesh.position.x+=dissolve*side*.004;
      if(horizontal){mesh.scale.x=lerp(1,.78,dissolve);mesh.scale.y=lerp(1,.55,dissolve);}else{mesh.scale.y=lerp(1,1.38,dissolve);mesh.scale.x=lerp(1,.58,dissolve);}
      mesh.material.opacity=lerp(1,.42,dissolve);mesh.material.transparent=true;
    });

    let nearest=0,nearestDist=9;
    arts.forEach((g,i)=>{
      const start=.22+i*.06,end=start+.32,e=smooth(clamp((p-start)/(end-start)));
      const side=i%2?-1:1,rank=i-1.5;
      const fanX=side*(1.72+Math.abs(rank)*.48),fanY=rank*.48+e*.22,fanZ=2.9+Math.abs(rank)*.28;
      const tunnelX=side*(.62+Math.abs(rank)*.12),tunnelY=rank*.18,tunnelZ=1.7-i*3.25;
      g.userData.mat.opacity=clamp(e*(1-exit*.98));
      g.position.x=lerp(lerp(.82,fanX,e),tunnelX,corridorT);
      g.position.y=lerp(lerp(-.16,fanY,e),tunnelY,corridorT)-exit*.34;
      g.position.z=lerp(lerp(.72,fanZ,e),tunnelZ,corridorT)-exit*2.8;
      g.rotation.y=lerp(lerp(0,side*(-.19-rank*.024),e),side*.035,corridorT)+pointer.x*.035;
      g.rotation.x=lerp(pointer.y*-.026+vel*.014,-.01,corridorT);
      g.rotation.z=lerp(lerp((i-1.5)*.025,rank*.05,e),0,corridorT);
      g.scale.setScalar(lerp(.55,1,e)*(1-exit*.13));
      applyBend(g.userData.plane,(1-corridorT)*(0.10*(1-e)+Math.abs(vel)*.09)+corridorT*.018,(1-corridorT)*(side*.07*e+vel*.025));
      const d=Math.abs(p-(start+.19));if(d<nearestDist){nearestDist=d;nearest=i;}
    });

    portals.forEach((portal,i)=>{
      const local=smooth(clamp((architect-i*.025)/.78));
      portal.userData.lineMat.opacity=(.03+local*.29)*(1-exit);
      portal.userData.crossMat.opacity=(.01+local*.18)*(1-exit);
      portal.scale.setScalar(lerp(.74,1,local));
      portal.rotation.z=lerp((i%2?-1:1)*.08,0,local)+vel*.006;
      portal.position.y=lerp((i-1.5)*.14,0,local);
    });

    setCaption(nearest,clamp(fan*(1-corridorT)*(1-exit)*1.35,0,1));
    section.style.setProperty('--v51-progress',String(clamp(p)));
    section.style.setProperty('--v51-copy-o',String(clamp(1-smooth(clamp((p-.69)/.18)))));
    root.style.setProperty('--v51-journey-opacity',String(lerp(.07,.64,architect)*(1-exit*.18)));
    railMat.opacity=lerp(.02,.2,architect)*(1-exit);
    rails.forEach((rail,i)=>{rail.rotation.z=vel*.009*(i?1:-1);});

    camera.position.x=pointer.x*.28+vel*.09;
    camera.position.y=-pointer.y*.17;
    camera.position.z=11.2-architect*.8;
    camera.fov=42+Math.min(4.8,Math.abs(vel)*3.3);camera.updateProjectionMatrix();
    camera.lookAt(0,lerp(.05,-.16,architect),lerp(0,-3.1,architect));
  }

  function paint(){
    raf=0;if(!active||contextLost||document.hidden)return;
    current=lerp(current,target,.12);vel=lerp(vel,velTarget,.12);velTarget*=.82;pointer.lerp(pointerTarget,.08);
    update(current);renderer.render(scene,camera);
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
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;root.classList.add('v51-fallback');},{once:true});
  addEventListener('resize',()=>{resize();ScrollTrigger.refresh();schedule();},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&active)schedule();});
  resize();trigger.refresh();requestAnimationFrame(()=>ScrollTrigger.refresh());
}

try{init();}catch(error){root.classList.add('v51-fallback');console.warn('MOVX v51.2 archive physics failed open',error);}
