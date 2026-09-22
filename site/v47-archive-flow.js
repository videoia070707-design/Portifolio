/* Archive rules consume the central chapter clock. */
(() => {
  const root=document.documentElement;
  root.classList.add('movx-v47','movx-v61');
  root.dataset.movxArchiveFlow='v100-bridge';
  window.MOVX_MOTION_BRIDGE?.subscribe(snapshot=>{
    for(const key of ['archive','territories','directory']){
      const node=window.MOVX_MOTION_BRIDGE.getStageNode(key);
      const state=snapshot.stages.find(s=>s.key===key);
      if(!node||!state)continue;
      node.style.setProperty('--v47-flow',snapshot.reducedMotion?'1':String(state.progress));
      node.classList.toggle('v47-flow-current',snapshot.currentChapter===key);
    }
  });
})();

/* MOVX v62 — opening / archive / territories editorial polish
   Recent portfolio references reward scale, silence and coherent depth. This layer keeps
   the existing artwork-first identity while retiring object-like tilts from the first half. */
(() => {
  'use strict';
  const root=document.documentElement;
  const reduced=new URLSearchParams(location.search).has('static')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop=matchMedia('(min-width:981px)').matches;
  const hero=document.getElementById('heroTop');
  const heroStage=hero?.querySelector('.social-cover-art__stage');
  const archive=document.getElementById('livingArchive');
  const territories=document.getElementById('nicheIndex');
  const loopRows=archive?[...archive.querySelectorAll('.loop-row')]:[];
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));

  root.classList.add('movx-v62');
  root.dataset.movxOpeningPolish='v62-editorial-depth';

  if(!document.getElementById('movx-v62-opening-style')){
    const style=document.createElement('style');
    style.id='movx-v62-opening-style';
    style.textContent=`
      html.movx-v62 body{--v62-ease:cubic-bezier(.16,1,.3,1);--v62-ui:cubic-bezier(.4,0,.2,1);--v62-hero-exit:0}

      /* HERO — layered, but planar. Depth comes from differential vertical travel, not card rotation. */
      html.movx-v62 body[data-page="social"] #heroTop .social-cover-art{position:relative;isolation:isolate;overflow:hidden!important}
      html.movx-v62 body[data-page="social"] #heroTop .social-cover-art::after{
        content:"";position:absolute;inset:0;z-index:18;pointer-events:none;background:#090909;
        transform:scaleY(1);transform-origin:bottom center;
        transition:transform 1.34s var(--v62-ease) .08s;
      }
      html.movx-v62.v62-opening-ready body[data-page="social"] #heroTop .social-cover-art::after{transform:scaleY(0);transform-origin:top center}
      html.movx-v62 body[data-page="social"] #heroTop .social-cover-art__stage{perspective:none!important;transform-style:flat!important}
      html.movx-v62 body[data-page="social"] #heroTop .social-cover-art__image{
        transform:translate3d(0,var(--v39-hero-bg-y,0px),0) scale(1.04)!important;
        transform-origin:50% 48%!important;filter:saturate(.98) contrast(1.01);
      }
      html.movx-v62 body[data-page="social"] #heroTop .v28-hero-overlay{
        transform:translate3d(0,var(--v39-hero-y,0px),28px) scale(1.018)!important;
        transform-style:preserve-3d!important;opacity:calc(.94 - (var(--v62-hero-exit) * .18))!important;
      }
      html.movx-v62 body[data-page="social"] #heroTop .v28-hero-plane--type{
        transform:translate3d(0,var(--v39-type-y,0px),46px)!important;opacity:.27!important
      }
      html.movx-v62 body[data-page="social"] #heroTop .v28-hero-plane--crt{
        transform:translate3d(0,var(--v39-crt-y,0px),92px) scale(1.008)!important;opacity:.36!important
      }
      html.movx-v62 body[data-page="social"] #heroTop .v28-hero-plane--lower{
        transform:translate3d(0,var(--v39-lower-y,0px),68px)!important;opacity:.24!important
      }
      html.movx-v62 body[data-page="social"] #heroTop .v28-hero-grain{
        transform:translate3d(0,var(--v39-grain-y,0px),108px) scale(1.018)!important;opacity:.055!important
      }
      html.movx-v62 body[data-page="social"] #heroTop .social-cover-art__shade{opacity:calc(.92 - (var(--v62-hero-exit) * .16))!important}
      html.movx-v62 body[data-page="social"] #heroTop .hero-index__item{transition:opacity .8s var(--v62-ui)!important}
      html.movx-v62 body[data-page="social"] #heroTop .velocity-strip--social .velocity-track{opacity:.34!important}

      /* LIVING ARCHIVE — keep spatial travel but remove the tilting-wall effect. */
      html.movx-v62 body[data-page="social"] #livingArchive .loop-wall{perspective:1500px!important;perspective-origin:50% 52%}
      html.movx-v62 body[data-page="social"] #livingArchive .loop-row{
        transform:translate3d(0,var(--v39-row-y,0px),var(--v39-row-z,0px))!important;
        transform-origin:50% 50%!important;opacity:.38;filter:saturate(.9) contrast(.99);
        transition:opacity 1.16s var(--v62-ease),filter 1.2s var(--v62-ui)!important
      }
      html.movx-v62 body[data-page="social"] #livingArchive .loop-row.v62-row-visible{opacity:1;filter:none}
      html.movx-v62 body[data-page="social"] #livingArchive .loop-row:nth-child(2){transition-delay:80ms!important}
      html.movx-v62 body[data-page="social"] #livingArchive .loop-row:nth-child(3){transition-delay:150ms!important}
      html.movx-v62 body[data-page="social"] #livingArchive .loop-card img{transition:transform 1.55s var(--v62-ease),filter .95s var(--v62-ui)!important}
      html.movx-v62 body[data-page="social"] #livingArchive .loop-card:hover img,
      html.movx-v62 body[data-page="social"] #livingArchive .loop-card:focus-within img{transform:scale(1.01)!important}

      /* TERRITORIES — editorial image fields, not bordered tiles. */
      html.movx-v62 body[data-page="social"] #nicheIndex::before{
        transform:scaleX(var(--v47-flow,0));transform-origin:left center;opacity:.62!important;
        transition:none!important
      }
      html.movx-v62 body[data-page="social"] #nicheGrid>.niche-card,
      html.movx-v62 body[data-page="social"] #nicheGrid>.niche-card:nth-child(n){
        border:0!important;outline:0!important;box-shadow:none!important;background:#0d0b0b!important
      }
      html.movx-v62 body[data-page="social"] #nicheGrid>.niche-card::after{height:1px!important;opacity:.9}
      html.movx-v62 body[data-page="social"] #nicheGrid .niche-card__media{
        transform:translate3d(0,var(--v39-niche-y,0px),0) scale(1.01)!important;
        transform-style:flat!important;transform-origin:50% 50%!important
      }
      html.movx-v62 body[data-page="social"] #nicheGrid .niche-card__media img{
        transform:translate3d(0,var(--v39-niche-img-y,0px),0) scale(1.045)!important;
        filter:saturate(.96) contrast(1.015)!important;
        transition:transform 1.4s var(--v62-ease),filter .9s var(--v62-ui)!important
      }
      html.movx-v62 body[data-page="social"] #nicheGrid .niche-card:hover .niche-card__media img,
      html.movx-v62 body[data-page="social"] #nicheGrid .niche-card:focus-within .niche-card__media img,
      html.movx-v62 body[data-page="social"] #nicheGrid .niche-card.active .niche-card__media img{
        transform:translate3d(0,var(--v39-niche-img-y,0px),0) scale(1.055)!important;
        filter:saturate(1) contrast(1.02)!important
      }
      html.movx-v62 body[data-page="social"] #nicheGrid:has(.niche-card:hover)>.niche-card{opacity:.9!important}
      html.movx-v62 body[data-page="social"] #nicheGrid:has(.niche-card:hover)>.niche-card:hover{opacity:1!important}
      html.movx-v62 body[data-page="social"] #nicheGrid .niche-card__content{padding:clamp(17px,1.65vw,25px)!important}
      html.movx-v62 body[data-page="social"] #nicheGrid .niche-card__title{max-width:9.4ch!important}

      /* The selected-case chapter should inherit the same planar language. */
      html.movx-v62 body[data-page="social"] #projectsList .project-cover{
        transform:translate3d(0,var(--v39-project-y,0px),0)!important;filter:none!important
      }

      @media(max-width:980px){
        html.movx-v62 body[data-page="social"] #heroTop .social-cover-art__image{transform:translate3d(0,var(--v39-hero-bg-y,0px),0) scale(1.025)!important}
        html.movx-v62 body[data-page="social"] #heroTop .v28-hero-overlay{display:none!important}
        html.movx-v62 body[data-page="social"] #livingArchive .loop-row{transform:translate3d(0,var(--v39-row-y,0px),0)!important}
        html.movx-v62 body[data-page="social"] #nicheGrid .niche-card__media{transform:none!important}
        html.movx-v62 body[data-page="social"] #nicheGrid .niche-card__media img{transform:scale(1.025)!important}
      }
      @media(prefers-reduced-motion:reduce){
        html.movx-v62 body[data-page="social"] #heroTop .social-cover-art::after{display:none!important}
        html.movx-v62 body[data-page="social"] #livingArchive .loop-row{opacity:1!important;filter:none!important;transform:none!important;transition:none!important}
        html.movx-v62 body[data-page="social"] #nicheIndex::before{transform:scaleX(1)!important}
      }
    `;
    document.head.appendChild(style);
  }

  requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.add('v62-opening-ready')));

  if(loopRows.length){
    if(reduced||!('IntersectionObserver'in window))loopRows.forEach(row=>row.classList.add('v62-row-visible'));
    else{
      const observer=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(!entry.isIntersecting)return;
          entry.target.classList.add('v62-row-visible');
          observer.unobserve(entry.target);
        });
      },{threshold:.08,rootMargin:'8% 0px -4% 0px'});
      loopRows.forEach(row=>observer.observe(row));
    }
  }

  if(!heroStage||reduced){
    root.style.setProperty('--v62-hero-exit',reduced?'0':'0');
    return;
  }

  window.MOVX_MOTION_BRIDGE?.subscribe(snapshot=>{
    const stage=snapshot.stages.find(s=>s.key==='hero');
    if(stage)root.style.setProperty('--v62-hero-exit',snapshot.reducedMotion?'0':String(clamp((stage.progress-.45)*2)));
  });
})();
