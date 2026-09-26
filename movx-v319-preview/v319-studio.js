(()=>{
  document.documentElement.classList.add('v319');
  const section=document.querySelector('#studio,.studio311');
  const slot=document.querySelector('[data-model-slot="spatial-studio"]');
  if(!section||!slot)return;

  if(!slot.querySelector('.v319-ambient')){
    const ambient=document.createElement('i');
    ambient.className='v319-ambient';
    ambient.setAttribute('aria-hidden','true');
    slot.appendChild(ambient);
  }
  let status=slot.querySelector('.v319-status');
  if(!status){
    status=document.createElement('span');
    status.className='v319-status';
    status.textContent='DOM FALLBACK / GLB SLOT: SPATIAL-STUDIO';
    slot.appendChild(status);
  }

  const params=new URLSearchParams(location.search);
  const requestedModel=params.get('studioModel');
  if(requestedModel){
    slot.dataset.modelSrc=requestedModel;
    slot.classList.add('has-model-request');
    status.textContent='GLB REQUESTED / '+requestedModel.split('/').pop();
  }

  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  let px=0,py=0,targetX=0,targetY=0,lastProgress=-1;
  slot.addEventListener('pointermove',e=>{
    const r=slot.getBoundingClientRect();
    targetX=clamp(((e.clientX-r.left)/Math.max(1,r.width))*2-1,-1,1);
    targetY=clamp(((e.clientY-r.top)/Math.max(1,r.height))*2-1,-1,1);
  },{passive:true});
  slot.addEventListener('pointerleave',()=>{targetX=0;targetY=0},{passive:true});

  const tick=()=>{
    const r=section.getBoundingClientRect();
    const progress=clamp((innerHeight-r.top)/(innerHeight+r.height));
    px+=(targetX-px)*.055;
    py+=(targetY-py)*.055;
    document.documentElement.style.setProperty('--studio-px',px.toFixed(3));
    document.documentElement.style.setProperty('--studio-py',py.toFixed(3));
    if(Math.abs(progress-lastProgress)>.001){
      document.documentElement.style.setProperty('--studio-progress',progress.toFixed(4));
      lastProgress=progress;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  window.MOVX3D=window.MOVX3D||{};
  window.MOVX3D.slots=window.MOVX3D.slots||{};
  window.MOVX3D.slots['spatial-studio']={
    element:slot,
    requestedSrc:requestedModel||null,
    fallback:'dom-spatial-studio',
    replaceWith(rendererElement){
      if(!rendererElement)return false;
      rendererElement.setAttribute('data-runtime-model','spatial-studio');
      slot.classList.add('has-runtime-model');
      slot.dataset.modelState='external-renderer';
      slot.appendChild(rendererElement);
      return true;
    },
    restoreFallback(){
      slot.querySelectorAll('[data-runtime-model="spatial-studio"]').forEach(el=>el.remove());
      slot.classList.remove('has-runtime-model');
      slot.dataset.modelState='dom-fallback';
    }
  };
})();
