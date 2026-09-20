/* MOVX v60 — lower-chapter runtime coordinator
   One restrained motion owner per chapter. Text stays planar; depth belongs to media
   and atmospheric layers only. */
(() => {
  'use strict';
  const root=document.documentElement;
  const gsap=window.gsap;
  const ScrollTrigger=window.ScrollTrigger;
  const reduced=new URLSearchParams(location.search).has('static')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop=matchMedia('(min-width:981px)').matches;
  const q=(s,c=document)=>c.querySelector(s);
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

  root.classList.add('movx-v48','movx-v59','movx-v60');
  root.dataset.movxSpatialPolish='v60-coordinated';
  root.dataset.movxExperience='v60-editorial-motion';

  /* Process ownership + final editorial cleanup. */
  const style=document.createElement('style');
  style.id='movx-v60-runtime-style';
  style.textContent=`
    html.v60-process-owned .v49-journey-stage{opacity:0!important;visibility:hidden!important}
    html.v60-process-owned #process .v55-process-canvas{visibility:visible!important}
    @media (min-width:981px){
      html.movx-v60 #process .v55-process-journey{min-height:470vh!important}
      html.movx-v60 #process .v55-process-hud{display:none!important}
      html.movx-v60 #process .process-list{max-width:700px!important}
      html.movx-v60 #process .process-list li{
        display:grid!important;grid-template-columns:58px minmax(0,1fr)!important;
        gap:clamp(18px,2vw,30px)!important;align-items:start!important;
        min-height:clamp(188px,23vh,238px)!important;padding:clamp(30px,3.8vh,42px) 0!important;
        border:0!important;background:transparent!important;backdrop-filter:none!important;
        -webkit-backdrop-filter:none!important;box-shadow:none!important
      }
      html.movx-v60 #process .process-list li::before,html.movx-v60 #process .process-list li::after{display:none!important}
      html.movx-v60 #process .process-list li>span{
        position:relative!important;display:block!important;padding-top:8px!important;
        font-size:10px!important;line-height:1!important;letter-spacing:.16em!important;
        color:color-mix(in srgb,var(--fg) 34%,var(--muted))!important
      }
      html.movx-v60 #process .process-list li>span::after{display:none!important}
      html.movx-v60 #process .process-list li>div{display:block!important;padding:0!important;min-width:0!important}
      html.movx-v60 #process .process-list strong{
        display:block!important;max-width:12ch!important;margin:0 0 15px!important;
        font-family:var(--serif,Georgia,'Times New Roman',serif)!important;
        font-size:clamp(38px,3.5vw,56px)!important;font-weight:400!important;line-height:.94!important;
        letter-spacing:-.058em!important;color:color-mix(in srgb,var(--fg) 72%,var(--muted))!important
      }
      html.movx-v60 #process .process-list p{
        max-width:40ch!important;margin:0!important;font-size:clamp(13px,1vw,15px)!important;
        line-height:1.7!important;color:color-mix(in srgb,var(--fg) 54%,var(--muted))!important
      }
      html.movx-v60 #process .process-list li.v55-current>span{color:var(--editorial-red)!important}
      html.movx-v60 #process .process-list li.v55-current strong{color:var(--fg)!important}
      html.movx-v60 #process .process-list li.v55-current p{color:color-mix(in srgb,var(--fg) 72%,var(--muted))!important}
      html.movx-v60 #process .v55-process-canvas{opacity:var(--v55-canvas-o,.28)!important;filter:contrast(1.01) saturate(.62)!important}
    }
  `;
  document.head.appendChild(style);

  function syncProcessOwnership(){
    const owns=root.dataset.movxJourneyChapter==='process'&&!!q('#process .v55-process-journey');
    root.classList.toggle('v60-process-owned',owns);
  }
  syncProcessOwnership();
  if('MutationObserver'in window)new MutationObserver(syncProcessOwnership).observe(root,{attributes:true,attributeFilter:['data-movx-journey-chapter']});

  /* Quiet chapter seams. */
  const chapters=['.about-section','.services-section','.process-section','.contact-section'].map(s=>q(s)).filter(Boolean);
  if(gsap&&ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);
    if(!reduced&&desktop){
      chapters.forEach((section,index)=>{
        let seam=q(':scope > .v48-depth-seam',section);
        if(!seam){seam=document.createElement('div');seam.className='v48-depth-seam';seam.setAttribute('aria-hidden','true');section.insertBefore(seam,section.firstChild);}
        const dir=index%2?-1:1;
        gsap.fromTo(seam,
          {'--v48-seam-y':`${dir*34}px`,'--v48-seam-z':'-80px','--v48-seam-s':.62,'--v48-seam-o':.035},
          {'--v48-seam-y':`${dir*-18}px`,'--v48-seam-z':'42px','--v48-seam-s':1,'--v48-seam-o':.18,ease:'none',scrollTrigger:{trigger:section,start:'top 94%',end:'top 24%',scrub:1.35,invalidateOnRefresh:true}}
        );
      });
    }
  }else root.classList.add('v48-motion-fallback');

  let refreshRaf=0;
  const scheduleRefresh=()=>{
    if(!ScrollTrigger||refreshRaf)return;
    refreshRaf=requestAnimationFrame(()=>{refreshRaf=0;ScrollTrigger.refresh();});
  };
  if(document.fonts?.ready)document.fonts.ready.then(scheduleRefresh).catch(()=>{});
  addEventListener('load',scheduleRefresh,{once:true});
  addEventListener('resize',scheduleRefresh,{passive:true});
  [...document.querySelectorAll('.about-section img,.services-section img,.process-section img,.contact-section img')].forEach(img=>{if(!img.complete)img.addEventListener('load',scheduleRefresh,{once:true,passive:true});});

  /* Damped media movement; copy never receives transforms. */
  const selectors=[
    '#heroTop .hero-media','#heroTop .hero-art','#heroTop .hero-visual','#heroTop .hero-image','#heroTop .hero-collage',
    '#livingArchive .media-reveal','#nicheIndex .niche-card__media img','#archiveGrid .media-reveal',
    '.projects-list .media-reveal','.projects-list .project-cover img'
  ].join(',');
  const state=new Map();let raf=0;
  const media=()=>[...document.querySelectorAll(selectors)].filter(el=>!el.closest('#caseViewer,#process'));
  function clearMotion(){media().forEach(el=>{el.style.removeProperty('translate');el.style.removeProperty('will-change');});state.clear();}
  function targetFor(el){const r=el.getBoundingClientRect();const center=r.top+r.height*.5;const n=clamp((center-innerHeight*.5)/Math.max(innerHeight,.001),-.9,.9);return-n*(el.closest('#heroTop')?20:12);}
  function tick(){
    raf=0;if(!desktop||reduced||document.hidden)return;
    let moving=false;const items=media(),alive=new Set(items);
    items.forEach((el,index)=>{
      const rect=el.getBoundingClientRect();if(rect.bottom<-innerHeight*.18||rect.top>innerHeight*1.18)return;
      let s=state.get(el);if(!s){const initial=targetFor(el);s={y:initial,target:initial};state.set(el,s);el.style.willChange='translate';}
      s.target=targetFor(el)+(((index%3)-1)*.55);s.y+=(s.target-s.y)*.055;
      if(Math.abs(s.target-s.y)>.025)moving=true;el.style.translate=`0 ${s.y.toFixed(2)}px`;
    });
    for(const el of state.keys())if(!alive.has(el))state.delete(el);
    if(moving)schedule();
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(tick);}
  if(!desktop||reduced)clearMotion();
  else{
    addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
    const hosts=['#loopWall','#archiveGrid','#projectsList'].map(s=>q(s)).filter(Boolean);
    if('MutationObserver'in window&&hosts.length){const observer=new MutationObserver(schedule);hosts.forEach(host=>observer.observe(host,{childList:true,subtree:true}));}
    Promise.resolve(document.fonts?.ready).catch(()=>{}).finally(schedule);setTimeout(schedule,420);
  }

  root.classList.add('v48-runtime-ready','v60-runtime-ready');
})();
