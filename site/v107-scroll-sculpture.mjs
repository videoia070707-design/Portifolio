/* MOVX v107 — branded 3D scroll choreography
   Creates an unmistakable MOVX sculpture between the cover and the archive.
   Native scrolling drives the scene; no scroll-jacking. */

const root=document.documentElement;
const body=document.body;
const q=(s,c=document)=>c.querySelector(s);
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const reduced=new URLSearchParams(location.search).has('static')||matchMedia('(prefers-reduced-motion: reduce)').matches||root.dataset.movxReducedMotion==='true';
const narrow=matchMedia('(max-width:720px)').matches;
const coarse=matchMedia('(pointer:coarse)').matches;

root.classList.add('movx-v107');
root.dataset.movxV107='scroll-sculpture';
if(reduced)root.classList.add('v107-reduced');

function createSection(){
  if(body?.dataset.page!=='social')return null;
  if(q('.v107-dimensional-story'))return q('.v107-dimensional-story');
  const hero=q('.social-cover-art');
  if(!hero)return null;
  const section=document.createElement('section');
  section.className='v107-dimensional-story';
  section.setAttribute('aria-hidden','true');
  section.innerHTML=`<div class="v107-dimensional-story__sticky"><div class="v107-dimensional-story__glow"></div><canvas class="v107-dimensional-story__canvas"></canvas><div class="v107-dimensional-story__fallback"><span></span><span></span><span></span></div><div class="v107-dimensional-story__chrome"></div></div>`;
  hero.insertAdjacentElement('afterend',section);
  return section;
}

const section=createSection();
if(!section){root.dataset.v107Webgl='not-applicable';}

function sectionProgress(){
  if(!section)return 0;
  const r=section.getBoundingClientRect();
  const travel=Math.max(1,r.height-innerHeight);
  return clamp(-r.top/travel,0,1);
}

if(section){
  const sticky=q('.v107-dimensional-story__sticky',section);
  let raf=0;
  const sync=()=>{
    raf=0;
    const p=sectionProgress();
    sticky?.style.setProperty('--v107-progress',p.toFixed(4));
  };
  const schedule=()=>{if(!raf)raf=requestAnimationFrame(sync);};
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  sync();
}

