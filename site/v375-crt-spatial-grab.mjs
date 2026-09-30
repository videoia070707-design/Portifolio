/* MOVX v375/v377 — spatial grab + physical focus pull for Scene 01.
   Direct cabinet drag already rotates the approved CRT (v364/v376). This layer
   makes that manipulation affect the *viewer* and the authored room: camera,
   existing key/fill/rim lights and the real CRT depth respond as one action.
   v377 strengthens the held-state pressure so grabbing feels like picking up an
   object inside the scene rather than rotating a turntable viewer. No new model,
   renderer, WebGL context, scene, RAF or input listener. */

const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse=matchMedia('(pointer: coarse)').matches;
const follow=(dt,speed)=>1-Math.exp(-Math.max(0,dt)*speed);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

export function attachCRTSpatialGrab(instance){
  if(instance.spatialGrab||!instance.objectInteraction||!instance.sceneDirector||!instance.objectVolume||instance.procedural||instance.previewProcedural)return instance.spatialGrab;
  const root=document.documentElement;
  const boot=document.querySelector('#boot');
  if(!root||!boot||!instance.camera||!instance.group)return null;

  const state={
    reduced,coarse,lastTime:performance.now(),mix:0,focus:0,pressure:0,
    camX:0,camY:0,camZ:0,lightX:0,lightY:0,
    yaw:0,pitch:0,active:false,frames:0
  };

  function update(time){
    const dt=Math.min(Math.max((time-state.lastTime)/1000,0),.08);state.lastTime=time;
    const orbit=instance.objectInteraction.state;
    const moving=Math.abs(orbit.yaw)>.006||Math.abs(orbit.pitch)>.005||Math.abs(orbit.velocityYaw)>.025||Math.abs(orbit.velocityPitch)>.018;
    const active=!coarse&&(orbit.active||(orbit.engaged&&moving));
    state.active=active;

    const targetMix=active?(reduced?(orbit.active?.22:0):1):0;
    state.mix+=(targetMix-state.mix)*follow(dt,active?13:5.2);
    state.yaw+=(Number(orbit.yaw||0)-state.yaw)*follow(dt,14);
    state.pitch+=(Number(orbit.pitch||0)-state.pitch)*follow(dt,14);

    /* v377 focus pull: the held object becomes the scene's optical priority. The
       value is intentionally distinct from generic inertia mix: full pressure is
       only reached while the hand is actually down, then it releases more slowly
       so the editorial room follows the cabinet instead of snapping back. */
    const targetFocus=coarse?0:(orbit.active?(reduced?.18:1):(active?(reduced?0:.38):0));
    state.focus+=(targetFocus-state.focus)*follow(dt,orbit.active?15:6.8);
    const velocityEnergy=clamp(Math.abs(Number(orbit.pointerVelocityYaw||orbit.velocityYaw||0))*.34+Math.abs(Number(orbit.pointerVelocityPitch||orbit.velocityPitch||0))*.28,0,1);
    const targetPressure=orbit.active?clamp(.58+velocityEnergy*.42,0,1):(active?velocityEnergy*.34:0);
    state.pressure+=(targetPressure-state.pressure)*follow(dt,orbit.active?16:7.2);

    /* Counter-camera: as the cabinet rotates right, the viewer drifts slightly
       left and forward. v377 adds a held-state dolly so the action reads as a real
       pick-up/focus pull without changing cameras or creating another scene. */
    const targetCamX=-state.yaw*.24*state.mix;
    const targetCamY=state.pitch*.17*state.mix;
    const targetCamZ=-(Math.abs(state.yaw)*.105+Math.abs(state.pitch)*.055)*state.mix;
    const k=follow(dt,active?11:6.5);
    state.camX+=(targetCamX-state.camX)*k;
    state.camY+=(targetCamY-state.camY)*k;
    state.camZ+=(targetCamZ-state.camZ)*k;

    instance.camera.position.x+=state.camX;
    instance.camera.position.y+=state.camY;
    instance.camera.position.z+=state.camZ-state.focus*.018;

    /* The same action re-aims the room lighting. Focus/pressure changes intensity,
       while yaw/pitch still alter source position. This is a shared-state response,
       not a new spotlight following the mouse. */
    const targetLightX=state.yaw*.72*state.mix;
    const targetLightY=-state.pitch*.46*state.mix;
    state.lightX+=(targetLightX-state.lightX)*k;
    state.lightY+=(targetLightY-state.lightY)*k;
    if(instance.lights?.key){
      instance.lights.key.position.x-=state.lightX;instance.lights.key.position.y+=state.lightY;
      instance.lights.key.intensity+=state.mix*.10+state.focus*.12+state.pressure*.04;
    }
    if(instance.lights?.fill){
      instance.lights.fill.position.x+=state.lightX*.62;instance.lights.fill.position.y-=state.lightY*.28;
      instance.lights.fill.intensity+=state.mix*.045+state.focus*.035;
    }
    if(instance.lights?.rim){
      instance.lights.rim.position.x-=state.lightX*.38;instance.lights.rim.position.y+=Math.abs(state.lightY)*.35;
      instance.lights.rim.intensity+=state.mix*.075+state.focus*.085+state.pressure*.025;
    }

    /* Real-object lift. It is resolved after v371 and therefore remains bounded
       each frame. The held CRT advances toward the viewer and rises by a few
       millimetres in scene space; inertia keeps only a smaller residual depth. */
    const heldLift=state.focus*(orbit.active?.030:.014);
    instance.group.position.z+=state.mix*(orbit.active?.012:.006)+heldLift;
    instance.group.position.y+=state.focus*(orbit.active?.006:.002);

    /* Publish resolved values rather than fragile unitless CSS arithmetic. The DOM
       can now recede with exactly the same physical state that drives Three.js. */
    boot.style.setProperty('--v375-grab-mix',state.mix.toFixed(4));
    boot.style.setProperty('--v375-grab-cam-x',`${(state.camX*42).toFixed(2)}px`);
    boot.style.setProperty('--v375-grab-cam-y',`${(state.camY*38).toFixed(2)}px`);
    boot.style.setProperty('--v377-focus',state.focus.toFixed(4));
    boot.style.setProperty('--v377-pressure',state.pressure.toFixed(4));
    boot.style.setProperty('--v377-copy-shift',`${(state.focus*14).toFixed(2)}px`);
    boot.style.setProperty('--v377-copy-scale',(1-state.focus*.009).toFixed(4));
    boot.style.setProperty('--v377-copy-opacity',(1-state.focus*.14).toFixed(4));
    boot.style.setProperty('--v377-shadow-y',`${(30-state.focus*7).toFixed(2)}px`);
    boot.dataset.v375Grab=orbit.active?'dragging':(state.mix>.04?'inertia':'idle');
    boot.dataset.v377Focus=state.focus>.55?'held':(state.focus>.04?'releasing':'idle');
    state.frames++;boot.dataset.v375Frame=String(state.frames);boot.dataset.v377Frame=String(state.frames);
  }

  instance.spatialGrab={state,update};
  root.dataset.crtSpatialGrab='v375-ready';
  root.dataset.crtFocusPull='v377-ready';
  root.dataset.crtSpatialGrabLoop='shared-v322-frame';
  boot.dataset.v375Grab='idle';boot.dataset.v377Focus='idle';
  return instance.spatialGrab;
}
