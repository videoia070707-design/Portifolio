/* MOVX v380.1 — physical channel retune for the approved Scene-01 CRT.
   A semantic channel change already swaps the live programme (v361) and changes
   the authored pose/light language (v365/v367). v380 turns that change into one
   short physical event: selector detent, cabinet recoil, optical focus impulse
   and light lift all settle from the same state inside the existing v322 frame.
   v380.1 advances that event from bounded frame delta rather than wall-clock age,
   so a slow GPU cannot skip the physical retune in one long frame.
   No model, renderer, context, scene, listener or requestAnimationFrame. */
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse=matchMedia('(pointer: coarse)').matches;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const follow=(dt,speed)=>1-Math.exp(-Math.max(0,dt)*speed);
const CHANNELS=['direction','motion','ai','digital'];
const DURATION=640;

export function attachCRTChannelRetune(instance){
  if(instance.channelRetune||!instance.channels||!instance.channelPhysics||!instance.sceneDirector||!instance.physicalPickup||!instance.group||!instance.camera||instance.procedural||instance.previewProcedural)return instance.channelRetune;
  const root=document.documentElement;
  const boot=document.querySelector('#boot');
  const knob=instance.model?.getObjectByName?.('tripo_part_8')||null;
  const screen=instance.channels.screen;
  if(!root||!boot)return null;

  const initial=CHANNELS.includes(instance.channels.state.channel)?instance.channels.state.channel:'direction';
  const initialIndex=Math.max(0,CHANNELS.indexOf(initial));
  const state={
    reduced,coarse,lastTime:performance.now(),channel:initial,index:initialIndex,
    changedAt:0,elapsedMs:0,switches:0,phase:'idle',direction:0,
    envelope:0,wave:0,depthKick:0,yawKick:0,rollKick:0,fovKick:0,lightLift:0,
    knobAngle:Number.isFinite(knob?.rotation?.z)?knob.rotation.z:initialIndex*.45,
    knobTarget:initialIndex*.45,manualPriority:0,frames:0
  };

  function update(time){
    const dt=Math.min(Math.max((time-state.lastTime)/1000,0),.08);state.lastTime=time;
    const channel=CHANNELS.includes(instance.channels.state.channel)?instance.channels.state.channel:'direction';
    const nextIndex=Math.max(0,CHANNELS.indexOf(channel));
    const objectActive=!!instance.objectInteraction?.state?.active;
    const directActive=!!instance.directManipulation?.state?.active;
    const pickupActive=!!instance.physicalPickup?.state?.active;
    const manualActive=objectActive||directActive||pickupActive;
    state.manualPriority=manualActive?1:0;

    if(channel!==state.channel){
      const previousIndex=state.index;
      state.channel=channel;state.index=nextIndex;state.knobTarget=nextIndex*.45;
      state.direction=Math.sign(nextIndex-previousIndex)||1;
      state.changedAt=time;state.elapsedMs=reduced?DURATION:16;
      state.switches++;state.phase=reduced?'settled':'tuning';
      boot.dataset.v380Retune=state.phase;
      boot.dataset.v380Channel=channel;
    }

    let envelope=0,wave=0;
    if(state.changedAt&&state.phase==='tuning'){
      /* Frame-stable time. dt is already clamped to 80 ms by the shared runtime,
         so a software renderer / dropped frame cannot jump directly past the
         whole 640 ms tactile event. The first authored frame starts at 16 ms so
         the switch always has a visible contact response. */
      state.elapsedMs=Math.min(DURATION,state.elapsedMs+dt*1000);
      const u=clamp(state.elapsedMs/DURATION,0,1);
      if(u<1){
        envelope=Math.sin(Math.PI*u)*Math.pow(1-u,.34);
        wave=Math.sin(Math.PI*2.25*u)*Math.exp(-3.25*u);
      }else{
        state.phase='settled';boot.dataset.v380Retune='settled';
      }
    }

    /* Manual cabinet/screen interaction stays authoritative. A channel can still
       change while the user holds the object, but v380 never adds camera/object
       motion on top of that gesture. Coarse pointers receive a quieter impulse. */
    const authority=manualActive?0:1;
    const device=coarse ? .52 : 1;
    state.envelope=envelope*authority*device;
    state.wave=wave*authority*device;
    state.depthKick=state.envelope*.018;
    state.yawKick=state.wave*.0085*state.direction;
    state.rollKick=state.wave*.0032*state.direction;
    state.fovKick=-state.envelope*.32;
    state.lightLift=state.envelope*.095;

    state.knobTarget=nextIndex*.45;
    if(reduced)state.knobAngle=state.knobTarget;
    else state.knobAngle+=(state.knobTarget-state.knobAngle)*follow(dt,15.5);
    if(knob&&!manualActive){
      const detent=reduced?0:state.wave*.018*state.direction;
      knob.rotation.z=state.knobAngle+detent;
    }

    /* v380 runs after the validated director/pickup stack. These are bounded
       additive offsets over the rebuilt per-frame pose, so nothing accumulates. */
    instance.group.position.z+=state.depthKick;
    instance.group.rotation.y+=state.yawKick;
    instance.group.rotation.z+=state.rollKick;

    if(!manualActive&&Number.isFinite(instance.camera.fov)){
      instance.camera.fov=clamp(instance.camera.fov+state.fovKick,24,34);
      instance.camera.updateProjectionMatrix();
    }

    if(instance.lights?.key)instance.lights.key.intensity+=state.lightLift*.72;
    if(instance.lights?.fill)instance.lights.fill.intensity+=state.lightLift;
    if(instance.lights?.rim)instance.lights.rim.intensity+=state.lightLift*.64;
    if(Number.isFinite(screen?.material?.emissiveIntensity))screen.material.emissiveIntensity+=state.envelope*.045;

    boot.style.setProperty('--v380-retune',state.envelope.toFixed(4));
    boot.style.setProperty('--v380-retune-wave',state.wave.toFixed(4));
    boot.style.setProperty('--v380-retune-direction',String(state.direction));
    state.frames++;boot.dataset.v380Frame=String(state.frames);
  }

  instance.channelRetune={state,update,duration:DURATION,channels:CHANNELS};
  root.dataset.crtChannelRetune='v380-ready';
  root.dataset.crtChannelRetuneLoop='shared-v322-frame';
  boot.dataset.v380Retune='idle';
  boot.dataset.v380Channel=initial;
  return instance.channelRetune;
}
