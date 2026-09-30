/* MOVX v378 — physical pickup for the approved Scene-01 CRT.
   The existing body raycast (v364) already knows when the visitor is over/holding
   the real cabinet. v378 consumes that state inside the shared v322 frame so the
   television can lift under hover, follow a held hand by a bounded amount and
   settle back after release. No model, renderer, context, scene, listener or RAF. */
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse=matchMedia('(pointer: coarse)').matches;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const follow=(dt,speed)=>1-Math.exp(-Math.max(0,dt)*speed);

export function attachCRTPhysicalPickup(instance){
  if(instance.physicalPickup||!instance.objectInteraction||!instance.spatialGrab||!instance.group||instance.procedural||instance.previewProcedural)return instance.physicalPickup;
  const root=document.documentElement;
  const boot=document.querySelector('#boot');
  const wrap=boot?.querySelector('.crt-wrap');
  const hint=wrap?.querySelector('.crt-object-hint span');
  if(!root||!boot||!wrap)return null;

  const state={
    reduced,coarse,lastTime:performance.now(),hover:0,hold:0,
    handX:0,handY:0,lift:0,depth:0,pressure:0,
    active:false,phase:'idle',frames:0
  };

  function update(time){
    const dt=Math.min(Math.max((time-state.lastTime)/1000,0),.08);state.lastTime=time;
    const orbit=instance.objectInteraction.state;
    const bodyHit=boot.dataset.crtObjectHit==='body';
    const active=!coarse&&!!orbit.active;
    state.active=active;

    const targetHover=!coarse&&!reduced&&!active&&bodyHit?1:0;
    const targetHold=active?(reduced?.18:1):0;
    state.hover+=(targetHover-state.hover)*follow(dt,targetHover?12:8);
    state.hold+=(targetHold-state.hold)*(reduced?1:follow(dt,active?18:7.5));

    /* Translation is intentionally much smaller than the orbit. It is enough for
       the cabinet to follow the hand spatially, while the v364 yaw/pitch remains
       the primary manipulation and the object stays safely inside its hero frame. */
    const dx=active?clamp((Number(orbit.lastX||0)-Number(orbit.startX||0))/220,-1,1):0;
    const dy=active?clamp((Number(orbit.lastY||0)-Number(orbit.startY||0))/170,-1,1):0;
    const targetHandX=dx*.026*state.hold;
    const targetHandY=-dy*.016*state.hold;
    const targetLift=state.hover*.006+state.hold*.014;
    const targetDepth=state.hover*.008+state.hold*.018;
    const targetPressure=active?clamp(.55+Math.abs(dx)*.24+Math.abs(dy)*.16,0,1):state.hover*.18;
    const k=reduced?1:follow(dt,active?17:8.2);
    state.handX+=(targetHandX-state.handX)*k;
    state.handY+=(targetHandY-state.handY)*k;
    state.lift+=(targetLift-state.lift)*k;
    state.depth+=(targetDepth-state.depth)*k;
    state.pressure+=(targetPressure-state.pressure)*follow(dt,active?16:7);

    /* v378 runs after v375. The upstream frame has already reconstructed the real
       CRT pose, so these additions are bounded each frame and cannot accumulate. */
    instance.group.position.x+=state.handX;
    instance.group.position.y+=state.handY+state.lift*.34;
    instance.group.position.z+=state.depth;

    /* The same pickup state slightly tightens the existing room light. No new
       spotlight is created: this is simply contact feedback from the authored rig. */
    if(instance.lights?.key)instance.lights.key.intensity+=state.hover*.025+state.hold*.055;
    if(instance.lights?.fill)instance.lights.fill.intensity+=state.hold*.018;
    if(instance.lights?.rim)instance.lights.rim.intensity+=state.hover*.018+state.hold*.035;

    const phase=active&&state.hold>.48?'held':(!active&&state.hold>.035?'releasing':(state.hover>.24?'hover':'idle'));
    if(phase!==state.phase){state.phase=phase;boot.dataset.v378Pickup=phase;}

    if(hint){
      if(phase==='hover'&&hint.textContent!=='SEGURE E ARRASTE A TV')hint.textContent='SEGURE E ARRASTE A TV';
      else if(phase==='idle'&&hint.textContent!=='ARRASTE PARA ORBITAR A TV')hint.textContent='ARRASTE PARA ORBITAR A TV';
    }

    boot.style.setProperty('--v378-hover',state.hover.toFixed(4));
    boot.style.setProperty('--v378-hold',state.hold.toFixed(4));
    boot.style.setProperty('--v378-hand-x',`${(state.handX*520).toFixed(2)}px`);
    boot.style.setProperty('--v378-hand-y',`${(state.handY*520).toFixed(2)}px`);
    boot.style.setProperty('--v378-pressure',state.pressure.toFixed(4));
    state.frames++;boot.dataset.v378Frame=String(state.frames);
  }

  instance.physicalPickup={state,update};
  root.dataset.crtPhysicalPickup='v378-ready';
  root.dataset.crtPhysicalPickupLoop='shared-v322-frame';
  boot.dataset.v378Pickup='idle';
  return instance.physicalPickup;
}
