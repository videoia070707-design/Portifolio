/* MOVX v364/v375/v376 — physical manipulation for the existing production CRT.
   Dragging the cabinet rotates the actual Three.js object with visible but bounded
   inertia. v375 deepens the orbit range and couples it to camera/light; v376 turns
   the hard safety stop into an elastic physical boundary so momentum survives a
   release at maximum orbit. The live screen/selector remain owned by v363. No
   extra model, renderer, WebGL context or requestAnimationFrame is created here. */
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
    atYawBoundary:false,atPitchBoundary:false,
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
    const hit=hitAt(event);
    if(!isBody(hit))return;
    state.active=true;state.pointerId=event.pointerId;state.moved=false;
    state.startX=state.lastX=event.clientX;state.startY=state.lastY=event.clientY;
    state.startYaw=state.yaw;state.startPitch=state.pitch;
    state.velocityYaw=state.velocityPitch=0;
    state.pointerVelocityYaw=state.pointerVelocityPitch=0;
    state.edgeCompressionYaw=state.edgeCompressionPitch=0;
    state.atYawBoundary=state.atPitchBoundary=false;
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

    /* v376 measures the user's hand velocity from pointer travel rather than from
       the already-clamped angle. At the old hard stop, continued pointer motion
       made (clampedYaw-prevYaw) equal zero and silently killed release inertia. */
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
    if(reduced){
      state.velocityYaw=state.velocityPitch=0;
    }else{
      /* If the hand releases while still pushing into a safety stop, convert a
         portion of that outward momentum into a short inward recoil. The cabinet
         remains strictly bounded but feels like it has mass instead of hitting a
         mathematical clamp and dying. */
      if(state.edgeCompressionYaw>.015&&Math.sign(state.velocityYaw)===Math.sign(state.yaw)){
        state.velocityYaw=-state.velocityYaw*(.24+state.edgeCompressionYaw*.12);
        state.boundaryBounce=Math.max(state.boundaryBounce,Math.min(1,Math.abs(state.velocityYaw)*.55));
      }
      if(state.edgeCompressionPitch>.015&&Math.sign(state.velocityPitch)===Math.sign(state.pitch)){
        state.velocityPitch=-state.velocityPitch*(.22+state.edgeCompressionPitch*.10);
        state.boundaryBounce=Math.max(state.boundaryBounce,Math.min(1,Math.abs(state.velocityPitch)*.65));
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

  function integrateElastic(value,velocity,limit,restitution){
    let next=value+velocity*state._frameDt;
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
    const dt=Math.min(Math.max((time-state.lastTime)/1000,0),.08);state.lastTime=time;state._frameDt=dt;
    if(!state.active){
      if(!reduced){
        [state.yaw,state.velocityYaw]=integrateElastic(state.yaw,state.velocityYaw,YAW_LIMIT,.34);
        [state.pitch,state.velocityPitch]=integrateElastic(state.pitch,state.velocityPitch,PITCH_LIMIT,.30);
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

    /* Publish pixel-ready values so CSS feedback never depends on multiplying
       unitless custom properties at style-evaluation time. */
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
  boot.dataset.crtObject='ready';boot.dataset.crtGrab='idle';
  return instance.objectInteraction;
}
