/* MOVX v118 performance pass: deferred Blob scrub.
   No movie is requested during first paint. After real user scroll, the optimized
   file is fetched once into a Blob so static hosting can seek reliably. */
const root=document.querySelector('[data-movx-scroll-world="v117"]');
if(root){
  const video=root.querySelector('video');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=matchMedia('(max-width: 767px)');
  const mp4=video.canPlayType('video/mp4; codecs="avc1.640028"')!=='';
  const urls=mp4?
    {desktop:'media/movx-scroll-world-0923.mp4',mobile:'media/movx-scroll-world-0923-mobile.mp4'}:
    {desktop:'media/movx-scroll-world-0923.webm',mobile:'media/movx-scroll-world-0923-mobile.webm'};
  const clamp=x=>Math.max(0,Math.min(1,x));
  const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
  const engagementThreshold=()=>Math.max(48,innerHeight*.08);
  let active=false,failed=false,disposed=false,raf=0,duration=0,target=0,blobURL='',controller=null,loading=false;
  let viewportWidth=innerWidth,mediaVariant='';
  let userEngaged=scrollY>engagementThreshold();

  function progress(){
    const length=Math.max(1,root.offsetHeight-innerHeight);
    return clamp(-root.getBoundingClientRect().top/length);
  }
  function schedule(){if(!raf&&!disposed&&!document.hidden)raf=requestAnimationFrame(render)}
  function seek(){
    if(!active||failed||reduced.matches||duration<=0||video.readyState<1||video.seeking)return;
    if(Math.abs(video.currentTime-target)>1/30){try{video.currentTime=target}catch{}}
  }
  function render(){
    raf=0;
    if(disposed||failed||reduced.matches)return;
    const p=progress();
    const enter=ease(p/.31);
    const exit=ease((p-.92)/.08);
    const scale=.88+.12*enter+.045*ease((p-.65)/.30);
    root.style.setProperty('--world-scale',scale.toFixed(4));
    root.style.setProperty('--world-turn',`${(-3*(1-enter)).toFixed(3)}deg`);
    root.style.setProperty('--world-lift',`${(2*(1-enter)).toFixed(3)}vh`);
    root.style.setProperty('--world-exit',(1-exit).toFixed(4));
    root.style.setProperty('--world-progress',`${(p*100).toFixed(2)}%`);
    root.dataset.worldProgress=p.toFixed(4);
    if(duration){
      target=Math.min(duration-1/30,Math.max(0,p*duration));
      root.dataset.worldTarget=target.toFixed(3);
      seek();
    }
  }
  function clearMedia(){
    controller?.abort();controller=null;
    video.pause();video.removeAttribute('src');video.load();
    if(blobURL)URL.revokeObjectURL(blobURL);
    blobURL='';duration=0;loading=false;mediaVariant='';
    root.dataset.frameReady='false';
  }
  async function load(){
    if(disposed||failed||reduced.matches||!userEngaged)return;
    const variant=mobile.matches?'mobile':'desktop';
    if(mediaVariant===variant&&(loading||blobURL))return;
    clearMedia();
    mediaVariant=variant;loading=true;
    controller=new AbortController();
    root.dataset.mode='loading';
    try{
      const response=await fetch(urls[variant],{signal:controller.signal,cache:'force-cache'});
      if(!response.ok)throw new Error(`media status ${response.status}`);
      const data=await response.blob();
      if(disposed||reduced.matches||mediaVariant!==variant)return;
      blobURL=URL.createObjectURL(data);
      video.preload='auto';video.src=blobURL;video.load();
    }catch(error){
      if(error.name==='AbortError')return;
      failed=true;loading=false;root.dataset.mode='fallback';root.dataset.frameReady='false';
      console.warn('MOVX scroll film: poster fallback',error);
    }
  }
  function handleScroll(){
    if(!userEngaged&&scrollY>engagementThreshold()){
      userEngaged=true;
      root.dataset.userEngaged='true';
      if(active)load();
    }
    schedule();
  }
  async function prime(){
    if(!active||!userEngaged||reduced.matches||!mobile.matches||!blobURL)return;
    try{await video.play();video.pause();schedule()}catch{}
  }
  const observer=new IntersectionObserver(entries=>{
    active=entries.some(entry=>entry.isIntersecting);
    if(active){if(userEngaged)load();schedule()}else{cancelAnimationFrame(raf);raf=0;video.pause()}
  },{rootMargin:'0px',threshold:0});
  observer.observe(root);
  root.dataset.userEngaged=userEngaged?'true':'false';
  video.muted=true;video.playsInline=true;video.disableRemotePlayback=true;
  video.addEventListener('loadedmetadata',()=>{
    loading=false;
    duration=Number.isFinite(video.duration)?video.duration:0;
    root.dataset.mode=duration?'scrub':'fallback';
    schedule();
  });
  video.addEventListener('loadeddata',()=>{
    if(video.readyState>=2)root.dataset.frameReady='true';
    schedule();
  });
  video.addEventListener('seeked',()=>{
    if(video.readyState>=2)root.dataset.frameReady='true';
    seek();
  });
  video.addEventListener('error',()=>{
    if(!video.getAttribute('src'))return;
    failed=true;loading=false;root.dataset.mode='fallback';root.dataset.frameReady='false';
  });
  window.addEventListener('scroll',handleScroll,{passive:true});
  window.addEventListener('resize',()=>{
    const widthChanged=innerWidth!==viewportWidth;
    viewportWidth=innerWidth;
    if(widthChanged&&active&&userEngaged)load();
    schedule();
  },{passive:true});
  reduced.addEventListener('change',()=>{
    if(reduced.matches){clearMedia();root.dataset.mode='fallback'}
    else{root.dataset.mode='loading';if(active&&userEngaged)load();schedule()}
  });
  mobile.addEventListener('change',()=>{if(active&&userEngaged)load();schedule()});
  document.addEventListener('pointerdown',prime,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();else video.pause()});
  window.addEventListener('pagehide',()=>{
    disposed=true;observer.disconnect();cancelAnimationFrame(raf);clearMedia();
  });
  if(reduced.matches){root.dataset.mode='fallback'}else schedule();
}
