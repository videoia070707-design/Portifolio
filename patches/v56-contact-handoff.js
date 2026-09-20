/* MOVX v56 — Process → Contact drawn handoff runtime
   Collapses the last Process frames into a single trace and uses that trace to draw
   the Contact composition. v55 stays the only owner of Process 3D transforms. */
(()=>{
  const root=document.documentElement;
  root.classList.add('movx-v56');
  root.dataset.movxContactHandoff='v56-drawn';
  const reduced=new URLSearchParams(location.search).has('static')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop=matchMedia('(min-width:981px)').matches;
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>t*t*(3-2*t);

  function boot(attempt=0){
    const process=document.querySelector('#process.process-section');
    const journey=document.querySelector('#process .v55-process-journey');
    const contact=document.querySelector('#contact.contact-section')||document.querySelector('#contact');
    if(!process||!journey||!contact){
      if(attempt<120)setTimeout(()=>boot(attempt+1),50);
      return;
    }
    if(root.dataset.v56Ready==='1')return;
    root.dataset.v56Ready='1';

    contact.classList.add('v56-contact-drawn');
    if(!contact.querySelector('.v56-contact-rail')){
      const rail=document.createElement('div');rail.className='v56-contact-rail';rail.setAttribute('aria-hidden','true');contact.appendChild(rail);
    }
    if(!desktop||reduced){
      contact.style.setProperty('--v56-contact-rule','1');
      contact.style.setProperty('--v56-title-rule','1');
      return;
    }

    const copy=contact.querySelector('.contact-copy')||contact.firstElementChild;
    const form=contact.querySelector('.contact-form');
    const layer=document.createElement('div');
    layer.className='v56-handoff-layer';layer.setAttribute('aria-hidden','true');
    layer.innerHTML='<div class="v56-frame-stack"><i></i><i></i><i></i><i></i><i></i></div><div class="v56-trace"></div><div class="v56-guide v56-guide--copy"></div><div class="v56-guide v56-guide--form"></div><div class="v56-beacon"></div>';
    document.body.appendChild(layer);
    const frames=[...layer.querySelectorAll('.v56-frame-stack i')];
    const initial=[[-150,-78,-7],[-78,-38,-3.5],[0,0,0],[76,36,3.2],[146,76,6.4]];
    let active=false,raf=0,lastY=scrollY,lastTime=performance.now(),velocity=0;
    const visibility=new Map([[journey,false],[contact,false]]);

    function nearViewport(el){
      const rect=el.getBoundingClientRect();
      return rect.bottom>-innerHeight*.75&&rect.top<innerHeight*1.75;
    }
    function refreshActive(){
      active=[...visibility.values()].some(Boolean)||nearViewport(journey)||nearViewport(contact);
      return active;
    }
    function journeyProgress(){
      const rect=journey.getBoundingClientRect();
      const travel=Math.max(1,journey.offsetHeight-innerHeight);
      return clamp(-rect.top/travel,0,1);
    }
    function contactProgress(){
      const rect=contact.getBoundingClientRect();
      return smooth(clamp((innerHeight*.98-rect.top)/(innerHeight*.9),0,1));
    }
    function paint(){
      raf=0;
      if(document.hidden||!refreshActive())return;
      const jp=journeyProgress();
      const cp=contactProgress();
      const collapse=smooth(clamp((jp-.76)/.14));
      const trace=smooth(clamp((jp-.86)/.11));
      const bridge=Math.max(trace,cp*.82);
      const settle=smooth(clamp((cp-.18)/.72));
      const contactRule=Math.max(settle,trace*.92);
      const titleRule=Math.max(smooth(clamp((cp-.26)/.46)),trace*.36);
      const fade=smooth(clamp((cp-.78)/.2));
      const layerO=clamp((smooth(clamp((jp-.69)/.08)))*(1-fade*.98),0,1);
      const copyRect=copy?.getBoundingClientRect?.()||contact.getBoundingClientRect();
      const formRect=form?.getBoundingClientRect?.()||copyRect;
      const targetY=clamp(copyRect.top+8,46,innerHeight-56);
      const lineY=lerp(innerHeight*.5,targetY,settle);
      const guideH=clamp(Math.max(copyRect.height,formRect.height)*.72,120,innerHeight*.58);
      layer.style.setProperty('--v56-layer-o',String(layerO));
      layer.style.setProperty('--v56-line-s',String(bridge));
      layer.style.setProperty('--v56-red-s',String(clamp(trace*.82+settle*.32)));
      layer.style.setProperty('--v56-line-o',String(clamp(.2+bridge*.8)*(1-fade*.86)));
      layer.style.setProperty('--v56-line-y',`${lineY}px`);
      layer.style.setProperty('--v56-copy-x',`${clamp(copyRect.left,24,innerWidth-24)}px`);
      layer.style.setProperty('--v56-form-x',`${clamp(formRect.left,24,innerWidth-24)}px`);
      layer.style.setProperty('--v56-guide-h',`${guideH}px`);
      layer.style.setProperty('--v56-guide-s',String(settle));
      layer.style.setProperty('--v56-guide-o',String(settle*(1-fade)));
      layer.style.setProperty('--v56-beacon-o',String(clamp(trace+settle*.45)*(1-fade)));
      layer.style.setProperty('--v56-beacon-s',String(lerp(.72,1,settle)));

      frames.forEach((frame,index)=>{
        const [ix,iy,ir]=initial[index];
        const tx=lerp(ix,0,collapse);
        const ty=lerp(iy,0,collapse);
        const rz=lerp(ir,0,collapse)+velocity*(index-2)*.08;
        const sx=lerp(1,.055,collapse);
        const sy=lerp(1,.018,collapse);
        const o=clamp((.35+index*.08)*(1-fade)*(1-cp*.35),0,1);
        frame.style.setProperty('--v56-frame-o',String(o));
        frame.style.transform=`translate3d(calc(-50% + ${tx}px),calc(-50% + ${ty}px),${lerp((index-2)*-22,0,collapse)}px) rotateZ(${rz}deg) scaleX(${sx}) scaleY(${sy})`;
      });

      contact.style.setProperty('--v56-contact-rule',String(contactRule));
      contact.style.setProperty('--v56-title-rule',String(titleRule));
      contact.style.setProperty('--v56-contact-o',String(lerp(.76,1,settle)));
      contact.style.setProperty('--v56-contact-y',`${lerp(30,0,settle)}px`);
      contact.style.setProperty('--v56-copy-shift',`${lerp(-18,0,settle)}px`);
      contact.style.setProperty('--v56-form-shift',`${lerp(22,0,settle)}px`);
      root.dataset.v56Phase=cp>.82?'contact':trace>.55?'draw':collapse>.4?'collapse':'process';
    }
    function schedule(){if(!raf&&!document.hidden&&refreshActive())raf=requestAnimationFrame(paint);}
    function onScroll(){
      const now=performance.now(),dt=Math.max(16,now-lastTime),dy=scrollY-lastY;lastY=scrollY;lastTime=now;velocity=clamp(dy/dt,-2.2,2.2);refreshActive();schedule();
    }
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>visibility.set(entry.target,entry.isIntersecting));
      refreshActive();
      if(active)schedule();else if(raf){cancelAnimationFrame(raf);raf=0;}
    },{rootMargin:'70% 0px 70% 0px',threshold:0});
    observer.observe(journey);observer.observe(contact);
    addEventListener('scroll',onScroll,{passive:true});
    addEventListener('resize',()=>{refreshActive();schedule();},{passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){refreshActive();schedule();}});
    refreshActive();
    if(active){raf=requestAnimationFrame(paint);}else{active=true;paint();active=false;}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>boot(),{once:true});
  else boot();
})();

