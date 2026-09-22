/* MOVX v92 — lightweight lower-chapter state owner
   The original v45 Three.js / GSAP stages have been visually retired since v84.
   Production keeps only service-reading state and compatibility classes. */

const root=document.documentElement;
root.classList.add('movx-v42','movx-v45','v45-runtime-ready','v92-runtime-retired');
root.dataset.movxImmersive='v92-dom-only';

const q=(s,c=document)=>c.querySelector(s);
const qa=(s,c=document)=>[...c.querySelectorAll(s)];

/* Remove any historical decorative stages that might survive source hydration. */
qa('.v42-parallax-layer,.v43-depth-stage,.v43-process-stage,.v43-journey-meter,.v44-css-stage,.v44-process-stage,.v45-css-stage,.v45-process-stage,.v45-contact-stage').forEach(node=>node.remove());

const services=q('.services-section');
const rows=services?qa('.service-row',services):[];
const list=services?q('.services-list',services):null;
let raf=0;

function syncServices(){
  raf=0;
  if(!services||!rows.length)return;
  const sectionRect=services.getBoundingClientRect();
  const visible=sectionRect.bottom>0&&sectionRect.top<innerHeight;
  if(!visible){
    rows.forEach(row=>{row.classList.remove('v42-reading','v45-current');});
    list?.classList.remove('v45-has-current');
    return;
  }
  let best=Infinity,current=0;
  rows.forEach((row,index)=>{
    const rect=row.getBoundingClientRect();
    const center=rect.top+rect.height*.5;
    const distance=Math.abs(center-innerHeight*.52);
    if(distance<best){best=distance;current=index;}
  });
  rows.forEach((row,index)=>{
    const active=index===current;
    row.classList.toggle('v42-reading',active);
    row.classList.toggle('v45-current',active);
  });
  list?.classList.toggle('v45-has-current',true);
}
function schedule(){if(!raf&&!document.hidden)raf=requestAnimationFrame(syncServices);}

syncServices();
addEventListener('scroll',schedule,{passive:true});
addEventListener('resize',schedule,{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
