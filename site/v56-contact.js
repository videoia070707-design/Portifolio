/* MOVX v56 — Process → Contact drawn handoff runtime
   Collapses the last Process frames into a single trace and uses that trace to draw
   the Contact composition. v55/v60 stays the only owner of Process 3D transforms. */
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
    if(!process||!journey||!contact){if(attempt<120)setTimeout(()=>boot(attempt+1),50);return;}
    if(root.dataset.v56Ready==='1')return;
    root.dataset.v56Ready='1';

    contact.classList.add('v56-contact-drawn');
    if(!contact.querySelector('.v56-contact-rail')){
      const rail=document.createElement('div');rail.className='v56-contact-rail';rail.setAttribute('aria-hidden','true');contact.appendChild(rail);
    }
    if(!desktop||reduced){contact.style.setProperty('--v56-contact-rule','1');contact.style.setProperty('--v56-title-rule','1');return;}

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

    function nearViewport(el){const rect=el.getBoundingClientRect();return rect.bottom>-innerHeight*.75&&rect.top<innerHeight*1.75;}
    function refreshActive(){active=[...visibility.values()].some(Boolean)||nearViewport(journey)||nearViewport(contact);return active;}
    function journeyProgress(){const rect=journey.getBoundingClientRect();const travel=Math.max(1,journey.offsetHeight-innerHeight);return clamp(-rect.top/travel,0,1);}
    function contactProgress(){const rect=contact.getBoundingClientRect();return smooth(clamp((innerHeight*.98-rect.top)/(innerHeight*.9),0,1));}
    function paint(){
      raf=0;if(document.hidden||!refreshActive())return;
      const jp=journeyProgress();const cp=contactProgress();
      const collapse=smooth(clamp((jp-.76)/.14));const trace=smooth(clamp((jp-.86)/.11));
      const bridge=Math.max(trace,cp*.82);const settle=smooth(clamp((cp-.18)/.72));
      const contactRule=Math.max(settle,trace*.92);const titleRule=Math.max(smooth(clamp((cp-.26)/.46)),trace*.36);
      const fade=smooth(clamp((cp-.78)/.2));const layerO=clamp((smooth(clamp((jp-.69)/.08)))*(1-fade*.98),0,1);
      const copyRect=copy?.getBoundingClientRect?.()||contact.getBoundingClientRect();
      const formRect=form?.getBoundingClientRect?.()||copyRect;
      const targetY=clamp(copyRect.top+8,46,innerHeight-56);const lineY=lerp(innerHeight*.5,targetY,settle);
      const guideH=clamp(Math.max(copyRect.height,formRect.height)*.72,120,innerHeight*.58);
      layer.style.setProperty('--v56-layer-o',String(layerO));layer.style.setProperty('--v56-line-s',String(bridge));
      layer.style.setProperty('--v56-red-s',String(clamp(trace*.82+settle*.32)));layer.style.setProperty('--v56-line-o',String(clamp(.2+bridge*.8)*(1-fade*.86)));
      layer.style.setProperty('--v56-line-y',`${lineY}px`);layer.style.setProperty('--v56-copy-x',`${clamp(copyRect.left,24,innerWidth-24)}px`);
      layer.style.setProperty('--v56-form-x',`${clamp(formRect.left,24,innerWidth-24)}px`);layer.style.setProperty('--v56-guide-h',`${guideH}px`);
      layer.style.setProperty('--v56-guide-s',String(settle));layer.style.setProperty('--v56-guide-o',String(settle*(1-fade)));
      layer.style.setProperty('--v56-beacon-o',String(clamp(trace+settle*.45)*(1-fade)));layer.style.setProperty('--v56-beacon-s',String(lerp(.72,1,settle)));

      frames.forEach((frame,index)=>{
        const [ix,iy,ir]=initial[index];const tx=lerp(ix,0,collapse);const ty=lerp(iy,0,collapse);
        const rz=lerp(ir,0,collapse)+velocity*(index-2)*.08;const sx=lerp(1,.055,collapse);const sy=lerp(1,.018,collapse);
        const o=clamp((.35+index*.08)*(1-fade)*(1-cp*.35),0,1);
        frame.style.setProperty('--v56-frame-o',String(o));
        frame.style.transform=`translate3d(calc(-50% + ${tx}px),calc(-50% + ${ty}px),${lerp((index-2)*-22,0,collapse)}px) rotateZ(${rz}deg) scaleX(${sx}) scaleY(${sy})`;
      });

      contact.style.setProperty('--v56-contact-rule',String(contactRule));contact.style.setProperty('--v56-title-rule',String(titleRule));
      contact.style.setProperty('--v56-contact-o',String(lerp(.76,1,settle)));contact.style.setProperty('--v56-contact-y',`${lerp(30,0,settle)}px`);
      contact.style.setProperty('--v56-copy-shift',`${lerp(-18,0,settle)}px`);contact.style.setProperty('--v56-form-shift',`${lerp(22,0,settle)}px`);
      root.dataset.v56Phase=cp>.82?'contact':trace>.55?'draw':collapse>.4?'collapse':'process';
    }
    function schedule(){if(!raf&&!document.hidden&&refreshActive())raf=requestAnimationFrame(paint);}
    function onScroll(){const now=performance.now(),dt=Math.max(16,now-lastTime),dy=scrollY-lastY;lastY=scrollY;lastTime=now;velocity=clamp(dy/dt,-2.2,2.2);refreshActive();schedule();}
    const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>visibility.set(entry.target,entry.isIntersecting));refreshActive();if(active)schedule();else if(raf){cancelAnimationFrame(raf);raf=0;}},{rootMargin:'70% 0px 70% 0px',threshold:0});
    observer.observe(journey);observer.observe(contact);
    addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',()=>{refreshActive();schedule();},{passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){refreshActive();schedule();}});
    refreshActive();if(active){raf=requestAnimationFrame(paint);}else{active=true;paint();active=false;}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>boot(),{once:true});else boot();
})();

