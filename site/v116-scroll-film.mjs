/* MOVX local preview — one scroll owner, coalesced video seeking.
   The original v116 chapter timing is preserved. Media is bundled locally. */
const section=document.querySelector('[data-movx-v116="film"]');
if(section){
  const video=section.querySelector('video');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=matchMedia('(max-width:767px)');
  const staticQuery=new URLSearchParams(location.search).has('static');
  const events=new AbortController();
  const listen=(target,name,fn,options={})=>target.addEventListener(name,fn,{...options,signal:events.signal});
  const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
  const mix=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
  const segment=(p,a,b,x,y)=>mix(x,y,smooth((p-a)/(b-a)));
  const mapProgress=p=>p<=.38?segment(p,0,.38,0,.28):p<=.58?segment(p,.38,.58,.28,.56):p<=.90?segment(p,.58,.90,.56,.94):segment(p,.90,1,.94,.995);
  const mobileScale=p=>p<=.38?segment(p,0,.38,.98,1.08):p<=.58?segment(p,.38,.58,1.08,1.72):p<=.90?segment(p,.58,.90,1.72,1.16):segment(p,.90,1,1.16,1.06);
  let duration=0,raf=0,active=false,disposed=false,failed=false,targetTime=0;
  // Skip the black opening frames while retaining the full source in the package.
  const startTime=.6;
  const properties=['--v116-scale','--v116-rx','--v116-ry','--v116-y','--v116-opacity','--v116-handoff','--v116-shade'];
  const isStatic=()=>staticQuery||reduce.matches;
  const runnable=()=>!disposed&&!document.hidden&&active&&section.dataset.v116Mode==='scrub';

  function ensureMedia(){
    if(isStatic()||failed||video.getAttribute('src'))return;
    video.src=video.dataset.src;
    video.preload='auto';
    video.load();
  }
  function releaseMedia(){
    video.pause();duration=0;
    section.dataset.v116MediaReady='false';
    if(video.getAttribute('src')){video.removeAttribute('src');video.load();}
  }
  function setMode(){
    section.dataset.v116Mode=isStatic()?'static':failed?'poster':'scrub';
    section.dataset.v116Viewport=mobile.matches?'mobile':'desktop';
    if(isStatic()||failed){
      cancelAnimationFrame(raf);raf=0;
      properties.forEach(name=>section.style.removeProperty(name));
      if(isStatic())releaseMedia();
    }else if(active)ensureMedia();
    schedule();
  }
  function requestSeek(){
    if(!runnable()||duration<=0||video.readyState<1||video.seeking)return;
    // One in-flight seek. 'seeked' consumes the latest scroll target, not stale events.
    if(Math.abs(video.currentTime-targetTime)>1/60){
      try{video.currentTime=targetTime;}catch{ /* wait for loadeddata/canplay */ }
    }
  }
  function render(){
    raf=0;
    if(!runnable())return;
    const p=clamp(-section.getBoundingClientRect().top/Math.max(1,section.offsetHeight-innerHeight));
    if(duration>0){
      const end=Math.max(0,duration-1/30);
      const start=Math.min(startTime,end);
      targetTime=mix(start,end,mapProgress(p));
      section.dataset.v116Target=targetTime.toFixed(3);
      requestSeek();
    }
    const exit=smooth((p-.90)/.10);
    const settle=smooth(p/(mobile.matches?.38:.58));
    section.style.setProperty('--v116-scale',(mobile.matches?mobileScale(p):mix(.935,1.018,settle)).toFixed(4));
    section.style.setProperty('--v116-rx',`${mix(mobile.matches?.55:1.1,0,settle).toFixed(3)}deg`);
    section.style.setProperty('--v116-ry',`${mix(mobile.matches?-1.15:-.65,0,settle).toFixed(3)}deg`);
    section.style.setProperty('--v116-y',`${mix(mobile.matches?.8:1.4,0,settle).toFixed(3)}vh`);
    section.style.setProperty('--v116-opacity',mix(1,0,exit).toFixed(4));
    section.style.setProperty('--v116-handoff',exit.toFixed(4));
    section.style.setProperty('--v116-shade',mix(.22,.08,smooth((p-.45)/.45)).toFixed(4));
    section.dataset.v116Progress=p.toFixed(4);
    section.dataset.v116Phase=p<.38?'signal':p<.58?'crossing':'archive';
  }
  function schedule(){if(!raf&&!disposed&&!document.hidden)raf=requestAnimationFrame(render)}
  const observer=new IntersectionObserver(entries=>{
    active=entries.some(entry=>entry.isIntersecting);
    if(active){ensureMedia();schedule();}
    else{cancelAnimationFrame(raf);raf=0;}
  },{rootMargin:'75% 0px'});
  observer.observe(section);
  video.muted=true;video.playsInline=true;video.controls=false;video.disableRemotePlayback=true;
  listen(video,'loadedmetadata',()=>{duration=Number.isFinite(video.duration)?video.duration:0;video.pause();schedule()});
  listen(video,'loadeddata',schedule);
  listen(video,'canplay',schedule);
  listen(video,'seeked',()=>{
    if(video.readyState>=2&&video.currentTime>=Math.min(startTime,duration-1/30))section.dataset.v116MediaReady='true';
    requestSeek();
  });
  listen(video,'play',()=>video.pause());
  listen(video,'error',()=>{if(video.getAttribute('src')){failed=true;setMode()}});
  listen(window,'scroll',schedule,{passive:true});
  listen(window,'resize',()=>{setMode();schedule()},{passive:true});
  listen(reduce,'change',setMode);listen(mobile,'change',setMode);
  listen(document,'visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;video.pause();if(!document.hidden)schedule()});
  listen(window,'pageshow',schedule);
  listen(window,'pagehide',event=>{
    cancelAnimationFrame(raf);raf=0;video.pause();
    if(!event.persisted){disposed=true;observer.disconnect();resizeObserver.disconnect();events.abort();}
  });
  const resizeObserver=new ResizeObserver(schedule);resizeObserver.observe(section);
  document.fonts?.ready.then(schedule);
  setMode();
  document.documentElement.dataset.movxIntro='v116-local-preview';
}
