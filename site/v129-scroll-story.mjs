/* MOVX v132 — scroll-linked cinematic editorial choreography.
   Reads the existing Scroll World progress; it never drives the video itself. */
const world=document.querySelector('[data-movx-scroll-world="v117"]');
if(world){
  const cards=[...world.querySelectorAll('[data-world-story]')];
  const clamp=x=>Math.max(0,Math.min(1,x));
  const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
  const smoother=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10)};
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
      const enter=phase(local,.018,reduced.matches?.06:.145);
      const leaveStart=index===n-1?.91:.825;
      const exit=phase(local,leaveStart,Math.max(.01,1-leaveStart));
      const leave=1-exit;
      const alpha=clamp(enter*leave);
      const direction=index<2?-1:1;

      /* Copy sharpens early, then holds long enough to be read before exiting. */
      const kickerIn=phase(local,.018,reduced.matches?.05:.085);
      const titleIn=phase(local,.045,reduced.matches?.06:.13);
      const lineIn=phase(local,.115,reduced.matches?.06:.125);
      const kickerAlpha=clamp(kickerIn*leave);
      const titleAlpha=clamp(titleIn*leave);
      const lineAlpha=clamp(lineIn*leave);

      const drift=smoother(local);
      const x=reduced.matches?0:direction*((1-enter)*18+exit*9)+(drift-.5)*direction*2.2;
      const y=reduced.matches?0:(1-enter)*22-exit*10;
      const scale=reduced.matches?1:.984+enter*.016-exit*.006;
      const rot=reduced.matches?0:direction*((1-enter)*-.28+exit*.12);
      const titleBlur=reduced.matches?0:(1-titleIn)*5+exit*1.25;
      const titleClip=reduced.matches?0:(1-titleIn)*18;
      const scrim=alpha<.01?0:Math.min(1,.32+alpha*.72);

      card.style.setProperty('--story-opacity',alpha.toFixed(4));
      card.style.setProperty('--story-x',`${x.toFixed(2)}px`);
      card.style.setProperty('--story-y',`${y.toFixed(2)}px`);
      card.style.setProperty('--story-scale',scale.toFixed(4));
      card.style.setProperty('--story-rot',`${rot.toFixed(3)}deg`);
      card.style.setProperty('--story-scrim-opacity',scrim.toFixed(4));
      card.style.setProperty('--story-kicker-opacity',kickerAlpha.toFixed(4));
      card.style.setProperty('--story-kicker-y',`${((1-kickerIn)*10-exit*3).toFixed(2)}px`);
      card.style.setProperty('--story-title-opacity',titleAlpha.toFixed(4));
      card.style.setProperty('--story-title-y',`${((1-titleIn)*22-exit*5).toFixed(2)}px`);
      card.style.setProperty('--story-title-blur',`${titleBlur.toFixed(2)}px`);
      card.style.setProperty('--story-title-clip',`${titleClip.toFixed(2)}%`);
      card.style.setProperty('--story-line-opacity',lineAlpha.toFixed(4));
      card.style.setProperty('--story-line-y',`${((1-lineIn)*14-exit*4).toFixed(2)}px`);
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
