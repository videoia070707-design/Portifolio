const shots=[...document.querySelectorAll('[data-shot]')];
const root=document.documentElement;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');

const setActive=shot=>{
  shots.forEach(node=>node.classList.toggle('is-active',node===shot));
  root.dataset.activeShot=shot?.dataset.shot||'00';
};

if(shots.length){
  setActive(shots[0]);
  const observer=new IntersectionObserver(entries=>{
    const visible=entries
      .filter(entry=>entry.isIntersecting)
      .sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(visible)setActive(visible.target);
  },{threshold:[.2,.4,.6,.8]});
  shots.forEach(shot=>observer.observe(shot));

  let raf=0;
  const sync=()=>{
    raf=0;
    if(reduced.matches)return;
    for(const shot of shots){
      const sticky=shot.querySelector('.shot__sticky');
      if(!sticky)continue;
      const rect=shot.getBoundingClientRect();
      const travel=Math.max(1,shot.offsetHeight-innerHeight);
      const p=Math.min(1,Math.max(0,-rect.top/travel));
      sticky.style.setProperty('--shot-progress',p.toFixed(4));
      if(shot.dataset.shot==='01'){
        sticky.style.setProperty('--camera-z',`${(p*46).toFixed(2)}px`);
      }else if(shot.dataset.shot==='02'){
        sticky.style.setProperty('--camera-z',`${(p*82).toFixed(2)}px`);
      }else{
        sticky.style.setProperty('--camera-z',`${(p*32).toFixed(2)}px`);
      }
    }
  };
  const schedule=()=>{if(!raf)raf=requestAnimationFrame(sync)};
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  reduced.addEventListener?.('change',schedule);
  sync();
  addEventListener('pagehide',()=>{
    observer.disconnect();
    cancelAnimationFrame(raf);
    removeEventListener('scroll',schedule);
    removeEventListener('resize',schedule);
    reduced.removeEventListener?.('change',schedule);
  },{once:true});
}
