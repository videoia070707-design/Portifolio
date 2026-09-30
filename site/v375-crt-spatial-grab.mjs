/* MOVX v375 — spatial grab response for Scene 01.
   Direct cabinet drag already rotates the approved CRT (v364). This layer makes
   that manipulation affect the *viewer* too: camera and the existing key/fill/rim
   lights counter-shift while the cabinet is being dragged or coasting on inertia.
   That removes the turntable-viewer feel and makes the object read as part of one
   room. No new model, renderer, WebGL context, scene, RAF or input listener. */

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
    reduced,coarse,lastTime:performance.now(),mix:0,
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

    /* Counter-camera: as the cabinet rotates right, the viewer drifts slightly
       left and forward. This produces parallax between bezel, side wall, screen,
       typography and room lighting instead of merely spinning one mesh in place. */
    const targetCamX=-state.yaw*.24*state.mix;
    const targetCamY=state.pitch*.17*state.mix;
    const targetCamZ=-(Math.abs(state.yaw)*.105+Math.abs(state.pitch)*.055)*state.mix;
    const k=follow(dt,active?11:6.5);
    state.camX+=(targetCamX-state.camX)*k;
    state.camY+=(targetCamY-state.camY)*k;
    state.camZ+=(targetCamZ-state.camZ)*k;

    instance.camera.position.x+=state.camX;
    instance.camera.position.y+=state.camY;
    instance.camera.position.z+=state.camZ;

    /* The room reacts to the same physical action. The response is intentionally
       smaller than the camera shift so it reads as changing specular/reflection,
       not as a spotlight chasing the mouse. */
    const targetLightX=state.yaw*.72*state.mix;
    const targetLightY=-state.pitch*.46*state.mix;
    state.lightX+=(targetLightX-state.lightX)*k;
    state.lightY+=(targetLightY-state.lightY)*k;
    if(instance.lights?.key){instance.lights.key.position.x-=state.lightX;instance.lights.key.position.y+=state.lightY;instance.lights.key.intensity+=state.mix*.10;}
    if(instance.lights?.fill){instance.lights.fill.position.x+=state.lightX*.62;instance.lights.fill.position.y-=state.lightY*.28;instance.lights.fill.intensity+=state.mix*.045;}
    if(instance.lights?.rim){instance.lights.rim.position.x-=state.lightX*.38;instance.lights.rim.position.y+=Math.abs(state.lightY)*.35;instance.lights.rim.intensity+=state.mix*.075;}

    /* A tiny forward bias while held gives the physical grab a pressure/depth cue.
       It is added after v371 and therefore cannot accumulate across frames. */
    instance.group.position.z+=state.mix*(orbit.active?.012:.006);

    boot.style.setProperty('--v375-grab-mix',state.mix.toFixed(4));
    boot.style.setProperty('--v375-grab-cam-x',`${(state.camX*42).toFixed(2)}px`);
    boot.style.setProperty('--v375-grab-cam-y',`${(state.camY*38).toFixed(2)}px`);
    boot.dataset.v375Grab=orbit.active?'dragging':(state.mix>.04?'inertia':'idle');
    state.frames++;boot.dataset.v375Frame=String(state.frames);
  }

  instance.spatialGrab={state,update};
  root.dataset.crtSpatialGrab='v375-ready';
  root.dataset.crtSpatialGrabLoop='shared-v322-frame';
  boot.dataset.v375Grab='idle';
  return instance.spatialGrab;
}
