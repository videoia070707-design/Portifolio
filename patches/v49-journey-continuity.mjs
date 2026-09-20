/* MOVX v49 — continuous immersive journey
   A single Three.js camera runs behind About -> Services -> Process and hands off into Contact.
   Essential copy remains DOM content; the shared canvas owns spatial depth only. */
import * as THREE from './vendor/three.module.min.js';

const root = document.documentElement;
root.classList.add('movx-v49');
root.dataset.movxJourney = 'v49-continuous';

const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
const desktop = matchMedia('(min-width:981px)').matches;
const finePointer = matchMedia('(pointer:fine)').matches;
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const q = (s,c=document) => c.querySelector(s);
const qa = (s,c=document) => [...c.querySelectorAll(s)];
const clamp = (v,a=0,b=1) => Math.min(b,Math.max(a,v));
const lerp = (a,b,t) => a+(b-a)*t;

if (!gsap || !ScrollTrigger || reduced || !desktop) {
  root.classList.add('v49-editorial-fallback');
} else {
  gsap.registerPlugin(ScrollTrigger);
}

function makeTextTexture(text){
  const canvas = document.createElement('canvas');
  canvas.width = 1536;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 132px Arial, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(text || '').toUpperCase(),44,canvas.height/2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function buildJourneyWrapper(){
  const about = q('.about-section');
  const services = q('.services-section');
  const process = q('.process-section');
  const contact = q('.contact-section');
  if (!about || !services || !process || !contact) return null;
  let journey = q('.v49-journey');
  if (!journey) {
    journey = document.createElement('div');
    journey.className = 'v49-journey';
    about.parentNode.insertBefore(journey,about);
    [about,services,process,contact].forEach(section => journey.append(section));
  }
  return {journey,about,services,process,contact};
}

function currentTheme(){
  const dark = root.getAttribute('data-theme') === 'dark';
  return dark ? {
    line:0xe9e3de,
    soft:0x7d716a,
    accent:0xa63a2c,
    text:0xf0eae4,
    fog:0x0b0909
  } : {
    line:0x2c2724,
    soft:0x8c817a,
    accent:0x9c2e24,
    text:0x2c2724,
    fog:0xf1ece7
  };
}

function frameGeometry(w,h){
  const plane = new THREE.PlaneGeometry(w,h);
  const edges = new THREE.EdgesGeometry(plane);
  plane.dispose();
  return edges;
}

function makePlate(label,type,theme){
  const group = new THREE.Group();
  const dims = type === 'chapter' ? [7.0,3.85] : type === 'process' ? [5.8,3.25] : [5.1,2.55];
  const lineMaterial = new THREE.LineBasicMaterial({color:theme.line,transparent:true,opacity:.08});
  const frame = new THREE.LineSegments(frameGeometry(dims[0],dims[1]),lineMaterial);
  group.add(frame);

  const accentMaterial = new THREE.LineBasicMaterial({color:theme.accent,transparent:true,opacity:.1});
  const accentGeom = new THREE.BufferGeometry();
  accentGeom.setAttribute('position',new THREE.Float32BufferAttribute([
    -dims[0]/2,0,0,dims[0]/2,0,0,
    0,-dims[1]/2,0,0,dims[1]/2,0
  ],3));
  group.add(new THREE.LineSegments(accentGeom,accentMaterial));

  const texture = makeTextTexture(label);
  const textMaterial = new THREE.MeshBasicMaterial({map:texture,color:theme.text,transparent:true,opacity:.08,depthWrite:false});
  const text = new THREE.Mesh(new THREE.PlaneGeometry(type === 'chapter' ? 5.9 : 4.35,type === 'chapter' ? 1.22 : .9),textMaterial);
  text.position.z = .035;
  text.position.y = type === 'chapter' ? -.96 : -.66;
  group.add(text);

  group.userData = {type,label,lineMaterial,accentMaterial,textMaterial,texture,p:0};
  return group;
}

function initJourney(){
  if (!gsap || !ScrollTrigger || reduced || !desktop) return;
  const refs = buildJourneyWrapper();
  if (!refs) return;
  const {journey,about,services,process,contact} = refs;

  const stage = document.createElement('div');
  stage.className = 'v49-journey-stage';
  stage.setAttribute('aria-hidden','true');
  const canvas = document.createElement('canvas');
  canvas.className = 'v49-journey-canvas';
  const vignette = document.createElement('div');
  vignette.className = 'v49-journey-vignette';
  const noise = document.createElement('div');
  noise.className = 'v49-journey-noise';
  stage.append(canvas,vignette,noise);
  journey.insertBefore(stage,journey.firstChild);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
  } catch (error) {
    root.classList.add('v49-webgl-fallback');
    stage.remove();
    console.warn('MOVX v49: shared WebGL journey unavailable',error);
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1,1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000,0);

  let theme = currentTheme();
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(theme.fog,.022);
  const camera = new THREE.PerspectiveCamera(44,1,.1,120);
  const world = new THREE.Group();
  scene.add(world);

  const servicesRows = qa('.service-row',services);
  const processRows = qa('.process-list li',process);
  const anchors = [
    {node:q('h2',about) || about,label:'SOBRE',type:'chapter',section:about,side:-1},
    ...servicesRows.map((row,index)=>({node:row,label:q('h3',row)?.textContent?.trim() || `SERVIÇO ${index+1}`,type:'service',section:services,side:index%2?1:-1})),
    {node:q('.process-title h2',process) || process,label:'PROCESSO',type:'chapter',section:process,side:1},
    ...processRows.map((row,index)=>({node:row,label:q('strong',row)?.textContent?.trim() || `ETAPA ${index+1}`,type:'process',section:process,side:index%2?-1:1})),
    {node:q('h2',contact) || contact,label:'CONTATO',type:'chapter',section:contact,side:-1}
  ];

  const plates = anchors.map(anchor => {
    const plate = makePlate(anchor.label,anchor.type,theme);
    plate.userData.anchor = anchor;
    world.add(plate);
    return plate;
  });

  let path = null;
  const railMaterials = [
    new THREE.LineBasicMaterial({color:theme.soft,transparent:true,opacity:.075}),
    new THREE.LineBasicMaterial({color:theme.soft,transparent:true,opacity:.075})
  ];
  const rails = [new THREE.Line(),new THREE.Line()];
  rails.forEach((line,index)=>{ line.material = railMaterials[index]; world.add(line); });

  let journeyTop = 0;
  let journeyTravel = 1;
  let milestones = [];
  let targetProgress = 0;
  let progress = 0;
  let velocityTarget = 0;
  let velocity = 0;
  let active = false;
  let contextLost = false;
  let raf = 0;
  const pointer = new THREE.Vector2();
  const pointerTarget = new THREE.Vector2();

  function buildPath(){
    path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-.2,.12,10),
      new THREE.Vector3(.42,-.08,-4),
      new THREE.Vector3(-.5,.16,-18),
      new THREE.Vector3(.58,-.12,-34),
      new THREE.Vector3(-.38,.08,-50),
      new THREE.Vector3(.16,0,-66)
    ],false,'catmullrom',.5);
  }
  buildPath();

  function normalizedNodeProgress(node){
    const r = node.getBoundingClientRect();
    const center = scrollY + r.top + r.height/2;
    return clamp((center - journeyTop - innerHeight*.5) / journeyTravel,0,1);
  }

  function rebuildRails(){
    rails.forEach((line,index)=>{
      const side = index ? 1 : -1;
      const points = [];
      for(let i=0;i<=70;i++){
        const t = i/70;
        const p = path.getPoint(t).clone();
        p.x += side*3.15;
        p.y += side*.34;
        p.z -= 5.7;
        points.push(p);
      }
      if (line.geometry) line.geometry.dispose();
      line.geometry = new THREE.BufferGeometry().setFromPoints(points);
    });
  }

  function layoutScene(){
    const jr = journey.getBoundingClientRect();
    journeyTop = scrollY + jr.top;
    journeyTravel = Math.max(1,journey.offsetHeight - innerHeight);
    milestones = anchors.map(anchor => normalizedNodeProgress(anchor.node));
    plates.forEach((plate,index)=>{
      const p = milestones[index];
      plate.userData.p = p;
      const base = path.getPoint(p);
      const anchor = plate.userData.anchor;
      const typeOffset = anchor.type === 'chapter' ? 0 : anchor.type === 'process' ? .25 : .65;
      plate.position.set(base.x + anchor.side*(anchor.type === 'chapter' ? 1.15 : 1.55),base.y + typeOffset,base.z - 6.2);
      plate.rotation.y = anchor.side*(anchor.type === 'chapter' ? .11 : .18);
      plate.rotation.x = anchor.type === 'process' ? -.045 : -.025;
    });
    rebuildRails();
  }

  function resize(){
    if (contextLost) return;
    const w = Math.max(1,innerWidth);
    const h = Math.max(1,innerHeight);
    renderer.setSize(w,h,false);
    camera.aspect = w/h;
    camera.updateProjectionMatrix();
    layoutScene();
  }

  function updateTheme(){
    theme = currentTheme();
    scene.fog.color.setHex(theme.fog);
    railMaterials.forEach(mat=>mat.color.setHex(theme.soft));
    plates.forEach(plate=>{
      plate.userData.lineMaterial.color.setHex(theme.line);
      plate.userData.accentMaterial.color.setHex(theme.accent);
      plate.userData.textMaterial.color.setHex(theme.text);
    });
    schedule();
  }

  function setCurrentChapter(p){
    const sections = [about,services,process,contact];
    const centers = sections.map(section=>normalizedNodeProgress(section));
    let current = 0,dist = Infinity;
    centers.forEach((m,i)=>{const d=Math.abs(p-m); if(d<dist){dist=d;current=i;}});
    sections.forEach((section,i)=>section.classList.toggle('v49-current',i===current));
    root.dataset.movxJourneyChapter = ['about','services','process','contact'][current];

    let processIndex = -1;
    let processDist = Infinity;
    processRows.forEach((row,index)=>{
      const rp = normalizedNodeProgress(row);
      const d = Math.abs(p-rp);
      if(d<processDist){processDist=d;processIndex=index;}
    });
    processRows.forEach((row,index)=>{
      const on = current===2 && index===processIndex;
      row.classList.toggle('v49-current',on);
      row.classList.toggle('v45-current',on);
    });
  }

  function paint(){
    raf = 0;
    if (!active || contextLost || document.hidden) return;
    progress = lerp(progress,targetProgress,.14);
    velocity = lerp(velocity,velocityTarget,.12);
    velocityTarget *= .82;
    pointer.lerp(pointerTarget,.08);

    const p = clamp(progress,0,1);
    const pos = path.getPoint(p);
    const ahead = path.getPoint(clamp(p+.022,0,1));
    camera.position.copy(pos);
    camera.position.x += pointer.x*.36 + velocity*.12;
    camera.position.y += -pointer.y*.22;
    camera.fov = 44 + Math.min(6.5,Math.abs(velocity)*4.2);
    camera.updateProjectionMatrix();
    camera.lookAt(ahead.x + pointer.x*.16,ahead.y - pointer.y*.11,ahead.z);
    camera.rotateZ(velocity*.0085);

    plates.forEach(plate=>{
      const distance = Math.abs(p - plate.userData.p);
      const focus = clamp(1 - distance/.16,0,1);
      const type = plate.userData.type;
      const strength = type === 'process' ? 1 : type === 'chapter' ? .72 : .55;
      plate.userData.lineMaterial.opacity = .035 + focus*.34*strength;
      plate.userData.accentMaterial.opacity = .022 + focus*.38*strength;
      const textStrength = type === 'process' ? .12 : type === 'chapter' ? .085 : .065;
      plate.userData.textMaterial.opacity = .006 + focus*textStrength;
      const s = .93 + focus*.12;
      plate.scale.setScalar(s);
    });

    railMaterials.forEach(mat=>mat.opacity=.055 + clamp(Math.abs(velocity),0,.9)*.07);

    const fadeIn = clamp(p/.08,0,1);
    const fadeOut = clamp((1-p)/.16,0,1);
    stage.style.opacity = String(Math.min(fadeIn,fadeOut));
    setCurrentChapter(p);
    renderer.render(scene,camera);

    const unsettled = Math.abs(progress-targetProgress)>.0007 || Math.abs(velocity)>.004 || Math.abs(velocityTarget)>.004 || pointer.distanceTo(pointerTarget)>.002;
    if (unsettled) schedule();
  }

  function schedule(){
    if (!raf && active && !document.hidden && !contextLost) raf = requestAnimationFrame(paint);
  }

  const trigger = ScrollTrigger.create({
    trigger:journey,
    start:'top 92%',
    end:'bottom 8%',
    invalidateOnRefresh:true,
    onRefresh(){resize();},
    onEnter(){active=true;stage.classList.add('v49-active');resize();schedule();},
    onEnterBack(){active=true;stage.classList.add('v49-active');resize();schedule();},
    onLeave(){active=false;stage.classList.remove('v49-active');if(raf){cancelAnimationFrame(raf);raf=0;}},
    onLeaveBack(){active=false;stage.classList.remove('v49-active');if(raf){cancelAnimationFrame(raf);raf=0;}},
    onUpdate(self){targetProgress=self.progress;velocityTarget=clamp(self.getVelocity()/2050,-1.4,1.4);schedule();}
  });

  if (finePointer) {
    journey.addEventListener('pointermove',event=>{
      pointerTarget.set(
        clamp((event.clientX/Math.max(1,innerWidth)-.5)*2,-1,1),
        clamp((event.clientY/Math.max(1,innerHeight)-.5)*2,-1,1)
      );
      schedule();
    },{passive:true});
    journey.addEventListener('pointerleave',()=>{pointerTarget.set(0,0);schedule();},{passive:true});
  }

  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();
    contextLost=true;
    root.classList.add('v49-webgl-fallback');
    stage.remove();
  },{once:true});

  let resizeRaf=0;
  addEventListener('resize',()=>{
    if(resizeRaf) return;
    resizeRaf=requestAnimationFrame(()=>{resizeRaf=0;resize();ScrollTrigger.refresh();schedule();});
  },{passive:true});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){if(raf){cancelAnimationFrame(raf);raf=0;}}
    else if(active) schedule();
  });
  new MutationObserver(mutations=>{
    if(mutations.some(m=>m.attributeName==='data-theme')) updateTheme();
  }).observe(root,{attributes:true,attributeFilter:['data-theme']});

  if (document.fonts?.ready) document.fonts.ready.then(()=>{resize();ScrollTrigger.refresh();schedule();}).catch(()=>{});
  requestAnimationFrame(()=>{resize();trigger.refresh();root.classList.add('v49-runtime-ready');});
}

try { initJourney(); }
catch (error) {
  root.classList.add('v49-runtime-fallback');
  console.warn('MOVX v49 journey failed open:',error);
}
