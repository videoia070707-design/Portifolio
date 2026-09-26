/* MOVX v324 framing + v331 smooth scroll choreography for the six real Tripo GLBs.
   v336 adds a narrow-mobile fit only for the physical MOVX logo. The approved
   DOM/layout and desktop framing stay untouched; this layer only calibrates model/camera motion. */
const root=document.documentElement;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse=matchMedia('(pointer:coarse)').matches;
const narrowMobile=matchMedia('(max-width:720px)').matches;
const motionScale=reduced?0:(coarse?.62:1);
const FRAMING_REVISION='v336-mobile-logo-fit';
const CHOREOGRAPHY_REVISION='v331-smooth-handoffs';
root.classList.add('v324');
root.dataset.modelFraming='v324-model-framing';
root.dataset.modelFramingRevision=FRAMING_REVISION;
root.dataset.modelChoreography=CHOREOGRAPHY_REVISION;

const TUNING={
  'hero-movx-logo':{scale:1.12,cameraZ:3.0,fov:31,modelY:-0.01,modelYaw:0.0,exposure:1.12},
  'x-portal':{scale:1.08,cameraZ:3.55,fov:40,modelY:-0.025,modelYaw:0.0,exposure:1.08},
  'creative-machine':{scale:1.30,cameraZ:3.12,fov:33,modelY:-0.025,modelYaw:-0.035,exposure:1.12},
  'play-camera':{scale:.86,cameraZ:3.38,fov:31,modelY:-0.04,modelYaw:-0.13,exposure:1.08},
  'play-cube':{scale:.82,cameraZ:3.42,fov:31,modelY:-0.03,modelYaw:-0.12,exposure:1.1},
  'spatial-studio':{scale:1.34,cameraZ:2.85,fov:40,modelY:-0.06,modelYaw:.045,exposure:1.02}
};

/* The logo GLB is very wide (roughly 3.9:1). On <=720px canvases the desktop
   camera clips M/X even when the DOM slot itself is fully in-bounds. This override
   is intentionally isolated to the logo and preserves a safe horizontal edge reserve
   at 390px through the v331 yaw choreography; desktop keeps the approved framing. */
const MOBILE_TUNING={
  'hero-movx-logo':{scale:.88,cameraZ:3.60,fov:33,modelY:-0.01,modelYaw:0.0,exposure:1.12}
};
const tuningFor=name=>(narrowMobile&&MOBILE_TUNING[name])?MOBILE_TUNING[name]:TUNING[name];

const CHOREOGRAPHY={
  'hero-movx-logo':{kind:'identity-reveal',yaw:[-.10,.10],pitchMid:.025,yMid:.035,cameraZ:[.12,-.06],damping:7.8},
  'x-portal':{kind:'portal-dolly',yaw:[-.035,.035],z:[-.10,.12],cameraZ:[.42,-.22],damping:6.4},
  'creative-machine':{kind:'hardware-reveal',yaw:[-.14,.12],x:[-.035,.035],cameraZ:[.16,-.10],damping:7.1},
  'play-camera':{kind:'play-prop',yaw:[-.18,.18],pitchMid:.06,yMid:.025,damping:8.6},
  'play-cube':{kind:'play-prop',yaw:[-.28,.28],pitch:[.08,-.06],roll:[-.04,.04],damping:8.6},
  'spatial-studio':{kind:'studio-entry',yaw:[-.045,.055],y:[.035,-.035],cameraZ:[.28,-.14],damping:6.8}
};

const tuned=new Set();
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
const smoother=t=>{t=clamp(t);return t*t*t*(t*(t*6-15)+10)};

function rawProgressFor(instance){
  const el=instance.v330Section||instance.element;
  const r=el.getBoundingClientRect();
  return clamp((innerHeight-r.top)/(innerHeight+r.height));
}

function apply(name,instance){
  const cfg=tuningFor(name);
  if(!cfg||!instance?.loaded||!instance.model||!instance.camera||tuned.has(name))return false;
  instance.model.scale.multiplyScalar(cfg.scale);
  instance.model.position.y+=cfg.modelY||0;
  instance.model.rotation.y+=(cfg.modelYaw||0);
  instance.model.updateMatrixWorld(true);
  instance.camera.fov=cfg.fov;
  instance.camera.position.z=cfg.cameraZ;
  instance.camera.updateProjectionMatrix();
  if(instance.renderer)instance.renderer.toneMappingExposure=cfg.exposure;
  instance.element.dataset.modelFraming='v324';
  instance.element.dataset.modelFramingRevision=FRAMING_REVISION;
  instance.element.dataset.modelChoreography='v331';
  if(name==='hero-movx-logo')instance.element.dataset.mobileLogoFit=narrowMobile?'v336':'desktop';
  instance.v324Tuning={...cfg};
  instance.v324Tuned=true;
  instance.v336MobileLogoFit=name==='hero-movx-logo'&&narrowMobile;
  instance.v330Section=instance.element.closest('.scene')||instance.element;
  instance.v330Base={
    x:instance.model.position.x,y:instance.model.position.y,z:instance.model.position.z,
    rx:instance.model.rotation.x,ry:instance.model.rotation.y,rz:instance.model.rotation.z,
    cameraZ:instance.camera.position.z
  };
  const initial=rawProgressFor(instance);
  instance.v331TargetProgress=initial;
  instance.v331Progress=initial;
  instance.v331Velocity=0;
  instance.v331ChoreographyReady=!!CHOREOGRAPHY[name];
  tuned.add(name);
  return true;
}

