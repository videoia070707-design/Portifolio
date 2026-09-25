/* MOVX v137 — reference-matched orange/black molten-glass morph.
   Compatibility surface remains v136 so existing MOVX QA and markup stay valid.
   One fixed-topology 5120-vertex sculpture morphs LIQUID -> RING -> TOWER -> INFINITY. */
const root=document.documentElement;
const q=(s,c=document)=>c.querySelector(s);
const qa=(s,c=document)=>[...c.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse=matchMedia('(pointer:coarse)').matches;
root.classList.add('movx-v136','movx-v137');
root.dataset.movxV136='fluid-morph';
root.dataset.movxV137='reference-morph';
root.dataset.v136Design='orange-black-molten-glass-reference';
const section=q('.v136-fluid-hero');
if(!section){root.dataset.v136Webgl='not-applicable';}

const ANCHORS=[0,.30,.62,.94];
let sectionTop=0,travel=1;
function measure(){
  if(!section)return;
  sectionTop=section.getBoundingClientRect().top+scrollY;
  travel=Math.max(1,section.offsetHeight-innerHeight);
}
function progress(){return section?clamp((scrollY-sectionTop)/travel,0,1):0}
function stateWeights(p){
  if(p<=ANCHORS[1]){const t=smooth((p-ANCHORS[0])/(ANCHORS[1]-ANCHORS[0]));return [t,0,0]}
  if(p<=ANCHORS[2]){const t=smooth((p-ANCHORS[1])/(ANCHORS[2]-ANCHORS[1]));return [1-t,t,0]}
  const t=smooth((p-ANCHORS[2])/(ANCHORS[3]-ANCHORS[2]));return [0,1-t,t];
}
function nearestState(p){let best=0,d=Infinity;ANCHORS.forEach((v,i)=>{const n=Math.abs(v-p);if(n<d){d=n;best=i}});return best}
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
  try{THREE=await import('./vendor/three.module.js?v=v137-reference-morph');}
  catch(error){console.warn('[MOVX v137] Three.js unavailable',error);root.dataset.v136Webgl='fallback';return;}

  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:false,antialias:!coarse,powerPreference:'high-performance'});}
  catch(error){console.warn('[MOVX v137] WebGL unavailable',error);root.dataset.v136Webgl='fallback';return;}

  renderer.setClearColor(0x000000,1);
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.05:1.6));
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.34;
  if('outputColorSpace' in renderer&&THREE.SRGBColorSpace)renderer.outputColorSpace=THREE.SRGBColorSpace;

  const scene=new THREE.Scene();scene.background=new THREE.Color(0x000000);
  const camera=new THREE.PerspectiveCamera(32,1,.1,30);
  camera.position.set(0,.02,4.62);camera.lookAt(0,0,0);
  const group=new THREE.Group();scene.add(group);

  const U=160,V=32,TAU=Math.PI*2;
  const positions=[],normals=[],uv=[],colors=[],indices=[];
  const targetPos=[[],[],[]],targetNorm=[[],[],[]];

  function frame(c,dc,r){
    const T=dc.normalize();let B=new THREE.Vector3(0,0,1);if(Math.abs(T.dot(B))>.92)B.set(0,1,0);
    const N=new THREE.Vector3().crossVectors(B,T).normalize();B=new THREE.Vector3().crossVectors(T,N).normalize();
    return{c,N,B,r};
  }
  function liquid(t){
    const th=TAU*t;
    return frame(
      new THREE.Vector3(.67*Math.cos(th)+.18*Math.cos(2*th+.22),.235*Math.sin(th)+.115*Math.sin(2*th-.36),.07*Math.sin(3*th+.2)),
      new THREE.Vector3(-.67*Math.sin(th)-.36*Math.sin(2*th+.22),.235*Math.cos(th)+.23*Math.cos(2*th-.36),.21*Math.cos(3*th+.2)),
      .235*(1+.28*Math.sin(3*th+.58)+.12*Math.cos(5*th-.18))
    );
  }
  function ring(t){
    const th=TAU*t;
    return frame(
      new THREE.Vector3(.66*Math.cos(th),.66*Math.sin(th),.07*Math.sin(3*th+.2)),
      new THREE.Vector3(-.66*Math.sin(th),.66*Math.cos(th),.21*Math.cos(3*th+.2)),
      .17*(1+.13*Math.sin(3*th+.3)+.055*Math.cos(5*th-.1))
    );
  }
  function tower(t){
    let c,dc,r;
    if(t<.37){const s=t/.37,ss=s*s*(3-2*s);c=new THREE.Vector3(lerp(-.69,0,ss),lerp(-.65,.88,ss),.05*Math.sin(Math.PI*s));dc=new THREE.Vector3(.69/.37,1.53/.37,.05*Math.PI*Math.cos(Math.PI*s)/.37);r=lerp(.18,.072,ss)}
    else if(t<.74){const s=(t-.37)/.37,ss=s*s*(3-2*s);c=new THREE.Vector3(lerp(0,.69,ss),lerp(.88,-.65,ss),-.05*Math.sin(Math.PI*s));dc=new THREE.Vector3(.69/.37,-1.53/.37,-.05*Math.PI*Math.cos(Math.PI*s)/.37);r=lerp(.072,.18,ss)}
    else{const s=(t-.74)/.26;c=new THREE.Vector3(lerp(.69,-.69,s),-.65+.14*Math.sin(Math.PI*s),.035*Math.sin(2*Math.PI*s));dc=new THREE.Vector3(-1.38/.26,.14*Math.PI*Math.cos(Math.PI*s)/.26,.07*Math.PI*Math.cos(2*Math.PI*s)/.26);r=.155*(1-.12*Math.sin(Math.PI*s))}
    return frame(c,dc,r);
  }
  function infinity(t){
    const th=TAU*t;
    return frame(
      new THREE.Vector3(.80*Math.cos(th),.445*Math.sin(2*th),.09*Math.sin(th)),
      new THREE.Vector3(-.80*Math.sin(th),.89*Math.cos(2*th),.09*Math.cos(th)),
      .158*(1+.09*Math.sin(3*th+.38))
    );
  }
  const getFrame=(kind,t)=>kind===0?liquid(t):kind===1?ring(t):kind===2?tower(t):infinity(t);
  function vertex(kind,i,j){
    const t=i/U,a=j/V*TAU,f=getFrame(kind,t);
    const organic=(kind===0?1+.085*Math.sin(i*.41+j*.67)+.04*Math.sin(i*.16-j*.45):1+.025*Math.sin(i*.37+j*.53));
    const rr=f.r*organic;
    const n=f.N.clone().multiplyScalar(Math.cos(a)).add(f.B.clone().multiplyScalar(Math.sin(a))).normalize();
    return{p:f.c.clone().add(n.clone().multiplyScalar(rr)),n};
  }
  for(let i=0;i<U;i++)for(let j=0;j<V;j++){
    for(let kind=0;kind<4;kind++){
      const o=vertex(kind,i,j);
      if(kind===0){
        positions.push(o.p.x,o.p.y,o.p.z);normals.push(o.n.x,o.n.y,o.n.z);uv.push(i/U,j/V);
        const field=.5+.5*Math.sin(i*.33+j*.73+Math.sin(i*.08)*2.1);
        const streak=.5+.5*Math.sin(i*.11-j*.38+1.6);
        const hot=clamp((field*.72+streak*.28-.36)*1.7,0,1);
        colors.push(lerp(.025,1,hot),lerp(.004,.19,hot),lerp(.001,.018,hot));
      }else{targetPos[kind-1].push(o.p.x,o.p.y,o.p.z);targetNorm[kind-1].push(o.n.x,o.n.y,o.n.z)}
    }
  }
  for(let i=0;i<U;i++)for(let j=0;j<V;j++){
    const ni=(i+1)%U,nj=(j+1)%V,a=i*V+j,b=ni*V+j,c=ni*V+nj,d=i*V+nj;indices.push(a,b,d,b,c,d);
  }

  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);
  geometry.morphAttributes.position=targetPos.map(a=>new THREE.Float32BufferAttribute(a,3));
  geometry.morphAttributes.normal=targetNorm.map(a=>new THREE.Float32BufferAttribute(a,3));
  geometry.morphTargetsRelative=false;geometry.computeBoundingSphere();

  const shellMat=new THREE.MeshPhysicalMaterial({
    color:0xffffff,vertexColors:true,metalness:.12,roughness:.065,transmission:.18,thickness:.72,ior:1.48,
    clearcoat:1,clearcoatRoughness:.035,attenuationColor:new THREE.Color(0xff3f08),attenuationDistance:.62,
    emissive:new THREE.Color(0x4b0900),emissiveIntensity:1.55,side:THREE.DoubleSide
  });
  const coreMat=new THREE.MeshBasicMaterial({color:0xff3c05,transparent:true,opacity:.24,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
  const rimMat=new THREE.MeshBasicMaterial({color:0xff6a18,transparent:true,opacity:.13,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.BackSide,toneMapped:false});
  const reflectMat=new THREE.MeshBasicMaterial({color:0xff4d0b,transparent:true,opacity:.055,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
  const shell=new THREE.Mesh(geometry,shellMat);shell.morphTargetInfluences=[0,0,0];group.add(shell);
  const core=new THREE.Mesh(geometry,coreMat);core.scale.setScalar(.955);core.morphTargetInfluences=[0,0,0];group.add(core);
  const rimGlow=new THREE.Mesh(geometry,rimMat);rimGlow.scale.setScalar(1.026);rimGlow.morphTargetInfluences=[0,0,0];group.add(rimGlow);
  const reflection=new THREE.Mesh(geometry,reflectMat);reflection.position.y=-1.17;reflection.scale.set(1,-.16,1);reflection.morphTargetInfluences=[0,0,0];group.add(reflection);

  const bubbles=new THREE.Group();group.add(bubbles);
  for(let i=0;i<14;i++){
    const b=new THREE.Mesh(new THREE.SphereGeometry(.014+(i%4)*.006,12,8),new THREE.MeshBasicMaterial({color:i%3===0?0xffb05c:0xff5a14,transparent:true,opacity:.42,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
    b.userData.phase=i*.67;b.userData.radius=.34+(i%4)*.055;bubbles.add(b);
  }

  scene.add(new THREE.HemisphereLight(0xffddc5,0x020100,1.7));
  const white=new THREE.DirectionalLight(0xfff3e9,5.4);white.position.set(3.8,4.8,5.6);scene.add(white);
  const orangeA=new THREE.PointLight(0xff3d05,34,9,1.8);orangeA.position.set(1.5,-.25,2.5);scene.add(orangeA);
  const orangeB=new THREE.PointLight(0xff8a34,22,8,2);orangeB.position.set(-2.4,1.7,1.2);scene.add(orangeB);
  const orangeC=new THREE.PointLight(0xff2f00,18,7,2);orangeC.position.set(.1,-1.2,2.0);scene.add(orangeC);

  let targetP=0,p=0,px=0,py=0,targetX=0,targetY=0,raf=0,last=performance.now(),visible=true;
  const names=['LIQUID','RING','TOWER','INFINITY'];
  function resize(){const w=Math.max(1,sticky.clientWidth),h=Math.max(1,sticky.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();measure()}
  function setInfluences(w){for(const m of [shell,core,rimGlow,reflection]){m.morphTargetInfluences[0]=w[0];m.morphTargetInfluences[1]=w[1];m.morphTargetInfluences[2]=w[2]}}
  function update(pr,now){
    const w=stateWeights(pr);setInfluences(w);
    const desktop=innerWidth>900;
    group.rotation.x=mix4([.105,.055,.025,.065],pr)-py*.032;
    group.rotation.y=mix4([-.16,-.035,.015,-.045],pr)+px*.052;
    group.rotation.z=mix4([-.055,.018,.002,.012],pr);
    group.position.x=desktop?mix4([1.00,1.03,1.08,1.05],pr):0;
    group.position.y=desktop?mix4([-.01,0,.01,0],pr):.45;
    const s=desktop?mix4([1.60,1.49,1.37,1.47],pr):mix4([1.08,1.00,.94,1.02],pr);group.scale.setScalar(s);
    shellMat.emissiveIntensity=mix4([1.45,1.65,1.92,1.78],pr);
    coreMat.opacity=mix4([.22,.25,.30,.27],pr);rimMat.opacity=mix4([.12,.14,.18,.15],pr);reflectMat.opacity=mix4([.045,.06,.075,.065],pr);
    orangeA.intensity=mix4([28,34,39,36],pr);orangeB.intensity=mix4([18,23,27,25],pr);
    const towerW=w[1],infW=w[2];
    bubbles.children.forEach((b,i)=>{const ph=b.userData.phase+now*.00042,r=b.userData.radius*(1-.45*towerW-.20*infW);b.position.set(Math.cos(ph)*r,Math.sin(ph*1.27)*r*.46,Math.sin(ph*.8)*.18);const bs=1-.72*towerW-.35*infW;b.scale.setScalar(bs);b.visible=bs>.18});
    const state=nearestState(pr);root.dataset.v136State=names[state];if(readout)readout.textContent=names[state];if(readoutIndex)readoutIndex.textContent=`0${state+1} / 04`;stateEls.forEach((el,i)=>el.classList.toggle('is-active',i===state));
    sticky.style.setProperty('--v136-energy',String(mix4([.42,.64,.94,1],pr)));
  }
  function tick(now){
    raf=0;if(document.hidden)return;
    const dt=Math.min((now-last)/16.667,2.2);last=now;
    p=reduced?targetP:lerp(p,targetP,1-Math.pow(.82,dt));px=lerp(px,targetX,1-Math.pow(.84,dt));py=lerp(py,targetY,1-Math.pow(.84,dt));
    update(p,now);renderer.render(scene,camera);
    if(visible&&!reduced)start();
  }
  function start(){if(!raf)raf=requestAnimationFrame(tick)}
  function onScroll(){targetP=progress();if(reduced){p=targetP;update(p,performance.now());renderer.render(scene,camera)}start()}

  resize();targetP=progress();p=targetP;update(p,performance.now());renderer.render(scene,camera);
  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',()=>{resize();targetP=progress();start()},{passive:true});
  if(!coarse&&!reduced){sticky.addEventListener('pointermove',e=>{const r=sticky.getBoundingClientRect();targetX=clamp((e.clientX-r.left)/r.width*2-1,-1,1);targetY=clamp((e.clientY-r.top)/r.height*2-1,-1,1);start()},{passive:true});sticky.addEventListener('pointerleave',()=>{targetX=0;targetY=0;start()},{passive:true})}
  const io=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting!==false;if(visible)start()},{rootMargin:'20% 0px'});io.observe(section);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){last=performance.now();start()}});
  root.dataset.v136Geometry='fixed-topology-5120';root.dataset.v136States='liquid-ring-tower-infinity';root.dataset.v136Webgl='ready';root.dataset.v137Material='molten-orange-black-glass';
  start();
}
init();
