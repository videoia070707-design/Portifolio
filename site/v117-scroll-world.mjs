/* MOVX v125 true 3D Scroll World.
   Scroll drives two things at once: the real video frame and a virtual camera path.
   The film is a perspective plane that approaches, banks and passes the camera. */
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
    if(!items.length)items.push({codec:'h264-mp4',url:`${stem}.mp4`},{codec:'vp9-webm',url:`${stem}.webm`});
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
    }else markFrameReady();
  }
  function updateChapter(p){
    const next=Math.min(chapterCount,Math.floor(clamp(p)*chapterCount)+1);
    if(next===currentChapter)return;
    currentChapter=next;
    root.dataset.worldChapter=String(next);
    if(countLabel)countLabel.textContent=String(next).padStart(2,'0');
  }
  function spatialState(p){
    const m=mobile.matches;
    let scale,rx,ry,rz,x,y,z,px,py,glow;
    if(m){
      if(p<=.23){
        scale=segment(p,0,.23,.78,1.04);z=segment(p,0,.23,-240,-72);rx=segment(p,0,.23,5.2,1.2);ry=segment(p,0,.23,-7.5,-1.8);rz=segment(p,0,.23,-.7,-.12);x=segment(p,0,.23,-2.2,-.3);y=segment(p,0,.23,2.1,.5);px=segment(p,0,.23,46,50);py=segment(p,0,.23,52,48);glow=segment(p,0,.23,.18,.38);
      }else if(p<=.50){
        scale=segment(p,.23,.50,1.04,1.42);z=segment(p,.23,.50,-72,72);rx=segment(p,.23,.50,1.2,-2.2);ry=segment(p,.23,.50,-1.8,5.8);rz=segment(p,.23,.50,-.12,.48);x=segment(p,.23,.50,-.3,-4.0);y=segment(p,.23,.50,.5,-1.2);px=segment(p,.23,.50,50,44);py=segment(p,.23,.50,48,50);glow=segment(p,.23,.50,.38,.62);
      }else if(p<=.78){
        scale=segment(p,.50,.78,1.42,2.20);z=segment(p,.50,.78,72,250);rx=segment(p,.50,.78,-2.2,1.7);ry=segment(p,.50,.78,5.8,-4.2);rz=segment(p,.50,.78,.48,-.36);x=segment(p,.50,.78,-4.0,3.2);y=segment(p,.50,.78,-1.2,.8);px=segment(p,.50,.78,44,56);py=segment(p,.50,.78,50,46);glow=segment(p,.50,.78,.62,.86);
      }else{
        scale=segment(p,.78,1,2.20,1.10);z=segment(p,.78,1,250,-10);rx=segment(p,.78,1,1.7,0);ry=segment(p,.78,1,-4.2,0);rz=segment(p,.78,1,-.36,0);x=segment(p,.78,1,3.2,0);y=segment(p,.78,1,.8,0);px=segment(p,.78,1,56,50);py=segment(p,.78,1,46,50);glow=segment(p,.78,1,.86,.22);
      }
    }else{
      if(p<=.22){
        scale=segment(p,0,.22,.66,1.02);z=segment(p,0,.22,-360,-92);rx=segment(p,0,.22,8.5,1.4);ry=segment(p,0,.22,-12.5,-2.0);rz=segment(p,0,.22,-1.2,-.16);x=segment(p,0,.22,-5.4,-.4);y=segment(p,0,.22,3.8,.6);px=segment(p,0,.22,45,50);py=segment(p,0,.22,53,48);glow=segment(p,0,.22,.18,.40);
      }else if(p<=.47){
        scale=segment(p,.22,.47,1.02,1.48);z=segment(p,.22,.47,-92,78);rx=segment(p,.22,.47,1.4,-3.4);ry=segment(p,.22,.47,-2.0,8.5);rz=segment(p,.22,.47,-.16,.72);x=segment(p,.22,.47,-.4,-6.2);y=segment(p,.22,.47,.6,-1.8);px=segment(p,.22,.47,50,42);py=segment(p,.22,.47,48,51);glow=segment(p,.22,.47,.40,.70);
      }else if(p<=.74){
        scale=segment(p,.47,.74,1.48,2.55);z=segment(p,.47,.74,78,330);rx=segment(p,.47,.74,-3.4,2.4);ry=segment(p,.47,.74,8.5,-5.7);rz=segment(p,.47,.74,.72,-.55);x=segment(p,.47,.74,-6.2,4.8);y=segment(p,.47,.74,-1.8,1.1);px=segment(p,.47,.74,42,59);py=segment(p,.47,.74,51,45);glow=segment(p,.47,.74,.70,1);
      }else if(p<=.90){
        scale=segment(p,.74,.90,2.55,1.62);z=segment(p,.74,.90,330,105);rx=segment(p,.74,.90,2.4,-1.0);ry=segment(p,.74,.90,-5.7,2.1);rz=segment(p,.74,.90,-.55,.18);x=segment(p,.74,.90,4.8,-1.2);y=segment(p,.74,.90,1.1,-.3);px=segment(p,.74,.90,59,48);py=segment(p,.74,.90,45,50);glow=segment(p,.74,.90,1,.52);
      }else{
        scale=segment(p,.90,1,1.62,1.08);z=segment(p,.90,1,105,0);rx=segment(p,.90,1,-1.0,0);ry=segment(p,.90,1,2.1,0);rz=segment(p,.90,1,.18,0);x=segment(p,.90,1,-1.2,0);y=segment(p,.90,1,-.3,0);px=segment(p,.90,1,48,50);py=segment(p,.90,1,50,50);glow=segment(p,.90,1,.52,.18);
      }
    }
    return {scale,rx,ry,rz,x,y,z,px,py,glow};
  }
  function applySpatial(p){
    const s=spatialState(p);
    const exit=ease((p-.975)/.025);
    root.style.setProperty('--world-scale',s.scale.toFixed(4));
    root.style.setProperty('--world-rx',`${s.rx.toFixed(3)}deg`);
    root.style.setProperty('--world-ry',`${s.ry.toFixed(3)}deg`);
    root.style.setProperty('--world-rz',`${s.rz.toFixed(3)}deg`);
    root.style.setProperty('--world-x',`${s.x.toFixed(3)}vw`);
    root.style.setProperty('--world-y',`${s.y.toFixed(3)}vh`);
    root.style.setProperty('--world-z',`${s.z.toFixed(2)}px`);
    root.style.setProperty('--world-persp-x',`${s.px.toFixed(2)}%`);
    root.style.setProperty('--world-persp-y',`${s.py.toFixed(2)}%`);
    root.style.setProperty('--world-glow',s.glow.toFixed(3));
    root.style.setProperty('--world-exit',(1-exit).toFixed(4));
    root.style.setProperty('--world-progress',`${(p*100).toFixed(2)}%`);
    root.dataset.worldProgress=p.toFixed(4);
    root.dataset.worldScale=s.scale.toFixed(4);
    root.dataset.worldDepth=s.z.toFixed(2);
    root.dataset.worldRotateX=s.rx.toFixed(3);
    root.dataset.worldRotateY=s.ry.toFixed(3);
    root.dataset.worldRotateZ=s.rz.toFixed(3);
    root.dataset.worldPerspectiveX=s.px.toFixed(2);
    root.dataset.worldPerspectiveY=s.py.toFixed(2);
    root.dataset.spatialMode='camera-3d';
    updateChapter(p);
  }
  function render(now=performance.now()){
    raf=0;
    if(disposed)return;
    targetProgress=progress();
    const dt=lastStamp?Math.min(64,now-lastStamp):16.7;
    lastStamp=now;
    if(firstVisual){visualProgress=targetProgress;firstVisual=false}
    const damping=1-Math.exp(-dt/86);
    visualProgress+=(targetProgress-visualProgress)*damping;
    const p=clamp(visualProgress);
    applySpatial(p);
    if(duration&&!failed){
      target=mappedTarget(p);
      root.dataset.worldTarget=target.toFixed(3);
      seek();
    }
    if(Math.abs(targetProgress-visualProgress)>.0004||video.seeking)schedule();
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
  function clearMedia(){releaseSource(true);mediaVariant='';mediaCandidates=[];mediaAttempt=0}
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
      video.preload='auto';video.src=blobURL;video.load();
    }catch(error){if(error.name!=='AbortError')fallback(error)}
  }
  function load(){
    if(disposed||!userEngaged||!nearby)return;
    const variant=mobile.matches?'mobile':'desktop';
    if(mediaVariant===variant&&(loading||blobURL||video.currentSrc||video.getAttribute('src')))return;
    clearMedia();failed=false;mediaVariant=variant;mediaCandidates=candidatesFor(variant);mediaAttempt=0;loadCandidate(0);
  }
  function handleScroll(){
    if(!userEngaged&&scrollY>engagementThreshold()){
      userEngaged=true;root.dataset.userEngaged='true';if(nearby)load();
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
  root.dataset.spatialMode='camera-3d';
  root.dataset.motionPreference=reduced.matches?'system-reduce-scroll-controlled':'full-scroll-controlled';
  video.muted=true;video.playsInline=true;video.disableRemotePlayback=true;

  video.addEventListener('loadedmetadata',()=>{
    loading=false;duration=Number.isFinite(video.duration)?video.duration:0;root.dataset.mode=duration?'scrub':'fallback';
    if(duration){target=mappedTarget(visualProgress||progress());root.dataset.worldTarget=target.toFixed(3);try{video.currentTime=target}catch{}}
    schedule();
  });
  video.addEventListener('loadeddata',()=>{markFrameReady();seek();schedule()});
  video.addEventListener('canplay',()=>{markFrameReady();seek();schedule()});
  video.addEventListener('seeked',()=>{markFrameReady();seek();schedule()});
  video.addEventListener('error',()=>{if(video.getAttribute('src'))fallback(new Error(video.error?.message||'video decode error'))});

  window.addEventListener('scroll',handleScroll,{passive:true});
  window.addEventListener('resize',()=>{
    const widthChanged=innerWidth!==viewportWidth;viewportWidth=innerWidth;
    if(widthChanged&&nearby&&userEngaged)load();
    firstVisual=true;lastStamp=0;schedule();
  },{passive:true});
  reduced.addEventListener('change',()=>{
    root.dataset.motionPreference=reduced.matches?'system-reduce-scroll-controlled':'full-scroll-controlled';
    firstVisual=true;lastStamp=0;if(nearby&&userEngaged&&!failed)load();schedule();
  });
  mobile.addEventListener('change',()=>{failed=false;firstVisual=true;if(nearby&&userEngaged)load();schedule()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){firstVisual=true;schedule()}else video.pause()});
  window.addEventListener('pagehide',()=>{disposed=true;observer.disconnect();warmObserver.disconnect();cancelAnimationFrame(raf);clearMedia()});
  applySpatial(progress());schedule();
}
