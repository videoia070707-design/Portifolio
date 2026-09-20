/* MOVX v52 — archive deconstruction / process architecture
   Real work exits the archive case; the case itself then breaks into rails, frames and gates
   that become the spatial architecture of the Process chapter. */
import * as THREE from './vendor/three.module.min.js';

const root=document.documentElement;
root.classList.add('movx-v52');
root.dataset.movxProcessArchitecture='v52';
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
function escapeHTML(value=''){return String(value).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));}

function makeSection(items){
  const services=document.querySelector('.services-section');
  if(!services||document.querySelector('.v52-architecture-section')) return null;
  const section=document.createElement('section');
  section.className='v52-architecture-section';
  section.innerHTML=`<div class="v52-architecture-sticky">
    <canvas class="v52-architecture-canvas" aria-hidden="true"></canvas>
    <div class="v52-fallback-stage" aria-hidden="true"><div class="v52-fallback-case"></div>${items.slice(0,3).map(p=>`<img class="v52-fallback-art" src="${escapeHTML(p.cover)}" alt="">`).join('')}</div>
    <div class="v52-architecture-vignette" aria-hidden="true"></div>
    <div class="v52-architecture-copy"><div class="v52-architecture-kicker">ARQUIVO / DECONSTRUÇÃO</div><h2>O trabalho vira sistema</h2><p>As peças deixam o arquivo e a própria caixa se transforma na estrutura espacial do processo</p></div>
    <div class="v52-architecture-phase"><span>EXTRAÇÃO</span></div>
    <div class="v52-architecture-caption"><span></span></div>
    <div class="v52-architecture-meta"><span>ARQUIVO</span><i></i><span>PROCESSO</span></div>
    <div class="v52-mobile-artworks">${items.slice(0,3).map(p=>`<img src="${escapeHTML(p.cover)}" alt="${escapeHTML(p.client)} — ${escapeHTML(p.title)}" loading="lazy" decoding="async">`).join('')}</div>
  </div>`;
  services.insertAdjacentElement('afterend',section);
  return section;
}

function textTexture(text,{w=1024,h=256,font=138,weight=800,align='left'}={}){
  const c=document.createElement('canvas');c.width=w;c.height=h;
  const x=c.getContext('2d');x.clearRect(0,0,w,h);x.fillStyle='#f3eee9';x.font=`${weight} ${font}px Arial`;x.textBaseline='middle';x.textAlign=align;
  x.fillText(text,align==='center'?w/2:42,h/2);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;return t;
}

function makeArchiveCase(scene){
  const group=new THREE.Group();scene.add(group);
  const shell=new THREE.MeshStandardMaterial({color:0x171412,roughness:.64,metalness:.22,transparent:true,opacity:1});
  const inner=new THREE.MeshStandardMaterial({color:0x090808,roughness:.88,metalness:.02,transparent:true,opacity:1});
  const edge=new THREE.MeshStandardMaterial({color:0x2d2825,roughness:.44,metalness:.42,transparent:true,opacity:1});
  const accent=new THREE.MeshStandardMaterial({color:0xa73b2d,roughness:.38,metalness:.3,transparent:true,opacity:1});
  const pieces=[];
  const add=(name,geom,mat,pos)=>{const m=new THREE.Mesh(geom,mat);m.name=name;m.position.set(...pos);group.add(m);pieces.push(m);return m;};
  const back=add('back',new THREE.BoxGeometry(5.65,3.48,.18),shell,[0,0,-.56]);
  const left=add('left',new THREE.BoxGeometry(.18,3.52,1.12),edge,[-2.74,0,-.04]);
  const right=add('right',new THREE.BoxGeometry(.18,3.52,1.12),edge,[2.74,0,-.04]);
  const top=add('top',new THREE.BoxGeometry(5.35,.18,1.12),edge,[0,1.67,-.04]);
  const bottom=add('bottom',new THREE.BoxGeometry(5.35,.18,1.12),edge,[0,-1.67,-.04]);
  const inset=add('inset',new THREE.BoxGeometry(5.18,3.02,.10),inner,[0,0,.46]);
  const band=add('band',new THREE.BoxGeometry(.15,3.04,.16),accent,[-2.43,0,.52]);

  const lidPivot=new THREE.Group();lidPivot.position.set(0,1.78,.58);group.add(lidPivot);
  const lid=new THREE.Mesh(new THREE.BoxGeometry(5.72,3.54,.16),edge);lid.position.set(0,-1.77,0);lidPivot.add(lid);
  const logo=new THREE.Mesh(new THREE.PlaneGeometry(2.7,.72),new THREE.MeshBasicMaterial({map:textTexture('MOVX'),transparent:true,opacity:.9,depthWrite:false}));logo.position.set(0,-1.79,.09);lidPivot.add(logo);
  const hinge=new THREE.Mesh(new THREE.CylinderGeometry(.065,.065,5.24,18),accent);hinge.rotation.z=Math.PI/2;hinge.position.set(0,0,0);lidPivot.add(hinge);
  group.position.set(1.55,-.05,-.08);group.rotation.set(-.07,.22,-.018);

  const initial=new Map();
  [...pieces,lidPivot].forEach(obj=>initial.set(obj,{p:obj.position.clone(),r:obj.rotation.clone(),s:obj.scale.clone()}));
  return {group,pieces,back,left,right,top,bottom,inset,band,lidPivot,lid,logo,hinge,materials:[shell,inner,edge,accent],initial};
}

