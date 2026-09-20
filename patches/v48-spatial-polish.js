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
