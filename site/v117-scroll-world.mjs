/* MOVX v120 scroll background.
   Desktop uses the optimized static source directly for reliable range seeking.
   Mobile keeps the proven deferred Blob path. Nothing is requested on first paint. */
const root=document.querySelector('[data-movx-scroll-world="v117"]');
if(root){
  const video=root.querySelector('video');
  const countLabel=root.querySelector('.movx-scroll-world__count b');
  const chapterPanels=[...root.querySelectorAll('[data-world-chapter-panel]')];
  const chapterCount=Math.max(1,chapterPanels.length);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=matchMedia('(max-width: 767px)');
  const mp4=video.canPlayType('video/mp4')!=='';
  const urls=mp4?
    {desktop:'media/movx-scroll-world-0923.mp4',mobile:'media/movx-scroll-world-0923-mobile.mp4'}:
    {desktop:'media/movx-scroll-world-0923.webm',mobile:'media/movx-scroll-world-0923-mobile.webm'};
  const clamp=x=>Math.max(0,Math.min(1,x));
  const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
  const engagementThreshold=()=>Math.max(48,innerHeight*.08);
  let active=false,failed=false,disposed=false,raf=0,duration=0,target=0,blobURL='',controller=null,loading=false,primed=false;
  let viewportWidth=innerWidth,mediaVariant='',currentChapter=1;
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
  function updateChapter(p){
    const next=Math.min(chapterCount,Math.floor(clamp(p)*chapterCount)+1);
    if(next===currentChapter)return;
    currentChapter=next;
    root.dataset.worldChapter=String(next);
    if(countLabel)countLabel.textContent=String(next).padStart(2,'0');
  }
  function render(){
    raf=0;
    if(disposed||failed||reduced.matches)return;
    const p=progress();
    const enter=ease(p/.2);
    const exit=ease((p-.96)/.04);
    const scale=1.035-.035*enter+.018*ease((p-.62)/.34);
    root.style.setProperty('--world-scale',scale.toFixed(4));
    root.style.setProperty('--world-turn','0deg');
    root.style.setProperty('--world-lift','0vh');
    root.style.setProperty('--world-exit',(1-exit).toFixed(4));
    root.style.setProperty('--world-progress',`${(p*100).toFixed(2)}%`);
    root.dataset.worldProgress=p.toFixed(4);
    updateChapter(p);
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
    blobURL='';duration=0;loading=false;primed=false;mediaVariant='';
    root.dataset.frameReady='false';
  }
  async function load(){
    if(disposed||failed||reduced.matches||!userEngaged)return;
    const variant=mobile.matches?'mobile':'desktop';
    if(mediaVariant===variant&&(loading||video.currentSrc||video.getAttribute('src')))return;
    clearMedia();
    mediaVariant=variant;loading=true;
    root.dataset.mode='loading';

    if(variant==='desktop'){
      video.preload='auto';
      video.src=urls.desktop;
      video.load();
      return;
    }

    controller=new AbortController();
    try{
      const response=await fetch(urls.mobile,{signal:controller.signal,cache:'force-cache'});
      if(!response.ok)throw new Error(`media status ${response.status}`);
      const data=await response.blob();
      if(disposed||reduced.matches||mediaVariant!==variant)return;
      blobURL=URL.createObjectURL(data);
      video.preload='auto';video.src=blobURL;video.load();
    }catch(error){
      if(error.name==='AbortError')return;
      failed=true;loading=false;root.dataset.mode='fallback';root.dataset.frameReady='false';
      console.warn('MOVX scroll world: poster fallback',error);
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
    if(primed||!active||!userEngaged||reduced.matches||video.readyState<2||!video.currentSrc)return;
    primed=true;
    try{
      await video.play();
      video.pause();
      if(duration){video.currentTime=Math.max(0,Math.min(target,duration-1/30))}
      schedule();
    }catch{
      primed=false;
    }
  }
  const observer=new IntersectionObserver(entries=>{
    active=entries.some(entry=>entry.isIntersecting);
    if(active){if(userEngaged)load();schedule()}else{cancelAnimationFrame(raf);raf=0;video.pause()}
  },{rootMargin:'0px',threshold:0});
  observer.observe(root);
  root.dataset.userEngaged=userEngaged?'true':'false';
  root.dataset.worldChapter='1';
  video.muted=true;video.playsInline=true;video.disableRemotePlayback=true;
  video.addEventListener('loadedmetadata',()=>{
    loading=false;
    duration=Number.isFinite(video.duration)?video.duration:0;
    root.dataset.mode=duration?'scrub':'fallback';
    schedule();
  });
  video.addEventListener('loadeddata',()=>{
    if(video.readyState>=2)root.dataset.frameReady='true';
    prime();schedule();
  });
  video.addEventListener('canplay',()=>{prime();schedule()});
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
    else{failed=false;root.dataset.mode='loading';if(active&&userEngaged)load();schedule()}
  });
  mobile.addEventListener('change',()=>{failed=false;if(active&&userEngaged)load();schedule()});
  document.addEventListener('pointerdown',prime,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();else video.pause()});
  window.addEventListener('pagehide',()=>{
    disposed=true;observer.disconnect();cancelAnimationFrame(raf);clearMedia();
  });
  if(reduced.matches){root.dataset.mode='fallback'}else schedule();
}
