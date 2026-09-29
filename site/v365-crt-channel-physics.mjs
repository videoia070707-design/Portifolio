/* MOVX v365 — channel-synchronised physical behaviour for the approved CRT.
   The four semantic channels now affect the television as an object, not only
   the pixels on its screen. This is additive to v364 cabinet orbit and shares
   the existing renderer/frame: no extra model, canvas, context or RAF. */

const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse=matchMedia('(pointer: coarse)').matches;
const follow=(dt,speed)=>1-Math.exp(-Math.max(0,dt)*speed);

const CHANNELS={
  direction:{
    yaw:-.032,pitch:.007,roll:-.003,depth:0,
    key:.02,fill:-.05,rim:.015,screenGlow:.018,speed:6.2,
    autoYaw:0,autoPitch:0,autoRoll:0,autoDepth:0,autoX:0,
    lightPulse:0,fillColor:0xff8a45,rimColor:0xd5ddf2
  },
  motion:{
    yaw:.041,pitch:-.009,roll:.011,depth:.014,
    key:.09,fill:.14,rim:.10,screenGlow:.040,speed:8.8,
    autoYaw:.008,autoPitch:.006,autoRoll:.011,autoDepth:.010,autoX:.004,
    lightPulse:.085,fillColor:0xff6a2c,rimColor:0xffc28f
  },
  ai:{
    yaw:-.021,pitch:.017,roll:-.007,depth:.022,
    key:.04,fill:.10,rim:.13,screenGlow:.052,speed:5.4,
    autoYaw:.014,autoPitch:.009,autoRoll:.007,autoDepth:.012,autoX:.009,
    lightPulse:.055,fillColor:0xff7440,rimColor:0xffd6b4
  },
  digital:{
    yaw:.014,pitch:.003,roll:-.002,depth:.005,
    key:.11,fill:.015,rim:.085,screenGlow:.024,speed:10.5,
    autoYaw:0,autoPitch:0,autoRoll:0,autoDepth:0,autoX:0,
    lightPulse:0,fillColor:0xff8a45,rimColor:0xc9d9ff
  }
};

export function attachCRTChannelPhysics(instance){
  if(instance.channelPhysics||!instance.channels||!instance.tactility||!instance.directManipulation||!instance.objectInteraction||instance.procedural||instance.previewProcedural)return instance.channelPhysics;
  const boot=document.querySelector('#boot');
  const screen=instance.channels.screen;
  const channelState=instance.channels.state;
  if(!boot||!screen?.material||!instance.group||!instance.lights)return null;

  const state={
    reduced,coarse,channel:'',lastTime:performance.now(),changedAt:performance.now(),
    yaw:0,pitch:0,roll:0,depth:0,x:0,
    updates:0,switches:0,autonomousEnergy:0,manualPriority:0,
    lightPulse:0,signature:'direction'
  };

  const setLightPalette=cfg=>{
    instance.lights.fill?.color?.setHex?.(cfg.fillColor);
    instance.lights.rim?.color?.setHex?.(cfg.rimColor);
  };

  function update(time){
    const dt=Math.min(Math.max((time-state.lastTime)/1000,0),.08);state.lastTime=time;
    const channel=CHANNELS[channelState.channel]?channelState.channel:'direction';
    const cfg=CHANNELS[channel];
    if(channel!==state.channel){
      state.channel=channel;state.signature=channel;state.changedAt=time;state.switches++;
      setLightPalette(cfg);
      boot.dataset.crtPhysicalChannel=channel;
    }

    const objectActive=!!instance.objectInteraction?.state?.active;
    const directActive=!!instance.directManipulation?.state?.active;
    const manualActive=objectActive||directActive;
    state.manualPriority=manualActive?1:0;

    /* Autonomous motion exists only in MOTION/AI, follows the programme phase,
       and fades while the user is manipulating the physical object. */
    const autonomy=reduced?0:(manualActive?.16:1)*(coarse?.52:1);
    const phase=Number(channelState.phase||0);
    let autoYaw=0,autoPitch=0,autoRoll=0,autoDepth=0,autoX=0,pulse=0;
    if(channel==='motion'){
      autoYaw=Math.sin(phase*1.18)*cfg.autoYaw*autonomy;
      autoPitch=Math.sin(phase*1.62+.5)*cfg.autoPitch*autonomy;
      autoRoll=Math.sin(phase*1.34-.7)*cfg.autoRoll*autonomy;
      autoDepth=(.5+.5*Math.sin(phase*1.55))*cfg.autoDepth*autonomy;
      autoX=Math.sin(phase*.92)*cfg.autoX*autonomy;
      pulse=(.5+.5*Math.sin(phase*1.55))*cfg.lightPulse*autonomy;
    }else if(channel==='ai'){
      autoYaw=Math.sin(phase*.63+.4)*cfg.autoYaw*autonomy;
      autoPitch=Math.cos(phase*.48-.2)*cfg.autoPitch*autonomy;
      autoRoll=Math.sin(phase*.39+.9)*cfg.autoRoll*autonomy;
      autoDepth=(.5+.5*Math.sin(phase*.56))*cfg.autoDepth*autonomy;
      autoX=Math.sin(phase*.44-.6)*cfg.autoX*autonomy;
      pulse=(.5+.5*Math.cos(phase*.52))*cfg.lightPulse*autonomy;
    }
    state.autonomousEnergy=Math.abs(autoYaw)+Math.abs(autoPitch)+Math.abs(autoRoll)+autoDepth+Math.abs(autoX);
    state.lightPulse=pulse;

    const k=reduced?1:follow(dt,cfg.speed);
    state.yaw+=(cfg.yaw-state.yaw)*k;
    state.pitch+=(cfg.pitch-state.pitch)*k;
    state.roll+=(cfg.roll-state.roll)*k;
    state.depth+=(cfg.depth-state.depth)*k;
    state.x+=(0-state.x)*k;

    /* v364 resets rotation from motionState + manual orbit before this runs, so
       these additions cannot accumulate and cannot steal control from the drag. */
    instance.group.rotation.x+=state.pitch+autoPitch;
    instance.group.rotation.y+=state.yaw+autoYaw;
    instance.group.rotation.z+=state.roll+autoRoll;
    instance.group.position.z+=state.depth+autoDepth;
    instance.group.position.x+=state.x+autoX;

    /* v358 writes the base light intensities every frame. v365 adds a bounded
       semantic response afterward, keeping one lighting rig and one scene. */
    if(instance.lights.key)instance.lights.key.intensity+=cfg.key+pulse*.55;
    if(instance.lights.fill)instance.lights.fill.intensity+=cfg.fill+pulse;
    if(instance.lights.rim)instance.lights.rim.intensity+=cfg.rim+pulse*.72;

    /* v362 owns tactile emissive feedback and refreshes its baseline every frame.
       Add only the channel-specific glow after tactility has updated. */
    const material=screen.material;
    if(Number.isFinite(material?.emissiveIntensity))material.emissiveIntensity+=cfg.screenGlow+pulse*.12;

    state.updates++;
    boot.dataset.crtPhysicalFrame=String(state.updates);
  }

  instance.channelPhysics={state,update,channels:CHANNELS};
  document.documentElement.dataset.crtChannelPhysics='v365-ready';
  boot.dataset.crtChannelPhysics='ready';
  return instance.channelPhysics;
}
