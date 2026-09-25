/* MOVX v136 — approved fluid morph hero.
   Fixed-topology procedural sculpture morphs LIQUID -> RING -> TOWER -> INFINITY.
   The four states are deliberately very different in silhouette while sharing the same vertex layout,
   so the transition can be driven smoothly by scroll without swapping models or scenes. */
const root=document.documentElement;
const body=document.body;
const q=(s,c=document)=>c.querySelector(s);
const qa=(s,c=document)=>[...c.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse=matchMedia('(pointer:coarse)').matches;
root.classList.add('movx-v136');
root.dataset.movxV136='fluid-morph';
root.dataset.v136Design='approved-liquid-ring-tower-infinity';

const section=q('.v136-fluid-hero');
if(!section)root.dataset.v136Webgl='not-applicable';

function progress(){
  if(!section)return 0;
  const r=section.getBoundingClientRect();
  const travel=Math.max(1,r.height-innerHeight);
  return clamp(-r.top/travel,0,1);
}

const ANCHORS=[0,.30,.62,.94];
function stateWeights(p){
  if(p<=ANCHORS[1]){const t=smooth((p-ANCHORS[0])/(ANCHORS[1]-ANCHORS[0]));return [t,0,0]}
  if(p<=ANCHORS[2]){const t=smooth((p-ANCHORS[1])/(ANCHORS[2]-ANCHORS[1]));return [1-t,t,0]}
  const t=smooth((p-ANCHORS[2])/(ANCHORS[3]-ANCHORS[2]));return [0,1-t,t];
}
function nearestState(p){
  let best=0,d=Infinity;
  ANCHORS.forEach((v,i)=>{const n=Math.abs(v-p);if(n<d){d=n;best=i}});
  return best;
}
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
  try{THREE=await import('./vendor/three.module.js?v=v136-fluid-morph-approved');}
  catch(error){console.warn('[MOVX v136] Three.js unavailable',error);root.dataset.v136Webgl='fallback';return;}

  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:!coarse,powerPreference:'high-performance'});}
  catch(error){console.warn('[MOVX v136] WebGL unavailable',error);root.dataset.v136Webgl='fallback';return;}

  root.dataset.v136Webgl='ready';
  renderer.setClearColor(0x000000,0);
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.05:1.5));
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.18;
  if('outputColorSpace' in renderer&&THREE.SRGBColorSpace)renderer.outputColorSpace=THREE.SRGBColorSpace;

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(33,1,.1,30);
  camera.position.set(0,0,4.65);
  const group=new THREE.Group();scene.add(group);

  /*
   * One topology, four radically different centerline fields.
   * U x V is intentionally close to the Tripo master vertex density (~5k verts).
   */
  const U=160,V=32,TAU=Math.PI*2;
  const positions=[],normals=[],uv=[],indices=[];
  const targetPos=[[],[],[]],targetNorm=[[],[],[]];

  function safeFrame(c,dc,r){
    const T=dc.normalize();
    let B=new THREE.Vector3(0,0,1);
    if(Math.abs(T.dot(B))>.92)B.set(0,1,0);
    const N=new THREE.Vector3().crossVectors(B,T).normalize();
    B=new THREE.Vector3().crossVectors(T,N).normalize();
    return{c,T,N,B,r};
  }

  function liquidFrame(t){
    const th=TAU*t;
    const c=new THREE.Vector3(
      .62*Math.cos(th)+.15*Math.cos(2*th+.25),
      .225*Math.sin(th)+.105*Math.sin(2*th-.4),
      .075*Math.sin(3*th+.25)
    );
    const dc=new THREE.Vector3(
      -.62*Math.sin(th)-.30*Math.sin(2*th+.25),
      .225*Math.cos(th)+.21*Math.cos(2*th-.4),
      .225*Math.cos(3*th+.25)
    );
    const r=.235*(1+.26*Math.sin(3*th+.55)+.11*Math.cos(5*th-.25));
    return safeFrame(c,dc,r);
  }

  function ringFrame(t){
    const th=TAU*t;
    const c=new THREE.Vector3(.64*Math.cos(th),.64*Math.sin(th),.045*Math.sin(3*th));
    const dc=new THREE.Vector3(-.64*Math.sin(th),.64*Math.cos(th),.135*Math.cos(3*th));
    const r=.168*(1+.11*Math.sin(3*th+.25)+.05*Math.cos(5*th));
    return safeFrame(c,dc,r);
  }

  function towerFrame(t){
    let c,dc,r;
    if(t<.38){
      const s=t/.38,ss=s*s*(3-2*s);
      c=new THREE.Vector3(lerp(-.68,0,ss),lerp(-.64,.82,ss),.04*Math.sin(Math.PI*s));
      dc=new THREE.Vector3(.68/.38,1.46/.38,.04*Math.PI*Math.cos(Math.PI*s)/.38);
      r=lerp(.175,.072,ss);
    }else if(t<.76){
      const s=(t-.38)/.38,ss=s*s*(3-2*s);
      c=new THREE.Vector3(lerp(0,.68,ss),lerp(.82,-.64,ss),-.04*Math.sin(Math.PI*s));
      dc=new THREE.Vector3(.68/.38,-1.46/.38,-.04*Math.PI*Math.cos(Math.PI*s)/.38);
      r=lerp(.072,.175,ss);
    }else{
      const s=(t-.76)/.24;
      c=new THREE.Vector3(lerp(.68,-.68,s),-.64+.115*Math.sin(Math.PI*s),.026*Math.sin(2*Math.PI*s));
      dc=new THREE.Vector3(-1.36/.24,.115*Math.PI*Math.cos(Math.PI*s)/.24,.052*Math.PI*Math.cos(2*Math.PI*s)/.24);
      r=.155*(1-.10*Math.sin(Math.PI*s));
    }
    return safeFrame(c,dc,r);
  }

  function infinityFrame(t){
    const th=TAU*t;
    const c=new THREE.Vector3(.78*Math.cos(th),.43*Math.sin(2*th),.085*Math.sin(th));
    const dc=new THREE.Vector3(-.78*Math.sin(th),.86*Math.cos(2*th),.085*Math.cos(th));
    const r=.155*(1+.08*Math.sin(3*th+.4));
    return safeFrame(c,dc,r);
  }

  const frameFor=(kind,t)=>kind===0?liquidFrame(t):kind===1?ringFrame(t):kind===2?towerFrame(t):infinityFrame(t);

  function vertex(kind,i,j){
    const t=i/U,v=j/V*TAU,f=frameFor(kind,t);
    const organic=kind===0
      ?1+.075*Math.sin(i*.43+j*.71)+.035*Math.sin(i*.17-j*.49)
      :1+.025*Math.sin(i*.37+j*.57)+.012*Math.sin(i*.13-j*.41);
    const rr=f.r*organic;
    const n=f.N.clone().multiplyScalar(Math.cos(v)).add(f.B.clone().multiplyScalar(Math.sin(v))).normalize();
    const p=f.c.clone().add(n.clone().multiplyScalar(rr));
    return{p,n};
  }

  for(let i=0;i<U;i++)for(let j=0;j<V;j++){
    for(let kind=0;kind<4;kind++){
      const o=vertex(kind,i,j);
      if(kind===0){positions.push(o.p.x,o.p.y,o.p.z);normals.push(o.n.x,o.n.y,o.n.z);uv.push(i/U,j/V);}
      else{targetPos[kind-1].push(o.p.x,o.p.y,o.p.z);targetNorm[kind-1].push(o.n.x,o.n.y,o.n.z);}
    }
  }
  for(let i=0;i<U;i++)for(let j=0;j<V;j++){
    const ni=(i+1)%U,nj=(j+1)%V,a=i*V+j,b=ni*V+j,c=ni*V+nj,d=i*V+nj;
    indices.push(a,b,d,b,c,d);
  }

  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometry.setIndex(indices);
  geometry.morphAttributes.position=targetPos.map(a=>new THREE.Float32BufferAttribute(a,3));
  geometry.morphAttributes.normal=targetNorm.map(a=>new THREE.Float32BufferAttribute(a,3));
  geometry.morphTargetsRelative=false;
  geometry.computeBoundingSphere();

  const material=new THREE.MeshPhysicalMaterial({
    color:0x180b07,
    metalness:.03,
    roughness:.075,
    transmission:.84,
    thickness:.78,
    ior:1.46,
    clearcoat:.64,
    clearcoatRoughness:.045,
    attenuationColor:new THREE.Color(0xff4d0b),
    attenuationDistance:.78,
    emissive:new THREE.Color(0x9d2100),
    emissiveIntensity:1.2,
    transparent:true,
    opacity:1,
    side:THREE.DoubleSide
  });
  const uniforms={uTime:{value:0},uFluid:{value:1},uTower:{value:0}};
  material.onBeforeCompile=shader=>{
    shader.uniforms.uTime=uniforms.uTime;
    shader.uniforms.uFluid=uniforms.uFluid;
    shader.vertexShader='uniform float uTime; uniform float uFluid; varying vec3 vMovxLocal;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <morphtarget_vertex>',`#include <morphtarget_vertex>
      float movxWave=(sin(transformed.x*8.0+uTime*1.35)+sin(transformed.y*10.0-uTime*1.05))*0.0048*uFluid;
      transformed += objectNormal*movxWave;
      vMovxLocal=transformed;`);
    material.userData.shader=shader;
  };

  const mesh=new THREE.Mesh(geometry,material);
  mesh.morphTargetInfluences=[0,0,0];group.add(mesh);

  const glowMat=new THREE.MeshBasicMaterial({color:0xff5a18,transparent:true,opacity:.075,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.BackSide});
  const glow=new THREE.Mesh(geometry,glowMat);glow.scale.setScalar(1.025);glow.morphTargetInfluences=[0,0,0];group.add(glow);

  const bubbles=new THREE.Group();group.add(bubbles);
  for(let i=0;i<12;i++){
    const g=new THREE.SphereGeometry(.016+(i%4)*.0065,12,8);
    const m=new THREE.MeshPhysicalMaterial({color:0xff7a2e,roughness:.04,transmission:.76,thickness:.22,ior:1.38,emissive:0x5a1200,emissiveIntensity:.95});
    const b=new THREE.Mesh(g,m);b.userData.phase=i*.71;b.userData.radius=.39+(i%3)*.065;bubbles.add(b);
  }

  scene.add(new THREE.HemisphereLight(0xffd8bd,0x060201,1.3));
  const key=new THREE.DirectionalLight(0xfff4ed,4.0);key.position.set(3.8,4.3,5.8);scene.add(key);
  const orange=new THREE.PointLight(0xff4b0a,25,8,2);orange.position.set(1.8,-.45,2.4);scene.add(orange);
  const rim=new THREE.PointLight(0xffa25b,14,7,2);rim.position.set(-2.7,1.8,1.4);scene.add(rim);

  let targetP=progress(),p=targetP,raf=0,last=performance.now(),targetX=0,targetY=0,px=0,py=0,visible=true;
  const names=['LIQUID','RING','TOWER','INFINITY'];

  function resize(){
    const w=Math.max(1,sticky.clientWidth),h=Math.max(1,sticky.clientHeight);
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  }

  function update(pr,now){
    const w=stateWeights(pr);
    mesh.morphTargetInfluences[0]=w[0];mesh.morphTargetInfluences[1]=w[1];mesh.morphTargetInfluences[2]=w[2];
    glow.morphTargetInfluences[0]=w[0];glow.morphTargetInfluences[1]=w[1];glow.morphTargetInfluences[2]=w[2];

    uniforms.uTime.value=now*.001;
    uniforms.uFluid.value=mix4([1,.72,.22,.48],pr);
    if(material.userData.shader){material.userData.shader.uniforms.uTime.value=uniforms.uTime.value;material.userData.shader.uniforms.uFluid.value=uniforms.uFluid.value;}

    const desktop=innerWidth>900;
    group.rotation.x=mix4([.10,.05,.02,.06],pr)-py*.035;
    group.rotation.y=mix4([-.14,-.04,0,-.05],pr)+px*.055;
    group.rotation.z=mix4([-.045,.025,0,.015],pr);
    group.position.x=desktop?mix4([1.03,1.08,1.10,1.07],pr):0;
    group.position.y=desktop?mix4([-.02,0,.01,0],pr):.44;
    const s=desktop?mix4([1.58,1.48,1.38,1.46],pr):mix4([1.08,1.00,.94,1.02],pr);
    group.scale.setScalar(s);
    camera.position.z=desktop?4.65:4.95;

    material.emissiveIntensity=mix4([1.18,1.30,1.58,1.42],pr);
    orange.intensity=mix4([19,25,29,27],pr);
    glowMat.opacity=mix4([.07,.075,.095,.085],pr);

    const towerWeight=w[1];
    const infinityWeight=w[2];
    bubbles.children.forEach((b,i)=>{
      const ph=b.userData.phase+now*.00034,r=b.userData.radius*(1-.40*towerWeight-.18*infinityWeight);
      b.position.set(Math.cos(ph)*r,Math.sin(ph*1.31)*r*.43,Math.sin(ph)*.17);
      b.scale.setScalar(1-.72*towerWeight-.38*infinityWeight);
      b.visible=b.scale.x>.18;
    });

    const state=nearestState(pr);
    root.dataset.v136State=names[state];
    if(readout)readout.textContent=names[state];
    if(readoutIndex)readoutIndex.textContent=`0${state+1} / 04`;
    stateEls.forEach((el,i)=>el.classList.toggle('is-active',i===state));
    sticky.style.setProperty('--v136-energy',String(mix4([.34,.58,.88,1],pr)));
  }

  function tick(now){
    raf=0;if(!visible||document.hidden)return;
    const dt=Math.min((now-last)/16.667,2.2);last=now;
    p=lerp(p,targetP,1-Math.pow(.82,dt));px=lerp(px,targetX,1-Math.pow(.84,dt));py=lerp(py,targetY,1-Math.pow(.84,dt));
    update(reduced?0:p,now);renderer.render(scene,camera);
    if(!reduced&&(Math.abs(p-targetP)>.00045||Math.abs(px-targetX)>.001||Math.abs(py-targetY)>.001))start();
  }
  function start(){if(!raf)raf=requestAnimationFrame(tick)}
  function onScroll(){targetP=progress();start()}

  resize();update(reduced?0:p,performance.now());renderer.render(scene,camera);
  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',()=>{resize();targetP=progress();start()},{passive:true});
  if(!coarse&&!reduced){
    sticky.addEventListener('pointermove',e=>{const r=sticky.getBoundingClientRect();targetX=clamp((e.clientX-r.left)/r.width*2-1,-1,1);targetY=clamp((e.clientY-r.top)/r.height*2-1,-1,1);start()},{passive:true});
    sticky.addEventListener('pointerleave',()=>{targetX=0;targetY=0;start()},{passive:true});
  }
  const io=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting!==false;if(visible)start()},{rootMargin:'20% 0px'});io.observe(section);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){last=performance.now();start()}});
  root.dataset.v136Geometry='fixed-topology-5120';
  root.dataset.v136States='liquid-ring-tower-infinity';
}

init();
