/* MOVX v351 — scaled-center correction for the real Scene-01 CRT.
   v350 correctly isolated the approved Tripo TV but inherited a normalization
   bug: the root translation was computed before scale, so the scaled geometry
   drifted right/down. This module recenters the already-scaled GLB in world
   space without touching later storyboard slots. */
import * as THREE from './vendor/three.module.js';

const root=document.documentElement;
const SLOT='boot-tv';
let completed=false;
let attempts=0;
const MAX_ATTEMPTS=240;

function vec(v){return {x:+v.x.toFixed(6),y:+v.y.toFixed(6),z:+v.z.toFixed(6)}}

function recenter(){
  if(completed)return true;
  attempts++;
  const instance=window.MOVX3D?.runtime?.instances?.[SLOT];
  if(!instance?.loaded||!instance?.model||!instance?.group){
    if(attempts>=MAX_ATTEMPTS)root.dataset.crtRecenter='timeout';
    return false;
  }
  if(instance.procedural){
    root.dataset.crtRecenter='not-required';
    completed=true;
    return true;
  }

  // Freeze choreography while measuring. The current v350 group has no scale;
  // resetting its tiny pointer/scroll rotation makes the bbox correction exact.
  const rotation=instance.group.rotation.clone();
  instance.group.rotation.set(0,0,0);
  instance.group.updateMatrixWorld(true);
  instance.model.updateMatrixWorld(true);

  const beforeBox=new THREE.Box3().setFromObject(instance.model);
  if(beforeBox.isEmpty()){
    instance.group.rotation.copy(rotation);
    root.dataset.crtRecenter='error';
    return false;
  }
  const before=beforeBox.getCenter(new THREE.Vector3());

  // Critical correction: subtract the center AFTER the model's normalization
  // scale has already been applied. This removes the residual center*(scale-1)
  // offset that caused the real TV to be clipped by the right side of its canvas.
  instance.model.position.sub(before);
  instance.model.updateMatrixWorld(true);

  const afterBox=new THREE.Box3().setFromObject(instance.model);
  const after=afterBox.getCenter(new THREE.Vector3());
  const size=afterBox.getSize(new THREE.Vector3());

  instance.group.rotation.copy(rotation);
  instance.group.updateMatrixWorld(true);
  instance.stats=instance.stats||{};
  instance.stats.recenter={
    revision:'v351-scaled-center',
    before:vec(before),
    after:vec(after),
    size:vec(size),
    attempts,
  };
  instance.stats.fit='full-product-centered';
  root.dataset.crtRecenter='ready';
  root.dataset.crtFit='v351-scaled-center';
  completed=true;
  return true;
}

const slot=document.querySelector('[data-model-slot="boot-tv"]');
const observer=slot?new MutationObserver(()=>{if(slot.dataset.glbState==='ready'&&recenter())observer.disconnect()}):null;
observer?.observe(slot,{attributes:true,attributeFilter:['data-glb-state']});

function tick(){
  if(recenter())return;
  if(attempts<MAX_ATTEMPTS)requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
