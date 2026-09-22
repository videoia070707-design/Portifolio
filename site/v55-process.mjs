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
    // The process is a normal reading list: highlight the step in view,
    // not a percentage of a retired pinned journey.
    let nearest=0, distance=Infinity;
    rows.forEach((row,index)=>{
      const r=row.getBoundingClientRect();
      const d=Math.abs(r.top+r.height*.5-innerHeight*.52);
      if(d<distance){distance=d;nearest=index;}
    });
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
  window.MOVX_MOTION_BRIDGE?.subscribe(sync);
}

init();
