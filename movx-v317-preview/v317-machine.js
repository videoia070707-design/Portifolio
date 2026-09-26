(()=>{
  document.documentElement.classList.add('v317');
  const section=document.querySelector('#machine,.machine');
  const slot=document.querySelector('[data-model-slot="creative-machine"]');
  if(!section||!slot)return;

  const modules=[...slot.querySelectorAll('.console-unit')];
  modules.forEach((el,i)=>{
    el.dataset.machineModule=String(i+1);
    el.style.setProperty('--module-live','0');
  });

  if(!slot.querySelector('.v317-machine-hardware')){
    const hardware=document.createElement('div');
    hardware.className='v317-machine-hardware';
    hardware.setAttribute('aria-hidden','true');
    hardware.innerHTML=`
      <i class="v317-machine-screw s1"></i><i class="v317-machine-screw s2"></i>
      <i class="v317-machine-screw s3"></i><i class="v317-machine-screw s4"></i>
      <div class="v317-machine-rail">
        <i class="v317-machine-led"></i><i class="v317-machine-led"></i><i class="v317-machine-led"></i><i class="v317-machine-led"></i>
      </div>`;
    slot.appendChild(hardware);
  }

  let status=slot.querySelector('.v317-machine-status');
  if(!status){
    status=document.createElement('span');
    status.className='v317-machine-status';
    status.textContent='DOM FALLBACK / GLB SLOT: CREATIVE-MACHINE';
    slot.appendChild(status);
  }

  const leds=[...slot.querySelectorAll('.v317-machine-led')];
  const params=new URLSearchParams(location.search);
  const requestedModel=params.get('machineModel');
  if(requestedModel){
    slot.dataset.modelSrc=requestedModel;
    slot.classList.add('has-model-request');
    status.textContent='GLB REQUESTED / '+requestedModel.split('/').pop();
  }

  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  let px=0,py=0,targetX=0,targetY=0,lastProgress=-1,lastActive=-1;
  const pointer=e=>{
    const r=slot.getBoundingClientRect();
    targetX=clamp(((e.clientX-r.left)/Math.max(1,r.width))*2-1,-1,1);
    targetY=clamp(((e.clientY-r.top)/Math.max(1,r.height))*2-1,-1,1);
  };
  slot.addEventListener('pointermove',pointer,{passive:true});
  slot.addEventListener('pointerleave',()=>{targetX=0;targetY=0},{passive:true});

  const setActive=index=>{
    if(index===lastActive)return;
    lastActive=index;
    modules.forEach((el,i)=>{
      const live=i===index;
      el.classList.toggle('is-live',live);
      el.style.setProperty('--module-live',live?'1':'0');
    });
    leds.forEach((el,i)=>el.classList.toggle('is-live',i<=index));
    slot.dataset.activeModule=String(index+1);
  };

  const tick=()=>{
    const r=section.getBoundingClientRect();
    const progress=clamp((innerHeight-r.top)/(innerHeight+r.height));
    px+=(targetX-px)*.07;
    py+=(targetY-py)*.07;
    document.documentElement.style.setProperty('--machine-px',px.toFixed(3));
    document.documentElement.style.setProperty('--machine-py',py.toFixed(3));
    if(Math.abs(progress-lastProgress)>.001){
      document.documentElement.style.setProperty('--machine-progress',progress.toFixed(4));
      lastProgress=progress;
    }
    const staged=clamp((progress-.12)/.72);
    setActive(Math.min(modules.length-1,Math.max(0,Math.floor(staged*modules.length))));
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  const io=new IntersectionObserver(entries=>{
    entries.forEach(entry=>section.classList.toggle('is-active',entry.isIntersecting));
  },{threshold:.14});
  io.observe(section);

  window.MOVX3D=window.MOVX3D||{};
  window.MOVX3D.slots=window.MOVX3D.slots||{};
  window.MOVX3D.slots['creative-machine']={
    element:slot,
    requestedSrc:requestedModel||null,
    fallback:'dom-modular-machine',
    modules,
    replaceWith(rendererElement){
      if(!rendererElement)return false;
      rendererElement.setAttribute('data-runtime-model','creative-machine');
      slot.dataset.modelState='external-renderer';
      slot.classList.add('has-runtime-model');
      slot.appendChild(rendererElement);
      return true;
    },
    restoreFallback(){
      slot.querySelectorAll('[data-runtime-model="creative-machine"]').forEach(el=>el.remove());
      slot.classList.remove('has-runtime-model');
      slot.dataset.modelState='dom-fallback';
    }
  };
})();