async function init(){
  if(!section||reduced||narrow){
    if(section)root.dataset.v107Webgl=reduced?'reduced':'mobile-fallback';
    return;
  }
  const sticky=q('.v107-dimensional-story__sticky',section);
  const canvas=q('.v107-dimensional-story__canvas',section);
  if(!sticky||!canvas)return;

  let THREE;
  try{THREE=await import('./vendor/three.module.min.js');}
  catch(error){console.warn('[MOVX v107] Three.js unavailable.',error);root.dataset.v107Webgl='fallback';return;}

  let renderer;
  try{
    renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:!coarse,powerPreference:'high-performance'});
  }catch(error){console.warn('[MOVX v107] WebGL unavailable.',error);root.dataset.v107Webgl='fallback';return;}

  renderer.setClearColor(0x000000,0);
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.05:1.45));
  if('outputColorSpace'in renderer&&THREE.SRGBColorSpace)renderer.outputColorSpace=THREE.SRGBColorSpace;

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(34,1,.1,50);
  camera.position.set(0,.08,8.6);

  const world=new THREE.Group();
  scene.add(world);

  const cream=new THREE.MeshStandardMaterial({color:0xefe7dd,roughness:.34,metalness:.28});
  const accent=new THREE.MeshStandardMaterial({color:0xe36b5c,roughness:.31,metalness:.24});
  const dark=new THREE.MeshStandardMaterial({color:0x282321,roughness:.42,metalness:.38});
  const edgeCream=new THREE.LineBasicMaterial({color:0xf6eee5,transparent:true,opacity:.32});
  const edgeAccent=new THREE.LineBasicMaterial({color:0xff8a79,transparent:true,opacity:.42});

  function rod(parent,x,y,length,angle,depth=.24,material=cream,thickness=.18){
    const geometry=new THREE.BoxGeometry(thickness,length,depth);
    const mesh=new THREE.Mesh(geometry,material.clone());
    mesh.position.set(x,y,0);mesh.rotation.z=angle;
    const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geometry),material===accent?edgeAccent:edgeCream);
    mesh.add(edges);parent.add(mesh);return mesh;
  }

  function letterM(){
    const g=new THREE.Group();
    rod(g,-.40,0,1.55,0,.25,cream,.19);rod(g,.40,0,1.55,0,.25,cream,.19);
    rod(g,-.18,.20,.90,-.48,.25,accent,.18);rod(g,.18,.20,.90,.48,.25,accent,.18);
    return g;
  }
  function letterO(){
    const g=new THREE.Group();
    const geo=new THREE.TorusGeometry(.52,.115,14,64);
    const mesh=new THREE.Mesh(geo,cream.clone());mesh.scale.y=1.12;g.add(mesh);
    const inner=new THREE.Mesh(new THREE.TorusGeometry(.31,.025,10,52),new THREE.MeshBasicMaterial({color:0xe36b5c,transparent:true,opacity:.82}));
    inner.position.z=.16;inner.scale.y=1.12;g.add(inner);return g;
  }
  function letterV(){
    const g=new THREE.Group();
    rod(g,-.23,.03,1.52,-.34,.27,dark,.21);rod(g,.23,.03,1.52,.34,.27,accent,.21);return g;
  }
  function letterX(){
    const g=new THREE.Group();
    rod(g,0,0,1.70,-.69,.31,cream,.23);rod(g,0,0,1.70,.69,.31,accent,.23);return g;
  }

  const letters=[letterM(),letterO(),letterV(),letterX()];
  const bases=[-2.55,-.87,.87,2.55];
  letters.forEach((g,i)=>{g.position.x=bases[i];world.add(g);});

  const orbit=new THREE.Mesh(
    new THREE.TorusGeometry(3.75,.018,8,128),
    new THREE.MeshBasicMaterial({color:0xefe7dd,transparent:true,opacity:.20})
  );
  orbit.rotation.x=1.18;orbit.rotation.y=.28;world.add(orbit);
  const accentOrbit=new THREE.Mesh(
    new THREE.TorusGeometry(2.4,.014,8,112),
    new THREE.MeshBasicMaterial({color:0xe36b5c,transparent:true,opacity:.38})
  );
  accentOrbit.rotation.x=.72;accentOrbit.rotation.y=-.56;world.add(accentOrbit);

  scene.add(new THREE.HemisphereLight(0xfff6eb,0x160f0e,1.8));
  const key=new THREE.DirectionalLight(0xffffff,3.1);key.position.set(3.5,4.2,6);scene.add(key);
  const rim=new THREE.DirectionalLight(0xff7462,2.1);rim.position.set(-4,-1,3);scene.add(rim);
  const fill=new THREE.PointLight(0xffe8d7,1.1,18);fill.position.set(0,-3,5);scene.add(fill);

  const explosion=[
    {x:-.9,y:.55,z:-2.1,rx:.55,ry:-.9,rz:-.2},
    {x:-.25,y:-.6,z:1.5,rx:-.3,ry:.75,rz:.2},
    {x:.35,y:.75,z:-1.25,rx:.42,ry:-.7,rz:-.15},
    {x:1.05,y:-.35,z:2.25,rx:-.45,ry:.95,rz:.25}
  ];

  let targetP=sectionProgress(),p=targetP;
  let targetX=0,targetY=0,px=0,py=0,raf=0,last=performance.now(),visible=true;

  function resize(){
    const w=Math.max(1,sticky.clientWidth),h=Math.max(1,sticky.clientHeight);
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  resize();

  function updateScene(progress){
    const assemble=smooth(.02,.30,progress);
    const turn=smooth(.30,.66,progress);
    const focus=smooth(.62,.86,progress);
    const exit=smooth(.88,1,progress);

    letters.forEach((g,i)=>{
      const e=explosion[i],base=bases[i];
      const focused=i===3;
      let x=lerp(base+e.x,base,assemble);
      let y=lerp(e.y,0,assemble);
      let z=lerp(e.z,0,assemble);
      let rx=lerp(e.rx,0,assemble),ry=lerp(e.ry,0,assemble),rz=lerp(e.rz,0,assemble);

      if(turn>0){
        z+=(i%2===0?-1:1)*turn*.58;
        ry+=(i%2===0?-1:1)*turn*.18;
      }
      if(focus>0){
        if(focused){x=lerp(x,.95,focus);z=lerp(z,2.45,focus);y=lerp(y,.02,focus);}
        else{x+=((i<3?-1:1)*(1.25+i*.16))*focus;z-=1.4*focus;y+=(i-1)*.16*focus;}
      }
      if(exit>0){y+=exit*(i%2?1.8:-1.5);z+=exit*(focused?1.2:-2.5);}

      g.position.set(x,y,z);g.rotation.set(rx,ry,rz);
      const s=focused?lerp(1,1.72,focus):lerp(1,.72,focus);
      g.scale.setScalar(s*(1-exit*.20));
    });

    world.rotation.x=lerp(.12,-.16,turn)-py*.055;
    world.rotation.y=lerp(-.58,.68,turn)+px*.12;
    world.rotation.z=lerp(-.04,.075,turn);
    world.position.y=lerp(.12,.28,turn)-exit*.4;
    camera.position.z=lerp(9.7,7.1,turn)-focus*.45;
    camera.position.x=focus*.38+px*.16;

    orbit.rotation.z=progress*2.2;orbit.rotation.y=.28+turn*.72;
    accentOrbit.rotation.z=-progress*3.4;accentOrbit.rotation.x=.72+turn*.26;
    sticky.style.setProperty('--v107-progress',progress.toFixed(4));
    sticky.style.setProperty('--v107-pointer-x',px.toFixed(3));
    sticky.style.setProperty('--v107-pointer-y',py.toFixed(3));
    canvas.style.opacity=String(1-exit*.88);
  }

  function tick(now){
    raf=0;if(!visible||document.hidden)return;
    const dt=Math.min((now-last)/16.667,2.2);last=now;
    p=lerp(p,targetP,1-Math.pow(.84,dt));
    px=lerp(px,targetX,1-Math.pow(.84,dt));py=lerp(py,targetY,1-Math.pow(.84,dt));
    updateScene(p);renderer.render(scene,camera);
    if(Math.abs(p-targetP)>.0008||Math.abs(px-targetX)>.0015||Math.abs(py-targetY)>.0015)start();
  }
  function start(){if(!raf)raf=requestAnimationFrame(tick);}
  function onScroll(){targetP=sectionProgress();start();}
  function onResize(){resize();targetP=sectionProgress();start();}

  if(!coarse){
    sticky.addEventListener('pointermove',e=>{
      const r=sticky.getBoundingClientRect();
      targetX=clamp((e.clientX-r.left)/Math.max(r.width,1)*2-1,-1,1);
      targetY=clamp((e.clientY-r.top)/Math.max(r.height,1)*2-1,-1,1);start();
    },{passive:true});
    sticky.addEventListener('pointerleave',()=>{targetX=0;targetY=0;start();},{passive:true});
  }
  addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onResize,{passive:true});

  const observer=new IntersectionObserver(entries=>{
    visible=entries.some(e=>e.isIntersecting);
    if(visible){last=performance.now();start();}
  },{rootMargin:'12% 0px'});
  observer.observe(section);

  function dispose(){
    observer.disconnect();cancelAnimationFrame(raf);
    world.traverse(obj=>{obj.geometry?.dispose?.();if(obj.material){if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose?.());else obj.material.dispose?.();}});
    renderer.dispose();removeEventListener('scroll',onScroll);removeEventListener('resize',onResize);
  }
  addEventListener('pagehide',dispose,{once:true});

  updateScene(p);renderer.render(scene,camera);
  root.dataset.v107Webgl='ready';start();
}

init();
