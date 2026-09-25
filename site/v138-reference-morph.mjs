/* MOVX v138 — reference matched molten-glass 3D morph.
   One fixed-topology tube surface morphs LIQUID -> RING -> TOWER -> INFINITY.
   Visual target: glossy black glass, internal orange heat/veins, bright specular edge and pure black stage. */
const root=document.documentElement;
const q=(s,c=document)=>c.querySelector(s);
const qa=(s,c=document)=>[...c.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse=matchMedia('(pointer:coarse)').matches;
root.classList.add('movx-v136','movx-v137','movx-v138');
root.dataset.movxV136='fluid-morph';
root.dataset.movxV137='reference-morph';
root.dataset.movxV138='reference-morph-v2';
root.dataset.v136Design='orange-black-molten-glass-reference-v2';

const section=q('.v136-fluid-hero');
if(!section){root.dataset.v136Webgl='not-applicable';}
const ANCHORS=[0,.30,.62,.94];
const NAMES=['LIQUID','RING','TOWER','INFINITY'];

function progress(){
  if(!section)return 0;
  const r=section.getBoundingClientRect();
  const travel=Math.max(1,section.offsetHeight-innerHeight);
  return clamp(-r.top/travel,0,1);
}
function stateWeights(p){
  if(p<=ANCHORS[1]){const t=smooth((p-ANCHORS[0])/(ANCHORS[1]-ANCHORS[0]));return[t,0,0]}
  if(p<=ANCHORS[2]){const t=smooth((p-ANCHORS[1])/(ANCHORS[2]-ANCHORS[1]));return[1-t,t,0]}
  const t=smooth((p-ANCHORS[2])/(ANCHORS[3]-ANCHORS[2]));return[0,1-t,t];
}
function nearestState(p){let best=0,d=Infinity;ANCHORS.forEach((a,i)=>{const n=Math.abs(a-p);if(n<d){d=n;best=i}});return best}
function mix4(values,p){
  if(p<=ANCHORS[1])return lerp(values[0],values[1],smooth((p-ANCHORS[0])/(ANCHORS[1]-ANCHORS[0])));
  if(p<=ANCHORS[2])return lerp(values[1],values[2],smooth((p-ANCHORS[1])/(ANCHORS[2]-ANCHORS[1])));
  return lerp(values[2],values[3],smooth((p-ANCHORS[2])/(ANCHORS[3]-ANCHORS[2])));
}

async function init(){
  if(!section)return;
  const sticky=q('.v136-fluid-hero__sticky',section);
  const canvas=q('.v136-fluid-hero__canvas',section);
  const readout=q('.v136-fluid-hero__state-readout strong',section);
  const readoutIndex=q('.v136-fluid-hero__state-readout em',section);
  const stateEls=qa('.v136-fluid-state',section);
  if(!sticky||!canvas)return;

  let THREE;
  try{THREE=await import('./vendor/three.module.js?v=v138-reference-morph');}
  catch(error){console.warn('[MOVX v138] Three.js unavailable',error);root.dataset.v136Webgl='fallback';return;}

  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:false,antialias:!coarse,powerPreference:'high-performance'});}
  catch(error){console.warn('[MOVX v138] WebGL unavailable',error);root.dataset.v136Webgl='fallback';return;}
  renderer.setClearColor(0x000000,1);
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.05:1.55));
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.55;
  if('outputColorSpace'in renderer&&THREE.SRGBColorSpace)renderer.outputColorSpace=THREE.SRGBColorSpace;

  const scene=new THREE.Scene();scene.background=new THREE.Color(0x000000);
  const camera=new THREE.PerspectiveCamera(31,1,.1,30);
  camera.position.set(0,0,4.45);
  const group=new THREE.Group();scene.add(group);

  const U=176,V=36,TAU=Math.PI*2;
  const basePos=[],baseNorm=[],uv=[],heatColors=[],indices=[];
  const targetPos=[[],[],[]],targetNorm=[[],[],[]];

  function planarFrame(c,dc,r){
    const T=dc.clone().normalize();
    let N=new THREE.Vector3(-dc.y,dc.x,0);
    if(N.lengthSq()<1e-8)N.set(1,0,0);else N.normalize();
    let B=new THREE.Vector3().crossVectors(T,N).normalize();
    if(B.lengthSq()<1e-8)B.set(0,0,1);
    N=new THREE.Vector3().crossVectors(B,T).normalize();
    return{c,N,B,r};
  }
  function liquidFrame(t){
    const th=TAU*t;
    const c=new THREE.Vector3(
      .72*Math.cos(th)+.07*Math.cos(3*th+.25),
      .155*Math.sin(th)+.042*Math.sin(2*th-.35),
      .025*Math.sin(3*th)
    );
    const dc=new THREE.Vector3(
      -.72*TAU*Math.sin(th)-.21*TAU*Math.sin(3*th+.25),
      .155*TAU*Math.cos(th)+.084*TAU*Math.cos(2*th-.35),
      .075*TAU*Math.cos(3*th)
    );
    const bulbs=.5+.5*Math.cos(2*th);
    const r=.155+.145*bulbs+.025*Math.sin(5*th+.4);
    return planarFrame(c,dc,r);
  }
  function ringFrame(t){
    const th=TAU*t;
    const rr=.565+.035*Math.sin(3*th+.4)+.018*Math.sin(7*th-.2);
    const c=new THREE.Vector3(rr*Math.cos(th),rr*Math.sin(th),.035*Math.sin(3*th));
    const drr=.105*Math.cos(3*th+.4)+.126*Math.cos(7*th-.2);
    const dc=new THREE.Vector3(
      TAU*(drr*Math.cos(th)-rr*Math.sin(th)),
      TAU*(drr*Math.sin(th)+rr*Math.cos(th)),
      .105*TAU*Math.cos(3*th)
    );
    return planarFrame(c,dc,.18*(1+.06*Math.sin(4*th+.2)));
  }
  function towerFrame(t){
    const th=TAU*t-Math.PI/2;
    const tri=.54*(1+.20*Math.cos(3*th));
    const dtri=-.324*Math.sin(3*th);
    const x=tri*Math.cos(th),y=1.08*tri*Math.sin(th)-.015;
    const dx=TAU*(dtri*Math.cos(th)-tri*Math.sin(th));
    const dy=1.08*TAU*(dtri*Math.sin(th)+tri*Math.cos(th));
    const c=new THREE.Vector3(x,y,.028*Math.sin(2*th));
    const dc=new THREE.Vector3(dx,dy,.056*TAU*Math.cos(2*th));
    const topness=Math.pow(Math.max(0,-Math.sin(th)),7);
    return planarFrame(c,dc,.145-.035*topness+.012*Math.sin(5*th));
  }
  function infinityFrame(t){
    const th=TAU*t;
    const c=new THREE.Vector3(.72*Math.sin(th),.34*Math.sin(2*th),.055*Math.cos(th));
    const dc=new THREE.Vector3(.72*TAU*Math.cos(th),.68*TAU*Math.cos(2*th),-.055*TAU*Math.sin(th));
    return planarFrame(c,dc,.155*(1+.055*Math.sin(3*th+.5)));
  }
  const frameFor=(kind,t)=>kind===0?liquidFrame(t):kind===1?ringFrame(t):kind===2?towerFrame(t):infinityFrame(t);

  function vertex(kind,i,j){
    const t=i/U,a=j/V*TAU,f=frameFor(kind,t);
    const wobble=kind===0?1+.035*Math.sin(i*.42+j*.73)+.018*Math.sin(i*.17-j*.47):1+.012*Math.sin(i*.31+j*.51);
    const n=f.N.clone().multiplyScalar(Math.cos(a)).add(f.B.clone().multiplyScalar(Math.sin(a))).normalize();
    const p=f.c.clone().add(n.clone().multiplyScalar(f.r*wobble));
    return{p,n};
  }
  for(let i=0;i<U;i++)for(let j=0;j<V;j++){
    for(let kind=0;kind<4;kind++){
      const o=vertex(kind,i,j);
      if(kind===0){
        basePos.push(o.p.x,o.p.y,o.p.z);baseNorm.push(o.n.x,o.n.y,o.n.z);uv.push(i/U,j/V);
        const a=.5+.5*Math.sin(i*.31+j*.72+1.3*Math.sin(i*.07));
        const b=.5+.5*Math.sin(i*.17-j*.48+2.4);
        const c=.5+.5*Math.sin(i*.055+j*.26-.8);
        const heat=clamp(Math.pow(a,5)*1.25+Math.pow(b,8)*.95+Math.pow(c,12)*.55,0,1);
        heatColors.push(1.0*heat,.17*heat,.012*heat);
      }else{
        targetPos[kind-1].push(o.p.x,o.p.y,o.p.z);targetNorm[kind-1].push(o.n.x,o.n.y,o.n.z);
      }
    }
  }
  for(let i=0;i<U;i++)for(let j=0;j<V;j++){
    const ni=(i+1)%U,nj=(j+1)%V,a=i*V+j,b=ni*V+j,c=ni*V+nj,d=i*V+nj;
    indices.push(a,b,d,b,c,d);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(basePos,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(baseNorm,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(heatColors,3));
  geometry.setIndex(indices);
  geometry.morphAttributes.position=targetPos.map(a=>new THREE.Float32BufferAttribute(a,3));
  geometry.morphAttributes.normal=targetNorm.map(a=>new THREE.Float32BufferAttribute(a,3));
  geometry.morphTargetsRelative=false;geometry.computeBoundingSphere();

  const shellMat=new THREE.MeshPhysicalMaterial({
    color:0x160b08,metalness:.18,roughness:.055,transmission:.50,thickness:.66,ior:1.46,
    clearcoat:1,clearcoatRoughness:.025,attenuationColor:new THREE.Color(0xff3e08),attenuationDistance:.48,
    emissive:new THREE.Color(0x220300),emissiveIntensity:.55,transparent:true,opacity:.93,side:THREE.DoubleSide
  });
  const veinMat=new THREE.MeshBasicMaterial({
    vertexColors:true,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,side:THREE.DoubleSide
  });
  const innerMat=new THREE.MeshBasicMaterial({
    color:0xff3000,transparent:true,opacity:.11,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,side:THREE.BackSide
  });
  const rimMat=new THREE.MeshBasicMaterial({
    color:0xff5a12,transparent:true,opacity:.085,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,side:THREE.BackSide
  });
  const shell=new THREE.Mesh(geometry,shellMat);shell.morphTargetInfluences=[0,0,0];group.add(shell);
  const veins=new THREE.Mesh(geometry,veinMat);veins.scale.setScalar(1.003);veins.morphTargetInfluences=[0,0,0];group.add(veins);
  const inner=new THREE.Mesh(geometry,innerMat);inner.scale.setScalar(.965);inner.morphTargetInfluences=[0,0,0];group.add(inner);
  const rim=new THREE.Mesh(geometry,rimMat);rim.scale.setScalar(1.027);rim.morphTargetInfluences=[0,0,0];group.add(rim);

  const bubbles=new THREE.Group();group.add(bubbles);
  for(let i=0;i<10;i++){
    const b=new THREE.Mesh(
      new THREE.SphereGeometry(.012+(i%4)*.006,12,8),
      new THREE.MeshBasicMaterial({color:i%3===0?0xffb06a:0xff5a16,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false})
    );
    b.userData.phase=i*.79;b.userData.radius=.25+(i%4)*.055;bubbles.add(b);
  }

  scene.add(new THREE.HemisphereLight(0xffe0ce,0x010000,1.2));
  const key=new THREE.DirectionalLight(0xfff7ef,7.5);key.position.set(3.6,4.4,5.8);scene.add(key);
  const fill=new THREE.DirectionalLight(0xffb883,3.0);fill.position.set(-3.2,1.2,3.0);scene.add(fill);
  const hot1=new THREE.PointLight(0xff3c00,34,7,1.7);hot1.position.set(1.1,-.4,2.2);scene.add(hot1);
  const hot2=new THREE.PointLight(0xff7a22,18,6,2);hot2.position.set(-1.7,.9,1.4);scene.add(hot2);

  const morphMeshes=[shell,veins,inner,rim];
  let targetP=progress(),p=targetP,targetX=0,targetY=0,px=0,py=0,raf=0,last=performance.now(),visible=true;

  function setState(pr){
    const state=nearestState(pr);root.dataset.v136State=NAMES[state];root.dataset.v138State=NAMES[state];
    if(readout)readout.textContent=NAMES[state];if(readoutIndex)readoutIndex.textContent=`0${state+1} / 04`;
    stateEls.forEach((el,i)=>el.classList.toggle('is-active',i===state));
  }
  function resize(){
    const w=Math.max(1,sticky.clientWidth),h=Math.max(1,sticky.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  function update(pr,now){
    const w=stateWeights(pr);
    for(const m of morphMeshes){m.morphTargetInfluences[0]=w[0];m.morphTargetInfluences[1]=w[1];m.morphTargetInfluences[2]=w[2]}
    const desktop=innerWidth>900;
    group.rotation.x=mix4([.09,.045,.02,.055],pr)-py*.024;
    group.rotation.y=mix4([-.08,-.025,.02,-.035],pr)+px*.038;
    group.rotation.z=mix4([-.025,.02,0,.012],pr);
    group.position.x=desktop?mix4([.82,.84,.86,.84],pr):0;
    group.position.y=desktop?mix4([.01,.00,.015,.00],pr):.42;
    const s=desktop?mix4([1.07,1.02,.99,1.03],pr):mix4([.84,.80,.76,.80],pr);group.scale.setScalar(s);
    shellMat.emissiveIntensity=mix4([.55,.62,.74,.68],pr);
    veinMat.opacity=mix4([1,1,.92,1],pr);innerMat.opacity=mix4([.10,.12,.15,.13],pr);rimMat.opacity=mix4([.075,.09,.11,.095],pr);
    hot1.intensity=mix4([30,34,39,36],pr);hot2.intensity=mix4([15,18,21,19],pr);
    const tw=w[1],iw=w[2];
    bubbles.children.forEach((b,i)=>{
      const ph=b.userData.phase+now*.00028,r=b.userData.radius*(1-.34*tw-.12*iw);
      b.position.set(Math.cos(ph)*r,Math.sin(ph*1.31)*r*.55,Math.sin(ph*.82)*.11);
      b.scale.setScalar(1-.58*tw-.22*iw);
    });
    sticky.style.setProperty('--v136-energy',String(mix4([.55,.72,.93,1],pr)));
  }
  function tick(now){
    raf=0;if(document.hidden)return;
    const dt=Math.min((now-last)/16.667,2.4);last=now;
    p=reduced?targetP:lerp(p,targetP,1-Math.pow(.78,dt));
    px=lerp(px,targetX,1-Math.pow(.84,dt));py=lerp(py,targetY,1-Math.pow(.84,dt));
    update(p,now);setState(targetP);renderer.render(scene,camera);
    if(visible&&!reduced)start();
  }
  function start(){if(!raf)raf=requestAnimationFrame(tick)}
  function onScroll(){targetP=progress();setState(targetP);if(reduced){p=targetP;update(p,performance.now());renderer.render(scene,camera)}start()}

  resize();setState(targetP);update(p,performance.now());renderer.render(scene,camera);
  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',()=>{resize();targetP=progress();setState(targetP);start()},{passive:true});
  if(!coarse&&!reduced){
    sticky.addEventListener('pointermove',e=>{const r=sticky.getBoundingClientRect();targetX=clamp((e.clientX-r.left)/r.width*2-1,-1,1);targetY=clamp((e.clientY-r.top)/r.height*2-1,-1,1);start()},{passive:true});
    sticky.addEventListener('pointerleave',()=>{targetX=0;targetY=0;start()},{passive:true});
  }
  const io=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting!==false;if(visible)start()},{rootMargin:'20% 0px'});io.observe(section);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){last=performance.now();start()}});

  root.dataset.v136Geometry=`fixed-topology-${U*V}`;
  root.dataset.v136States='liquid-ring-tower-infinity';
  root.dataset.v136Webgl='ready';
  root.dataset.v137Material='molten-orange-black-glass';
  root.dataset.v138Material='molten-black-glass-orange-veins';
  start();
}
init();