/* MOVX v60 — perceptual tuning aligned with the editorial system.
   No semantic text transforms, no card shadows, no competing Process owner. */
(()=>{
  const root=document.documentElement;
  root.classList.add('movx-v58-runtime','movx-v60-perceptual');
  root.dataset.movxPerceptual='v60';
  const previous=document.getElementById('movx-v58-perceptual-style');if(previous)previous.remove();
  const style=document.createElement('style');
  style.id='movx-v60-perceptual-style';
  style.textContent=`
    html.movx-v60-perceptual #livingArchive .archive-head h2{color:color-mix(in srgb,var(--fg) 36%,var(--bg))!important}
    html.movx-v60-perceptual #livingArchive .archive-head>p{color:color-mix(in srgb,var(--fg) 66%,var(--bg))!important}
    html.movx-v60-perceptual .about-section .v45-about-word{-webkit-text-stroke-color:color-mix(in srgb,var(--fg) 9%,transparent)!important;filter:blur(.12px)}
    html.movx-v60-perceptual .v45-about-brand{color:color-mix(in srgb,var(--fg) 3%,transparent)!important}
    html.movx-v60-perceptual .about-section .v45-axis{background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--fg) 18%,transparent) 18%,color-mix(in srgb,var(--editorial-red) 20%,transparent) 50%,color-mix(in srgb,var(--fg) 18%,transparent) 82%,transparent)!important}
    html.movx-v60-perceptual .v45-service-marker b{color:color-mix(in srgb,var(--fg) 4%,transparent)!important}
    html.movx-v60-perceptual .v45-service-marker small{color:color-mix(in srgb,var(--fg) 9%,transparent)!important}
    html.movx-v60-perceptual .v45-service-marker i{width:min(20vw,260px)!important;opacity:.28!important;background:color-mix(in srgb,var(--fg) 14%,transparent)!important}
    html.movx-v60-perceptual #services .services-list .service-row{opacity:.78!important;transition:opacity .72s cubic-bezier(.16,1,.3,1),border-color .72s cubic-bezier(.16,1,.3,1)!important}
    html.movx-v60-perceptual #services .services-list .service-row:is(.v42-reading,.v45-current,:hover,:focus-within){opacity:1!important}
    html.movx-v60-perceptual #services .service-row:is(.v42-reading,.v45-current)::after{height:1px!important;opacity:.72!important;transform:scaleX(1)!important}
    html.movx-v60-perceptual #process .v55-process-canvas{filter:contrast(1.01) saturate(.62)!important}
    html.movx-v60-perceptual #process .process-list li.v55-current{background:transparent!important;border-color:transparent!important;box-shadow:none!important}
    html.movx-v60-perceptual #process .v55-process-hud,html.movx-v60-perceptual #process .v55-process-depth{display:none!important}
    html.movx-v60-perceptual #contact .v56-contact-rail{opacity:.5!important}
    html.movx-v60-perceptual .v56-handoff-layer{filter:contrast(1.04) saturate(.88)}
    html.movx-v60-perceptual :is(#about,#services,#process,#contact)>.container{position:relative;z-index:7}
    @media(max-width:980px){
      html.movx-v60-perceptual #services .services-list .service-row{opacity:1!important}
      html.movx-v60-perceptual .v45-css-stage{opacity:.18!important}
      html.movx-v60-perceptual #process .v55-process-canvas{filter:none!important}
    }
    @media(prefers-reduced-motion:reduce){html.movx-v60-perceptual .v45-css-stage{display:none!important}}
  `;
  document.head.appendChild(style);

  const reduced=new URLSearchParams(location.search).has('static')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced)return;
  const sections=[['about',document.querySelector('#about')],['services',document.querySelector('#services')],['process',document.querySelector('#process')],['contact',document.querySelector('#contact')]].filter(([,el])=>el);
  let raf=0;const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
  function paint(){
    raf=0;let best=['',0];
    sections.forEach(([name,el])=>{const r=el.getBoundingClientRect();const center=r.top+r.height*.5;const focus=clamp(1-Math.abs(center-innerHeight*.5)/(innerHeight*.9),0,1);el.style.setProperty('--v58-focus',focus.toFixed(3));if(focus>best[1])best=[name,focus];});
    root.dataset.v58Chapter=best[1]>.22?best[0]:'';
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(paint)}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});setTimeout(schedule,120);
})();