function createBendGeometry(){
  const g=new THREE.PlaneGeometry(1,1,22,16);g.userData.base=new Float32Array(g.attributes.position.array);return g;
}
function applyBend(mesh,bend,twist=0){
  const pos=mesh.geometry.attributes.position,base=mesh.geometry.userData.base;if(!base)return;
  for(let i=0;i<pos.count;i++){
    const x=base[i*3],y=base[i*3+1];
    const curve=(x*x-.25)*bend;
    const torsion=x*y*twist;
    const flutter=Math.sin((y+.5)*Math.PI)*x*bend*.08;
    pos.setXYZ(i,x,y,curve+torsion+flutter);
  }
  pos.needsUpdate=true;
}

function makeArtwork(scene,project,index){
  const group=new THREE.Group();scene.add(group);
  const frameMat=new THREE.MeshStandardMaterial({color:0x11100f,roughness:.72,metalness:.08,transparent:true,opacity:1});
  const frame=new THREE.Mesh(new THREE.BoxGeometry(1.08,1.08,.08),frameMat);group.add(frame);
  const geom=createBendGeometry();
  const mat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:true});
  const plane=new THREE.Mesh(geom,mat);plane.position.z=.055;group.add(plane);
  const accentColor=new THREE.Color(project.accent||'#a63a2c');
  const accent=new THREE.Mesh(new THREE.BoxGeometry(1,.028,.035),new THREE.MeshBasicMaterial({color:accentColor,transparent:true,opacity:1}));accent.position.set(0,-.56,.06);group.add(accent);
  const loader=new THREE.TextureLoader();
  loader.load(project.cover,tex=>{
    tex.colorSpace=THREE.SRGBColorSpace;tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;mat.map=tex;mat.needsUpdate=true;
    const img=tex.image||{};const aspect=(img.width&&img.height)?img.width/img.height:1;
    const h=2.58,w=Math.min(4.0,h*aspect);
    frame.scale.set(w+.14,h+.14,1);plane.scale.set(w,h,1);accent.scale.x=w+.08;accent.position.y=-(h/2+.055);
  },undefined,()=>{});
  group.userData={index,project,mat,plane,frameMat,accent};
  return group;
}

