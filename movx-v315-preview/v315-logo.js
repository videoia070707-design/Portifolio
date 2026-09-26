(()=>{
  document.documentElement.classList.add('v315');

  const hero=document.querySelector('#hero,.hero');
  if(!hero)return;

  let slot=document.querySelector('[data-model-slot="hero-movx-logo"]');
  if(!slot){
    const host=hero.querySelector('.hero-visual,.hero-stage,.hero-media,.hero-object,.hero-right,.hero-grid')||hero;
    slot=document.createElement('div');
    slot.className='v315-logo-slot';
    slot.setAttribute('data-model-slot','hero-movx-logo');
    host.appendChild(slot);
  }
  slot.classList.add('v315-active-slot');
  slot.dataset.modelState='dom-fallback';

  if(!slot.querySelector('.v315-logo-stage')){
    const stage=document.createElement('div');
    stage.className='v315-logo-stage';
    stage.setAttribute('aria-hidden','true');
    stage.innerHTML=`
      <i class="v315-logo-shadow"></i>
      <div class="v315-logo-object">
        <span class="v315-logo-letter">M</span>
        <span class="v315-logo-letter">O</span>
        <span class="v315-logo-letter">V</span>
        <span class="v315-logo-letter v315-x">X</span>
        <span class="v315-logo-plaque">MOV<b>X</b> / ID-01<br>PHYSICAL MARK</span>
        <i class="v315-logo-pin p1"></i><i class="v315-logo-pin p2"></i>
        <span class="v315-logo-material-swatch"><i></i>ABS / ORANGE</span>
      </div>
      <span class="v315-logo-status">DOM FALLBACK / GLB SLOT: HERO-MOVX-LOGO</span>`;
    slot.appendChild(stage);
  }

  const stage=slot.querySelector('.v315-logo-stage');
  const status=slot.querySelector('.v315-logo-status');
  const params=new URLSearchParams(location.search);
  const requestedModel=params.get('logoModel');
  if(requestedModel){
    slot.dataset.modelSrc=requestedModel;
    slot.classList.add('has-model-request');
    if(status)status.textContent='GLB REQUESTED / '+requestedModel.split('/').pop();
  }

  let px=0,py=0,targetX=0,targetY=0,lastProgress=-1;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const pointer=e=>{
    const r=slot.getBoundingClientRect();
    targetX=clamp(((e.clientX-r.left)/Math.max(1,r.width))*2-1,-1,1);
    targetY=clamp(((e.clientY-r.top)/Math.max(1,r.height))*2-1,-1,1);
  };
  slot.addEventListener('pointermove',pointer,{passive:true});
  slot.addEventListener('pointerleave',()=>{targetX=0;targetY=0},{passive:true});

  const tick=()=>{
    const r=hero.getBoundingClientRect();
    const progress=clamp((innerHeight-r.top)/(innerHeight+r.height));
    px+=(targetX-px)*.075;
    py+=(targetY-py)*.075;
    document.documentElement.style.setProperty('--logo-px',px.toFixed(3));
    document.documentElement.style.setProperty('--logo-py',py.toFixed(3));
    document.documentElement.style.setProperty('--logo-tilt',((progress-.5)*2).toFixed(3));
    if(Math.abs(progress-lastProgress)>.001){
      document.documentElement.style.setProperty('--logo-progress',progress.toFixed(4));
      lastProgress=progress;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  const io=new IntersectionObserver(entries=>{
    entries.forEach(entry=>hero.classList.toggle('is-active',entry.isIntersecting));
  },{threshold:.16});
  io.observe(hero);

  window.MOVX3D=window.MOVX3D||{};
  window.MOVX3D.slots=window.MOVX3D.slots||{};
  window.MOVX3D.slots['hero-movx-logo']={
    element:slot,
    stage,
    requestedSrc:requestedModel||null,
    fallback:'dom-physical-logo',
    replaceWith(rendererElement){
      if(!rendererElement)return false;
      rendererElement.setAttribute('data-runtime-model','hero-movx-logo');
      slot.dataset.modelState='external-renderer';
      stage.style.visibility='hidden';
      slot.appendChild(rendererElement);
      return true;
    },
    restoreFallback(){
      stage.style.visibility='';
      slot.dataset.modelState='dom-fallback';
      return true;
    },
    disableV315Fallback(){
      stage.style.visibility='hidden';
      slot.classList.remove('v315-active-slot');
      slot.dataset.modelState='legacy-fallback';
      return true;
    }
  };
})();
