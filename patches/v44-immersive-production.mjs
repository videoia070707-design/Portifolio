/* MOVX v44 — standalone immersive production runtime
   Three.js + GSAP ScrollTrigger loaded as local build assets.
   Runs independently of the legacy monolithic script so one older runtime error cannot block it. */
import * as THREE from './vendor/three.module.min.js';

const root = document.documentElement;
root.classList.add('movx-v42','movx-v44');
root.dataset.movxBuild = 'v44-production';
root.dataset.movxImmersive = 'three-scrolltrigger-v44';

const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
const desktop = matchMedia('(min-width:981px)').matches;
const finePointer = matchMedia('(pointer:fine)').matches;
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

if (!gsap || !ScrollTrigger) {
  root.classList.add('v44-dependency-fallback');
  console.warn('MOVX v44: GSAP/ScrollTrigger unavailable; editorial fallback kept.');
} else {
  gsap.registerPlugin(ScrollTrigger);
}

const q = (s,c=document) => c.querySelector(s);
const qa = (s,c=document) => [...c.querySelectorAll(s)];
const clamp = (v,a=0,b=1) => Math.min(b,Math.max(a,v));

function removeLegacyLowerStages(){
  qa('.v42-parallax-layer,.v43-depth-stage,.v43-process-stage,.v43-journey-meter').forEach(node => node.remove());
}

function makeCssStage(section,className){
  if (!section) return null;
  let stage = q(`.${className}`,section);
  if (stage) return stage;
  stage = document.createElement('div');
  stage.className = `v44-css-stage ${className}`;
  stage.setAttribute('aria-hidden','true');
  section.insertBefore(stage,section.firstChild);
  return stage;
}

function buildAbout(){
  const section = q('.about-section');
  if (!section) return;
  const stage = makeCssStage(section,'v44-about-stage');
  const word = document.createElement('div');
  word.className = 'v44-depth-word v44-about-word';
  word.textContent = q('h2',section)?.textContent?.trim() || 'Sobre';
  const brand = document.createElement('div');
  brand.className = 'v44-about-brand';
  brand.textContent = 'MOVX';
  const rule = document.createElement('div');
  rule.className = 'v44-depth-rule';
  stage.append(word,brand,rule);

  if (!gsap || !ScrollTrigger || reduced) return;
  const tl = gsap.timeline({
    scrollTrigger:{trigger:section,start:'top bottom',end:'bottom top',scrub:1.15,invalidateOnRefresh:true}
  });
  tl.fromTo(word,{xPercent:-50,yPercent:-50,z:-480,rotationZ:-4,scale:.86,opacity:.16},{z:120,rotationZ:2.4,scale:1.16,opacity:.72,ease:'none'},0)
    .fromTo(word,{x:-140,y:150},{x:130,y:-170,ease:'none'},0)
    .fromTo(brand,{x:-90,y:100,z:-160,rotation:-2,opacity:.05},{x:120,y:-130,z:150,rotation:1.8,opacity:.22,ease:'none'},0)
    .fromTo(rule,{xPercent:-50,yPercent:-50,x:-180,y:80,z:120,rotation:-2,opacity:.18},{x:180,y:-90,z:220,rotation:2,opacity:.7,ease:'none'},0);
}

function buildServices(){
  const section = q('.services-section');
  const rows = section ? qa('.service-row',section) : [];
  if (!section || !rows.length) return;
  const stage = makeCssStage(section,'v44-services-stage');

  rows.forEach((row,index) => {
    const marker = document.createElement('div');
    marker.className = 'v44-service-marker';
    marker.innerHTML = `<b>${String(index+1).padStart(2,'0')}</b><i></i>`;
    stage.append(marker);
    if (!gsap || !ScrollTrigger || reduced) return;

    const dir = index % 2 ? -1 : 1;
    gsap.fromTo(marker,
      {xPercent:-50,yPercent:-50,x:dir*260,y:180,z:-720,rotationX:10,rotationY:dir*18,scale:.72,opacity:.02},
      {x:dir*-110,y:-100,z:180,rotationX:-5,rotationY:dir*-7,scale:1.08,opacity:.34,ease:'none',
       scrollTrigger:{trigger:row,start:'top 92%',end:'bottom 8%',scrub:1.05,invalidateOnRefresh:true}}
    );
  });
}