function smoothedProgress(name,instance,dt){
  const c=CHOREOGRAPHY[name];
  const target=rawProgressFor(instance);
  instance.v331TargetProgress=target;
  if(reduced){instance.v331Progress=target;instance.v331Velocity=0;return target}
  const rate=(c?.damping||7.5)*(coarse?1.12:1);
  const alpha=1-Math.exp(-rate*Math.min(.05,Math.max(.001,dt)));
  const previous=Number.isFinite(instance.v331Progress)?instance.v331Progress:target;
  const current=previous+(target-previous)*alpha;
  instance.v331Velocity=(current-previous)/Math.max(dt,.001);
  instance.v331Progress=Math.abs(target-current)<.00015?target:current;
  return instance.v331Progress;
}

function choreograph(name,instance,dt){
  const c=CHOREOGRAPHY[name],b=instance.v330Base;
  if(!c||!b||!instance.v331ChoreographyReady)return;
  const p=smoothedProgress(name,instance,dt);
  const e=smoother(p);
  const mid=Math.sin(Math.PI*p);
  const settle=Math.sin(Math.PI*clamp((p-.08)/.84));
  const m=motionScale;
  const model=instance.model,camera=instance.camera;

  model.position.x=b.x+(c.x?lerp(c.x[0],c.x[1],e)*m:0);
  model.position.y=b.y+(c.y?lerp(c.y[0],c.y[1],e)*m:0)+(c.yMid?mid*c.yMid*m:0);
  model.position.z=b.z+(c.z?lerp(c.z[0],c.z[1],e)*m:0);
  model.rotation.x=b.rx+(c.pitch?lerp(c.pitch[0],c.pitch[1],e)*m:0)+(c.pitchMid?mid*c.pitchMid*m:0);
  model.rotation.y=b.ry+(c.yaw?lerp(c.yaw[0],c.yaw[1],e)*m:0);
  model.rotation.z=b.rz+(c.roll?lerp(c.roll[0],c.roll[1],e)*m:0);
  camera.position.z=b.cameraZ+(c.cameraZ?lerp(c.cameraZ[0],c.cameraZ[1],e)*m:0);

  // A tiny eased settle keeps scene handoffs from feeling like linear keyframes.
  if(c.kind==='hardware-reveal')model.rotation.x=b.rx+settle*.012*m;
  if(c.kind==='studio-entry')camera.position.y=settle*.018*m;
  if(c.kind==='portal-dolly')model.position.y=b.y-mid*.018*m;

  instance.v330Progress=p;
  instance.element.style.setProperty('--model-scroll-progress',p.toFixed(4));
  instance.element.style.setProperty('--model-scroll-target',instance.v331TargetProgress.toFixed(4));
  instance.element.style.setProperty('--model-scroll-velocity',clamp(instance.v331Velocity,-2,2).toFixed(4));
}

let lastTime=performance.now();
function tick(now){
  const dt=Math.min(.05,Math.max(.001,(now-lastTime)/1000));lastTime=now;
  const runtime=window.MOVX3D?.runtime;
  if(runtime){
    for(const [name,instance] of Object.entries(runtime.instances||{})){
      apply(name,instance);
      if(instance.loaded)choreograph(name,instance,dt);
    }
    runtime.framingVersion='v324-model-framing';
    runtime.framingRevision=FRAMING_REVISION;
    runtime.framingTuning=TUNING;
    runtime.mobileFramingTuning=MOBILE_TUNING;
    runtime.mobileLogoFit=narrowMobile?'v336':'desktop';
    runtime.choreographyVersion=CHOREOGRAPHY_REVISION;
    runtime.choreographyTuning=CHOREOGRAPHY;
    runtime.choreographyMotionScale=motionScale;
    runtime.choreographyDamping='frame-rate-independent';
    root.dataset.v324Tuned=String(tuned.size);
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
