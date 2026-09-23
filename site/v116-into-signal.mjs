const root=document.querySelector('[data-movx-signal-film]');
if(root){
  const video=root.querySelector('video');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=matchMedia('(max-width: 820px)');
  let duration=0;
  let scheduled=false;
  let active=false;
  let mediaUrl='';
  let loading=false;

  const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>t*t*(3-2*t);

  function mapFilmProgress(p){
    const points=[
      [0,0],
      [.38,.28],
      [.58,.56],
      [.90,.94],
      [1,.995]
    ];
    for(let i=1;i<points.length;i++){
      const [p1,t1]=points[i];
      const [p0,t0]=points[i-1];
      if(p<=p1){
        const local=smooth(clamp((p-p0)/(p1-p0)));
        return lerp(t0,t1,local);
      }
    }
    return .995;
  }

  async function loadFilm(){
    if(loading||duration||reduce.matches||mobile.matches)return;
    loading=true;
    root.dataset.loading='true';
    try{
      const count=Math.max(1,Number(video.dataset.parts||0));
      const paths=Array.from({length:count},(_,i)=>`media/into-signal/part-${String(i).padStart(3,'0')}.b64`);
      const parts=await Promise.all(paths.map(async path=>{
        const response=await fetch(path,{cache:'force-cache'});
        if(!response.ok)throw new Error(`MOVX signal media part failed: ${path}`);
        return (await response.text()).trim();
      }));
      const binary=atob(parts.join(''));
      const bytes=new Uint8Array(binary.length);
      for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      mediaUrl=URL.createObjectURL(new Blob([bytes],{type:'video/mp4'}));
      video.src=mediaUrl;
      video.load();
    }catch(error){
      root.dataset.mediaError='true';
      console.error(error);
    }finally{
      loading=false;
      delete root.dataset.loading;
    }
  }

  function measureProgress(){
    const rect=root.getBoundingClientRect();
    const travel=Math.max(1,root.offsetHeight-innerHeight);
    return clamp(-rect.top/travel);
  }

  function render(){
    scheduled=false;
    if(!active||reduce.matches||mobile.matches||!duration)return;
    const p=measureProgress();
    const target=Math.min(duration-.02,Math.max(.001,mapFilmProgress(p)*duration));
    if(Number.isFinite(target)&&Math.abs(video.currentTime-target)>.018){
      try{video.currentTime=target}catch(_){/* metadata race; next scroll retries */}
    }
    const intro=clamp(p/.42);
    const scale=lerp(.965,1.012,smooth(intro));
    const rx=lerp(1.15,0,smooth(intro));
    const ry=lerp(-1.65,0,smooth(intro));
    const handoff=smooth(clamp((p-.89)/.11));
    root.style.setProperty('--signal-progress',p.toFixed(4));
    root.style.setProperty('--signal-scale',scale.toFixed(4));
    root.style.setProperty('--signal-rx',`${rx.toFixed(3)}deg`);
    root.style.setProperty('--signal-ry',`${ry.toFixed(3)}deg`);
    root.style.setProperty('--signal-handoff',handoff.toFixed(4));
    root.dataset.progress=p.toFixed(3);
  }

  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(render);
  }

  const observer=new IntersectionObserver(entries=>{
    active=entries.some(entry=>entry.isIntersecting);
    if(active){loadFilm();schedule();}
  },{rootMargin:'35% 0px 35% 0px'});
  observer.observe(root);

  function applyMode(){
    const fallback=reduce.matches||mobile.matches;
    root.dataset.mode=fallback?'static':'scrub';
    if(fallback){
      root.style.removeProperty('--signal-handoff');
      root.style.removeProperty('--signal-progress');
      return;
    }
    loadFilm();
    schedule();
  }

  video.muted=true;
  video.playsInline=true;
  video.controls=false;
  video.pause();
  video.addEventListener('loadedmetadata',()=>{
    duration=Number.isFinite(video.duration)?video.duration:0;
    root.dataset.duration=duration.toFixed(3);
    if(duration){
      try{video.currentTime=.001}catch(_){/* no-op */}
      root.dataset.ready='true';
      schedule();
    }
  },{once:true});
  video.addEventListener('play',()=>video.pause());

  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  reduce.addEventListener?.('change',applyMode);
  mobile.addEventListener?.('change',applyMode);
  addEventListener('pagehide',()=>{if(mediaUrl)URL.revokeObjectURL(mediaUrl)},{once:true});
  applyMode();
}
