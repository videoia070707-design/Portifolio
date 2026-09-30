/* MOVX v364/v375 — physical manipulation for the existing production CRT.
   Dragging the cabinet rotates the actual Three.js object with visible but bounded
   inertia. v375 deepens the orbit range and publishes a compact grab state for the
   scene/camera layer. The live screen and selector remain owned by v363. No extra
   model, renderer, WebGL context or requestAnimationFrame is created here. */
import * as THREE from './vendor/three.module.js';

const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse=matchMedia('(pointer: coarse)').matches;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const follow=(dt,speed)=>1-Math.exp(-Math.max(0,dt)*speed);

export function attachCRTObjectInteraction(instance){
  if(instance.objectInteraction||!instance.directManipulation||!instance.channels||instance.procedural||instance.previewProcedural)return instance.objectInteraction;
  const boot=document.querySelector('#boot');
  const wrap=boot?.querySelector('.crt-wrap');
  const screen=instance.channels.screen;
  const knob=instance.model.getObjectByName('tripo_part_8');
  if(!boot||!wrap||!screen?.isMesh||!knob)return null;

  const ray=new THREE.Raycaster();
  const pointer=new THREE.Vector2();
  const state={
    reduced,coarse,active:false,pointerId:null,moved:false,
    startX:0,startY:0,lastX:0,lastY:0,lastMoveTime:performance.now(),lastTime:performance.now(),
    startYaw:0,startPitch:0,yaw:0,pitch:0,velocityYaw:0,velocityPitch:0,
    bodyDrags:0,lastAction:'none',lastRelease:0,engaged:false,grabEnergy:0
  };

  let hint=wrap.querySelector('.crt-object-hint');
  if(!hint){
    hint=document.createElement('span');
    hint.className='crt-object-hint';
    hint.setAttribute('aria-hidden','true');
    hint.innerHTML='<i></i><span>ARRASTE PARA ORBITAR A TV</span>';
    wrap.appendChild(hint);
  }else{
    const label=hint.querySelector('span');if(label)label.textContent='ARRASTE PARA ORBITAR A TV';
  }

  const hitAt=event=>{
    const r=instance.canvas?.getBoundingClientRect();
    if(!r?.width||!r.height)return null;
    pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);
    ray.setFromCamera(pointer,instance.camera);
    return ray.intersectObject(instance.model,true)[0]?.object||null;
  };
  const isBody=obj=>!!obj&&obj!==screen&&obj!==knob;
  const setBodyHit=value=>{
    if(value)boot.dataset.crtObjectHit='body';
    else delete boot.dataset.crtObjectHit;
  };

  const hover=event=>{
    if(coarse||state.active||event.pointerType==='touch')return;
    setBodyHit(isBody(hitAt(event)));
  };
  const leave=()=>{if(!state.active)setBodyHit(false)};

  const begin=event=>{
    if(event.button!==undefined&&event.button!==0)return;
    if(coarse||event.pointerType==='touch')return;
    const hit=hitAt(event);
    if(!isBody(hit))return;
    state.active=true;state.pointerId=event.pointerId;state.moved=false;
    state.startX=state.lastX=event.clientX;state.startY=state.lastY=event.clientY;
    state.startYaw=state.yaw;state.startPitch=state.pitch;
    state.velocityYaw=0;state.velocityPitch=0;state.lastMoveTime=performance.now();
    state.grabEnergy=Math.max(state.grabEnergy,.25);
    boot.dataset.crtObjectGesture='orbit';boot.dataset.crtGrab='armed';setBodyHit(true);
    try{wrap.setPointerCapture(event.pointerId)}catch{}
    event.preventDefault();
  };

  const move=event=>{
    if(!state.active||event.pointerId!==state.pointerId)return;
    const dx=event.clientX-state.startX,dy=event.clientY-state.startY;
    if(Math.hypot(dx,dy)>4)state.moved=true;
    if(!state.moved)return;
    event.preventDefault();
    const now=performance.now(),dt=Math.max(8,now-state.lastMoveTime)/1000;
    const prevYaw=state.yaw,prevPitch=state.pitch;
    /* v375 increases the usable three-quarter range from ~19° to ~29° so the
       cabinet side/depth becomes unmistakable without allowing a full spin. */
    state.yaw=clamp(state.startYaw+dx*.00435,-.50,.50);
    state.pitch=clamp(state.startPitch+dy*.0030,-.20,.20);
    state.velocityYaw=clamp((state.yaw-prevYaw)/dt,-2.2,2.2);
    state.velocityPitch=clamp((state.pitch-prevPitch)/dt,-1.1,1.1);
    state.lastX=event.clientX;state.lastY=event.clientY;state.lastMoveTime=now;
    state.bodyDrags++;state.lastAction='object-orbit';state.engaged=true;
    state.grabEnergy=1;
    boot.dataset.crtGrab='dragging';
    wrap.classList.add('is-crt-object-engaged');
    if(instance.tactility?.state)instance.tactility.state.pulse=Math.max(instance.tactility.state.pulse,.38);
  };

  const end=event=>{
    if(!state.active||event.pointerId!==state.pointerId)return;
    if(reduced){state.velocityYaw=0;state.velocityPitch=0}
    state.active=false;state.pointerId=null;state.lastRelease=performance.now();
    boot.dataset.crtGrab=state.moved?'inertia':'idle';
    delete boot.dataset.crtObjectGesture;setBodyHit(false);
    try{wrap.releasePointerCapture(event.pointerId)}catch{}
  };

  wrap.addEventListener('pointermove',hover,{passive:true});
  wrap.addEventListener('pointerleave',leave,{passive:true});
  wrap.addEventListener('pointerdown',begin,{passive:false});
  wrap.addEventListener('pointermove',move,{passive:false});
  wrap.addEventListener('pointerup',end,{passive:true});
  wrap.addEventListener('pointercancel',end,{passive:true});

  function update(time){
    const dt=Math.min(Math.max((time-state.lastTime)/1000,0),.08);state.lastTime=time;
    if(!state.active){
      if(!reduced){
        state.yaw=clamp(state.yaw+state.velocityYaw*dt,-.50,.50);
        state.pitch=clamp(state.pitch+state.velocityPitch*dt,-.20,.20);
        const decay=Math.exp(-dt*6.2);state.velocityYaw*=decay;state.velocityPitch*=decay;
        if(time-state.lastRelease>1050&&Math.abs(state.velocityYaw)<.040&&Math.abs(state.velocityPitch)<.028){
          const settle=follow(dt,1.85);
          state.yaw+=(0-state.yaw)*settle;state.pitch+=(0-state.pitch)*settle;
        }
      }
      state.grabEnergy+=(0-state.grabEnergy)*follow(dt,reduced?20:3.8);
    }else{
      state.grabEnergy+=(1-state.grabEnergy)*follow(dt,16);
    }

    const base=instance.motionState;
    if(base&&instance.group){
      instance.group.rotation.x=(base.rx||0)+state.pitch;
      instance.group.rotation.y=(base.ry||0)+state.yaw;
      instance.group.rotation.z=(base.rz||0)-state.yaw*.045;
    }

    /* Publish pixel-ready values so the CSS feedback never depends on multiplying
       unitless custom properties at style-evaluation time. */
    boot.style.setProperty('--crt-grab-x',`${(state.yaw*22).toFixed(2)}px`);
    boot.style.setProperty('--crt-grab-y',`${(state.pitch*18).toFixed(2)}px`);
    boot.style.setProperty('--crt-grab-shadow-x',`${(-state.yaw*28).toFixed(2)}px`);
    boot.style.setProperty('--crt-grab-energy',state.grabEnergy.toFixed(4));

    if(state.engaged&&Math.abs(state.yaw)<.004&&Math.abs(state.pitch)<.004&&!state.active){
      wrap.classList.remove('is-crt-object-engaged');
      state.engaged=false;boot.dataset.crtGrab='idle';
    }else if(!state.active&&state.engaged){
      boot.dataset.crtGrab='inertia';
    }else if(!state.active&&!state.engaged){
      boot.dataset.crtGrab='idle';
    }
  }

  instance.objectInteraction={state,update};
  document.documentElement.dataset.crtObject='v364-ready';
  boot.dataset.crtObject='ready';boot.dataset.crtGrab='idle';
  return instance.objectInteraction;
}
