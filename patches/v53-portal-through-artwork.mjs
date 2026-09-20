/* MOVX v53 — artwork portal / object-to-scene transition
   One real portfolio artwork becomes a full-screen spatial wall, opens as a portal,
   and lets the Process architecture appear through it. */
import * as THREE from './vendor/three.module.min.js';

const root=document.documentElement;
root.classList.add('movx-v53');
root.dataset.movxArtworkPortal='v53';
const gsap=window.gsap, ScrollTrigger=window.ScrollTrigger;
const reduced=new URLSearchParams(location.search).has('static')||matchMedia('(prefers-reduced-motion: reduce)').matches;
const desktop=matchMedia('(min-width:981px)').matches;
const fine=matchMedia('(pointer:fine)').matches;
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);

function escapeHTML(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function project(){
  const all=Array.isArray(window.MOVX_PROJECTS)?window.MOVX_PROJECTS:[];
  return all.find(p=>p.slug==='motionhub')||all.find(p=>p.slug==='voltara-operacoes')||all[0]||null;
}
function processData(process){
  return [...process.querySelectorAll('.process-list li')].slice(0,5).map((row,index)=>({
    index,
    title:row.querySelector('strong')?.textContent?.trim()||`Etapa ${index+1}`,
    body:row.querySelector('p')?.textContent?.trim()||''
  }));
}
function makeSequence(process,p,steps){
  if(process.querySelector('.v53-portal-sequence')) return process.querySelector('.v53-portal-sequence');
  const first=steps[0]||{title:'Diagnóstico',body:''};
  const section=document.createElement('div');
  section.className='v53-portal-sequence';
  section.innerHTML=`<div class="v53-portal-sticky">
    <div class="v53-process-preview" aria-hidden="true">
      <div class="v53-process-preview__eyebrow">PROCESSO / 01</div>
      <div class="v53-process-preview__title">Processo</div>
      <div class="v53-process-preview__step"><span>01</span><strong>${escapeHTML(first.title)}</strong><p>${escapeHTML(first.body)}</p></div>
      <div class="v53-process-preview__rail"></div>
    </div>
    <div class="v53-portal-fallback" aria-hidden="true"><img src="${escapeHTML(p.cover)}" alt=""></div>
    <canvas class="v53-portal-canvas" aria-hidden="true"></canvas>
    <div class="v53-portal-vignette" aria-hidden="true"></div>
    <div class="v53-portal-copy" aria-hidden="true"><span>ATRAVESSAR</span><i></i><span>PROCESSO</span></div>
  </div>`;
  process.insertBefore(section,process.firstChild);
  process.classList.add('v53-portal-host');
  return section;
}

function textTexture(text){
  const c=document.createElement('canvas');c.width=1536;c.height=280;
  const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);x.fillStyle='#f1eae4';x.font='700 116px Arial';x.textBaseline='middle';x.fillText(String(text).toUpperCase(),38,c.height/2);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;return t;
}
function makeGate(scene,label,index){
  const group=new THREE.Group();scene.add(group);
  const lineMat=new THREE.LineBasicMaterial({color:0xa69b94,transparent:true,opacity:0});
  const accentMat=new THREE.LineBasicMaterial({color:0xb94736,transparent:true,opacity:0});
  const pts=[-3.05,-1.8,0,3.05,-1.8,0,3.05,-1.8,0,3.05,1.8,0,3.05,1.8,0,-3.05,1.8,0,-3.05,1.8,0,-3.05,-1.8,0];
  const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));group.add(new THREE.LineSegments(geom,lineMat));
  const aGeom=new THREE.BufferGeometry();aGeom.setAttribute('position',new THREE.Float32BufferAttribute([-3.05,1.8,.02,-1.85,1.8,.02,-3.05,-1.8,.02,-3.05,-.55,.02],3));group.add(new THREE.LineSegments(aGeom,accentMat));
  const tex=textTexture(`${String(index+1).padStart(2,'0')}  ${label}`);
  const textMat=new THREE.MeshBasicMaterial({map:tex,color:root.getAttribute('data-theme')==='dark'?0xf1eae4:0x2b2724,transparent:true,opacity:0,depthWrite:false});
  const text=new THREE.Mesh(new THREE.PlaneGeometry(5.15,.94),textMat);text.position.set(-.25,-1.35,.04);group.add(text);
  group.userData={lineMat,accentMat,textMat,index};
  return group;
}
function makePortalMaterial(texture,accent){
  return new THREE.ShaderMaterial({
    transparent:true,
    depthWrite:false,
    side:THREE.DoubleSide,
    uniforms:{
      uMap:{value:texture},uTexAspect:{value:1},uPlaneAspect:{value:1},uPortal:{value:0},uOpacity:{value:0},uVelocity:{value:0},uBend:{value:.08},uAccent:{value:new THREE.Color(accent||'#a63a2c')}
    },
    vertexShader:`
      varying vec2 vUv;
      uniform float uBend;
      uniform float uVelocity;
      void main(){
        vUv=uv;
        vec3 p=position;
        float edge=pow(abs(uv.x-.5)*2.0,2.0);
        float vertical=sin(uv.y*3.14159265);
        p.z += edge*uBend + vertical*uVelocity*.035;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
      }
    `,
    fragmentShader:`
      varying vec2 vUv;
      uniform sampler2D uMap;
      uniform float uTexAspect;
      uniform float uPlaneAspect;
      uniform float uPortal;
      uniform float uOpacity;
      uniform float uVelocity;
      uniform vec3 uAccent;
      vec2 coverUv(vec2 uv){
        vec2 c=uv-.5;
        if(uPlaneAspect>uTexAspect) c.y*=uTexAspect/uPlaneAspect;
        else c.x*=uPlaneAspect/uTexAspect;
        return c+.5;
      }
      void main(){
        vec2 uv=coverUv(vUv);
        float shift=clamp(abs(uVelocity)*.008,0.0,.012);
        float r=texture2D(uMap,uv+vec2(shift,0.)).r;
        float g=texture2D(uMap,uv).g;
        float b=texture2D(uMap,uv-vec2(shift,0.)).b;
        vec4 base=texture2D(uMap,uv);
        base.rgb=vec3(r,g,b);
        vec2 d=(vUv-.5)*vec2(1.0,.92);
        float dist=length(d);
        float radius=mix(0.0,.46,uPortal);
        float hole=(1.0-smoothstep(radius,radius+.055,dist))*uPortal;
        float ring=(smoothstep(radius-.02,radius,dist)-smoothstep(radius,radius+.028,dist))*uPortal;
        base.rgb+=uAccent*ring*.9;
        float edgeFade=smoothstep(.0,.035,uv.x)*smoothstep(.0,.035,uv.y)*smoothstep(.0,.035,1.0-uv.x)*smoothstep(.0,.035,1.0-uv.y);
        gl_FragColor=vec4(base.rgb,base.a*uOpacity*(1.0-hole)*edgeFade);
      }
    `
  });
}

