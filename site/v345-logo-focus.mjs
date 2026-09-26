/* MOVX v345 — Physical Logo focus / stage 1.
   One-model workflow: composition + camera baseline + clean GLB takeover only. */
const root=document.documentElement;
const narrow=matchMedia('(max-width:720px)').matches;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const REVISION='v345-logo-focus-stage1';
root.classList.add('v345-logo-focus');
root.dataset.logoFocus=REVISION;

let applied=false;
let revealQueued=false;

function applyLogoFocus(instance){
  if(applied||!instance?.loaded||!instance.model||!instance.camera||!instance.v324Tuned||!instance.v330Base)return false;

  /* Keep the proven v336.1 narrow-mobile safe fit untouched. Stage 1 is a desktop
     composition correction so the logo finally reads as the hero object. */
  if(!narrow){
    instance.model.scale.multiplyScalar(1.14);
    instance.v330Base.y-=0.012;
    instance.v330Base.ry-=0.035;
    instance.v330Base.cameraZ=2.82;
    instance.camera.fov=29;
    instance.camera.updateProjectionMatrix();
  }

  instance.v345LogoFocus={
    revision:REVISION,
    stage:1,
    desktopPresence:!narrow,
    scaleBoost:narrow?1:1.14,
    cameraZ:narrow?instance.v330Base.cameraZ:2.82,
    fov:narrow?instance.camera.fov:29,
    mobileSafeFit:narrow
  };
  instance.element.dataset.logoFocus=REVISION;
  instance.element.dataset.logoFocusStage='1';
  applied=true;
  return true;
}

function keepRendererState(instance){
  if(!instance?.renderer)return;
  /* Stage 1 is not the final lighting pass; this only keeps the existing renderer
     from looking flatter after a WebGL context is hibernated and remounted. */
  if(!narrow)instance.renderer.toneMappingExposure=1.16;
  if(!revealQueued){
    revealQueued=true;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      instance.element.dataset.logoFocusReady='true';
    }));
  }
}

function tick(){
  const runtime=window.MOVX3D?.runtime;
  const instance=runtime?.instances?.['hero-movx-logo'];
  if(instance){
    applyLogoFocus(instance);
    if(applied)keepRendererState(instance);
    runtime.logoFocusVersion=REVISION;
    runtime.logoFocusStage=1;
    runtime.logoFocusSingleModel=true;
  }
  if(!reduced||!applied)requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
