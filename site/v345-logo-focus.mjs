/* MOVX v346 — Physical Logo visibility pass.
   One-model workflow: make the real GLB obvious before any advanced animation pass. */
const root=document.documentElement;
const narrow=matchMedia('(max-width:720px)').matches;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const REVISION='v346-physical-logo-visible';
root.classList.add('v345-logo-focus');
root.dataset.logoFocus=REVISION;

let applied=false;

function applyLogoFocus(instance){
  if(applied||!instance?.loaded||!instance.model||!instance.camera||!instance.v324Tuned||!instance.v330Base)return false;

  /* Mobile keeps the proven safe fit. Desktop gets a stronger hero composition. */
  if(!narrow){
    instance.model.scale.multiplyScalar(1.20);
    instance.v330Base.y-=0.018;
    instance.v330Base.ry-=0.028;
    instance.v330Base.cameraZ=2.58;
    instance.camera.position.z=2.58;
    instance.camera.fov=27.5;
    instance.camera.updateProjectionMatrix();
  }

  /* Lift the existing production light rig enough to separate the off-white body
     from the light hero background without replacing the GLB materials. */
  const lights=instance.scene?.children?.filter(node=>node?.isLight)||[];
  lights.forEach(light=>{
    if(light.isHemisphereLight)light.intensity=Math.max(light.intensity,2.5);
    else if(light.isDirectionalLight&&light.position.x>0)light.intensity=Math.max(light.intensity,5.2);
    else if(light.isDirectionalLight)light.intensity=Math.max(light.intensity,1.8);
  });

  instance.v345LogoFocus={
    revision:REVISION,
    stage:1,
    desktopPresence:!narrow,
    scaleBoost:narrow?1:1.20,
    cameraZ:narrow?instance.v330Base.cameraZ:2.58,
    fov:narrow?instance.camera.fov:27.5,
    mobileSafeFit:narrow,
    visibilityPass:true
  };
  instance.element.dataset.logoFocus=REVISION;
  instance.element.dataset.logoFocusStage='1';
  instance.element.dataset.logoFocusReady='true';
  applied=true;
  return true;
}

function keepRendererVisible(instance){
  if(!instance?.renderer||!instance?.canvas)return;
  if(!narrow)instance.renderer.toneMappingExposure=1.24;
  instance.element.dataset.logoFocusReady='true';
  instance.host?.style?.setProperty('opacity','1');
  instance.host?.style?.setProperty('visibility','visible');
  instance.canvas.style.opacity='1';
  instance.canvas.style.visibility='visible';
}

function tick(){
  const runtime=window.MOVX3D?.runtime;
  const instance=runtime?.instances?.['hero-movx-logo'];
  if(instance){
    applyLogoFocus(instance);
    if(applied)keepRendererVisible(instance);
    runtime.logoFocusVersion=REVISION;
    runtime.logoFocusStage=1;
    runtime.logoFocusSingleModel=true;
    runtime.logoVisibilityRequired=true;
  }
  if(!reduced||!applied)requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
