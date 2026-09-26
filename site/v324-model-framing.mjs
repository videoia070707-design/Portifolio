/* MOVX v324 framing + v330 scroll choreography for the six real Tripo GLBs.
   The approved DOM/layout stays untouched; this layer only calibrates model/camera motion. */
const root=document.documentElement;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse=matchMedia('(pointer:coarse)').matches;
const motionScale=reduced?0:(coarse?.62:1);
root.classList.add('v324');
root.dataset.modelFraming='v324-model-framing';
root.dataset.modelFramingRevision='v330-choreography';
root.dataset.modelChoreography='v330-scroll-choreography';

const TUNING={
  'hero-movx-logo':{scale:1.12,cameraZ:3.0,fov:31,modelY:-0.01,modelYaw:0.0,exposure:1.12},
  'x-portal':{scale:1.08,cameraZ:3.55,fov:40,modelY:-0.025,modelYaw:0.0,exposure:1.08},
  'creative-machine':{scale:1.30,cameraZ:3.12,fov:33,modelY:-0.025,modelYaw:-0.035,exposure:1.12},
  'play-camera':{scale:.86,cameraZ:3.38,fov:31,modelY:-0.04,modelYaw:-0.13,exposure:1.08},
  'play-cube':{scale:.82,cameraZ:3.42,fov:31,modelY:-0.03,modelYaw:-0.12,exposure:1.1},
  'spatial-studio':{scale:1.34,cameraZ:2.85,fov:40,modelY:-0.06,modelYaw:.045,exposure:1.02}
};

const CHOREOGRAPHY={
  'hero-movx-logo':{kind:'identity-reveal',yaw:[-.10,.10],pitchMid:.025,yMid:.035,cameraZ:[.12,-.06]},
  'x-portal':{kind:'portal-dolly',yaw:[-.035,.035],z:[-.10,.12],cameraZ:[.42,-.22]},
  'creative-machine':{kind:'hardware-reveal',yaw:[-.14,.12],x:[-.035,.035],cameraZ:[.16,-.10]},
  'play-camera':{kind:'play-prop',yaw:[-.18,.18],pitchMid:.06,yMid:.025},
  'play-cube':{kind:'play-prop',yaw:[-.28,.28],pitch:[.08,-.06],roll:[-.04,.04]},
  'spatial-studio':{kind:'studio-entry',yaw:[-.045,.055],y:[.035,-.035],cameraZ:[.28,-.14]}
};

const tuned=new Set();
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};

function apply(name,instance){
  const cfg=TUNING[name];
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
  instance.element.dataset.modelFramingRevision='v330-choreography';
  instance.element.dataset.modelChoreography='v330';
  instance.v324Tuning={...cfg};
  instance.v324Tuned=true;
  instance.v330Section=instance.element.closest('.scene')||instance.element;
  instance.v330Base={
    x:instance.model.position.x,y:instance.model.position.y,z:instance.model.position.z,
    rx:instance.model.rotation.x,ry:instance.model.rotation.y,rz:instance.model.rotation.z,
    cameraZ:instance.camera.position.z
  };
  instance.v330ChoreographyReady=!!CHOREOGRAPHY[name];
  tuned.add(name);
  return true;
}

function progressFor(instance){
  const el=instance.v330Section||instance.element;
  const r=el.getBoundingClientRect();
  return clamp((innerHeight-r.top)/(innerHeight+r.height));
}

function choreograph(name,instance){
  const c=CHOREOGRAPHY[name],b=instance.v330Base;
  if(!c||!b||!instance.v330ChoreographyReady)return;
  const p=progressFor(instance),e=smooth(p),mid=Math.sin(Math.PI*p),m=motionScale;
  const model=instance.model,camera=instance.camera;

  model.position.x=b.x+(c.x?lerp(c.x[0],c.x[1],e)*m:0);
  model.position.y=b.y+(c.y?lerp(c.y[0],c.y[1],e)*m:0)+(c.yMid?mid*c.yMid*m:0);
  model.position.z=b.z+(c.z?lerp(c.z[0],c.z[1],e)*m:0);
  model.rotation.x=b.rx+(c.pitch?lerp(c.pitch[0],c.pitch[1],e)*m:0)+(c.pitchMid?mid*c.pitchMid*m:0);
  model.rotation.y=b.ry+(c.yaw?lerp(c.yaw[0],c.yaw[1],e)*m:0);
  model.rotation.z=b.rz+(c.roll?lerp(c.roll[0],c.roll[1],e)*m:0);
  camera.position.z=b.cameraZ+(c.cameraZ?lerp(c.cameraZ[0],c.cameraZ[1],e)*m:0);

  instance.v330Progress=p;
  instance.element.style.setProperty('--model-scroll-progress',p.toFixed(4));
}

function tick(){
  const runtime=window.MOVX3D?.runtime;
  if(runtime){
    for(const [name,instance] of Object.entries(runtime.instances||{})){
      apply(name,instance);
      if(instance.loaded)choreograph(name,instance);
    }
    runtime.framingVersion='v324-model-framing';
    runtime.framingRevision='v330-choreography';
    runtime.framingTuning=TUNING;
    runtime.choreographyVersion='v330-scroll-choreography';
    runtime.choreographyTuning=CHOREOGRAPHY;
    runtime.choreographyMotionScale=motionScale;
    root.dataset.v324Tuned=String(tuned.size);
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
