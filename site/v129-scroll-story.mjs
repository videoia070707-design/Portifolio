/* MOVX v129 — scroll-linked editorial overlay choreography.
   Reads the existing Scroll World progress; it never drives the video itself. */
const world=document.querySelector('[data-movx-scroll-world="v117"]');
if(world){
  const cards=[...world.querySelectorAll('[data-world-story]')];
  const clamp=x=>Math.max(0,Math.min(1,x));
  const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
  let active=false,raf=0,disposed=false;

  const geometryProgress=()=>{
    const length=Math.max(1,world.offsetHeight-innerHeight);
    return clamp(-world.getBoundingClientRect().top/length);
  };
  const currentProgress=()=>{
    const fromRuntime=Number(world.dataset.worldProgress);
    return Number.isFinite(fromRuntime)?clamp(fromRuntime):geometryProgress();
  };

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
      const enter=smooth((local-.06)/.20);
      const leaveStart=index===n-1?.84:.72;
      const leave=1-smooth((local-leaveStart)/Math.max(.01,1-leaveStart));
      const alpha=clamp(enter*leave);
      const shift=(1-enter)*30-smooth((local-.66)/.28)*14;
      const scale=.985+enter*.015;
      card.style.setProperty('--story-opacity',alpha.toFixed(4));
      card.style.setProperty('--story-shift',`${shift.toFixed(2)}px`);
      card.style.setProperty('--story-scale',scale.toFixed(4));
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
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0}else start()});
  addEventListener('pagehide',()=>{
    disposed=true;observer.disconnect();if(raf)cancelAnimationFrame(raf);
  },{once:true});
}
