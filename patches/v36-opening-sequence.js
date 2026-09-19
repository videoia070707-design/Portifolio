/* MOVX v36 — cinematic opening runtime
   Connects the sticky header, hero, contents rail and first archive chapter.
   Additive/fail-open: no content depends on this enhancement. */
(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const hero = document.getElementById('heroTop');
  const stage = hero?.querySelector('.social-cover-art__stage');
  const heroIndex = hero?.querySelector('.hero-index');
  const archive = document.getElementById('livingArchive');
  const reduced = new URLSearchParams(location.search).has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  root.classList.add('movx-v36');
  root.dataset.movxOpening = 'v36-cinematic-handoff';

  if (!body || !hero || !stage || !heroIndex || !archive) return;

  try {
    let raf = 0;
    let lastHeroMode = null;

    const update = () => {
      raf = 0;
      const heroRect = hero.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const archiveRect = archive.getBoundingClientRect();
      const header = document.querySelector('.site-header');
      const headerHeight = header?.getBoundingClientRect().height || 72;

      const heroProgress = clamp((-stageRect.top) / Math.max(1, stageRect.height * .84));
      const handoff = clamp((innerHeight * .86 - archiveRect.top) / Math.max(1, innerHeight * .7));
      root.style.setProperty('--v36-hero-progress', heroProgress.toFixed(4));
      root.style.setProperty('--v36-handoff', handoff.toFixed(4));

      const heroMode = heroRect.bottom > headerHeight + 18;
      if (heroMode !== lastHeroMode) {
        root.classList.toggle('v36-hero-mode', heroMode);
        lastHeroMode = heroMode;
      }
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    addEventListener('scroll', schedule, { passive:true });
    addEventListener('resize', schedule, { passive:true });
    update();

    /* The first archive chapter arrives as one composition; no child text movement. */
    if ('IntersectionObserver' in window && !reduced) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          archive.classList.add('v36-archive-arrived');
          observer.disconnect();
        });
      }, { threshold:.06, rootMargin:'0px 0px -8% 0px' });
      observer.observe(archive);
    } else {
      archive.classList.add('v36-archive-arrived');
    }

    /* Keep the opening rail keyboard-friendly on narrow screens. */
    heroIndex.addEventListener('focusin', event => {
      const link = event.target.closest?.('.hero-index__item');
      if (!link || innerWidth > 900) return;
      link.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block:'nearest', inline:'center' });
    });

  } catch (error) {
    console.warn('MOVX v36 opening enhancement failed open:', error);
  }
})();