function initFallback(sequence){
  if(!gsap||!ScrollTrigger||reduced) return;
  const img=sequence.querySelector('.v53-portal-fallback img');
  const preview=sequence.querySelector('.v53-process-preview');
  if(!img||!preview) return;
  gsap.registerPlugin(ScrollTrigger);
  const tl=gsap.timeline({scrollTrigger:{trigger:sequence,start:'top top',end:'bottom bottom',scrub:1.05,invalidateOnRefresh:true}});
  tl.fromTo(img,{scale:.38,rotationX:8,rotationY:-9,rotationZ:-2,opacity:0},{scale:.72,rotationX:3,rotationY:-4,rotationZ:-1,opacity:1,duration:.28,ease:'none'},0)
    .to(img,{scale:1.22,rotationX:0,rotationY:0,rotationZ:0,duration:.28,ease:'none'},.30)
    .to(img,{scale:1.36,rotationX:0,rotationY:0,rotationZ:0,duration:.18,ease:'none'},.58)
    .to(img,{scale:1.48,opacity:0,duration:.16,ease:'none'},.84)
    .fromTo(preview,{opacity:0,scale:.94},{opacity:1,scale:1,duration:.26,ease:'none'},.62);
  ScrollTrigger.create({trigger:sequence,start:'top top',end:'bottom bottom',onUpdate:self=>{const through=smooth(clamp((self.progress-.57)/.26));sequence.style.setProperty('--v53-hole',`${through*48}%`);}});
}

