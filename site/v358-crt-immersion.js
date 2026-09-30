/* MOVX v358/v373.2 — Scene 01 interaction controller.
   The four boot labels become spatial inputs for the existing CRT. No other
   production model is activated. Cursor input is secondary to scroll and the
   entire layer gracefully collapses for reduced motion / coarse pointers.

   v373.2 adds only a unit bridge inside the EXISTING pointer handler: the same
   normalized pointer that drives the real CRT also publishes pixel-valued CSS
   vars for the authored loading poster. No listener, RAF or input source is added. */
(()=>{
  const root=document.documentElement;
  const boot=document.querySelector('#boot');
  const wrap=boot?.querySelector('.crt-wrap');
  const slot=boot?.querySelector('[data-model-slot="boot-tv"]');
  const tags=[...(boot?.querySelectorAll('.boot-tags .tag')||[])].map(old=>{
    const button=document.createElement('button');button.type='button';button.className=old.className;button.textContent=old.textContent;old.replaceWith(button);return button;
  });
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
  const content={
    direction:['Direção de arte em projetos reais. Troque a arte na própria TV.','social-media.html','Explorar direção de arte ↗'],
    motion:['Experimente o ritmo: controle a animação e encontre o seu tempo.','video-editor.html','Explorar motion ↗'],
    ai:['Um estudo generativo ao vivo. Mude a variação e descubra outra composição.','ai-creator.html','Explorar AI ↗'],
    digital:['A mesma interface, dois formatos. Explore como o layout se adapta.','ui-ux.html','Explorar digital ↗']
  };
  const panel=document.createElement('div');panel.className='crt-channel-panel';panel.id='crt-channel-panel';
  const description=document.createElement('p');description.setAttribute('aria-live','polite');description.setAttribute('aria-atomic','true');
  const explore=document.createElement('a');explore.hidden=true;panel.append(description,explore);tags[0].parentElement.after(panel);
  tags[0].parentElement.setAttribute('role','group');tags[0].parentElement.setAttribute('aria-label','Canais do estúdio');
  const byLabel=new Map(MODES.map(x=>[x.label,x]));

  root.dataset.crtImmersion='v358-spatial-input';
  root.style.setProperty('--crt-px','0');
  root.style.setProperty('--crt-py','0');
  root.style.setProperty('--crt-poster-x','0px');
  root.style.setProperty('--crt-poster-y','0px');
  root.style.setProperty('--crt-mode-yaw','0');
  root.style.setProperty('--crt-mode-pitch','0');
  root.style.setProperty('--crt-mode-roll','0');
  root.style.setProperty('--crt-mode-zoom','0');
  root.style.setProperty('--crt-mode-energy','0');
  root.style.setProperty('--crt-drag-yaw','0');
  root.style.setProperty('--crt-drag-pitch','0');
  boot.dataset.crtMode='neutral';

  let locked=MODES[0];
  let pointerX=0,pointerY=0;
  let hasEngaged=false;

  const hint=document.createElement('span');
  hint.className='crt-interaction-hint';
  hint.textContent='ESCOLHA UM CANAL · EXPLORE NA TELA';
  hint.setAttribute('aria-hidden','true');
  wrap.appendChild(hint);

  function setPointer(nx,ny){
    pointerX=clamp(nx,-1,1);pointerY=clamp(ny,-1,1);
    root.style.setProperty('--crt-px',pointerX.toFixed(4));
    root.style.setProperty('--crt-py',pointerY.toFixed(4));
    /* v373.2: CSS calc can reliably add like units across current engines, while
       number*length multiplication is not portable enough. Convert once here in
       the already-existing event path; the real CRT still consumes px/py above. */
    root.style.setProperty('--crt-poster-x',`${(pointerX*5).toFixed(2)}px`);
    root.style.setProperty('--crt-poster-y',`${(pointerY*3).toFixed(2)}px`);
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
    const info=content[value.id];
    description.textContent=info?info[0]:'Escolha um canal para explorar o estúdio';
    explore.hidden=!info;if(info){explore.href=info[1];explore.textContent=info[2];}
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
    tag.setAttribute('aria-controls','crt-channel-panel');
    tag.setAttribute('tabindex','0');
    tag.setAttribute('aria-label',`${mode.label}: sintonizar canal na TV`);
    tag.setAttribute('aria-pressed','false');
    tag.dataset.crtModeControl=mode.id;

    const preview=()=>{engage();applyMode(mode,{transient:true})};
    const restore=()=>applyMode(locked);
    // Channels tune on deliberate click/tap, never incidental hover.
    tag.addEventListener('pointerleave',restore,{passive:true});

    tag.addEventListener('blur',restore);
    tag.addEventListener('click',()=>{
      engage();
      locked=mode;
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

  if(!reduced){
    const relativePoint=event=>{
      const r=boot.querySelector('.scene-inner').getBoundingClientRect();
      if(!r.width||!r.height)return null;
      const inside=event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom;
      return {inside,nx:((event.clientX-r.left)/r.width-.5)*2,ny:((event.clientY-r.top)/r.height-.5)*2};
    };

    /* Scene-level ownership avoids relying on the exact hit target. The WebGL
       canvas is intentionally pointer-transparent, and older visual layers may
       sit above/below the CRT. As long as the cursor is physically over the TV
       rectangle, the real Three.js object receives the same normalized input. */
    boot.addEventListener('pointermove',event=>{
      if(event.pointerType==='touch')return;
      root.dataset.crtPointerReady='true';
      const p=relativePoint(event);if(!p)return;
      if(p.inside){engage();setPointer(p.nx,p.ny)}
      else setPointer(0,0);
    },{passive:true});
    boot.addEventListener('pointerleave',()=>setPointer(0,0),{passive:true});
    root.dataset.crtPointerReady=String(!coarse);
  }else{
    root.dataset.crtPointerReady='false';
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

  document.addEventListener('visibilitychange',()=>{if(document.hidden)setPointer(0,0)});
  addEventListener('pagehide',event=>{if(!event.persisted)stateObserver.disconnect()});

  applyMode(locked);
  root.dataset.crtInteractionReady='true';
})();
