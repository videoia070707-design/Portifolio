/* MOVX v136 — procedural fixed-topology fluid morph.
   One lightweight tube mesh morphs LIQUID -> RING -> TOWER -> INFINITY by native scroll.
   No scroll-jacking; existing Scroll World below this hero is untouched. */
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

const section=q('.v136-fluid-hero');
if(!section){root.dataset.v136Webgl='not-applicable';}

function progress(){
 if(!section)return 0;
 const r=section.getBoundingClientRect();
 const travel=Math.max(1,r.height-innerHeight);
 return clamp(-r.top/travel,0,1);
}
function stateWeights(p){
 const a=[0,.30,.62,.94];
 if(p<=a[1]){const t=smooth((p-a[0])/(a[1]-a[0]));return [t,0,0];}
 if(p<=a[2]){const t=smooth((p-a[1])/(a[2]-a[1]));return [1-t,t,0];}
 const t=smooth((p-a[2])/(a[3]-a[2]));return [0,1-t,t];
}
function nearestState(p){
 const anchors=[0,.30,.62,.94];let best=0,d=Infinity;
 anchors.forEach((v,i)=>{const n=Math.abs(v-p);if(n<d){d=n;best=i}});return best;
}
function mix4(values,p){
 const a=[0,.30,.62,.94];
 let i=0;if(p>a[2])i=2;else if(p>a[1])i=1;
 const t=smooth((p-a[i])/(a[i+1]-a[i]));
 return lerp(values[i],values[i+1],t);
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
 try{THREE=await import('./vendor/three.module.js?v=v136-fluid-morph');}
 catch(error){console.warn('[MOVX v136] Three.js unavailable',error);root.dataset.v136Webgl='fallback';return;}
 let renderer;
 try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:!coarse,powerPreference:'high-performance'});}
 catch(error){console.warn('[MOVX v136] WebGL unavailable',error);root.dataset.v136Webgl='fallback';return;}
 root.dataset.v136Webgl='ready';
 renderer.setClearColor(0x000000,0);
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.08:1.45));
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.12;
 if('outputColorSpace'in renderer&&THREE.SRGBColorSpace)renderer.outputColorSpace=THREE.SRGBColorSpace;

 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(35,1,.1,30);
 camera.position.set(0,0,4.4);
 const group=new THREE.Group();scene.add(group);
 const U=128,V=24;
 const positions=[],normals=[],uv=[],indices=[];
 const targetPos=[[],[],[]],targetNorm=[[],[],[]];

 function frameFor(kind,t){
   const TAU=Math.PI*2,th=TAU*t;
   let c,dc,r;
   if(kind===0){
     c=new THREE.Vector3(.58*Math.cos(th)+.13*Math.cos(3*th),.27*Math.sin(th)+.11*Math.sin(2*th),.075*Math.sin(2*th));
     dc=new THREE.Vector3(-.58*Math.sin(th)-.39*Math.sin(3*th),.27*Math.cos(th)+.22*Math.cos(2*th),.15*Math.cos(2*th));
     r=.185*(1+.25*Math.sin(3*th+.45)+.10*Math.cos(5*th));
   }else if(kind===1){
     c=new THREE.Vector3(.52*Math.cos(th),.52*Math.sin(th),.055*Math.sin(3*th));
     dc=new THREE.Vector3(-.52*Math.sin(th),.52*Math.cos(th),.165*Math.cos(3*th));
     r=.145*(1+.10*Math.sin(3*th+.3));
   }else if(kind===2){
     if(t<.42){
       const s=smooth(t/.42);c=new THREE.Vector3(lerp(-.53,0,s),lerp(-.54,.70,s),.035*Math.sin(Math.PI*s));
       dc=new THREE.Vector3(1.26,2.95,.08*Math.cos(Math.PI*s));r=lerp(.155,.075,s);
     }else if(t<.84){
       const s=smooth((t-.42)/.42);c=new THREE.Vector3(lerp(0,.53,s),lerp(.70,-.54,s),-.035*Math.sin(Math.PI*s));
       dc=new THREE.Vector3(1.26,-2.95,-.08*Math.cos(Math.PI*s));r=lerp(.075,.155,s);
     }else{
       const s=smooth((t-.84)/.16);c=new THREE.Vector3(lerp(.53,-.53,s),-.54+.17*Math.sin(Math.PI*s),.02*Math.sin(2*Math.PI*s));
       dc=new THREE.Vector3(-6.6,.17*Math.PI*Math.cos(Math.PI*s),.04*Math.PI*Math.cos(2*Math.PI*s));r=.145;
     }
   }else{
     c=new THREE.Vector3(.61*Math.cos(th),.33*Math.sin(2*th),.055*Math.sin(th));
     dc=new THREE.Vector3(-.61*Math.sin(th),.66*Math.cos(2*th),.055*Math.cos(th));
     r=.135*(1+.08*Math.sin(3*th+.5));
   }
   const T=dc.normalize();let B=new THREE.Vector3(0,0,1);if(Math.abs(T.dot(B))>.92)B.set(0,1,0);
   const N=new THREE.Vector3().crossVectors(B,T).normalize();B=new THREE.Vector3().crossVectors(T,N).normalize();
   return{c,T,N,B,r};
 }
 function vertex(kind,i,j){
   const t=i/U,v=j/V*Math.PI*2,f=frameFor(kind,t);
   const organic=kind===0?1+.055*Math.sin(i*.47+j*.73)+.025*Math.sin(i*.19-j*.52):1+.018*Math.sin(i*.43+j*.61);
   const rr=f.r*organic;
   const n=f.N.clone().multiplyScalar(Math.cos(v)).add(f.B.clone().multiplyScalar(Math.sin(v))).normalize();
   const p=f.c.clone().add(n.clone().multiplyScalar(rr));return{p,n};
 }
 for(let i=0;i<U;i++)for(let j=0;j<V;j++){
   for(let kind=0;kind<4;kind++){
     const o=vertex(kind,i,j);
     if(kind===0){positions.push(o.p.x,o.p.y,o.p.z);normals.push(o.n.x,o.n.y,o.n.z);uv.push(i/U,j/V);}
     else{targetPos[kind-1].push(o.p.x,o.p.y,o.p.z);targetNorm[kind-1].push(o.n.x,o.n.y,o.n.z);}
   }
 }
 for(let i=0;i<U;i++)for(let j=0;j<V;j++){
   const ni=(i+1)%U,nj=(j+1)%V,a=i*V+j,b=ni*V+j,c=ni*V+nj,d=i*V+nj;indices.push(a,b,d,b,c,d);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);
 geometry.morphAttributes.position=targetPos.map(a=>new THREE.Float32BufferAttribute(a,3));
 geometry.morphAttributes.normal=targetNorm.map(a=>new THREE.Float32BufferAttribute(a,3));
 geometry.morphTargetsRelative=false;geometry.computeBoundingSphere();

 const material=new THREE.MeshPhysicalMaterial({color:0x27120c,metalness:.06,roughness:.11,transmission:.73,thickness:.62,ior:1.43,clearcoat:.48,clearcoatRoughness:.08,attenuationColor:new THREE.Color(0xff5a18),attenuationDistance:1.05,emissive:new THREE.Color(0x7a1b00),emissiveIntensity:1.05,transparent:true,opacity:1,side:THREE.DoubleSide});
 const uniforms={uTime:{value:0},uFluid:{value:1},uTower:{value:0}};
 material.onBeforeCompile=shader=>{
   shader.uniforms.uTime=uniforms.uTime;shader.uniforms.uFluid=uniforms.uFluid;shader.uniforms.uTower=uniforms.uTower;
   shader.vertexShader='uniform float uTime; uniform float uFluid; varying vec3 vMovxLocal;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <morphtarget_vertex>','#include <morphtarget_vertex>\nfloat movxWave=(sin(transformed.x*8.0+uTime*1.4)+sin(transformed.y*11.0-uTime*1.1))*0.0045*uFluid; transformed += objectNormal*movxWave; vMovxLocal=transformed;');
   shader.fragmentShader='uniform float uTower; varying vec3 vMovxLocal;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(uTower>.72 && vMovxLocal.y<-.11 && vMovxLocal.y>-.56){ float archW=mix(.28,.055,smoothstep(-.56,-.11,vMovxLocal.y)); if(abs(vMovxLocal.x)<archW) discard; }');
   material.userData.shader=shader;
 };
 const mesh=new THREE.Mesh(geometry,material);mesh.morphTargetInfluences=[0,0,0];group.add(mesh);
 const glowMat=new THREE.MeshBasicMaterial({color:0xff5a18,transparent:true,opacity:.055,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.BackSide});
 const glow=new THREE.Mesh(geometry,glowMat);glow.scale.setScalar(1.018);glow.morphTargetInfluences=[0,0,0];group.add(glow);
 const bubbles=new THREE.Group();group.add(bubbles);
 for(let i=0;i<11;i++){
   const g=new THREE.SphereGeometry(.018+(i%4)*.006,12,8);
   const m=new THREE.MeshPhysicalMaterial({color:0xff7a2e,roughness:.05,transmission:.65,thickness:.2,emissive:0x5a1200,emissiveIntensity:.9});
   const b=new THREE.Mesh(g,m);b.userData.phase=i*.73;b.userData.radius=.42+(i%3)*.07;bubbles.add(b);
 }
 scene.add(new THREE.HemisphereLight(0xffd8bd,0x090403,1.15));
 const key=new THREE.DirectionalLight(0xfff1e8,3.6);key.position.set(3.5,4.2,5.5);scene.add(key);
 const orange=new THREE.PointLight(0xff4e0d,22,8,2);orange.position.set(1.8,-.4,2.5);scene.add(orange);
 const rim=new THREE.PointLight(0xffa15a,12,7,2);rim.position.set(-2.6,1.8,1.1);scene.add(rim);

 let targetP=progress(),p=targetP,raf=0,last=performance.now(),targetX=0,targetY=0,px=0,py=0,visible=true;
 const names=['LIQUID','RING','TOWER','INFINITY'];
 function resize(){const w=Math.max(1,sticky.clientWidth),h=Math.max(1,sticky.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
 function update(pr,now){
   const w=stateWeights(pr);mesh.morphTargetInfluences[0]=w[0];mesh.morphTargetInfluences[1]=w[1];mesh.morphTargetInfluences[2]=w[2];glow.morphTargetInfluences[0]=w[0];glow.morphTargetInfluences[1]=w[1];glow.morphTargetInfluences[2]=w[2];
   const towerWeight=w[1];uniforms.uTime.value=now*.001;uniforms.uFluid.value=1-.68*towerWeight;uniforms.uTower.value=towerWeight;
   if(material.userData.shader){material.userData.shader.uniforms.uTime.value=uniforms.uTime.value;material.userData.shader.uniforms.uFluid.value=uniforms.uFluid.value;material.userData.shader.uniforms.uTower.value=towerWeight;}
   group.rotation.set(mix4([.18,.25,.02,.13],pr)-py*.05,mix4([-.45,-.18,.02,-.36],pr)+px*.08,mix4([-.06,.12,0,.04],pr));
   const desktop=innerWidth>900;group.position.x=desktop?mix4([1.05,1.12,1.10,1.08],pr):0;group.position.y=desktop?-.02:.42;
   const baseScale=desktop?1.58:1.12;group.scale.setScalar(baseScale*mix4([1,1,.86,1],pr));camera.position.z=desktop?4.55:4.9;
   material.emissiveIntensity=mix4([1.15,1.32,1.58,1.38],pr);orange.intensity=mix4([18,24,28,25],pr);
   bubbles.children.forEach((b,i)=>{const ph=b.userData.phase+now*.00035,r=b.userData.radius*(1-.28*towerWeight);b.position.set(Math.cos(ph)*r,Math.sin(ph*1.3)*r*.42,Math.sin(ph)*.16);b.scale.setScalar(1-.46*towerWeight);});
   const state=nearestState(pr);root.dataset.v136State=names[state];if(readout)readout.textContent=names[state];if(readoutIndex)readoutIndex.textContent=`0${state+1} / 04`;stateEls.forEach((el,i)=>el.classList.toggle('is-active',i===state));sticky.style.setProperty('--v136-energy',String(mix4([.34,.58,.84,1],pr)));
 }
 function tick(now){raf=0;if(!visible||document.hidden)return;const dt=Math.min((now-last)/16.667,2.2);last=now;p=lerp(p,targetP,1-Math.pow(.82,dt));px=lerp(px,targetX,1-Math.pow(.84,dt));py=lerp(py,targetY,1-Math.pow(.84,dt));update(reduced?0:p,now);renderer.render(scene,camera);if(!reduced&&(Math.abs(p-targetP)>.0005||Math.abs(px-targetX)>.001||Math.abs(py-targetY)>.001))start();}
 function start(){if(!raf)raf=requestAnimationFrame(tick)}
 function onScroll(){targetP=progress();start()}
 resize();update(reduced?0:p,performance.now());renderer.render(scene,camera);
 addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',()=>{resize();targetP=progress();start()},{passive:true});
 if(!coarse&&!reduced){sticky.addEventListener('pointermove',e=>{const r=sticky.getBoundingClientRect();targetX=clamp((e.clientX-r.left)/r.width*2-1,-1,1);targetY=clamp((e.clientY-r.top)/r.height*2-1,-1,1);start()},{passive:true});sticky.addEventListener('pointerleave',()=>{targetX=0;targetY=0;start()},{passive:true});}
 const io=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting!==false;if(visible)start()},{rootMargin:'20% 0px'});io.observe(section);start();
}
init();
