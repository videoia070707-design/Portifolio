const section=document.querySelector('[data-movx-v116="film"]');
if(section){
  const video=section.querySelector('.into-signal-film__video');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=matchMedia('(max-width: 767px)');
  let duration=4.3;
  let raf=0;
  let lastTarget=-1;
  let active=false;

  const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
  const mix=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
  const segment=(p,a,b,x,y)=>mix(x,y,smooth((p-a)/(b-a)));
  const mapProgress=p=>{
    if(p<=.38)return segment(p,0,.38,0,.28);
    if(p<=.58)return segment(p,.38,.58,.28,.56);
    if(p<=.90)return segment(p,.58,.90,.56,.94);
    return segment(p,.90,1,.94,.995);
  };
  const mobileScale=p=>{
    if(p<=.38)return segment(p,0,.38,.98,1.08);
    if(p<=.58)return segment(p,.38,.58,1.08,1.72);
    if(p<=.90)return segment(p,.58,.90,1.72,1.16);
    return segment(p,.90,1,1.16,1.06);
  };

  function ensureMedia(){
    if(reduce.matches||video.src||!video.dataset.src)return;
    video.src=video.dataset.src;
    video.load();
  }

  function releaseMedia(){
    try{video.pause()}catch{}
    if(video.getAttribute('src')){
      video.removeAttribute('src');
      video.load();
      lastTarget=-1;
    }
  }

  function setMode(){
    const staticMode=reduce.matches;
    section.dataset.v116Mode=staticMode?'static':'scrub';
    section.dataset.v116Viewport=mobile.matches?'mobile':'desktop';
    if(staticMode){
      for(const name of ['--v116-scale','--v116-rx','--v116-ry','--v116-y','--v116-opacity','--v116-handoff','--v116-shade'])section.style.removeProperty(name);
      releaseMedia();
    }else if(active){
      ensureMedia();
    }
    schedule();
  }

  function render(){
    raf=0;
    if(section.dataset.v116Mode!=='scrub'||!active)return;
    const rect=section.getBoundingClientRect();
    const travel=Math.max(1,section.offsetHeight-innerHeight);
    const p=clamp(-rect.top/travel);
    const mediaP=mapProgress(p);
    const target=clamp(mediaP*duration,0,Math.max(0,duration-.015));
    if(video.readyState>=1&&Math.abs(target-lastTarget)>.008){
      try{video.currentTime=target;lastTarget=target}catch{}
    }

    const exit=smooth(clamp((p-.90)/.10));
    if(mobile.matches){
      const intro=smooth(clamp(p/.38));
      section.style.setProperty('--v116-scale',mobileScale(p).toFixed(4));
      section.style.setProperty('--v116-rx',`${mix(.55,0,intro).toFixed(3)}deg`);
      section.style.setProperty('--v116-ry',`${mix(-1.15,0,intro).toFixed(3)}deg`);
      section.style.setProperty('--v116-y',`${mix(.8,0,intro).toFixed(3)}vh`);
    }else{
      const settle=smooth(clamp(p/.58));
      section.style.setProperty('--v116-scale',mix(.935,1.018,settle).toFixed(4));
      section.style.setProperty('--v116-rx',`${mix(1.1,0,settle).toFixed(3)}deg`);
      section.style.setProperty('--v116-ry',`${mix(-.65,0,settle).toFixed(3)}deg`);
      section.style.setProperty('--v116-y',`${mix(1.4,0,settle).toFixed(3)}vh`);
    }

    section.style.setProperty('--v116-opacity',mix(1,0,exit).toFixed(4));
    section.style.setProperty('--v116-handoff',exit.toFixed(4));
    section.style.setProperty('--v116-shade',mix(.22,.08,smooth(clamp((p-.45)/.45))).toFixed(4));
    section.dataset.v116Progress=p.toFixed(4);
    section.dataset.v116Phase=p<.38?'signal':p<.58?'crossing':'archive';
  }

  function schedule(){if(!raf)raf=requestAnimationFrame(render)}

  const observer=new IntersectionObserver(entries=>{
    active=entries.some(entry=>entry.isIntersecting);
    if(active&&section.dataset.v116Mode==='scrub'){
      ensureMedia();
      schedule();
    }
  },{rootMargin:'75% 0px'});
  observer.observe(section);

  video.muted=true;
  video.playsInline=true;
  video.controls=false;
  video.disableRemotePlayback=true;
  video.addEventListener('loadedmetadata',()=>{
    if(Number.isFinite(video.duration)&&video.duration>0)duration=video.duration;
    if(section.dataset.v116Mode==='scrub'){
      try{video.pause();video.currentTime=0}catch{}
    }
    schedule();
  },{passive:true});
  video.addEventListener('play',()=>video.pause());
  video.addEventListener('error',()=>{section.dataset.v116Mode='poster'});

  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  reduce.addEventListener?.('change',setMode);
  mobile.addEventListener?.('change',setMode);
  setMode();
  document.documentElement.dataset.movxIntro='v116';
}
