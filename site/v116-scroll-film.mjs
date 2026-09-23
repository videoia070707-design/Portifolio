/* MOVX — Scroll World film engine
   Cloudinary 0923.mp4 is the canonical film. The runtime follows the Scroll World
   pattern: fixed cinematic stage, scroll->time mapping, damped progress, rAF seek
   coalescing, opening linger, decoded-frame crossfade and resilient fallbacks. */
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

  // Scroll World timing: brief opening linger, accelerated crossing, long archive reveal,
  // then a short end hold for a clean handoff to the real DOM archive.
  const mapProgress=p=>p<=.08?0:p<=.42?segment(p,.08,.42,0,.32):p<=.58?segment(p,.42,.58,.32,.60):p<=.90?segment(p,.58,.90,.60,.94):segment(p,.90,1,.94,.995);
  const mobileScale=p=>p<=.42?segment(p,0,.42,.97,1.09):p<=.60?segment(p,.42,.60,1.09,1.68):p<=.90?segment(p,.60,.90,1.68,1.15):segment(p,.90,1,1.15,1.055);

  let duration=0,raf=0,active=false,disposed=false,failed=false,targetTime=0;
  let targetProgress=0,smoothedProgress=0,lastFrame=0,firstRender=true;
  let objectUrl='',loadPromise=null,loadController=null,sourceGeneration=0,localFallbackTried=false,fallbackWatch=0;
  const properties=['--v116-scale','--v116-rx','--v116-ry','--v116-y','--v116-z','--v116-opacity','--v116-handoff','--v116-shade'];
  const isStatic=()=>staticQuery||reduce.matches;
  const runnable=()=>!disposed&&!document.hidden&&active&&section.dataset.v116Mode==='scrub';
  const sourceUrl=()=>video.dataset.srcCloudinary;
  const canPlayH264=()=>!!video.canPlayType('video/mp4; codecs="avc1.42E01E"');

  function revokeObjectUrl(){
    if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl='';}
  }

  function resetMediaClock(){
    duration=0;targetTime=0;
    section.dataset.v116MediaReady='false';
    section.removeAttribute('data-v116-duration');
  }

  function attachSource(src,mode){
    if(disposed||isStatic()||failed||!src)return;
    resetMediaClock();
    revokeObjectUrl();
    if(mode==='cloudinary-blob')objectUrl=src;
    video.src=src;
    video.preload='auto';
    section.dataset.v116Source=mode;
    video.load();
  }

  function attachLocalFallback(){
    if(localFallbackTried||isStatic()||disposed)return false;
    localFallbackTried=true;
    sourceGeneration++;
    loadController?.abort();
    loadController=null;loadPromise=null;
    clearTimeout(fallbackWatch);fallbackWatch=0;
    const supportsVp9=video.canPlayType('video/webm; codecs="vp9"');
    const src=supportsVp9&&video.dataset.srcWebm?video.dataset.srcWebm:video.dataset.src;
    if(!src)return false;
    attachSource(src,'local-fallback');
    return true;
  }

  async function loadCloudinary(){
    if(isStatic()||failed||video.getAttribute('src')||loadPromise)return loadPromise;
    // Playwright's Chromium build and a few constrained browsers do not ship an
    // H.264 decoder. In those environments select the packaged VP9 fallback before
    // loading the remote MP4, avoiding an error-event race during the first seek.
    if(!canPlayH264()){
      attachLocalFallback();
      return;
    }
    const generation=++sourceGeneration;
    const remote=sourceUrl();
    if(!remote)return;
    section.dataset.v116Source='cloudinary-loading';
    loadController=new AbortController();
    const timeout=setTimeout(()=>loadController?.abort(),4500);
    loadPromise=(async()=>{
      try{
        const response=await fetch(remote,{mode:'cors',cache:'force-cache',signal:loadController.signal});
        if(!response.ok)throw new Error(`film fetch ${response.status}`);
        const blob=await response.blob();
        if(!blob.size)throw new Error('empty film blob');
        if(generation!==sourceGeneration||disposed||isStatic())return;
        const url=URL.createObjectURL(blob);
        attachSource(url,'cloudinary-blob');
      }catch(error){
        if(generation!==sourceGeneration||disposed||isStatic())return;
        // Direct CDN playback keeps the canonical source even when CORS/Blob acquisition
        // is unavailable. Local encodes are only a final resilience fallback.
        attachSource(remote,'cloudinary-direct');
      }finally{
        clearTimeout(timeout);
        loadController=null;
        loadPromise=null;
      }
    })();
    return loadPromise;
  }

  function releaseMedia(){
    sourceGeneration++;
    loadController?.abort();loadController=null;loadPromise=null;
    clearTimeout(fallbackWatch);fallbackWatch=0;
    video.pause();resetMediaClock();localFallbackTried=false;
    section.dataset.v116Source='idle';
    if(video.getAttribute('src')){video.removeAttribute('src');video.load();}
    revokeObjectUrl();
  }

  function setMode(){
    section.dataset.v116Mode=isStatic()?'static':failed?'poster':'scrub';
    section.dataset.v116Viewport=mobile.matches?'mobile':'desktop';
    if(isStatic()||failed){
      cancelAnimationFrame(raf);raf=0;
      properties.forEach(name=>section.style.removeProperty(name));
      if(isStatic())releaseMedia();
    }else if(active)loadCloudinary();
    updateTarget();
  }

  function requestSeek(){
    if(!runnable()||duration<=0||video.readyState<1||video.seeking)return;
    if(Math.abs(video.currentTime-targetTime)>1/50){
      try{video.currentTime=targetTime;}catch{/* metadata/frame not ready yet */}
    }
  }

  function markFrameReady(){
    if(video.readyState<2)return;
    section.dataset.v116MediaReady='true';
  }

  function computeTarget(){
    targetProgress=clamp(-section.getBoundingClientRect().top/Math.max(1,section.offsetHeight-innerHeight));
  }

  function updateTarget(){
    computeTarget();
    if(!raf&&!disposed&&!document.hidden)raf=requestAnimationFrame(render);
  }

  function render(now=performance.now()){
    raf=0;
    if(!runnable())return;
    computeTarget();

    const dt=lastFrame?Math.min(64,now-lastFrame):16.7;
    lastFrame=now;
    if(firstRender){smoothedProgress=targetProgress;firstRender=false;}
    const damping=1-Math.exp(-dt/78);
    smoothedProgress+=(targetProgress-smoothedProgress)*damping;
    const p=clamp(smoothedProgress);

    if(duration>0){
      const frame=1/Math.max(24,Number(video.dataset.fps)||30);
      const end=Math.max(0,duration-frame);
      // Relative opening skip scales to short/long source files and avoids black leader frames.
      const start=Math.min(Math.min(.6,duration*.065),end);
      targetTime=mix(start,end,mapProgress(p));
      section.dataset.v116Target=targetTime.toFixed(3);
      requestSeek();
    }

    const exit=smooth((p-.90)/.10);
    const settle=smooth(p/(mobile.matches?.42:.60));
    const scale=mobile.matches?mobileScale(p):mix(.92,1.024,settle);
    const z=mobile.matches?mix(-78,0,settle):mix(-145,0,settle);
    section.style.setProperty('--v116-scale',scale.toFixed(4));
    section.style.setProperty('--v116-rx',`${mix(mobile.matches?1.05:2.15,0,settle).toFixed(3)}deg`);
    section.style.setProperty('--v116-ry',`${mix(mobile.matches?-1.8:-1.35,0,settle).toFixed(3)}deg`);
    section.style.setProperty('--v116-y',`${mix(mobile.matches?1.15:2.25,0,settle).toFixed(3)}vh`);
    section.style.setProperty('--v116-z',`${z.toFixed(2)}px`);
    section.style.setProperty('--v116-opacity',mix(1,0,exit).toFixed(4));
    section.style.setProperty('--v116-handoff',exit.toFixed(4));
    section.style.setProperty('--v116-shade',mix(.24,.075,smooth((p-.42)/.48)).toFixed(4));
    section.dataset.v116Progress=p.toFixed(4);
    section.dataset.v116Phase=p<.42?'signal':p<.60?'crossing':'archive';

    const unsettled=Math.abs(targetProgress-smoothedProgress)>.00045;
    if(unsettled||video.seeking)raf=requestAnimationFrame(render);
  }

  const observer=new IntersectionObserver(entries=>{
    active=entries.some(entry=>entry.isIntersecting);
    if(active){
      firstRender=true;lastFrame=0;computeTarget();smoothedProgress=targetProgress;
      loadCloudinary();updateTarget();
    }else{
      cancelAnimationFrame(raf);raf=0;lastFrame=0;
    }
  },{rootMargin:'125% 0px'});
  observer.observe(section);

  video.muted=true;video.playsInline=true;video.controls=false;video.disableRemotePlayback=true;
  listen(video,'loadedmetadata',()=>{
    duration=Number.isFinite(video.duration)?video.duration:0;
    section.dataset.v116Duration=duration.toFixed(3);
    if(section.dataset.v116Source==='local-fallback'){
      clearTimeout(fallbackWatch);fallbackWatch=0;
    }
    video.pause();updateTarget();
  });
  listen(video,'loadeddata',()=>{markFrameReady();updateTarget()});
  listen(video,'canplay',()=>{markFrameReady();updateTarget()});
  listen(video,'seeked',()=>{
    markFrameReady();
    if('requestVideoFrameCallback' in video)video.requestVideoFrameCallback(markFrameReady);
    requestSeek();updateTarget();
  });
  listen(video,'play',()=>video.pause());
  listen(video,'error',()=>{
    if(!video.getAttribute('src'))return;
    const mode=section.dataset.v116Source;
    if(mode==='cloudinary-loading'||mode==='cloudinary-blob'||mode==='cloudinary-direct'){
      if(attachLocalFallback())return;
    }
    if(section.dataset.v116Source==='local-fallback'){
      // A source swap can surface a stale error from the previous MP4. Give VP9/H.264
      // fallback metadata a short grace period before declaring the entire chapter dead.
      clearTimeout(fallbackWatch);
      fallbackWatch=setTimeout(()=>{
        fallbackWatch=0;
        if(disposed||isStatic()||section.dataset.v116Source!=='local-fallback')return;
        if(video.readyState>=1&&Number.isFinite(video.duration)&&video.duration>0){updateTarget();return;}
        failed=true;setMode();
      },1200);
      return;
    }
    failed=true;setMode();
  });
  listen(window,'scroll',updateTarget,{passive:true});
  listen(window,'resize',()=>{setMode();updateTarget()},{passive:true});
  listen(reduce,'change',setMode);listen(mobile,'change',setMode);
  listen(document,'visibilitychange',()=>{
    cancelAnimationFrame(raf);raf=0;lastFrame=0;video.pause();
    if(!document.hidden)updateTarget();
  });
  listen(window,'pageshow',updateTarget);
  listen(window,'pagehide',event=>{
    cancelAnimationFrame(raf);raf=0;video.pause();
    if(!event.persisted){
      disposed=true;sourceGeneration++;loadController?.abort();clearTimeout(fallbackWatch);
      observer.disconnect();resizeObserver.disconnect();events.abort();revokeObjectUrl();
    }
  });

  const resizeObserver=new ResizeObserver(updateTarget);resizeObserver.observe(section);
  document.fonts?.ready.then(updateTarget);
  setMode();
  document.documentElement.dataset.movxIntro='scroll-world-cloudinary-0923';
}
