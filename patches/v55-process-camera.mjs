/* MOVX v55 — Process camera journey
   Native scroll turns the existing five semantic process rows into a spatial editorial sequence.
   A light Three.js corridor supports depth; the readable DOM remains the source of truth. */
import * as THREE from './vendor/three.module.min.js';

const root=document.documentElement;
root.classList.add('movx-v55');
root.dataset.movxProcessJourney='v55-camera';
const reduced=new URLSearchParams(location.search).has('static')||matchMedia('(prefers-reduced-motion: reduce)').matches;
const desktop=matchMedia('(min-width:981px)').matches;
const fine=matchMedia('(pointer:fine)').matches;
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);

function textTexture(text,{w=640,h=220,font=132}={}){
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,w,h);ctx.fillStyle='#f1e9e3';ctx.font=`700 ${font}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,w/2,h/2);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;return texture;
}
function buildJourney(process){
  const container=process.querySelector(':scope > .container.process-grid')||process.querySelector('.container.process-grid');
  if(!container) return null;
  const existing=process.querySelector('.v55-process-journey');if(existing) return {journey:existing,container};
  const journey=document.createElement('div');journey.className='v55-process-journey';
  const canvas=document.createElement('canvas');canvas.className='v55-process-canvas';canvas.setAttribute('aria-hidden','true');
  const hud=document.createElement('div');hud.className='v55-process-hud';hud.setAttribute('aria-hidden','true');hud.innerHTML='<span>ETAPA <b>01</b></span><i></i><span>05</span>';
  const depth=document.createElement('div');depth.className='v55-process-depth';depth.setAttribute('aria-hidden','true');depth.textContent='PROFUNDIDADE / MÉTODO';
  const outro=document.createElement('div');outro.className='v55-process-outro';outro.setAttribute('aria-hidden','true');outro.textContent='Do diagnóstico à revisão, cada decisão reduz ruído antes da próxima etapa.';
  process.insertBefore(journey,container);journey.append(canvas,hud,depth,outro,container);
  return {journey,container,canvas,hud,depth,outro};
}
function makeGate(scene,index){
  const group=new THREE.Group();scene.add(group);
  const lineMat=new THREE.LineBasicMaterial({color:0x8f857f,transparent:true,opacity:0});
  const accentMat=new THREE.LineBasicMaterial({color:0xb84434,transparent:true,opacity:0});
  const pts=[-3.15,-1.8,0,3.15,-1.8,0,3.15,-1.8,0,3.15,1.8,0,3.15,1.8,0,-3.15,1.8,0,-3.15,1.8,0,-3.15,-1.8,0];
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));group.add(new THREE.LineSegments(geometry,lineMat));
  const accentGeometry=new THREE.BufferGeometry();accentGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-3.15,1.8,.02,-2.0,1.8,.02,-3.15,-1.8,.02,-3.15,-.58,.02],3));group.add(new THREE.LineSegments(accentGeometry,accentMat));
  const numberMat=new THREE.MeshBasicMaterial({map:textTexture(String(index+1).padStart(2,'0')),transparent:true,opacity:0,depthWrite:false,color:root.getAttribute('data-theme')==='dark'?0xf1e9e3:0x2c2724});
  const number=new THREE.Mesh(new THREE.PlaneGeometry(1.28,.46),numberMat);number.position.set(2.35,1.38,.03);group.add(number);
  group.userData={lineMat,accentMat,numberMat,index};return group;
}
function makeRail(scene,x){
  const geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,-2.08,2),new THREE.Vector3(x,2.08,-17)]);
  const material=new THREE.LineBasicMaterial({color:0x8f857f,transparent:true,opacity:0});
  const line=new THREE.Line(geometry,material);scene.add(line);return line;
}

function init(){
  const process=document.querySelector('#process.process-section');if(!process)return;
  const rows=[...process.querySelectorAll('.process-list li')].slice(0,5);if(rows.length<3)return;
  const built=buildJourney(process);if(!built)return;
  const {journey,canvas,hud}=built;
  const counter=hud.querySelector('b');
  const contact=document.querySelector('#contact');if(contact)contact.classList.add('v55-contact-entry');
  rows.forEach((row,index)=>row.dataset.v55Step=String(index+1));
  if(!desktop||reduced){rows.forEach(row=>row.classList.remove('v55-current'));return;}

  let renderer,scene,camera,gates=[],rails=[];
  try{
    renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.45));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x000000,0);
    scene=new THREE.Scene();scene.fog=new THREE.FogExp2(root.getAttribute('data-theme')==='dark'?0x0a0808:0xf1ece7,.029);
    camera=new THREE.PerspectiveCamera(44,1,.1,80);camera.position.set(0,0,8.8);
    gates=rows.map((_,i)=>makeGate(scene,i));
    gates.forEach((gate,i)=>{gate.position.set(i%2?.38:-.32,(i-2)*.05,-i*3.25);gate.rotation.y=(i%2?-1:1)*.035;});
    rails=[makeRail(scene,-3.42),makeRail(scene,3.42)];
  }catch(error){root.classList.add('v55-fallback');return;}

  let target=0,current=0,velocity=0,lastY=scrollY,lastTime=performance.now(),active=false,raf=0;
  let px=0,py=0,tpx=0,tpy=0,lastActive=-1,contextLost=false;
  const processCount=rows.length;

  function progress(){const rect=journey.getBoundingClientRect(),travel=Math.max(1,journey.offsetHeight-innerHeight);return clamp(-rect.top/travel,0,1);}
  function resize(){if(contextLost)return;renderer.setSize(Math.max(1,innerWidth),Math.max(1,innerHeight),false);camera.aspect=Math.max(1,innerWidth)/Math.max(1,innerHeight);camera.updateProjectionMatrix();}
  function updateDom(p){
    const exit=smooth(clamp((p-.91)/.09));
    const usable=clamp(p/.91,0,1);
    const step=usable*(processCount-1);
    const nearest=Math.max(0,Math.min(processCount-1,Math.round(step)));
    if(nearest!==lastActive){lastActive=nearest;rows.forEach((row,i)=>row.classList.toggle('v55-current',i===nearest));if(counter)counter.textContent=String(nearest+1).padStart(2,'0');}
    rows.forEach((row,i)=>{
      const delta=i-step;
      const ahead=Math.max(0,delta),past=Math.max(0,-delta);
      const z=ahead*-340+past*260;
      const y=delta*86-past*42;
      const x=(i%2?1:-1)*Math.min(28,ahead*9)+px*6*(1-Math.min(1,Math.abs(delta)));
      const opacity=delta<0?clamp(1-past*1.6,0,1):clamp(1-ahead*.31,0,1);
      const scale=1-Math.min(.12,ahead*.032)-Math.min(.08,past*.07);
      const rotateX=clamp(delta*2.7,-6,8)+velocity*.5;
      const rotateY=(i%2?1:-1)*Math.min(2.2,ahead*.7)+px*.35;
      row.style.setProperty('--v55-row-x',`${x}px`);
      row.style.setProperty('--v55-row-y',`calc(-50% + ${y}px)`);
      row.style.setProperty('--v55-row-z',`${z}px`);
      row.style.setProperty('--v55-row-rx',`${rotateX}deg`);
      row.style.setProperty('--v55-row-ry',`${rotateY}deg`);
      row.style.setProperty('--v55-row-scale',String(scale));
      row.style.setProperty('--v55-row-o',String(opacity*(1-exit)));
      row.style.setProperty('--v55-row-rule',String(clamp(1-Math.abs(delta)*.9,.2,1)));
    });
    const local=step-nearest;
    journey.style.setProperty('--v55-focus',String(1-exit));
    journey.style.setProperty('--v55-step-progress',String(clamp(step/(processCount-1))));
    journey.style.setProperty('--v55-top-rule',String(clamp(.18+usable*.82)));
    journey.style.setProperty('--v55-title-o',String(clamp(1-exit*1.15)));
    journey.style.setProperty('--v55-title-y',`${-exit*28}px`);
    journey.style.setProperty('--v55-stage-o',String(1-exit*.96));
    journey.style.setProperty('--v55-canvas-o',String(1-exit));
    journey.style.setProperty('--v55-depth-o',String(.42+.36*(1-Math.abs(local))));
    journey.style.setProperty('--v55-outro-o',String(clamp((p-.79)/.11)*(1-exit)));
    journey.style.setProperty('--v55-outro-y',`${lerp(10,0,clamp((p-.79)/.11))}px`);
    root.style.setProperty('--v55-contact-rule',String(exit));
    root.dataset.v55Step=String(nearest+1);
  }
  function updateWebGL(p){
    if(contextLost)return;
    const exit=smooth(clamp((p-.91)/.09));
    const usable=clamp(p/.91,0,1);
    const step=usable*(processCount-1);
    const worldZ=step*3.25;
    gates.forEach((gate,i)=>{
      const delta=i-step;
      const focus=clamp(1-Math.abs(delta)/1.08,0,1);
      const visible=clamp(1-Math.abs(delta)/2.7,0,1)*(1-exit);
      gate.userData.lineMat.opacity=.035+visible*.12+focus*.19;
      gate.userData.accentMat.opacity=.018+visible*.12+focus*.28;
      gate.userData.numberMat.opacity=.012+visible*.08+focus*.28;
      gate.scale.setScalar(.97+focus*.035);
    });
    rails.forEach((rail,i)=>{rail.material.opacity=(.05+usable*.13)*(1-exit);rail.rotation.z=(i?1:-1)*velocity*.006;});
    camera.position.x=px*.18+velocity*.035;
    camera.position.y=-py*.10;
    camera.position.z=8.8-worldZ;
    camera.fov=44+Math.min(4,Math.abs(velocity)*1.6);camera.updateProjectionMatrix();
    camera.lookAt(px*.06,-.08,-worldZ-4.8);
    renderer.render(scene,camera);
  }
  function tick(){
    raf=0;if(!active||document.hidden)return;
    current=lerp(current,target,.14);px=lerp(px,tpx,.08);py=lerp(py,tpy,.08);velocity*=.84;
    updateDom(current);updateWebGL(current);
    if(Math.abs(current-target)>.0006||Math.abs(velocity)>.004||Math.abs(px-tpx)>.002||Math.abs(py-tpy)>.002)schedule();
  }
  function schedule(){if(!raf&&active&&!document.hidden)raf=requestAnimationFrame(tick);}
  function sync(){const now=performance.now(),dt=Math.max(16,now-lastTime),dy=scrollY-lastY;lastY=scrollY;lastTime=now;velocity=clamp(dy/dt,-2.4,2.4);target=progress();schedule();}

  const observer=new IntersectionObserver(entries=>{active=entries.some(e=>e.isIntersecting);if(active){target=progress();resize();schedule();}else if(raf){cancelAnimationFrame(raf);raf=0;}},{rootMargin:'32% 0px 32% 0px',threshold:0});
  observer.observe(journey);
  addEventListener('scroll',sync,{passive:true});
  addEventListener('resize',()=>{resize();target=progress();schedule();},{passive:true});
  if(fine){journey.addEventListener('pointermove',e=>{tpx=clamp((e.clientX/innerWidth-.5)*2,-1,1);tpy=clamp((e.clientY/innerHeight-.5)*2,-1,1);schedule();},{passive:true});journey.addEventListener('pointerleave',()=>{tpx=0;tpy=0;schedule();},{passive:true});}
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;root.classList.add('v55-fallback');rows.forEach(row=>{row.style.removeProperty('--v55-row-o');row.style.removeProperty('--v55-row-z');});},{once:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&active){target=progress();schedule();}});
  new MutationObserver(muts=>{if(muts.some(m=>m.attributeName==='data-theme')){scene.fog.color.setHex(root.getAttribute('data-theme')==='dark'?0x0a0808:0xf1ece7);gates.forEach(g=>g.userData.numberMat.color.setHex(root.getAttribute('data-theme')==='dark'?0xf1e9e3:0x2c2724));schedule();}}).observe(root,{attributes:true,attributeFilter:['data-theme']});
  resize();target=progress();current=target;updateDom(current);updateWebGL(current);
}

try{init();}catch(error){root.classList.add('v55-fallback');console.warn('MOVX v55 process journey failed open',error);}
