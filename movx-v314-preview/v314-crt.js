(()=>{
  document.documentElement.classList.add('v314');
  const crt=document.querySelector('[data-model-slot="boot-tv"]');
  const boot=document.querySelector('#boot');
  if(!crt||!boot)return;

  const screen=crt.querySelector('.crt-screen');
  if(screen&&!screen.querySelector('.v314-screen-glass')){
    const glass=document.createElement('i');
    glass.className='v314-screen-glass';
    glass.setAttribute('aria-hidden','true');
    screen.appendChild(glass);
  }

  if(!crt.querySelector('.v314-crt-details')){
    const details=document.createElement('div');
    details.className='v314-crt-details';
    details.setAttribute('aria-hidden','true');
    details.innerHTML='<i class="v314-vent"></i><i class="v314-vent v2"></i><i class="v314-led"></i><span class="v314-ports"><i></i><i></i><i></i></span><span class="v314-device-mark">MOVX / MX-2003<br>CREATIVE TERMINAL</span>';
    crt.appendChild(details);
  }

  const status=document.createElement('span');
  status.className='v314-model-status';
  status.textContent='DOM FALLBACK / GLB SLOT: BOOT-TV';
  crt.appendChild(status);

  const params=new URLSearchParams(location.search);
  const requestedModel=params.get('crtModel');
  if(requestedModel){
    crt.dataset.modelSrc=requestedModel;
    crt.classList.add('has-model-request');
    status.textContent='GLB REQUESTED / '+requestedModel.split('/').pop();
  }

  let px=0,py=0,targetX=0,targetY=0,lastProgress=-1;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const updatePointer=e=>{
    const r=crt.getBoundingClientRect();
    targetX=clamp(((e.clientX-r.left)/Math.max(1,r.width))*2-1,-1,1);
    targetY=clamp(((e.clientY-r.top)/Math.max(1,r.height))*2-1,-1,1);
  };
  crt.addEventListener('pointermove',updatePointer,{passive:true});
  crt.addEventListener('pointerleave',()=>{targetX=0;targetY=0},{passive:true});

  const power=crt.querySelector('[data-power]');
  const activate=()=>crt.classList.add('is-crt-active');
  power?.addEventListener('pointerdown',activate,{passive:true});

  const tick=()=>{
    const r=boot.getBoundingClientRect();
    const progress=clamp((innerHeight-r.top)/(innerHeight+r.height));
    px+=(targetX-px)*.08;
    py+=(targetY-py)*.08;
    document.documentElement.style.setProperty('--crt-px',px.toFixed(3));
    document.documentElement.style.setProperty('--crt-py',py.toFixed(3));
    if(Math.abs(progress-lastProgress)>.001){
      document.documentElement.style.setProperty('--crt-progress',progress.toFixed(4));
      lastProgress=progress;
    }
    if(progress>.08)activate();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  window.MOVX3D=window.MOVX3D||{};
  window.MOVX3D.slots=window.MOVX3D.slots||{};
  window.MOVX3D.slots['boot-tv']={
    element:crt,
    requestedSrc:requestedModel||null,
    fallback:'dom',
    replaceWith(rendererElement){
      if(!rendererElement)return false;
      rendererElement.setAttribute('data-runtime-model','boot-tv');
      crt.dataset.modelState='external-renderer';
      crt.appendChild(rendererElement);
      return true;
    }
  };
})();
