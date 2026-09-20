/* MOVX v48 — spatial polish runtime
   Adds only decorative chapter seams and refresh safeguards. It does not compete
   with v45's existing About/Services/Process/Contact transform owners. */
(() => {
  'use strict';
  const root = document.documentElement;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = matchMedia('(min-width:981px)').matches;
  const q = (s,c=document) => c.querySelector(s);
  const chapters = ['.about-section','.services-section','.process-section','.contact-section']
    .map(selector => q(selector)).filter(Boolean);

  root.classList.add('movx-v48');
  root.dataset.movxSpatialPolish = 'v48';

  if (!gsap || !ScrollTrigger) {
    root.classList.add('v48-motion-fallback');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  if (!reduced && desktop) {
    chapters.forEach((section,index) => {
      const seam = document.createElement('div');
      seam.className = 'v48-depth-seam';
      seam.setAttribute('aria-hidden','true');
      section.insertBefore(seam,section.firstChild);

      const dir = index % 2 ? -1 : 1;
      gsap.fromTo(seam,
        { '--v48-seam-y': `${dir*70}px`, '--v48-seam-z': '-180px', '--v48-seam-s': .42, '--v48-seam-o': .06 },
        { '--v48-seam-y': `${dir*-34}px`, '--v48-seam-z': '120px', '--v48-seam-s': 1, '--v48-seam-o': .42, ease:'none',
          scrollTrigger:{trigger:section,start:'top 92%',end:'top 18%',scrub:1.05,invalidateOnRefresh:true} }
      );
    });
  }

  /* Recalculate camera/scroll geometry after fonts and late-loading layout changes.
     This addresses cases where old content-visibility optimizations left stale measurements. */
  let refreshRaf = 0;
  const scheduleRefresh = () => {
    if (refreshRaf) return;
    refreshRaf = requestAnimationFrame(() => {
      refreshRaf = 0;
      ScrollTrigger.refresh();
    });
  };

  if (document.fonts?.ready) document.fonts.ready.then(scheduleRefresh).catch(()=>{});
  addEventListener('load', scheduleRefresh, {once:true});
  addEventListener('resize', scheduleRefresh, {passive:true});

  const images = [...document.querySelectorAll('.about-section img,.services-section img,.process-section img,.contact-section img')];
  images.forEach(img => {
    if (img.complete) return;
    img.addEventListener('load', scheduleRefresh, {once:true,passive:true});
  });

  root.classList.add('v48-runtime-ready');
})();

/* MOVX v59 — inertial media motion
   Text remains planar. Only visual media receives a small damped displacement,
   giving the page a slower premium cadence without introducing another scroll engine. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = matchMedia('(min-width:981px)').matches;
  root.classList.add('movx-v59');
  root.dataset.movxExperience = 'v59-inertial-media';

  const selectors = [
    '#heroTop .hero-media','#heroTop .hero-art','#heroTop .hero-visual','#heroTop .hero-image','#heroTop .hero-collage',
    '#livingArchive .media-reveal','#nicheIndex .niche-card__media img','#archiveGrid .media-reveal',
    '.projects-list .media-reveal','.projects-list .project-cover img'
  ].join(',');
  const state = new Map();
  let raf = 0;

  const clamp = (v,a,b) => Math.min(b,Math.max(a,v));
  const media = () => [...document.querySelectorAll(selectors)].filter(el => !el.closest('#caseViewer,#process'));

  function clearMotion(){
    media().forEach(el => {
      el.style.removeProperty('translate');
      el.style.removeProperty('will-change');
    });
    state.clear();
  }

  function targetFor(el){
    const r = el.getBoundingClientRect();
    const center = r.top + r.height * .5;
    const normalized = clamp((center - innerHeight * .5) / Math.max(innerHeight,.001),-.9,.9);
    const hero = !!el.closest('#heroTop');
    const max = hero ? 22 : 14;
    return -normalized * max;
  }

  function tick(){
    raf = 0;
    if (!desktop || reduced || document.hidden) return;
    let moving = false;
    const items = media();
    const alive = new Set(items);

    items.forEach((el,index) => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -innerHeight*.18 || rect.top > innerHeight*1.18) return;
      let s = state.get(el);
      if (!s) {
        s = {y:targetFor(el),target:targetFor(el)};
        state.set(el,s);
        el.style.willChange = 'translate';
      }
      s.target = targetFor(el) + (((index % 3) - 1) * .7);
      s.y += (s.target - s.y) * .065;
      if (Math.abs(s.target - s.y) > .025) moving = true;
      el.style.translate = `0 ${s.y.toFixed(2)}px`;
    });

    for (const el of state.keys()) {
      if (!alive.has(el)) state.delete(el);
    }
    if (moving) schedule();
  }

  function schedule(){
    if (!raf) raf = requestAnimationFrame(tick);
  }

  if (!desktop || reduced) {
    clearMotion();
    return;
  }

  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  document.addEventListener('visibilitychange',() => { if (!document.hidden) schedule(); });

  const dynamicHosts = ['#loopWall','#archiveGrid','#projectsList'].map(s => document.querySelector(s)).filter(Boolean);
  if ('MutationObserver' in window && dynamicHosts.length) {
    const observer = new MutationObserver(schedule);
    dynamicHosts.forEach(host => observer.observe(host,{childList:true,subtree:true}));
  }

  Promise.resolve(document.fonts?.ready).catch(()=>{}).finally(schedule);
  setTimeout(schedule,420);
})();
