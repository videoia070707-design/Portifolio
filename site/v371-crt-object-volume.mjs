/* MOVX v371 — make the approved CRT read as a real volume before the user drags it.
   v364 already owns direct cabinet orbit, v365 channel physics, v368 scene-wide
   pointer presence and v367 camera composition. This layer only adds the final,
   bounded presentation pose to the *actual Three.js group* inside the existing
   v322 frame. No model, renderer, context, scene, listener or RAF is added. */

const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse=matchMedia('(pointer: coarse)').matches;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const follow=(dt,speed)=>1-Math.exp(-Math.max(0,dt)*speed);

/* Each channel gets a readable three-quarter presentation angle. These values are
   deliberately larger than the v365 micro-physics, but still small enough to keep
   the complete cabinet safely framed. Scene pointer motion then moves around that
   rest pose instead of starting from a dead-flat product shot. */
const POSES={
  direction:{yaw:-.038,pitch:.006,roll:-.002,depth:.008,x:-.004,pointerYaw:.048,pointerPitch:.020,idle:.0042,phase:.2},
  motion:{yaw:.030,pitch:-.006,roll:.005,depth:.014,x:.005,pointerYaw:.055,pointerPitch:.022,idle:.0065,phase:1.1},
  ai:{yaw:-.026,pitch:.010,roll:-.004,depth:.018,x:-.003,pointerYaw:.052,pointerPitch:.024,idle:.0052,phase:2.0},
  digital:{yaw:.020,pitch:.003,roll:-.002,depth:.009,x:.003,pointerYaw:.045,pointerPitch:.018,idle:.0032,phase:2.8},
};

export function attachCRTObjectVolume(instance){
  if(instance.objectVolume||!instance.sceneDirector||!instance.scenePresence||!instance.objectInteraction||!instance.directManipulation||!instance.channels||instance.procedural||instance.previewProcedural)return instance.objectVolume;
  const root=document.documentElement;
  const boot=document.querySelector('#boot');
  if(!root||!boot||!instance.group)return null;

  const state={
    reduced,coarse,lastTime:performance.now(),channel:'direction',
    yaw:0,pitch:0,roll:0,depth:0,x:0,
    restYaw:0,pointerYaw:0,pointerPitch:0,idleYaw:0,manualPriority:0,
    frames:0
  };

  function update(time){
    const dt=Math.min(Math.max((time-state.lastTime)/1000,0),.08);state.lastTime=time;
    const channel=POSES[instance.channels?.state?.channel]?instance.channels.state.channel:'direction';
    const cfg=POSES[channel];
    state.channel=channel;

    const scene=instance.scenePresence.state;
    const physical=instance.presence?.state;
    const manual=!!instance.objectInteraction.state.active||!!instance.directManipulation.state.active;
    state.manualPriority=manual?1:0;

    /* Coarse/reduced paths keep a static three-quarter pose so the television still
       reads as volumetric in a screenshot, but they do not run continuous pointer
       or idle motion. Manual manipulation fades this layer almost completely so
       the user's drag remains the dominant physical action. */
    const presentationGain=manual?.10:(coarse?.72:1);
    const pointerGain=(!reduced&&!coarse&&!manual)?Number(scene.mix||0):0;
    const hoverBoost=1+Math.min(.24,Number(physical?.hoverMix||0)*.24);
    const pointerYaw=Number(scene.x||0)*cfg.pointerYaw*pointerGain*hoverBoost;
    const pointerPitch=-Number(scene.y||0)*cfg.pointerPitch*pointerGain*hoverBoost;
    const velocityRoll=clamp(Number(scene.vx||0)*.0014,-.006,.006)*pointerGain;
    const idleGain=(!reduced&&!coarse&&!manual)?(1-pointerGain*.72):0;
    const idleYaw=Math.sin(time*.00052+cfg.phase)*cfg.idle*idleGain;
    const idlePitch=Math.cos(time*.00043+cfg.phase*.7)*cfg.idle*.42*idleGain;
    const idleDepth=(.5+.5*Math.sin(time*.00038+cfg.phase))*cfg.idle*.55*idleGain;

    const targetYaw=cfg.yaw*presentationGain+pointerYaw+idleYaw;
    const targetPitch=cfg.pitch*presentationGain+pointerPitch+idlePitch;
    const targetRoll=cfg.roll*presentationGain+velocityRoll;
    const targetDepth=cfg.depth*presentationGain+idleDepth;
    const targetX=cfg.x*presentationGain-Number(scene.x||0)*.004*pointerGain;
    const k=reduced?1:follow(dt,manual?18:channel==='motion'?8.8:6.4);

    state.yaw+=(targetYaw-state.yaw)*k;
    state.pitch+=(targetPitch-state.pitch)*k;
    state.roll+=(targetRoll-state.roll)*k;
    state.depth+=(targetDepth-state.depth)*k;
    state.x+=(targetX-state.x)*k;
    state.restYaw=cfg.yaw*presentationGain;
    state.pointerYaw=pointerYaw;
    state.pointerPitch=pointerPitch;
    state.idleYaw=idleYaw;

    /* All earlier CRT layers are resolved before v371. v364 refreshes the object
       pose every frame, so these additions are bounded and cannot accumulate. */
    instance.group.rotation.y+=state.yaw;
    instance.group.rotation.x+=state.pitch;
    instance.group.rotation.z+=state.roll;
    instance.group.position.z+=state.depth;
    instance.group.position.x+=state.x;

    boot.style.setProperty('--v371-yaw',state.yaw.toFixed(5));
    boot.style.setProperty('--v371-depth',state.depth.toFixed(5));
    boot.style.setProperty('--v371-pointer-yaw',state.pointerYaw.toFixed(5));
    boot.dataset.v371Channel=channel;
    boot.dataset.v371Manual=manual?'true':'false';
    state.frames++;
    boot.dataset.v371Frame=String(state.frames);
  }

  instance.objectVolume={state,update,poses:POSES};
  root.dataset.crtObjectVolume='v371-ready';
  root.dataset.crtObjectVolumeLoop='shared-v322-frame';
  boot.dataset.v371Channel=state.channel;
  boot.dataset.v371Manual='false';
  return instance.objectVolume;
}
