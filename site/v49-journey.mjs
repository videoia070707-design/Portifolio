/* MOVX v91 — lightweight chapter wrapper
   The historical v49 WebGL journey is visually retired by later art direction.
   Keep only the semantic wrapper/current-chapter state that downstream CSS may use.
   Add ?legacy3d only as a documented historical flag; the production path stays DOM-only. */

const root=document.documentElement;
root.classList.add('movx-v49','v49-editorial-fallback','v91-runtime-retired');
root.dataset.movxJourney='v91-dom-only';

const q=(s,c=document)=>c.querySelector(s);
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));

function buildJourneyWrapper(){
  const about=q('.about-section');
  const services=q('.services-section');
  const process=q('.process-section');
  const contact=q('.contact-section');
  if(!about||!services||!process||!contact)return null;
  let journey=q('.v49-journey');
  if(!journey){
    journey=document.createElement('div');
    journey.className='v49-journey';
    about.parentNode.insertBefore(journey,about);
    [about,services,process,contact].forEach(section=>journey.append(section));
  }
  return {journey,about,services,process,contact};
}

const refs=buildJourneyWrapper();
if(refs){
  const sections=[refs.about,refs.services,refs.process,refs.contact];
  const labels=['about','services','process','contact'];
  let raf=0;
  const sync=()=>{
    raf=0;
    let best=Infinity,current=0;
    sections.forEach((section,index)=>{
      const rect=section.getBoundingClientRect();
      const center=rect.top+rect.height*.5;
      const distance=Math.abs(center-innerHeight*.5);
      if(distance<best){best=distance;current=index;}
    });
    sections.forEach((section,index)=>section.classList.toggle('v49-current',index===current));
    root.dataset.movxJourneyChapter=labels[current]||'about';
  };
  window.MOVX_MOTION_BRIDGE?.subscribe(sync);
}
