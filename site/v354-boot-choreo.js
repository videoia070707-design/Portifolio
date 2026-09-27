/* MOVX v354 — scroll choreography for Scene 01 only.
   The standalone CRT remains the sole active GLB. This runtime owns the outer
   Scene-01 choreography and feeds scroll progress to the existing 3D runtime. */
(()=>{
  const root=document.documentElement;
  const boot=document.querySelector('#boot');
  const inner=boot?.querySelector('.scene-inner');
  const wrap=boot?.querySelector('.crt-wrap');
  const copy=boot?.querySelector('.boot-copy');
  const tags=boot?.querySelector('.boot-tags');
  if(!boot||!inner||!wrap||!copy)return;

  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse=matchMedia('(pointer:coarse)').matches;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const smooth=(a,b,v)=>{
    const t=clamp((v-a)/Math.max(.0001,b-a));
    return t*t*(3-2*t);
  };

  root.classList.add('v354-choreo');
  root.dataset.motionChoreo='v354-boot-scroll';
  root.dataset.motionChoreoReduced=String(reduced);
  boot.dataset.v354Phase='intro';

  let cue=boot.querySelector('.boot-scroll-cue-v354');
  if(!cue){
    cue=document.createElement('div');
    cue.className='boot-scroll-cue-v354';
    cue.setAttribute('aria-hidden','true');
    cue.innerHTML='<span>SCROLL</span><i></i><b>ENTER MOVX ↓</b>';
    inner.appendChild(cue);
  }

  if(reduced){
    boot.dataset.v354Phase='static';
    root.dataset.motionChoreoProgress='0';
    root.dataset.motionChoreoReady='true';
    return;
  }

  let targetX=0,targetY=0,pointerX=0,pointerY=0;
  let smoothP=0;

  addEventListener('pointermove',event=>{
    if(coarse)return;
    targetX=(event.clientX/Math.max(innerWidth,1)-.5)*2;
    targetY=(event.clientY/Math.max(innerHeight,1)-.5)*2;
  },{passive:true});
  addEventListener('pointerleave',()=>{targetX=0;targetY=0},{passive:true});

  function progress(){
    const rect=boot.getBoundingClientRect();
    const travel=Math.max(1,boot.offsetHeight-innerHeight);
    return clamp((-rect.top)/travel);
  }

  function phaseFor(p){
    if(p<.10)return 'intro';
    if(p<.48)return 'engage';
    if(p<.80)return 'exit';
    return 'handoff';
  }

  function render(){
    const raw=progress();
    smoothP=lerp(smoothP,raw,.16);
    pointerX=lerp(pointerX,targetX,.075);
    pointerY=lerp(pointerY,targetY,.075);

    const engage=smooth(.08,.58,smoothP);
    const exit=smooth(.46,.82,smoothP);
    const handoff=smooth(.78,1,smoothP);
    const pointerWeight=1-exit*.58;
    const desktopShift=clamp(innerWidth*.026,12,40);
    const mobileFactor=innerWidth<=900?.58:1;

    const x=(pointerX*9*pointerWeight + engage*desktopShift)*mobileFactor;
    const y=pointerY*4*pointerWeight - engage*17 - handoff*22;
    const scale=1 + engage*.064 + handoff*.046;
    const rx=(-pointerY*1.45*pointerWeight + engage*.42);
    const ry=(pointerX*2.65*pointerWeight + engage*2.2);
    const copyY=-exit*(innerWidth<=900?42:72);
    const copyOpacity=clamp(1-exit*.96,.04,1);
    const blur=exit*4.2;
    const cueOpacity=1-smooth(.04,.26,smoothP);
    const shade=handoff*.72;
    const bgX=22+engage*10;
    const tagsY=copyY*.32;

    boot.style.setProperty('--v354-p',smoothP.toFixed(4));
    boot.style.setProperty('--v354-shade',shade.toFixed(4));
    boot.style.setProperty('--v354-bg-x',`${bgX.toFixed(2)}%`);

    // Runtime-owned inline transforms make the choreography deterministic even
    // when older style layers have stronger selector specificity. The v353
    // first-load WAAPI animation still wins until it is cancelled at intro end.
    wrap.style.transform=`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${scale.toFixed(4)}) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`;
    copy.style.transform=`translate3d(0,${copyY.toFixed(2)}px,0)`;
    copy.style.opacity=copyOpacity.toFixed(4);
    copy.style.filter=`blur(${blur.toFixed(2)}px)`;
    if(tags){
      tags.style.transform=`translate3d(0,${tagsY.toFixed(2)}px,0)`;
      tags.style.opacity=copyOpacity.toFixed(4);
    }
    cue.style.opacity=cueOpacity.toFixed(4);

    // Feed the existing Three.js runtime so the model itself participates in
    // the scroll, instead of only moving its DOM wrapper.
    root.style.setProperty('--crt-progress',smoothP.toFixed(4));

    const phase=phaseFor(smoothP);
    if(boot.dataset.v354Phase!==phase)boot.dataset.v354Phase=phase;
    root.dataset.motionChoreoProgress=smoothP.toFixed(3);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
  root.dataset.motionChoreoReady='true';
})();