function makeFrameGroup(index,total){
  const group = new THREE.Group();
  const w = 5.6;
  const h = 3.25;
  const geometry = new THREE.PlaneGeometry(w,h,1,1);
  const edges = new THREE.EdgesGeometry(geometry);
  geometry.dispose();
  const lineMaterial = new THREE.LineBasicMaterial({color:0xeee9e3,transparent:true,opacity:.18});
  const frame = new THREE.LineSegments(edges,lineMaterial);
  group.add(frame);

  const crossMat = new THREE.LineBasicMaterial({color:0x9c2e24,transparent:true,opacity:.22});
  const crossGeom = new THREE.BufferGeometry();
  crossGeom.setAttribute('position',new THREE.Float32BufferAttribute([
    -w/2,0,0, w/2,0,0,
    0,-h/2,0, 0,h/2,0
  ],3));
  const cross = new THREE.LineSegments(crossGeom,crossMat);
  group.add(cross);

  const side = index % 2 ? -1 : 1;
  group.position.set(side*(index===0?.35:1.2 + index*.08), ((index%3)-1)*.34, -index*6.2);
  group.rotation.y = side*(.18 + index*.015);
  group.rotation.x = -.035 + (index%2?-.025:.025);
  group.userData = {lineMaterial,crossMat,index,total};
  return group;
}

function buildProcess(){
  const section = q('.process-section');
  const rows = section ? qa('.process-list li',section) : [];
  if (!section || !rows.length || !desktop || reduced || !gsap || !ScrollTrigger) return;

  let stage = q('.v44-process-stage',section);
  if (!stage) {
    stage = document.createElement('div');
    stage.className = 'v44-process-stage';
    stage.setAttribute('aria-hidden','true');
    const canvas = document.createElement('canvas');
    canvas.className = 'v44-process-canvas';
    const vignette = document.createElement('div');
    vignette.className = 'v44-process-vignette';
    stage.append(canvas,vignette);
    section.insertBefore(stage,section.firstChild);
  }

  const canvas = q('.v44-process-canvas',stage);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
  } catch (error) {
    root.classList.add('v44-webgl-fallback');
    stage.remove();
    console.warn('MOVX v44: Three.js WebGL unavailable',error);
    return;
  }

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1,1.5));
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b0909,.033);
  const camera = new THREE.PerspectiveCamera(46,1,.1,80);
  const world = new THREE.Group();
  scene.add(world);

  const frames = rows.map((_,index) => makeFrameGroup(index,rows.length));
  frames.forEach(frame => world.add(frame));

  /* Long editorial rails make camera travel readable without generic 3D objects. */
  const railMat = new THREE.LineBasicMaterial({color:0x6f665f,transparent:true,opacity:.13});
  [-2.95,2.95].forEach(x => {
    const geom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,-2,6),new THREE.Vector3(x,2,-34)]);
    world.add(new THREE.Line(geom,railMat));
  });

  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,0,7.8),
    new THREE.Vector3(-.28,.12,2.2),
    new THREE.Vector3(.38,-.08,-4.8),
    new THREE.Vector3(-.42,.16,-11.8),
    new THREE.Vector3(.32,-.12,-18.8),
    new THREE.Vector3(0,.02,-25.5)
  ],false,'catmullrom',.48);

  const pointer = new THREE.Vector2();
  const pointerTarget = new THREE.Vector2();
  let progress = 0;
  let scrollVelocity = 0;
  let active = false;
  let contextLost = false;

  function resize(){
    if (contextLost) return;
    const rect = stage.getBoundingClientRect();
    const w = Math.max(1,Math.round(rect.width));
    const h = Math.max(1,Math.round(rect.height));
    renderer.setSize(w,h,false);
    camera.aspect = w/h;
    camera.updateProjectionMatrix();
  }

  function paint(){
    if (contextLost || !active || document.hidden) return;
    pointer.lerp(pointerTarget,.08);
    const p = clamp(progress,0,1);
    const pos = path.getPointAt(p);
    const ahead = path.getPointAt(Math.min(1,p+.035));
    camera.position.copy(pos);
    camera.position.x += pointer.x*.36 + scrollVelocity*.07;
    camera.position.y += -pointer.y*.2;
    camera.lookAt(ahead.x + pointer.x*.18,ahead.y - pointer.y*.12,ahead.z);
    camera.rotateZ(scrollVelocity*.007);

    frames.forEach((frame,index) => {
      const dz = Math.abs(camera.position.z - frame.position.z);
      const focus = clamp(1 - dz/8.2,0,1);
      frame.userData.lineMaterial.opacity = .055 + focus*.34;
      frame.userData.crossMat.opacity = .04 + focus*.29;
      const s = .94 + focus*.09;
      frame.scale.setScalar(s);
    });
    renderer.render(scene,camera);
  }

  const trigger = ScrollTrigger.create({
    trigger:section,
    start:'top top',
    end:'bottom bottom',
    scrub:true,
    invalidateOnRefresh:true,
    onEnter(){active=true;resize();},
    onEnterBack(){active=true;resize();},
    onLeave(){active=false;},
    onLeaveBack(){active=false;},
    onUpdate(self){
      progress = self.progress;
      scrollVelocity = THREE.MathUtils.lerp(scrollVelocity,clamp(self.getVelocity()/2200,-1.25,1.25),.28);
      const current = Math.min(rows.length-1,Math.max(0,Math.round(self.progress*(rows.length-1))));
      rows.forEach((row,index) => row.classList.toggle('v44-current',index===current));
      paint();
    }
  });

  if (finePointer) {
    section.addEventListener('pointermove',event => {
      pointerTarget.x = clamp((event.clientX/Math.max(1,innerWidth)-.5)*2,-1,1);
      pointerTarget.y = clamp((event.clientY/Math.max(1,innerHeight)-.5)*2,-1,1);
      if (active) paint();
    },{passive:true});
    section.addEventListener('pointerleave',()=>{pointerTarget.set(0,0);if(active) paint();},{passive:true});
  }

  canvas.addEventListener('webglcontextlost',event => {
    event.preventDefault();contextLost=true;root.classList.add('v44-webgl-fallback');stage.remove();
  },{once:true});

  addEventListener('resize',()=>{resize();ScrollTrigger.refresh();paint();},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&active)paint();});
  gsap.ticker.add(()=>{
    if (!active || contextLost || document.hidden) return;
    scrollVelocity *= .9;
    paint();
  });
  resize();
  trigger.refresh();
}

