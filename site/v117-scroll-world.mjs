/* Adapted from scroll-world's blob seek, mobile seek coalescing and poster fallback.
   The supplied footage is one continuous take, so there are no segment seams. */
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
  let active=false,failed=false,disposed=false,raf=0,duration=0,target=0,blobURL='',controller=null,loading=false;
  let viewportWidth=innerWidth,mediaVariant='';

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
    blobURL='';duration=0;loading=false;
    root.dataset.frameReady='false';
  }
  async function load(){
    if(disposed||failed||reduced.matches||loading)return;
    const variant=mobile.matches?'mobile':'desktop';
    if(mediaVariant===variant&&blobURL)return;
    clearMedia();mediaVariant=variant;loading=true;
    controller=new AbortController();
    try{
      const response=await fetch(urls[variant],{signal:controller.signal});
      if(!response.ok)throw new Error(`media status ${response.status}`);
      const data=await response.blob();
      if(disposed||reduced.matches||mediaVariant!==variant)return;
      blobURL=URL.createObjectURL(data);
      video.src=blobURL;video.load();loading=false;
    }catch(error){
      if(error.name==='AbortError')return;
      failed=true;root.dataset.mode='fallback';loading=false;
      console.warn('MOVX scroll film: poster fallback',error);
    }
  }
  async function prime(){
    if(!active||!blobURL||reduced.matches||!mobile.matches)return;
    try{await video.play();video.pause();schedule()}catch{}
  }
  const observer=new IntersectionObserver(entries=>{
    active=entries.some(entry=>entry.isIntersecting);
    if(active){load();schedule()}else{cancelAnimationFrame(raf);raf=0;video.pause()}
  },{rootMargin:'150% 0px'});
  observer.observe(root);
  video.muted=true;video.playsInline=true;video.disableRemotePlayback=true;
  video.addEventListener('loadedmetadata',()=>{
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
    if(blobURL){failed=true;root.dataset.mode='fallback';root.dataset.frameReady='false'}
  });
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',()=>{
    const widthChanged=innerWidth!==viewportWidth;
    viewportWidth=innerWidth;
    if(widthChanged){load();schedule()}
  },{passive:true});
  reduced.addEventListener('change',()=>{
    if(reduced.matches){clearMedia();root.dataset.mode='fallback'}
    else{root.dataset.mode='loading';load();schedule()}
  });
  mobile.addEventListener('change',()=>{load();schedule()});
  document.addEventListener('pointerdown',prime,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();else video.pause()});
  window.addEventListener('pagehide',()=>{
    disposed=true;observer.disconnect();cancelAnimationFrame(raf);clearMedia();
  });
  if(reduced.matches){root.dataset.mode='fallback'}else schedule();
}