function init(){
  const process=document.querySelector('#process.process-section')||document.querySelector('.process-section');
  const p=project();
  if(!process||!p) return;
  const steps=processData(process);
  const sequence=makeSequence(process,p,steps);
  initFallback(sequence);
  if(!desktop||reduced||!gsap||!ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const canvas=sequence.querySelector('.v53-portal-canvas');
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});}catch(error){root.classList.add('v53-portal-fallback');return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x000000,0);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(43,1,.1,60);camera.position.set(0,0,8.4);

  const gates=steps.map((step,index)=>makeGate(scene,step.title,index));
  gates.forEach((g,i)=>{g.position.set(i%2?.75:-.55,(i-2)*.05,-1.6-i*3.1);g.rotation.y=(i%2?-1:1)*.045;});
  const rails=[];
  const railMat=new THREE.LineBasicMaterial({color:0x968b84,transparent:true,opacity:0});
  [-3.3,3.3].forEach(x=>{const geom=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,-2.15,.4),new THREE.Vector3(x,2.15,-16)]);const line=new THREE.Line(geom,railMat);scene.add(line);rails.push(line);});

  const loader=new THREE.TextureLoader();
  const placeholder=new THREE.Texture();
  const portalMat=makePortalMaterial(placeholder,p.accent||'#a63a2c');
  const portal=new THREE.Mesh(new THREE.PlaneGeometry(1,1,32,24),portalMat);scene.add(portal);
  portal.position.set(.9,-.1,-2.8);portal.rotation.set(-.06,-.16,-.025);
  loader.load(p.cover,tex=>{
    tex.colorSpace=THREE.SRGBColorSpace;tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;
    portalMat.uniforms.uMap.value=tex;
    const img=tex.image||{};portalMat.uniforms.uTexAspect.value=(img.width&&img.height)?img.width/img.height:1;
    portalMat.needsUpdate=true;schedule();
  },undefined,()=>{root.classList.add('v53-portal-fallback');});

  let target=0,current=0,velocity=0,velocityTarget=0,raf=0,active=false,contextLost=false,painted=false;
  const pointer=new THREE.Vector2(),pointerTarget=new THREE.Vector2();
  let viewportW=12,viewportH=7;
  function resize(){
    renderer.setSize(Math.max(1,innerWidth),Math.max(1,innerHeight),false);camera.aspect=Math.max(1,innerWidth)/Math.max(1,innerHeight);camera.updateProjectionMatrix();
    const dist=camera.position.z;
    viewportH=2*Math.tan(THREE.MathUtils.degToRad(camera.fov*.5))*dist;
    viewportW=viewportH*camera.aspect;
    portalMat.uniforms.uPlaneAspect.value=viewportW/viewportH;
  }
  function update(pct){
    const arrive=smooth(clamp((pct-.03)/.30));
    const wall=smooth(clamp((pct-.29)/.31));
    const through=smooth(clamp((pct-.57)/.26));
    const resolve=smooth(clamp((pct-.78)/.20));
    const planeW=lerp(viewportW*.30,viewportW*1.16,wall);
    const planeH=lerp(viewportH*.34,viewportH*1.16,wall);
    portal.scale.set(planeW,planeH,1);
    portal.position.x=lerp(.95,0,wall)+pointer.x*.12*(1-through);
    portal.position.y=lerp(-.28,0,wall)-pointer.y*.07*(1-through);
    portal.position.z=lerp(-3.4,5.95,wall)+through*2.15;
    portal.rotation.x=lerp(-.08,0,wall)+pointer.y*.018*(1-through);
    portal.rotation.y=lerp(-.20,0,wall)+pointer.x*.025*(1-through);
    portal.rotation.z=lerp(-.035,0,wall)+velocity*.004;
    portalMat.uniforms.uOpacity.value=clamp(arrive*(1-resolve*.96));
    portalMat.uniforms.uPortal.value=through;
    portalMat.uniforms.uVelocity.value=velocity;
    portalMat.uniforms.uBend.value=lerp(.22,.015,wall)+Math.abs(velocity)*.045;

    const processDepth=smooth(clamp((pct-.54)/.42));
    gates.forEach((g,i)=>{
      const local=smooth(clamp((processDepth-i*.07)/Math.max(.001,1-i*.07)));
      const focus=clamp(1-Math.abs(processDepth-i/Math.max(1,gates.length-1))/.34,0,1);
      g.userData.lineMat.opacity=(.03+local*.13+focus*.17)*through;
      g.userData.accentMat.opacity=(.02+local*.16+focus*.20)*through;
      g.userData.textMat.opacity=(.015+local*.12+focus*.24)*through;
      g.scale.setScalar(.94+focus*.09);
    });
    railMat.opacity=.03+through*.17;
    rails.forEach((r,i)=>r.rotation.z=(i?1:-1)*velocity*.007);
    camera.position.x=pointer.x*.14+velocity*.04;
    camera.position.y=-pointer.y*.08;
    camera.position.z=8.4-through*.65-resolve*.22;
    camera.fov=43+Math.min(4,Math.abs(velocity)*2.8);camera.updateProjectionMatrix();
    camera.lookAt(0,-.04,lerp(-3.5,-6.2,processDepth));

    sequence.style.setProperty('--v53-progress',String(pct));
    sequence.style.setProperty('--v53-reveal',String(through));
    sequence.style.setProperty('--v53-wall',String(wall));
    sequence.style.setProperty('--v53-resolve',String(resolve));
    sequence.style.setProperty('--v53-hole',`${through*48}%`);
    root.style.setProperty('--v53-grid-o',String(clamp(through*(1-resolve*.25))));
    root.style.setProperty('--v53-title-o',String(clamp(.35+resolve*.65)));
    root.style.setProperty('--v53-list-y',`${lerp(54,0,resolve)}px`);
    root.style.setProperty('--v53-list-z',`${lerp(-120,0,resolve)}px`);
    root.style.setProperty('--v53-list-rx',`${lerp(4.5,0,resolve)}deg`);
    process.classList.toggle('v53-portal-through',through>.22&&resolve<.98);
  }
  function paint(){
    raf=0;if(!active||contextLost||document.hidden)return;
    current=lerp(current,target,.13);velocity=lerp(velocity,velocityTarget,.12);velocityTarget*=.82;pointer.lerp(pointerTarget,.08);
    update(current);renderer.render(scene,camera);
    if(!painted){painted=true;root.classList.add('v53-portal-painted');}
    if(Math.abs(current-target)>.0007||Math.abs(velocity)>.003||Math.abs(velocityTarget)>.003||pointer.distanceTo(pointerTarget)>.002)schedule();
  }
  function schedule(){if(!raf&&active&&!contextLost&&!document.hidden)raf=requestAnimationFrame(paint);}
  const trigger=ScrollTrigger.create({
    trigger:sequence,start:'top top',end:'bottom bottom',invalidateOnRefresh:true,
    onRefresh(){resize();},
    onEnter(){active=true;root.classList.add('v53-portal-active');resize();schedule();},
    onEnterBack(){active=true;root.classList.add('v53-portal-active');resize();schedule();},
    onLeave(){active=false;root.classList.remove('v53-portal-active');process.classList.remove('v53-portal-through');if(raf){cancelAnimationFrame(raf);raf=0;}},
    onLeaveBack(){active=false;root.classList.remove('v53-portal-active');process.classList.remove('v53-portal-through');if(raf){cancelAnimationFrame(raf);raf=0;}},
    onUpdate(self){target=self.progress;velocityTarget=clamp(self.getVelocity()/2300,-1.15,1.15);if(self.isActive&&!active){active=true;resize();}schedule();}
  });
  if(fine){sequence.addEventListener('pointermove',e=>{pointerTarget.set(clamp((e.clientX/innerWidth-.5)*2,-1,1),clamp((e.clientY/innerHeight-.5)*2,-1,1));schedule();},{passive:true});sequence.addEventListener('pointerleave',()=>{pointerTarget.set(0,0);schedule();},{passive:true});}
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;root.classList.remove('v53-portal-painted');root.classList.add('v53-portal-fallback');},{once:true});
  let resizeRaf=0;addEventListener('resize',()=>{if(resizeRaf)return;resizeRaf=requestAnimationFrame(()=>{resizeRaf=0;resize();ScrollTrigger.refresh();schedule();});},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&active)schedule();});
  new MutationObserver(muts=>{if(muts.some(m=>m.attributeName==='data-theme')){gates.forEach(g=>g.userData.textMat.color.setHex(root.getAttribute('data-theme')==='dark'?0xf1eae4:0x2b2724));schedule();}}).observe(root,{attributes:true,attributeFilter:['data-theme']});
  resize();trigger.refresh();requestAnimationFrame(()=>ScrollTrigger.refresh());
}

try{init();}catch(error){root.classList.add('v53-portal-fallback');console.warn('MOVX v53 artwork portal failed open',error);}