/* MOVX v73 — editorial case reader
   Removes the remaining boxed controls, softens case-to-case handoff and makes the
   fixed case viewer behave like an accessible reading surface rather than a modal UI. */
(()=>{
  'use strict';
  const root=document.documentElement;
  const viewer=document.getElementById('caseViewer');
  if(!viewer)return;
  root.classList.add('movx-v73');
  root.dataset.movxRelease='v73-case-reader';
  const reduced=new URLSearchParams(location.search).has('static')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const top=viewer.querySelector('.case-top');
  const topLabel=document.getElementById('caseTopLabel');
  const prev=document.getElementById('casePrev');
  const next=document.getElementById('caseNext');
  const close=document.getElementById('caseClose');
  const hero=document.getElementById('caseHero');
  const info=document.getElementById('caseInfo');
  const slides=document.getElementById('caseSlides');
  let returnTarget=null;
  let switchTimer=0;

  viewer.setAttribute('role','dialog');
  viewer.setAttribute('aria-modal','true');
  viewer.setAttribute('aria-label','Estudo de caso MOVX');
  viewer.tabIndex=-1;

  if(!document.getElementById('movx-v73-case-reader-style')){
    const style=document.createElement('style');
    style.id='movx-v73-case-reader-style';
    style.textContent=`
      html.movx-v73 .case-top{
        height:66px!important;background:color-mix(in srgb,var(--bg) 96%,transparent)!important;
        border-bottom:1px solid color-mix(in srgb,var(--fg) 12%,transparent)!important;
        backdrop-filter:blur(18px)!important;-webkit-backdrop-filter:blur(18px)!important
      }
      html.movx-v73 .case-top-row{height:64px!important;gap:24px!important}
      html.movx-v73 #caseTopLabel{
        font:650 clamp(12px,1vw,15px)/1.1 var(--sans,Arial,sans-serif)!important;
        letter-spacing:-.02em!important;text-transform:none!important;color:var(--fg)!important
      }
      html.movx-v73 .case-top-actions{gap:clamp(14px,1.8vw,28px)!important}
      html.movx-v73 :is(.case-nav-button,.case-close){
        position:relative!important;border:0!important;background:transparent!important;color:var(--fg)!important;
        padding:9px 0!important;border-radius:0!important;box-shadow:none!important;transform:none!important;
        opacity:.46!important;font:700 8px/1 var(--mono,ui-monospace,monospace)!important;
        letter-spacing:.14em!important;transition:opacity .45s cubic-bezier(.16,1,.3,1)!important
      }
      html.movx-v73 :is(.case-nav-button,.case-close)::after{
        content:"";position:absolute;left:0;right:0;bottom:4px;height:1px;background:currentColor;
        transform:scaleX(0);transform-origin:left;transition:transform .62s cubic-bezier(.16,1,.3,1)
      }
      html.movx-v73 :is(.case-nav-button,.case-close):is(:hover,:focus-visible){opacity:1!important;background:transparent!important;color:var(--fg)!important;transform:none!important}
      html.movx-v73 :is(.case-nav-button,.case-close):is(:hover,:focus-visible)::after{transform:scaleX(1)}
      html.movx-v73 .case-close{margin-left:clamp(5px,.6vw,10px)!important;opacity:.72!important}
      html.movx-v73 .case-progress{height:1px!important;background:color-mix(in srgb,var(--fg) 8%,transparent)!important}
      html.movx-v73 .case-progress span{background:var(--editorial-red)!important;transform-origin:left center!important}
      html.movx-v73 .case-viewer{scrollbar-width:thin;scrollbar-color:color-mix(in srgb,var(--fg) 24%,transparent) transparent}
      html.movx-v73 .case-viewer::-webkit-scrollbar{width:7px}
      html.movx-v73 .case-viewer::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--fg) 22%,transparent)}
      html.movx-v73 .case-hero,html.movx-v73 .case-body{transition:opacity .36s ease,transform .7s cubic-bezier(.16,1,.3,1),filter .36s ease}
      html.movx-v73 .case-viewer.v73-switching .case-hero,
      html.movx-v73 .case-viewer.v73-switching .case-body{opacity:.32;filter:blur(2px);transform:translate3d(0,7px,0)}
      html.movx-v73 .case-study-block{border-top-color:color-mix(in srgb,var(--fg) 13%,transparent)!important}
      html.movx-v73 .v33-case-chapter{scroll-margin-top:96px}
      html.movx-v73 .case-slide-frame{border-color:color-mix(in srgb,var(--fg) 12%,transparent)!important;background:color-mix(in srgb,var(--panel) 96%,var(--bg))!important}
      html.movx-v73 .case-slide-frame img{transition:transform 1.1s cubic-bezier(.16,1,.3,1)!important}
      html.movx-v73 .case-slide-frame:hover img{transform:scale(1.006)!important}
      html.movx-v73 .case-end{
        margin-top:clamp(42px,6vw,82px)!important;padding-top:clamp(26px,3vw,40px)!important;
        border-top-color:color-mix(in srgb,var(--fg) 18%,transparent)!important
      }
      html.movx-v73 .case-end strong{max-width:9ch!important;font-size:clamp(42px,5.7vw,82px)!important;line-height:.86!important}
      html.movx-v73 .case-end button{
        border:0!important;border-bottom:1px solid currentColor!important;background:transparent!important;
        padding:0 0 5px!important;transition:opacity .4s ease!important
      }
      html.movx-v73 .case-end button:hover{background:transparent!important;color:var(--fg)!important;opacity:.58}
      html.movx-v73 .v33-next-preview{overflow:hidden!important}
      html.movx-v73 .v33-next-preview img{transition:transform 1.15s cubic-bezier(.16,1,.3,1),filter .8s ease!important}
      html.movx-v73 .case-end:hover .v33-next-preview img{transform:scale(1.012)!important;filter:saturate(.94)}
      @media(max-width:780px){
        html.movx-v73 .case-top{height:58px!important}
        html.movx-v73 .case-top-row{height:56px!important;padding-left:18px!important;padding-right:18px!important}
        html.movx-v73 #caseTopLabel{max-width:68vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px!important}
        html.movx-v73 .case-close{font-size:8px!important;margin-left:0!important}
        html.movx-v73 .case-body{padding-bottom:84px!important}
        html.movx-v73 .case-end strong{font-size:clamp(38px,12vw,62px)!important;max-width:10ch!important}
      }
      @media(prefers-reduced-motion:reduce){
        html.movx-v73 .case-hero,html.movx-v73 .case-body,html.movx-v73 .v33-next-preview img{transition:none!important}
        html.movx-v73 .case-viewer.v73-switching .case-hero,html.movx-v73 .case-viewer.v73-switching .case-body{opacity:1!important;filter:none!important;transform:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  const openerFromEvent=target=>target?.closest?.('[data-open-project],.selected-index-row,.archive-card,.project-cover,.loop-card')||null;
  document.addEventListener('pointerdown',event=>{
    const opener=openerFromEvent(event.target);
    if(opener&&!viewer.contains(opener))returnTarget=opener;
  },true);
  document.addEventListener('keydown',event=>{
    if((event.key==='Enter'||event.key===' ')&&document.activeElement){
      const opener=openerFromEvent(document.activeElement);
      if(opener&&!viewer.contains(opener))returnTarget=opener;
    }
  },true);

  const startSwitch=()=>{
    if(reduced)return;
    clearTimeout(switchTimer);
    viewer.classList.add('v73-switching');
    switchTimer=setTimeout(()=>viewer.classList.remove('v73-switching'),360);
  };
  prev?.addEventListener('click',startSwitch,true);
  next?.addEventListener('click',startSwitch,true);
  slides?.addEventListener('click',event=>{if(event.target.closest('[data-open-project]'))startSwitch();},true);

  const contentObserver=new MutationObserver(()=>{
    if(!viewer.classList.contains('open'))return;
    requestAnimationFrame(()=>{
      viewer.classList.remove('v73-switching');
      hero?.querySelector('img')?.decode?.().catch(()=>{});
    });
  });
  if(hero)contentObserver.observe(hero,{childList:true});

  let wasOpen=viewer.classList.contains('open');
  const stateObserver=new MutationObserver(()=>{
    const isOpen=viewer.classList.contains('open');
    if(isOpen&&!wasOpen){
      viewer.dataset.v73State='open';
      requestAnimationFrame(()=>close?.focus({preventScroll:true}));
    }
    if(!isOpen&&wasOpen){
      viewer.dataset.v73State='closed';
      const target=returnTarget;
      returnTarget=null;
      if(target&&document.contains(target))setTimeout(()=>target.focus?.({preventScroll:true}),0);
    }
    wasOpen=isOpen;
  });
  stateObserver.observe(viewer,{attributes:true,attributeFilter:['class']});

  viewer.addEventListener('keydown',event=>{
    if(event.key!=='Tab'||!viewer.classList.contains('open'))return;
    const focusables=[...viewer.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>el.offsetParent!==null);
    if(focusables.length<2)return;
    const first=focusables[0],last=focusables[focusables.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });

  top?.setAttribute('data-v73-navigation','editorial');
  if(topLabel)topLabel.setAttribute('aria-live','polite');
})();
