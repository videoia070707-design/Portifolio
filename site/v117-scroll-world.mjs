/* MOVX v124 spatial Scroll World.
   The signature scene is controlled directly by scroll, never autoplay. A system
   reduced-motion preference no longer silently collapses it into a static poster;
   the poster is reserved for real media/network/decode failure only. */
const root=document.querySelector('[data-movx-scroll-world="v117"]');
if(root){
  const video=root.querySelector('video');
  const countLabel=root.querySelector('.movx-scroll-world__count b');
  const chapterPanels=[...root.querySelectorAll('[data-world-chapter-panel]')];
  const chapterCount=Math.max(1,chapterPanels.length);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=matchMedia('(max-width: 767px)');
  const canH264=video.canPlayType('video/mp4; codecs="avc1.640028"')!==''||video.canPlayType('video/mp4')!=='';
  const canWebM=video.canPlayType('video/webm; codecs="vp9"')!=='';
  const sourceTrim=1.20;
  const clamp=x=>Math.max(0,Math.min(1,x));
  const mix=(a,b,t)=>a+(b-a)*t;
  const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
  const segment=(p,a,b,x,y)=>mix(x,y,ease((p-a)/(b-a)));
  const engagementThreshold=()=>Math.max(48,innerHeight*.08);
  const candidatesFor=variant=>{
    const stem=variant==='mobile'?'media/movx-scroll-world-0923-mobile':'media/movx-scroll-world-0923';
    const items=[];
    if(canH264)items.push({codec:'h264-mp4',url:`${stem}.mp4`});
    if(canWebM)items.push({codec:'vp9-webm',url:`${stem}.webm`});
    if(!items.length){
      items.push({codec:'h264-mp4',url:`${stem}.mp4`},{codec:'vp9-webm',url:`${stem}.webm`});
    }
    return items;
  };

  let active=false,nearby=false,failed=false,disposed=false,raf=0,duration=0,target=0,blobURL='',controller=null,loading=false;
  let viewportWidth=innerWidth,mediaVariant='',mediaCandidates=[],mediaAttempt=0,currentChapter=1;
  let userEngaged=scrollY>engagementThreshold();
  let targetProgress=0,visualProgress=0,lastStamp=0,firstVisual=true;

  function progress(){
    const length=Math.max(1,root.offsetHeight-innerHeight);
    return clamp(-root.getBoundingClientRect().top/length);
  }
  function schedule(){if(!raf&&!disposed&&!document.hidden)raf=requestAnimationFrame(render)}
  function mappedTarget(p){
    if(duration<=0)return 0;
    const end=Math.max(0,duration-1/30);
    return end*clamp(p);
  }
  function markFrameReady(){
    if(!failed&&video.readyState>=2&&video.videoWidth>0){
      root.dataset.frameReady='true';
      root.dataset.scrubLive='true';
    }
  }
  function seek(){
    if(!active||failed||duration<=0||video.readyState<1||video.seeking)return;
    if(Math.abs(video.currentTime-target)>1/45){
      try{video.currentTime=target}catch{}
    }else{
      markFrameReady();
    }
  }
  function updateChapter(p){
    const next=Math.min(chapterCount,Math.floor(clamp(p)*chapterCount)+1);
    if(next===currentChapter)return;
    currentChapter=next;
    root.dataset.worldChapter=String(next);
    if(countLabel)countLabel.textContent=String(next).padStart(2,'0');
  }
  function spatialState(p){
    const isMobile=mobile.matches;
    let scale,rx,ry,rz,x,y,z;
    if(isMobile){
      if(p<=.24){
        scale=segment(p,0,.24,.98,1.12);z=segment(p,0,.24,-55,-8);rx=segment(p,0,.24,2.2,.6);ry=segment(p,0,.24,-2.8,-.7);rz=segment(p,0,.24,-.35,-.08);x=segment(p,0,.24,-1.5,-.2);y=segment(p,0,.24,1.4,.4);
      }else if(p<=.58){
        scale=segment(p,.24,.58,1.12,1.34);z=segment(p,.24,.58,-8,40);rx=segment(p,.24,.58,.6,-1.15);ry=segment(p,.24,.58,-.7,2.4);rz=segment(p,.24,.58,-.08,.28);x=segment(p,.24,.58,-.2,-2.2);y=segment(p,.24,.58,.4,-.6);
      }else if(p<=.82){
        scale=segment(p,.58,.82,1.34,1.82);z=segment(p,.58,.82,40,105);rx=segment(p,.58,.82,-1.15,.65);ry=segment(p,.58,.82,2.4,-1.8);rz=segment(p,.58,.82,.28,-.22);x=segment(p,.58,.82,-2.2,2.0);y=segment(p,.58,.82,-.6,.4);
      }else{
        scale=segment(p,.82,1,1.82,1.06);z=segment(p,.82,1,105,0);rx=segment(p,.82,1,.65,0);ry=segment(p,.82,1,-1.8,0);rz=segment(p,.82,1,-.22,0);x=segment(p,.82,1,2.0,0);y=segment(p,.82,1,.4,0);
      }
    }else{
      if(p<=.24){
        scale=segment(p,0,.24,.94,1.13);z=segment(p,0,.24,-105,-18);rx=segment(p,0,.24,3.8,1.05);ry=segment(p,0,.24,-5.5,-1.35);rz=segment(p,0,.24,-.65,-.12);x=segment(p,0,.24,-3.8,-.35);y=segment(p,0,.24,2.8,.7);
      }else if(p<=.58){
        scale=segment(p,.24,.58,1.13,1.50);z=segment(p,.24,.58,-18,82);rx=segment(p,.24,.58,1.05,-2.15);ry=segment(p,.24,.58,-1.35,5.25);rz=segment(p,.24,.58,-.12,.58);x=segment(p,.24,.58,-.35,-4.6);y=segment(p,.24,.58,.7,-1.35);
      }else if(p<=.82){
        scale=segment(p,.58,.82,1.50,2.16);z=segment(p,.58,.82,82,172);rx=segment(p,.58,.82,-2.15,1.05);ry=segment(p,.58,.82,5.25,-3.05);rz=segment(p,.58,.82,.58,-.42);x=segment(p,.58,.82,-4.6,3.6);y=segment(p,.58,.82,-1.35,.72);
      }else{
        scale=segment(p,.82,1,2.16,1.08);z=segment(p,.82,1,172,0);rx=segment(p,.82,1,1.05,0);ry=segment(p,.82,1,-3.05,0);rz=segment(p,.82,1,-.42,0);x=segment(p,.82,1,3.6,0);y=segment(p,.82,1,.72,0);
      }
    }
    return {scale,rx,ry,rz,x,y,z};
  }
  function applySpatial(p){
    const s=spatialState(p);
    const exit=ease((p-.955)/.045);
    root.style.setProperty('--world-scale',s.scale.toFixed(4));
    root.style.setProperty('--world-rx',`${s.rx.toFixed(3)}deg`);
    root.style.setProperty('--world-ry',`${s.ry.toFixed(3)}deg`);
    root.style.setProperty('--world-rz',`${s.rz.toFixed(3)}deg`);
    root.style.setProperty('--world-x',`${s.x.toFixed(3)}vw`);
    root.style.setProperty('--world-y',`${s.y.toFixed(3)}vh`);
    root.style.setProperty('--world-z',`${s.z.toFixed(2)}px`);
    root.style.setProperty('--world-exit',(1-exit).toFixed(4));
    root.style.setProperty('--world-progress',`${(p*100).toFixed(2)}%`);
    root.dataset.worldProgress=p.toFixed(4);
    root.dataset.worldScale=s.scale.toFixed(4);
    root.dataset.worldDepth=s.z.toFixed(2);
    root.dataset.worldRotateX=s.rx.toFixed(3);
    root.dataset.worldRotateY=s.ry.toFixed(3);
    root.dataset.worldRotateZ=s.rz.toFixed(3);
    root.dataset.spatialMode='css-3d';
    updateChapter(p);
  }
  function render(now=performance.now()){
    raf=0;
    if(disposed)return;
    targetProgress=progress();
    const dt=lastStamp?Math.min(64,now-lastStamp):16.7;
    lastStamp=now;
    if(firstVisual){visualProgress=targetProgress;firstVisual=false;}
    const damping=1-Math.exp(-dt/72);
    visualProgress+=(targetProgress-visualProgress)*damping;
    const p=clamp(visualProgress);
    applySpatial(p);
    if(duration&&!failed){
      target=mappedTarget(p);
      root.dataset.worldTarget=target.toFixed(3);
      seek();
    }
    if(Math.abs(targetProgress-visualProgress)>.00045||video.seeking)schedule();
  }
  function releaseSource(resetDuration=true){
    controller?.abort();controller=null;
    video.pause();video.removeAttribute('src');video.load();
    if(blobURL)URL.revokeObjectURL(blobURL);
    blobURL='';loading=false;
    if(resetDuration)duration=0;
    root.dataset.frameReady='false';
    root.dataset.scrubLive='false';
  }
  function clearMedia(){
    releaseSource(true);
    mediaVariant='';mediaCandidates=[];mediaAttempt=0;
  }
  function fallback(error){
    loading=false;
    const next=mediaAttempt+1;
    if(!disposed&&next<mediaCandidates.length){
      mediaAttempt=next;
      console.warn('MOVX scroll world: retrying alternate codec',error);
      loadCandidate(mediaAttempt);
      return;
    }
    failed=true;
    root.dataset.mode='fallback';
    root.dataset.frameReady='false';
    root.dataset.scrubLive='false';
    console.warn('MOVX scroll world: poster fallback after real media failure',error);
  }
  async function loadCandidate(index){
    if(disposed||!userEngaged||!nearby||!mediaVariant)return;
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
      if(disposed||!nearby||mediaCandidates[index]!==candidate)return;
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
    if(disposed||!userEngaged||!nearby)return;
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
      if(nearby)load();
    }
    schedule();
  }

  const warmObserver=new IntersectionObserver(entries=>{
    nearby=entries.some(entry=>entry.isIntersecting);
    root.dataset.nearby=nearby?'true':'false';
    if(nearby&&userEngaged)load();
  },{rootMargin:'120% 0px',threshold:0});
  warmObserver.observe(root);

  const observer=new IntersectionObserver(entries=>{
    active=entries.some(entry=>entry.isIntersecting);
    if(active){firstVisual=true;lastStamp=0;schedule()}else{cancelAnimationFrame(raf);raf=0;video.pause()}
  },{rootMargin:'0px',threshold:0});
  observer.observe(root);

  root.dataset.userEngaged=userEngaged?'true':'false';
  root.dataset.worldChapter='1';
  root.dataset.sourceTrim=sourceTrim.toFixed(2);
  root.dataset.scrubLive='false';
  root.dataset.spatialMode='css-3d';
  root.dataset.motionPreference=reduced.matches?'system-reduce-scroll-controlled':'full-scroll-controlled';
  video.muted=true;video.playsInline=true;video.disableRemotePlayback=true;

  video.addEventListener('loadedmetadata',()=>{
    loading=false;
    duration=Number.isFinite(video.duration)?video.duration:0;
    root.dataset.mode=duration?'scrub':'fallback';
    if(duration){
      target=mappedTarget(visualProgress||progress());
      root.dataset.worldTarget=target.toFixed(3);
      try{video.currentTime=target}catch{}
    }
    schedule();
  });
  video.addEventListener('loadeddata',()=>{markFrameReady();seek();schedule()});
  video.addEventListener('canplay',()=>{markFrameReady();seek();schedule()});
  video.addEventListener('seeked',()=>{markFrameReady();seek();schedule()});
  video.addEventListener('error',()=>{
    if(!video.getAttribute('src'))return;
    fallback(new Error(video.error?.message||'video decode error'));
  });

  window.addEventListener('scroll',handleScroll,{passive:true});
  window.addEventListener('resize',()=>{
    const widthChanged=innerWidth!==viewportWidth;
    viewportWidth=innerWidth;
    if(widthChanged&&nearby&&userEngaged)load();
    firstVisual=true;lastStamp=0;schedule();
  },{passive:true});
  reduced.addEventListener('change',()=>{
    root.dataset.motionPreference=reduced.matches?'system-reduce-scroll-controlled':'full-scroll-controlled';
    firstVisual=true;lastStamp=0;
    if(nearby&&userEngaged&&!failed)load();
    schedule();
  });
  mobile.addEventListener('change',()=>{failed=false;firstVisual=true;if(nearby&&userEngaged)load();schedule()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){firstVisual=true;schedule()}else video.pause()});
  window.addEventListener('pagehide',()=>{
    disposed=true;observer.disconnect();warmObserver.disconnect();cancelAnimationFrame(raf);clearMedia();
  });
  applySpatial(progress());
  schedule();
}