function buildContact(){
  const section = q('.contact-section');
  if (!section) return;
  const stage = makeCssStage(section,'v44-contact-stage');
  const word = document.createElement('div');
  word.className = 'v44-depth-word v44-contact-word';
  word.textContent = q('h2',section)?.textContent?.trim() || 'Contato';
  const rule = document.createElement('div');
  rule.className = 'v44-depth-rule';
  stage.append(word,rule);
  if (!gsap || !ScrollTrigger || reduced) return;
  const tl = gsap.timeline({scrollTrigger:{trigger:section,start:'top bottom',end:'bottom top',scrub:1.2,invalidateOnRefresh:true}});
  tl.fromTo(word,{xPercent:-50,yPercent:-50,z:-620,scale:.72,rotationX:9,opacity:.08},{z:120,scale:1.1,rotationX:-1.5,opacity:.55,ease:'none'},0)
    .fromTo(word,{x:-120,y:150},{x:80,y:-90,ease:'none'},0)
    .fromTo(rule,{xPercent:-50,yPercent:-50,x:180,y:90,z:180,rotation:2,opacity:.15},{x:-150,y:-70,z:60,rotation:-1,opacity:.68,ease:'none'},0);
}

function init(){
  try {
    removeLegacyLowerStages();
    buildAbout();
    buildServices();
    buildProcess();
    buildContact();
    if (gsap && ScrollTrigger) {
      requestAnimationFrame(()=>ScrollTrigger.refresh());
    }
    root.classList.add('v44-runtime-ready');
  } catch (error) {
    root.classList.add('v44-runtime-fallback');
    console.warn('MOVX v44 immersive runtime failed open:',error);
  }
}

init();
