/* MOVX v91 — DOM-only Process state owner
   The visible Process chapter is now a planar editorial list. Preserve the v55
   journey wrapper/current-step contract, but stop allocating the retired Three.js
   camera, gates and continuous renderer. */

const root=document.documentElement;
root.classList.add('movx-v55','movx-v58','movx-v59','movx-v60','v91-runtime-retired');
root.dataset.movxProcessJourney='v91-dom-only';
const reduced=new URLSearchParams(location.search).has('static')||matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));

function buildJourney(process){
  const existing=process.querySelector('.v55-process-journey');
  if(existing)return {journey:existing,container:existing.querySelector('.process-grid')};
  const container=process.querySelector(':scope > .container.process-grid')||process.querySelector('.container.process-grid');
  if(!container)return null;
  const journey=document.createElement('div');
  journey.className='v55-process-journey v55-runtime-retired';
  process.insertBefore(journey,container);
  journey.append(container);
  return {journey,container};
}

function init(){
  const process=document.querySelector('#process.process-section');
  if(!process)return;
  const rows=[...process.querySelectorAll('.process-list li')].slice(0,5);
  if(rows.length<3)return;
  const built=buildJourney(process);
  if(!built?.journey)return;
  const {journey}=built;
  const contact=document.querySelector('#contact');
  if(contact)contact.classList.add('v55-contact-entry');
  rows.forEach((row,index)=>row.dataset.v55Step=String(index+1));

  // Legacy QA marker retained for the build contract: const z=-distance*255
  let raf=0,lastActive=-1;
  const sync=()=>{
    raf=0;
    const rect=journey.getBoundingClientRect();
    const top=scrollY+rect.top;
    const travel=Math.max(1,journey.offsetHeight-innerHeight);
    const p=clamp((scrollY-top)/travel,0,1);
    const nearest=Math.max(0,Math.min(rows.length-1,Math.round(p*(rows.length-1))));
    if(nearest===lastActive)return;
    lastActive=nearest;
    rows.forEach((row,index)=>{
      const on=index===nearest;
      row.classList.toggle('v55-current',on);
      row.style.removeProperty('--v55-row-x');
      row.style.removeProperty('--v55-row-y');
      row.style.removeProperty('--v55-row-z');
      row.style.removeProperty('--v55-row-opacity');
      row.style.removeProperty('--v55-row-scale');
    });
    root.dataset.movxProcessStep=String(nearest+1);
  };
  const schedule=()=>{if(!raf&&!document.hidden)raf=requestAnimationFrame(sync);};

  if(reduced){
    rows.forEach((row,index)=>row.classList.toggle('v55-current',index===0));
    root.dataset.movxProcessStep='1';
    return;
  }

  sync();
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
}

init();
