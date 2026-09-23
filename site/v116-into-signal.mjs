// MOVX v116 — Into the Signal scroll-film
// Owns only this section's paused-video seek + local presentation variables.
// No Lenis, GSAP/ScrollTrigger owner, autoplay, interval, or global RAF loop.
(() => {
  const section=document.querySelector('[data-movx-signal-film]');
  if(!section)return;
  const video=section.querySelector('.movx-signal-film__video');
  const counter=section.querySelector('.movx-signal-film__counter');
  if(!video)return;

  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const desktop=matchMedia('(min-width: 768px)');
  const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
  const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
  const mix=(a,b,t)=>a+(b-a)*t;
  const VIDEO_SRC='media/into-the-signal-scroll.mp4';

  let duration=4.3;
  let scheduled=0;
  let loaded=false;
  let near=false;

  const enhanced=()=>desktop.matches&&!reduced.matches;

  function timeline(p){
    // Preserve the CRT wall, cross the flash quickly, then give the archive room.
    if(p<=.45)return mix(0,1.82,smooth(p/.45));
    if(p<=.60)return mix(1.82,2.68,smooth((p-.45)/.15));
    if(p<=.92)return mix(2.68,4.04,smooth((p-.60)/.32));
    return mix(4.04,Math.max(4.05,duration-.035),smooth((p-.92)/.08));
  }

  function ensureVideo(){
    if(loaded||!enhanced()||!near)return;
    loaded=true;
    video.src=VIDEO_SRC;
    video.preload='auto';
    video.load();
  }

  function staticState(){
    section.dataset.mode='static';
    section.style.setProperty('--movx-signal-progress','0');
    section.style.setProperty('--movx-signal-scale','1');
    section.style.setProperty('--movx-signal-tilt-y','0deg');
    section.style.setProperty('--movx-signal-tilt-x','0deg');
    section.style.setProperty('--movx-signal-shift-y','0px');
    section.style.setProperty('--movx-signal-exit','0');
    delete root.dataset.movxSignalActive;
    if(counter)counter.textContent='00';
    try{video.pause()}catch(_){ }
  }

  function render(){
    scheduled=0;
    if(!enhanced()){staticState();return}
    ensureVideo();

    const rect=section.getBoundingClientRect();
    const range=Math.max(1,section.offsetHeight-innerHeight);
    const p=clamp(-rect.top/range);
    const intro=smooth(p/.22);
    const exit=smooth((p-.94)/.06);
    const active=rect.top<=1&&rect.bottom>=innerHeight-1;

    section.dataset.mode='scrub';
    section.dataset.progress=p.toFixed(4);
    section.style.setProperty('--movx-signal-progress',p.toFixed(4));
    section.style.setProperty('--movx-signal-scale',(1.026-.026*intro+.006*smooth((p-.6)/.3)).toFixed(4));
    section.style.setProperty('--movx-signal-tilt-y',`${(-1.6*(1-intro)).toFixed(3)}deg`);
    section.style.setProperty('--movx-signal-tilt-x',`${(.42*(1-intro)).toFixed(3)}deg`);
    section.style.setProperty('--movx-signal-shift-y',`${(1.2*(1-intro)).toFixed(3)}vh`);
    section.style.setProperty('--movx-signal-exit',exit.toFixed(4));
    if(active)root.dataset.movxSignalActive='1'; else delete root.dataset.movxSignalActive;
    if(counter)counter.textContent=String(Math.round(p*100)).padStart(2,'0');

    if(video.readyState>=1){
      const target=clamp(timeline(p),0,Math.max(0,duration-.035));
      if(Math.abs(video.currentTime-target)>.012){
        try{video.pause();video.currentTime=target}catch(_){ }
      }
    }
  }

  function schedule(){if(!scheduled)scheduled=requestAnimationFrame(render)}

  const proximity=new IntersectionObserver(entries=>{
    near=entries.some(entry=>entry.isIntersecting);
    if(near){ensureVideo();schedule()}
  },{rootMargin:'120% 0px 120% 0px',threshold:0});
  proximity.observe(section);

  video.muted=true;
  video.playsInline=true;
  video.controls=false;
  video.addEventListener('loadedmetadata',()=>{
    if(Number.isFinite(video.duration)&&video.duration>.5)duration=video.duration;
    section.dataset.duration=duration.toFixed(3);
    section.dataset.videoReady='1';
    video.pause();
    schedule();
  },{passive:true});
  video.addEventListener('play',()=>video.pause(),{passive:true});

  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  reduced.addEventListener?.('change',schedule);
  desktop.addEventListener?.('change',schedule);
  addEventListener('pagehide',()=>{proximity.disconnect();if(scheduled)cancelAnimationFrame(scheduled);delete root.dataset.movxSignalActive},{once:true});

  staticState();
  schedule();
})();
