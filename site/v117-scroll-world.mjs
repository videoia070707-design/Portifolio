/* MOVX v121 visible-start scroll background.
   The film starts on a visible frame instead of the nearly-black source opening.
   Video loading stays deferred, prefers VP9/WebM when supported, retries H.264/MP4
   when decoding fails, and does not depend on autoplay to reveal the first frame. */
const root=document.querySelector('[data-movx-scroll-world="v117"]');
if(root){
  const video=root.querySelector('video');
  const countLabel=root.querySelector('.movx-scroll-world__count b');
  const chapterPanels=[...root.querySelectorAll('[data-world-chapter-panel]')];
  const chapterCount=Math.max(1,chapterPanels.length);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=matchMedia('(max-width: 767px)');
  const canWebM=video.canPlayType('video/webm; codecs="vp9"')!=='';
  const canH264=video.canPlayType('video/mp4; codecs="avc1.640028"')!==''||video.canPlayType('video/mp4')!=='';
  const visibleStart=1.20;
  const clamp=x=>Math.max(0,Math.min(1,x));
  const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
  const engagementThreshold=()=>Math.max(48,innerHeight*.08);
  const candidatesFor=variant=>{
    const stem=variant==='mobile'?'media/movx-scroll-world-0923-mobile':'media/movx-scroll-world-0923';
    const items=[];
    if(canWebM)items.push({codec:'vp9-webm',url:`${stem}.webm`});
    if(canH264)items.push({codec:'h264-mp4',url:`${stem}.mp4`});
    if(!items.length){
      items.push({codec:'vp9-webm',url:`${stem}.webm`},{codec:'h264-mp4',url:`${stem}.mp4`});
    }
    return items;
  };

  let active=false,failed=false,disposed=false,raf=0,duration=0,target=visibleStart,blobURL='',controller=null,loading=false,primed=false;
  let viewportWidth=innerWidth,mediaVariant='',mediaCandidates=[],mediaAttempt=0,currentChapter=1;
  let userEngaged=scrollY>engagementThreshold();

  function progress(){
    const length=Math.max(1,root.offsetHeight-innerHeight);
    return clamp(-root.getBoundingClientRect().top/length);
  }
  function schedule(){if(!raf&&!disposed&&!document.hidden)raf=requestAnimationFrame(render)}
  function startForDuration(){return duration>0?Math.min(visibleStart,Math.max(0,duration-.5)):visibleStart}
  function mappedTarget(p){
    const start=startForDuration();
    const end=Math.max(start,duration-1/30);
    return start+(end-start)*clamp(p);
  }
  function seek(){
    if(!active||failed||reduced.matches||duration<=0||video.readyState<1||video.seeking)return;
    if(Math.abs(video.currentTime-target)>1/30){try{video.currentTime=target}catch{}}
  }
  function markFrameReady(){
    const start=startForDuration();
    const closeToTarget=Math.abs(video.currentTime-target)<.5;
    if(!failed&&video.readyState>=2&&video.currentTime>=Math.max(0,start-.08)&&closeToTarget){
      root.dataset.frameReady='true';
    }
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
    if(disposed||reduced.matches)return;
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
    if(duration&&!failed){
      target=mappedTarget(p);
      root.dataset.worldTarget=target.toFixed(3);
      seek();
    }
  }
  function releaseSource(resetDuration=true){
    controller?.abort();controller=null;
    video.pause();video.removeAttribute('src');video.load();
    if(blobURL)URL.revokeObjectURL(blobURL);
    blobURL='';loading=false;primed=false;
    if(resetDuration)duration=0;
    root.dataset.frameReady='false';
  }
  function clearMedia(){
    releaseSource(true);
    mediaVariant='';mediaCandidates=[];mediaAttempt=0;
  }
  function fallback(error){
    loading=false;
    const next=mediaAttempt+1;
    if(!disposed&&!reduced.matches&&next<mediaCandidates.length){
      mediaAttempt=next;
      console.warn('MOVX scroll world: retrying alternate codec',error);
      loadCandidate(mediaAttempt);
      return;
    }
    failed=true;
    root.dataset.mode='fallback';
    root.dataset.frameReady='false';
    console.warn('MOVX scroll world: visible poster fallback',error);
  }
  async function loadCandidate(index){
    if(disposed||reduced.matches||!userEngaged||!active||!mediaVariant)return;
    const candidate=mediaCandidates[index];
    if(!candidate){fallback(new Error('no compatible media candidate'));return}
    releaseSource(true);
    loading=true;
    root.dataset.mode='loading';
    root.dataset.mediaCodec=candidate.codec;
    root.dataset.mediaAttempt=String(index+1);
    controller=new AbortController();
    try{
      const response=await fetch(candidate.url,{signal:controller.signal,cache:'force-cache'});
      if(!response.ok)throw new Error(`media status ${response.status}`);
      const data=await response.blob();
      if(disposed||reduced.matches||!active||mediaCandidates[index]!==candidate)return;
      blobURL=URL.createObjectURL(data);
      video.preload='auto';
      video.src=blobURL;
      video.load();
    }catch(error){
      if(error.name==='AbortError')return;
      fallback(error);
    }
  }
  function load(){
    if(disposed||reduced.matches||!userEngaged)return;
    const variant=mobile.matches?'mobile':'desktop';
    if(mediaVariant===variant&&(loading||blobURL||video.currentSrc||video.getAttribute('src')))return;
    clearMedia();
    failed=false;
    mediaVariant=variant;
    mediaCandidates=candidatesFor(variant);
    mediaAttempt=0;
    loadCandidate(0);
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
    if(primed||!active||failed||!userEngaged||reduced.matches||video.readyState<1||!video.currentSrc)return;
    primed=true;
    if(duration){
      target=mappedTarget(progress());
      root.dataset.worldTarget=target.toFixed(3);
      try{video.currentTime=target}catch{}
    }
    schedule();
    if(video.readyState<2){
      try{
        await video.play();
        video.pause();
        if(duration){try{video.currentTime=target}catch{}}
      }catch{}
    }
    markFrameReady();
  }
  const observer=new IntersectionObserver(entries=>{
    active=entries.some(entry=>entry.isIntersecting);
    if(active){if(userEngaged)load();schedule()}else{cancelAnimationFrame(raf);raf=0;video.pause()}
  },{rootMargin:'0px',threshold:0});
  observer.observe(root);
  root.dataset.userEngaged=userEngaged?'true':'false';
  root.dataset.worldChapter='1';
  root.dataset.visibleStart=visibleStart.toFixed(2);
  video.muted=true;video.playsInline=true;video.disableRemotePlayback=true;
  video.addEventListener('loadedmetadata',()=>{
    loading=false;
    duration=Number.isFinite(video.duration)?video.duration:0;
    root.dataset.mode=duration?'scrub':'fallback';
    if(duration){
      target=mappedTarget(progress());
      root.dataset.worldTarget=target.toFixed(3);
      seek();
    }
    schedule();
  });
  video.addEventListener('loadeddata',()=>{prime();schedule()});
  video.addEventListener('canplay',()=>{prime();markFrameReady();schedule()});
  video.addEventListener('seeked',()=>{
    markFrameReady();
    seek();
  });
  video.addEventListener('error',()=>{
    if(!video.getAttribute('src'))return;
    const message=video.error?.message||'video decode error';
    fallback(new Error(message));
  });
  window.addEventListener('scroll',handleScroll,{passive:true});
  window.addEventListener('resize',()=>{
    const widthChanged=innerWidth!==viewportWidth;
    viewportWidth=innerWidth;
    if(widthChanged&&active&&userEngaged)load();
    schedule();
  },{passive:true});
  reduced.addEventListener('change',()=>{
    if(reduced.matches){clearMedia();failed=false;root.dataset.mode='fallback'}
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
