/* MOVX v364/v375/v376.1/v386.4 — physical manipulation for the existing production CRT.
   Dragging the cabinet rotates the actual Three.js object with visible but bounded
   inertia. v375 deepens the orbit range and couples it to camera/light; v376 turns
   the hard safety stop into an elastic physical boundary; v376.1 gives release at
   that boundary an immediate inward positional recoil before inertia continues.
   v386.4 preserves control ownership: if v363 already captured the real screen or
   selector on pointerdown, cabinet orbit cannot steal the same gesture. */
import * as THREE from './vendor/three.module.js';

const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse=matchMedia('(pointer: coarse)').matches;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const follow=(dt,speed)=>1-Math.exp(-Math.max(0,dt)*speed);
const YAW_LIMIT=.50,PITCH_LIMIT=.20;

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
    pointerVelocityYaw:0,pointerVelocityPitch:0,
    edgeCompressionYaw:0,edgeCompressionPitch:0,boundaryBounce:0,boundaryHits:0,
    atYawBoundary:false,atPitchBoundary:false,lastBoundarySnapYaw:0,lastBoundarySnapPitch:0,
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
  const updateBoundaryMarker=()=>{
    const y=state.edgeCompressionYaw>.015,p=state.edgeCompressionPitch>.015;
    if(y&&p)boot.dataset.crtBoundary='both';
    else if(y)boot.dataset.crtBoundary='yaw';
    else if(p)boot.dataset.crtBoundary='pitch';
    else if(state.boundaryBounce>.025)boot.dataset.crtBoundary='rebound';
    else delete boot.dataset.crtBoundary;
  };

  const hover=event=>{
    if(coarse||state.active||event.pointerType==='touch')return;
    setBodyHit(isBody(hitAt(event)));
  };
  const leave=()=>{if(!state.active)setBodyHit(false)};

  const begin=event=>{
    if(event.button!==undefined&&event.button!==0)return;
    if(coarse||event.pointerType==='touch')return;
    /* v363 owns the real screen + selector and is registered first. A successful
       direct-control capture must be exclusive, otherwise a nearby cabinet mesh
       can start a second gesture on the same pointerdown. */
    if(instance.directManipulation?.state?.active)return;
    const hit=hitAt(event);
    if(!isBody(hit))return;
    state.active=true;state.pointerId=event.pointerId;state.moved=false;
    state.startX=state.lastX=event.clientX;state.startY=state.lastY=event.clientY;
    state.startYaw=state.yaw;state.startPitch=state.pitch;
    state.velocityYaw=state.velocityPitch=0;
    state.pointerVelocityYaw=state.pointerVelocityPitch=0;
    state.edgeCompressionYaw=state.edgeCompressionPitch=0;
    state.atYawBoundary=state.atPitchBoundary=false;
    state.lastBoundarySnapYaw=state.lastBoundarySnapPitch=0;
    state.lastMoveTime=performance.now();
    state.grabEnergy=Math.max(state.grabEnergy,.25);
    boot.dataset.crtObjectGesture='orbit';boot.dataset.crtGrab='armed';setBodyHit(true);updateBoundaryMarker();
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
    const rawYaw=state.startYaw+dx*.00435,rawPitch=state.startPitch+dy*.0030;
    const stepX=event.clientX-state.lastX,stepY=event.clientY-state.lastY;

    const handYaw=clamp((stepX*.00435)/dt,-2.2,2.2);
    const handPitch=clamp((stepY*.0030)/dt,-1.1,1.1);
    state.pointerVelocityYaw+=(handYaw-state.pointerVelocityYaw)*.58;
    state.pointerVelocityPitch+=(handPitch-state.pointerVelocityPitch)*.58;
    state.velocityYaw=state.pointerVelocityYaw;
    state.velocityPitch=state.pointerVelocityPitch;
    state.yaw=clamp(rawYaw,-YAW_LIMIT,YAW_LIMIT);
    state.pitch=clamp(rawPitch,-PITCH_LIMIT,PITCH_LIMIT);

    state.edgeCompressionYaw=clamp((Math.abs(rawYaw)-YAW_LIMIT)/.095,0,1);
    state.edgeCompressionPitch=clamp((Math.abs(rawPitch)-PITCH_LIMIT)/.075,0,1);
    const yawEdge=state.edgeCompressionYaw>.015,pitchEdge=state.edgeCompressionPitch>.015;
    if((yawEdge&&!state.atYawBoundary)||(pitchEdge&&!state.atPitchBoundary)){
      state.boundaryHits++;
      if(instance.tactility?.state)instance.tactility.state.pulse=Math.max(instance.tactility.state.pulse,.66);
    }
    state.atYawBoundary=yawEdge;state.atPitchBoundary=pitchEdge;
    state.boundaryBounce=Math.max(state.boundaryBounce,state.edgeCompressionYaw*.55,state.edgeCompressionPitch*.45);

    state.lastX=event.clientX;state.lastY=event.clientY;state.lastMoveTime=now;
    state.bodyDrags++;state.lastAction='object-orbit';state.engaged=true;
    state.grabEnergy=1;
    boot.dataset.crtGrab='dragging';updateBoundaryMarker();
    wrap.classList.add('is-crt-object-engaged');
    if(instance.tactility?.state)instance.tactility.state.pulse=Math.max(instance.tactility.state.pulse,.38);
  };

  const end=event=>{
    if(!state.active||event.pointerId!==state.pointerId)return;
    state.lastBoundarySnapYaw=state.lastBoundarySnapPitch=0;
    if(reduced){
      state.velocityYaw=state.velocityPitch=0;
    }else{
      if(state.edgeCompressionYaw>.015&&Math.sign(state.velocityYaw)===Math.sign(state.yaw)){
        const compression=state.edgeCompressionYaw;
        const side=Math.sign(state.yaw)||1;
        const snap=.010+compression*.010;
        state.yaw=clamp(state.yaw-side*snap,-YAW_LIMIT,YAW_LIMIT);
        state.lastBoundarySnapYaw=snap;
        state.velocityYaw=-Math.max(Math.abs(state.velocityYaw)*(.27+compression*.13),.075);
        state.boundaryBounce=Math.max(state.boundaryBounce,Math.min(1,.32+compression*.38));
      }
      if(state.edgeCompressionPitch>.015&&Math.sign(state.velocityPitch)===Math.sign(state.pitch)){
        const compression=state.edgeCompressionPitch;
        const side=Math.sign(state.pitch)||1;
        const snap=.006+compression*.006;
        state.pitch=clamp(state.pitch-side*snap,-PITCH_LIMIT,PITCH_LIMIT);
        state.lastBoundarySnapPitch=snap;
        state.velocityPitch=-Math.sign(side)*Math.max(Math.abs(state.velocityPitch)*(.24+compression*.11),.045);
        state.boundaryBounce=Math.max(state.boundaryBounce,Math.min(1,.28+compression*.32));
      }
    }
    state.active=false;state.pointerId=null;state.lastRelease=performance.now();
    state.edgeCompressionYaw=state.edgeCompressionPitch=0;
    state.atYawBoundary=state.atPitchBoundary=false;
    boot.dataset.crtGrab=state.moved?'inertia':'idle';
    delete boot.dataset.crtObjectGesture;setBodyHit(false);updateBoundaryMarker();
    try{wrap.releasePointerCapture(event.pointerId)}catch{}
  };

  wrap.addEventListener('pointermove',hover,{passive:true});
  wrap.addEventListener('pointerleave',leave,{passive:true});
  wrap.addEventListener('pointerdown',begin,{passive:false});
  wrap.addEventListener('pointermove',move,{passive:false});
  wrap.addEventListener('pointerup',end,{passive:true});
  wrap.addEventListener('pointercancel',end,{passive:true});

  function integrateElastic(value,velocity,limit,restitution,dt){
    let next=value+velocity*dt;
    let nextVelocity=velocity;
    if(Math.abs(next)>limit){
      const side=Math.sign(next)||1;
      const over=Math.abs(next)-limit;
      next=side*(limit-Math.min(limit*.055,over*.34));
      if(Math.sign(nextVelocity)===side)nextVelocity=-nextVelocity*restitution;
      state.boundaryBounce=Math.max(state.boundaryBounce,Math.min(1,Math.abs(nextVelocity)*.62+.20));
    }
    return [next,nextVelocity];
  }

  function update(time){
    const dt=Math.min(Math.max((time-state.lastTime)/1000,0),.08);state.lastTime=time;
    if(!state.active){
      if(!reduced){
        [state.yaw,state.velocityYaw]=integrateElastic(state.yaw,state.velocityYaw,YAW_LIMIT,.34,dt);
        [state.pitch,state.velocityPitch]=integrateElastic(state.pitch,state.velocityPitch,PITCH_LIMIT,.30,dt);
        const decay=Math.exp(-dt*6.2);state.velocityYaw*=decay;state.velocityPitch*=decay;
        state.boundaryBounce*=Math.exp(-dt*8.6);
        if(time-state.lastRelease>1050&&Math.abs(state.velocityYaw)<.040&&Math.abs(state.velocityPitch)<.028){
          const settle=follow(dt,1.85);
          state.yaw+=(0-state.yaw)*settle;state.pitch+=(0-state.pitch)*settle;
        }
      }else{
        state.boundaryBounce=0;
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

    boot.style.setProperty('--crt-grab-x',`${(state.yaw*22).toFixed(2)}px`);
    boot.style.setProperty('--crt-grab-y',`${(state.pitch*18).toFixed(2)}px`);
    boot.style.setProperty('--crt-grab-shadow-x',`${(-state.yaw*28).toFixed(2)}px`);
    boot.style.setProperty('--crt-grab-energy',state.grabEnergy.toFixed(4));
    boot.style.setProperty('--crt-boundary-energy',Math.max(state.edgeCompressionYaw,state.edgeCompressionPitch,state.boundaryBounce).toFixed(4));
    updateBoundaryMarker();

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
  document.documentElement.dataset.crtOrbitPhysics='v376-elastic-boundary';
  document.documentElement.dataset.crtOrbitRecoil='v376.1-visible-snap';
  document.documentElement.dataset.crtControlOwnership='v386.4-direct-first';
  boot.dataset.crtObject='ready';boot.dataset.crtGrab='idle';
  return instance.objectInteraction;
}
