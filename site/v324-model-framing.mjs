/* MOVX v324 — per-model framing calibration for real Tripo GLBs. */
const root=document.documentElement;
root.classList.add('v324');
root.dataset.modelFraming='v324-model-framing';

const TUNING={
  'hero-movx-logo':{scale:1.28,cameraZ:2.72,fov:30,modelY:-0.01,modelYaw:0.0,exposure:1.12},
  'x-portal':{scale:1.18,cameraZ:3.35,fov:38,modelY:-0.03,modelYaw:0.0,exposure:1.08},
  'creative-machine':{scale:1.24,cameraZ:3.0,fov:33,modelY:-0.05,modelYaw:-0.035,exposure:1.12},
  'play-camera':{scale:.86,cameraZ:3.38,fov:31,modelY:-0.04,modelYaw:-0.13,exposure:1.08},
  'play-cube':{scale:.82,cameraZ:3.42,fov:31,modelY:-0.03,modelYaw:-0.12,exposure:1.1},
  'spatial-studio':{scale:1.34,cameraZ:2.85,fov:40,modelY:-0.06,modelYaw:.045,exposure:1.02}
};

const tuned=new Set();
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
  instance.v324Tuning={...cfg};
  instance.v324Tuned=true;
  tuned.add(name);
  return true;
}

function tick(){
  const runtime=window.MOVX3D?.runtime;
  if(runtime){
    for(const [name,instance] of Object.entries(runtime.instances||{}))apply(name,instance);
    runtime.framingVersion='v324-model-framing';
    runtime.framingTuning=TUNING;
    root.dataset.v324Tuned=String(tuned.size);
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