/* MOVX v58 — perceptual motion audit/tuning.
   This runs after all head styles are loaded, so the injected safeguards can tune older visual layers
   without creating another owner for semantic copy or Process 3D transforms. */
(()=>{
  const root=document.documentElement;
  root.classList.add('movx-v58-runtime');
  root.dataset.movxPerceptual='v58';
  if(!document.getElementById('movx-v58-perceptual-style')){
    const style=document.createElement('style');
    style.id='movx-v58-perceptual-style';
    style.textContent=`
      html.movx-v58-runtime #livingArchive .archive-head h2{color:color-mix(in srgb,var(--fg) 36%,var(--bg))!important}
      html.movx-v58-runtime #livingArchive .archive-head>p{color:color-mix(in srgb,var(--fg) 66%,var(--bg))!important}
      html.movx-v58-runtime .about-section .v45-about-word{-webkit-text-stroke-color:color-mix(in srgb,var(--fg) 10%,transparent)!important;filter:blur(.15px)}
      html.movx-v58-runtime .v45-about-brand{color:color-mix(in srgb,var(--fg) 3.5%,transparent)!important}
      html.movx-v58-runtime .about-section .v45-axis{background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--fg) 30%,transparent) 16%,color-mix(in srgb,var(--editorial-red) 36%,transparent) 50%,color-mix(in srgb,var(--fg) 30%,transparent) 84%,transparent)!important}
      html.movx-v58-runtime .v45-service-marker b{color:color-mix(in srgb,var(--fg) 4.5%,transparent)!important}
      html.movx-v58-runtime .v45-service-marker small{color:color-mix(in srgb,var(--fg) 11%,transparent)!important}
      html.movx-v58-runtime .v45-service-marker i{opacity:.82!important;background:color-mix(in srgb,var(--fg) 38%,transparent)!important}
      html.movx-v58-runtime #services .services-list .service-row{opacity:.68!important;transition:opacity .34s cubic-bezier(.2,.65,.25,1),border-color .34s cubic-bezier(.2,.65,.25,1)!important}
      html.movx-v58-runtime #services .services-list .service-row:is(.v42-reading,.v45-current,:hover,:focus-within){opacity:1!important}
      html.movx-v58-runtime #services .service-row:is(.v42-reading,.v45-current)::after{height:2px!important;opacity:1!important;transform:scaleX(1)!important}
      html.movx-v58-runtime #process .v55-process-canvas{filter:contrast(1.34) saturate(.98)!important}
      html.movx-v58-runtime #process .process-list li.v55-current{box-shadow:inset 3px 0 0 color-mix(in srgb,var(--editorial-red) 86%,transparent),0 16px 54px color-mix(in srgb,var(--fg) 5%,transparent)!important}
      html.movx-v58-runtime #process .v55-process-hud{opacity:.82!important}
      html.movx-v58-runtime #process .v55-process-depth{opacity:.72!important}
      html.movx-v58-runtime #contact .v56-contact-rail{opacity:.72!important}
      html.movx-v58-runtime .v56-handoff-layer{filter:contrast(1.12) saturate(1.08)}
      html.movx-v58-runtime :is(#about,#services,#process,#contact)>.container{position:relative;z-index:7}
      @media(max-width:980px){
        html.movx-v58-runtime #services .services-list .service-row{opacity:1!important}
        html.movx-v58-runtime .v45-css-stage{opacity:.28!important}
        html.movx-v58-runtime #process .v55-process-canvas{filter:none!important}
      }
      @media(prefers-reduced-motion:reduce){html.movx-v58-runtime .v45-css-stage{display:none!important}}
    `;
    document.head.appendChild(style);
  }

  const reduced=new URLSearchParams(location.search).has('static')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced)return;
  const sections=[['about',document.querySelector('#about')],['services',document.querySelector('#services')],['process',document.querySelector('#process')],['contact',document.querySelector('#contact')]].filter(([,el])=>el);
  let raf=0;
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
  function paint(){
    raf=0;let best=['',0];
    sections.forEach(([name,el])=>{
      const r=el.getBoundingClientRect();
      const center=r.top+r.height*.5;
      const focus=clamp(1-Math.abs(center-innerHeight*.5)/(innerHeight*.9),0,1);
      el.style.setProperty('--v58-focus',focus.toFixed(3));
      if(focus>best[1])best=[name,focus];
    });
    root.dataset.v58Chapter=best[1]>.22?best[0]:'';
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(paint)}
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  setTimeout(schedule,120);
})();