function makeGate(scene,label,index){
  const group=new THREE.Group();scene.add(group);
  const lineMat=new THREE.LineBasicMaterial({color:0xa79c94,transparent:true,opacity:0});
  const accentMat=new THREE.LineBasicMaterial({color:0xb84434,transparent:true,opacity:0});
  const pts=[
    -2.65,-1.55,0, 2.65,-1.55,0,
    2.65,-1.55,0, 2.65,1.55,0,
    2.65,1.55,0, -2.65,1.55,0,
    -2.65,1.55,0, -2.65,-1.55,0
  ];
  const g1=new THREE.BufferGeometry();g1.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));group.add(new THREE.LineSegments(g1,lineMat));
  const g2=new THREE.BufferGeometry();g2.setAttribute('position',new THREE.Float32BufferAttribute([-2.65,1.55,.02,-1.7,1.55,.02,-2.65,-1.55,.02,-2.65,-.58,.02],3));group.add(new THREE.LineSegments(g2,accentMat));
  const tex=textTexture(`${String(index+1).padStart(2,'0')}  ${label.toUpperCase()}`,{w:1536,h:256,font:112,weight:700});
  const textMat=new THREE.MeshBasicMaterial({map:tex,color:0xf1eae4,transparent:true,opacity:0,depthWrite:false});
  const text=new THREE.Mesh(new THREE.PlaneGeometry(4.55,.76),textMat);text.position.set(-.25,-1.13,.04);group.add(text);
  group.userData={lineMat,accentMat,textMat,index,label};return group;
}

