/* MOVX v366 / v386.13 — physical presence for the approved Scene-01 CRT.
   Pointer presence, press depth, camera parallax and light tracking all run inside
   the existing v358 render frame. v386.13 aligns this older physical-presence
   family with the full Scene-01 input field already used by v363/v364/v361.
   Three.js raycasting remains the hit authority: editorial DOM is never treated
   as the TV merely because the event is delivered by the larger scene surface.
   No extra model, canvas, scene, WebGL context, listener family or RAF. */
import * as THREE from './vendor/three.module.js';

const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse=matchMedia('(pointer: coarse)').matches;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const follow=(dt,speed)=>1-Math.exp(-Math.max(0,dt)*speed);

export function attachCRTPresence(instance){
  if(instance.presence||!instance.channelPhysics||!instance.objectInteraction||!instance.channels||instance.procedural||instance.previewProcedural)return instance.presence;
  const boot=document.querySelector('#boot');
  const wrap=boot?.querySelector('.crt-wrap');
  const surface=boot?.querySelector('.scene-inner')||boot?.querySelector('.boot-stage')||wrap;
  if(!boot||!wrap||!surface||!instance.canvas||!instance.model||!instance.camera||!instance.group)return null;

  const ray=new THREE.Raycaster();
  const pointer=new THREE.Vector2();
  const state={
    reduced,coarse,hover:false,pressed:false,pointerId:null,
    tx:0,ty:0,x:0,y:0,hoverMix:0,pressMix:0,
    enterAt:performance.now(),lastTime:performance.now(),frames:0,lastSurface:'none',
    inputSurface:'scene-inner'
  };

  const editorialTarget=event=>event.target instanceof Element&&!!event.target.closest('button,a,input,label,select,textarea');
  const hitAt=event=>{
    const r=instance.canvas.getBoundingClientRect();
    if(!r.width||!r.height)return null;
    pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);
    ray.setFromCamera(pointer,instance.camera);
    return ray.intersectObject(instance.model,true)[0]?.object||null;
  };
  const setTarget=event=>{
    const r=instance.canvas.getBoundingClientRect();
    if(!r.width||!r.height)return;
    state.tx=clamp(((event.clientX-r.left)/r.width-.5)*2,-1,1);
    state.ty=clamp(((event.clientY-r.top)/r.height-.5)*2,-1,1);
    boot.style.setProperty('--v366-px',state.tx.toFixed(4));
    boot.style.setProperty('--v366-py',state.ty.toFixed(4));
  };
  const updateHit=event=>{
    if(coarse||event.pointerType==='touch')return;
    setTarget(event);
    const hit=editorialTarget(event)?null:hitAt(event);
    state.hover=!!hit;state.lastSurface=hit?.name||'none';
    boot.dataset.crtPresence=state.hover?'hover':'idle';
  };
  const enter=event=>updateHit(event);
  const move=event=>updateHit(event);
  const leave=()=>{
    if(state.pressed)return;
    state.hover=false;state.tx=state.ty=0;state.lastSurface='none';
    boot.dataset.crtPresence='idle';
  };
  const down=event=>{
    if(coarse||event.pointerType==='touch'||event.button!==0||editorialTarget(event))return;
    const hit=hitAt(event);if(!hit)return;
    state.pressed=true;state.pointerId=event.pointerId;state.hover=true;
    boot.dataset.crtPresence='press';
  };
  const up=event=>{
    if(state.pointerId!==null&&event.pointerId!==state.pointerId)return;
    state.pressed=false;state.pointerId=null;
    boot.dataset.crtPresence=state.hover?'hover':'idle';
  };

  /* v386.13: same physical presence family, broader delivery surface. The raycast
     above still decides whether the pointer is actually over transformed CRT
     geometry, matching current drag/click/pickup behavior. */
  surface.addEventListener('pointerenter',enter,{passive:true});
  surface.addEventListener('pointermove',move,{passive:true});
  surface.addEventListener('pointerleave',leave,{passive:true});
  surface.addEventListener('pointerdown',down,{passive:true});
  surface.addEventListener('pointerup',up,{passive:true});
  surface.addEventListener('pointercancel',up,{passive:true});

  function update(time){
    const dt=Math.min(Math.max((time-state.lastTime)/1000,0),.08);state.lastTime=time;
    const manual=!!instance.objectInteraction?.state?.active||!!instance.directManipulation?.state?.active;
    const targetHover=!reduced&&!coarse&&state.hover&&!manual?1:0;
    const targetPress=!reduced&&!coarse&&state.pressed&&!manual?1:0;
    const k=follow(dt,targetHover?12:7.2);
    state.x+=(state.tx-state.x)*k;state.y+=(state.ty-state.y)*k;
    state.hoverMix+=(targetHover-state.hoverMix)*follow(dt,10.5);
    state.pressMix+=(targetPress-state.pressMix)*follow(dt,18);

    const intro=reduced?1:clamp((time-state.enterAt)/920,0,1);
    const introEase=1-Math.pow(1-intro,3);
    const introYaw=(1-introEase)*-.105;
    const introPitch=(1-introEase)*.035;
    const introDepth=(1-introEase)*-.055;

    const hover=state.hoverMix;
    const px=state.x,py=state.y;
    instance.group.rotation.y+=introYaw+px*.105*hover;
    instance.group.rotation.x+=introPitch-py*.060*hover;
    instance.group.rotation.z+=(-px*py*.012)*hover;
    instance.group.position.z+=introDepth+hover*.030+state.pressMix*.022;
    instance.group.position.x+=px*.014*hover;
    instance.group.position.y+=-py*.009*hover;

    if(!manual){
      instance.camera.position.x=px*.085*hover;
      instance.camera.position.y=.03-py*.050*hover;
    }else{
      instance.camera.position.x*=.8;
      instance.camera.position.y+=(0.03-instance.camera.position.y)*.2;
    }
    instance.camera.lookAt(0,0,0);

    if(instance.lights?.key){
      instance.lights.key.position.x=3.2-px*.95*hover;
      instance.lights.key.position.y=4.1-py*.40*hover;
      instance.lights.key.intensity+=hover*.18+state.pressMix*.08;
    }
    if(instance.lights?.fill){
      instance.lights.fill.position.x=-3+px*.85*hover;
      instance.lights.fill.intensity+=hover*.12;
    }
    if(instance.lights?.rim){
      instance.lights.rim.position.x=px*.55*hover;
      instance.lights.rim.intensity+=hover*.16;
    }
    const material=instance.channels?.screen?.material;
    if(Number.isFinite(material?.emissiveIntensity))material.emissiveIntensity+=hover*.035+state.pressMix*.025;

    boot.style.setProperty('--v366-presence',hover.toFixed(4));
    boot.style.setProperty('--v366-press',state.pressMix.toFixed(4));
    state.frames++;
  }

  instance.presence={state,update};
  document.documentElement.dataset.crtPresence='v366-ready';
  document.documentElement.dataset.crtPresenceSurface='v386.13-scene-field';
  boot.dataset.crtPresence='idle';
  return instance.presence;
}