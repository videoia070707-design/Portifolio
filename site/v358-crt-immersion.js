/* MOVX v358 — Scene 01 interaction controller.
   The four boot labels become spatial inputs for the existing CRT. No other
   production model is activated. Pointer input is secondary to scroll and the
   entire layer gracefully collapses for reduced motion / coarse pointers. */
(()=>{
  const root=document.documentElement;
  const boot=document.querySelector('#boot');
  const wrap=boot?.querySelector('.crt-wrap');
  const slot=boot?.querySelector('[data-model-slot="boot-tv"]');
  const tags=[...(boot?.querySelectorAll('.boot-tags .tag')||[])];
  if(!boot||!wrap||!slot||tags.length<4)return;

  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse=matchMedia('(pointer:coarse)').matches;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const rad=d=>d*Math.PI/180;

  const MODES=[
    {id:'direction',label:'DIREÇÃO',yaw:rad(-7.2),pitch:rad(1.0),roll:rad(-.25),zoom:.08,energy:.34},
    {id:'motion',label:'MOTION',yaw:rad(7.8),pitch:rad(-1.45),roll:rad(1.25),zoom:.13,energy:.72},
    {id:'ai',label:'AI',yaw:rad(-3.2),pitch:rad(2.15),roll:rad(-.7),zoom:.18,energy:1},
    {id:'digital',label:'DIGITAL',yaw:rad(6.1),pitch:rad(.7),roll:rad(-1.05),zoom:.11,energy:.56},
  ];
  const byLabel=new Map(MODES.map(x=>[x.label,x]));

  root.dataset.crtImmersion='v358-spatial-input';
  root.style.setProperty('--crt-px','0');
  root.style.setProperty('--crt-py','0');
  root.style.setProperty('--crt-mode-yaw','0');
  root.style.setProperty('--crt-mode-pitch','0');
  root.style.setProperty('--crt-mode-roll','0');
  root.style.setProperty('--crt-mode-zoom','0');
  root.style.setProperty('--crt-mode-energy','0');
  root.style.setProperty('--crt-drag-yaw','0');
  root.style.setProperty('--crt-drag-pitch','0');
  boot.dataset.crtMode='neutral';

  let locked=null;
  let pointerX=0,pointerY=0;
  let dragging=false,pointerId=null,startX=0,startY=0;
  let dragYaw=0,dragPitch=0,targetDragYaw=0,targetDragPitch=0;
  let lastX=0,lastY=0,lastT=0,velX=0,velY=0,inertiaRaf=0;
  let hasEngaged=false;

  const hint=document.createElement('span');
  hint.className='crt-interaction-hint';
  hint.textContent='ARRASTE A TV / ESCOLHA UM MODO';
  hint.setAttribute('aria-hidden','true');
  wrap.appendChild(hint);

  function setPointer(nx,ny){
    pointerX=clamp(nx,-1,1);pointerY=clamp(ny,-1,1);
    root.style.setProperty('--crt-px',pointerX.toFixed(4));
    root.style.setProperty('--crt-py',pointerY.toFixed(4));
    boot.style.setProperty('--v358-hot-x',`${(50+pointerX*12).toFixed(2)}%`);
    boot.style.setProperty('--v358-hot-y',`${(44+pointerY*9).toFixed(2)}%`);
  }

  function applyMode(mode,{transient=false}={}){
    const active=mode||locked;
    const value=active||{id:'neutral',yaw:0,pitch:0,roll:0,zoom:0,energy:.18};
    root.style.setProperty('--crt-mode-yaw',String(value.yaw||0));
    root.style.setProperty('--crt-mode-pitch',String(value.pitch||0));
    root.style.setProperty('--crt-mode-roll',String(value.roll||0));
    root.style.setProperty('--crt-mode-zoom',String(value.zoom||0));
    root.style.setProperty('--crt-mode-energy',String(value.energy??.18));
    boot.style.setProperty('--v358-energy',String(value.energy??.18));
    boot.dataset.crtMode=value.id;
    tags.forEach(tag=>{
      const own=byLabel.get(tag.textContent.trim().toUpperCase());
      const selected=!!locked&&own?.id===locked.id;
      const previewed=!!transient&&own?.id===value.id;
      tag.classList.toggle('is-crt-mode',selected||previewed);
      tag.setAttribute('aria-pressed',String(selected));
    });
  }

  function engage(){
    if(hasEngaged)return;
    hasEngaged=true;
    wrap.classList.add('is-crt-engaged');
  }

  tags.forEach((tag,index)=>{
    const mode=byLabel.get(tag.textContent.trim().toUpperCase())||MODES[index];
    if(!mode)return;
    tag.setAttribute('role','button');
    tag.setAttribute('tabindex','0');
    tag.setAttribute('aria-label',`${mode.label}: alterar resposta espacial da TV`);
    tag.setAttribute('aria-pressed','false');
    tag.dataset.crtModeControl=mode.id;

    const preview=()=>{engage();applyMode(mode,{transient:true})};
    const restore=()=>applyMode(locked);
    tag.addEventListener('pointerenter',preview,{passive:true});
    tag.addEventListener('pointerleave',restore,{passive:true});
    tag.addEventListener('focus',preview);
    tag.addEventListener('blur',restore);
    tag.addEventListener('click',()=>{
      engage();
      locked=locked?.id===mode.id?null:mode;
      applyMode(locked);
    });
    tag.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();tag.click();return}
      if(event.key==='ArrowRight'||event.key==='ArrowLeft'){
        event.preventDefault();
        const next=(index+(event.key==='ArrowRight'?1:-1)+tags.length)%tags.length;
        tags[next].focus();
      }
    });
  });

  if(!coarse&&!reduced){
    wrap.addEventListener('pointermove',event=>{
      const r=wrap.getBoundingClientRect();
      if(!r.width||!r.height)return;
      setPointer(((event.clientX-r.left)/r.width-.5)*2,((event.clientY-r.top)/r.height-.5)*2);
      if(!dragging||event.pointerId!==pointerId)return;
      const dx=event.clientX-startX,dy=event.clientY-startY;
      targetDragYaw=clamp(dx/r.width*rad(34),rad(-17),rad(17));
      targetDragPitch=clamp(-dy/r.height*rad(22),rad(-10),rad(10));
      const now=performance.now(),dt=Math.max(8,now-lastT);
      velX=(event.clientX-lastX)/dt;velY=(event.clientY-lastY)/dt;
      lastX=event.clientX;lastY=event.clientY;lastT=now;
    },{passive:true});
    wrap.addEventListener('pointerenter',()=>wrap.classList.add('is-crt-engaged'),{passive:true});
    wrap.addEventListener('pointerleave',()=>{if(!dragging)setPointer(0,0)},{passive:true});
    wrap.addEventListener('pointerdown',event=>{
      if(event.button!==0)return;
      engage();
      dragging=true;pointerId=event.pointerId;startX=lastX=event.clientX;startY=lastY=event.clientY;lastT=performance.now();
      velX=velY=0;wrap.classList.add('is-crt-dragging');
      try{wrap.setPointerCapture(pointerId)}catch{}
      if(inertiaRaf){cancelAnimationFrame(inertiaRaf);inertiaRaf=0}
    });

    const settle=()=>{
      dragYaw+=(targetDragYaw-dragYaw)*.19;
      dragPitch+=(targetDragPitch-dragPitch)*.19;
      root.style.setProperty('--crt-drag-yaw',dragYaw.toFixed(5));
      root.style.setProperty('--crt-drag-pitch',dragPitch.toFixed(5));
      if(!dragging){targetDragYaw*=.915;targetDragPitch*=.915}
      if(dragging||Math.abs(dragYaw)>.001||Math.abs(dragPitch)>.001||Math.abs(targetDragYaw)>.001||Math.abs(targetDragPitch)>.001){
        inertiaRaf=requestAnimationFrame(settle);
      }else{
        dragYaw=dragPitch=targetDragYaw=targetDragPitch=0;
        root.style.setProperty('--crt-drag-yaw','0');root.style.setProperty('--crt-drag-pitch','0');
        inertiaRaf=0;
      }
    };

    const release=event=>{
      if(!dragging||event.pointerId!==pointerId)return;
      dragging=false;wrap.classList.remove('is-crt-dragging');
      try{wrap.releasePointerCapture(pointerId)}catch{}
      /* Convert the final physical pointer velocity into a restrained release.
         It never spins indefinitely; the target decays back to the active mode. */
      targetDragYaw=clamp(targetDragYaw+velX*.055,rad(-18),rad(18));
      targetDragPitch=clamp(targetDragPitch-velY*.035,rad(-10),rad(10));
      if(!inertiaRaf)inertiaRaf=requestAnimationFrame(settle);
    };
    wrap.addEventListener('pointerup',release);
    wrap.addEventListener('pointercancel',release);
    wrap.addEventListener('lostpointercapture',event=>{if(dragging&&event.pointerId===pointerId)release(event)});
  }

  const stateObserver=new MutationObserver(()=>{
    const state=slot.dataset.glbState;
    if(state==='ready'){
      boot.classList.add('crt-is-real');
      root.dataset.crtAssetState='real-ready';
    }else if(state==='preview-ready'){
      boot.classList.remove('crt-is-real');
      root.dataset.crtAssetState='streaming-preview';
    }
  });
  stateObserver.observe(slot,{attributes:true,attributeFilter:['data-glb-state']});
  if(slot.dataset.glbState==='ready')boot.classList.add('crt-is-real');

  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){setPointer(0,0);dragging=false;wrap.classList.remove('is-crt-dragging')}
  });
  addEventListener('pagehide',()=>{stateObserver.disconnect();if(inertiaRaf)cancelAnimationFrame(inertiaRaf)},{once:true});

  applyMode(null);
  root.dataset.crtInteractionReady='true';
})();