function init(){
  const items=selectedProjects();
  const section=makeSection(items);
  if(!section||items.length<3)return;
  const phase=section.querySelector('.v52-architecture-phase span');
  const caption=section.querySelector('.v52-architecture-caption span');
  const processRows=[...document.querySelectorAll('#process .process-list li')];
  if(!desktop||reduced||!gsap||!ScrollTrigger){root.classList.add('v52-fallback');return;}
  gsap.registerPlugin(ScrollTrigger);

  const canvas=section.querySelector('.v52-architecture-canvas');
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});}catch(error){root.classList.add('v52-fallback');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x000000,0);
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(root.getAttribute('data-theme')==='dark'?0x0b0909:0xf1ece7,.025);
  const camera=new THREE.PerspectiveCamera(42,1,.1,90);camera.position.set(0,0,11.7);
  scene.add(new THREE.HemisphereLight(0xffffff,0x170f0d,1.25));
  const key=new THREE.DirectionalLight(0xffe8dc,2.15);key.position.set(4.8,6.6,8.5);scene.add(key);
  const red=new THREE.PointLight(0xb53a2d,4.8,24);red.position.set(-4.8,-2.1,5.4);scene.add(red);

  const box=makeArchiveCase(scene);
  const arts=items.map((p,i)=>makeArtwork(scene,p,i));
  arts.forEach((g,i)=>{g.position.set(1.5,-.18,.72-i*.04);g.scale.setScalar(.48);g.rotation.set(0,0,(i-1.5)*.018);});
  const processLabels=processRows.slice(0,5).map((row,i)=>row.querySelector('strong')?.textContent?.trim()||`ETAPA ${i+1}`);
  const gates=processLabels.map((label,i)=>makeGate(scene,label,i));
  gates.forEach((g,i)=>{g.position.set(i%2?1.05:-.85,(i-2)*.08,1.5-i*3.15);g.rotation.y=(i%2?-1:1)*.055;});

  const rails=[];
  const railMat=new THREE.LineBasicMaterial({color:0x92867f,transparent:true,opacity:0});
  [-2.82,2.82].forEach(x=>{
    const geom=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,-1.72,2.2),new THREE.Vector3(x,1.72,-15.8)]);
    const line=new THREE.Line(geom,railMat);scene.add(line);rails.push(line);
  });

  let target=0,current=0,vel=0,velTarget=0,active=false,raf=0,contextLost=false,currentCaption=-1,currentPhase='';
  const pointer=new THREE.Vector2(),pointerTarget=new THREE.Vector2();

  function resize(){
    const r=section.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,innerHeight),false);
    camera.aspect=Math.max(1,r.width)/Math.max(1,innerHeight);camera.updateProjectionMatrix();
  }
  function setCaption(index,opacity){
    if(index!==currentCaption&&items[index]){currentCaption=index;caption.textContent=`${items[index].client} — ${items[index].title}`;}
    section.style.setProperty('--v52-caption-o',String(opacity));section.style.setProperty('--v52-caption-y',`${lerp(10,0,opacity)}px`);
  }
  function setPhase(text,t){
    if(text!==currentPhase){currentPhase=text;phase.textContent=text;}
    section.style.setProperty('--v52-phase-line',String(lerp(.18,1,t)));
  }
  function setProcessCurrent(index){
    processRows.forEach((row,i)=>row.classList.toggle('v52-process-current',i===index));
  }
  function deconstructBox(t,exit){
    const ease=smooth(t);
    const move=(obj,toP,toR,toS=1)=>{
      const a=box.initial.get(obj);if(!a)return;
      obj.position.lerpVectors(a.p,toP,ease);
      obj.rotation.set(lerp(a.r.x,toR.x,ease),lerp(a.r.y,toR.y,ease),lerp(a.r.z,toR.z,ease));
      const s=lerp(1,toS,ease)*(1-exit*.18);obj.scale.setScalar(s);
    };
    move(box.left,new THREE.Vector3(-3.0,.05,-2.5),new THREE.Euler(0,.05,.018),.96);
    move(box.right,new THREE.Vector3(3.0,-.02,-5.2),new THREE.Euler(0,-.05,-.018),.96);
    move(box.top,new THREE.Vector3(.0,1.9,-7.4),new THREE.Euler(.03,0,0),1.02);
    move(box.bottom,new THREE.Vector3(.0,-1.9,-10.0),new THREE.Euler(-.03,0,0),1.02);
    move(box.back,new THREE.Vector3(0,.02,-12.8),new THREE.Euler(0,0,0),.9);
    move(box.inset,new THREE.Vector3(0,.0,-8.8),new THREE.Euler(0,0,0),.82);
    move(box.band,new THREE.Vector3(-2.52,.0,-14.2),new THREE.Euler(0,0,0),1.08);
    move(box.lidPivot,new THREE.Vector3(0,1.8,-6.2),new THREE.Euler(-1.42,0,0),.9);
    box.materials.forEach(m=>m.opacity=clamp(1-exit*.85));
    box.logo.material.opacity=clamp(.9*(1-ease*.68-exit));
  }

  function update(p){
    const rise=smooth(clamp(p/.15));
    const open=smooth(clamp((p-.09)/.20));
    const fan=smooth(clamp((p-.23)/.36));
    const deconstruct=smooth(clamp((p-.60)/.18));
    const corridorT=smooth(clamp((p-.68)/.18));
    const processT=smooth(clamp((p-.76)/.16));
    const exit=smooth(clamp((p-.91)/.09));

    box.group.position.y=lerp(-1.0,.08,rise)-exit*.4;
    box.group.position.z=lerp(-4.0,.08,rise)-deconstruct*.35-exit*2.6;
    box.group.rotation.y=.22+pointer.x*.055+vel*.025;
    box.group.rotation.x=-.07+pointer.y*.03;
    box.group.scale.setScalar(lerp(.74,.92,rise)*(1-exit*.12));
    box.lidPivot.rotation.x=lerp(0,-1.42,open);
    deconstructBox(deconstruct,exit);

    let nearest=0,nearestDist=9;
    arts.forEach((g,i)=>{
      const start=.21+i*.06,end=start+.32;
      const e=smooth(clamp((p-start)/(end-start)));
      const side=i%2?-1:1,rank=i-1.5;
      const fanX=side*(1.45+Math.abs(rank)*.46)+1.0;
      const fanY=rank*.48+e*.18;
      const fanZ=2.65+Math.abs(rank)*.28;
      const corridorX=side*(.76+Math.abs(rank)*.12);
      const corridorY=rank*.15;
      const corridorZ=1.4-i*3.05;
      g.userData.mat.opacity=clamp(e*(1-exit*.97));
      g.userData.frameMat.opacity=clamp(1-exit*.75);
      g.position.x=lerp(lerp(1.45,fanX,e),corridorX,corridorT);
      g.position.y=lerp(lerp(-.14,fanY,e),corridorY,corridorT)-exit*.25;
      g.position.z=lerp(lerp(.65,fanZ,e),corridorZ,corridorT)-exit*2.2;
      g.rotation.y=lerp(lerp(0,side*(-.17-rank*.02),e),side*.055,corridorT)+pointer.x*.025;
      g.rotation.x=lerp(pointer.y*-.02+vel*.012,-.015,corridorT);
      g.rotation.z=lerp(lerp((i-1.5)*.018,rank*.042,e),0,corridorT);
      g.scale.setScalar(lerp(.48,.96,e)*(1-exit*.12));
      const bend=(1-corridorT)*(0.095*(1-e)+Math.abs(vel)*.07)+corridorT*.018;
      const twist=(1-corridorT)*(side*.055*e+vel*.018);
      applyBend(g.userData.plane,bend,twist);
      const d=Math.abs(p-(start+.18));if(d<nearestDist){nearestDist=d;nearest=i;}
    });

    rails.forEach((line,i)=>{line.material.opacity=lerp(0,.18,corridorT)*(1-exit);line.rotation.z=(i?1:-1)*vel*.008;});
    gates.forEach((g,i)=>{
      const local=smooth(clamp((corridorT-(i*.055))/Math.max(.001,1-i*.055)));
      const focus=clamp(1-Math.abs(processT-i/Math.max(1,gates.length-1))/.27,0,1);
      g.userData.lineMat.opacity=(.025+local*.13+focus*.12)*(1-exit);
      g.userData.accentMat.opacity=(.02+local*.16+focus*.18)*(1-exit);
      g.userData.textMat.opacity=(.018+local*.10+focus*.22)*(1-exit);
      g.scale.setScalar(.94+focus*.08);
    });

    const processIndex=processRows.length?Math.min(processRows.length-1,Math.max(0,Math.round(processT*(processRows.length-1)))):-1;
    setProcessCurrent(corridorT>.62&&!exit?processIndex:-1);
    const captionOpacity=clamp(fan*(1-corridorT)*(1-exit)*1.3,0,1);setCaption(nearest,captionOpacity);
    section.style.setProperty('--v52-progress',String(clamp(p)));
    root.style.setProperty('--v52-journey-opacity',String(lerp(.05,.76,processT)*(1-exit*.15)));
    if(p<.24)setPhase('ABERTURA',rise);else if(p<.58)setPhase('EXTRAÇÃO',fan);else if(p<.76)setPhase('DECONSTRUÇÃO',deconstruct);else setPhase('PROCESSO',processT);

    camera.position.x=pointer.x*.22+vel*.07;
    camera.position.y=-pointer.y*.13;
    camera.position.z=11.7-corridorT*.9-processT*.25;
    camera.fov=42+Math.min(4.2,Math.abs(vel)*3);camera.updateProjectionMatrix();
    camera.lookAt(lerp(.45,0,corridorT),lerp(.05,-.12,processT),lerp(.1,-3.8,processT));
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
    onEnter(){active=true;root.classList.add('v52-architecture-active');resize();schedule();},
    onEnterBack(){active=true;root.classList.add('v52-architecture-active');resize();schedule();},
    onLeave(){active=false;root.classList.remove('v52-architecture-active');root.style.removeProperty('--v52-journey-opacity');setProcessCurrent(-1);if(raf){cancelAnimationFrame(raf);raf=0;}},
    onLeaveBack(){active=false;root.classList.remove('v52-architecture-active');root.style.removeProperty('--v52-journey-opacity');setProcessCurrent(-1);if(raf){cancelAnimationFrame(raf);raf=0;}},
    onUpdate(self){target=self.progress;velTarget=clamp(self.getVelocity()/2200,-1.2,1.2);schedule();}
  });
  if(fine){
    section.addEventListener('pointermove',e=>{pointerTarget.set(clamp((e.clientX/innerWidth-.5)*2,-1,1),clamp((e.clientY/innerHeight-.5)*2,-1,1));schedule();},{passive:true});
    section.addEventListener('pointerleave',()=>{pointerTarget.set(0,0);schedule();},{passive:true});
  }
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;root.classList.add('v52-fallback');setProcessCurrent(-1);},{once:true});
  let resizeRaf=0;
  addEventListener('resize',()=>{if(resizeRaf)return;resizeRaf=requestAnimationFrame(()=>{resizeRaf=0;resize();ScrollTrigger.refresh();schedule();});},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&active)schedule();});
  resize();trigger.refresh();requestAnimationFrame(()=>ScrollTrigger.refresh());
}

try{init();}catch(error){root.classList.add('v52-fallback');console.warn('MOVX v52 process architecture failed open',error);}
