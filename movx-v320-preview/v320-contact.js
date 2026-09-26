(()=>{
  document.documentElement.classList.add('v320');
  const section=document.querySelector('#contact,.contact311');
  const slot=document.querySelector('[data-model-slot="closing-window"]');
  if(!section||!slot)return;

  if(!slot.querySelector('.v320-hardware')){
    const hardware=document.createElement('div');
    hardware.className='v320-hardware';
    hardware.setAttribute('aria-hidden','true');
    hardware.innerHTML='<i class="v320-hinge h1"></i><i class="v320-hinge h2"></i><i class="v320-led"></i>';
    slot.appendChild(hardware);
  }
  let status=slot.querySelector('.v320-status');
  if(!status){
    status=document.createElement('span');
    status.className='v320-status';
    status.textContent='DOM FALLBACK / GLB SLOT: CLOSING-WINDOW';
    slot.appendChild(status);
  }

  const params=new URLSearchParams(location.search);
  const requestedModel=params.get('contactModel');
  if(requestedModel){
    slot.dataset.modelSrc=requestedModel;
    slot.classList.add('has-model-request');
    status.textContent='GLB REQUESTED / '+requestedModel.split('/').pop();
  }

  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  let last=-1;
  const tick=()=>{
    const r=section.getBoundingClientRect();
    const progress=clamp((innerHeight-r.top)/(innerHeight+r.height));
    if(Math.abs(progress-last)>.001){
      document.documentElement.style.setProperty('--exit-progress',progress.toFixed(4));
      last=progress;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  window.MOVX3D=window.MOVX3D||{};
  window.MOVX3D.slots=window.MOVX3D.slots||{};
  window.MOVX3D.slots['closing-window']={
    element:slot,
    requestedSrc:requestedModel||null,
    fallback:'dom-contact-window',
    replaceWith(rendererElement){
      if(!rendererElement)return false;
      rendererElement.setAttribute('data-runtime-model','closing-window');
      slot.classList.add('has-runtime-model');
      slot.dataset.modelState='external-renderer';
      slot.appendChild(rendererElement);
      return true;
    },
    restoreFallback(){
      slot.querySelectorAll('[data-runtime-model="closing-window"]').forEach(el=>el.remove());
      slot.classList.remove('has-runtime-model');
      slot.dataset.modelState='dom-fallback';
    }
  };
})();
