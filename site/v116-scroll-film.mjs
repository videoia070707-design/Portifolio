const section=document.querySelector('[data-movx-v116="film"]');
if(section){
  const video=section.querySelector('.into-signal-film__video');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=matchMedia('(max-width: 767px)');
  let duration=4.3;
  let raf=0;
  let lastTarget=-1;
  const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
  const mix=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
  const segment=(p,a,b,x,y)=>mix(x,y,smooth((p-a)/(b-a)));
  const mapProgress=p=>{
    if(p<=.40)return segment(p,0,.40,0,.49);
    if(p<=.62)return segment(p,.40,.62,.49,.66);
    if(p<=.91)return segment(p,.62,.91,.66,.94);
    return segment(p,.91,1,.94,.995);
  };
  function setMode(){
    const staticMode=reduce.matches||mobile.matches;
    section.dataset.v116Mode=staticMode?'static':'scrub';
    if(staticMode){
      for(const name of ['--v116-scale','--v116-rx','--v116-ry','--v116-y','--v116-opacity','--v116-handoff'])section.style.removeProperty(name);
      try{video.pause()}catch{}
      if(video.readyState>=1){try{video.currentTime=0}catch{}}
    }
    schedule();
  }
  function render(){
    raf=0;
    if(section.dataset.v116Mode!=='scrub')return;
    const rect=section.getBoundingClientRect();
    const travel=Math.max(1,section.offsetHeight-innerHeight);
    const p=clamp(-rect.top/travel);
    const mediaP=mapProgress(p);
    const target=clamp(mediaP*duration,0,Math.max(0,duration-.015));
    if(video.readyState>=1&&Math.abs(target-lastTarget)>.008){try{video.currentTime=target;lastTarget=target}catch{}}
    const settle=smooth(clamp(p/.66));
    const exit=smooth(clamp((p-.90)/.10));
    section.style.setProperty('--v116-scale',mix(.935,1.018,settle).toFixed(4));
    section.style.setProperty('--v116-rx',`${mix(1.1,0,settle).toFixed(3)}deg`);
    section.style.setProperty('--v116-ry',`${mix(-.65,0,settle).toFixed(3)}deg`);
    section.style.setProperty('--v116-y',`${mix(1.4,0,settle).toFixed(3)}vh`);
    section.style.setProperty('--v116-opacity',mix(1,0,exit).toFixed(4));
    section.style.setProperty('--v116-handoff',exit.toFixed(4));
    section.style.setProperty('--v116-shade',mix(.22,.08,smooth(clamp((p-.45)/.45))).toFixed(4));
    section.dataset.v116Progress=p.toFixed(4);
    section.dataset.v116Phase=p<.40?'signal':p<.62?'crossing':'archive';
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(render)}
  video.addEventListener('loadedmetadata',()=>{
    if(Number.isFinite(video.duration)&&video.duration>0)duration=video.duration;
    if(section.dataset.v116Mode==='scrub'){try{video.pause();video.currentTime=0}catch{}}
    schedule();
  },{passive:true});
  video.addEventListener('error',()=>{section.dataset.v116Mode='poster'});
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  reduce.addEventListener?.('change',setMode);
  mobile.addEventListener?.('change',setMode);
  setMode();
  video.load();
  document.documentElement.dataset.movxIntro='v116';
}
