/* MOVX v130 — scroll-linked cinematic editorial choreography.
   Reads the existing Scroll World progress; it never drives the video itself. */
const world=document.querySelector('[data-movx-scroll-world="v117"]');
if(world){
  const cards=[...world.querySelectorAll('[data-world-story]')];
  const clamp=x=>Math.max(0,Math.min(1,x));
  const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let active=false,raf=0,disposed=false;

  const geometryProgress=()=>{
    const length=Math.max(1,world.offsetHeight-innerHeight);
    return clamp(-world.getBoundingClientRect().top/length);
  };
  const currentProgress=()=>{
    const fromRuntime=Number(world.dataset.worldProgress);
    return Number.isFinite(fromRuntime)?clamp(fromRuntime):geometryProgress();
  };
  const phase=(local,start,duration)=>smooth((local-start)/duration);

  function render(){
    raf=0;
    if(disposed||!active)return;
    const p=currentProgress();
    const n=Math.max(1,cards.length);
    let strongest=0,strongestIndex=0;

    cards.forEach((card,index)=>{
      const start=index/n;
      const end=(index+1)/n;
      const local=clamp((p-start)/(end-start));
      const enter=phase(local,.025,reduced.matches ? .08 : .20);
      const leaveStart=index===n-1?.88:.78;
      const leave=1-phase(local,leaveStart,Math.max(.01,1-leaveStart));
      const alpha=clamp(enter*leave);
      const direction=index<2?-1:1;
      const exit=phase(local,leaveStart,Math.max(.01,1-leaveStart));

      const kickerIn=phase(local,.02,reduced.matches ? .06 : .12);
      const titleIn=phase(local,.055,reduced.matches ? .08 : .18);
      const lineIn=phase(local,.15,reduced.matches ? .08 : .18);
      const kickerAlpha=clamp(kickerIn*leave);
      const titleAlpha=clamp(titleIn*leave);
      const lineAlpha=clamp(lineIn*leave);

      const x=reduced.matches?0:direction*((1-enter)*24+exit*10)+(local-.5)*direction*3;
      const y=reduced.matches?0:(1-enter)*30-exit*14;
      const scale=reduced.matches?1:.972+enter*.028-exit*.008;
      const rot=reduced.matches?0:direction*((1-enter)*-.55+exit*.18);
      const titleBlur=reduced.matches?0:(1-titleIn)*9+exit*2.5;
      const titleClip=reduced.matches?0:(1-titleIn)*30;

      card.style.setProperty('--story-opacity',alpha.toFixed(4));
      card.style.setProperty('--story-x',`${x.toFixed(2)}px`);
      card.style.setProperty('--story-y',`${y.toFixed(2)}px`);
      card.style.setProperty('--story-scale',scale.toFixed(4));
      card.style.setProperty('--story-rot',`${rot.toFixed(3)}deg`);
      card.style.setProperty('--story-scrim-opacity',Math.min(.96,alpha*.98).toFixed(4));
      card.style.setProperty('--story-kicker-opacity',kickerAlpha.toFixed(4));
      card.style.setProperty('--story-kicker-y',`${((1-kickerIn)*12-exit*5).toFixed(2)}px`);
      card.style.setProperty('--story-title-opacity',titleAlpha.toFixed(4));
      card.style.setProperty('--story-title-y',`${((1-titleIn)*28-exit*8).toFixed(2)}px`);
      card.style.setProperty('--story-title-blur',`${titleBlur.toFixed(2)}px`);
      card.style.setProperty('--story-title-clip',`${titleClip.toFixed(2)}%`);
      card.style.setProperty('--story-line-opacity',lineAlpha.toFixed(4));
      card.style.setProperty('--story-line-y',`${((1-lineIn)*18-exit*6).toFixed(2)}px`);
      card.dataset.storyVisible=alpha>.12?'true':'false';
      if(alpha>strongest){strongest=alpha;strongestIndex=index}
    });

    const storyChapter=strongest>.08?strongestIndex+1:Math.min(n,Math.floor(p*n)+1);
    world.dataset.storyChapter=String(storyChapter);
    world.dataset.storyOpacity=strongest.toFixed(4);
    raf=requestAnimationFrame(render);
  }

  const observer=new IntersectionObserver(entries=>{
    active=entries.some(entry=>entry.isIntersecting);
    if(active&&!raf)raf=requestAnimationFrame(render);
    if(!active&&raf){cancelAnimationFrame(raf);raf=0}
  },{rootMargin:'30% 0px',threshold:0});
  observer.observe(world);

  const start=()=>{if(active&&!raf)raf=requestAnimationFrame(render)};
  addEventListener('scroll',start,{passive:true});
  addEventListener('resize',start,{passive:true});
  reduced.addEventListener?.('change',start);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0}else start()});
  addEventListener('pagehide',()=>{
    disposed=true;observer.disconnect();if(raf)cancelAnimationFrame(raf);
  },{once:true});
}
