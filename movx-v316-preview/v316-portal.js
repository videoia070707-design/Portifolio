(()=>{
  document.documentElement.classList.add('v316');
  const portal=document.querySelector('#portal');
  const slot=document.querySelector('[data-model-slot="x-portal"]');
  if(!portal||!slot)return;

  slot.classList.add('v316-active-slot');
  slot.dataset.modelState='dom-fallback';

  if(!slot.querySelector('.v316-portal-stage')){
    const stage=document.createElement('div');
    stage.className='v316-portal-stage';
    stage.setAttribute('aria-hidden','true');
    const frames=Array.from({length:8},(_,i)=>{
      const t=i/7;
      const z=Math.round(-520+i*78);
      const s=(.46+i*.11).toFixed(2);
      const r=((i%2?1:-1)*(1.8-i*.16)).toFixed(2)+'deg';
      const o=(.18+t*.48).toFixed(2);
      return `<i class="v316-tunnel-frame" style="--z:${z}px;--s:${s};--r:${r};--o:${o}"></i>`;
    }).join('');
    stage.innerHTML=`<i class="v316-depth-field"></i>${frames}<div class="v316-x-core"><i class="v316-x-cut"></i></div><div class="v316-portal-copy"><small>03 / ENTER THE X</small><h2>ENTRE<br>NO X</h2><p>O símbolo deixa de ser assinatura e vira passagem para o universo MOVX.</p></div><div class="v316-portal-side">IDENTITY → SPACE<br>OBJECT → ENVIRONMENT</div><div class="v316-portal-cue">SCROLL TO ENTER</div><div class="v316-portal-status">DOM FALLBACK / GLB SLOT: X-PORTAL</div>`;
    slot.appendChild(stage);
  }

  const stage=slot.querySelector('.v316-portal-stage');
  const status=slot.querySelector('.v316-portal-status');
  const params=new URLSearchParams(location.search);
  const requestedModel=params.get('portalModel');
  if(requestedModel){
    slot.dataset.modelSrc=requestedModel;
    slot.classList.add('has-model-request');
    if(status)status.textContent='GLB REQUESTED / '+requestedModel.split('/').pop();
  }

  let px=0,py=0,tx=0,ty=0,last=-1;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  slot.addEventListener('pointermove',e=>{
    const r=slot.getBoundingClientRect();
    tx=clamp(((e.clientX-r.left)/Math.max(1,r.width))*2-1,-1,1);
    ty=clamp(((e.clientY-r.top)/Math.max(1,r.height))*2-1,-1,1);
  },{passive:true});
  slot.addEventListener('pointerleave',()=>{tx=0;ty=0},{passive:true});

  const tick=()=>{
    const r=portal.getBoundingClientRect();
    const progress=clamp((innerHeight-r.top)/(innerHeight+r.height));
    px+=(tx-px)*.07;py+=(ty-py)*.07;
    document.documentElement.style.setProperty('--portal-px',px.toFixed(3));
    document.documentElement.style.setProperty('--portal-py',py.toFixed(3));
    document.documentElement.style.setProperty('--portal-depth',(progress*1).toFixed(4));
    if(Math.abs(progress-last)>.001){document.documentElement.style.setProperty('--portal-progress',progress.toFixed(4));last=progress}
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  window.MOVX3D=window.MOVX3D||{};
  window.MOVX3D.slots=window.MOVX3D.slots||{};
  window.MOVX3D.slots['x-portal']={
    element:slot,stage,requestedSrc:requestedModel||null,fallback:'dom-x-portal',
    replaceWith(rendererElement){if(!rendererElement)return false;rendererElement.setAttribute('data-runtime-model','x-portal');slot.dataset.modelState='external-renderer';stage.style.visibility='hidden';slot.appendChild(rendererElement);return true},
    restoreFallback(){stage.style.visibility='';slot.dataset.modelState='dom-fallback';return true},
    disableV316Fallback(){stage.style.visibility='hidden';slot.classList.remove('v316-active-slot');slot.dataset.modelState='legacy-fallback';return true}
  };
})();
