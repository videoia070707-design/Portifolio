/* MOVX v58 — perceptual motion controller
   Makes section motion clearly perceptible through media/decorative layers while keeping copy static. */
(()=>{
  const root=document.documentElement;
  root.classList.add('movx-v58');
  root.dataset.movxPerceptualMotion='v58';
  root.dataset.movxBuild='v58-perceptual-motion';
  const reduced=new URLSearchParams(location.search).has('static')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop=matchMedia('(min-width:981px)').matches;
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
  const sections=[
    ['hero',document.querySelector('#heroTop')],['living',document.querySelector('#livingArchive')],['territories',document.querySelector('#nicheIndex')],['archive',document.querySelector('#archiveControls')],['selected',document.querySelector('.projects-list')],['about',document.querySelector('#about')],['services',document.querySelector('#services')],['process',document.querySelector('#process')],['contact',document.querySelector('#contact')]
  ].filter(([,el])=>el);
  let raf=0,lastY=scrollY,lastT=performance.now(),velocity=0;
  function sectionProgress(el){const r=el.getBoundingClientRect();const total=Math.max(1,r.height+innerHeight);return clamp((innerHeight-r.top)/total,0,1);}
  function sectionFocus(el){const r=el.getBoundingClientRect();const c=r.top+r.height*.5;const d=Math.abs(c-innerHeight*.5);return clamp(1-d/(innerHeight*.82),0,1);}
  function applyMediaParallax(scope,progress,focus){
    if(!scope||!desktop||reduced)return;
    [...scope.querySelectorAll('.media-reveal')].slice(0,18).forEach((el,i)=>{
      const local=((i%5)-2)*1.8;
      const y=((.5-progress)*22)+local*focus;
      const scale=1+focus*.012;
      el.style.setProperty('--v58-media-y',`${y.toFixed(2)}px`);
      el.style.setProperty('--v58-media-scale',scale.toFixed(4));
      if(scope.matches?.('.projects-list')){
        el.style.setProperty('--v58-tilt-x',`${((.5-progress)*1.2).toFixed(2)}deg`);
        el.style.setProperty('--v58-tilt-y',`${((((i%2)?1:-1)*focus*1.35)+velocity*.18).toFixed(2)}deg`);
      }
    });
    if(scope.id==='nicheIndex'){
      [...scope.querySelectorAll('.niche-card')].forEach((card,i)=>{
        const y=((.5-progress)*18)+((i%3)-1)*2.2*focus;
        card.style.setProperty('--v58-media-y',`${y.toFixed(2)}px`);
        card.style.setProperty('--v58-media-scale-add',(focus*.012).toFixed(4));
      });
    }
  }
  function paint(){
    raf=0;
    const now=performance.now(),dt=Math.max(16,now-lastT),dy=scrollY-lastY;
    velocity=clamp(dy/dt,-2.4,2.4);lastY=scrollY;lastT=now;
    root.style.setProperty('--v58-velocity',velocity.toFixed(3));
    let best=null,bestFocus=-1;
    sections.forEach(([name,el])=>{
      const p=sectionProgress(el),f=sectionFocus(el);
      el.style.setProperty('--v58-progress',p.toFixed(4));
      el.style.setProperty('--v58-focus',f.toFixed(4));
      if(f>bestFocus){bestFocus=f;best=[name,el];}
      applyMediaParallax(el,p,f);
    });
    sections.forEach(([,el])=>el.dataset.v58Active='false');
    if(best&&bestFocus>.28){best[1].dataset.v58Active='true';root.dataset.v58Chapter=best[0];}else root.dataset.v58Chapter='';
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(paint);}
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
  Promise.resolve(document.fonts?.ready).catch(()=>{}).finally(schedule);
  setTimeout(schedule,350);
  window.__MOVX_V58_PERCEPTION__={sample(){
    const data={build:root.dataset.movxBuild||'',chapter:root.dataset.v58Chapter||'',velocity:Number(getComputedStyle(root).getPropertyValue('--v58-velocity')||0),sections:{}};
    sections.forEach(([name,el])=>{const cs=getComputedStyle(el);data.sections[name]={progress:Number(cs.getPropertyValue('--v58-progress')||0),focus:Number(cs.getPropertyValue('--v58-focus')||0),active:el.dataset.v58Active==='true'};});
    const current=document.querySelector('#process .process-list li.v55-current');
    data.process=current?{index:[...current.parentElement.children].indexOf(current),opacity:parseFloat(getComputedStyle(current).opacity||'1')}:{index:-1,opacity:0};
    data.serviceActive=[...document.querySelectorAll('#services .service-row.v42-reading')].map(el=>parseFloat(getComputedStyle(el).opacity||'1'));
    const grid=document.querySelector('#contact .contact-grid');
    data.contact=grid?{gridOpacity:parseFloat(getComputedStyle(grid).opacity||'1')}:null;
    return data;
  }};
})();
